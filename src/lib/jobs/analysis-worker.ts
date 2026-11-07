import type { PgBoss } from "pg-boss";
import { analyzeCompany, type AnalyzerDeps } from "../analyzer/run";
import { log } from "../logger";
import { ANALYZE_QUEUE, type AnalyzeJob } from "./queue";

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
