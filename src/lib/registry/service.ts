import { z } from "zod";
import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import { CompanyError, updateCompany, type ActorInfo } from "../companies/service";
import { CompanyIndex } from "../companies/dedupe";
import { findActiveClient, findDoNotContact } from "../companies/exclusions";
import { evaluate, insertCompany, loadLookups, prepareCompany } from "../companies/ingest";
import { requirePermission } from "../rbac";
import { normalizeKeyword } from "./rubro";

export const REGISTRY_PAGE = 50;
export const PROMOTE_MAX = 200;
export const COUNT_CAP = 10_000;

export const filtersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.string().trim().toUpperCase().max(40).optional(),
  condition: z.string().trim().toUpperCase().max(40).optional(),
  person: z.enum(["juridica", "natural", "all"]).default("juridica"),
  ubigeo: z.string().regex(/^\d{2}(\d{2}(\d{2})?)?$/).optional(),
  industry: z.union([z.literal("none"), z.string().uuid()]).optional(),
  notPromoted: z.boolean().default(false),
  includeMissing: z.boolean().default(false),
  after: z.string().regex(/^\d{11}$/).optional(),
});
export type RegistryFilters = z.infer<typeof filtersSchema>;

export interface RegistryRow {
  ruc: string; legal_name: string; status: string | null; condition: string | null; ubigeo: string | null; department: string | null; address: string | null;
  suggested_industry_id: string | null; suggested_industry_name: string | null; company_id: string | null; missing_since: Date | null;
  source_note: string | null; loaded_at: Date | null; dnc: boolean; client: boolean;
}

function where(f: RegistryFilters): { sql: string; params: unknown[] } {
  const w: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
  if (f.q) {
    const digits = f.q.replace(/\s+/g, "");
    if (/^\d+$/.test(digits)) w.push(`r.ruc LIKE ${p(`${digits}%`)}`);
    else {
      const tokens = normalizeKeyword(f.q).split(" ").filter((x) => x.length >= 2);
      if (tokens.length === 0) w.push("FALSE"); // solo símbolos o letras sueltas: no hay nada que buscar
      for (const t of tokens) w.push(`r.normalized_name LIKE ${p(`%${t}%`)}`);
    }
  }
  if (f.status) w.push(`r.status = ${p(f.status)}`);
  if (f.condition) w.push(`r.condition = ${p(f.condition)}`);
  if (f.person === "juridica") w.push(`r.is_legal_entity`);
  else if (f.person === "natural") w.push(`NOT r.is_legal_entity`);
  if (f.ubigeo) w.push(`r.ubigeo LIKE ${p(`${f.ubigeo}%`)}`);
  if (f.industry === "none") w.push(`r.suggested_industry_id IS NULL`);
  else if (f.industry) w.push(`r.suggested_industry_id = ${p(f.industry)}::uuid`);
  if (f.notPromoted) w.push(`NOT EXISTS (SELECT 1 FROM companies c WHERE c.ruc = r.ruc)`);
  if (!f.includeMissing) w.push(`r.missing_since IS NULL`);
  return { sql: w.length ? `WHERE ${w.join(" AND ")}` : "", params };
}

export interface SearchResult { rows: RegistryRow[]; nextAfter: string | null; total: number; totalCapped: boolean }

/** Búsqueda paginada por cursor (RUC). Nunca carga el padrón completo: 50 filas por página y un conteo con tope. */
export async function searchRegistry(input: unknown, opts: { pageSize?: number; skipTotal?: boolean } = {}): Promise<SearchResult> {
  const size = Math.min(Math.max(opts.pageSize ?? REGISTRY_PAGE, 1), 1000);
  const f = filtersSchema.parse(input);
  const { sql, params } = where(f);
  const cursor = f.after ? `${sql ? `${sql} AND` : "WHERE"} r.ruc > $${params.length + 1}` : sql;
  const cursorParams = f.after ? [...params, f.after] : params;
  const rows = (await pool().query<RegistryRow & { ruc: string }>(
    `SELECT r.ruc, r.legal_name, r.status, r.condition, r.ubigeo, u.department, r.address, r.suggested_industry_id, i.name AS suggested_industry_name,
            (SELECT c.id FROM companies c WHERE c.ruc = r.ruc) AS company_id, r.missing_since, b.source_note, b.finished_at AS loaded_at
       FROM registry_companies r
       LEFT JOIN ubigeo u ON u.code = left(r.ubigeo, 2) LEFT JOIN industries i ON i.id = r.suggested_industry_id LEFT JOIN registry_batches b ON b.id = r.last_batch_id
       ${cursor} ORDER BY r.ruc LIMIT ${size + 1}`, cursorParams)).rows;
  const more = rows.length > size;
  const page = rows.slice(0, size);
  const total = opts.skipTotal ? 0 : Number((await pool().query<{ n: string }>(`SELECT count(*) AS n FROM (SELECT 1 FROM registry_companies r ${sql} LIMIT ${COUNT_CAP + 1}) s`, params)).rows[0]!.n);
  const out: RegistryRow[] = [];
  for (const r of page) {
    const id = { name: r.legal_name, domain: null, ruc: r.ruc };
    out.push({ ...r, dnc: Boolean(await findDoNotContact(id)), client: Boolean(await findActiveClient(id)) });
  }
  return { rows: out, nextAfter: more ? page[page.length - 1]!.ruc : null, total: Math.min(total, COUNT_CAP), totalCapped: total > COUNT_CAP };
}

export interface RegistryDetail { row: RegistryRow; locations: { ubigeo: string | null; department: string | null; address: string }[]; locationCount: number; batch: { source_note: string | null; file_name: string; finished_at: Date | null; connector_version: string } | null }

export async function getRegistryCompany(ruc: string): Promise<RegistryDetail | null> {
  if (!/^\d{11}$/.test(ruc)) return null;
  const r = await searchRegistry({ q: ruc, person: "all", includeMissing: true });
  const row = r.rows.find((x) => x.ruc === ruc);
  if (!row) return null;
  const [locs, cnt, batch] = await Promise.all([
    pool().query<{ ubigeo: string | null; department: string | null; address: string }>(
      `SELECT l.ubigeo, u.department, l.address FROM registry_locations l LEFT JOIN ubigeo u ON u.code = left(l.ubigeo, 2) WHERE l.ruc = $1 ORDER BY l.id LIMIT 100`, [ruc]),
    pool().query<{ n: string }>(`SELECT count(*) AS n FROM registry_locations WHERE ruc = $1`, [ruc]),
    pool().query<{ source_note: string | null; file_name: string; finished_at: Date | null; connector_version: string }>(
      `SELECT b.source_note, b.file_name, b.finished_at, b.connector_version FROM registry_companies r JOIN registry_batches b ON b.id = r.last_batch_id WHERE r.ruc = $1`, [ruc]),
  ]);
  return { row, locations: locs.rows, locationCount: Number(cnt.rows[0]!.n), batch: batch.rows[0] ?? null };
}

export interface RegistryStats { companies: number; legal: number; locations: number; lastBatch: { finished_at: Date | null; source_note: string | null } | null }

export async function registryStats(): Promise<RegistryStats> {
  const [a, l, b] = await Promise.all([
    pool().query<{ n: string; legal: string }>(`SELECT reltuples::bigint AS n, 0 AS legal FROM pg_class WHERE relname = 'registry_companies'`),
    pool().query<{ n: string }>(`SELECT reltuples::bigint AS n FROM pg_class WHERE relname = 'registry_locations'`),
    pool().query<{ finished_at: Date | null; source_note: string | null }>(`SELECT finished_at, source_note FROM registry_batches WHERE status = 'completed' AND kind = 'ruc' ORDER BY finished_at DESC LIMIT 1`),
  ]);
  const exact = await pool().query<{ n: string }>(`SELECT count(*) AS n FROM (SELECT 1 FROM registry_companies LIMIT 5000001) s`);
  return { companies: Number(exact.rows[0]!.n), legal: Number(a.rows[0]?.legal ?? 0), locations: Math.max(0, Number(l.rows[0]?.n ?? 0)), lastBatch: b.rows[0] ?? null };
}

export type IndustryMode = "suggested" | "none" | { industryId: string };

export interface PromoteResult {
  created: { ruc: string; companyId: string }[];
  alreadyInBase: string[];
  needsReview: { ruc: string; name: string; otherId: string; message: string }[];
  blocked: { ruc: string; reason: string }[];
  notFound: string[];
}

/**
 * Pasa empresas del padrón a empresas de trabajo. Máximo PROMOTE_MAX por acción. Respeta no contactar y clientes activos,
 * no duplica (mismo RUC) y deja para revisión humana las de nombre muy parecido a una empresa que ya está sin RUC.
 */
export async function promoteRegistry(actor: ActorInfo, rucsInput: string[], mode: IndustryMode = "suggested"): Promise<PromoteResult> {
  requirePermission(actor, "registry.promote");
  const rucs = [...new Set(rucsInput.map((r) => r.trim()))];
  if (rucs.length === 0) throw new CompanyError("Selecciona al menos una empresa");
  if (rucs.length > PROMOTE_MAX) throw new CompanyError(`Máximo ${PROMOTE_MAX} empresas por acción`);
  if (rucs.some((r) => !/^\d{11}$/.test(r))) throw new CompanyError("RUC inválido en la selección");

  const result = await withTransaction(async (c) => {
    const rows = (await c.query<{ ruc: string; legal_name: string; ubigeo: string | null; department: string | null; suggested_industry_id: string | null; last_batch_id: string | null; industry_slug: string | null }>(
      `SELECT r.ruc, r.legal_name, r.ubigeo, u.department, r.suggested_industry_id, r.last_batch_id, i.slug AS industry_slug
         FROM registry_companies r LEFT JOIN ubigeo u ON u.code = left(r.ubigeo, 2) LEFT JOIN industries i ON i.id = r.suggested_industry_id WHERE r.ruc = ANY($1::text[])`, [rucs])).rows;
    const byRuc = new Map(rows.map((r) => [r.ruc, r]));
    const lookups = await loadLookups(c);
    const index = await CompanyIndex.load(c);
    let fixedSlug: string | null = null;
    if (typeof mode === "object") {
      const s = await c.query<{ slug: string }>(`SELECT slug FROM industries WHERE id = $1 AND active`, [mode.industryId]);
      if (!s.rows[0]) throw new CompanyError("Rubro no encontrado");
      fixedSlug = s.rows[0].slug;
    }
    const out: PromoteResult = { created: [], alreadyInBase: [], needsReview: [], blocked: [], notFound: [] };
    for (const ruc of rucs) {
      const r = byRuc.get(ruc);
      if (!r) { out.notFound.push(ruc); continue; }
      const slug = mode === "none" ? null : fixedSlug ?? r.industry_slug;
      const { prepared, issues } = prepareCompany({ legal_name: r.legal_name, ruc, city: r.department ?? undefined, industry: slug ?? undefined }, lookups);
      const ev = await evaluate(prepared, issues, index, c);
      if (ev.status === "blocked" || ev.status === "excluded_client") out.blocked.push({ ruc, reason: ev.issues.filter((i) => i.level === "error").map((i) => i.message).join("; ") });
      else if (ev.status === "duplicate") out.alreadyInBase.push(ruc);
      else if (ev.status === "possible_duplicate" && ev.match) out.needsReview.push({ ruc, name: r.legal_name, otherId: ev.match.companyId, message: ev.issues.at(-1)?.message ?? "Nombre parecido a una empresa existente" });
      else if (ev.status === "valid" && prepared) {
        const id = await insertCompany(c, prepared, { createdBy: actor.id, sourceCode: "sunat_padron", sourceRef: r.last_batch_id });
        index.add(id, { normalizedName: prepared.normalizedName, ruc: prepared.ruc, domain: null });
        out.created.push({ ruc, companyId: id });
      } else out.blocked.push({ ruc, reason: ev.issues.filter((i) => i.level === "error").map((i) => i.message).join("; ") || "No se pudo promover" });
    }
    await audit({
      actorId: actor.id, actorEmail: actor.email, action: "registry.promoted", entityType: "registry", entityId: "padron",
      metadata: { requested: rucs.length, created: out.created.length, alreadyInBase: out.alreadyInBase.length, needsReview: out.needsReview.length, blocked: out.blocked.length, rucs: rucs.slice(0, 50) },
    }, c);
    return out;
  });
  return result;
}

/** Vincula el RUC del padrón a una empresa que ya estaba en la base sin RUC (resuelve un posible duplicado sin crear otra). */
export async function linkRucToCompany(actor: ActorInfo, companyId: string, ruc: string): Promise<void> {
  requirePermission(actor, "registry.promote");
  if (!/^\d{11}$/.test(ruc)) throw new CompanyError("RUC inválido");
  const r = await pool().query(`SELECT 1 FROM registry_companies WHERE ruc = $1`, [ruc]);
  if (!r.rowCount) throw new CompanyError("Ese RUC no está en el padrón cargado");
  await updateCompany(actor, companyId, { ruc });
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "registry.linked", entityType: "company", entityId: companyId, metadata: { ruc } });
}
