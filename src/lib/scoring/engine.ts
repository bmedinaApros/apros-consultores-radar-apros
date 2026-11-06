import type { ModelDefinition, DimensionKey } from "./model";
import { matches, type Fact, type Facts } from "./predicate";

export interface ObservationInput {
  id: string;
  signal_code: string;
  status: "observed" | "not_detected" | "unverifiable";
  kind: "observed" | "inferred";
  value: Record<string, unknown> | null;
  confidence: "high" | "medium" | "low";
  evidence_url: string | null;
}

export interface ScoreInputs {
  observations: ObservationInput[];
  /** Criterios capturados por una persona, por clave. */
  manual: Record<string, string>;
  company: { classified: boolean; hasDomain: boolean };
  /** Ajuste manual con motivo (puede ser nulo). */
  adjustment: { delta: number; reason: string } | null;
  /** Fecha de referencia para calcular antigüedades; se guarda para poder reproducir el cálculo. */
  asOf: string;
}

export type Source = "web" | "inferido" | "manual" | "empresa";

export interface FiredRule {
  id: string;
  label: string;
  source: Source;
  signal: string;
  confidence: "high" | "medium" | "low";
  factor: number;
  points: number;
  effective: number;
  contribution: number; // puntos sobre el puntaje total
  evidenceUrl: string | null;
  observationId: string | null;
}

export interface DimensionResult {
  key: DimensionKey;
  label: string;
  weight: number;
  raw: number; // 0–100 dentro de la dimensión
  contribution: number;
  fired: FiredRule[];
  rulesApplicable: number;
  rulesVerifiable: number;
}

export type Band = "sales" | "nurturing" | "discard";

export interface ScoreResult {
  computed: number;
  total: number;
  band: Band;
  disqualified: boolean;
  disqualifiers: { id: string; label: string }[];
  dimensions: DimensionResult[];
  /** Fracción de reglas aplicables cuya señal se pudo verificar (solo señales de la web). */
  dataCoverage: number;
  missingManual: string[];
  reasons: string[];
  adjustment: { delta: number; reason: string } | null;
}

const FACTOR = { high: 1, medium: 0.75, low: 0.5 } as const;
const round1 = (n: number) => Math.round(n * 10) / 10;

const sourceOf = (signal: string, fact: Fact): Source =>
  signal.startsWith("manual.") ? "manual" : signal.startsWith("company.") ? "empresa" : fact.kind === "inferred" ? "inferido" : "web";

function monthsBetween(iso: string, asOf: string): number | null {
  const a = Date.parse(iso), b = Date.parse(asOf);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round(((b - a) / (86_400_000 * 30.4375)) * 10) / 10);
}

/** Convierte las entradas en hechos consultables por las reglas. */
export function buildFacts(inp: ScoreInputs): Facts {
  const facts: Facts = new Map();
  for (const o of inp.observations) {
    let value = o.value;
    if (o.signal_code === "tech.last_content" && value && typeof value.date === "string") {
      const m = monthsBetween(value.date, inp.asOf);
      if (m !== null) value = { ...value, ageMonths: m };
    }
    facts.set(o.signal_code, { status: o.status, kind: o.kind, confidence: o.confidence, value, evidenceUrl: o.evidence_url, observationId: o.id });
  }
  for (const [k, v] of Object.entries(inp.manual)) facts.set(`manual.${k}`, { status: "observed", kind: "manual", confidence: "high", value: { value: v } });
  facts.set("company.classified", { status: "observed", kind: "observed", confidence: "high", value: { value: inp.company.classified } });
  facts.set("company.has_domain", { status: "observed", kind: "observed", confidence: "high", value: { value: inp.company.hasDomain } });
  return facts;
}

/**
 * Cálculo del puntaje. Función pura y determinística: mismas entradas y mismo modelo, mismo resultado.
 *
 * - Cada regla suma puntos si su condición se cumple; los puntos se ponderan por la confianza de la
 *   observación (alta 1, media 0,75, baja 0,5), porque una ausencia en HTML estático no es una certeza.
 * - La puntuación de una dimensión se acota a 100 y aporta `peso × puntuación / 100` al total.
 * - Una señal «no verificable» ni suma ni resta: no cumple ninguna condición. Solo baja la cobertura de datos.
 * - Una señal que no existe para el rubro (no aplica) tampoco resta ni cuenta en la cobertura.
 */
export function computeScore(model: ModelDefinition, inp: ScoreInputs): ScoreResult {
  const facts = buildFacts(inp);
  const dimensions: DimensionResult[] = [];
  let webApplicable = 0, webVerifiable = 0;
  const missingManual = new Set<string>();

  for (const d of model.dimensions) {
    const fired: FiredRule[] = [];
    let sum = 0, applicable = 0, verifiable = 0;
    const seenSignals = new Set<string>();
    for (const rule of d.rules) {
      const sig = rule.when.signal;
      const fact = facts.get(sig);
      if (sig.startsWith("manual.")) {
        if (!fact) missingManual.add(sig.slice("manual.".length));
      } else if (fact && !seenSignals.has(sig)) {
        seenSignals.add(sig);
        if (!sig.startsWith("company.")) {
          applicable++;
          if (fact.status !== "unverifiable") verifiable++;
        }
      }
      const m = matches(rule.when, facts);
      if (!m.ok || !m.fact) continue;
      const factor = m.fact.kind === "manual" || sig.startsWith("company.") ? 1 : FACTOR[m.fact.confidence];
      const effective = rule.points * factor;
      sum += effective;
      fired.push({
        id: rule.id, label: rule.label, source: sourceOf(sig, m.fact), signal: sig, confidence: m.fact.confidence, factor,
        points: rule.points, effective: round1(effective), contribution: 0,
        evidenceUrl: m.fact.evidenceUrl ?? null, observationId: m.fact.observationId ?? null,
      });
    }
    const raw = Math.min(100, sum);
    // Si varias reglas suman más de 100, las contribuciones se reparten proporcionalmente al tope.
    const scale = sum > 100 ? 100 / sum : 1;
    for (const f of fired) f.contribution = round1((d.weight * f.effective * scale) / 100);
    dimensions.push({ key: d.key, label: d.label, weight: d.weight, raw: round1(raw), contribution: round1((d.weight * raw) / 100), fired, rulesApplicable: applicable, rulesVerifiable: verifiable });
    webApplicable += applicable;
    webVerifiable += verifiable;
  }

  const disqualifiers = model.disqualifiers.filter((q) => matches(q.when, facts).ok).map((q) => ({ id: q.id, label: q.label }));
  const computed = round1(dimensions.reduce((n, d) => n + d.contribution, 0));
  const delta = inp.adjustment?.delta ?? 0;
  const total = round1(Math.min(100, Math.max(0, computed + delta)));
  const disqualified = disqualifiers.length > 0;
  const band: Band = disqualified ? "discard" : total >= model.thresholds.sales ? "sales" : total >= model.thresholds.nurturing ? "nurturing" : "discard";

  const reasons = [
    ...disqualifiers.map((q) => `Descalificada: ${q.label}`),
    ...dimensions.flatMap((d) => d.fired.map((f) => ({ d, f }))).sort((a, b) => b.f.contribution - a.f.contribution).slice(0, 5).map(({ d, f }) => `${d.label}: ${f.label} (+${f.contribution} pts${f.source === "manual" ? ", manual" : f.source === "inferido" ? ", inferido" : ""})`),
    ...(inp.adjustment ? [`Ajuste manual ${inp.adjustment.delta > 0 ? "+" : ""}${inp.adjustment.delta}: ${inp.adjustment.reason}`] : []),
  ];

  return {
    computed, total, band, disqualified, disqualifiers, dimensions,
    dataCoverage: webApplicable === 0 ? 0 : round1(webVerifiable / webApplicable),
    missingManual: [...missingManual].sort(), reasons, adjustment: inp.adjustment,
  };
}
