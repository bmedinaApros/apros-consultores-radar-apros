import { PgBoss } from "pg-boss";
import { env } from "../env";
import { log } from "../logger";

export const ANALYZE_QUEUE = "analyze-company";
export const WEEKLY_QUEUE = "weekly-run";
export const WEEKLY_SCHEDULE = "weekly-run-schedule";
export const DIAGNOSTIC_QUEUE = "generate-diagnostic";
export const REGISTRY_QUEUE = "registry-import";

export interface RegistryJob { batchId: string; requestedBy: string | null }

export interface DiagnosticJob { companyId: string; requestedBy: string }

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
    await boss.createQueue(WEEKLY_QUEUE, { policy: "short" });
    await boss.createQueue(DIAGNOSTIC_QUEUE, { policy: "short" });
    await boss.createQueue(REGISTRY_QUEUE, { policy: "short" });
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

export interface WeeklyJob { triggeredBy: string | null; kind: "manual" | "schedule" }

/** Encola la ejecución semanal. Si ya hay una pendiente no se duplica. */
export async function enqueueWeeklyRun(job: WeeklyJob): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(WEEKLY_QUEUE, job, { singletonKey: "weekly-run", retryLimit: 0, expireInSeconds: 6 * 3600 });
}

/** Programa (o retira) la ejecución semanal según la configuración. Hora de Lima. */
export async function syncWeeklySchedule(enabled: boolean, cron: string): Promise<void> {
  const boss = await getBoss();
  if (!enabled) {
    await boss.unschedule(WEEKLY_QUEUE, WEEKLY_SCHEDULE).catch(() => undefined);
    return;
  }
  await boss.schedule(WEEKLY_QUEUE, cron, { triggeredBy: null, kind: "schedule" } satisfies WeeklyJob, { tz: "America/Lima", key: WEEKLY_SCHEDULE });
}

/** Encola la generación de un diagnóstico. Uno pendiente de la misma empresa no se duplica; no se reintenta (cada intento cuesta). */
export async function enqueueDiagnostic(job: DiagnosticJob): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(DIAGNOSTIC_QUEUE, job, { singletonKey: `diagnostic:${job.companyId}`, retryLimit: 0, expireInSeconds: 900 });
}

/** Encola la carga de un archivo del padrón. Una sola a la vez; no se reintenta sola (se reanuda a mano desde el punto de control). */
export async function enqueueRegistryImport(job: RegistryJob): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(REGISTRY_QUEUE, job, { singletonKey: "registry-import", retryLimit: 0, expireInSeconds: 24 * 3600 });
}
