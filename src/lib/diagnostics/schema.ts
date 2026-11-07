import { z } from "zod";

export const COMMERCIAL_MODELS = ["quick_win", "evolutivo", "proyecto", "servicio_recurrente", "transformacion"] as const;
export const COMMERCIAL_LABELS: Record<(typeof COMMERCIAL_MODELS)[number], string> = {
  quick_win: "Quick win", evolutivo: "Evolutivo", proyecto: "Proyecto", servicio_recurrente: "Servicio recurrente", transformacion: "Transformación digital",
};
export const KIND_LABELS = { hecho: "Hecho", inferencia: "Inferencia", hipotesis: "Hipótesis a validar" } as const;

/** Límites pensados para que el diagnóstico quepa en una página. */
export const LIMITS = { headline: 100, summary: 320, title: 80, observation: 260, opportunity: 200, impact: 200, solution: 220, deliverable: 120, kpi: 120, nextStep: 220, caveat: 160 } as const;

export const opportunitySchema = z.object({
  id: z.string().regex(/^o[1-3]$/),
  title: z.string().min(3).max(LIMITS.title),
  /** hecho = lo observado; inferencia = conclusión razonable; hipotesis = a validar con la empresa */
  kind: z.enum(["hecho", "inferencia", "hipotesis"]),
  observation: z.string().min(5).max(LIMITS.observation),
  opportunity: z.string().min(5).max(LIMITS.opportunity),
  impact: z.string().min(5).max(LIMITS.impact),
  solution: z.string().min(5).max(LIMITS.solution),
  deliverable: z.string().min(3).max(LIMITS.deliverable),
  commercialModel: z.enum(COMMERCIAL_MODELS),
  kpi: z.string().min(3).max(LIMITS.kpi),
  priority: z.enum(["alta", "media", "baja"]),
  /** Identificadores de las observaciones que respaldan la afirmación. */
  evidence: z.array(z.string().regex(/^\d{1,18}$/)).max(6),
  serviceSlug: z.string().max(80).nullable(),
});

export const diagnosticSchema = z.object({
  headline: z.string().min(5).max(LIMITS.headline),
  summary: z.string().min(10).max(LIMITS.summary),
  opportunities: z.array(opportunitySchema).min(1).max(3),
  nextStep: z.string().min(5).max(LIMITS.nextStep),
  caveats: z.array(z.string().min(3).max(LIMITS.caveat)).max(3),
});

export type Opportunity = z.infer<typeof opportunitySchema>;
export type DiagnosticContent = z.infer<typeof diagnosticSchema>;

export const TEXT_FIELDS = ["title", "observation", "opportunity", "impact", "solution", "deliverable", "kpi"] as const;

/**
 * JSON Schema para la salida estructurada del modelo. Los límites de longitud y los patrones se quitan porque la
 * API no los admite; se vuelven a exigir en el servidor con `diagnosticSchema`.
 */
export function modelJsonSchema(): { [key: string]: unknown } {
  const raw = z.toJSONSchema(diagnosticSchema, { target: "draft-7" }) as Record<string, unknown>;
  const strip = (n: unknown): unknown => {
    if (Array.isArray(n)) return n.map(strip);
    if (n && typeof n === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(n as Record<string, unknown>)) {
        if (["minLength", "maxLength", "pattern", "minItems", "maxItems", "$schema", "format", "minimum", "maximum"].includes(k)) continue;
        out[k] = strip(v);
      }
      if (out.type === "object" && out.properties) out.additionalProperties = false;
      return out;
    }
    return n;
  };
  return strip(raw) as { [key: string]: unknown };
}
