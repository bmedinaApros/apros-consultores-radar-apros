import type { PgBoss } from "pg-boss";
import { analyzeCompany, type AnalyzerDeps } from "../analyzer/run";
import { log } from "../logger";
import { runWeeklyPipeline } from "../weekly/pipeline";
import { ANALYZE_QUEUE, WEEKLY_QUEUE, type AnalyzeJob, type WeeklyJob } from "./queue";

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
