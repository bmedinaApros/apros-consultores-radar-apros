import { createHash } from "node:crypto";
import { ZodError } from "zod";
import { audit } from "../audit";
import { COMMON_SIGNALS } from "../analyzer/observations";
import { listIndustrySignals } from "../analyzer/service";
import { findActiveClient, findDoNotContact } from "../companies/exclusions";
import { CompanyError, type ActorInfo } from "../companies/service";
import { pool, withTransaction } from "../db";
import { listOffers } from "../offers/service";
import { can, ForbiddenError, requirePermission, type Role } from "../rbac";
import { stableStringify } from "../scoring/service";
import { resolveProvider, AiCallError, AiRefusalError, type AiProvider } from "./ai";
import { assertWithinBudget, BudgetError, currentSpend, estimateCost, getAiSettings, worstCaseCost } from "./budget";
import { buildSystemPrompt, buildUserMessage, compactValue, PROMPT_VERSION, type GenerationContext, type PromptObservation } from "./prompt";
import { diagnosticSchema, modelJsonSchema, type DiagnosticContent } from "./schema";
import { evaluateStale } from "./stale";
import { validateDiagnostic, type EvidenceObs, type Flag, type ValidationContext } from "./validate";

export class DiagnosticError extends Error {
  override name = "DiagnosticError";
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

// ---------- Plantillas por rubro ----------

export const DEFAULT_GUIDANCE =
  "Usa un lenguaje claro de negocio, sin tecnicismos innecesarios. Habla de consultas, contactos y confianza del visitante. " +
  "Si el rubro no tiene una guía propia, no supongas costumbres, cifras ni problemas típicos del sector: limítate a lo observado en el sitio.";

export interface TemplateInfo { id: string | null; name: string; guidance: string; version: number; scope: "rubro" | "general"; hash: string }

export async function ensureGeneralTemplate(): Promise<void> {
  await pool().query(`INSERT INTO diagnostic_templates (industry_id, name, guidance) VALUES (NULL, 'Plantilla general', $1) ON CONFLICT DO NOTHING`, [DEFAULT_GUIDANCE]);
}

/** La plantilla del rubro, o la general si el rubro no tiene una. */
export async function getTemplate(industryId: string | null): Promise<TemplateInfo> {
  await ensureGeneralTemplate();
  const r = await pool().query<{ id: string; name: string; guidance: string; version: number; industry_id: string | null }>(
    `SELECT id, name, guidance, version, industry_id FROM diagnostic_templates
      WHERE industry_id IS NOT DISTINCT FROM $1 OR industry_id IS NULL ORDER BY (industry_id IS NULL) ASC LIMIT 1`, [industryId]);
  const t = r.rows[0]!;
  return { id: t.id, name: t.name, guidance: t.guidance, version: t.version, scope: t.industry_id ? "rubro" : "general", hash: sha(`${t.id}:${t.version}:${t.guidance}`) };
}

export async function listTemplates() {
  await ensureGeneralTemplate();
  return (await pool().query<{ id: string; industry_id: string | null; industry_name: string | null; name: string; guidance: string; version: number; updated_at: Date }>(
    `SELECT t.id, t.industry_id, i.name AS industry_name, t.name, t.guidance, t.version, t.updated_at FROM diagnostic_templates t LEFT JOIN industries i ON i.id = t.industry_id
      ORDER BY (t.industry_id IS NULL) DESC, i.name`)).rows;
}

export async function saveTemplate(actor: ActorInfo, industryId: string | null, guidance: string): Promise<void> {
  requirePermission(actor, "catalog.manage");
  const g = guidance.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ").trim();
  if (g.length < 10 || g.length > 3000) throw new CompanyError("La guía debe tener entre 10 y 3000 caracteres");
  await ensureGeneralTemplate();
  await withTransaction(async (c) => {
    let name = "Plantilla general";
    if (industryId) {
      const i = await c.query<{ name: string }>(`SELECT name FROM industries WHERE id = $1`, [industryId]);
      if (!i.rows[0]) throw new CompanyError("Rubro no encontrado");
      name = `Plantilla ${i.rows[0].name}`;
    }
    const res = await c.query<{ id: string }>(
      industryId
        ? `INSERT INTO diagnostic_templates (industry_id, name, guidance, updated_by) VALUES ($1,$2,$3,$4)
           ON CONFLICT (industry_id) WHERE industry_id IS NOT NULL DO UPDATE SET guidance = EXCLUDED.guidance, version = diagnostic_templates.version + 1, updated_by = EXCLUDED.updated_by, updated_at = now() RETURNING id`
        : `UPDATE diagnostic_templates SET guidance = $3, version = version + 1, updated_by = $4, updated_at = now() WHERE industry_id IS NULL AND $1::uuid IS NULL AND $2::text IS NOT NULL RETURNING id`,
      [industryId, name, g, actor.id]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "diagnostic_template.saved", entityType: "diagnostic_template", entityId: res.rows[0]?.id ?? "general", metadata: { industryId } }, c);
  });
}

// ---------- Contexto de generación ----------

interface Loaded {
  company: { id: string; legal_name: string; domain: string; industry_id: string | null; industry_name: string | null; owner_id: string | null };
  runId: string;
  scoreId: string | null;
  obsRows: EvidenceObs[];
  gen: GenerationContext;
  validation: ValidationContext;
}

const signalNames = async (): Promise<Map<string, string>> => {
  const m = new Map(COMMON_SIGNALS.map((s) => [s.code, s.name]));
  for (const s of await listIndustrySignals()) m.set(`industry.${s.slug}`, s.name);
  return m;
};

export async function loadContext(companyId: string): Promise<Loaded> {
  const c = await pool().query<{ id: string; legal_name: string; domain: string | null; ruc: string | null; industry_id: string | null; industry_name: string | null; owner_id: string | null }>(
    `SELECT c.id, c.legal_name, c.domain, c.ruc, c.industry_id, i.name AS industry_name, c.owner_id FROM companies c LEFT JOIN industries i ON i.id = c.industry_id WHERE c.id = $1`, [companyId]);
  const co = c.rows[0];
  if (!co) throw new DiagnosticError("Empresa no encontrada");
  if (!co.domain) throw new DiagnosticError("La empresa no tiene sitio web conocido: no hay evidencia para un diagnóstico");
  if (await findDoNotContact({ name: co.legal_name, domain: co.domain, ruc: co.ruc })) throw new DiagnosticError("La empresa está en la lista de no contactar");
  if (await findActiveClient({ name: co.legal_name, domain: co.domain, ruc: co.ruc })) throw new DiagnosticError("La empresa es cliente activo");
  const run = await pool().query<{ id: string }>(`SELECT id FROM analysis_runs WHERE company_id = $1 AND status = 'completed' ORDER BY finished_at DESC LIMIT 1`, [companyId]);
  if (!run.rows[0]) throw new DiagnosticError("Aún no hay un análisis web completado de esta empresa");
  const obs = await pool().query<{ id: string; signal_code: string; status: EvidenceObs["status"]; kind: EvidenceObs["kind"]; confidence: EvidenceObs["confidence"]; value: Record<string, unknown> | null; evidence_excerpt: string | null; evidence_url: string | null }>(
    `SELECT id::text AS id, signal_code, status, kind, confidence, value, evidence_excerpt, evidence_url FROM signal_observations WHERE analysis_run_id = $1 ORDER BY id`, [run.rows[0].id]);
  const usable = obs.rows.filter((o) => o.status !== "unverifiable");
  if (usable.length < 3) throw new DiagnosticError("No hay evidencia suficiente: el sitio no se pudo leer. Un fallo de lectura no es un hallazgo.");
  const score = await pool().query<{ id: string }>(`SELECT id FROM scores WHERE company_id = $1 ORDER BY computed_at DESC LIMIT 1`, [companyId]);
  const names = await signalNames();
  const offers = await listOffers(false);
  const gen: GenerationContext = {
    company: { name: co.legal_name, domain: co.domain, industry: co.industry_name },
    observations: usable.map((o): PromptObservation => ({
      id: o.id, signal: o.signal_code, signalName: names.get(o.signal_code) ?? o.signal_code, status: o.status as "observed" | "not_detected", kind: o.kind, confidence: o.confidence,
      value: compactValue(o.value), excerpt: o.evidence_excerpt,
    })),
    unverified: obs.rows.filter((o) => o.status === "unverifiable").map((o) => names.get(o.signal_code) ?? o.signal_code),
    offers: offers.map((o) => ({ slug: o.slug, name: o.name })),
  };
  return {
    company: { id: co.id, legal_name: co.legal_name, domain: co.domain, industry_id: co.industry_id, industry_name: co.industry_name, owner_id: co.owner_id },
    runId: run.rows[0].id, scoreId: score.rows[0]?.id ?? null, obsRows: obs.rows, gen,
    validation: { observations: new Map(obs.rows.map((o) => [o.id, o])), companyDomain: co.domain, serviceSlugs: new Set(offers.map((o) => o.slug)) },
  };
}

// ---------- Generación ----------

export interface GenerateResult { diagnosticId: string; versionId: string; version: number; flags: Flag[]; blocking: number; generationId: string }

async function recordGeneration(g: {
  companyId: string; diagnosticId?: string | null; provider: string; model: string; templateHash: string; status: "ok" | "invalid_output" | "refused" | "error" | "budget_blocked";
  inputTokens?: number; outputTokens?: number; cacheReadTokens?: number; cost?: number; error?: string; durationMs?: number; raw?: unknown; requestedBy: string | null;
}): Promise<string> {
  const r = await pool().query<{ id: string }>(
    `INSERT INTO ai_generations (diagnostic_id, company_id, provider, model, prompt_version, template_hash, input_tokens, output_tokens, cache_read_tokens, estimated_cost_usd, status, error, duration_ms, raw_output, requested_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15) RETURNING id`,
    [g.diagnosticId ?? null, g.companyId, g.provider, g.model, PROMPT_VERSION, g.templateHash, g.inputTokens ?? 0, g.outputTokens ?? 0, g.cacheReadTokens ?? 0, g.cost ?? 0, g.status, g.error?.slice(0, 300) ?? null,
     g.durationMs ?? 0, g.raw === undefined ? null : JSON.stringify(g.raw).slice(0, 60000), g.requestedBy]);
  return r.rows[0]!.id;
}

const citedIds = (c: DiagnosticContent): string[] => [...new Set(c.opportunities.flatMap((o) => o.evidence))];

async function insertVersion(
  c: { query: (sql: string, p?: unknown[]) => Promise<{ rows: { id: string; version?: number }[] }> },
  d: { diagnosticId: string; source: "ai" | "rules" | "simulated" | "human_edit"; content: DiagnosticContent; flags: Flag[]; evidenceRunId: string | null; scoreId: string | null; generationId: string | null; templateHash: string | null; editedBy: string | null },
): Promise<{ id: string; version: number }> {
  const next = await c.query(`SELECT COALESCE(max(version), 0) + 1 AS v FROM diagnostic_versions WHERE diagnostic_id = $1`, [d.diagnosticId]);
  const version = Number((next.rows[0] as unknown as { v: number }).v);
  const blocking = d.flags.filter((f) => f.blocking).length;
  const ins = await c.query(
    `INSERT INTO diagnostic_versions (diagnostic_id, version, source, content, flags, blocking_flags, evidence_run_id, observation_ids, score_id, generation_id, template_hash, content_hash, edited_by)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8::bigint[],$9,$10,$11,$12,$13) RETURNING id`,
    [d.diagnosticId, version, d.source, JSON.stringify(d.content), JSON.stringify(d.flags), blocking, d.evidenceRunId, citedIds(d.content), d.scoreId, d.generationId, d.templateHash, sha(stableStringify(d.content)), d.editedBy]);
  return { id: ins.rows[0]!.id, version };
}

export interface GenerateDeps { provider?: AiProvider | null }

/**
 * Genera (o regenera) el diagnóstico de una empresa con IA. Toda salida se trata como no confiable: se valida contra el
 * esquema, se limpia y se marca lo que no tiene evidencia. Cada intento, bueno o malo, queda registrado con su costo.
 */
export async function generateDiagnostic(actor: ActorInfo, companyId: string, deps: GenerateDeps = {}): Promise<GenerateResult> {
  requirePermission(actor, "diagnostics.write");
  const provider = deps.provider === undefined ? resolveProvider() : deps.provider;
  if (!provider) throw new DiagnosticError("La IA no está configurada. Define AI_PROVIDER y ANTHROPIC_API_KEY (ver README).");
  const L = await loadContext(companyId);
  const template = await getTemplate(L.company.industry_id);
  const settings = await getAiSettings();
  const system = buildSystemPrompt(template.guidance);
  const user = buildUserMessage(L.gen);
  const maxTokens = settings.maxOutputTokens;
  const base = { companyId, provider: provider.id, model: provider.model, templateHash: template.hash, requestedBy: actor.id };

  // Presupuesto: se comprueba el peor caso ANTES de llamar al modelo
  const worst = provider.id === "rules" ? 0 : worstCaseCost(provider.model, system.length + user.length, maxTokens);
  try {
    assertWithinBudget(settings, await currentSpend(), worst);
  } catch (e) {
    if (e instanceof BudgetError) await recordGeneration({ ...base, status: "budget_blocked", error: e.message });
    throw e;
  }

  const t0 = Date.now();
  let out;
  try {
    out = await provider.generate({ system, user, schema: modelJsonSchema(), maxTokens, context: L.gen });
  } catch (e) {
    const status = e instanceof AiRefusalError ? "refused" : "error";
    await recordGeneration({ ...base, status, error: (e as Error).message, durationMs: Date.now() - t0 });
    if (e instanceof AiRefusalError) throw new DiagnosticError("El modelo declinó generar este diagnóstico. Un consultor puede redactarlo a mano.");
    if (e instanceof AiCallError) throw e;
    throw new DiagnosticError("No se pudo generar el diagnóstico");
  }
  const cost = estimateCost(out.model, { inputTokens: out.inputTokens, outputTokens: out.outputTokens, cacheReadTokens: out.cacheReadTokens });
  const usage = { inputTokens: out.inputTokens, outputTokens: out.outputTokens, cacheReadTokens: out.cacheReadTokens, cost, durationMs: Date.now() - t0 };

  let parsedRaw: unknown;
  let validated;
  try {
    parsedRaw = JSON.parse(out.text);
    validated = validateDiagnostic(parsedRaw, L.validation);
  } catch (e) {
    const why = e instanceof ZodError ? `La salida no cumple el esquema (${e.issues.slice(0, 2).map((i) => i.path.join(".")).join(", ")})` : "La salida no es JSON válido";
    await recordGeneration({ ...base, ...usage, status: "invalid_output", error: why, raw: { text: out.text.slice(0, 20000) } });
    throw new DiagnosticError(`${why}. No se guardó ningún diagnóstico; puedes reintentar.`);
  }

  const generationId = await recordGeneration({ ...base, ...usage, status: "ok", raw: parsedRaw });
  const source = provider.id === "rules" ? "rules" : "ai";
  return withTransaction(async (c) => {
    const ex = await c.query<{ id: string; status: string }>(`SELECT id, status FROM diagnostics WHERE company_id = $1 FOR UPDATE`, [companyId]);
    let diagnosticId = ex.rows[0]?.id;
    if (!diagnosticId) {
      const ins = await c.query<{ id: string }>(`INSERT INTO diagnostics (company_id, created_by) VALUES ($1, $2) RETURNING id`, [companyId, actor.id]);
      diagnosticId = ins.rows[0]!.id;
      await c.query(`INSERT INTO diagnostic_events (diagnostic_id, action, actor_id) VALUES ($1, 'created', $2)`, [diagnosticId, actor.id]);
    }
    const v = await insertVersion(c as never, { diagnosticId, source, content: validated.content, flags: validated.flags, evidenceRunId: L.runId, scoreId: L.scoreId, generationId, templateHash: template.hash, editedBy: null });
    await c.query(`UPDATE diagnostics SET current_version_id = $2, status = 'draft', stale = false, stale_reason = NULL, approved_version_id = NULL, approved_by = NULL, approved_at = NULL, updated_at = now() WHERE id = $1`, [diagnosticId, v.id]);
    await c.query(`INSERT INTO diagnostic_events (diagnostic_id, version_id, action, actor_id, note) VALUES ($1,$2,'generated',$3,$4)`, [diagnosticId, v.id, actor.id, `${provider.id}:${provider.model} · ${validated.blocking} marcas bloqueantes`]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "diagnostic.generated", entityType: "diagnostic", entityId: diagnosticId, metadata: { version: v.version, provider: provider.id, model: provider.model, cost, blocking: validated.blocking } }, c);
    return { diagnosticId, versionId: v.id, version: v.version, flags: validated.flags, blocking: validated.blocking, generationId };
  });
}

// ---------- Edición, revisión y aprobación ----------

interface DiagRow {
  id: string; company_id: string; status: "draft" | "in_review" | "approved" | "rejected"; stale: boolean; stale_reason: string | null;
  current_version_id: string | null; approved_version_id: string | null; created_by: string | null; approved_by: string | null; approved_at: Date | null; updated_at: Date;
}
interface VersionRow {
  id: string; diagnostic_id: string; version: number; source: "ai" | "rules" | "simulated" | "human_edit"; content: DiagnosticContent; flags: Flag[]; blocking_flags: number;
  evidence_run_id: string | null; observation_ids: string[]; created_at: Date; edited_by: string | null; generation_id: string | null;
}

async function loadDiag(id: string, lock = false): Promise<{ d: DiagRow; v: VersionRow }> {
  const d = await pool().query<DiagRow>(`SELECT id, company_id, status, stale, stale_reason, current_version_id, approved_version_id, created_by, approved_by, approved_at, updated_at FROM diagnostics WHERE id = $1 ${lock ? "FOR UPDATE" : ""}`, [id]);
  if (!d.rows[0]) throw new DiagnosticError("Diagnóstico no encontrado");
  const v = await pool().query<VersionRow>(`SELECT id, diagnostic_id, version, source, content, flags, blocking_flags, evidence_run_id, observation_ids::text[] AS observation_ids, created_at, edited_by, generation_id FROM diagnostic_versions WHERE id = $1`, [d.rows[0].current_version_id]);
  if (!v.rows[0]) throw new DiagnosticError("El diagnóstico no tiene versiones");
  return { d: d.rows[0], v: v.rows[0] };
}

async function event(c: { query: (sql: string, p?: unknown[]) => Promise<unknown> }, diagnosticId: string, versionId: string | null, action: string, actorId: string | null, note: string | null = null) {
  await c.query(`INSERT INTO diagnostic_events (diagnostic_id, version_id, action, actor_id, note) VALUES ($1,$2,$3,$4,$5)`, [diagnosticId, versionId, action, actorId, note]);
}

/** Una persona edita el texto: se vuelve a validar con las mismas reglas y se crea una versión nueva. */
export async function editDiagnostic(actor: ActorInfo, diagnosticId: string, content: unknown, note?: string): Promise<{ versionId: string; version: number; flags: Flag[]; blocking: number }> {
  requirePermission(actor, "diagnostics.write");
  const { d, v } = await loadDiag(diagnosticId);
  const L = await loadValidationFor(d.company_id, v.evidence_run_id);
  let validated;
  try {
    validated = validateDiagnostic(content, L);
  } catch (e) {
    if (e instanceof ZodError) throw new DiagnosticError(`El texto no cumple el formato: ${e.issues.slice(0, 2).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    throw e;
  }
  return withTransaction(async (c) => {
    await c.query(`SELECT id FROM diagnostics WHERE id = $1 FOR UPDATE`, [diagnosticId]);
    const nv = await insertVersion(c as never, { diagnosticId, source: "human_edit", content: validated.content, flags: validated.flags, evidenceRunId: v.evidence_run_id, scoreId: null, generationId: null, templateHash: null, editedBy: actor.id });
    await c.query(`UPDATE diagnostics SET current_version_id = $2, status = 'draft', approved_version_id = NULL, approved_by = NULL, approved_at = NULL, updated_at = now() WHERE id = $1`, [diagnosticId, nv.id]);
    await event(c, diagnosticId, nv.id, "edited", actor.id, cleanNote(note));
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "diagnostic.edited", entityType: "diagnostic", entityId: diagnosticId, metadata: { version: nv.version, blocking: validated.blocking } }, c);
    return { versionId: nv.id, version: nv.version, flags: validated.flags, blocking: validated.blocking };
  });
}

const cleanNote = (n?: string | null) => (n ? n.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 300) || null : null);

/** Observaciones que se pueden citar al editar: las de la corrida que sirvió de evidencia a esta versión. */
async function loadValidationFor(companyId: string, runId: string | null): Promise<ValidationContext> {
  const co = await pool().query<{ domain: string | null }>(`SELECT domain FROM companies WHERE id = $1`, [companyId]);
  const obs = await pool().query<EvidenceObs>(
    `SELECT id::text AS id, signal_code, status, kind, confidence, value, evidence_excerpt, evidence_url FROM signal_observations WHERE analysis_run_id = $1`, [runId]);
  const offers = await listOffers(false);
  return { observations: new Map(obs.rows.map((o) => [o.id, o])), companyDomain: co.rows[0]?.domain ?? null, serviceSlugs: new Set(offers.map((o) => o.slug)) };
}

export async function submitForReview(actor: ActorInfo, diagnosticId: string): Promise<void> {
  requirePermission(actor, "diagnostics.write");
  const { d, v } = await loadDiag(diagnosticId);
  if (d.status !== "draft") throw new DiagnosticError("Solo un borrador se envía a revisión");
  if (v.blocking_flags > 0) throw new DiagnosticError(`Hay ${v.blocking_flags} afirmaciones marcadas: corrígelas antes de enviar a revisión.`);
  const stale = await evaluateStale(diagnosticId);
  if (stale.stale) throw new DiagnosticError(`El diagnóstico está desactualizado (${stale.reason}). Regéneralo con el análisis más reciente.`);
  await withTransaction(async (c) => {
    await c.query(`UPDATE diagnostics SET status = 'in_review', updated_at = now() WHERE id = $1 AND status = 'draft'`, [diagnosticId]);
    await event(c, diagnosticId, v.id, "submitted", actor.id);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "diagnostic.submitted", entityType: "diagnostic", entityId: diagnosticId }, c);
  });
}

/** Aprobar exige: en revisión, sin marcas bloqueantes y con la evidencia vigente (se vuelve a comprobar en este momento). */
export async function approveDiagnostic(actor: ActorInfo, diagnosticId: string): Promise<void> {
  requirePermission(actor, "diagnostics.approve");
  await withTransaction(async (c) => {
    const dr = await c.query<DiagRow>(`SELECT id, company_id, status, current_version_id FROM diagnostics WHERE id = $1 FOR UPDATE`, [diagnosticId]);
    const d = dr.rows[0];
    if (!d) throw new DiagnosticError("Diagnóstico no encontrado");
    if (d.status !== "in_review") throw new DiagnosticError("Solo se aprueba un diagnóstico que está en revisión");
    const vr = await c.query<{ blocking_flags: number }>(`SELECT blocking_flags FROM diagnostic_versions WHERE id = $1`, [d.current_version_id]);
    if ((vr.rows[0]?.blocking_flags ?? 1) > 0) throw new DiagnosticError("Hay afirmaciones marcadas sin resolver: no se puede aprobar.");
    const stale = await evaluateStale(diagnosticId);
    if (stale.stale) throw new DiagnosticError(`El diagnóstico está desactualizado (${stale.reason}). Regéneralo antes de aprobar.`);
    // Una empresa que entró después a no contactar o a clientes no se aprueba
    const co = await c.query<{ legal_name: string; domain: string | null; ruc: string | null }>(`SELECT legal_name, domain, ruc FROM companies WHERE id = $1`, [d.company_id]);
    const x = co.rows[0]!;
    if (await findDoNotContact({ name: x.legal_name, domain: x.domain, ruc: x.ruc }, c) || await findActiveClient({ name: x.legal_name, domain: x.domain, ruc: x.ruc }, c)) {
      throw new DiagnosticError("La empresa está ahora en no contactar o es cliente activo: no se puede aprobar.");
    }
    await c.query(`UPDATE diagnostics SET status = 'approved', approved_version_id = current_version_id, approved_by = $2, approved_at = now(), stale = false, stale_reason = NULL, updated_at = now() WHERE id = $1`, [diagnosticId, actor.id]);
    await event(c, diagnosticId, d.current_version_id, "approved", actor.id);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "diagnostic.approved", entityType: "diagnostic", entityId: diagnosticId }, c);
  });
}

export async function rejectDiagnostic(actor: ActorInfo, diagnosticId: string, reason: string): Promise<void> {
  requirePermission(actor, "diagnostics.approve");
  const why = cleanNote(reason);
  if (!why) throw new DiagnosticError("El motivo del rechazo es obligatorio");
  await withTransaction(async (c) => {
    const dr = await c.query<DiagRow>(`SELECT id, status, current_version_id FROM diagnostics WHERE id = $1 FOR UPDATE`, [diagnosticId]);
    const d = dr.rows[0];
    if (!d) throw new DiagnosticError("Diagnóstico no encontrado");
    if (d.status !== "in_review") throw new DiagnosticError("Solo se rechaza un diagnóstico que está en revisión");
    await c.query(`UPDATE diagnostics SET status = 'rejected', updated_at = now() WHERE id = $1`, [diagnosticId]);
    await event(c, diagnosticId, d.current_version_id, "rejected", actor.id, why);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "diagnostic.rejected", entityType: "diagnostic", entityId: diagnosticId, metadata: { reason: why } }, c);
  });
}

// ---------- Consulta ----------

export interface DiagnosticSummary {
  id: string; company_id: string; company_name: string; company_domain: string | null; status: DiagRow["status"]; stale: boolean; version: number; blocking_flags: number; source: string; updated_at: Date; owner_id: string | null;
}

// Todos los usuarios con acceso ven todos los diagnósticos (D-62). Exportar sigue exigiendo que estén aprobados.

export async function listDiagnostics(actor: { id: string; role: Role }, f: { status?: string } = {}): Promise<DiagnosticSummary[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.status) { params.push(f.status); where.push(`d.status = $${params.length}`); }
  return (await pool().query<DiagnosticSummary>(
    `SELECT d.id, d.company_id, c.legal_name AS company_name, c.domain AS company_domain, d.status, d.stale, v.version, v.blocking_flags, v.source, d.updated_at, c.owner_id
       FROM diagnostics d JOIN companies c ON c.id = d.company_id JOIN diagnostic_versions v ON v.id = d.current_version_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY d.updated_at DESC LIMIT 200`, params)).rows;
}

export interface DiagnosticDetail {
  diagnostic: DiagRow & { company_name: string; company_domain: string | null; owner_id: string | null; industry_name: string | null; approved_by_email: string | null; created_by_email: string | null };
  version: VersionRow;
  versions: { id: string; version: number; source: string; blocking_flags: number; created_at: Date; edited_by_email: string | null }[];
  evidence: Map<string, EvidenceObs>;
  events: { id: string; action: string; note: string | null; at: Date; actor_email: string | null; version: number | null }[];
  generations: { id: string; provider: string; model: string; prompt_version: string; status: string; input_tokens: number; output_tokens: number; estimated_cost_usd: string; created_at: Date; error: string | null }[];
}

export async function getDiagnosticDetail(actor: { id: string; role: Role }, id: string): Promise<DiagnosticDetail | null> {
  const dr = await pool().query<DiagnosticDetail["diagnostic"]>(
    `SELECT d.id, d.company_id, d.status, d.stale, d.stale_reason, d.current_version_id, d.approved_version_id, d.created_by, d.approved_by, d.approved_at, d.updated_at,
            c.legal_name AS company_name, c.domain AS company_domain, c.owner_id, i.name AS industry_name, ua.email AS approved_by_email, uc.email AS created_by_email
       FROM diagnostics d JOIN companies c ON c.id = d.company_id LEFT JOIN industries i ON i.id = c.industry_id LEFT JOIN users ua ON ua.id = d.approved_by LEFT JOIN users uc ON uc.id = d.created_by WHERE d.id = $1`, [id]);
  const d = dr.rows[0];
  if (!d || !can(actor.role, "companies.read")) return null;
  const { v } = await loadDiag(id);
  const [versions, events, gens] = await Promise.all([
    pool().query(`SELECT v.id, v.version, v.source, v.blocking_flags, v.created_at, u.email AS edited_by_email FROM diagnostic_versions v LEFT JOIN users u ON u.id = v.edited_by WHERE v.diagnostic_id = $1 ORDER BY v.version DESC`, [id]),
    pool().query(`SELECT e.id, e.action, e.note, e.at, u.email AS actor_email, v.version FROM diagnostic_events e LEFT JOIN users u ON u.id = e.actor_id LEFT JOIN diagnostic_versions v ON v.id = e.version_id WHERE e.diagnostic_id = $1 ORDER BY e.id DESC LIMIT 100`, [id]),
    pool().query(`SELECT g.id, g.provider, g.model, g.prompt_version, g.status, g.input_tokens, g.output_tokens, g.estimated_cost_usd, g.created_at, g.error
                      FROM ai_generations g WHERE g.company_id = $1 ORDER BY g.created_at DESC LIMIT 20`, [d.company_id]),
  ]);
  const ev = await pool().query<EvidenceObs>(`SELECT id::text AS id, signal_code, status, kind, confidence, value, evidence_excerpt, evidence_url FROM signal_observations WHERE id = ANY($1::bigint[])`, [v.observation_ids]);
  return {
    diagnostic: d, version: v, versions: versions.rows as DiagnosticDetail["versions"], evidence: new Map(ev.rows.map((o) => [o.id, o])),
    events: events.rows as DiagnosticDetail["events"], generations: gens.rows as DiagnosticDetail["generations"],
  };
}

// ---------- Exportación ----------

export interface Exportable {
  diagnosticId: string; versionId: string; version: number; content: DiagnosticContent; companyName: string; companyDomain: string; industryName: string | null;
  approvedAt: Date; evidence: Map<string, EvidenceObs>; evidenceDate: Date | null;
}

/**
 * Único camino para sacar un diagnóstico del sistema. Se comprueba en el servidor, cada vez:
 * aprobado, la versión aprobada es la vigente, sin marcas bloqueantes y con la evidencia al día.
 */
export async function loadExportable(actor: { id: string; role: Role }, diagnosticId: string): Promise<Exportable> {
  if (!can(actor.role, "diagnostics.export")) throw new ForbiddenError("No tienes permiso para exportar diagnósticos");
  const detail = await getDiagnosticDetail(actor, diagnosticId);
  if (!detail) throw new DiagnosticError("Diagnóstico no encontrado");
  const { diagnostic: d, version: v } = detail;
  if (d.status !== "approved" || !d.approved_version_id || !d.approved_at) throw new DiagnosticError("Solo un diagnóstico aprobado se puede exportar");
  if (d.approved_version_id !== d.current_version_id) throw new DiagnosticError("La versión aprobada no es la vigente: vuelve a aprobarla");
  if (v.blocking_flags > 0) throw new DiagnosticError("Hay afirmaciones marcadas: no se puede exportar");
  const stale = await evaluateStale(diagnosticId);
  if (stale.stale) {
    await pool().query(`UPDATE diagnostics SET stale = true, stale_reason = $2 WHERE id = $1`, [diagnosticId, stale.reason]);
    throw new DiagnosticError(`El diagnóstico está desactualizado (${stale.reason}): regéneralo y vuelve a aprobarlo`);
  }
  if (d.stale) throw new DiagnosticError(`El diagnóstico está desactualizado (${d.stale_reason ?? "evidencia cambiada"})`);
  const run = v.evidence_run_id ? await pool().query<{ finished_at: Date }>(`SELECT finished_at FROM analysis_runs WHERE id = $1`, [v.evidence_run_id]) : null;
  return {
    diagnosticId, versionId: v.id, version: v.version, content: diagnosticSchema.parse(v.content), companyName: d.company_name, companyDomain: d.company_domain ?? "",
    industryName: d.industry_name, approvedAt: d.approved_at, evidence: detail.evidence, evidenceDate: run?.rows[0]?.finished_at ?? null,
  };
}

export async function recordExport(actor: ActorInfo, x: { diagnosticId: string; versionId: string; format: "pdf" | "pptx"; bytes: Buffer }): Promise<void> {
  await withTransaction(async (c) => {
    await c.query(`INSERT INTO diagnostic_exports (diagnostic_id, version_id, format, sha256, bytes, exported_by) VALUES ($1,$2,$3,$4,$5,$6)`, [x.diagnosticId, x.versionId, x.format, createHash("sha256").update(x.bytes).digest("hex"), x.bytes.length, actor.id]);
    await event(c, x.diagnosticId, x.versionId, `exported_${x.format}`, actor.id);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "diagnostic.exported", entityType: "diagnostic", entityId: x.diagnosticId, metadata: { format: x.format, bytes: x.bytes.length } }, c);
  });
}

// ---------- Lote para el piloto ----------

export const BATCH_MAX = 30;

/** Empresas aprobadas de una lista semanal que aún no tienen diagnóstico (máximo BATCH_MAX por lote). */
export async function companiesNeedingDiagnostic(listId: string, limit = BATCH_MAX): Promise<{ companyId: string; name: string }[]> {
  const r = await pool().query<{ company_id: string; company_name: string }>(
    `SELECT i.company_id, i.company_name FROM weekly_list_items i
      WHERE i.list_id = $1 AND i.review_status = 'approved' AND i.company_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM diagnostics d WHERE d.company_id = i.company_id)
      ORDER BY i.rank LIMIT $2`, [listId, Math.min(Math.max(limit, 1), BATCH_MAX)]);
  return r.rows.map((x) => ({ companyId: x.company_id, name: x.company_name }));
}
