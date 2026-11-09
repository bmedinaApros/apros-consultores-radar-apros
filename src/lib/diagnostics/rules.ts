import type { AiInput, AiOutput, AiProvider } from "./ai";
import type { GenerationContext, PromptObservation } from "./prompt";
import { diagnosticSchema, type DiagnosticContent, type Opportunity } from "./schema";

/**
 * Diagnóstico SIN IA: plantillas y reglas sobre las señales observadas. Costo cero, determinístico (misma evidencia →
 * mismo texto) y con la misma salida y los mismos controles que el diagnóstico con IA: cita las observaciones, pasa el
 * validador de afirmaciones y exige revisión humana antes de descargarse.
 *
 * Cada regla produce una oportunidad candidata con un peso; se eligen hasta 3 (máximo 2 del mismo servicio).
 * El texto se adapta al rubro con un pequeño vocabulario («un paciente», «una cotización»…).
 */
export const RULES_MODEL = "reglas-v1";

interface Vocab { visitor: string; action: string; contactKpi: string; summaryTail: string }
const GENERIC: Vocab = { visitor: "un visitante", action: "contactar a la empresa", contactKpi: "Contactos recibidos", summaryTail: "facilitar que más visitantes lleguen a contactarlos" };
const VOCAB: Record<string, Vocab> = {
  inmobiliario: { visitor: "un interesado en un proyecto", action: "pedir información o cotizar", contactKpi: "Cotizaciones y consultas por proyecto", summaryTail: "facilitar que más interesados en sus proyectos pidan información" },
  salud: { visitor: "un paciente", action: "reservar una cita o consultar", contactKpi: "Citas y consultas recibidas", summaryTail: "facilitar que más pacientes reserven una cita o consulten" },
  educacion: { visitor: "una familia o un estudiante", action: "pedir informes o matricularse", contactKpi: "Solicitudes de informes y matrículas", summaryTail: "facilitar que más familias pidan informes y se matriculen" },
  retail: { visitor: "un comprador", action: "consultar o comprar", contactKpi: "Consultas y pedidos recibidos", summaryTail: "facilitar que más compradores consulten o compren" },
  industria: { visitor: "un cliente corporativo", action: "solicitar una cotización", contactKpi: "Solicitudes de cotización", summaryTail: "facilitar que más clientes corporativos soliciten una cotización" },
  "servicios profesionales": { visitor: "un cliente potencial", action: "agendar una reunión", contactKpi: "Reuniones solicitadas", summaryTail: "facilitar que más clientes potenciales agenden una reunión" },
  "consumo masivo": { visitor: "un comprador o distribuidor", action: "pedir un catálogo o contacto comercial", contactKpi: "Pedidos y contactos comerciales", summaryTail: "facilitar que más compradores y distribuidores se contacten" },
};
const norm = (s: string): string => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const vocabFor = (industry: string | null): Vocab => (industry ? VOCAB[norm(industry)] ?? GENERIC : GENERIC);

interface Cand { weight: number; build: (id: string, v: Vocab) => Opportunity }
type Obs = PromptObservation;

const has = (c: GenerationContext, code: string, status: Obs["status"]): Obs[] => c.observations.filter((o) => o.signal === code && o.status === status);
const opp = (id: string, o: Omit<Opportunity, "id">): Opportunity => ({ id, ...o });
const priorityOf = (w: number): Opportunity["priority"] => (w >= 80 ? "alta" : w >= 50 ? "media" : "baja");
const ids = (ev: Obs[], n = 6): string[] => [...new Set(ev.map((o) => o.id))].slice(0, n);

/** Genera las oportunidades candidatas a partir de las señales. Solo se afirma lo que la evidencia respalda. */
export function candidates(c: GenerationContext, now: Date): Cand[] {
  const out: Cand[] = [];

  const tls = [...has(c, "tech.tls", "not_detected"), ...has(c, "tech.tls", "observed").filter((o) => o.value.valid === false)];
  if (tls.length) out.push({ weight: 95, build: (id) => opp(id, {
    title: "Conexión segura del sitio", kind: tls[0]!.status === "observed" ? "hecho" : "inferencia",
    observation: tls[0]!.status === "observed" ? "El certificado de seguridad del sitio no pasó la verificación." : "La portada no se sirvió con conexión segura (HTTPS).",
    opportunity: "Reforzar la confianza de quien visita el sitio.", impact: "Evitaría avisos de seguridad que alejan a los visitantes.",
    solution: "Regularizar el certificado y la navegación segura.", deliverable: "Revisión y regularización de HTTPS.", commercialModel: "quick_win",
    kpi: "Sitio servido sin avisos de seguridad.", priority: priorityOf(95), evidence: ids(tls), serviceSlug: "web-ux-ui" }) });

  const mobile = has(c, "conv.mobile_viewport", "not_detected");
  if (mobile.length) out.push({ weight: 90, build: (id, v) => opp(id, {
    title: "Experiencia pensada para móvil", kind: "inferencia",
    observation: "No se detecta la declaración de adaptación a móvil en la página.", opportunity: "Mejorar la lectura y el contacto desde el celular.",
    impact: `Facilitaría que ${v.visitor} pueda ${v.action} desde su teléfono.`, solution: "Evolucionar el diseño con enfoque móvil primero.",
    deliverable: "Diseño responsive de las páginas clave.", commercialModel: "proyecto", kpi: `${v.contactKpi} desde móvil.`, priority: priorityOf(90),
    evidence: ids(mobile), serviceSlug: "web-ux-ui" }) });

  const paths = ["conv.form", "conv.booking_or_quote", "conv.cta", "conv.phone"].flatMap((s) => has(c, s, "not_detected"));
  if (paths.length) {
    const w = 62 + Math.min(paths.length, 4) * 5;
    out.push({ weight: w, build: (id, v) => opp(id, {
      title: "Caminos claros para contactar", kind: "inferencia",
      observation: "No se detectan formularios, teléfono clicable o llamados a la acción claros en el HTML del sitio.", opportunity: `Facilitar que ${v.visitor} pueda ${v.action}.`,
      impact: "Reduciría fricción en el momento en que el visitante decide escribir.", solution: "Diseñar recorridos de contacto y llamados a la acción por página.",
      deliverable: "Páginas de conversión y formularios optimizados.", commercialModel: "evolutivo", kpi: `${v.contactKpi} por visita.`, priority: priorityOf(w),
      evidence: ids(paths), serviceSlug: "cro-conversion" }) });
  }

  const speed = has(c, "perf.pagespeed", "observed").filter((o) => typeof o.value.performanceScore === "number" && (o.value.performanceScore as number) < 75);
  if (speed.length) {
    const score = speed[0]!.value.performanceScore as number;
    const w = score < 50 ? 85 : 70;
    out.push({ weight: w, build: (id, v) => opp(id, {
      title: "Velocidad de carga en móvil", kind: "hecho",
      observation: `PageSpeed midió un puntaje móvil de ${score}.`, opportunity: "Existe potencial para acelerar la carga de las páginas.",
      impact: `Una carga más rápida favorece que ${v.visitor} permanezca y ${v.action}.`, solution: "Optimizar imágenes y recursos de las páginas principales.",
      deliverable: "Optimización de rendimiento y revisión posterior.", commercialModel: "evolutivo", kpi: "Puntaje de rendimiento móvil y tasa de rebote.", priority: priorityOf(w),
      evidence: ids(speed), serviceSlug: "rendimiento-web" }) });
  }

  const ga4 = has(c, "meas.ga4", "not_detected");
  if (ga4.length) out.push({ weight: 60, build: (id, v) => opp(id, {
    title: "Medición confiable del sitio", kind: "inferencia",
    observation: "No se detecta Google Analytics 4 en el HTML del sitio.", opportunity: "Contar con medición confiable de lo que hacen los visitantes.",
    impact: `Permitiría decidir con datos qué páginas y campañas generan ${v.contactKpi.toLowerCase()}.`, solution: "Definir el plan de medición y los eventos clave del sitio.",
    deliverable: "Plan de medición y analítica configurada.", commercialModel: "quick_win", kpi: `${v.contactKpi} medidos por canal.`, priority: priorityOf(60),
    evidence: ids(ga4), serviceSlug: "analitica-medicion" }) });

  const seo = ["seo.meta_description", "seo.title", "seo.h1", "sd.jsonld", "seo.sitemap", "seo.canonical"].flatMap((s) => has(c, s, "not_detected"));
  if (seo.length) {
    const w = 40 + Math.min(seo.length, 4) * 8;
    out.push({ weight: w, build: (id) => opp(id, {
      title: "Base técnica para buscadores", kind: "inferencia",
      observation: `No se detectan ${seo.length === 1 ? "un elemento" : "varios elementos"} de SEO técnico en el HTML del sitio.`, opportunity: "Reforzar la base técnica para ser encontrados con más claridad.",
      impact: "Ayudaría a que buscadores y asistentes entiendan mejor qué ofrece la empresa.", solution: "Ordenar títulos, descripciones y datos estructurados de las páginas clave.",
      deliverable: "Plan de optimización SEO técnico.", commercialModel: "servicio_recurrente", kpi: "Visibilidad orgánica de las páginas clave.", priority: priorityOf(w),
      evidence: ids(seo), serviceSlug: "seo-contenido" }) });
  }

  const wa = has(c, "conv.whatsapp", "not_detected");
  if (wa.length) {
    const hot = ["salud", "educacion", "retail", "consumo masivo"].includes(norm(c.company.industry ?? ""));
    const w = 50 + (hot ? 15 : 0);
    out.push({ weight: w, build: (id, v) => opp(id, {
      title: "Atención por WhatsApp", kind: "inferencia",
      observation: "No se detecta un enlace a WhatsApp en el HTML del sitio.", opportunity: "Sumar un canal de contacto inmediato.",
      impact: `Acercaría la atención al canal que ${v.visitor} ya puede estar usando.`, solution: "Integrar WhatsApp con seguimiento de las consultas.",
      deliverable: "Integración de WhatsApp con registro de contactos.", commercialModel: "quick_win", kpi: "Consultas recibidas por WhatsApp.", priority: priorityOf(w),
      evidence: ids(wa), serviceSlug: "automatizacion-whatsapp-crm" }) });
  }

  const tool = c.observations.filter((o) => o.signal.startsWith("industry.") && o.status === "not_detected");
  if (tool.length) out.push({ weight: 55, build: (id, v) => opp(id, {
    title: "Herramienta propia del rubro", kind: "inferencia",
    observation: `No se detecta ${String(tool[0]!.value.name ?? "una funcionalidad del rubro")} en el sitio.`, opportunity: "Incorporar una experiencia que el visitante espera en este rubro.",
    impact: `Acortaría el camino entre el interés de ${v.visitor} y el contacto.`, solution: "Diseñar una herramienta a medida para ese momento del recorrido.",
    deliverable: "Herramienta interactiva a medida.", commercialModel: "proyecto", kpi: "Uso de la herramienta y contactos generados.", priority: priorityOf(55),
    evidence: ids(tool, 3), serviceSlug: "herramientas-interactivas" }) });

  const broken = has(c, "seo.broken_links", "observed").filter((o) => typeof o.value.broken === "number" && (o.value.broken as number) > 0);
  if (broken.length) {
    const n = broken[0]!.value.broken as number;
    out.push({ weight: 52, build: (id) => opp(id, {
      title: "Mantenimiento de enlaces del sitio", kind: "hecho",
      observation: `En la muestra revisada, ${n} ${n === 1 ? "enlace interno no carga" : "enlaces internos no cargan"}.`, opportunity: "Ordenar los enlaces para que la navegación sea continua.",
      impact: "Evitaría que los visitantes lleguen a páginas que no existen.", solution: "Revisar y corregir los enlaces y redirecciones del sitio.",
      deliverable: "Revisión de enlaces y plan de mantenimiento.", commercialModel: "servicio_recurrente", kpi: "Enlaces rotos detectados en revisiones periódicas.", priority: priorityOf(52),
      evidence: ids(broken), serviceSlug: "seo-contenido" }) });
  }

  const stale = has(c, "tech.last_content", "observed").filter((o) => typeof o.value.date === "string" && /^\d{4}/.test(o.value.date as string));
  if (stale.length) {
    const year = Number(String(stale[0]!.value.date).slice(0, 4));
    if (now.getUTCFullYear() - year >= 2) out.push({ weight: 45, build: (id) => opp(id, {
      title: "Contenido al día", kind: "inferencia",
      observation: `El contenido más reciente que se detecta en el sitio es de ${year}.`, opportunity: "Existe potencial para mantener el sitio con novedades.",
      impact: "Un sitio con contenido reciente transmite actividad y favorece su aparición en buscadores.", solution: "Definir un calendario de contenidos y novedades.",
      deliverable: "Plan de contenidos y primeras publicaciones.", commercialModel: "servicio_recurrente", kpi: "Páginas y publicaciones nuevas por mes.", priority: priorityOf(45),
      evidence: ids(stale), serviceSlug: "seo-contenido" }) });
  }

  const ai = has(c, "geo.ai_crawlers", "observed").filter((o) => Array.isArray(o.value.blocked) ? (o.value.blocked as unknown[]).length > 0 : typeof o.value.blocked === "string" && o.value.blocked.length > 0);
  if (ai.length) out.push({ weight: 38, build: (id) => opp(id, {
    title: "Visibilidad en asistentes de IA", kind: "hecho",
    observation: "El archivo robots.txt tiene reglas que impiden la lectura a rastreadores de asistentes de IA.", opportunity: "Decidir de forma deliberada qué asistentes pueden leer y recomendar al sitio.",
    impact: "Permitiría que la empresa aparezca en respuestas de asistentes si así lo decide.", solution: "Revisar las reglas de lectura y la información de la empresa legible por máquinas.",
    deliverable: "Revisión de reglas y datos estructurados de la organización.", commercialModel: "evolutivo", kpi: "Menciones de la empresa en asistentes de IA.", priority: priorityOf(38),
    evidence: ids(ai), serviceSlug: "seo-contenido" }) });

  const entity = has(c, "geo.entity_info", "observed").filter((o) => o.value.organizationSchema === false);
  if (entity.length) out.push({ weight: 36, build: (id) => opp(id, {
    title: "Información de la empresa legible por máquinas", kind: "inferencia",
    observation: "No se detectan datos estructurados de la organización en la portada.", opportunity: "Ayudar a buscadores y asistentes a entender quién es la empresa.",
    impact: "Favorecería que la información de contacto y ubicación sea interpretada correctamente.", solution: "Agregar datos estructurados de organización y contacto.",
    deliverable: "Datos estructurados de la organización.", commercialModel: "quick_win", kpi: "Información de la empresa reconocida en buscadores.", priority: priorityOf(36),
    evidence: ids(entity), serviceSlug: "seo-contenido" }) });

  const pixel = has(c, "meas.meta_pixel", "not_detected");
  if (pixel.length) out.push({ weight: 30, build: (id) => opp(id, {
    title: "Medición de campañas en redes", kind: "hipotesis",
    observation: "No se detecta el píxel de Meta en el HTML del sitio.", opportunity: "Si la empresa hace o planea publicidad en redes, medir lo que ocurre en el sitio.",
    impact: "Permitiría relacionar la inversión publicitaria con las consultas recibidas.", solution: "Validar con la empresa si hay publicidad y, si corresponde, configurar la medición.",
    deliverable: "Plan de medición para campañas en redes.", commercialModel: "evolutivo", kpi: "Consultas atribuidas a campañas.", priority: priorityOf(30),
    evidence: ids(pixel), serviceSlug: "analitica-medicion" }) });

  return out;
}

export function buildRulesDiagnostic(c: GenerationContext, now: Date = new Date()): DiagnosticContent {
  const v = vocabFor(c.company.industry);
  const known = new Set(c.offers.map((o) => o.slug));
  const ranked = candidates(c, now).sort((a, b) => b.weight - a.weight);
  const picked: Cand[] = [];
  const perService = new Map<string, number>();
  for (const cand of ranked) {
    if (picked.length === 3) break;
    const o = cand.build("x", v);
    const n = perService.get(o.serviceSlug ?? "") ?? 0;
    if (n >= 2) continue;
    perService.set(o.serviceSlug ?? "", n + 1);
    picked.push(cand);
  }
  const opps: Opportunity[] = picked.map((cand, i) => {
    const o = cand.build(`o${i + 1}`, v);
    return { ...o, serviceSlug: o.serviceSlug && known.has(o.serviceSlug) ? o.serviceSlug : null }; // solo servicios del catálogo vigente
  });
  if (opps.length === 0) {
    opps.push(opp("o1", {
      title: "Validar prioridades con la empresa", kind: "hipotesis",
      observation: "El análisis automático no encontró brechas claras en lo que se pudo leer del sitio.", opportunity: "Conversar sobre objetivos comerciales para encontrar el siguiente paso de evolución digital.",
      impact: "Alinearía cualquier propuesta con lo que la empresa quiere lograr.", solution: "Una sesión de descubrimiento para priorizar iniciativas.",
      deliverable: "Mapa de oportunidades acordado con la empresa.", commercialModel: "evolutivo", kpi: "Objetivos y metas acordados.", priority: "media", evidence: [], serviceSlug: null }));
  }
  return diagnosticSchema.parse({
    headline: `Oportunidades de evolución digital para ${c.company.name}`.slice(0, 100),
    summary: `Con base en lo que se observa en el sitio público de la empresa, identificamos oportunidades para ordenar su presencia digital y ${v.summaryTail}.`.slice(0, 320),
    opportunities: opps,
    nextStep: `Proponemos una reunión corta para revisar «${opps[0]!.title}» y priorizar por valor para el negocio.`.slice(0, 220),
    caveats: ["Basado solo en información pública del sitio; lo que no pudimos verificar no se tomó como evidencia."],
  });
}

export function rulesProvider(now: () => Date = () => new Date()): AiProvider {
  return {
    id: "rules",
    model: RULES_MODEL,
    async generate(input: AiInput): Promise<AiOutput> {
      const text = JSON.stringify(buildRulesDiagnostic(input.context, now()));
      return { text, model: RULES_MODEL, stopReason: "end_turn", inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };
    },
  };
}
