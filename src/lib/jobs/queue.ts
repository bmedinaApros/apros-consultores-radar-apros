import { PgBoss } from "pg-boss";
import { env } from "../env";
import { log } from "../logger";

export const ANALYZE_QUEUE = "analyze-company";

export interface AnalyzeJob {
  companyId: string;
  triggeredBy: string | null;
  force: boolean;
}

/**
 * Cola persistente sobre PostgreSQL (esquema propio `pgboss`). La aplicación web solo encola;
 * el trabajo lo ejecuta el proceso `npm run worker`.
 */
const g = globalThis as unknown as { __radarBoss?: Promise<PgBoss> };

export function getBoss(opts: { supervise?: boolean } = {}): Promise<PgBoss> {
  g.__radarBoss ??= (async () => {
    const boss = new PgBoss({
      connectionString: env().DATABASE_URL,
      schema: "pgboss",
      createSchema: false, // el esquema lo crea la migración; la aplicación no necesita permiso de CREATE en la base
      migrate: true,
      supervise: opts.supervise ?? false,
    });
    boss.on("error", (e: Error) => log("error", "error en la cola de trabajos", { error: e.message }));
    await boss.start();
    await boss.createQueue(ANALYZE_QUEUE, { policy: "short" });
    return boss;
  })();
  return g.__radarBoss;
}

/** Encola un análisis. Un análisis pendiente de la misma empresa no se duplica. */
export async function enqueueAnalysis(job: AnalyzeJob): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(ANALYZE_QUEUE, job, {
    singletonKey: `analyze:${job.companyId}`,
    retryLimit: 2,
    retryDelay: 60,
    retryBackoff: true,
    expireInSeconds: 600,
  });
}

export async function stopBoss(): Promise<void> {
  if (g.__radarBoss) {
    const b = await g.__radarBoss;
    await b.stop({ graceful: true });
    g.__radarBoss = undefined;
  }
}
