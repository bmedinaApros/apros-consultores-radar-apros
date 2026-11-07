import { z } from "zod";

/**
 * Condiciones declarativas (sin código ejecutable) sobre las señales observadas. Se usan en las reglas de
 * puntaje, en los descalificadores y en las reglas que relacionan señales con servicios.
 */
export const STATUSES = ["observed", "not_detected", "unverifiable"] as const;
export type SignalStatus = (typeof STATUSES)[number];

export const predicateSchema = z.object({
  signal: z.string().min(1).max(80).regex(/^[a-z0-9_.-]+$/),
  /** Estado que debe tener la observación. Una señal «no verificable» nunca cumple una condición de otro estado. */
  status: z.enum(STATUSES),
  field: z.string().min(1).max(40).regex(/^[A-Za-z0-9_]+$/).optional(),
  op: z.enum(["eq", "neq", "lt", "lte", "gt", "gte", "contains", "in"]).optional(),
  value: z.union([z.string().max(200), z.number(), z.boolean(), z.array(z.union([z.string().max(100), z.number()])).max(20)]).optional(),
}).refine((p) => (p.field === undefined) === (p.op === undefined) && (p.op === undefined) === (p.value === undefined), {
  message: "field, op y value deben ir juntos",
});

export type Predicate = z.infer<typeof predicateSchema>;

export interface Fact {
  status: SignalStatus;
  kind: "observed" | "inferred" | "manual";
  confidence: "high" | "medium" | "low";
  value: Record<string, unknown> | null;
  evidenceUrl?: string | null;
  observationId?: string | null;
}

export type Facts = Map<string, Fact>;

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

export function matches(p: Predicate, facts: Facts): { ok: boolean; fact?: Fact } {
  const fact = facts.get(p.signal);
  if (!fact) return { ok: false }; // la señal no aplica o no existe: no cumple (y tampoco resta)
  if (fact.status !== p.status) return { ok: false, fact };
  if (p.field === undefined) return { ok: true, fact };
  const actual = fact.value?.[p.field];
  const expected = p.value;
  switch (p.op) {
    case "eq": return { ok: actual === expected, fact };
    case "neq": return { ok: actual !== undefined && actual !== expected, fact };
    case "lt": case "lte": case "gt": case "gte": {
      const a = num(actual), e = num(expected);
      if (a === null || e === null) return { ok: false, fact };
      return { ok: p.op === "lt" ? a < e : p.op === "lte" ? a <= e : p.op === "gt" ? a > e : a >= e, fact };
    }
    case "contains": return { ok: typeof actual === "string" && typeof expected === "string" && actual.toLowerCase().includes(expected.toLowerCase()), fact };
    case "in": return { ok: Array.isArray(expected) && (typeof actual === "string" || typeof actual === "number") && (expected as (string | number)[]).includes(actual), fact };
    default: return { ok: false, fact };
  }
}

export const describePredicate = (p: Predicate): string => {
  const st = { observed: "observada", not_detected: "no detectada", unverifiable: "no verificable" }[p.status];
  const f = p.field ? ` y ${p.field} ${({ eq: "=", neq: "≠", lt: "<", lte: "≤", gt: ">", gte: "≥", contains: "contiene", in: "en" } as const)[p.op!]} ${Array.isArray(p.value) ? p.value.join("/") : String(p.value)}` : "";
  return `${p.signal} ${st}${f}`;
};
