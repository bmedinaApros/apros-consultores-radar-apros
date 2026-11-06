import { createHash } from "node:crypto";
import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import { CompanyError, type ActorInfo } from "../companies/service";
import { canModifyOwned, requirePermission } from "../rbac";
import { cleanText } from "../companies/normalize";
import { computeScore, type ObservationInput, type ScoreInputs, type ScoreResult } from "./engine";
import { generalModel, industryModel, manualOptionValid, MANUAL_CRITERIA, ModelError, validateModel, type ModelDefinition } from "./model";

export interface ActiveModel {
  modelId: string;
  versionId: string;
  name: string;
  version: number;
  scope: "rubro" | "general";
  definition: ModelDefinition;
}

/** Crea el modelo general y un modelo de ejemplo por cada rubro que tenga señales propias. Es idempotente. */
export async function ensureDefaultModels(): Promise<void> {
  const insertModel = async (industryId: string | null, name: string, def: ModelDefinition) => {
    await pool().query(`INSERT INTO scoring_models (industry_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [industryId, name]);
    const m = await pool().query<{ id: string }>(`SELECT id FROM scoring_models WHERE industry_id IS NOT DISTINCT FROM $1`, [industryId]);
    if (!m.rows[0]) return;
    // Un modelo sin ninguna versión se repara con la versión inicial; uno con versiones no se toca.
    await pool().query(
      `INSERT INTO scoring_model_versions (model_id, version, definition, active, note)
       SELECT $1, 1, $2::jsonb, true, 'Versión inicial de ejemplo' WHERE NOT EXISTS (SELECT 1 FROM scoring_model_versions WHERE model_id = $1)
       ON CONFLICT DO NOTHING`,
      [m.rows[0].id, JSON.stringify(def)]);
  };
  await insertModel(null, "Modelo general", validateModel(generalModel()));
  const inds = await pool().query<{ id: string; name: string; slug: string }>(`SELECT id, name, slug FROM industries WHERE is_example AND active`);
  for (const i of inds.rows) {
    const sigs = await pool().query<{ slug: string; name: string }>(`SELECT slug, name FROM industry_signals WHERE industry_id = $1 AND active ORDER BY slug`, [i.id]);
    if (sigs.rows.length) await insertModel(i.id, `Modelo ${i.name}`, industryModel(sigs.rows));
  }
}

export async function getActiveModel(industryId: string | null): Promise<ActiveModel> {
  await ensureDefaultModels();
  const res = await pool().query<{ model_id: string; version_id: string; name: string; version: number; industry_id: string | null; definition: ModelDefinition }>(
    `SELECT m.id AS model_id, v.id AS version_id, m.name, v.version, m.industry_id, v.definition
       FROM scoring_models m JOIN scoring_model_versions v ON v.model_id = m.id AND v.active
      WHERE m.industry_id IS NOT DISTINCT FROM $1 OR m.industry_id IS NULL
      ORDER BY (m.industry_id IS NULL) ASC LIMIT 1`, [industryId]);
  const r = res.rows[0];
  if (!r) throw new ModelError("No hay un modelo de puntaje activo");
  return { modelId: r.model_id, versionId: r.version_id, name: r.name, version: r.version, scope: r.industry_id ? "rubro" : "general", definition: validateModel(r.definition) };
}

export async function getModelVersion(versionId: string): Promise<ActiveModel | null> {
  const res = await pool().query<{ model_id: string; version_id: string; name: string; version: number; industry_id: string | null; definition: ModelDefinition }>(
    `SELECT m.id AS model_id, v.id AS version_id, m.name, v.version, m.industry_id, v.definition
       FROM scoring_model_versions v JOIN scoring_models m ON m.id = v.model_id WHERE v.id = $1`, [versionId]);
  const r = res.rows[0];
  return r ? { modelId: r.model_id, versionId: r.version_id, name: r.name, version: r.version, scope: r.industry_id ? "rubro" : "general", definition: validateModel(r.definition) } : null;
}

export interface ModelListRow { model_id: string; name: string; industry_id: string | null; industry_name: string | null; versions: { id: string; version: number; active: boolean; note: string | null; created_at: Date }[] }

export async function listModels(): Promise<ModelListRow[]> {
  await ensureDefaultModels();
  const res = await pool().query<{ model_id: string; name: string; industry_id: string | null; industry_name: string | null; versions: ModelListRow["versions"] }>(
    `SELECT m.id AS model_id, m.name, m.industry_id, i.name AS industry_name,
            COALESCE((SELECT json_agg(json_build_object('id', v.id, 'version', v.version, 'active', v.active, 'note', v.note, 'created_at', v.created_at) ORDER BY v.version DESC)
                        FROM scoring_model_versions v WHERE v.model_id = m.id), '[]') AS versions
       FROM scoring_models m LEFT JOIN industries i ON i.id = m.industry_id ORDER BY (m.industry_id IS NULL) DESC, m.name`);
  return res.rows;
}

/** Crea una versión nueva (y la activa). Las versiones anteriores quedan intactas para poder reproducir puntajes viejos. */
export async function createModelVersion(actor: ActorInfo, target: { modelId?: string; industryId?: string }, definitionJson: string, note: string): Promise<{ versionId: string; version: number }> {
  requirePermission(actor, "catalog.manage");
  let def: ModelDefinition;
  try { def = validateModel(JSON.parse(definitionJson)); }
  catch (e) { throw e instanceof ModelError ? e : new ModelError("El modelo no es un JSON válido"); }
  const n = cleanText(note, 300);
  if (!n) throw new CompanyError("Indica qué cambió en esta versión");
  await ensureDefaultModels();
  return withTransaction(async (c) => {
    let modelId = target.modelId;
    if (!modelId && target.industryId) {
      const ind = await c.query<{ name: string }>(`SELECT name FROM industries WHERE id = $1`, [target.industryId]);
      if (!ind.rows[0]) throw new CompanyError("Rubro no encontrado");
      const m = await c.query<{ id: string }>(`INSERT INTO scoring_models (industry_id, name) VALUES ($1, $2) ON CONFLICT (industry_id) WHERE industry_id IS NOT NULL DO UPDATE SET name = scoring_models.name RETURNING id`, [target.industryId, `Modelo ${ind.rows[0].name}`]);
      modelId = m.rows[0]!.id;
    }
    if (!modelId) throw new CompanyError("Modelo no indicado");
    await c.query(`SELECT id FROM scoring_models WHERE id = $1 FOR UPDATE`, [modelId]);
    const next = await c.query<{ v: number }>(`SELECT COALESCE(max(version), 0) + 1 AS v FROM scoring_model_versions WHERE model_id = $1`, [modelId]);
    const version = next.rows[0]!.v;
    await c.query(`UPDATE scoring_model_versions SET active = false WHERE model_id = $1 AND active`, [modelId]);
    const ins = await c.query<{ id: string }>(
      `INSERT INTO scoring_model_versions (model_id, version, definition, note, active, created_by) VALUES ($1,$2,$3::jsonb,$4,true,$5) RETURNING id`,
      [modelId, version, JSON.stringify(def), n, actor.id]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "scoring_model.version_created", entityType: "scoring_model", entityId: modelId, metadata: { version, note: n } }, c);
    return { versionId: ins.rows[0]!.id, version };
  });
}

/** Reactiva una versión anterior (no modifica su contenido). */
export async function activateModelVersion(actor: ActorInfo, versionId: string): Promise<void> {
  requirePermission(actor, "catalog.manage");
  await withTransaction(async (c) => {
    const v = await c.query<{ model_id: string; version: number }>(`SELECT model_id, version FROM scoring_model_versions WHERE id = $1`, [versionId]);
    if (!v.rows[0]) throw new CompanyError("Versión no encontrada");
    await c.query(`SELECT id FROM scoring_models WHERE id = $1 FOR UPDATE`, [v.rows[0].model_id]);
    await c.query(`UPDATE scoring_model_versions SET active = false WHERE model_id = $1 AND active`, [v.rows[0].model_id]);
    await c.query(`UPDATE scoring_model_versions SET active = true WHERE id = $1`, [versionId]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "scoring_model.version_activated", entityType: "scoring_model", entityId: v.rows[0].model_id, metadata: { version: v.rows[0].version } }, c);
  });
}

// ---------- Entradas, cálculo y almacenamiento ----------

export async function latestManual(companyId: string): Promise<Record<string, string>> {
  const res = await pool().query<{ key: string; value: string }>(
    `SELECT DISTINCT ON (key) key, value FROM manual_signals WHERE company_id = $1 ORDER BY key, id DESC`, [companyId]);
  return Object.fromEntries(res.rows.filter((r) => r.value !== "").map((r) => [r.key, r.value]));
}

export async function latestAdjustment(companyId: string): Promise<{ delta: number; reason: string; created_at: Date } | null> {
  const res = await pool().query<{ delta: string; reason: string; created_at: Date }>(
    `SELECT delta, reason, created_at FROM score_adjustments WHERE company_id = $1 ORDER BY id DESC LIMIT 1`, [companyId]);
  const r = res.rows[0];
  return r && Number(r.delta) !== 0 ? { delta: Number(r.delta), reason: r.reason, created_at: r.created_at } : null;
}

async function observationsOfRun(runId: string): Promise<(ObservationInput & { numId: string })[]> {
  const res = await pool().query<{ id: string; signal_code: string; status: ObservationInput["status"]; kind: ObservationInput["kind"]; value: Record<string, unknown> | null; confidence: ObservationInput["confidence"]; evidence_url: string | null }>(
    `SELECT id, signal_code, status, kind, value, confidence, evidence_url FROM signal_observations WHERE analysis_run_id = $1 ORDER BY id`, [runId]);
  return res.rows.map((r) => ({ ...r, id: String(r.id), numId: String(r.id) }));
}

export interface StoredScore {
  id: string; company_id: string; analysis_run_id: string | null; model_version_id: string; computed: string; total: string; band: "sales" | "nurturing" | "discard";
  disqualified: boolean; data_coverage: string; breakdown: ScoreResult; reasons: string[]; observation_ids: string[]; manual_snapshot: Record<string, string>;
  adjustment: { delta: number; reason: string } | null; company_snapshot: { classified: boolean; hasDomain: boolean }; as_of: Date; inputs_hash: string; computed_at: Date;
}

/** JSON con claves ordenadas: jsonb no conserva el orden de las claves, así que no se puede comparar el texto tal cual. */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v) ?? "null";
}

const hashInputs = (parts: unknown) => createHash("sha256").update(JSON.stringify(parts)).digest("hex");

/**
 * Calcula y guarda el puntaje de una empresa con su última corrida completada. Si nada cambió desde el último
 * puntaje (mismo modelo, observaciones, criterios manuales y ajuste), no crea otro.
 */
export async function scoreCompany(companyId: string, opts: { asOf?: Date } = {}): Promise<{ score: StoredScore; created: boolean } | null> {
  const c = await pool().query<{ industry_id: string | null; domain: string | null; classification: string; stage: string }>(
    `SELECT industry_id, domain, classification, stage FROM companies WHERE id = $1`, [companyId]);
  const company = c.rows[0];
  if (!company) throw new CompanyError("Empresa no encontrada");
  const run = await pool().query<{ id: string }>(`SELECT id FROM analysis_runs WHERE company_id = $1 AND status = 'completed' ORDER BY finished_at DESC LIMIT 1`, [companyId]);
  if (!run.rows[0]) return null; // sin análisis no hay puntaje
  const [model, observations, manual, adjustment] = await Promise.all([getActiveModel(company.industry_id), observationsOfRun(run.rows[0].id), latestManual(companyId), latestAdjustment(companyId)]);
  const companySnapshot = { classified: company.classification === "classified", hasDomain: Boolean(company.domain) };
  const adj = adjustment ? { delta: adjustment.delta, reason: adjustment.reason } : null;
  const hash = hashInputs({ v: model.versionId, run: run.rows[0].id, obs: observations.map((o) => o.numId), manual: Object.entries(manual).sort(), adj, co: companySnapshot });

  const last = await pool().query<StoredScore>(`SELECT * FROM scores WHERE company_id = $1 ORDER BY computed_at DESC, id LIMIT 1`, [companyId]);
  if (last.rows[0] && last.rows[0].inputs_hash === hash) return { score: last.rows[0], created: false };

  const asOf = opts.asOf ?? new Date();
  const inputs: ScoreInputs = { observations, manual, company: companySnapshot, adjustment: adj, asOf: asOf.toISOString() };
  const result = computeScore(model.definition, inputs);
  const ins = await pool().query<StoredScore>(
    `INSERT INTO scores (company_id, analysis_run_id, model_version_id, computed, total, band, disqualified, data_coverage, breakdown, reasons, observation_ids, manual_snapshot, adjustment, company_snapshot, as_of, inputs_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11::bigint[],$12::jsonb,$13::jsonb,$14::jsonb,$15,$16) RETURNING *`,
    [companyId, run.rows[0].id, model.versionId, result.computed, result.total, result.band, result.disqualified, result.dataCoverage, JSON.stringify(result), result.reasons,
     observations.map((o) => o.numId), JSON.stringify(manual), adj ? JSON.stringify(adj) : null, JSON.stringify(companySnapshot), asOf, hash]);
  if (result.band !== "discard" && company.stage === "analyzed") {
    await pool().query(`UPDATE companies SET stage = 'prioritized', updated_at = now() WHERE id = $1 AND stage = 'analyzed'`, [companyId]);
  }
  return { score: ins.rows[0]!, created: true };
}

export async function latestScore(companyId: string): Promise<(StoredScore & { model_name: string; model_version: number }) | null> {
  const res = await pool().query<StoredScore & { model_name: string; model_version: number }>(
    `SELECT s.*, m.name AS model_name, v.version AS model_version FROM scores s
       JOIN scoring_model_versions v ON v.id = s.model_version_id JOIN scoring_models m ON m.id = v.model_id
      WHERE s.company_id = $1 ORDER BY s.computed_at DESC, s.id LIMIT 1`, [companyId]);
  return res.rows[0] ?? null;
}

/** Recalcula un puntaje guardado a partir de sus entradas congeladas y verifica que dé exactamente lo mismo. */
export async function reproduceScore(scoreId: string): Promise<{ matches: boolean; stored: ScoreResult; recomputed: ScoreResult }> {
  const r = await pool().query<StoredScore>(`SELECT * FROM scores WHERE id = $1`, [scoreId]);
  const s = r.rows[0];
  if (!s) throw new CompanyError("Puntaje no encontrado");
  const model = await getModelVersion(s.model_version_id);
  if (!model) throw new ModelError("No existe la versión del modelo usada");
  const obs = await pool().query<{ id: string; signal_code: string; status: ObservationInput["status"]; kind: ObservationInput["kind"]; value: Record<string, unknown> | null; confidence: ObservationInput["confidence"]; evidence_url: string | null }>(
    `SELECT id, signal_code, status, kind, value, confidence, evidence_url FROM signal_observations WHERE id = ANY($1::bigint[]) ORDER BY id`, [s.observation_ids]);
  const recomputed = computeScore(model.definition, {
    observations: obs.rows.map((o) => ({ ...o, id: String(o.id) })), manual: s.manual_snapshot, company: s.company_snapshot, adjustment: s.adjustment, asOf: new Date(s.as_of).toISOString(),
  });
  return { matches: stableStringify(recomputed) === stableStringify(s.breakdown), stored: s.breakdown, recomputed };
}

// ---------- Criterios manuales y ajustes ----------

export async function setManualCriterion(actor: ActorInfo, companyId: string, key: string, value: string): Promise<void> {
  requirePermission(actor, "companies.write");
  if (!MANUAL_CRITERIA.some((c) => c.key === key)) throw new CompanyError("Criterio desconocido");
  if (value !== "" && !manualOptionValid(key, value)) throw new CompanyError("Valor no válido para este criterio");
  await withTransaction(async (c) => {
    const co = await c.query<{ owner_id: string | null }>(`SELECT owner_id FROM companies WHERE id = $1`, [companyId]);
    if (!co.rows[0]) throw new CompanyError("Empresa no encontrada");
    if (!canModifyOwned(actor, { ownerId: co.rows[0].owner_id }, "companies.write")) throw new CompanyError("Esta empresa pertenece a otro vendedor");
    await c.query(`INSERT INTO manual_signals (company_id, key, value, set_by) VALUES ($1,$2,$3,$4)`, [companyId, key, value, actor.id]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "score.manual_criterion_set", entityType: "company", entityId: companyId, metadata: { key, value } }, c);
  });
}

/** Ajuste manual del puntaje. Exige motivo y queda en la auditoría. Un ajuste de 0 retira el anterior. */
export async function setScoreAdjustment(actor: ActorInfo, companyId: string, delta: number, reason: string): Promise<void> {
  requirePermission(actor, "scoring.adjust");
  const why = cleanText(reason, 300);
  if (!why) throw new CompanyError("El motivo del ajuste es obligatorio");
  if (!Number.isFinite(delta) || Math.abs(delta) > 50) throw new CompanyError("El ajuste debe estar entre -50 y 50 puntos");
  await withTransaction(async (c) => {
    const co = await c.query(`SELECT 1 FROM companies WHERE id = $1`, [companyId]);
    if (co.rowCount === 0) throw new CompanyError("Empresa no encontrada");
    await c.query(`INSERT INTO score_adjustments (company_id, delta, reason, created_by) VALUES ($1,$2,$3,$4)`, [companyId, Math.round(delta * 10) / 10, why, actor.id]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "score.adjusted", entityType: "company", entityId: companyId, metadata: { delta, reason: why } }, c);
  });
}
