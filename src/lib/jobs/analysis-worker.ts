import type { PgBoss } from "pg-boss";
import { analyzeCompany, type AnalyzerDeps } from "../analyzer/run";
import { log } from "../logger";
import { runWeeklyPipeline } from "../weekly/pipeline";
import { generateDiagnostic } from "../diagnostics/service";
import { pool } from "../db";
import { runBatch } from "../registry/import";
import { researchProviderFromEnv } from "../research/provider";
import { researchCompany } from "../research/service";
import { ANALYZE_QUEUE, DIAGNOSTIC_QUEUE, REGISTRY_QUEUE, RESEARCH_QUEUE, WEEKLY_QUEUE, type AnalyzeJob, type ResearchJob, type DiagnosticJob, type RegistryJob, type WeeklyJob } from "./queue";

/** Registra el procesador de análisis. Un fallo se reintenta; «omitido» y «completado» no. */
export async function registerAnalysisWorker(boss: PgBoss, deps: AnalyzerDeps, concurrency = 2): Promise<void> {
  await boss.work<AnalyzeJob>(ANALYZE_QUEUE, { localConcurrency: concurrency, batchSize: 1, pollingIntervalSeconds: 1 }, async ([job]) => {
    if (!job) return;
    log("info", "análisis iniciado", { companyId: job.data.companyId });
    const r = await analyzeCompany(job.data.companyId, { triggeredBy: job.data.triggeredBy, force: job.data.force, deps });
    log("info", "análisis terminado", { companyId: job.data.companyId, status: r.status, cached: r.cached });
    if (r.status === "failed") throw new Error(r.skipReason ?? "falló el análisis");
  });
}

/** Registra el procesador de la ejecución semanal (una a la vez). */
export async function registerWeeklyWorker(boss: PgBoss, deps: AnalyzerDeps): Promise<void> {
  await boss.work<WeeklyJob>(WEEKLY_QUEUE, { localConcurrency: 1, batchSize: 1, pollingIntervalSeconds: 5 }, async ([job]) => {
    if (!job) return;
    log("info", "ejecución semanal iniciada", { kind: job.data.kind });
    const r = await runWeeklyPipeline({ triggeredBy: job.data.triggeredBy, kind: job.data.kind }, { analyzer: deps });
    log("info", "ejecución semanal terminada", { listId: r.listId, eligible: r.stats.eligible, partial: r.stats.partial });
  });
}

/**
 * Registra el generador de diagnósticos (uno a la vez, para respetar el presupuesto). Los fallos esperados
 * (sin evidencia, presupuesto, rechazo del modelo) ya quedan registrados en ai_generations; aquí solo se anotan en el log.
 */
export async function registerDiagnosticWorker(boss: PgBoss): Promise<void> {
  await boss.work<DiagnosticJob>(DIAGNOSTIC_QUEUE, { localConcurrency: 1, batchSize: 1, pollingIntervalSeconds: 2 }, async ([job]) => {
    if (!job) return;
    const u = await pool().query<{ id: string; email: string; role: "admin" | "sales_lead" | "salesperson" | "consultant" | "read_only"; active: boolean }>(`SELECT id, email, role, active FROM users WHERE id = $1`, [job.data.requestedBy]);
    const actor = u.rows[0];
    if (!actor?.active) { log("warn", "diagnóstico omitido: el usuario ya no está activo", { companyId: job.data.companyId }); return; }
    try {
      const r = await generateDiagnostic({ id: actor.id, email: actor.email, role: actor.role }, job.data.companyId);
      log("info", "diagnóstico generado", { companyId: job.data.companyId, version: r.version, blocking: r.blocking });
    } catch (e) {
      log("warn", "no se generó el diagnóstico", { companyId: job.data.companyId, error: (e as Error).message });
    }
  });
}

/** Registra el cargador del padrón (uno a la vez). El avance queda en la base; un fallo deja el punto de control para reanudar. */
export async function registerRegistryWorker(boss: PgBoss): Promise<void> {
  await boss.work<RegistryJob>(REGISTRY_QUEUE, { localConcurrency: 1, batchSize: 1, pollingIntervalSeconds: 2 }, async ([job]) => {
    if (!job) return;
    log("info", "carga del padrón iniciada", { batchId: job.data.batchId });
    try {
      const b = await runBatch(job.data.batchId);
      log("info", "carga del padrón terminada", { batchId: b.id, status: b.status, loaded: b.rows_loaded, skipped: b.rows_skipped });
    } catch (e) {
      log("warn", "la carga del padrón no terminó", { batchId: job.data.batchId, error: (e as Error).message });
    }
  });
}

/** Procesador de la investigación de empresas con Grok (de a una, por costo). Sin clave de xAI no hace nada. */
export async function registerResearchWorker(boss: PgBoss): Promise<void> {
  await boss.work<ResearchJob>(RESEARCH_QUEUE, { localConcurrency: 1, batchSize: 1, pollingIntervalSeconds: 2 }, async ([job]) => {
    if (!job) return;
    const provider = researchProviderFromEnv();
    if (!provider) { log("warn", "investigación omitida: falta XAI_API_KEY", { companyId: job.data.companyId }); return; }
    try {
      const r = await researchCompany(job.data.companyId, provider);
      log("info", "investigación terminada", { companyId: job.data.companyId, status: r.status, website: r.website.status, contacts: r.contacts.found, costUsd: Number(r.costUsd.toFixed(4)) });
    } catch (e) {
      log("warn", "no se investigó la empresa", { companyId: job.data.companyId, error: (e as Error).message });
    }
  });
}
