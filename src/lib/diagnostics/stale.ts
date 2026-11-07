import { pool } from "../db";
import { COMMON_SIGNALS } from "../analyzer/observations";

const same = (a: unknown, b: unknown): boolean => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]));
  return v;
}

export interface StaleResult { stale: boolean; reason: string | null }

/**
 * Un diagnóstico queda «desactualizado» cuando cambió la evidencia que cita: una señal citada tiene ahora otro estado u
 * otro valor en el último análisis. Una señal que pasó a «no verificable» no se toma como cambio (no hay base para decirlo).
 */
export async function evaluateStale(diagnosticId: string): Promise<StaleResult> {
  const d = await pool().query<{ company_id: string; version_id: string; evidence_run_id: string | null; observation_ids: string[] }>(
    `SELECT d.company_id, v.id AS version_id, v.evidence_run_id, v.observation_ids
       FROM diagnostics d JOIN diagnostic_versions v ON v.id = d.current_version_id WHERE d.id = $1`, [diagnosticId]);
  const cur = d.rows[0];
  if (!cur) return { stale: false, reason: null };
  const latest = await pool().query<{ id: string }>(`SELECT id FROM analysis_runs WHERE company_id = $1 AND status = 'completed' ORDER BY finished_at DESC LIMIT 1`, [cur.company_id]);
  const latestRun = latest.rows[0]?.id;
  if (!latestRun || latestRun === cur.evidence_run_id || cur.observation_ids.length === 0) return { stale: false, reason: null };

  const cited = await pool().query<{ signal_code: string; status: string; value: unknown }>(
    `SELECT signal_code, status, value FROM signal_observations WHERE id = ANY($1::bigint[])`, [cur.observation_ids]);
  const now = await pool().query<{ signal_code: string; status: string; value: unknown }>(
    `SELECT signal_code, status, value FROM signal_observations WHERE analysis_run_id = $1 AND signal_code = ANY($2::text[])`, [latestRun, cited.rows.map((r) => r.signal_code)]);
  const nowBy = new Map(now.rows.map((r) => [r.signal_code, r]));
  const changed: string[] = [];
  for (const c of cited.rows) {
    const n = nowBy.get(c.signal_code);
    if (!n || n.status === "unverifiable") continue;
    if (n.status !== c.status || !same(n.value, c.value)) changed.push(COMMON_SIGNALS.find((s) => s.code === c.signal_code)?.name ?? c.signal_code);
  }
  return changed.length ? { stale: true, reason: `Cambió la evidencia citada: ${[...new Set(changed)].slice(0, 5).join(", ")}` } : { stale: false, reason: null };
}

/** Actualiza la marca de desactualizado del diagnóstico de una empresa (se llama al terminar cada análisis). */
export async function markStaleForCompany(companyId: string): Promise<void> {
  const d = await pool().query<{ id: string; stale: boolean }>(`SELECT id, stale FROM diagnostics WHERE company_id = $1`, [companyId]);
  const diag = d.rows[0];
  if (!diag) return;
  const r = await evaluateStale(diag.id);
  if (r.stale !== diag.stale) {
    await pool().query(`UPDATE diagnostics SET stale = $2, stale_reason = $3, updated_at = now() WHERE id = $1`, [diag.id, r.stale, r.reason]);
    await pool().query(`INSERT INTO diagnostic_events (diagnostic_id, action, note) VALUES ($1, $2, $3)`, [diag.id, r.stale ? "marked_stale" : "stale_cleared", r.reason]);
  }
}
