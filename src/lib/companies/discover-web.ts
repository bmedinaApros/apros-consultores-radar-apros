import * as cheerio from "cheerio";
import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import { canModifyOwned, requirePermission, ForbiddenError } from "../rbac";
import { CompanyError, getCompany, type ActorInfo } from "./service";
import { findDoNotContact } from "./exclusions";
import { normalizeDomain, normalizeName } from "./normalize";
import { defaultWebDeps, setCompanyWebsite, validateWebsite, type WebDeps } from "./web";

/** Palabras que no distinguen a una empresa: no se usan solas para armar un dominio ni cuentan como coincidencia. */
const STOP = new Set(["de", "del", "la", "las", "los", "el", "y", "e", "en", "sa", "sac", "srl", "eirl", "sociedad", "anonima", "cerrada", "liquidacion", "peru", "del"]);
const GENERIC = new Set(["compania", "empresa", "grupo", "corporacion", "inversiones", "servicios", "constructora", "inmobiliaria", "transportes", "comercial", "industrias", "distribuidora", "importaciones", "consultores", "representaciones", "multiservicios", "agroindustrial", "nacional", "internacional", "general", "generales"]);
const PARKED = /(domain (is )?for sale|se vende (este )?dominio|dominio en venta|buy this domain|hugedomains|sedo\.com|parked (domain|free)|this domain may be for sale)/i;

export const nameTokens = (name: string): string[] => normalizeName(name).split(" ").filter((t) => t.length >= 2 && !STOP.has(t)).slice(0, 5);

/** Direcciones probables a partir de la razón social. Pocas y ordenadas: la comprobación real es lo que decide. */
export function domainCandidates(name: string): string[] {
  const t = nameTokens(name);
  if (t.length === 0 || (t.length === 1 && GENERIC.has(t[0]!))) return []; // una sola palabra genérica no identifica a nadie
  const slugs: string[] = [];
  if (t.join("").length <= 30) slugs.push(t.join(""));
  if (t.length >= 2) slugs.push(t.slice(0, 2).join(""));
  if (t.length >= 2) slugs.push(t.slice(0, 2).join("-"));
  if (t[0]!.length >= 5 && !GENERIC.has(t[0]!)) slugs.push(t[0]!);
  const out: string[] = [];
  for (const s of new Set(slugs)) {
    if (s.length < 4) continue;
    for (const tld of ["com.pe", "pe", "com"]) {
      const d = normalizeDomain(`${s}.${tld}`);
      if (d.ok && !out.includes(d.domain)) out.push(d.domain);
    }
  }
  return out.slice(0, 9);
}

export type Confidence = "alta" | "media" | "baja";
export interface MatchEvidence { confidence: Confidence | null; ruc: boolean; headHits: string[]; bodyHits: string[]; tokens: string[]; title: string | null }

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * ¿Esta página es de esta empresa? «alta»: aparece su RUC. «media»: su nombre aparece en el título o encabezados.
 * «baja»: solo en el cuerpo (no se propone). Una página «en venta» o aparcada nunca cuenta.
 */
export function matchEvidence(html: string, name: string, ruc: string | null): MatchEvidence {
  const $ = cheerio.load(html);
  const title = $("title").first().text().replace(/\s+/g, " ").trim().slice(0, 200) || null;
  const head = fold([title ?? "", $("h1").text(), $('meta[property="og:site_name"]').attr("content") ?? "", $('meta[property="og:title"]').attr("content") ?? ""].join(" "));
  $("script, style, noscript, template, svg").remove();
  const body = fold($("body").text().replace(/\s+/g, " ").slice(0, 80_000));
  const tokens = nameTokens(name);
  const headHits = tokens.filter((t) => head.includes(t));
  const bodyHits = tokens.filter((t) => body.includes(t));
  const hasRuc = Boolean(ruc) && (body.includes(ruc!) || head.includes(ruc!));
  if (PARKED.test(`${head} ${body.slice(0, 4000)}`)) return { confidence: null, ruc: hasRuc, headHits, bodyHits, tokens, title };
  let confidence: Confidence | null = null;
  if (hasRuc) confidence = "alta";
  else if (tokens.length > 0 && headHits.length >= Math.max(1, Math.ceil(tokens.length * 0.6)) && (tokens.length > 1 || !GENERIC.has(tokens[0]!))) confidence = "media";
  else if (bodyHits.length >= Math.min(2, tokens.length) && bodyHits.length > 0) confidence = "baja";
  return { confidence, ruc: hasRuc, headHits, bodyHits, tokens, title };
}

export const WEBSITE_BUDGET = 40;
export const RETRY_DAYS = 30;

export interface DiscoverResult { tried: number; found: number; assigned: string | null; pending: string[]; skipped?: string }

/** Pone el sitio sin intervención humana (solo cuando aparece el RUC de la empresa en la página). Deja constancia en la auditoría. */
async function assignAutomatically(companyId: string, candidateId: string, domain: string, check: { status: string; httpStatus: number | null; finalUrl: string | null; robots: string; messages: string[]; redirectsTo: string | null }): Promise<boolean> {
  return withTransaction(async (c) => {
    const cur = await c.query<{ domain: string | null; legal_name: string; ruc: string | null }>(`SELECT domain, legal_name, ruc FROM companies WHERE id = $1 FOR UPDATE`, [companyId]);
    const row = cur.rows[0];
    if (!row || row.domain) return false;
    if (await findDoNotContact({ name: row.legal_name, domain, ruc: row.ruc }, c)) return false;
    try {
      await c.query(`UPDATE companies SET domain = $2, updated_at = now() WHERE id = $1`, [companyId, domain]);
    } catch (e) {
      if ((e as { code?: string }).code === "23505") return false; // otra empresa ya tiene ese dominio
      throw e;
    }
    await c.query(`INSERT INTO company_web_validations (company_id, domain, status, http_status, final_url, robots, detail, checked_by) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,NULL)`,
      [companyId, domain, check.status, check.httpStatus, check.finalUrl, check.robots, JSON.stringify({ messages: check.messages, redirectsTo: check.redirectsTo })]);
    await c.query(`UPDATE company_website_candidates SET status = 'accepted', decided_at = now() WHERE id = $1`, [candidateId]);
    await audit({ actorId: null, action: "company.website_auto_assigned", entityType: "company", entityId: companyId, metadata: { domain, reason: "RUC de la empresa encontrado en la portada" } }, c);
    return true;
  });
}

async function evaluate(domain: string, name: string, ruc: string | null, deps: WebDeps) {
  const check = await validateWebsite(domain, deps);
  if (check.status === "failed" || !check.domain || check.robots === "bloquea") return null;
  const home = await deps.fetcher(`https://${check.domain}/`, { timeoutMs: deps.timeoutMs ?? 8000 });
  if (home.outcome !== "ok") return null;
  // Si la portada redirige a otro dominio, se evalúa el contenido pero se propone el dominio original (ya validado).
  return { check, match: matchEvidence(home.body, name, ruc) };
}

async function saveCandidate(companyId: string, domain: string, source: "auto" | "ia", m: MatchEvidence): Promise<string | null> {
  if (!m.confidence) return null;
  const r = await pool().query<{ id: string }>(
    `INSERT INTO company_website_candidates (company_id, domain, confidence, source, evidence) VALUES ($1,$2,$3,$4,$5::jsonb)
     ON CONFLICT (company_id, domain) DO UPDATE SET confidence = EXCLUDED.confidence, evidence = EXCLUDED.evidence
       WHERE company_website_candidates.status = 'pending' RETURNING id`,
    [companyId, domain, m.confidence, source, JSON.stringify({ ruc: m.ruc, headHits: m.headHits, bodyHits: m.bodyHits, tokens: m.tokens, title: m.title })]);
  return r.rows[0]?.id ?? null;
}

/** Busca el sitio de una empresa sin web: prueba direcciones probables y se queda con las que de verdad parecen ser de ella. */
export async function discoverWebsite(companyId: string, deps: WebDeps = defaultWebDeps()): Promise<DiscoverResult> {
  const c = await getCompany(companyId);
  if (!c) throw new CompanyError("Empresa no encontrada");
  if (c.domain) return { tried: 0, found: 0, assigned: null, pending: [], skipped: "ya tiene sitio web" };
  if (c.blocked) return { tried: 0, found: 0, assigned: null, pending: [], skipped: "está en no contactar" };
  const cands = domainCandidates(c.legal_name);
  const res: DiscoverResult = { tried: 0, found: 0, assigned: null, pending: [] };
  const found: { domain: string; id: string; match: MatchEvidence; check: NonNullable<Awaited<ReturnType<typeof evaluate>>>["check"] }[] = [];
  for (const d of cands) {
    res.tried++;
    let e: Awaited<ReturnType<typeof evaluate>> = null;
    try { e = await evaluate(d, c.legal_name, c.ruc, deps); } catch { e = null; }
    if (!e || !e.match.confidence || e.match.confidence === "baja") continue;
    const id = await saveCandidate(companyId, d, "auto", e.match);
    if (id) found.push({ domain: d, id, match: e.match, check: e.check });
    if (e.match.confidence === "alta") break; // ya es seguro: no hace falta seguir probando
  }
  res.found = found.length;
  const best = found.find((f) => f.match.confidence === "alta");
  if (best && (await assignAutomatically(companyId, best.id, best.domain, best.check))) res.assigned = best.domain;
  res.pending = found.filter((f) => f.domain !== res.assigned).map((f) => f.domain);
  await pool().query(
    `INSERT INTO company_website_attempts (company_id, tried, found) VALUES ($1,$2,$3)
     ON CONFLICT (company_id) DO UPDATE SET attempted_at = now(), tried = EXCLUDED.tried, found = EXCLUDED.found`, [companyId, res.tried, res.found]);
  return res;
}

/** Empresas sin sitio que no se han intentado en los últimos RETRY_DAYS (las nunca intentadas primero). */
export async function companiesNeedingWebsite(limit: number): Promise<{ id: string; legal_name: string }[]> {
  return (await pool().query<{ id: string; legal_name: string }>(
    `SELECT c.id, c.legal_name FROM companies c LEFT JOIN company_website_attempts a ON a.company_id = c.id
      WHERE c.domain IS NULL AND c.stage IN ('detected', 'analyzed', 'prioritized')
        AND (a.company_id IS NULL OR a.attempted_at < now() - ($2::int * interval '1 day'))
      ORDER BY a.attempted_at NULLS FIRST, c.created_at LIMIT $1`, [limit, RETRY_DAYS])).rows;
}

/** Propuesta externa (p. ej. de «Comité IA»): se valida igual que una escrita a mano y nunca se acepta solo sin evidencia. */
export async function proposeWebsite(companyId: string, url: string, source: "auto" | "ia", deps: WebDeps = defaultWebDeps()): Promise<{ status: "assigned" | "pending" | "rejected"; domain: string | null; message: string }> {
  const c = await getCompany(companyId);
  if (!c) throw new CompanyError("Empresa no encontrada");
  if (c.domain) return { status: "rejected", domain: c.domain, message: "La empresa ya tiene sitio web." };
  if (c.blocked) return { status: "rejected", domain: null, message: "La empresa está en no contactar." };
  const nd = normalizeDomain(url);
  if (!nd.ok) return { status: "rejected", domain: null, message: `Dirección no válida: ${nd.error}.` };
  const e = await evaluate(nd.domain, c.legal_name, c.ruc, deps);
  if (!e) return { status: "rejected", domain: nd.domain, message: "El sitio no responde, no se puede leer o no permite la lectura automática." };
  if (!e.match.confidence) return { status: "rejected", domain: nd.domain, message: "No se encontró el nombre ni el RUC de la empresa en la portada." };
  const id = await saveCandidate(companyId, nd.domain, source, e.match);
  if (!id) return { status: "rejected", domain: nd.domain, message: "Ese sitio ya fue evaluado antes." };
  if (e.match.confidence === "alta" && (await assignAutomatically(companyId, id, nd.domain, e.check))) return { status: "assigned", domain: nd.domain, message: "El RUC de la empresa aparece en el sitio: asignado." };
  return { status: "pending", domain: nd.domain, message: `Queda pendiente de confirmación (coincidencia ${e.match.confidence}).` };
}

export interface WebsiteCandidate { id: string; domain: string; confidence: Confidence; source: "auto" | "ia"; evidence: { ruc?: boolean; headHits?: string[]; title?: string | null }; created_at: Date }

export async function listPendingCandidates(companyId: string): Promise<WebsiteCandidate[]> {
  return (await pool().query<WebsiteCandidate>(
    `SELECT id, domain, confidence, source, evidence, created_at FROM company_website_candidates WHERE company_id = $1 AND status = 'pending'
      ORDER BY CASE confidence WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END, created_at`, [companyId])).rows;
}

async function loadCandidate(actor: ActorInfo, id: string) {
  requirePermission(actor, "companies.write");
  const r = await pool().query<{ id: string; company_id: string; domain: string; status: string }>(`SELECT id, company_id, domain, status FROM company_website_candidates WHERE id = $1`, [id]);
  const cand = r.rows[0];
  if (!cand) throw new CompanyError("Sugerencia no encontrada");
  if (cand.status !== "pending") throw new CompanyError("Esta sugerencia ya fue resuelta");
  const co = await getCompany(cand.company_id);
  if (!co) throw new CompanyError("Empresa no encontrada");
  if (!canModifyOwned(actor, { ownerId: co.owner_id }, "companies.write")) throw new ForbiddenError("Solo puedes modificar empresas tuyas o sin responsable");
  return cand;
}

/** Una persona confirma el sitio sugerido: se vuelve a validar y se guarda con los mismos controles que al escribirlo a mano. */
export async function acceptCandidate(actor: ActorInfo, id: string, deps?: WebDeps): Promise<void> {
  const cand = await loadCandidate(actor, id);
  await setCompanyWebsite(actor, cand.company_id, cand.domain, deps);
  await pool().query(`UPDATE company_website_candidates SET status = 'accepted', decided_by = $2, decided_at = now() WHERE id = $1`, [id, actor.id]);
  await pool().query(`UPDATE company_website_candidates SET status = 'rejected', decided_at = now() WHERE company_id = $1 AND status = 'pending'`, [cand.company_id]);
}

export async function rejectCandidate(actor: ActorInfo, id: string): Promise<void> {
  const cand = await loadCandidate(actor, id);
  await pool().query(`UPDATE company_website_candidates SET status = 'rejected', decided_by = $2, decided_at = now() WHERE id = $1`, [id, actor.id]);
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "company.website_candidate_rejected", entityType: "company", entityId: cand.company_id, metadata: { domain: cand.domain } });
}

export interface PendingRow extends WebsiteCandidate { company_id: string; legal_name: string; ruc: string | null; city: string | null }

/** Todas las sugerencias pendientes (las de mayor confianza primero), para una sola pantalla de revisión. */
export async function listAllPendingCandidates(limit = 100, offset = 0): Promise<{ rows: PendingRow[]; total: number }> {
  const l = Math.min(Math.max(Math.trunc(limit) || 100, 1), 200);
  const o = Math.max(Math.trunc(offset) || 0, 0);
  const rows = (await pool().query<PendingRow>(
    `SELECT k.id, k.domain, k.confidence, k.source, k.evidence, k.created_at, k.company_id, c.legal_name, c.ruc, c.city
       FROM company_website_candidates k JOIN companies c ON c.id = k.company_id
      WHERE k.status = 'pending' AND c.domain IS NULL
      ORDER BY CASE k.confidence WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END, k.created_at DESC, k.id LIMIT $1 OFFSET $2`, [l, o])).rows;
  const total = Number((await pool().query<{ n: string }>(`SELECT count(*) AS n FROM company_website_candidates k JOIN companies c ON c.id = k.company_id WHERE k.status = 'pending' AND c.domain IS NULL`)).rows[0]!.n);
  return { rows, total };
}

export interface WebsiteStats { intentadas: number; asignadas: number; por_confirmar: number; sin_sitio: number; con_sitio: number; ultimo_intento: Date | null }

/** Resumen de la búsqueda automática: cuántas empresas se intentaron, cuántas quedaron con sitio y cuántas esperan confirmación. */
export async function websiteStats(): Promise<WebsiteStats> {
  const r = await pool().query<{ intentadas: string; asignadas: string; por_confirmar: string; sin_sitio: string; con_sitio: string; ultimo: Date | null }>(
    `SELECT (SELECT count(*) FROM company_website_attempts) AS intentadas,
            (SELECT count(*) FROM company_website_candidates WHERE status = 'accepted') AS asignadas,
            (SELECT count(*) FROM company_website_candidates k JOIN companies c ON c.id = k.company_id WHERE k.status = 'pending' AND c.domain IS NULL) AS por_confirmar,
            (SELECT count(*) FROM companies WHERE domain IS NULL) AS sin_sitio,
            (SELECT count(*) FROM companies WHERE domain IS NOT NULL) AS con_sitio,
            (SELECT max(attempted_at) FROM company_website_attempts) AS ultimo`);
  const x = r.rows[0]!;
  return { intentadas: Number(x.intentadas), asignadas: Number(x.asignadas), por_confirmar: Number(x.por_confirmar), sin_sitio: Number(x.sin_sitio), con_sitio: Number(x.con_sitio), ultimo_intento: x.ultimo };
}
