import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { analyzeCompany } from "@/lib/analyzer/run";
import { createCompany, listIndustries } from "@/lib/companies/service";
import { ForbiddenError } from "@/lib/rbac";
import { activateModelVersion, createModelVersion, getActiveModel, latestAdjustment, latestManual, latestScore, listModels, reproduceScore, scoreCompany, setManualCriterion, setScoreAdjustment } from "@/lib/scoring/service";
import { generalModel } from "@/lib/scoring/model";
import { listOffers, matchServices, addRule, createOffer, deleteRule, updateOffer } from "@/lib/offers/service";
import { buildFacts } from "@/lib/scoring/engine";
import { fakeAnalyzerDeps, GOOD, POOR } from "./helpers-analyzer";
import { mkActor, ownerPool, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

async function analyzed(site: string, domain = "empresa.example.com", industry = "Inmobiliario") {
  const admin = await mkActor("admin");
  const { id } = await createCompany(admin, { legal_name: "Empresa SAC", website: domain, industry });
  const { deps } = fakeAnalyzerDeps({ [domain]: { home: site } });
  await analyzeCompany(id, { deps, force: true });
  return { id, admin, deps };
}

describe("modelos de puntaje", () => {
  it("existen el modelo general y un modelo de ejemplo por cada rubro con señales", async () => {
    const models = await listModels();
    expect(models.filter((m) => !m.industry_id)).toHaveLength(1);
    expect(models.filter((m) => m.industry_id)).toHaveLength(7);
    expect(models.every((m) => m.versions.some((v) => v.active))).toBe(true);
  });

  it("una empresa usa el modelo de su rubro; sin rubro propio usa el general", async () => {
    const inds = await listIndustries();
    const salud = inds.find((i) => i.slug === "salud")!;
    expect(await getActiveModel(salud.id)).toMatchObject({ scope: "rubro", name: "Modelo Salud" });
    expect(await getActiveModel(null)).toMatchObject({ scope: "general", name: "Modelo general" });
    const admin = await mkActor("admin");
    const { createIndustry } = await import("@/lib/companies/service");
    await createIndustry(admin, "Turismo");
    const turismo = (await listIndustries()).find((i) => i.slug === "turismo")!;
    expect(await getActiveModel(turismo.id)).toMatchObject({ scope: "general" });
  });

  it("las versiones son inmutables; una versión nueva se activa y la anterior se conserva", async () => {
    const admin = await mkActor("admin");
    const general = (await listModels()).find((m) => !m.industry_id)!;
    await expect(pool().query("UPDATE scoring_model_versions SET definition = '{}'::jsonb")).rejects.toThrow(/inmutables/);
    const def = generalModel();
    def.thresholds = { sales: 80, nurturing: 55 };
    const v2 = await createModelVersion(admin, { modelId: general.model_id }, JSON.stringify(def), "Subimos el umbral de ventas");
    expect(v2.version).toBe(2);
    expect((await getActiveModel(null)).definition.thresholds).toEqual({ sales: 80, nurturing: 55 });
    const after = (await listModels()).find((m) => !m.industry_id)!;
    expect(after.versions.map((v) => [v.version, v.active])).toEqual([[2, true], [1, false]]);
    await activateModelVersion(admin, general.versions[0]!.id);
    expect((await getActiveModel(null)).version).toBe(1);
  });

  it("rechaza modelos inválidos y exige motivo; solo el administrador los cambia", async () => {
    const admin = await mkActor("admin");
    const lead = await mkActor("sales_lead");
    const general = (await listModels()).find((m) => !m.industry_id)!;
    const bad = generalModel(); bad.dimensions[0]!.weight = 10;
    await expect(createModelVersion(admin, { modelId: general.model_id }, JSON.stringify(bad), "x")).rejects.toThrow(/sumar 100/);
    await expect(createModelVersion(admin, { modelId: general.model_id }, "no es json", "x")).rejects.toThrow(/JSON/);
    await expect(createModelVersion(admin, { modelId: general.model_id }, JSON.stringify(generalModel()), "  ")).rejects.toThrow(/qué cambió/);
    await expect(createModelVersion(lead, { modelId: general.model_id }, JSON.stringify(generalModel()), "x")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("se puede crear un modelo propio para un rubro nuevo sin tocar código", async () => {
    const admin = await mkActor("admin");
    const { createIndustry } = await import("@/lib/companies/service");
    await createIndustry(admin, "Turismo");
    const turismo = (await listIndustries()).find((i) => i.slug === "turismo")!;
    const r = await createModelVersion(admin, { industryId: turismo.id }, JSON.stringify(generalModel()), "Modelo inicial de turismo");
    expect(r.version).toBe(1);
    expect(await getActiveModel(turismo.id)).toMatchObject({ scope: "rubro", name: "Modelo Turismo" });
  });
});

describe("puntaje de una empresa", () => {
  it("sin análisis no hay puntaje", async () => {
    const admin = await mkActor("admin");
    const { id } = await createCompany(admin, { legal_name: "Sin Análisis SAC", website: "sa.example.com" });
    expect(await scoreCompany(id)).toBeNull();
  });

  it("guarda el desglose, los motivos, la versión del modelo y las señales usadas", async () => {
    const { id } = await analyzed(POOR);
    const r = (await scoreCompany(id))!;
    expect(r.created).toBe(true);
    const s = (await latestScore(id))!;
    expect(s.model_name).toBe("Modelo Inmobiliario");
    expect(s.model_version).toBe(1);
    expect(s.breakdown.dimensions).toHaveLength(5);
    expect(s.reasons.length).toBeGreaterThan(0);
    expect(s.observation_ids.length).toBeGreaterThan(20);
    expect(Number(s.total)).toBeGreaterThan(0);
    expect(s.breakdown.dimensions.find((d) => d.key === "urgency")!.fired.every((f) => f.observationId !== null)).toBe(true);
  });

  it("no duplica el puntaje si nada cambió, y crea uno nuevo si cambia un criterio manual", async () => {
    const { id, admin } = await analyzed(POOR);
    await scoreCompany(id);
    expect((await scoreCompany(id))!.created).toBe(false);
    await setManualCriterion(admin, id, "company_size", "grande");
    const again = (await scoreCompany(id))!;
    expect(again.created).toBe(true);
    expect((await pool().query("SELECT count(*)::int AS n FROM scores WHERE company_id = $1", [id])).rows[0].n).toBe(2);
    expect(again.score.breakdown.dimensions.flatMap((d) => d.fired).find((f) => f.id === "manual-tamano-grande")).toMatchObject({ source: "manual" });
  });

  it("es reproducible: recalcular con las entradas congeladas da exactamente lo mismo", async () => {
    const { id, admin } = await analyzed(GOOD);
    await setManualCriterion(admin, id, "icp_fit", "alto");
    await setScoreAdjustment(admin, id, 7.5, "Conocen al dueño");
    const s = (await scoreCompany(id))!.score;
    const repro = await reproduceScore(s.id);
    expect(repro.matches).toBe(true);
    expect(repro.recomputed.total).toBe(Number(s.total));
  });

  it("los puntajes viejos siguen reproduciéndose aunque el modelo cambie después", async () => {
    const { id, admin } = await analyzed(GOOD);
    const s = (await scoreCompany(id))!.score;
    const propio = (await listModels()).find((m) => m.name === "Modelo Inmobiliario")!;
    const def = generalModel(); def.thresholds = { sales: 90, nurturing: 60 };
    await createModelVersion(admin, { modelId: propio.model_id }, JSON.stringify(def), "Cambio de umbrales");
    expect((await reproduceScore(s.id)).matches).toBe(true);
    const nuevo = (await scoreCompany(id))!;
    expect(nuevo.created).toBe(true); // otra versión del modelo → otro puntaje
    expect((await latestScore(id))!.model_version).toBe(2);
  });

  it("los puntajes no se pueden modificar", async () => {
    const { id } = await analyzed(POOR);
    await scoreCompany(id);
    await expect(pool().query("UPDATE scores SET total = 100")).rejects.toThrow(/permission denied/); // la aplicación ni siquiera tiene permiso
    const owner = ownerPool();
    await expect(owner.query("UPDATE scores SET total = 100")).rejects.toThrow(/solo inserción/); // ni el propietario, por el trigger
    await owner.end();
  });

  it("una empresa que pasa de «analizada» a puntuada con banda alta queda «priorizada»", async () => {
    const { id, admin } = await analyzed(GOOD);
    await setManualCriterion(admin, id, "icp_fit", "alto");
    await setManualCriterion(admin, id, "company_size", "grande");
    await setManualCriterion(admin, id, "decision_maker_known", "si");
    await setManualCriterion(admin, id, "retainer_interest", "alto");
    await scoreCompany(id);
    const stage = (await pool().query("SELECT stage FROM companies WHERE id = $1", [id])).rows[0].stage;
    const band = (await latestScore(id))!.band;
    expect(stage).toBe(band === "discard" ? "analyzed" : "prioritized");
  });

  it("un sitio que no se pudo leer da cobertura 0 y no se castiga por ello", async () => {
    const admin = await mkActor("admin");
    const { id } = await createCompany(admin, { legal_name: "Bloqueada SAC", website: "bloq.example.com", industry: "Salud" });
    const { deps } = fakeAnalyzerDeps({ "bloq.example.com": { homeResult: { outcome: "http_error", reason: "HTTP 403", url: "https://bloq.example.com/", status: 403, headers: { "cf-mitigated": "challenge" }, body: "Just a moment...", bytes: 10, truncated: false, redirects: [], durationMs: 1 } } });
    await analyzeCompany(id, { deps, force: true });
    const s = (await scoreCompany(id))!.score;
    expect(Number(s.data_coverage)).toBe(0);
    expect(s.breakdown.dimensions.find((d) => d.key === "urgency")!.fired).toEqual([]);
  });
});

describe("criterios manuales y ajustes", () => {
  it("un criterio manual se guarda con su autor, se puede cambiar y borrar, y el historial se conserva", async () => {
    const { id, admin } = await analyzed(POOR);
    await setManualCriterion(admin, id, "company_size", "pequena");
    await setManualCriterion(admin, id, "company_size", "mediana");
    expect((await latestManual(id)).company_size).toBe("mediana");
    await setManualCriterion(admin, id, "company_size", "");
    expect((await latestManual(id)).company_size).toBeUndefined();
    expect((await pool().query("SELECT count(*)::int AS n FROM manual_signals WHERE company_id = $1", [id])).rows[0].n).toBe(3);
    await expect(pool().query("UPDATE manual_signals SET value = 'x'")).rejects.toThrow();
    await expect(pool().query("DELETE FROM manual_signals")).rejects.toThrow();
  });

  it("rechaza criterios o valores inválidos y respeta la propiedad del vendedor", async () => {
    const { id, admin } = await analyzed(POOR);
    await expect(setManualCriterion(admin, id, "inventado", "x")).rejects.toThrow(/desconocido/);
    await expect(setManualCriterion(admin, id, "company_size", "gigante")).rejects.toThrow(/no válido/);
    const ana = await mkActor("salesperson", "ana@apros.pe");
    const beto = await mkActor("salesperson", "beto@apros.pe");
    await pool().query("UPDATE companies SET owner_id = $2 WHERE id = $1", [id, beto.id]);
    await expect(setManualCriterion(ana, id, "icp_fit", "alto")).rejects.toThrow(/otro vendedor/);
    await setManualCriterion(beto, id, "icp_fit", "alto");
    const reader = await mkActor("read_only");
    await expect(setManualCriterion(reader, id, "icp_fit", "bajo")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("el ajuste exige motivo, está acotado, requiere permiso y queda en auditoría", async () => {
    const { id, admin } = await analyzed(POOR);
    await expect(setScoreAdjustment(admin, id, 10, "   ")).rejects.toThrow(/motivo/);
    await expect(setScoreAdjustment(admin, id, 80, "mucho")).rejects.toThrow(/-50 y 50/);
    const seller = await mkActor("salesperson");
    await expect(setScoreAdjustment(seller, id, 5, "motivo")).rejects.toBeInstanceOf(ForbiddenError);
    const consultant = await mkActor("consultant");
    await setScoreAdjustment(consultant, id, -8, "Ya trabaja con otra agencia");
    expect(await latestAdjustment(id)).toMatchObject({ delta: -8, reason: "Ya trabaja con otra agencia" });
    const audit = await pool().query("SELECT metadata FROM audit_log WHERE action = 'score.adjusted'");
    expect(audit.rows[0].metadata).toMatchObject({ delta: -8, reason: "Ya trabaja con otra agencia" });
    await setScoreAdjustment(consultant, id, 0, "Se retira el ajuste");
    expect(await latestAdjustment(id)).toBeNull();
  });

  it("el ajuste cambia el puntaje y aparece en los motivos", async () => {
    const { id, admin } = await analyzed(POOR);
    const base = Number((await scoreCompany(id))!.score.total);
    await setScoreAdjustment(admin, id, 15, "Referido por un cliente");
    const adj = (await scoreCompany(id))!.score;
    expect(Number(adj.total)).toBe(Math.min(100, Math.round((base + 15) * 10) / 10));
    expect(adj.reasons.at(-1)).toMatch(/Ajuste manual \+15: Referido por un cliente/);
  });
});

describe("catálogo de servicios y emparejamiento", () => {
  it("viene un catálogo de ejemplo editable", async () => {
    const offers = await listOffers();
    expect(offers.length).toBe(7);
    expect(offers.every((o) => o.is_example)).toBe(true);
    expect(offers.every((o) => o.rules.length > 0)).toBe(true);
  });

  it("sugiere servicios a partir de las señales, siempre como hipótesis con su motivo", async () => {
    const { id } = await analyzed(POOR);
    const s = (await scoreCompany(id))!.score;
    const obs = await pool().query(`SELECT id::text AS id, signal_code, status, kind, value, confidence, evidence_url FROM signal_observations WHERE id = ANY($1::bigint[])`, [s.observation_ids]);
    const matches = matchServices(await listOffers(false), buildFacts({ observations: obs.rows, manual: {}, company: { classified: true, hasDomain: true }, adjustment: null, asOf: new Date().toISOString() }));
    const slugs = matches.map((m) => m.slug);
    expect(slugs).toContain("analitica-medicion");
    expect(slugs).toContain("seo-contenido");
    expect(slugs).toContain("web-ux-ui");
    expect(matches.every((m) => m.hypothesis === true && m.reasons.length > 0)).toBe(true);
    expect(matches.find((m) => m.slug === "analitica-medicion")!.reasons[0]).toMatchObject({ signal: "meas.ga4", status: "not_detected" });
  });

  it("un sitio sin brechas no sugiere servicios de arreglo, y lo no verificable no sugiere nada", async () => {
    const { id } = await analyzed(GOOD);
    const s = (await scoreCompany(id))!.score;
    const obs = await pool().query(`SELECT id::text AS id, signal_code, status, kind, value, confidence, evidence_url FROM signal_observations WHERE id = ANY($1::bigint[])`, [s.observation_ids]);
    // Tiene GA4: no se sugiere medición por ese motivo (sí por no tener Tag Manager)
    const analitica = matchServices(await listOffers(false), buildFacts({ observations: obs.rows, manual: {}, company: { classified: true, hasDomain: true }, adjustment: null, asOf: new Date().toISOString() })).find((m) => m.slug === "analitica-medicion");
    expect(analitica?.reasons.some((r) => r.signal === "meas.ga4") ?? false).toBe(false);
    // El sitio de ejemplo tiene título, descripción y H1: lo único de SEO que falta es el sitemap
    const seo = matchServices(await listOffers(false), buildFacts({ observations: obs.rows, manual: {}, company: { classified: true, hasDomain: true }, adjustment: null, asOf: new Date().toISOString() })).find((m) => m.slug === "seo-contenido");
    expect(seo?.reasons.map((r) => r.signal)).toEqual(["seo.sitemap"]);
    const unver = obs.rows.map((o) => ({ ...o, status: "unverifiable" as const }));
    expect(matchServices(await listOffers(false), buildFacts({ observations: unver, manual: {}, company: { classified: true, hasDomain: true }, adjustment: null, asOf: new Date().toISOString() }))).toEqual([]);
  });

  it("un administrador crea servicios y reglas sin tocar código; los inactivos no se sugieren", async () => {
    const admin = await mkActor("admin");
    const lead = await mkActor("sales_lead");
    await expect(createOffer(lead, { name: "X", description: "" })).rejects.toBeInstanceOf(ForbiddenError);
    await createOffer(admin, { name: "Chatbot con IA", description: "Asistente de atención" });
    const offer = (await listOffers()).find((o) => o.slug === "chatbot-con-ia")!;
    await addRule(admin, offer.id, { rationale: "No se detecta WhatsApp", predicate: { signal: "conv.whatsapp", status: "not_detected" } });
    await expect(addRule(admin, offer.id, { rationale: "x", predicate: { signal: "Mal Código!", status: "observed" } })).rejects.toThrow(/condición/);
    await expect(addRule(admin, offer.id, { rationale: "  ", predicate: { signal: "conv.whatsapp", status: "observed" } })).rejects.toThrow(/motivo/);
    const facts = buildFacts({ observations: [{ id: "1", signal_code: "conv.whatsapp", status: "not_detected", kind: "observed", value: {}, confidence: "low", evidence_url: null }], manual: {}, company: { classified: true, hasDomain: true }, adjustment: null, asOf: new Date().toISOString() });
    expect(matchServices(await listOffers(false), facts).map((m) => m.slug)).toContain("chatbot-con-ia");
    await updateOffer(admin, offer.id, { name: "Chatbot con IA", description: "", active: false });
    expect(matchServices(await listOffers(false), facts).map((m) => m.slug)).not.toContain("chatbot-con-ia");
    const rule = (await listOffers()).find((o) => o.id === offer.id)!.rules[0]!;
    await deleteRule(admin, rule.id);
    expect((await listOffers()).find((o) => o.id === offer.id)!.rules).toHaveLength(0);
    void ownerPool;
  });
});
