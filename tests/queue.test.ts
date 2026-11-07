import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { enqueueAnalysis, enqueueWeeklyRun, getBoss, stopBoss, syncWeeklySchedule, ANALYZE_QUEUE, WEEKLY_QUEUE } from "@/lib/jobs/queue";
import { registerAnalysisWorker, registerWeeklyWorker } from "@/lib/jobs/analysis-worker";
import { createCompany } from "@/lib/companies/service";
import { disabledPageSpeed } from "@/lib/analyzer/pagespeed";
import { DomainThrottle, type Fetcher } from "@/lib/analyzer/safe-fetch";
import type { AnalyzerDeps } from "@/lib/analyzer/run";
import { mkActor, resetData } from "./helpers";
import * as F from "./fixtures/sites";

beforeEach(resetData);
afterAll(async () => { await stopBoss(); await pool().end(); });

const waitFor = async (fn: () => Promise<boolean>, ms = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 200)); }
  return false;
};

describe("cola de trabajos (pg-boss)", () => {
  it("encola un análisis, lo procesa en segundo plano y no duplica un trabajo pendiente", async () => {
    const admin = await mkActor("admin");
    const { id } = await createCompany(admin, { legal_name: "Empresa Cola SAC", website: "cola.example.com" });
    const calls: string[] = [];
    const fetcher: Fetcher = async (url) => {
      calls.push(url);
      if (url.endsWith("/robots.txt")) return F.httpError(url, 404);
      return F.ok(url, F.POOR_HOME);
    };
    const deps: AnalyzerDeps = { fetcher, throttle: new DomainThrottle(0), pageSpeed: disabledPageSpeed, userAgent: "RadarAPROS/1.0", maxPages: 3, cacheDays: 7, linkCheckBudget: 2 };

    const boss = await getBoss();
    const first = await enqueueAnalysis({ companyId: id, triggeredBy: admin.id, force: false });
    const second = await enqueueAnalysis({ companyId: id, triggeredBy: admin.id, force: false });
    expect(first).toBeTruthy();
    expect(second).toBeNull(); // ya hay uno pendiente para esta empresa

    await registerAnalysisWorker(boss, deps, 1);
    const done = await waitFor(async () => (await pool().query("SELECT 1 FROM analysis_runs WHERE company_id = $1 AND status = 'completed'", [id])).rowCount === 1);
    expect(done).toBe(true);
    expect(calls.some((u) => u.endsWith("/robots.txt"))).toBe(true);
    await boss.offWork(ANALYZE_QUEUE).catch(() => undefined);
  }, 40000);

  it("encola la ejecución semanal, la procesa en segundo plano y genera la lista; el calendario se puede programar y retirar", async () => {
    const admin = await mkActor("admin");
    await createCompany(admin, { legal_name: "Empresa Semanal SAC", website: "semanal.example.com", industry: "Salud" });
    const fetcher: Fetcher = async (url) => (url.endsWith("/robots.txt") ? F.httpError(url, 404) : F.ok(url, F.POOR_HOME));
    const deps: AnalyzerDeps = { fetcher, throttle: new DomainThrottle(0), pageSpeed: disabledPageSpeed, userAgent: "RadarAPROS/1.0", maxPages: 3, cacheDays: 7, linkCheckBudget: 2 };
    const boss = await getBoss();
    const first = await enqueueWeeklyRun({ triggeredBy: admin.id, kind: "manual" });
    const second = await enqueueWeeklyRun({ triggeredBy: admin.id, kind: "manual" });
    expect(first).toBeTruthy();
    expect(second).toBeNull();
    await registerWeeklyWorker(boss, deps);
    const done = await waitFor(async () => (await pool().query("SELECT 1 FROM weekly_runs WHERE status = 'completed'")).rowCount === 1);
    expect(done).toBe(true);
    expect((await pool().query("SELECT count(*)::int AS n FROM weekly_lists")).rows[0].n).toBe(1);
    await boss.offWork(WEEKLY_QUEUE).catch(() => undefined);

    await syncWeeklySchedule(true, "0 6 * * 1");
    const sched = await boss.getSchedules();
    expect(sched.some((x) => x.name === WEEKLY_QUEUE && x.cron === "0 6 * * 1" && x.timezone === "America/Lima")).toBe(true);
    await syncWeeklySchedule(false, "0 6 * * 1");
    expect((await boss.getSchedules()).some((x) => x.name === WEEKLY_QUEUE)).toBe(false);
  }, 60000);

  it("la cola vive en su propio esquema y la aplicación no puede crear tablas fuera de él", async () => {
    await getBoss();
    const owned = await pool().query(`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'pgboss'`);
    expect(owned.rows[0].n).toBeGreaterThan(3);
    await expect(pool().query("CREATE TABLE public.intruso (id int)")).rejects.toThrow();
  });
});
