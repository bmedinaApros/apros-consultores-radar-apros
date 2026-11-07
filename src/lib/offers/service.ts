import { z } from "zod";
import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import { cleanText } from "../companies/normalize";
import { CompanyError, type ActorInfo } from "../companies/service";
import { requirePermission } from "../rbac";
import { describePredicate, matches, predicateSchema, type Facts, type Predicate } from "../scoring/predicate";

export interface ServiceOffer { id: string; slug: string; name: string; description: string; active: boolean; is_example: boolean }
export interface ServiceRule { id: string; service_id: string; rationale: string; predicate: Predicate; active: boolean }

const P = (signal: string, status: "observed" | "not_detected", extra?: { field: string; op: "eq" | "lt" | "gte" | "gt"; value: string | number | boolean }): Predicate =>
  ({ signal, status, ...(extra ?? {}) }) as Predicate;

/** Catálogo de EJEMPLO, editable. APROS debe reemplazarlo por su oferta real. */
const DEFAULT_OFFERS: { slug: string; name: string; description: string; rules: [string, Predicate][] }[] = [
  { slug: "analitica-medicion", name: "Analítica y medición (GA4, GTM, eventos)", description: "Configuración de medición, eventos y tableros.", rules: [
    ["No se detecta Google Analytics 4 en el sitio", P("meas.ga4", "not_detected")],
    ["Solo se detecta Universal Analytics, que ya no recibe datos", P("meas.ga4", "observed", { field: "legacyUniversalAnalytics", op: "eq", value: true })],
    ["No se detecta Google Tag Manager", P("meas.gtm", "not_detected")],
  ] },
  { slug: "seo-contenido", name: "SEO técnico y contenido", description: "Optimización técnica y estrategia de contenidos.", rules: [
    ["Falta la meta descripción", P("seo.meta_description", "not_detected")],
    ["Falta el título de página", P("seo.title", "not_detected")],
    ["Falta el encabezado H1", P("seo.h1", "not_detected")],
    ["Sin datos estructurados", P("sd.jsonld", "not_detected")],
    ["Sin sitemap", P("seo.sitemap", "not_detected")],
    ["La portada pide a los buscadores no indexarla", P("seo.indexable", "observed", { field: "indexable", op: "eq", value: false })],
    ["Hay varios enlaces rotos en la muestra", P("seo.broken_links", "observed", { field: "broken", op: "gte", value: 3 })],
  ] },
  { slug: "rendimiento-web", name: "Rendimiento web", description: "Mejora de velocidad y Core Web Vitals.", rules: [
    ["El rendimiento móvil medido por PageSpeed está bajo 75", P("perf.pagespeed", "observed", { field: "performanceScore", op: "lt", value: 75 })],
  ] },
  { slug: "web-ux-ui", name: "Evolución web (UX/UI)", description: "Rediseño o evolución orientada a conversión.", rules: [
    ["El sitio no declara adaptación a móvil", P("conv.mobile_viewport", "not_detected")],
    ["El sitio no se sirve con HTTPS", P("tech.tls", "not_detected")],
    ["El último contenido tiene más de 18 meses", P("tech.last_content", "observed", { field: "ageMonths", op: "gt", value: 18 })],
    ["El certificado TLS es inválido", P("tech.tls", "observed", { field: "valid", op: "eq", value: false })],
  ] },
  { slug: "cro-conversion", name: "CRO y páginas de conversión", description: "Formularios, llamados a la acción y pruebas A/B.", rules: [
    ["No se detectan formularios", P("conv.form", "not_detected")],
    ["No se detecta reserva ni cotización en línea", P("conv.booking_or_quote", "not_detected")],
    ["No se detectan llamados a la acción", P("conv.cta", "not_detected")],
  ] },
  { slug: "automatizacion-whatsapp-crm", name: "Automatización, WhatsApp y CRM", description: "Integración de canales y seguimiento de leads.", rules: [
    ["No se detecta un enlace a WhatsApp", P("conv.whatsapp", "not_detected")],
  ] },
  { slug: "herramientas-interactivas", name: "Cotizadores, simuladores y herramientas a medida", description: "Funcionalidades propias del rubro.", rules: [
    ["No se detecta cotización o simulador (inmobiliario)", P("industry.cotizacion", "not_detected")],
    ["No se detecta reserva de citas (salud)", P("industry.citas", "not_detected")],
    ["No se detecta admisión o matrícula en línea (educación)", P("industry.admision", "not_detected")],
    ["No se detecta compra en línea (retail)", P("industry.comercio-electronico", "not_detected")],
    ["No se detecta solicitud de consulta (servicios profesionales)", P("industry.consulta", "not_detected")],
    ["No se detecta solicitud de cotización industrial", P("industry.cotizacion-industrial", "not_detected")],
  ] },
];
export async function ensureDefaultOffers(): Promise<void> {
  const any = await pool().query(`SELECT 1 FROM service_offers LIMIT 1`);
  if (any.rowCount) return;
  await withTransaction(async (c) => {
    for (const o of DEFAULT_OFFERS) {
      const r = await c.query<{ id: string }>(`INSERT INTO service_offers (slug, name, description, is_example) VALUES ($1,$2,$3,true) ON CONFLICT (slug) DO NOTHING RETURNING id`, [o.slug, o.name, o.description]);
      if (!r.rows[0]) continue;
      for (const [rationale, predicate] of o.rules) {
        await c.query(`INSERT INTO signal_service_rules (service_id, rationale, predicate) VALUES ($1,$2,$3::jsonb)`, [r.rows[0].id, rationale, JSON.stringify(predicateSchema.parse(predicate))]);
      }
    }
  });
}

export async function listOffers(includeInactive = true): Promise<(ServiceOffer & { rules: ServiceRule[] })[]> {
  await ensureDefaultOffers();
  const offers = (await pool().query<ServiceOffer>(`SELECT id, slug, name, description, active, is_example FROM service_offers WHERE ($1 OR active) ORDER BY name`, [includeInactive])).rows;
  const rules = (await pool().query<ServiceRule>(`SELECT id, service_id, rationale, predicate, active FROM signal_service_rules ORDER BY rationale`)).rows;
  return offers.map((o) => ({ ...o, rules: rules.filter((r) => r.service_id === o.id) }));
}

export interface ServiceMatch {
  slug: string;
  name: string;
  /** Siempre una hipótesis a validar con el prospecto, nunca un hecho. */
  hypothesis: true;
  reasons: { rationale: string; signal: string; status: string; confidence: string; evidenceUrl: string | null }[];
}

/** Servicios cuyo encaje sugieren las señales. Solo cuentan reglas activas de servicios activos. */
export function matchServices(offers: (ServiceOffer & { rules: ServiceRule[] })[], facts: Facts): ServiceMatch[] {
  const out: ServiceMatch[] = [];
  for (const o of offers) {
    if (!o.active) continue;
    const reasons: ServiceMatch["reasons"] = [];
    for (const r of o.rules) {
      if (!r.active) continue;
      const m = matches(r.predicate, facts);
      if (m.ok && m.fact) reasons.push({ rationale: r.rationale, signal: r.predicate.signal, status: m.fact.status, confidence: m.fact.confidence, evidenceUrl: m.fact.evidenceUrl ?? null });
    }
    if (reasons.length) out.push({ slug: o.slug, name: o.name, hypothesis: true, reasons });
  }
  return out.sort((a, b) => b.reasons.length - a.reasons.length || a.name.localeCompare(b.name));
}

// ---------- Administración ----------

const slugOf = (s: string) => s.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function createOffer(actor: ActorInfo, input: { name: string; description: string }): Promise<void> {
  requirePermission(actor, "catalog.manage");
  const name = cleanText(input.name, 120);
  const slug = name ? slugOf(name) : "";
  if (!name || !slug) throw new CompanyError("Nombre de servicio inválido");
  await ensureDefaultOffers();
  await withTransaction(async (c) => {
    try {
      const r = await c.query<{ id: string }>(`INSERT INTO service_offers (slug, name, description) VALUES ($1,$2,$3) RETURNING id`, [slug, name, cleanText(input.description, 300) ?? ""]);
      await audit({ actorId: actor.id, actorEmail: actor.email, action: "service_offer.created", entityType: "service_offer", entityId: r.rows[0]!.id, metadata: { name } }, c);
    } catch (e) {
      if ((e as { code?: string }).code === "23505") throw new CompanyError("Ya existe un servicio con ese nombre");
      throw e;
    }
  });
}

export async function updateOffer(actor: ActorInfo, id: string, input: { name: string; description: string; active: boolean }): Promise<void> {
  requirePermission(actor, "catalog.manage");
  const name = cleanText(input.name, 120);
  if (!name) throw new CompanyError("Nombre de servicio inválido");
  await withTransaction(async (c) => {
    const r = await c.query(`UPDATE service_offers SET name=$2, description=$3, active=$4, is_example=false WHERE id=$1`, [id, name, cleanText(input.description, 300) ?? "", input.active]);
    if (r.rowCount === 0) throw new CompanyError("Servicio no encontrado");
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "service_offer.updated", entityType: "service_offer", entityId: id, metadata: { active: input.active } }, c);
  });
}

export async function addRule(actor: ActorInfo, serviceId: string, input: { rationale: string; predicate: unknown }): Promise<void> {
  requirePermission(actor, "catalog.manage");
  const why = cleanText(input.rationale, 200);
  if (!why) throw new CompanyError("Indica el motivo que verá el equipo comercial");
  const parsed = predicateSchema.safeParse(input.predicate);
  if (!parsed.success) throw new CompanyError("La condición no es válida");
  await withTransaction(async (c) => {
    try {
      const r = await c.query<{ id: string }>(`INSERT INTO signal_service_rules (service_id, rationale, predicate) VALUES ($1,$2,$3::jsonb) RETURNING id`, [serviceId, why, JSON.stringify(parsed.data)]);
      await audit({ actorId: actor.id, actorEmail: actor.email, action: "service_rule.created", entityType: "service_rule", entityId: r.rows[0]!.id, metadata: { condition: describePredicate(parsed.data) } }, c);
    } catch (e) {
      if ((e as { code?: string }).code === "23503") throw new CompanyError("Servicio no encontrado");
      throw e;
    }
  });
}

export async function deleteRule(actor: ActorInfo, ruleId: string): Promise<void> {
  requirePermission(actor, "catalog.manage");
  await withTransaction(async (c) => {
    const r = await c.query(`DELETE FROM signal_service_rules WHERE id = $1`, [ruleId]);
    if (r.rowCount === 0) throw new CompanyError("Regla no encontrada");
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "service_rule.deleted", entityType: "service_rule", entityId: ruleId }, c);
  });
}

export const ruleInputSchema = z.object({
  signal: z.string().regex(/^[a-z0-9_.-]+$/).max(80),
  status: z.enum(["observed", "not_detected"]),
});
