/* Proceso de trabajos en segundo plano. Uso: npm run worker */
import { ANALYZE_QUEUE, getBoss } from "../src/lib/jobs/queue";
import { registerAnalysisWorker } from "../src/lib/jobs/analysis-worker";
import { defaultDeps } from "../src/lib/analyzer/run";
import { googlePageSpeed } from "../src/lib/analyzer/pagespeed";
import { env } from "../src/lib/env";
import { log } from "../src/lib/logger";

const boss = await getBoss({ supervise: true });
const deps = { ...defaultDeps(), ...(env().PAGESPEED_API_KEY ? { pageSpeed: googlePageSpeed() } : {}) };
await registerAnalysisWorker(boss, deps);

log("info", "worker listo", { queue: ANALYZE_QUEUE });
const stop = async () => { await boss.stop({ graceful: true }); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
