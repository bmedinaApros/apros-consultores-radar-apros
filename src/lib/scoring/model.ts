import { z } from "zod";
import { predicateSchema } from "./predicate";

export const DIMENSIONS = [
  { key: "icp_fit", label: "Encaje con ICP y vertical", weight: 30 },
  { key: "urgency", label: "Señal de urgencia", weight: 25 },
  { key: "payment_capacity", label: "Capacidad de pago", weight: 25 },
  { key: "retainer_potential", label: "Potencial de retainer", weight: 10 },
  { key: "decision_access", label: "Acceso al decisor", weight: 10 },
] as const;
export type DimensionKey = (typeof DIMENSIONS)[number]["key"];

export const ruleSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]{2,60}$/),
  label: z.string().min(2).max(160),
  when: predicateSchema,
  points: z.number().min(0).max(100),
});

export const modelSchema = z.object({
  dimensions: z.array(z.object({
    key: z.enum(DIMENSIONS.map((d) => d.key) as [DimensionKey, ...DimensionKey[]]),
    label: z.string().min(2).max(80),
    weight: z.number().int().min(0).max(100),
    rules: z.array(ruleSchema).max(60),
  })).length(5),
  thresholds: z.object({ sales: z.number().int().min(1).max(100), nurturing: z.number().int().min(0).max(99) }),
  disqualifiers: z.array(z.object({ id: z.string().regex(/^[a-z0-9_-]{2,60}$/), label: z.string().min(2).max(160), when: predicateSchema })).max(20),
});

export type ModelDefinition = z.infer<typeof modelSchema>;

export class ModelError extends Error {
  override name = "ModelError";
}

/** Valida el modelo: esquema, pesos que suman 100, umbrales coherentes e identificadores únicos. */
export function validateModel(input: unknown): ModelDefinition {
  const parsed = modelSchema.safeParse(input);
  if (!parsed.success) {
    throw new ModelError(parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".") || "modelo"}: ${i.message}`).join("; "));
  }
  const m = parsed.data;
  const keys = m.dimensions.map((d) => d.key);
  if (new Set(keys).size !== 5) throw new ModelError("Cada dimensión debe aparecer exactamente una vez");
  const total = m.dimensions.reduce((n, d) => n + d.weight, 0);
  if (total !== 100) throw new ModelError(`Los pesos deben sumar 100 (suman ${total})`);
  if (m.thresholds.nurturing >= m.thresholds.sales) throw new ModelError("El umbral de nurturing debe ser menor que el de ventas");
  const ids = [...m.dimensions.flatMap((d) => d.rules.map((r) => r.id)), ...m.disqualifiers.map((d) => d.id)];
  if (new Set(ids).size !== ids.length) throw new ModelError("Los identificadores de reglas y descalificadores deben ser únicos");
  return m;
}

// ---------- Criterios manuales (no observables en la web) ----------

export interface ManualCriterion { key: string; label: string; help: string; options: { value: string; label: string }[] }

export const MANUAL_CRITERIA: ManualCriterion[] = [
  { key: "icp_fit", label: "Encaje con el cliente ideal", help: "Juicio de la persona que conoce a la empresa.", options: [{ value: "alto", label: "Alto" }, { value: "medio", label: "Medio" }, { value: "bajo", label: "Bajo" }] },
  { key: "company_size", label: "Tamaño de la empresa", help: "Según lo que sabe el equipo (no se infiere de la web).", options: [{ value: "micro", label: "Micro" }, { value: "pequena", label: "Pequeña" }, { value: "mediana", label: "Mediana" }, { value: "grande", label: "Grande" }] },
  { key: "retainer_interest", label: "Interés probable en un servicio recurrente", help: "Según conversaciones o contexto comercial.", options: [{ value: "alto", label: "Alto" }, { value: "medio", label: "Medio" }, { value: "bajo", label: "Bajo" }] },
  { key: "decision_maker_known", label: "Se conoce al decisor", help: "Hay un contacto con poder de decisión identificado.", options: [{ value: "si", label: "Sí" }, { value: "no", label: "No" }] },
  { key: "not_fit", label: "No es un buen candidato (descalifica)", help: "Marca solo si hay una razón comercial clara.", options: [{ value: "si", label: "Sí, descartar" }, { value: "no", label: "No" }] },
];

export const manualOptionValid = (key: string, value: string): boolean =>
  MANUAL_CRITERIA.find((c) => c.key === key)?.options.some((o) => o.value === value) ?? false;

// ---------- Modelo general y modelos de ejemplo por rubro ----------

type Rule = z.infer<typeof ruleSchema>;
const r = (id: string, label: string, signal: string, status: "observed" | "not_detected", points: number, extra?: { field: string; op: "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "contains" | "in"; value: string | number | boolean | (string | number)[] }): Rule => ({
  id, label, points, when: { signal, status, ...(extra ?? {}) } as Rule["when"],
});

export function generalModel(): ModelDefinition {
  return {
    thresholds: { sales: 70, nurturing: 50 },
    dimensions: [
      { key: "icp_fit", label: "Encaje con ICP y vertical", weight: 30, rules: [
        r("rubro-confirmado", "El rubro está confirmado", "company.classified", "observed", 20, { field: "value", op: "eq", value: true }),
        r("sitio-activo", "El sitio responde y tiene título", "seo.title", "observed", 15),
        r("contenido-reciente", "Contenido publicado en los últimos 24 meses", "tech.last_content", "observed", 20, { field: "ageMonths", op: "lte", value: 24 }),
        r("manual-icp-alto", "Encaje alto según el equipo", "manual.icp_fit", "observed", 45, { field: "value", op: "eq", value: "alto" }),
        r("manual-icp-medio", "Encaje medio según el equipo", "manual.icp_fit", "observed", 20, { field: "value", op: "eq", value: "medio" }),
      ] },
      { key: "urgency", label: "Señal de urgencia", weight: 25, rules: [
        r("sin-medicion", "No se detecta Google Analytics 4", "meas.ga4", "not_detected", 20),
        r("solo-ua", "Solo Universal Analytics (obsoleto)", "meas.ga4", "observed", 25, { field: "legacyUniversalAnalytics", op: "eq", value: true }),
        r("sin-descripcion", "Sin meta descripción", "seo.meta_description", "not_detected", 10),
        r("sin-titulo", "Sin título de página", "seo.title", "not_detected", 10),
        r("sin-h1", "Sin encabezado H1", "seo.h1", "not_detected", 5),
        r("sin-datos-estructurados", "Sin datos estructurados", "sd.jsonld", "not_detected", 10),
        r("sin-viewport", "Sin adaptación a móvil (viewport)", "conv.mobile_viewport", "not_detected", 20),
        r("rendimiento-bajo", "Rendimiento móvil bajo (menos de 50)", "perf.pagespeed", "observed", 25, { field: "performanceScore", op: "lt", value: 50 }),
        r("rendimiento-medio", "Rendimiento móvil mejorable (50 a 74)", "perf.pagespeed", "observed", 10, { field: "performanceScore", op: "lt", value: 75 }),
        r("sin-https", "Sin HTTPS", "tech.tls", "not_detected", 25),
        r("tls-invalido", "Certificado TLS inválido", "tech.tls", "observed", 25, { field: "valid", op: "eq", value: false }),
        r("enlaces-rotos", "Varios enlaces rotos en la muestra", "seo.broken_links", "observed", 10, { field: "broken", op: "gte", value: 3 }),
        r("sin-cotizacion", "Sin reserva ni cotización en línea", "conv.booking_or_quote", "not_detected", 10),
        r("sin-whatsapp", "Sin WhatsApp", "conv.whatsapp", "not_detected", 5),
        r("sin-sitemap", "Sin sitemap", "seo.sitemap", "not_detected", 10),
        r("no-indexable", "Bloquea la indexación (noindex)", "seo.indexable", "observed", 25, { field: "indexable", op: "eq", value: false }),
        r("contenido-antiguo", "Último contenido hace más de 18 meses", "tech.last_content", "observed", 15, { field: "ageMonths", op: "gt", value: 18 }),
      ] },
      { key: "payment_capacity", label: "Capacidad de pago", weight: 25, rules: [
        r("sitio-grande", "Sitemap con 50 o más páginas", "seo.sitemap", "observed", 25, { field: "urls", op: "gte", value: 50 }),
        r("sitio-mediano", "Sitemap con 10 a 49 páginas", "seo.sitemap", "observed", 10, { field: "urls", op: "gte", value: 10 }),
        r("usa-gtm", "Usa Google Tag Manager", "meas.gtm", "observed", 15),
        r("invierte-pauta", "Píxel de Meta detectado (indicio, no prueba, de inversión en publicidad)", "meas.meta_pixel", "observed", 20),
        r("invierte-ads", "Etiqueta de Google Ads detectada (indicio de inversión en publicidad)", "meas.google_ads", "observed", 15),
        r("agencia", "Crédito visible de un proveedor web", "tech.vendor_credit", "observed", 15),
        r("plataforma-comercial", "Plataforma de comercio (Shopify, Magento)", "tech.cms", "observed", 10, { field: "name", op: "in", value: ["Shopify", "Magento"] }),
        r("manual-tamano-grande", "Empresa grande según el equipo", "manual.company_size", "observed", 70, { field: "value", op: "eq", value: "grande" }),
        r("manual-tamano-mediana", "Empresa mediana según el equipo", "manual.company_size", "observed", 50, { field: "value", op: "eq", value: "mediana" }),
        r("manual-tamano-pequena", "Empresa pequeña según el equipo", "manual.company_size", "observed", 20, { field: "value", op: "eq", value: "pequena" }),
      ] },
      { key: "retainer_potential", label: "Potencial de retainer", weight: 10, rules: [
        r("contenido-continuo", "Contenido publicado en los últimos 6 meses", "tech.last_content", "observed", 25, { field: "ageMonths", op: "lte", value: 6 }),
        r("pauta-continua", "Gestiona publicidad (píxel de Meta)", "meas.meta_pixel", "observed", 30),
        r("analitica-activa", "Usa analítica (GA4)", "meas.ga4", "observed", 20, { field: "detected", op: "eq", value: true }),
        r("manual-retainer-alto", "Interés alto en servicio recurrente según el equipo", "manual.retainer_interest", "observed", 60, { field: "value", op: "eq", value: "alto" }),
        r("manual-retainer-medio", "Interés medio en servicio recurrente según el equipo", "manual.retainer_interest", "observed", 30, { field: "value", op: "eq", value: "medio" }),
      ] },
      { key: "decision_access", label: "Acceso al decisor", weight: 10, rules: [
        r("tiene-telefono", "Teléfono visible", "conv.phone", "observed", 25),
        r("tiene-whatsapp", "WhatsApp visible", "conv.whatsapp", "observed", 25),
        r("tiene-formulario", "Formulario de contacto", "conv.form", "observed", 15),
        r("manual-decisor", "Se conoce al decisor", "manual.decision_maker_known", "observed", 60, { field: "value", op: "eq", value: "si" }),
      ] },
    ],
    disqualifiers: [
      { id: "ya-es-cliente", label: "El sitio muestra a APROS como proveedor (ya es cliente)", when: { signal: "tech.vendor_credit", status: "observed", field: "text", op: "contains", value: "apros" } },
      { id: "no-es-candidato", label: "Marcada manualmente como no candidata", when: { signal: "manual.not_fit", status: "observed", field: "value", op: "eq", value: "si" } },
    ],
  };
}

/** Modelos de ejemplo por rubro: el general más reglas con las señales propias del rubro. */
export function industryModel(extra: { slug: string; name: string }[]): ModelDefinition {
  const base = generalModel();
  const icp = base.dimensions.find((d) => d.key === "icp_fit")!;
  const urgency = base.dimensions.find((d) => d.key === "urgency")!;
  for (const s of extra) {
    icp.rules.push(r(`rubro-${s.slug}`.slice(0, 60), `Ofrece en línea: ${s.name}`, `industry.${s.slug}`, "observed", 20));
    urgency.rules.push(r(`falta-${s.slug}`.slice(0, 60), `No se detecta: ${s.name}`, `industry.${s.slug}`, "not_detected", 15));
  }
  return validateModel(base);
}
