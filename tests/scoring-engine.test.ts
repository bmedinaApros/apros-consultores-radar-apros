import { describe, expect, it } from "vitest";
import { computeScore, type ObservationInput, type ScoreInputs } from "@/lib/scoring/engine";
import { generalModel, industryModel, ModelError, validateModel, DIMENSIONS, type ModelDefinition } from "@/lib/scoring/model";

const AS_OF = "2026-11-06T00:00:00.000Z";
let n = 0;
const ob = (signal_code: string, status: ObservationInput["status"], value: Record<string, unknown> | null = {}, confidence: ObservationInput["confidence"] = "high", kind: ObservationInput["kind"] = "observed"): ObservationInput =>
  ({ id: String(++n), signal_code, status, kind, value, confidence, evidence_url: `https://x.pe/${signal_code}` });
const inputs = (observations: ObservationInput[], extra: Partial<ScoreInputs> = {}): ScoreInputs =>
  ({ observations, manual: {}, company: { classified: true, hasDomain: true }, adjustment: null, asOf: AS_OF, ...extra });

/** Modelo mínimo para probar umbrales con puntajes exactos. */
const tiny = (points: number, thresholds = { sales: 70, nurturing: 50 }): ModelDefinition => validateModel({
  thresholds,
  dimensions: [
    { key: "icp_fit", label: "ICP", weight: 100, rules: [{ id: "r1", label: "Regla", points, when: { signal: "seo.title", status: "observed" } }] },
    ...(["urgency", "payment_capacity", "retainer_potential", "decision_access"] as const).map((key) => ({ key, label: key, weight: 0, rules: [] })),
  ],
  disqualifiers: [],
});

describe("validación del modelo", () => {
  it("el modelo general es válido y sus pesos suman 100", () => {
    const m = validateModel(generalModel());
    expect(m.dimensions.map((d) => [d.key, d.weight])).toEqual(DIMENSIONS.map((d) => [d.key, d.weight]));
    expect(m.dimensions.reduce((s, d) => s + d.weight, 0)).toBe(100);
    expect(m.thresholds).toEqual({ sales: 70, nurturing: 50 });
  });

  it("rechaza pesos que no suman 100", () => {
    const m = generalModel();
    m.dimensions[0]!.weight = 31;
    expect(() => validateModel(m)).toThrow(/sumar 100 \(suman 101\)/);
  });
  it("rechaza umbrales incoherentes, dimensiones repetidas e identificadores duplicados", () => {
    const a = generalModel(); a.thresholds = { sales: 50, nurturing: 60 };
    expect(() => validateModel(a)).toThrow(/umbral/);
    const b = generalModel(); b.dimensions[1]!.key = "icp_fit";
    expect(() => validateModel(b)).toThrow(ModelError);
    const c = generalModel(); c.dimensions[1]!.rules[0]!.id = c.dimensions[0]!.rules[0]!.id;
    expect(() => validateModel(c)).toThrow(/únicos/);
  });
  it("rechaza condiciones mal formadas y datos fuera de rango", () => {
    const a = generalModel(); (a.dimensions[0]!.rules[0]!.when as Record<string, unknown>).field = "value"; delete (a.dimensions[0]!.rules[0]!.when as Record<string, unknown>).op;
    expect(() => validateModel(a)).toThrow();
    const b = generalModel(); b.dimensions[0]!.rules[0]!.points = 101;
    expect(() => validateModel(b)).toThrow();
    expect(() => validateModel({})).toThrow(ModelError);
    expect(() => validateModel("texto")).toThrow(ModelError);
  });
  it("un modelo de rubro agrega reglas con las señales propias del rubro", () => {
    const m = industryModel([{ slug: "citas", name: "Reserva de citas" }]);
    const ids = m.dimensions.flatMap((d) => d.rules.map((r) => r.id));
    expect(ids).toContain("rubro-citas");
    expect(ids).toContain("falta-citas");
  });
});

describe("cálculo del puntaje", () => {
  const model = validateModel(generalModel());

  it("sin ninguna señal verificable el puntaje es bajo y la cobertura 0", () => {
    const codes = ["seo.title", "meas.ga4", "conv.phone", "perf.pagespeed", "tech.tls"];
    const r = computeScore(model, inputs(codes.map((c) => ob(c, "unverifiable", { reason: "bloqueo" }, "low")), { company: { classified: false, hasDomain: true } }));
    expect(r.dataCoverage).toBe(0);
    expect(r.total).toBe(0);
    expect(r.band).toBe("discard");
  });

  it("una señal «no verificable» ni suma ni resta: da lo mismo que si no existiera", () => {
    const base = [ob("seo.title", "observed"), ob("conv.phone", "observed")];
    const a = computeScore(model, inputs(base));
    const b = computeScore(model, inputs([...base, ob("meas.ga4", "unverifiable", { reason: "x" }, "low")]));
    expect(b.total).toBe(a.total);
    expect(b.dimensions.find((d) => d.key === "urgency")!.fired).toEqual(a.dimensions.find((d) => d.key === "urgency")!.fired);
    expect(b.dataCoverage).toBeLessThan(a.dataCoverage); // solo baja la cobertura
  });

  it("una ausencia de confianza baja pesa la mitad que una de confianza alta", () => {
    const low = computeScore(model, inputs([ob("meas.ga4", "not_detected", {}, "low")]));
    const high = computeScore(model, inputs([ob("meas.ga4", "not_detected", {}, "high")]));
    const lowRule = low.dimensions.find((d) => d.key === "urgency")!.fired[0]!;
    const highRule = high.dimensions.find((d) => d.key === "urgency")!.fired[0]!;
    expect(lowRule).toMatchObject({ points: 20, factor: 0.5, effective: 10 });
    expect(highRule).toMatchObject({ points: 20, factor: 1, effective: 20 });
  });

  it("acota cada dimensión a 100 y reparte las contribuciones proporcionalmente", () => {
    const all = [
      ob("meas.ga4", "not_detected"), ob("seo.meta_description", "not_detected"), ob("seo.title", "not_detected"), ob("seo.h1", "not_detected"),
      ob("sd.jsonld", "not_detected"), ob("conv.mobile_viewport", "not_detected"), ob("tech.tls", "not_detected"), ob("conv.booking_or_quote", "not_detected"),
      ob("seo.sitemap", "not_detected"), ob("conv.whatsapp", "not_detected"),
    ];
    const r = computeScore(model, inputs(all));
    const u = r.dimensions.find((d) => d.key === "urgency")!;
    expect(u.raw).toBe(100);
    expect(u.contribution).toBe(25);
    expect(Math.round(u.fired.reduce((s, f) => s + f.contribution, 0))).toBe(25);
  });

  it("los puntos de cada dimensión aportan peso × puntuación / 100 al total", () => {
    const r = computeScore(model, inputs([ob("meas.ga4", "not_detected", {}, "high")], { company: { classified: false, hasDomain: true } }));
    // urgencia: 20 puntos de 100 → 25 × 0,2 = 5
    expect(r.total).toBe(5);
    expect(r.dimensions.find((d) => d.key === "urgency")!.contribution).toBe(5);
  });

  it("las reglas con campo comparan valores (rendimiento, antigüedad, listas)", () => {
    const r = computeScore(model, inputs([
      ob("perf.pagespeed", "observed", { performanceScore: 40 }),
      ob("tech.last_content", "observed", { date: "2023-01-01T00:00:00.000Z" }, "medium", "inferred"),
      ob("tech.cms", "observed", { name: "Shopify" }, "medium"),
    ]));
    const fired = r.dimensions.flatMap((d) => d.fired.map((f) => f.id));
    expect(fired).toContain("rendimiento-bajo");
    expect(fired).toContain("rendimiento-medio");
    expect(fired).toContain("contenido-antiguo");
    expect(fired).not.toContain("contenido-reciente");
    expect(fired).toContain("plataforma-comercial");
  });

  it("etiqueta el origen de cada punto: web, inferido, manual y empresa", () => {
    const r = computeScore(model, inputs([ob("seo.title", "observed"), ob("conv.cta", "observed", {}, "medium", "inferred"), ob("tech.last_content", "observed", { date: "2026-10-01T00:00:00Z" }, "medium", "inferred")], { manual: { company_size: "grande" } }));
    const bySource = (id: string) => r.dimensions.flatMap((d) => d.fired).find((f) => f.id === id)?.source;
    expect(bySource("sitio-activo")).toBe("web");
    expect(bySource("contenido-reciente")).toBe("inferido");
    expect(bySource("manual-tamano-grande")).toBe("manual");
    expect(bySource("rubro-confirmado")).toBe("empresa");
  });

  it("lista los criterios manuales pendientes y los puntos manuales solo cuentan si se capturaron", () => {
    const sin = computeScore(model, inputs([]));
    // «No es candidato» es una marca opcional (descalificador), no un criterio pendiente
    expect(sin.missingManual).toEqual(["company_size", "decision_maker_known", "icp_fit", "retainer_interest"]);
    const con = computeScore(model, inputs([], { manual: { icp_fit: "alto", company_size: "mediana", retainer_interest: "bajo", decision_maker_known: "no", not_fit: "no" } }));
    expect(con.missingManual).toEqual([]);
    expect(con.total).toBeGreaterThan(sin.total);
  });

  it("un descalificador duro fuerza la banda «descartar» aunque el puntaje sea alto", () => {
    const strong = [ob("seo.title", "observed"), ob("conv.phone", "observed"), ob("conv.whatsapp", "observed"), ob("meas.gtm", "observed"), ob("meas.meta_pixel", "observed")];
    const base = computeScore(model, inputs(strong, { manual: { icp_fit: "alto", company_size: "grande", retainer_interest: "alto", decision_maker_known: "si" } }));
    const withVendor = computeScore(model, inputs([...strong, ob("tech.vendor_credit", "observed", { text: "Desarrollado por Apros Consultores" })], { manual: { icp_fit: "alto", company_size: "grande", retainer_interest: "alto", decision_maker_known: "si" } }));
    expect(base.disqualified).toBe(false);
    expect(withVendor.disqualified).toBe(true);
    expect(withVendor.band).toBe("discard");
    expect(withVendor.disqualifiers[0]!.id).toBe("ya-es-cliente");
    expect(withVendor.reasons[0]).toMatch(/Descalificada/);
    const manualOut = computeScore(model, inputs(strong, { manual: { not_fit: "si" } }));
    expect(manualOut.band).toBe("discard");
  });

  it("el ajuste manual se suma, se acota entre 0 y 100 y queda en los motivos", () => {
    const base = computeScore(model, inputs([ob("meas.ga4", "not_detected")]));
    const up = computeScore(model, inputs([ob("meas.ga4", "not_detected")], { adjustment: { delta: 12, reason: "Conocen al dueño" } }));
    expect(up.total).toBe(Math.round((base.total + 12) * 10) / 10);
    expect(up.computed).toBe(base.computed);
    expect(up.reasons.at(-1)).toBe("Ajuste manual +12: Conocen al dueño");
    expect(computeScore(model, inputs([], { adjustment: { delta: -50, reason: "x" } })).total).toBe(0);
    expect(computeScore(model, inputs([], { adjustment: { delta: 500, reason: "x" } })).total).toBe(100);
  });
});

describe("umbrales (70 ventas, 50 a 69 nurturing, menos de 50 descartar)", () => {
  const band = (points: number) => computeScore(tiny(points), inputs([ob("seo.title", "observed")], { company: { classified: false, hasDomain: true } }));
  it.each([[100, 100, "sales"], [70, 70, "sales"], [69, 69, "nurturing"], [50, 50, "nurturing"], [49, 49, "discard"], [0, 0, "discard"]])(
    "%s puntos → %s", (points, total, expected) => { const r = band(points as number); expect(r.total).toBe(total); expect(r.band).toBe(expected); });
  it("los umbrales son configurables por modelo", () => {
    const r = computeScore(tiny(60, { sales: 60, nurturing: 40 }), inputs([ob("seo.title", "observed")], { company: { classified: false, hasDomain: true } }));
    expect(r.band).toBe("sales");
  });
});

describe("señales por rubro y reproducibilidad", () => {
  const model = industryModel([{ slug: "citas", name: "Reserva de citas" }]);

  it("una señal de otro rubro no existe para esta empresa y no resta ni cuenta en la cobertura", () => {
    const withIndustry = computeScore(model, inputs([ob("seo.title", "observed")]));
    expect(withIndustry.dimensions.flatMap((d) => d.fired).some((f) => f.signal.startsWith("industry."))).toBe(false);
    const general = computeScore(validateModel(generalModel()), inputs([ob("seo.title", "observed")]));
    expect(withIndustry.total).toBe(general.total);
    expect(withIndustry.dataCoverage).toBe(general.dataCoverage);
  });

  it("la señal del rubro suma cuando aplica", () => {
    const a = computeScore(model, inputs([ob("industry.citas", "observed", {}, "medium", "inferred")]));
    const b = computeScore(model, inputs([ob("industry.citas", "not_detected", {}, "low")]));
    expect(a.dimensions.find((d) => d.key === "icp_fit")!.fired.map((f) => f.id)).toContain("rubro-citas");
    expect(b.dimensions.find((d) => d.key === "urgency")!.fired.map((f) => f.id)).toContain("falta-citas");
  });

  it("es determinístico: mismas entradas, mismo resultado, sin importar el orden", () => {
    const obs = [ob("seo.title", "observed"), ob("meas.ga4", "not_detected", {}, "low"), ob("conv.phone", "observed"), ob("perf.pagespeed", "observed", { performanceScore: 30 })];
    const a = computeScore(model, inputs(obs, { manual: { icp_fit: "alto" } }));
    const b = computeScore(model, inputs([...obs].reverse(), { manual: { icp_fit: "alto" } }));
    expect(b).toEqual(a);
    expect(computeScore(model, inputs(obs, { manual: { icp_fit: "alto" } }))).toEqual(a);
  });
});
