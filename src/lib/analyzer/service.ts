import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import { can, requirePermission, type Role } from "../rbac";
import { CompanyError, type ActorInfo } from "../companies/service";
import { cleanText } from "../companies/normalize";
import { COMMON_SIGNALS } from "./observations";

export interface ObservationRow {
  id: string;
  signal_code: string;
  status: "observed" | "not_detected" | "unverifiable";
  kind: "observed" | "inferred";
  value: Record<string, unknown> | null;
  confidence: "high" | "medium" | "low";
  evidence_url: string | null;
  evidence_excerpt: string | null;
  observed_at: Date;
  analysis_run_id: string;
  analyzer_version: string;
}

export interface RunRow {
  id: string;
  status: string;
  analyzer_version: string;
  pages_fetched: number;
  pages_budget: number;
  skip_reason: string | null;
  error: string | null;
  started_at: Date;
  finished_at: Date | null;
}

export async function listRuns(companyId: string, limit = 10): Promise<RunRow[]> {
  return (await pool().query<RunRow>(
    `SELECT id, status, analyzer_version, pages_fetched, pages_budget, skip_reason, error, started_at, finished_at
       FROM analysis_runs WHERE company_id = $1 ORDER BY started_at DESC LIMIT $2`, [companyId, limit])).rows;
}

export async function latestCompletedRunId(companyId: string): Promise<string | null> {
  const r = await pool().query<{ id: string }>(
    `SELECT id FROM analysis_runs WHERE company_id = $1 AND status = 'completed' ORDER BY finished_at DESC LIMIT 1`, [companyId]);
  return r.rows[0]?.id ?? null;
}

export async function observationsForRun(runId: string): Promise<ObservationRow[]> {
  return (await pool().query<ObservationRow>(
    `SELECT id, signal_code, status, kind, value, confidence, evidence_url, evidence_excerpt, observed_at, analysis_run_id, analyzer_version
       FROM signal_observations WHERE analysis_run_id = $1 ORDER BY signal_code`, [runId])).rows;
}

export interface SignalChange {
  signal_code: string;
  from: { status: string; value: unknown } | null;
  to: { status: string; value: unknown };
}

/**
 * Cambios entre las dos últimas corridas completadas. Una señal que pasa de «no se pudo verificar» a otro
 * estado (o al revés) no se reporta como cambio real, porque no hay base para compararlas.
 */
export async function signalChanges(companyId: string): Promise<SignalChange[]> {
  const runs = (await pool().query<{ id: string }>(
    `SELECT id FROM analysis_runs WHERE company_id = $1 AND status = 'completed' ORDER BY finished_at DESC LIMIT 2`, [companyId])).rows;
  if (runs.length < 2) return [];
  const [now, before] = await Promise.all([observationsForRun(runs[0]!.id), observationsForRun(runs[1]!.id)]);
  const prev = new Map(before.map((o) => [o.signal_code, o]));
  const changes: SignalChange[] = [];
  for (const o of now) {
    const p = prev.get(o.signal_code);
    if (!p) { changes.push({ signal_code: o.signal_code, from: null, to: { status: o.status, value: o.value } }); continue; }
    if (o.status === "unverifiable" || p.status === "unverifiable") continue;
    if (o.status !== p.status || JSON.stringify(o.value) !== JSON.stringify(p.value)) {
      changes.push({ signal_code: o.signal_code, from: { status: p.status, value: p.value }, to: { status: o.status, value: o.value } });
    }
  }
  return changes;
}

export const signalName = (code: string, industryNames: Record<string, string> = {}): string =>
  COMMON_SIGNALS.find((s) => s.code === code)?.name ?? industryNames[code] ?? code;

// ---------- Señales por rubro (configurables) ----------

export interface IndustrySignalRow { id: string; industry_id: string; slug: string; name: string; keywords: string[]; scope: "text" | "links"; active: boolean }

export async function listIndustrySignals(): Promise<(IndustrySignalRow & { industry_name: string })[]> {
  return (await pool().query<IndustrySignalRow & { industry_name: string }>(
    `SELECT s.id, s.industry_id, s.slug, s.name, s.keywords, s.scope, s.active, i.name AS industry_name
       FROM industry_signals s JOIN industries i ON i.id = s.industry_id ORDER BY i.name, s.name`)).rows;
}

// ---------- Administración de señales por rubro ----------


/** Palabras clave: texto simple (no expresiones regulares), de 2 a 80 caracteres, hasta 20. */
export function parseKeywords(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(/[\n,;]+/)) {
    const k = cleanText(raw, 80);
    if (!k || k.length < 2) continue;
    const key = k.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
  }
  if (out.length === 0) throw new CompanyError("Escribe al menos una palabra clave de 2 o más caracteres");
  if (out.length > 20) throw new CompanyError("Máximo 20 palabras clave");
  return out;
}

const slugOf = (name: string) => name.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function createIndustrySignal(actor: ActorInfo, input: { industryId: string; name: string; keywords: string; scope: "text" | "links" }): Promise<void> {
  requirePermission(actor, "catalog.manage");
  const name = cleanText(input.name, 80);
  const slug = name ? slugOf(name) : "";
  if (!name || !slug) throw new CompanyError("Nombre de señal inválido");
  const keywords = parseKeywords(input.keywords);
  await withTransaction(async (c) => {
    try {
      const r = await c.query<{ id: string }>(
        `INSERT INTO industry_signals (industry_id, slug, name, keywords, scope) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [input.industryId, slug, name, keywords, input.scope]);
      await audit({ actorId: actor.id, actorEmail: actor.email, action: "industry_signal.created", entityType: "industry_signal", entityId: r.rows[0]!.id, metadata: { name, keywords: keywords.length } }, c);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "23505") throw new CompanyError("Ya existe una señal con ese nombre en el rubro");
      if (code === "23503") throw new CompanyError("Rubro no encontrado");
      throw e;
    }
  });
}

export async function updateIndustrySignal(actor: ActorInfo, id: string, input: { name: string; keywords: string; scope: "text" | "links"; active: boolean }): Promise<void> {
  requirePermission(actor, "catalog.manage");
  const name = cleanText(input.name, 80);
  if (!name) throw new CompanyError("Nombre de señal inválido");
  const keywords = parseKeywords(input.keywords);
  await withTransaction(async (c) => {
    const r = await c.query(`UPDATE industry_signals SET name=$2, keywords=$3, scope=$4, active=$5 WHERE id=$1`, [id, name, keywords, input.scope, input.active]);
    if (r.rowCount === 0) throw new CompanyError("Señal no encontrada");
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "industry_signal.updated", entityType: "industry_signal", entityId: id, metadata: { active: input.active, keywords: keywords.length } }, c);
  });
}

export async function deleteIndustrySignal(actor: ActorInfo, id: string): Promise<void> {
  requirePermission(actor, "catalog.manage");
  await withTransaction(async (c) => {
    const r = await c.query(`DELETE FROM industry_signals WHERE id=$1`, [id]);
    if (r.rowCount === 0) throw new CompanyError("Señal no encontrada");
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "industry_signal.deleted", entityType: "industry_signal", entityId: id }, c);
  });
}

/** ¿Puede esta persona pedir un análisis de esta empresa? Un vendedor solo de lo propio o lo que no tiene dueño. */
export function canAnalyze(actor: { id: string; role: Role }, company: { owner_id: string | null }): boolean {
  if (!can(actor.role, "analysis.run")) return false;
  if (actor.role === "salesperson") return company.owner_id === null || company.owner_id === actor.id;
  return true;
}
