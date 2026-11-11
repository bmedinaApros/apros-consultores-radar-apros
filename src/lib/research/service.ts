import { audit } from "../audit";
import { pool } from "../db";
import { env } from "../env";
import { findActiveClient } from "../companies/exclusions";
import { getCompany, CompanyError } from "../companies/service";
import { proposeWebsite } from "../companies/discover-web";
import { defaultWebDeps, validateWebsite, type WebDeps } from "../companies/web";
import { appearsOnSite, pageEvidence, sanitizeContacts, type Contact } from "./contacts";
import { estimateCostUsd, type ResearchProvider } from "./provider";

export const RESEARCH_RETRY_DAYS = 90;
export const RESEARCH_ERROR_RETRY_DAYS = 3;

export interface ResearchSummary {
  status: "ok" | "error" | "skipped";
  skipped?: string;
  error?: string;
  website: { status: "assigned" | "pending" | "rejected" | "none" | "already"; domain: string | null; message: string };
  contacts: { found: number; verified: number };
  costUsd: number;
}

const none = (status: ResearchSummary["status"], extra: Partial<ResearchSummary> = {}): ResearchSummary => ({
  status, website: { status: "none", domain: null, message: "" }, contacts: { found: 0, verified: 0 }, costUsd: 0, ...extra,
});

/** Contrasta los contactos con el sitio propio de la empresa (portada y una página de contacto). Respeta su robots.txt. */
export async function verifyContactsOnSite(companyId: string, domain: string, contacts: Contact[], deps: WebDeps): Promise<number> {
  if (contacts.length === 0) return 0;
  const check = await validateWebsite(domain, deps);
  if (check.status === "failed" || check.robots === "bloquea") return 0;
  const pages: { text: string; hrefs: string[] }[] = [];
  const home = await deps.fetcher(`https://${domain}/`, { timeoutMs: deps.timeoutMs ?? 8000 });
  if (home.outcome !== "ok") return 0;
  const hp = pageEvidence(home.body);
  pages.push(hp);
  const contactHref = hp.hrefs.find((h) => /contact|contáct|nosotros|ubic/i.test(h) && !/^(mailto|tel|javascript):/i.test(h));
  if (contactHref) {
    try {
      const u = new URL(contactHref, `https://${domain}/`);
      if (u.hostname.replace(/^www\./, "") === domain) {
        const r = await deps.fetcher(u.toString(), { timeoutMs: deps.timeoutMs ?? 8000 });
        if (r.outcome === "ok") pages.push(pageEvidence(r.body));
      }
    } catch { /* enlace no interpretable: se ignora */ }
  }
  let verified = 0;
  for (const c of contacts) {
    if (!appearsOnSite(c, domain, pages)) continue;
    await pool().query(`UPDATE company_contacts SET status = 'verificado_en_sitio', verified_at = now() WHERE company_id = $1 AND kind = $2 AND value = $3 AND status = 'sin_verificar'`, [companyId, c.kind, c.value]);
    verified++;
  }
  return verified;
}

/**
 * Investiga una empresa con el proveedor de búsqueda web: encuentra su sitio (que Radar valida y asigna solo si aparece su RUC,
 * o deja por confirmar) y sus contactos públicos (que se filtran, se guardan con su fuente y se contrastan con su sitio).
 * Nada se contacta ni se publica: solo se guarda información. Cada consulta deja su costo estimado.
 */
export async function researchCompany(companyId: string, provider: ResearchProvider, webDeps: WebDeps = defaultWebDeps()): Promise<ResearchSummary> {
  const c = await getCompany(companyId);
  if (!c) throw new CompanyError("Empresa no encontrada");
  if (c.blocked) return none("skipped", { skipped: "está en no contactar" });
  if (await findActiveClient({ name: c.legal_name, domain: c.domain, ruc: c.ruc })) return none("skipped", { skipped: "es cliente activo" });

  const record = (status: "ok" | "error", f: { website?: string | null; contacts?: number; searches?: number; inTok?: number; outTok?: number; cost?: number; error?: string | null }) =>
    pool().query(
      `INSERT INTO company_research (company_id, provider, model, status, website, contacts_found, searches, input_tokens, output_tokens, cost_usd, error) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [companyId, provider.id, provider.model, status, f.website ?? null, f.contacts ?? 0, f.searches ?? 0, f.inTok ?? 0, f.outTok ?? 0, f.cost ?? 0, f.error ?? null]);

  let res;
  try {
    res = await provider.research({ name: c.legal_name, ruc: c.ruc, city: c.city, knownDomain: c.domain });
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 300) : "error";
    await record("error", { error: msg });
    return none("error", { error: msg });
  }
  const cost = estimateCostUsd(res.model, res.usage);

  // 1) Sitio web: solo si la empresa no tenía; se valida como cualquier otra propuesta.
  let website: ResearchSummary["website"] = { status: "none", domain: null, message: "Grok no encontró un sitio." };
  if (c.domain) website = { status: "already", domain: c.domain, message: "La empresa ya tenía sitio web." };
  else if (res.website) {
    const p = await proposeWebsite(companyId, res.website, "grok", webDeps);
    website = { status: p.status, domain: p.domain, message: p.message };
  }

  // 2) Contactos: filtrados, con fuente; los repetidos no se duplican.
  const contacts = sanitizeContacts(res.contacts);
  let inserted = 0;
  for (const k of contacts) {
    const r = await pool().query(`INSERT INTO company_contacts (company_id, kind, value, source_url) VALUES ($1,$2,$3,$4) ON CONFLICT (company_id, kind, value) DO NOTHING`, [companyId, k.kind, k.value, k.source_url]);
    inserted += r.rowCount ?? 0;
  }

  // 3) Verificación contra el sitio propio (si ya lo tiene o se acaba de asignar)
  const domain = (await getCompany(companyId))?.domain ?? null;
  let verified = 0;
  if (domain) { try { verified = await verifyContactsOnSite(companyId, domain, contacts, webDeps); } catch { /* la verificación es un extra; no falla la investigación */ } }

  await record("ok", { website: res.website, contacts: contacts.length, searches: res.usage.searches, inTok: res.usage.inputTokens, outTok: res.usage.outputTokens, cost });
  await audit({ actorId: null, action: "company.researched", entityType: "company", entityId: companyId, metadata: { provider: provider.id, website: website.status, contacts: contacts.length, inserted, verified, costUsd: Number(cost.toFixed(4)) } });
  return { status: "ok", website, contacts: { found: contacts.length, verified }, costUsd: cost };
}

/** Empresas por investigar: las que no tienen sitio primero; sin investigación reciente (90 días, o 3 días si la última falló). */
export async function companiesNeedingResearch(limit: number): Promise<{ id: string; legal_name: string }[]> {
  return (await pool().query<{ id: string; legal_name: string }>(
    `SELECT c.id, c.legal_name FROM companies c
      WHERE c.stage IN ('detected', 'analyzed', 'prioritized')
        AND NOT EXISTS (SELECT 1 FROM company_research r WHERE r.company_id = c.id AND r.status = 'ok' AND r.created_at > now() - ($2::int * interval '1 day'))
        AND NOT EXISTS (SELECT 1 FROM company_research r WHERE r.company_id = c.id AND r.status = 'error' AND r.created_at > now() - ($3::int * interval '1 day'))
      ORDER BY (c.domain IS NULL) DESC, c.created_at LIMIT $1`, [limit, RESEARCH_RETRY_DAYS, RESEARCH_ERROR_RETRY_DAYS])).rows;
}

/** Investiga un lote respetando el tope de empresas y el de gasto estimado de la corrida. */
export async function researchBatch(provider: ResearchProvider, opts: { limit?: number; maxUsd?: number; webDeps?: WebDeps } = {}): Promise<{ tried: number; websites: number; contacts: number; costUsd: number; stoppedForBudget: boolean; errors: number }> {
  const limit = opts.limit ?? env().RESEARCH_PER_RUN;
  const maxUsd = opts.maxUsd ?? env().RESEARCH_MAX_USD_PER_RUN;
  const out = { tried: 0, websites: 0, contacts: 0, costUsd: 0, stoppedForBudget: false, errors: 0 };
  for (const c of await companiesNeedingResearch(limit)) {
    if (out.costUsd >= maxUsd) { out.stoppedForBudget = true; break; }
    out.tried++;
    try {
      const r = await researchCompany(c.id, provider, opts.webDeps);
      out.costUsd += r.costUsd;
      if (r.website.status === "assigned" || r.website.status === "pending") out.websites++;
      out.contacts += r.contacts.found;
      if (r.status === "error") out.errors++;
    } catch { out.errors++; }
  }
  return out;
}

export interface ContactRow { id: string; kind: string; value: string; source_url: string; status: "sin_verificar" | "verificado_en_sitio" | "descartado"; created_at: Date }

export async function listContacts(companyId: string): Promise<ContactRow[]> {
  return (await pool().query<ContactRow>(
    `SELECT id, kind, value, source_url, status, created_at FROM company_contacts WHERE company_id = $1 AND status <> 'descartado'
      ORDER BY CASE status WHEN 'verificado_en_sitio' THEN 0 ELSE 1 END, kind, created_at`, [companyId])).rows;
}

/** Contactos de varias empresas a la vez (para la lista semanal), sin N+1. */
export async function contactsByCompany(companyIds: string[]): Promise<Map<string, ContactRow[]>> {
  const m = new Map<string, ContactRow[]>();
  if (companyIds.length === 0) return m;
  const r = await pool().query<ContactRow & { company_id: string }>(
    `SELECT company_id, id, kind, value, source_url, status, created_at FROM company_contacts WHERE company_id = ANY($1::uuid[]) AND status <> 'descartado'
      ORDER BY company_id, CASE status WHEN 'verificado_en_sitio' THEN 0 ELSE 1 END, kind`, [companyIds]);
  for (const row of r.rows) m.set(row.company_id, [...(m.get(row.company_id) ?? []), row]);
  return m;
}
