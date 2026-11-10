import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createRadarServer } from "@/lib/mcp/server";
import { pool } from "@/lib/db";
import { stopBoss } from "@/lib/jobs/queue";
import { runWeeklyPipeline } from "@/lib/weekly/pipeline";
import { DEFAULT_WEEKLY, saveWeeklySettings } from "@/lib/weekly/settings";
import { createCompany } from "@/lib/companies/service";
import { createModelVersion, getModelVersion, listModels } from "@/lib/scoring/service";
import { fakeAnalyzerDeps, GOOD } from "./helpers-analyzer";
import { mkActor, resetData } from "./helpers";

// La cola de pg-boss es compartida con otras pruebas: este archivo no deja trabajos pendientes.
const clearQueue = () => pool().query(`DELETE FROM pgboss.job WHERE name = 'weekly-run'`).catch(() => undefined);
beforeEach(async () => { await resetData(); await clearQueue(); });
afterAll(async () => { await clearQueue(); await stopBoss(); await pool().end(); });

async function connect() {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createRadarServer().connect(b);
  const c = new Client({ name: "test", version: "1" });
  await c.connect(a);
  return c;
}
const call = async (c: Client, name: string, args: Record<string, unknown> = {}) => {
  const r = (await c.callTool({ name, arguments: args })) as { content: { text: string }[]; isError?: boolean };
  return { text: r.content[0]!.text, isError: Boolean(r.isError), json: () => JSON.parse(r.content[0]!.text) };
};

describe("conector: lista semanal", () => {
  it("la programación por defecto es lunes 08:30 y sin lista no inventa nada", async () => {
    const c = await connect();
    const e = (await call(c, "estado_semana")).json();
    expect(e.programacion).toMatchObject({ activa: true, cron_hora_lima: "30 8 * * 1", tamano_de_lista: 50 });
    expect(e.ultimas_corridas).toEqual([]);
    expect((await call(c, "ver_lista_semanal")).isError).toBe(true);
  });

  it("ejecutar_semana deja una sola corrida en cola, aunque se pida dos veces", async () => {
    const c = await connect();
    expect((await call(c, "ejecutar_semana")).json().encolada).toBe(true);
    expect((await call(c, "ejecutar_semana")).json().encolada).toBe(false);
    expect((await call(c, "estado_semana")).json().en_cola).toBeGreaterThanOrEqual(1);
  });

  it("muestra la última lista con puntaje, motivos y la revisión pendiente, sin exponer usuarios", async () => {
    const admin = await mkActor("admin");
    for (const m of await listModels()) {
      const def = (await getModelVersion(m.versions.find((v) => v.active)!.id))!.definition;
      def.thresholds = { sales: 40, nurturing: 20 };
      await createModelVersion(admin, { modelId: m.model_id }, JSON.stringify(def), "Umbrales bajos para la prueba");
    }
    await saveWeeklySettings(admin, { ...DEFAULT_WEEKLY, minScore: 0, minCoverage: 0.3 });
    await createCompany(admin, { legal_name: "Beta Buena SAC", website: "beta.example.com", industry: "Salud" });
    const { deps } = fakeAnalyzerDeps({ "beta.example.com": { home: GOOD } });
    await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true });
    const c = await connect();
    const l = (await call(c, "ver_lista_semanal")).json();
    expect(l.empresas).toHaveLength(1);
    expect(l.empresas[0]).toMatchObject({ posicion: 1, empresa: "Beta Buena SAC", sitio_web: "beta.example.com", revision: "pendiente" });
    expect(typeof l.empresas[0].puntaje).toBe("number");
    expect(l.lista.revision).toMatchObject({ pending_review: 1 });
    expect(JSON.stringify(l)).not.toMatch(/@|assigned_email|password/i);
    expect((await call(c, "ver_lista_semanal", { revision: "aprobadas" })).json().empresas).toHaveLength(0);
    const e = (await call(c, "estado_semana")).json();
    expect(e.ultimas_corridas[0]).toMatchObject({ estado: "completed", disparo: "manual" });
  });
});
