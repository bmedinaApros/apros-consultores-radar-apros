import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import { cleanText } from "../companies/normalize";
import { CompanyError, type ActorInfo } from "../companies/service";
import { ForbiddenError, requirePermission, type Role } from "../rbac";

export interface ListRow {
  id: string; run_id: string; week_start: string; created_at: Date; total_items: number; partial: boolean;
  coverage: { companiesWithSite: number; analyzed: number; analyzedPct: number; unverifiablePct: number };
  budget: { analysisBudget: number; analysesUsed: number; skippedForBudget: number; partialReasons: string[] };
  model_versions: { id: string; name: string; version: number }[];
  excluded: Record<string, number>;
  trigger_kind: string;
}

export interface ItemRow {
  id: string; list_id: string; rank: number; company_id: string | null; company_name: string; company_domain: string | null; score: string; band: "sales" | "nurturing";
  model_name: string; model_version: number; data_coverage: string;
  services: { slug: string; name: string; reasons: { rationale: string; signal: string; status: string; confidence: string; evidenceUrl: string | null }[] }[];
  reasons: string[]; flags: { reappearsDueToChange?: string[]; industryToConfirm?: boolean; missingManual?: string[]; manualAdjustment?: { delta: number; reason: string } };
  review_status: "pending_review" | "approved" | "rejected"; reviewed_by: string | null; reviewed_at: Date | null; review_note: string | null; assigned_to: string | null;
  assigned_email: string | null; owner_id: string | null; industry_name: string | null; city: string | null;
}

const LIST_SQL = `SELECT l.id, l.run_id, l.week_start::text, l.created_at, l.total_items, l.partial, l.coverage, l.budget, l.model_versions, l.excluded, r.trigger_kind
                    FROM weekly_lists l JOIN weekly_runs r ON r.id = l.run_id`;

export async function listWeeklyLists(limit = 12): Promise<ListRow[]> {
  return (await pool().query<ListRow>(`${LIST_SQL} ORDER BY l.created_at DESC LIMIT $1`, [limit])).rows;
}

export async function getList(id: string): Promise<ListRow | null> {
  return (await pool().query<ListRow>(`${LIST_SQL} WHERE l.id = $1`, [id])).rows[0] ?? null;
}

export async function latestList(): Promise<ListRow | null> {
  return (await pool().query<ListRow>(`${LIST_SQL} ORDER BY l.created_at DESC LIMIT 1`)).rows[0] ?? null;
}

/**
 * Elementos de una lista. Un vendedor solo ve lo que ya revisó una persona del equipo (aprobado) y que es suyo o
 * no tiene responsable: nadie usa comercialmente una empresa antes de la revisión.
 */
export async function listItems(actor: { id: string; role: Role }, listId: string, filter: { review?: string; band?: string } = {}): Promise<ItemRow[]> {
  const where = ["i.list_id = $1"];
  const params: unknown[] = [listId];
  if (filter.review) { params.push(filter.review); where.push(`i.review_status = $${params.length}`); }
  if (filter.band) { params.push(filter.band); where.push(`i.band = $${params.length}`); }
  if (actor.role === "salesperson") {
    params.push(actor.id);
    where.push(`i.review_status = 'approved' AND (c.owner_id IS NULL OR c.owner_id = $${params.length})`);
  }
  return (await pool().query<ItemRow>(
    `SELECT i.id, i.list_id, i.rank, i.company_id, i.company_name, i.company_domain, i.score, i.band, i.model_name, i.model_version, i.data_coverage, i.services, i.reasons, i.flags,
            i.review_status, i.reviewed_by, i.reviewed_at, i.review_note, i.assigned_to, u.email AS assigned_email, c.owner_id, ind.name AS industry_name, c.city
       FROM weekly_list_items i
       LEFT JOIN companies c ON c.id = i.company_id LEFT JOIN industries ind ON ind.id = c.industry_id LEFT JOIN users u ON u.id = i.assigned_to
      WHERE ${where.join(" AND ")} ORDER BY i.rank`, params)).rows;
}

export async function reviewCounts(listId: string): Promise<Record<string, number>> {
  const r = await pool().query<{ review_status: string; n: string }>(`SELECT review_status, count(*) AS n FROM weekly_list_items WHERE list_id = $1 GROUP BY 1`, [listId]);
  return Object.fromEntries(r.rows.map((x) => [x.review_status, Number(x.n)]));
}

/** Revisión humana de un elemento de la lista: aprobar (y asignar), rechazar o devolver a pendiente. */
export async function reviewItem(
  actor: ActorInfo, itemId: string,
  input: { decision: "approved" | "rejected" | "pending_review"; note?: string; assignedTo?: string | null },
): Promise<void> {
  requirePermission(actor, "weekly.review");
  const note = cleanText(input.note, 400);
  if (input.decision === "rejected" && !note) throw new CompanyError("Indica el motivo del rechazo");
  await withTransaction(async (c) => {
    const it = await c.query<{ company_id: string | null; list_id: string; flags: { missingManual?: string[] } }>(`SELECT company_id, list_id, flags FROM weekly_list_items WHERE id = $1 FOR UPDATE`, [itemId]);
    const item = it.rows[0];
    if (!item) throw new CompanyError("Elemento no encontrado");
    if (input.decision === "approved" && item.company_id) {
      // La aprobación nunca aplica a una empresa que entró después a la lista de no contactar o a clientes.
      const blocked = await c.query(
        `SELECT 1 FROM companies c WHERE c.id = $1 AND EXISTS (SELECT 1 FROM do_not_contact d WHERE (d.kind = 'company' AND d.value IN (c.ruc, c.normalized_name)) OR (d.kind = 'domain' AND d.value = c.domain))`, [item.company_id]);
      if (blocked.rowCount) throw new CompanyError("La empresa está ahora en la lista de no contactar; no se puede aprobar");
    }
    let assignee: string | null = null;
    if (input.assignedTo) {
      const u = await c.query<{ role: Role; active: boolean }>(`SELECT role, active FROM users WHERE id = $1`, [input.assignedTo]);
      if (!u.rows[0] || !u.rows[0].active) throw new CompanyError("El responsable no existe o está desactivado");
      if (u.rows[0].role !== "salesperson" && u.rows[0].role !== "sales_lead") throw new CompanyError("Solo se asignan vendedores o líderes comerciales");
      assignee = input.assignedTo;
    }
    if (assignee && input.decision !== "approved") throw new CompanyError("Solo se asigna al aprobar");
    await c.query(
      `UPDATE weekly_list_items SET review_status = $2, review_note = $3, reviewed_by = $4, reviewed_at = now(), assigned_to = $5 WHERE id = $1`,
      [itemId, input.decision, note, actor.id, input.decision === "approved" ? assignee : null]);
    if (assignee && item.company_id) await c.query(`UPDATE companies SET owner_id = $2, updated_at = now() WHERE id = $1`, [item.company_id, assignee]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: `weekly.item_${input.decision}`, entityType: "weekly_list_item", entityId: itemId, metadata: { assignedTo: assignee, note } }, c);
  });
}

// ---------- Bandeja priorizada ----------

export interface InboxFilters {
  owner?: "mine" | "unassigned" | "any" | string;
  industryId?: string; city?: string; band?: "sales" | "nurturing" | "discard"; minScore?: number;
  signal?: string; signalStatus?: "observed" | "not_detected"; stage?: string; review?: "pending_review" | "approved" | "rejected"; page?: number;
}
export interface InboxRow {
  company_id: string; legal_name: string; domain: string | null; city: string | null; industry_name: string | null; stage: string; owner_email: string | null; owner_id: string | null;
  total: string; band: string; data_coverage: string; model_name: string; model_version: number; reasons: string[]; review_status: string | null; disqualified: boolean;
}
export const INBOX_PAGE = 25;

/** Bandeja de empresas con puntaje. Un vendedor solo ve lo aprobado por el equipo que es suyo o está libre. */
export async function listInbox(actor: { id: string; role: Role }, f: InboxFilters): Promise<{ rows: InboxRow[]; total: number }> {
  const where: string[] = ["s.disqualified = false"];
  const params: unknown[] = [];
  const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
  if (actor.role === "salesperson") {
    where.push(`(c.owner_id IS NULL OR c.owner_id = ${p(actor.id)})`);
    where.push(`li.review_status = 'approved'`);
  } else {
    if (f.owner === "mine") where.push(`c.owner_id = ${p(actor.id)}`);
    else if (f.owner === "unassigned") where.push(`c.owner_id IS NULL`);
    else if (f.owner && f.owner !== "any") where.push(`c.owner_id = ${p(f.owner)}::uuid`);
    if (f.review) where.push(`li.review_status = ${p(f.review)}`);
  }
  if (f.industryId) where.push(`c.industry_id = ${p(f.industryId)}`);
  if (f.city) where.push(`lower(c.city) = ${p(f.city.toLowerCase())}`);
  if (f.band) where.push(`s.band = ${p(f.band)}`); else where.push(`s.band <> 'discard'`);
  if (f.minScore !== undefined) where.push(`s.total >= ${p(f.minScore)}`);
  if (f.stage) where.push(`c.stage = ${p(f.stage)}::pipeline_stage`);
  if (f.signal) {
    where.push(`EXISTS (SELECT 1 FROM signal_observations o WHERE o.analysis_run_id = s.analysis_run_id AND o.signal_code = ${p(f.signal)} AND o.status = ${p(f.signalStatus ?? "observed")})`);
  }
  const base = `FROM companies c
    JOIN LATERAL (SELECT * FROM scores x WHERE x.company_id = c.id ORDER BY x.computed_at DESC, x.id LIMIT 1) s ON true
    JOIN scoring_model_versions v ON v.id = s.model_version_id JOIN scoring_models m ON m.id = v.model_id
    LEFT JOIN LATERAL (SELECT review_status FROM weekly_list_items i WHERE i.company_id = c.id ORDER BY i.id DESC LIMIT 1) li ON true
    LEFT JOIN industries ind ON ind.id = c.industry_id LEFT JOIN users u ON u.id = c.owner_id
    WHERE ${where.join(" AND ")}`;
  const page = Math.max(1, f.page ?? 1);
  const [rows, total] = await Promise.all([
    pool().query<InboxRow>(
      `SELECT c.id AS company_id, c.legal_name, c.domain, c.city, ind.name AS industry_name, c.stage, u.email AS owner_email, c.owner_id,
              s.total, s.band, s.data_coverage, m.name AS model_name, v.version AS model_version, s.reasons, li.review_status, s.disqualified
         ${base} ORDER BY s.total DESC, c.legal_name LIMIT ${INBOX_PAGE} OFFSET ${(page - 1) * INBOX_PAGE}`, params),
    pool().query<{ n: string }>(`SELECT count(*) AS n ${base}`, params),
  ]);
  return { rows: rows.rows, total: Number(total.rows[0]!.n) };
}

export { ForbiddenError };
