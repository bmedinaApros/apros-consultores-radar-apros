import { audit } from "../audit";
import { analyzeCompany, type AnalyzerDeps } from "../analyzer/run";
import { signalChanges } from "../analyzer/service";
import { pool, withTransaction } from "../db";
import { findActiveClient, findDoNotContact } from "../companies/exclusions";
import { buildFacts } from "../scoring/engine";
import { getModelVersion, scoreCompany } from "../scoring/service";
import { listOffers, matchServices } from "../offers/service";
import { runDiscoveryInternal } from "../sources/service";
import { companiesNeedingWebsite, discoverWebsite, WEBSITE_BUDGET } from "../companies/discover-web";
import { researchProviderFromEnv, type ResearchProvider } from "../research/provider";
import { researchBatch } from "../research/service";
import { getWeeklySettings, weekStartLima, type WeeklySettings } from "./settings";
import type { ObservationInput } from "../scoring/engine";

export interface PipelineDeps {
  analyzer: AnalyzerDeps;
  now?: () => Date;
  /** Para pruebas: evita ejecutar el descubrimiento real. */
  skipDiscovery?: boolean;
  /** Proveedor de investigación (Grok). Por defecto el del entorno; null = sin proveedor (se adivinan dominios). */
  research?: ResearchProvider | null;
  /** Para pruebas: descargador usado para validar los sitios que propone el proveedor. */
  researchWeb?: import("../companies/web").WebDeps;
}

export interface RunStats {
  discovery: { provider: string; found: number; created: number; error?: string }[];
  /** Búsqueda automática del sitio web de empresas que no lo tenían. */
  websites?: { tried: number; assigned: number; pending: number };
  /** Investigación con Grok: empresas consultadas, sitios hallados, contactos y gasto estimado (USD). */
  research?: { tried: number; websites: number; contacts: number; costUsd: number; stoppedForBudget: boolean; errors: number };
  candidates: number;
  analyzed: number;
  analysisSkippedForBudget: number;
  scored: number;
  eligible: number;
  excluded: Record<string, number>;
  partial: boolean;
  partialReasons: string[];
}

export interface PipelineResult { runId: string; listId: string | null; stats: RunStats }

/** Cambios que justifican que una empresa ya listada vuelva a aparecer. */
const RELEVANT = /^(meas\.|conv\.|seo\.(title|meta_description|h1|indexable|sitemap)|tech\.(tls|cms)|perf\.|sd\.)/;

export async function relevantChanges(companyId: string): Promise<string[]> {
  return (await signalChanges(companyId)).filter((c) => RELEVANT.test(c.signal_code)).map((c) => c.signal_code);
}

export class RunInProgressError extends Error {
  override name = "RunInProgressError";
}

/**
 * Ejecución semanal: descubrir → analizar (con presupuesto) → puntuar → emparejar servicios → guardar la lista.
 * Cada etapa es idempotente: si se interrumpe y se vuelve a ejecutar, no repite análisis vigentes ni duplica puntajes.
 * Si se agota un presupuesto, se conserva todo lo hecho y la lista queda marcada como «cobertura parcial».
 */
export async function runWeeklyPipeline(
  opts: { triggeredBy: string | null; kind: "manual" | "schedule" },
  deps: PipelineDeps,
): Promise<PipelineResult> {
  const now = deps.now ?? (() => new Date());
  const settings = await getWeeklySettings();
  const weekStart = weekStartLima(now());

  // Una sola ejecución a la vez.
  const running = await pool().query(`SELECT 1 FROM weekly_runs WHERE status = 'running' AND started_at > now() - interval '6 hours'`);
  if (running.rowCount) throw new RunInProgressError("Ya hay una ejecución semanal en curso");
  const run = await pool().query<{ id: string }>(
    `INSERT INTO weekly_runs (week_start, triggered_by, trigger_kind) VALUES ($1,$2,$3) RETURNING id`, [weekStart, opts.triggeredBy, opts.kind]);
  const runId = run.rows[0]!.id;

  const stats: RunStats = { discovery: [], candidates: 0, analyzed: 0, analysisSkippedForBudget: 0, scored: 0, eligible: 0, excluded: {}, partial: false, partialReasons: [] };

  try {
    // 1) Descubrimiento con las fuentes activas (cada una falla por separado)
    if (!deps.skipDiscovery) {
      const enabled = await pool().query<{ code: string }>(`SELECT code FROM source_providers WHERE enabled`);
      for (const p of enabled.rows) {
        try {
          const r = await runDiscoveryInternal(p.code, opts.triggeredBy);
          stats.discovery.push({ provider: p.code, found: r.found, created: r.created });
        } catch (e) {
          stats.discovery.push({ provider: p.code, found: 0, created: 0, error: e instanceof Error ? e.message.slice(0, 120) : "error" });
          stats.partial = true;
          stats.partialReasons.push(`La fuente «${p.code}» falló`);
        }
      }
    }

    // 1b) Sitio web y contactos de las empresas: con Grok (búsqueda web) si hay clave; si no, se prueban direcciones probables.
    if (!deps.skipDiscovery) {
      const provider = deps.research === undefined ? researchProviderFromEnv() : deps.research;
      if (provider) {
        const r = await researchBatch(provider, { webDeps: deps.researchWeb });
        stats.research = r;
        if (r.stoppedForBudget) { stats.partial = true; stats.partialReasons.push("Se alcanzó el tope de gasto de la investigación con Grok; quedaron empresas sin investigar"); }
      } else {
        const w = { tried: 0, assigned: 0, pending: 0 };
        for (const c of await companiesNeedingWebsite(WEBSITE_BUDGET)) {
          w.tried++;
          try {
            const r = await discoverWebsite(c.id, { fetcher: deps.analyzer.fetcher, userAgent: deps.analyzer.userAgent, timeoutMs: 8000 });
            if (r.assigned) w.assigned++;
            w.pending += r.pending.length;
          } catch { /* una empresa que falla no detiene la ejecución */ }
        }
        stats.websites = w;
      }
    }

    // 2) Candidatos a analizar: con sitio, sin bloqueo, y sin análisis vigente. Primero los nunca analizados.
    const cands = await pool().query<{ id: string; legal_name: string; domain: string; ruc: string | null }>(
      `SELECT c.id, c.legal_name, c.domain, c.ruc FROM companies c
        WHERE c.domain IS NOT NULL AND c.stage IN ('detected', 'analyzed', 'prioritized')
          AND NOT EXISTS (SELECT 1 FROM analysis_runs a WHERE a.company_id = c.id AND a.status = 'completed'
                            AND a.finished_at > now() - ($1::int * interval '1 day'))
        ORDER BY (SELECT max(a.finished_at) FROM analysis_runs a WHERE a.company_id = c.id) NULLS FIRST, c.created_at`, [settings.reanalyzeAfterDays]);
    stats.candidates = cands.rows.length;
    let analyses = 0;
    for (const c of cands.rows) {
      if (analyses >= settings.analysisBudget) { stats.analysisSkippedForBudget = cands.rows.length - analyses; break; }
      if (await findDoNotContact({ name: c.legal_name, domain: c.domain, ruc: c.ruc }) || await findActiveClient({ name: c.legal_name, domain: c.domain, ruc: c.ruc })) continue;
      analyses++;
      try {
        const r = await analyzeCompany(c.id, { triggeredBy: opts.triggeredBy, deps: deps.analyzer });
        if (r.status === "completed" && !r.cached) stats.analyzed++;
      } catch {
        stats.partial = true;
      }
    }
    if (stats.analysisSkippedForBudget > 0) {
      stats.partial = true;
      stats.partialReasons.push(`Se agotó el presupuesto de análisis (${settings.analysisBudget}); ${stats.analysisSkippedForBudget} empresas quedaron sin analizar`);
    }

    // 3) Puntuar todas las empresas con análisis completado (no duplica si nada cambió)
    const toScore = await pool().query<{ id: string }>(
      `SELECT DISTINCT c.id FROM companies c JOIN analysis_runs a ON a.company_id = c.id AND a.status = 'completed'
        WHERE c.stage IN ('detected', 'analyzed', 'prioritized')`);
    for (const c of toScore.rows) {
      const r = await scoreCompany(c.id, { asOf: now() });
      if (r?.created) stats.scored++;
    }

    // 4) Elegibles → lista
    const items = await buildItems(settings, stats, weekStart);
    stats.eligible = items.length;
    const coverage = await coverageStats();
    const listId = await withTransaction(async (c) => {
      const l = await c.query<{ id: string }>(
        `INSERT INTO weekly_lists (run_id, week_start, total_items, partial, coverage, budget, model_versions, settings, excluded)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb) RETURNING id`,
        [runId, weekStart, items.length, stats.partial, JSON.stringify(coverage),
         JSON.stringify({ analysisBudget: settings.analysisBudget, analysesUsed: analyses, skippedForBudget: stats.analysisSkippedForBudget, partialReasons: stats.partialReasons }),
         JSON.stringify([...new Map(items.map((i) => [i.modelVersionId, { id: i.modelVersionId, name: i.modelName, version: i.modelVersion }])).values()]),
         JSON.stringify(settings), JSON.stringify(stats.excluded)]);
      let rank = 0;
      for (const it of items) {
        rank++;
        await c.query(
          `INSERT INTO weekly_list_items (list_id, rank, company_id, company_name, company_domain, score_id, score, band, model_name, model_version, model_version_id, data_coverage, services, reasons, flags)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15::jsonb)`,
          [l.rows[0]!.id, rank, it.companyId, it.companyName, it.domain, it.scoreId, it.score, it.band, it.modelName, it.modelVersion, it.modelVersionId, it.coverage,
           JSON.stringify(it.services), JSON.stringify(it.reasons), JSON.stringify(it.flags)]);
      }
      await c.query(`UPDATE weekly_runs SET status='completed', partial=$2, stats=$3::jsonb, finished_at=now() WHERE id=$1`, [runId, stats.partial, JSON.stringify(stats)]);
      await audit({ actorId: opts.triggeredBy, action: "weekly.completed", entityType: "weekly_run", entityId: runId, metadata: { items: items.length, partial: stats.partial, kind: opts.kind } }, c);
      return l.rows[0]!.id;
    });
    return { runId, listId, stats };
  } catch (e) {
    await pool().query(`UPDATE weekly_runs SET status='failed', error=$2, stats=$3::jsonb, finished_at=now() WHERE id=$1`, [runId, e instanceof Error ? e.message.slice(0, 300) : "error", JSON.stringify(stats)]);
    throw e;
  }
}

interface Item {
  companyId: string; companyName: string; domain: string | null; scoreId: string; score: number; band: "sales" | "nurturing";
  modelName: string; modelVersion: number; modelVersionId: string; coverage: number;
  services: unknown[]; reasons: string[]; flags: Record<string, unknown>;
}

async function buildItems(settings: WeeklySettings, stats: RunStats, weekStart: string): Promise<Item[]> {
  const bump = (why: string, n = 1) => { stats.excluded[why] = (stats.excluded[why] ?? 0) + n; };
  const offers = await listOffers(false);

  // Una sola consulta con el último puntaje de cada empresa que sigue en prospección (sin N+1).
  const rows = await pool().query<{
    score_id: string; company_id: string; total: string; band: "sales" | "nurturing" | "discard"; disqualified: boolean; data_coverage: string; model_version_id: string;
    reasons: string[]; missing_manual: string[]; adjustment: { delta: number; reason: string } | null; legal_name: string; domain: string | null; ruc: string | null; classification: string;
    observation_ids: string[]; manual_snapshot: Record<string, string>; company_snapshot: { classified: boolean; hasDomain: boolean }; as_of: Date;
  }>(
    `SELECT DISTINCT ON (s.company_id) s.id AS score_id, s.company_id, s.total, s.band, s.disqualified, s.data_coverage, s.model_version_id, s.reasons,
            COALESCE(ARRAY(SELECT jsonb_array_elements_text(s.breakdown->'missingManual')), '{}') AS missing_manual,
            s.adjustment, s.observation_ids, s.manual_snapshot, s.company_snapshot, s.as_of,
            c.legal_name, c.domain, c.ruc, c.classification
       FROM scores s JOIN companies c ON c.id = s.company_id
      WHERE c.stage IN ('detected', 'analyzed', 'prioritized')
      ORDER BY s.company_id, s.computed_at DESC, s.id`);

  // Última semana en que apareció cada empresa (una consulta)
  const prevRows = await pool().query<{ company_id: string; week_start: string }>(
    `SELECT i.company_id, max(l.week_start)::text AS week_start FROM weekly_list_items i JOIN weekly_lists l ON l.id = i.list_id
      WHERE i.company_id IS NOT NULL AND l.week_start < $1::date GROUP BY i.company_id`, [weekStart]);
  const prevWeek = new Map(prevRows.rows.map((r) => [r.company_id, r.week_start]));

  // Filtros baratos primero
  // Orden de las razones: primero la más informativa (sin datos suficientes), luego la banda del modelo y el mínimo configurado.
  const pass = rows.rows.filter((r) => {
    if (r.disqualified) { bump("descalificada"); return false; }
    if (Number(r.data_coverage) < settings.minCoverage) { bump("sin datos suficientes"); return false; }
    if (r.band === "discard") { bump("bajo el umbral del modelo (descartar)"); return false; }
    if (Number(r.total) < settings.minScore) { bump("puntaje bajo el mínimo"); return false; }
    return true;
  });
  pass.sort((a, b) => (a.band === "sales" ? 0 : 1) - (b.band === "sales" ? 0 : 1) || Number(b.total) - Number(a.total) || Number(b.data_coverage) - Number(a.data_coverage) || a.legal_name.localeCompare(b.legal_name));

  const versionCache = new Map<string, Awaited<ReturnType<typeof getModelVersion>>>();
  const out: Item[] = [];
  let overflow = 0;
  for (const r of pass) {
    if (out.length >= settings.listSize) { overflow++; continue; }
    // Comprobaciones por empresa solo para quienes podrían entrar (acotado por el tamaño de la lista)
    if (await findDoNotContact({ name: r.legal_name, domain: r.domain, ruc: r.ruc })) { bump("no contactar"); continue; }
    if (await findActiveClient({ name: r.legal_name, domain: r.domain, ruc: r.ruc })) { bump("cliente activo"); continue; }
    const flags: Record<string, unknown> = {};
    const prev = prevWeek.get(r.company_id);
    if (prev) {
      const weeksAgo = Math.floor((Date.parse(weekStart) - Date.parse(prev)) / (7 * 86_400_000));
      if (settings.noveltyWeeks === 0 || weeksAgo < settings.noveltyWeeks) {
        const changes = await relevantChanges(r.company_id);
        if (changes.length === 0) { bump("ya listada sin cambios"); continue; }
        flags.reappearsDueToChange = changes;
      }
    }
    if (r.classification === "to_classify") flags.industryToConfirm = true;
    if (r.missing_manual.length) flags.missingManual = r.missing_manual;
    if (r.adjustment) flags.manualAdjustment = r.adjustment;

    if (!versionCache.has(r.model_version_id)) versionCache.set(r.model_version_id, await getModelVersion(r.model_version_id));
    const model = versionCache.get(r.model_version_id)!;
    const obs = await pool().query<ObservationInput>(
      `SELECT id::text AS id, signal_code, status, kind, value, confidence, evidence_url FROM signal_observations WHERE id = ANY($1::bigint[])`, [r.observation_ids]);
    const facts = buildFacts({ observations: obs.rows, manual: r.manual_snapshot, company: r.company_snapshot, adjustment: r.adjustment, asOf: new Date(r.as_of).toISOString() });
    out.push({
      companyId: r.company_id, companyName: r.legal_name, domain: r.domain, scoreId: r.score_id, score: Number(r.total), band: r.band === "sales" ? "sales" : "nurturing",
      modelName: model.name, modelVersion: model.version, modelVersionId: model.versionId, coverage: Number(r.data_coverage),
      services: matchServices(offers, facts), reasons: r.reasons, flags,
    });
  }
  if (overflow > 0) bump("fuera del tamaño de la lista", overflow);
  return out;
}

async function coverageStats() {
  const r = await pool().query<{ total: string; analyzed: string; unverifiable: string; observations: string }>(
    `SELECT (SELECT count(*) FROM companies WHERE domain IS NOT NULL) AS total,
            (SELECT count(DISTINCT company_id) FROM analysis_runs WHERE status = 'completed') AS analyzed,
            (SELECT count(*) FROM signal_observations o WHERE o.status = 'unverifiable' AND o.analysis_run_id IN
               (SELECT DISTINCT ON (company_id) id FROM analysis_runs WHERE status = 'completed' ORDER BY company_id, finished_at DESC)) AS unverifiable,
            (SELECT count(*) FROM signal_observations o WHERE o.analysis_run_id IN
               (SELECT DISTINCT ON (company_id) id FROM analysis_runs WHERE status = 'completed' ORDER BY company_id, finished_at DESC)) AS observations`);
  const x = r.rows[0]!;
  const total = Number(x.total), analyzed = Number(x.analyzed), obs = Number(x.observations);
  return {
    companiesWithSite: total, analyzed,
    analyzedPct: total ? Math.round((analyzed / total) * 100) : 0,
    unverifiablePct: obs ? Math.round((Number(x.unverifiable) / obs) * 100) : 0,
  };
}
