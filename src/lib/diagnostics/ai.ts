import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";
import type { GenerationContext } from "./prompt";
import { diagnosticSchema, type DiagnosticContent, type Opportunity } from "./schema";

export interface AiInput {
  system: string;
  user: string;
  schema: { [key: string]: unknown };
  maxTokens: number;
  context: GenerationContext;
}

export interface AiOutput {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  stopReason: string;
}

export interface AiProvider {
  id: "anthropic" | "simulated";
  model: string;
  generate(input: AiInput): Promise<AiOutput>;
}

export class AiRefusalError extends Error {
  override name = "AiRefusalError";
}
export class AiCallError extends Error {
  override name = "AiCallError";
  constructor(message: string, public retryable = false) {
    super(message);
  }
}

/** Subconjunto del cliente del SDK que usamos; permite probar sin red. */
export interface MessagesClient {
  messages: { create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message> };
}

/**
 * Proveedor de Anthropic. El modelo NO recibe herramientas, secretos ni acceso a la red: solo texto y un esquema de
 * salida. No se envían parámetros de muestreo (los modelos actuales los rechazan).
 */
export function anthropicProvider(opts: { apiKey?: string; model: string; client?: MessagesClient; effort?: "low" | "medium" | "high" }): AiProvider {
  const client: MessagesClient = opts.client ?? new Anthropic({ apiKey: opts.apiKey, maxRetries: 2, timeout: 180_000 });
  return {
    id: "anthropic",
    model: opts.model,
    async generate(input) {
      let res: Anthropic.Message;
      try {
        res = await client.messages.create({
          model: opts.model,
          max_tokens: input.maxTokens,
          system: input.system,
          messages: [{ role: "user", content: input.user }],
          output_config: { effort: opts.effort ?? "medium", format: { type: "json_schema", schema: input.schema } },
        });
      } catch (e) {
        if (e instanceof Anthropic.APIError) {
          const status = e.status ?? 0;
          throw new AiCallError(`La API de IA respondió ${status || "con un error de red"}`, status === 429 || status >= 500 || status === 0);
        }
        throw new AiCallError("No se pudo llamar a la API de IA", true);
      }
      if (res.stop_reason === "refusal") throw new AiRefusalError("El modelo declinó responder esta solicitud");
      if (res.stop_reason === "max_tokens") throw new AiCallError("La respuesta se cortó por el límite de tokens", false);
      const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
      return {
        text, model: res.model ?? opts.model, stopReason: String(res.stop_reason),
        inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, cacheReadTokens: res.usage.cache_read_input_tokens ?? 0,
      };
    },
  };
}

// ---------- Proveedor simulado (sin IA): solo para desarrollo, pruebas y demostraciones ----------

const opp = (id: string, o: Omit<Opportunity, "id">): Opportunity => ({ id, ...o });

interface Rule { match: (c: GenerationContext) => GenerationContext["observations"]; build: (id: string, ev: GenerationContext["observations"]) => Opportunity }

const find = (c: GenerationContext, code: string, status: "observed" | "not_detected") => c.observations.filter((o) => o.signal === code && o.status === status);

const RULES: Rule[] = [
  { match: (c) => find(c, "meas.ga4", "not_detected"), build: (id, ev) => opp(id, {
    title: "Medición confiable del sitio", kind: "inferencia",
    observation: "No se detecta Google Analytics 4 en el HTML del sitio.", opportunity: "Contar con medición confiable de lo que hacen los visitantes.",
    impact: "Permitiría decidir con datos qué páginas y campañas generan consultas.", solution: "Definir el plan de medición y los eventos clave del sitio.",
    deliverable: "Plan de medición y analítica configurada.", commercialModel: "quick_win", kpi: "Consultas y eventos clave medidos por canal.", priority: "alta",
    evidence: ev.map((o) => o.id), serviceSlug: "analitica-medicion" }) },
  { match: (c) => find(c, "conv.mobile_viewport", "not_detected"), build: (id, ev) => opp(id, {
    title: "Experiencia pensada para móvil", kind: "inferencia",
    observation: "No se detecta la declaración de adaptación a móvil en la página.", opportunity: "Mejorar la lectura y el contacto desde el celular.",
    impact: "Facilitaría que más visitantes lleguen a contactar desde su teléfono.", solution: "Evolucionar el diseño con enfoque móvil primero.",
    deliverable: "Diseño responsive de las páginas clave.", commercialModel: "proyecto", kpi: "Contactos iniciados desde móvil.", priority: "alta",
    evidence: ev.map((o) => o.id), serviceSlug: "web-ux-ui" }) },
  { match: (c) => find(c, "perf.pagespeed", "observed").filter((o) => typeof o.value.performanceScore === "number" && (o.value.performanceScore as number) < 75), build: (id, ev) => opp(id, {
    title: "Velocidad de carga en móvil", kind: "hecho",
    observation: `PageSpeed midió un puntaje móvil de ${ev[0]!.value.performanceScore}.`, opportunity: "Existe potencial para acelerar la carga de las páginas.",
    impact: "Una carga más rápida favorece la permanencia y el contacto.", solution: "Optimizar imágenes y recursos de las páginas principales.",
    deliverable: "Optimización de rendimiento y revisión posterior.", commercialModel: "evolutivo", kpi: "Puntaje de rendimiento móvil y tasa de rebote.", priority: "media",
    evidence: ev.map((o) => o.id), serviceSlug: "rendimiento-web" }) },
  { match: (c) => ["seo.meta_description", "seo.title", "seo.h1", "sd.jsonld", "seo.sitemap"].flatMap((s) => find(c, s, "not_detected")), build: (id, ev) => opp(id, {
    title: "Base técnica para buscadores", kind: "inferencia",
    observation: `No se detectan ${ev.length === 1 ? "un elemento" : "varios elementos"} de SEO técnico en el HTML del sitio.`, opportunity: "Reforzar la base técnica para ser encontrados con más claridad.",
    impact: "Ayudaría a que buscadores y asistentes entiendan mejor qué ofrece la empresa.", solution: "Ordenar títulos, descripciones y datos estructurados de las páginas clave.",
    deliverable: "Plan de optimización SEO técnico.", commercialModel: "servicio_recurrente", kpi: "Visibilidad orgánica de las páginas clave.", priority: "media",
    evidence: ev.map((o) => o.id).slice(0, 6), serviceSlug: "seo-contenido" }) },
  { match: (c) => ["conv.form", "conv.booking_or_quote", "conv.cta"].flatMap((s) => find(c, s, "not_detected")), build: (id, ev) => opp(id, {
    title: "Caminos claros para contactar", kind: "inferencia",
    observation: "No se detectan formularios o llamados a la acción claros en el HTML del sitio.", opportunity: "Facilitar que un interesado pida información o una cotización.",
    impact: "Reduciría fricción en el momento en que el visitante decide escribir.", solution: "Diseñar recorridos de contacto y llamados a la acción por página.",
    deliverable: "Páginas de conversión y formularios optimizados.", commercialModel: "evolutivo", kpi: "Solicitudes de contacto por visita.", priority: "alta",
    evidence: ev.map((o) => o.id).slice(0, 6), serviceSlug: "cro-conversion" }) },
  { match: (c) => find(c, "conv.whatsapp", "not_detected"), build: (id, ev) => opp(id, {
    title: "Atención por WhatsApp", kind: "inferencia",
    observation: "No se detecta un enlace a WhatsApp en el HTML del sitio.", opportunity: "Sumar un canal de contacto inmediato.",
    impact: "Acercaría la atención al canal que muchos clientes ya usan.", solution: "Integrar WhatsApp con seguimiento de las consultas.",
    deliverable: "Integración de WhatsApp con registro de leads.", commercialModel: "quick_win", kpi: "Consultas recibidas por WhatsApp.", priority: "media",
    evidence: ev.map((o) => o.id), serviceSlug: "automatizacion-whatsapp-crm" }) },
  { match: (c) => [...find(c, "tech.tls", "not_detected"), ...find(c, "tech.tls", "observed").filter((o) => o.value.valid === false)], build: (id, ev) => opp(id, {
    title: "Conexión segura del sitio", kind: ev[0]!.status === "observed" ? "hecho" : "inferencia",
    observation: ev[0]!.status === "observed" ? "El certificado de seguridad del sitio no pasó la verificación." : "La portada no se sirvió con conexión segura (HTTPS).",
    opportunity: "Reforzar la confianza de quien visita el sitio.", impact: "Evitaría avisos de seguridad que alejan a los visitantes.",
    solution: "Regularizar el certificado y la navegación segura.", deliverable: "Revisión y regularización de HTTPS.", commercialModel: "quick_win",
    kpi: "Sitio servido sin avisos de seguridad.", priority: "alta", evidence: ev.map((o) => o.id), serviceSlug: "web-ux-ui" }) },
  { match: (c) => c.observations.filter((o) => o.signal.startsWith("industry.") && o.status === "not_detected"), build: (id, ev) => opp(id, {
    title: "Herramienta propia del rubro", kind: "inferencia",
    observation: `No se detecta ${String(ev[0]!.value.name ?? "una funcionalidad del rubro")} en el sitio.`, opportunity: "Incorporar una experiencia que el visitante espera en este rubro.",
    impact: "Acortaría el camino entre el interés y el contacto.", solution: "Diseñar una herramienta a medida para ese momento del recorrido.",
    deliverable: "Herramienta interactiva a medida.", commercialModel: "proyecto", kpi: "Uso de la herramienta y contactos generados.", priority: "media",
    evidence: ev.map((o) => o.id).slice(0, 3), serviceSlug: "herramientas-interactivas" }) },
];

export function simulatedProvider(): AiProvider {
  return {
    id: "simulated",
    model: "simulado",
    async generate(input) {
      const c = input.context;
      const opps: Opportunity[] = [];
      for (const r of RULES) {
        const ev = r.match(c);
        if (ev.length && opps.length < 3) opps.push(r.build(`o${opps.length + 1}`, ev));
      }
      if (opps.length === 0) {
        opps.push(opp("o1", {
          title: "Validar prioridades con la empresa", kind: "hipotesis",
          observation: "El análisis automático no encontró brechas claras en lo que se pudo leer del sitio.", opportunity: "Conversar sobre objetivos comerciales para encontrar el siguiente paso.",
          impact: "Alinearía cualquier propuesta con lo que la empresa quiere lograr.", solution: "Una sesión de descubrimiento para priorizar iniciativas.",
          deliverable: "Mapa de oportunidades acordado con la empresa.", commercialModel: "evolutivo", kpi: "Objetivos y metas acordados.", priority: "media", evidence: [], serviceSlug: null }));
      }
      const out: DiagnosticContent = diagnosticSchema.parse({
        headline: `Oportunidades de evolución digital para ${c.company.name}`.slice(0, 100),
        summary: "Con base en lo que se observa en el sitio público de la empresa, identificamos oportunidades para ordenar su presencia digital y facilitar el contacto de nuevos clientes.",
        opportunities: opps,
        nextStep: "Proponemos una reunión corta para validar estas hipótesis y priorizar por valor para el negocio.",
        caveats: ["Basado solo en información pública del sitio; lo que no pudimos verificar no se tomó como evidencia."],
      });
      const text = JSON.stringify(out);
      return { text, model: "simulado", stopReason: "end_turn", inputTokens: Math.ceil((input.system.length + input.user.length) / 4), outputTokens: Math.ceil(text.length / 4), cacheReadTokens: 0 };
    },
  };
}

/** Elige el proveedor según la configuración. El simulado no existe en producción. */
export function resolveProvider(): AiProvider | null {
  const e = env();
  if (e.AI_PROVIDER === "simulated" && e.NODE_ENV !== "production") return simulatedProvider();
  if (e.AI_PROVIDER === "anthropic" && e.ANTHROPIC_API_KEY) return anthropicProvider({ apiKey: e.ANTHROPIC_API_KEY, model: e.ANTHROPIC_MODEL });
  return null;
}
