import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { RunInProgressError, runWeeklyPipeline } from "@/lib/weekly/pipeline";
import { getWeeklySettings, saveWeeklySettings, weekStartLima, DEFAULT_WEEKLY } from "@/lib/weekly/settings";
import { getList, listInbox, listItems, listWeeklyLists, reviewItem } from "@/lib/weekly/service";
import { addDoNotContact, createCompany, listIndustries } from "@/lib/companies/service";
import { ForbiddenError } from "@/lib/rbac";
import { approveTerms, setProviderEnabled } from "@/lib/sources/service";
import { createModelVersion, getModelVersion, listModels, setManualCriterion, setScoreAdjustment } from "@/lib/scoring/service";
import { analyzeCompany } from "@/lib/analyzer/run";
import { fakeAnalyzerDeps, GOOD, POOR, type SiteMap } from "./helpers-analyzer";
import { mkActor, ownerPool, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

const T0 = new Date("2026-11-04T15:00:00Z"); // miércoles
const week = (n: number) => new Date(T0.getTime() + n * 7 * 86_400_000);

/** Baja los umbrales de todos los modelos para que sitios de ejemplo (puntajes ~25 a 35) entren en las bandas. */
async function lowerThresholds(admin: Awaited<ReturnType<typeof mkActor>>) {
  for (const m of await listModels()) {
    const active = m.versions.find((v) => v.active)!;
    const def = (await getModelVersion(active.id))!.definition;
    def.thresholds = { sales: 40, nurturing: 20 };
    await createModelVersion(admin, { modelId: m.model_id }, JSON.stringify(def), "Umbrales bajos para la prueba");
  }
}

async function setup(opts: { sites?: SiteMap; settings?: Partial<typeof DEFAULT_WEEKLY> } = {}) {
  const admin = await mkActor("admin");
  await lowerThresholds(admin);
  await saveWeeklySettings(admin, { ...DEFAULT_WEEKLY, minScore: 0, minCoverage: 0.3, ...opts.settings });
  const mk = async (name: string, domain: string, industry: string) => (await createCompany(admin, { legal_name: name, website: domain, industry })).id;
  const a = await mk("Alfa Pobre SAC", "alfa.example.com", "Inmobiliario");
  const b = await mk("Beta Buena SAC", "beta.example.com", "Salud");
  const c = await mk("Gamma Bloqueada SAC", "gamma.example.com", "Retail");
  const sites: SiteMap = opts.sites ?? {
    "alfa.example.com": { home: POOR },
    "beta.example.com": { home: GOOD },
    "gamma.example.com": { homeResult: { outcome: "http_error", reason: "HTTP 403", url: "https://gamma.example.com/", status: 403, headers: { "cf-mitigated": "challenge" }, body: "Just a moment...", bytes: 1, truncated: false, redirects: [], durationMs: 1 } },
  };
  return { admin, ids: { a, b, c }, ...fakeAnalyzerDeps(sites) };
}

describe("ejecución semanal", () => {
  it("analiza, puntúa y guarda una lista ordenada con motivos, servicios, modelo y cobertura", async () => {
    const { admin, deps, ids } = await setup();
    const r = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    expect(r.listId).toBeTruthy();
    expect(r.stats).toMatchObject({ candidates: 3, analyzed: 3, scored: 3 });
    const list = (await getList(r.listId!))!;
    expect(list.week_start).toBe("2026-11-02"); // lunes de esa semana, hora de Lima
    const items = await listItems(admin, list.id);
    expect(items.map((i) => i.company_id)).not.toContain(ids.c); // sitio bloqueado → sin datos suficientes
    expect(r.stats.excluded["sin datos suficientes"]).toBe(1);
    expect(items.every((i) => i.band === "nurturing" || i.band === "sales")).toBe(true);
    expect(items.length).toBe(2);
    // ordenado por puntaje
    expect(Number(items[0]!.score)).toBeGreaterThanOrEqual(Number(items[1]!.score));
    expect(items.map((i) => i.rank)).toEqual([1, 2]);
    const alfa = items.find((i) => i.company_id === ids.a)!;
    expect(alfa.model_name).toBe("Modelo Inmobiliario");
    expect(alfa.reasons.length).toBeGreaterThan(0);
    expect(alfa.services.length).toBeGreaterThan(0);
    expect(alfa.services.every((s) => s.reasons.length > 0)).toBe(true);
    expect(alfa.flags.missingManual?.length).toBeGreaterThan(0);
    expect(alfa.review_status).toBe("pending_review");
    expect(list.coverage).toMatchObject({ companiesWithSite: 3, analyzed: 3 });
    expect(list.coverage.unverifiablePct).toBeGreaterThan(0);
    expect(list.model_versions.length).toBe(2);
    expect(list.partial).toBe(false);
  });

  it("la lista es inmutable: solo cambian la revisión y la asignación", async () => {
    const { admin, deps } = await setup();
    const r = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    const owner = ownerPool();
    for (const sql of ["UPDATE weekly_list_items SET score = 99", "UPDATE weekly_list_items SET reasons = '[]'::jsonb", "UPDATE weekly_list_items SET company_name = 'X'", "UPDATE weekly_list_items SET rank = 9", "UPDATE weekly_lists SET total_items = 0"]) {
      await expect(owner.query(sql), sql).rejects.toThrow(/inmutable|solo inserción/);
    }
    await expect(pool().query("UPDATE weekly_list_items SET services = '[]'::jsonb")).rejects.toThrow(/inmutable/);
    await pool().query("UPDATE weekly_list_items SET review_note = 'ok'"); // sí se permite
    await owner.end();
    expect((await getList(r.listId!))!.total_items).toBe(2);
  });

  it("es idempotente: repetir la ejecución no repite análisis vigentes ni duplica puntajes", async () => {
    const { admin, deps, calls } = await setup();
    await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    const n = calls.length;
    const second = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    expect(calls.length).toBe(n); // no volvió a tocar ningún sitio
    expect(second.stats).toMatchObject({ candidates: 0, analyzed: 0, scored: 0 });
    expect((await pool().query("SELECT count(*)::int AS n FROM scores")).rows[0].n).toBe(3);
  });

  it("novedad: una empresa ya listada no reaparece salvo que cambie una señal relevante", async () => {
    const sites: SiteMap = { "alfa.example.com": { home: POOR }, "beta.example.com": { home: GOOD }, "gamma.example.com": { home: POOR } };
    const { admin, deps, ids } = await setup({ sites });
    const first = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "schedule" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    expect(first.stats.eligible).toBe(3);

    // Semana siguiente, sin cambios en los sitios: nada reaparece
    const owner = ownerPool();
    await owner.query("UPDATE analysis_runs SET finished_at = now() - interval '40 days'"); // el análisis vence
    const second = await runWeeklyPipeline({ triggeredBy: null, kind: "schedule" }, { analyzer: deps, skipDiscovery: true, now: () => week(1) });
    expect(second.stats.analyzed).toBe(3);
    expect(second.stats.eligible).toBe(0);
    expect(second.stats.excluded["ya listada sin cambios"]).toBe(3);

    // Tercera semana: Alfa agrega Google Analytics → reaparece con la razón
    await owner.query("UPDATE analysis_runs SET finished_at = now() - interval '40 days'");
    sites["alfa.example.com"] = { home: GOOD.replace("<title>Empresa con buen sitio</title>", "<title>Alfa</title>") };
    const third = await runWeeklyPipeline({ triggeredBy: null, kind: "schedule" }, { analyzer: fakeAnalyzerDeps(sites).deps, skipDiscovery: true, now: () => week(2) });
    await owner.end();
    const items = await listItems(admin, third.listId!);
    expect(items.map((i) => i.company_id)).toEqual([ids.a]);
    expect(items[0]!.flags.reappearsDueToChange).toContain("meas.ga4");
  });

  it("presupuesto: al agotarse conserva lo hecho, lo informa y marca cobertura parcial", async () => {
    const { admin, deps, calls } = await setup({ settings: { analysisBudget: 1 } });
    const r = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    expect(r.stats).toMatchObject({ analyzed: 1, analysisSkippedForBudget: 2, partial: true });
    const list = (await getList(r.listId!))!;
    expect(list.partial).toBe(true);
    expect(list.budget.partialReasons[0]).toMatch(/presupuesto de análisis \(1\).*2 empresas quedaron sin analizar/);
    expect(new Set(calls.map((c) => new URL(c.split(" ")[1]!).hostname)).size).toBe(1); // solo se tocó un sitio
    expect((await pool().query("SELECT count(*)::int AS n FROM analysis_runs WHERE status = 'completed'")).rows[0].n).toBe(1);
    // Al día siguiente el presupuesto se renueva y continúa con lo que faltaba
    const next = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    expect(next.stats.analyzed).toBe(1);
  });

  it("no permite dos ejecuciones a la vez", async () => {
    const { admin, deps } = await setup();
    await pool().query("INSERT INTO weekly_runs (week_start, trigger_kind) VALUES ('2026-11-02', 'manual')");
    await expect(runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 })).rejects.toBeInstanceOf(RunInProgressError);
  });

  it("excluye descalificadas, no contactar y puntajes bajo el mínimo; respeta el tamaño de la lista", async () => {
    const { admin, deps, ids } = await setup({ settings: { listSize: 1 } });
    await setManualCriterion(admin, ids.b, "not_fit", "si"); // Beta queda descalificada
    const r = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    expect(r.stats.excluded["descalificada"]).toBe(1);
    expect(r.stats.eligible).toBe(1);
    await addDoNotContact(admin, "domain", "alfa.example.com", "Pidió no ser contactada");
    const again = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => week(1) });
    expect(again.stats.excluded["no contactar"]).toBeGreaterThanOrEqual(1);
    const items = await listItems(admin, again.listId!);
    expect(items.every((i) => i.company_id !== ids.a)).toBe(true);

    const strict = await saveWeeklySettings(admin, { ...DEFAULT_WEEKLY, minScore: 99, minCoverage: 0.3 });
    expect(strict.minScore).toBe(99);
    const none = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => week(2) });
    expect(none.stats.eligible).toBe(0);
    expect(none.stats.excluded["puntaje bajo el mínimo"]).toBeGreaterThanOrEqual(1);
  });

  it("el ajuste manual hecho antes de listar se refleja en el puntaje, los motivos y las marcas de la lista", async () => {
    const { admin, deps, ids } = await setup();
    await setManualCriterion(admin, ids.a, "company_size", "grande");
    await analyzeCompany(ids.a, { deps, force: true });
    await setScoreAdjustment(admin, ids.a, 20, "Referido");
    const r = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    const alfa = (await listItems(admin, r.listId!)).find((i) => i.company_id === ids.a)!;
    expect(alfa.flags.manualAdjustment).toEqual({ delta: 20, reason: "Referido" });
    expect(alfa.reasons.at(-1)).toMatch(/Ajuste manual \+20: Referido/);
    expect(alfa.reasons.some((x) => /manual/.test(x))).toBe(true);
    // Un ajuste hecho después no hace reaparecer una empresa ya listada (solo cambios en el sitio lo hacen)
    await setScoreAdjustment(admin, ids.a, -5, "Otro motivo");
    const next = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => week(1) });
    expect((await listItems(admin, next.listId!)).map((i) => i.company_id)).not.toContain(ids.a);
  });

  it("incluye el descubrimiento de las fuentes activas (simulada) y sigue si una falla", async () => {
    const admin = await mkActor("admin");
    await lowerThresholds(admin);
    await saveWeeklySettings(admin, { ...DEFAULT_WEEKLY, minScore: 0, minCoverage: 0 });
    await approveTerms(admin, "simulado");
    await setProviderEnabled(admin, "simulado", true);
    const sites: SiteMap = Object.fromEntries(["inmobiliaria-demo-uno", "clinica-demo-salud", "instituto-demo-educa", "retail-demo-moda", "industrias-demo-metal", "consultores-demo-legal", "distribuidora-demo", "empresa-demo-sin-rubro"].map((d) => [`${d}.example.com`, { home: POOR }]));
    const { deps } = fakeAnalyzerDeps(sites);
    const r = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "schedule" }, { analyzer: deps, now: () => T0 });
    expect(r.stats.discovery[0]).toMatchObject({ provider: "simulado", found: 8, created: 8 });
    expect(r.stats.analyzed).toBe(8);
    // La empresa sin rubro confirmado puntúa menos (el modelo general no le da los puntos de «rubro confirmado»)
    // y queda bajo el umbral: el sistema empuja a clasificarla antes de priorizarla.
    expect(r.stats.eligible).toBe(7);
    expect(r.stats.excluded["bajo el umbral del modelo (descartar)"]).toBe(1);
    const items = await listItems(admin, r.listId!);
    expect(items.some((i) => i.company_name.includes("Sin Rubro"))).toBe(false);
  });
});

describe("revisión humana antes del uso comercial", () => {
  it("un vendedor no ve nada hasta que una persona del equipo aprueba y asigna", async () => {
    const { admin, deps, ids } = await setup();
    const r = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    const seller = await mkActor("salesperson", "ana@apros.pe");
    const other = await mkActor("salesperson", "beto@apros.pe");
    const consultant = await mkActor("consultant");
    expect(await listItems(seller, r.listId!)).toEqual([]);
    expect((await listInbox(seller, {})).rows).toEqual([]);

    const items = await listItems(admin, r.listId!);
    const alfa = items.find((i) => i.company_id === ids.a)!;
    await reviewItem(consultant, alfa.id, { decision: "approved", assignedTo: seller.id, note: "Buen encaje" });

    const mine = await listItems(seller, r.listId!);
    expect(mine.map((i) => i.company_id)).toEqual([ids.a]);
    expect(mine[0]).toMatchObject({ review_status: "approved", assigned_email: "ana@apros.pe" });
    expect(await listItems(other, r.listId!)).toEqual([]); // asignada a otra persona
    expect((await pool().query("SELECT owner_id FROM companies WHERE id = $1", [ids.a])).rows[0].owner_id).toBe(seller.id);
    expect((await listInbox(seller, {})).rows.map((x) => x.company_id)).toEqual([ids.a]);
    expect((await listInbox(other, {})).rows).toEqual([]);
  });

  it("el rechazo exige motivo y solo revisa quien tiene permiso", async () => {
    const { admin, deps } = await setup();
    const r = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    const [it] = await listItems(admin, r.listId!);
    const lead = await mkActor("sales_lead");
    await expect(reviewItem(lead, it!.id, { decision: "rejected" })).rejects.toThrow(/motivo/);
    await reviewItem(lead, it!.id, { decision: "rejected", note: "No es nuestro tipo de cliente" });
    expect((await listItems(admin, r.listId!, { review: "rejected" })).map((x) => x.review_note)).toEqual(["No es nuestro tipo de cliente"]);
    for (const role of ["salesperson", "read_only"] as const) {
      await expect(reviewItem(await mkActor(role), it!.id, { decision: "approved" })).rejects.toBeInstanceOf(ForbiddenError);
    }
  });

  it("no se puede aprobar una empresa que pasó después a no contactar, ni asignar a quien no vende", async () => {
    const { admin, deps, ids } = await setup();
    const r = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    const alfa = (await listItems(admin, r.listId!)).find((i) => i.company_id === ids.a)!;
    const reader = await mkActor("read_only");
    await expect(reviewItem(admin, alfa.id, { decision: "approved", assignedTo: reader.id })).rejects.toThrow(/vendedores/);
    await expect(reviewItem(admin, alfa.id, { decision: "rejected", note: "x", assignedTo: reader.id })).rejects.toThrow();
    await addDoNotContact(admin, "domain", "alfa.example.com", "Reclamo");
    await expect(reviewItem(admin, alfa.id, { decision: "approved" })).rejects.toThrow(/no contactar/);
  });

  it("la revisión queda en la auditoría", async () => {
    const { admin, deps } = await setup();
    const r = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    const [it] = await listItems(admin, r.listId!);
    await reviewItem(admin, it!.id, { decision: "approved" });
    const a = await pool().query("SELECT action FROM audit_log WHERE action LIKE 'weekly.%' ORDER BY id");
    expect(a.rows.map((x) => x.action)).toEqual(["weekly.completed", "weekly.item_approved"]);
  });
});

describe("bandeja priorizada", () => {
  it("filtra por rubro, ciudad, banda, puntaje mínimo, señal y responsable; ordena por puntaje", async () => {
    const { admin, deps, ids } = await setup();
    await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    const inds = await listIndustries();
    const all = await listInbox(admin, {});
    expect(all.total).toBeGreaterThanOrEqual(1);
    const totals = all.rows.map((r) => Number(r.total));
    expect([...totals].sort((a, b) => b - a)).toEqual(totals);
    const salud = await listInbox(admin, { industryId: inds.find((i) => i.slug === "salud")!.id });
    expect(salud.rows.every((r) => r.industry_name === "Salud")).toBe(true);
    expect((await listInbox(admin, { minScore: 101 })).rows).toEqual([]);
    const conGa4 = await listInbox(admin, { signal: "meas.ga4", signalStatus: "observed" });
    expect(conGa4.rows.map((r) => r.company_id)).toEqual([ids.b]);
    const sinGa4 = await listInbox(admin, { signal: "meas.ga4", signalStatus: "not_detected" });
    expect(sinGa4.rows.map((r) => r.company_id)).toEqual([ids.a]);
    expect((await listInbox(admin, { owner: "mine" })).rows).toEqual([]);
    expect((await listInbox(admin, { owner: "unassigned" })).total).toBe(all.total);
    expect(all.rows[0]).toMatchObject({ model_name: expect.stringMatching(/^Modelo /), model_version: 2 });
  });

  it("no muestra empresas descalificadas ni de banda «descartar» salvo que se pida", async () => {
    const { admin, deps, ids } = await setup();
    await setManualCriterion(admin, ids.b, "not_fit", "si");
    await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    expect((await listInbox(admin, {})).rows.map((r) => r.company_id)).not.toContain(ids.b);
  });
});

describe("configuración y calendario", () => {
  it("valida la configuración y solo el administrador la cambia", async () => {
    const admin = await mkActor("admin");
    const lead = await mkActor("sales_lead");
    await expect(saveWeeklySettings(lead, DEFAULT_WEEKLY)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(saveWeeklySettings(admin, { ...DEFAULT_WEEKLY, listSize: 0 })).rejects.toThrow(/inválida/);
    await expect(saveWeeklySettings(admin, { ...DEFAULT_WEEKLY, cron: "rm -rf /;" })).rejects.toThrow(/inválida/);
    await saveWeeklySettings(admin, { ...DEFAULT_WEEKLY, listSize: 12 });
    expect((await getWeeklySettings()).listSize).toBe(12);
    expect((await pool().query("SELECT metadata FROM audit_log WHERE action = 'settings.weekly_changed'")).rows[0].metadata.listSize).toBe(12);
  });

  it("calcula el lunes de la semana en hora de Lima", () => {
    expect(weekStartLima(new Date("2026-11-02T04:59:59Z"))).toBe("2026-10-26"); // aún domingo 23:59 en Lima
    expect(weekStartLima(new Date("2026-11-02T05:00:00Z"))).toBe("2026-11-02");
    expect(weekStartLima(new Date("2026-11-08T23:00:00Z"))).toBe("2026-11-02");
  });

  it("lista las listas más recientes primero", async () => {
    const { admin, deps } = await setup();
    await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => T0 });
    await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, skipDiscovery: true, now: () => week(1) });
    const lists = await listWeeklyLists();
    expect(lists.map((l) => l.week_start)).toEqual(["2026-11-09", "2026-11-02"]);
  });
});
