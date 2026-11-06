import type { Pool, PoolClient } from "pg";
import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import { canModifyOwned, ForbiddenError, requirePermission, type Actor, type Role } from "../rbac";
import { CompanyIndex } from "./dedupe";
import { findDoNotContact } from "./exclusions";
import { evaluate, insertCompany, loadLookups, mergeIntoCompany, prepareCompany, type RawCompany, type PreparedCompany } from "./ingest";
import { cleanText, normalizeDomain, normalizeEmailDomain, normalizeName, normalizeRuc } from "./normalize";

type Db = Pick<Pool | PoolClient, "query">;
export type ActorInfo = Actor & { email: string };

export class CompanyError extends Error {
  override name = "CompanyError";
}

export interface CompanyRow {
  id: string;
  legal_name: string;
  trade_name: string | null;
  domain: string | null;
  ruc: string | null;
  industry_id: string | null;
  industry_name: string | null;
  subindustry: string | null;
  city: string | null;
  owner_id: string | null;
  owner_email: string | null;
  stage: string;
  classification: "classified" | "to_classify";
  created_at: Date;
  updated_at: Date;
  blocked: boolean;
}

const SELECT = `
  SELECT c.id, c.legal_name, c.trade_name, c.domain, c.ruc, c.industry_id, i.name AS industry_name,
         c.subindustry, c.city, c.owner_id, u.email AS owner_email, c.stage, c.classification, c.created_at, c.updated_at,
         EXISTS (SELECT 1 FROM do_not_contact d WHERE
                  (d.kind = 'company' AND d.value IN (c.ruc, c.normalized_name))
               OR (d.kind = 'domain'  AND d.value = c.domain)) AS blocked
    FROM companies c
    LEFT JOIN industries i ON i.id = c.industry_id
    LEFT JOIN users u ON u.id = c.owner_id`;

export interface CompanyFilters {
  q?: string;
  industryId?: string;
  classification?: "classified" | "to_classify";
  stage?: string;
  city?: string;
  ownerId?: string;
  page?: number;
}
export const PAGE_SIZE = 25;

export async function listCompanies(f: CompanyFilters, db: Db = pool()): Promise<{ rows: CompanyRow[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
  if (f.q) {
    const like = `%${f.q.replace(/[\\%_]/g, "\\$&").toLowerCase()}%`;
    where.push(`(c.normalized_name LIKE ${p(like)} OR lower(c.legal_name) LIKE ${p(like)} OR c.domain LIKE ${p(like)} OR c.ruc LIKE ${p(like)})`);
  }
  if (f.industryId) where.push(`c.industry_id = ${p(f.industryId)}`);
  if (f.classification) where.push(`c.classification = ${p(f.classification)}`);
  if (f.stage) where.push(`c.stage = ${p(f.stage)}::pipeline_stage`);
  if (f.city) where.push(`lower(c.city) = ${p(f.city.toLowerCase())}`);
  if (f.ownerId) where.push(`c.owner_id = ${p(f.ownerId)}`);
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const page = Math.max(1, f.page ?? 1);
  const [rows, total] = await Promise.all([
    db.query<CompanyRow>(`${SELECT} ${w} ORDER BY c.created_at DESC, c.id LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`, params),
    db.query<{ n: string }>(`SELECT count(*) AS n FROM companies c ${w}`, params),
  ]);
  return { rows: rows.rows, total: Number(total.rows[0]!.n) };
}

export async function getCompany(id: string, db: Db = pool()): Promise<CompanyRow | null> {
  const res = await db.query<CompanyRow>(`${SELECT} WHERE c.id = $1`, [id]);
  return res.rows[0] ?? null;
}

export async function companySources(id: string, db: Db = pool()) {
  const res = await db.query<{ source_code: string; first_seen_at: Date; purpose: string }>(
    `SELECT source_code, first_seen_at, purpose FROM company_sources WHERE company_id = $1 ORDER BY first_seen_at`, [id]);
  return res.rows;
}

export interface CreateResult { id: string; possibleDuplicateOf: string | null }

/** Alta manual. Un duplicado exacto se rechaza; uno posible exige confirmación y queda para revisión. */
export async function createCompany(
  actor: ActorInfo,
  raw: RawCompany,
  opts: { confirmPossibleDuplicate?: boolean } = {},
): Promise<CreateResult> {
  requirePermission(actor, "companies.write");
  return withTransaction(async (c) => {
    const lookups = await loadLookups(c);
    // Un vendedor solo puede crear empresas para sí mismo o sin responsable.
    const { prepared, issues } = prepareCompany(raw, lookups);
    if (!prepared) throw new CompanyError(issues.filter((i) => i.level === "error").map((i) => i.message).join("; "));
    if (actor.role === "salesperson" && prepared.ownerId && prepared.ownerId !== actor.id) throw new ForbiddenError("Solo puedes asignarte empresas a ti mismo");
    const ev = await evaluate(prepared, issues, await CompanyIndex.load(c), c);
    if (ev.status === "blocked" || ev.status === "excluded_client" || ev.status === "duplicate") {
      throw new CompanyError(ev.issues.filter((i) => i.level === "error" || i.message.startsWith("Ya existe")).map((i) => i.message).join("; "));
    }
    if (ev.status === "possible_duplicate" && !opts.confirmPossibleDuplicate) {
      throw new PossibleDuplicateError(ev.match!.companyId, ev.issues.at(-1)!.message);
    }
    const id = await insertCompany(c, prepared, { createdBy: actor.id, sourceCode: "manual" });
    if (ev.status === "possible_duplicate" && ev.match) {
      await c.query(`INSERT INTO duplicate_candidates (company_id, other_company_id, reason, score) VALUES ($1,$2,'nombre parecido',$3) ON CONFLICT DO NOTHING`, [id, ev.match.companyId, ev.match.score]);
    }
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "company.created", entityType: "company", entityId: id, metadata: { source: "manual" } }, c);
    return { id, possibleDuplicateOf: ev.match?.companyId ?? null };
  });
}

export class PossibleDuplicateError extends CompanyError {
  override name = "PossibleDuplicateError";
  constructor(public otherId: string, message: string) { super(message); }
}

export interface CompanyUpdate {
  legal_name?: string; trade_name?: string; website?: string; ruc?: string; subindustry?: string; city?: string;
  industryId?: string | null; ownerId?: string | null;
}

export async function updateCompany(actor: ActorInfo, id: string, change: CompanyUpdate): Promise<void> {
  requirePermission(actor, "companies.write");
  await withTransaction(async (c) => {
    const cur = await c.query<CompanyRow & { normalized_name: string }>(`SELECT c.*, c.owner_id FROM companies c WHERE c.id = $1 FOR UPDATE`, [id]);
    const row = cur.rows[0] as unknown as { owner_id: string | null; legal_name: string; trade_name: string | null; domain: string | null; ruc: string | null; subindustry: string | null; city: string | null; industry_id: string | null } | undefined;
    if (!row) throw new CompanyError("Empresa no encontrada");
    if (!canModifyOwned(actor, { ownerId: row.owner_id }, "companies.write")) throw new ForbiddenError("Esta empresa pertenece a otro vendedor");

    const next = { ...row };
    if (change.legal_name !== undefined) {
      const n = cleanText(change.legal_name, 200);
      if (!n) throw new CompanyError("La razón social no puede estar vacía");
      next.legal_name = n;
    }
    if (change.trade_name !== undefined) next.trade_name = cleanText(change.trade_name, 200);
    if (change.subindustry !== undefined) next.subindustry = cleanText(change.subindustry, 100);
    if (change.city !== undefined) next.city = cleanText(change.city, 100);
    if (change.website !== undefined) {
      if (!cleanText(change.website, 300)) next.domain = null;
      else {
        const d = normalizeDomain(change.website);
        if (!d.ok) throw new CompanyError(`Sitio web: ${d.error}`);
        next.domain = d.domain;
      }
    }
    if (change.ruc !== undefined) {
      if (!cleanText(change.ruc, 30)) next.ruc = null;
      else {
        const r = normalizeRuc(change.ruc);
        if (!r.ok) throw new CompanyError(r.error);
        next.ruc = r.ruc;
      }
    }
    if (change.industryId !== undefined) next.industry_id = change.industryId;
    let ownerId = row.owner_id;
    if (change.ownerId !== undefined) {
      // Asignar a otra persona solo lo hacen el líder y el administrador; el vendedor puede tomar una empresa libre.
      const takesFree = actor.role === "salesperson" && row.owner_id === null && change.ownerId === actor.id;
      const releases = actor.role === "salesperson" && row.owner_id === actor.id && change.ownerId === null;
      if (actor.role !== "admin" && actor.role !== "sales_lead" && !takesFree && !releases) throw new ForbiddenError("No puedes reasignar esta empresa");
      ownerId = change.ownerId;
    }
    // Un cambio manual de identidad no puede saltarse la lista de no contactar ni la unicidad.
    const dnc = await findDoNotContact({ name: next.legal_name, domain: next.domain, ruc: next.ruc }, c);
    if (dnc && (next.domain !== row.domain || next.ruc !== row.ruc || next.legal_name !== row.legal_name)) {
      throw new CompanyError("La empresa quedaría en la lista de no contactar; no se puede modificar de esa forma");
    }
    const classification = next.industry_id ? "classified" : "to_classify";
    try {
      await c.query(
        `UPDATE companies SET legal_name=$2, trade_name=$3, normalized_name=$4, domain=$5, ruc=$6, industry_id=$7,
                subindustry=$8, city=$9, owner_id=$10, classification=$11::classification_status, updated_at=now() WHERE id=$1`,
        [id, next.legal_name, next.trade_name, normalizeName(next.legal_name), next.domain, next.ruc, next.industry_id, next.subindustry, next.city, ownerId, classification],
      );
    } catch (e) {
      if ((e as { code?: string }).code === "23505") throw new CompanyError("Ya existe otra empresa con ese RUC o dominio");
      throw e;
    }
    const changed = Object.keys(change);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "company.updated", entityType: "company", entityId: id, metadata: { fields: changed } }, c);
  });
}

/** Confirmación humana del rubro: la IA puede sugerirlo, pero solo una persona lo confirma. */
export async function classifyCompany(actor: ActorInfo, id: string, industryId: string | null): Promise<void> {
  await updateCompany(actor, id, { industryId });
}

// ---------- Lista de no contactar y clientes activos ----------

export type DncKind = "company" | "domain" | "email";

export function normalizeDncValue(kind: DncKind, input: string): string {
  const v = input.trim().toLowerCase();
  if (!v) throw new CompanyError("El valor no puede estar vacío");
  if (kind === "domain") {
    const d = normalizeDomain(v);
    if (d.ok) return d.domain;
    // Un dominio de correo gratuito sí puede bloquearse completo (por ejemplo, un dominio sensible).
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/.test(v)) return v.replace(/^www\./, "");
    throw new CompanyError(`Dominio inválido: ${d.error}`);
  }
  if (kind === "email") {
    if (!normalizeEmailDomain(v) || /\s/.test(v)) throw new CompanyError("Correo inválido");
    return v;
  }
  const ruc = v.replace(/[\s.-]/g, "");
  if (/^[0-9]{11}$/.test(ruc)) {
    const r = normalizeRuc(ruc);
    if (!r.ok) throw new CompanyError(r.error);
    return r.ruc;
  }
  const n = normalizeName(v);
  if (!n) throw new CompanyError("Nombre inválido");
  return n;
}

export async function addDoNotContact(actor: ActorInfo, kind: DncKind, value: string, reason: string): Promise<void> {
  requirePermission(actor, "dnc.manage");
  const r = cleanText(reason, 300);
  if (!r) throw new CompanyError("El motivo es obligatorio");
  const v = normalizeDncValue(kind, value);
  await withTransaction(async (c) => {
    const res = await c.query(
      `INSERT INTO do_not_contact (kind, value, reason, created_by) VALUES ($1,$2,$3,$4) ON CONFLICT (kind, value) DO NOTHING`,
      [kind, v, r, actor.id]);
    if (res.rowCount === 0) throw new CompanyError("Ya está en la lista de no contactar");
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "dnc.added", entityType: "do_not_contact", entityId: `${kind}:${v}`, metadata: { kind } }, c);
  });
}

export async function removeDoNotContact(actor: ActorInfo, id: string): Promise<void> {
  requirePermission(actor, "dnc.manage");
  await withTransaction(async (c) => {
    const res = await c.query<{ kind: string; value: string }>(`DELETE FROM do_not_contact WHERE id = $1 RETURNING kind, value`, [id]);
    if (!res.rows[0]) throw new CompanyError("Registro no encontrado");
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "dnc.removed", entityType: "do_not_contact", entityId: `${res.rows[0].kind}:${res.rows[0].value}` }, c);
  });
}

export async function listDoNotContact(db: Db = pool()) {
  return (await db.query<{ id: string; kind: DncKind; value: string; reason: string; created_at: Date }>(
    `SELECT id, kind, value, reason, created_at FROM do_not_contact ORDER BY created_at DESC LIMIT 500`)).rows;
}

export async function addActiveClient(actor: ActorInfo, input: { name: string; website?: string; ruc?: string }): Promise<void> {
  requirePermission(actor, "catalog.manage");
  const name = cleanText(input.name, 200);
  if (!name) throw new CompanyError("El nombre es obligatorio");
  let domain: string | null = null;
  if (cleanText(input.website, 300)) {
    const d = normalizeDomain(input.website!);
    if (!d.ok) throw new CompanyError(`Sitio web: ${d.error}`);
    domain = d.domain;
  }
  let ruc: string | null = null;
  if (cleanText(input.ruc, 30)) {
    const r = normalizeRuc(input.ruc!);
    if (!r.ok) throw new CompanyError(r.error);
    ruc = r.ruc;
  }
  await withTransaction(async (c) => {
    const res = await c.query<{ id: string }>(
      `INSERT INTO active_clients (name, normalized_name, domain, ruc, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [name, normalizeName(name), domain, ruc, actor.id]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "client.added", entityType: "active_client", entityId: res.rows[0]!.id }, c);
  });
}

export async function removeActiveClient(actor: ActorInfo, id: string): Promise<void> {
  requirePermission(actor, "catalog.manage");
  await withTransaction(async (c) => {
    const res = await c.query(`DELETE FROM active_clients WHERE id = $1`, [id]);
    if (res.rowCount === 0) throw new CompanyError("Registro no encontrado");
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "client.removed", entityType: "active_client", entityId: id }, c);
  });
}

export async function listActiveClients(db: Db = pool()) {
  return (await db.query<{ id: string; name: string; domain: string | null; ruc: string | null }>(
    `SELECT id, name, domain, ruc FROM active_clients ORDER BY name LIMIT 1000`)).rows;
}

// ---------- Rubros ----------

export async function listIndustries(db: Db = pool(), includeInactive = false) {
  return (await db.query<{ id: string; slug: string; name: string; active: boolean; is_example: boolean; companies: string }>(
    `SELECT i.id, i.slug, i.name, i.active, i.is_example, (SELECT count(*) FROM companies c WHERE c.industry_id = i.id) AS companies
       FROM industries i WHERE ($1 OR i.active) ORDER BY i.name`, [includeInactive])).rows;
}

export const slugify = (s: string) => normalizeName(s).replace(/ /g, "-");

export async function createIndustry(actor: ActorInfo, name: string): Promise<void> {
  requirePermission(actor, "catalog.manage");
  const n = cleanText(name, 80);
  const slug = n ? slugify(n) : "";
  if (!n || !slug) throw new CompanyError("Nombre de rubro inválido");
  await withTransaction(async (c) => {
    try {
      const r = await c.query<{ id: string }>(`INSERT INTO industries (slug, name) VALUES ($1,$2) RETURNING id`, [slug, n]);
      await audit({ actorId: actor.id, actorEmail: actor.email, action: "industry.created", entityType: "industry", entityId: r.rows[0]!.id, metadata: { name: n } }, c);
    } catch (e) {
      if ((e as { code?: string }).code === "23505") throw new CompanyError("Ya existe un rubro con ese nombre");
      throw e;
    }
  });
}

export async function updateIndustry(actor: ActorInfo, id: string, change: { name?: string; active?: boolean }): Promise<void> {
  requirePermission(actor, "catalog.manage");
  await withTransaction(async (c) => {
    const cur = await c.query<{ name: string; active: boolean }>(`SELECT name, active FROM industries WHERE id = $1 FOR UPDATE`, [id]);
    if (!cur.rows[0]) throw new CompanyError("Rubro no encontrado");
    const name = change.name !== undefined ? cleanText(change.name, 80) : cur.rows[0].name;
    if (!name) throw new CompanyError("Nombre de rubro inválido");
    await c.query(`UPDATE industries SET name = $2, active = $3, is_example = false WHERE id = $1`, [id, name, change.active ?? cur.rows[0].active]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "industry.updated", entityType: "industry", entityId: id, metadata: { ...change } }, c);
  });
}

// ---------- Duplicados ----------

export async function listPendingDuplicates(db: Db = pool()) {
  return (await db.query<{ id: string; reason: string; score: string; a_id: string; a_name: string; a_domain: string | null; b_id: string; b_name: string; b_domain: string | null }>(
    `SELECT d.id, d.reason, d.score, a.id AS a_id, a.legal_name AS a_name, a.domain AS a_domain,
            b.id AS b_id, b.legal_name AS b_name, b.domain AS b_domain
       FROM duplicate_candidates d JOIN companies a ON a.id = d.company_id JOIN companies b ON b.id = d.other_company_id
      WHERE d.status = 'pending' ORDER BY d.created_at LIMIT 200`)).rows;
}

/** Fusiona dos empresas conservando `keepId`, o descarta el aviso. Solo líder y administrador. */
export async function resolveDuplicate(actor: ActorInfo, candidateId: string, action: "dismiss" | "keep_first" | "keep_second"): Promise<void> {
  if (!(["admin", "sales_lead"] as Role[]).includes(actor.role)) throw new ForbiddenError("Solo el líder comercial o el administrador resuelven duplicados");
  await withTransaction(async (c) => {
    const res = await c.query<{ company_id: string; other_company_id: string; status: string }>(
      `SELECT company_id, other_company_id, status FROM duplicate_candidates WHERE id = $1 FOR UPDATE`, [candidateId]);
    const d = res.rows[0];
    if (!d || d.status !== "pending") throw new CompanyError("El aviso ya fue resuelto o no existe");
    if (action === "dismiss") {
      await c.query(`UPDATE duplicate_candidates SET status='dismissed', resolved_by=$2, resolved_at=now() WHERE id=$1`, [candidateId, actor.id]);
    } else {
      const keep = action === "keep_first" ? d.company_id : d.other_company_id;
      const drop = action === "keep_first" ? d.other_company_id : d.company_id;
      const dropped = await c.query<{ legal_name: string; trade_name: string | null; domain: string | null; ruc: string | null; industry_id: string | null; subindustry: string | null; city: string | null; owner_id: string | null }>(
        `DELETE FROM companies WHERE id = $1 RETURNING legal_name, trade_name, domain, ruc, industry_id, subindustry, city, owner_id`, [drop]);
      const r = dropped.rows[0]!;
      const prepared: PreparedCompany = {
        legalName: r.legal_name, tradeName: r.trade_name, normalizedName: normalizeName(r.legal_name), domain: r.domain, ruc: r.ruc,
        industryId: r.industry_id, subindustry: r.subindustry, city: r.city, ownerId: r.owner_id, classification: r.industry_id ? "classified" : "to_classify",
      };
      await mergeIntoCompany(c, keep, prepared, { sourceCode: "merge", sourceRef: drop });
      await c.query(`UPDATE duplicate_candidates SET status='merged', resolved_by=$2, resolved_at=now() WHERE id=$1`, [candidateId, actor.id]);
    }
    await audit({ actorId: actor.id, actorEmail: actor.email, action: `duplicate.${action}`, entityType: "duplicate_candidate", entityId: candidateId }, c);
  });
}
