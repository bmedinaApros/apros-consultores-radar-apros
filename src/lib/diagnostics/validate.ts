import { DiagnosticContent, Opportunity, TEXT_FIELDS, diagnosticSchema } from "./schema";

/**
 * Validación de lo que escribe el modelo (o una persona). La salida del modelo se trata como NO confiable:
 *  - se limpia (sin HTML, sin enlaces ni correos ajenos, sin caracteres de control);
 *  - cada afirmación debe citar observaciones reales de ESA empresa;
 *  - cada cifra debe aparecer en la evidencia citada;
 *  - se bloquea el lenguaje crítico, las promesas, las afirmaciones de mercado sin fuente y los ecos de inyección.
 * Una afirmación que incumple queda MARCADA («bloqueante») y el diagnóstico no puede aprobarse hasta corregirla.
 */

export interface EvidenceObs {
  id: string;
  signal_code: string;
  status: "observed" | "not_detected" | "unverifiable";
  kind: "observed" | "inferred";
  confidence: "high" | "medium" | "low";
  value: Record<string, unknown> | null;
  evidence_excerpt: string | null;
  evidence_url: string | null;
}

export interface ValidationContext {
  /** Observaciones que el modelo podía citar (de la última corrida analizada). */
  observations: Map<string, EvidenceObs>;
  companyDomain: string | null;
  serviceSlugs: Set<string>;
}

export type FlagCode =
  | "no_evidence" | "unknown_evidence" | "unverifiable_evidence" | "fact_on_absence" | "strong_negation" | "number_without_support"
  | "banned_language" | "promise" | "unsourced_market_claim" | "url_blocked" | "personal_data" | "injection_echo" | "implementation_detail"
  | "markup_removed" | "active_content" | "unknown_service";

export interface Flag {
  opportunityId: string | "global";
  field: string;
  code: FlagCode;
  message: string;
  blocking: boolean;
}

const BIDI_CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g;

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const URL_LIKE = /(?:https?:\/\/[^\s)<>"']+|www\.[^\s)<>"']+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)*\.(?:com|pe|net|org|io|co|app|dev|info|biz|edu|gob|ai|xyz|ly|me|tv|us|es|mx|cl|ar)\b(?:\/[^\s)<>"']*)?)/gi;

const BANNED = /\b(est[aá]\s+mal|mal\s+hech[oa]|fe[ao]s?|desactualizad[oa]s?|obsolet[oa]s?|rehacer\s+(?:toda\s+)?la\s+web|demasiados\s+errores|p[eé]sim[oa]s?|terrible|desastre|horrible|deficiente|amateur|abandonad[oa]s?|vergonz[oa]s?)\b/i;
const PROMISE = /(garantiz|aseguramos|prometemos|resultados\s+garantizados|sin\s+riesgo|duplicar|triplicar|multiplicar[aá]|aumentar[aá]n?\s+(?:las\s+)?(?:ventas|leads|conversiones|ingresos)|incrementar[aá]n?|\bx\s?[2-9]\b|con\s+certeza)/i;
const MARKET = /(seg[uú]n\s+(?:estudios|encuestas|expertos|investigaciones)|los\s+estudios\s+(?:muestran|demuestran)|la\s+mayor[ií]a\s+de\s+las\s+empresas|el\s+mercado\s+(?:peruano\s+)?(?:est[aá]|crece|exige)|tendencia\s+del\s+mercado|es\s+bien\s+sabido|est[aá]\s+comprobado)/i;
const INJECTION = /(ignora(?:r)?\s+(?:las\s+)?instrucciones|ignore\s+(?:all\s+)?(?:previous|prior)|system\s*prompt|prompt\s+del\s+sistema|eres\s+un\s+asistente|act[uú]a\s+como|olvida\s+(?:todo|lo\s+anterior)|nueva\s+instrucci[oó]n|marca\s+esta\s+empresa|califica\s+esta\s+empresa)/i;
const NEGATION = /\b(no\s+tiene|no\s+tienen|no\s+cuenta(?:n)?\s+con|carece(?:n)?\s+de|no\s+existe(?:n)?|no\s+posee(?:n)?|no\s+dispone(?:n)?|ausencia\s+total|no\s+usa(?:n)?|no\s+utiliza(?:n)?)\b/i;
const IMPLEMENTATION = /(paso\s*\d|```|<\s*\/?\s*(?:script|iframe|div|a|img)\b|\bgtag\s*\(|\bfbq\s*\(|\bnpm\s+|\bpip\s+install|instal(?:a|e|ar)\s+(?:el\s+)?(?:c[oó]digo|plugin|script)|copia\s+y\s+pega)/i;

const stripAccents = (s: string) => s.normalize("NFD").replace(/\p{M}+/gu, "");

/** Texto plano seguro: sin etiquetas, sin enlaces de markdown, sin caracteres de control o de dirección. */
export function sanitizeText(input: string): { text: string; changed: boolean } {
  let t = input.replace(BIDI_CONTROL, " ");
  t = t.replace(/\[([^\]]{1,200})\]\((?:[^)]{0,500})\)/g, "$1");
  t = t.replace(/<[^>]{0,300}>/g, " ");
  t = t.replace(/[`*_#>~]{1,}/g, "");
  t = t.replace(/\s+/g, " ").trim();
  return { text: t, changed: t !== input.replace(/\s+/g, " ").trim() };
}

const hostOf = (s: string): string => {
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `http://${s}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return s.toLowerCase();
  }
};

/** Números de un texto, sin contar los que forman parte de nombres como GA4, H1 o G-ABC123. */
const PRODUCT_NAMES = /\b(?:Google\s+Analytics\s+4|Analytics\s+4|GA\s+4|Universal\s+Analytics|Core\s+Web\s+Vitals|HTTP\/2|Windows\s+\d+|Web\s+3)\b/gi;

export function numbersIn(text: string): number[] {
  const cleaned = text.replace(PRODUCT_NAMES, " ").replace(/\b[A-Za-z][A-Za-z0-9-]*\d[A-Za-z0-9-]*\b/g, " ").replace(/\b\d+[A-Za-z]+[A-Za-z0-9-]*\b/g, " ");
  return [...cleaned.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(",", "."))).filter((n) => Number.isFinite(n));
}

function numbersInEvidence(obs: EvidenceObs[]): Set<number> {
  const out = new Set<number>();
  const add = (s: string) => { for (const m of s.matchAll(/\d+(?:[.,]\d+)?/g)) { const n = Number(m[0].replace(",", ".")); if (Number.isFinite(n)) out.add(n); } };
  for (const o of obs) {
    add(JSON.stringify(o.value ?? {}));
    if (o.evidence_excerpt) add(o.evidence_excerpt);
    add(o.signal_code);
  }
  return out;
}

export interface ValidationResult {
  content: DiagnosticContent;
  flags: Flag[];
  blocking: number;
}

export function validateDiagnostic(input: unknown, ctx: ValidationContext): ValidationResult {
  const parsed = diagnosticSchema.parse(input); // forma y longitudes: si falla, la generación es «salida inválida»
  const flags: Flag[] = [];
  const allowedHosts = new Set(["apros.pe", ...(ctx.companyDomain ? [ctx.companyDomain.replace(/^www\./, "")] : [])]);

  const clean = (oppId: string, field: string, raw: string): string => {
    if (/<\s*(?:script|iframe|object|embed|style|link|meta|svg|form|input)\b|javascript\s*:|on(?:error|load|click)\s*=/i.test(raw)) {
      flags.push({ opportunityId: oppId, field, code: "active_content", message: "El texto incluía contenido activo (script, iframe o similar); se retiró.", blocking: true });
    }
    const s = sanitizeText(raw);
    let text = s.text;
    if (s.changed) flags.push({ opportunityId: oppId, field, code: "markup_removed", message: "Se quitó formato, etiquetas o caracteres de control.", blocking: false });
    text = text.replace(EMAIL, () => {
      flags.push({ opportunityId: oppId, field, code: "personal_data", message: "El texto incluía un correo; no se aceptan datos de contacto.", blocking: true });
      return "[correo retirado]";
    });
    text = text.replace(URL_LIKE, (m) => {
      if (allowedHosts.has(hostOf(m))) return m;
      flags.push({ opportunityId: oppId, field, code: "url_blocked", message: `Se retiró un enlace o dominio no autorizado (${hostOf(m).slice(0, 60)}).`, blocking: true });
      return "[enlace retirado]";
    });
    if (BANNED.test(text)) flags.push({ opportunityId: oppId, field, code: "banned_language", message: "Lenguaje crítico: usa «identificamos una oportunidad de evolución…».", blocking: true });
    if (PROMISE.test(text)) flags.push({ opportunityId: oppId, field, code: "promise", message: "Promete o garantiza resultados.", blocking: true });
    if (MARKET.test(text)) flags.push({ opportunityId: oppId, field, code: "unsourced_market_claim", message: "Afirmación de mercado sin fuente.", blocking: true });
    if (INJECTION.test(text) || INJECTION.test(stripAccents(text))) flags.push({ opportunityId: oppId, field, code: "injection_echo", message: "El texto parece repetir instrucciones del contenido del sitio.", blocking: true });
    if (field === "solution" || field === "deliverable") {
      if (IMPLEMENTATION.test(text)) flags.push({ opportunityId: oppId, field, code: "implementation_detail", message: "Detalla la implementación; el diagnóstico propone, no entrega el cómo.", blocking: true });
    }
    return text;
  };

  const cleanedOpps: Opportunity[] = parsed.opportunities.map((o) => {
    const out: Opportunity = { ...o, evidence: [...new Set(o.evidence)] };
    for (const f of TEXT_FIELDS) out[f] = clean(o.id, f, o[f]) as never;

    // Evidencia
    const cited: EvidenceObs[] = [];
    for (const id of out.evidence) {
      const ob = ctx.observations.get(id);
      if (!ob) { flags.push({ opportunityId: o.id, field: "evidence", code: "unknown_evidence", message: `La observación ${id} no existe para esta empresa.`, blocking: true }); continue; }
      if (ob.status === "unverifiable") { flags.push({ opportunityId: o.id, field: "evidence", code: "unverifiable_evidence", message: `La señal ${ob.signal_code} no se pudo verificar: no es evidencia.`, blocking: true }); continue; }
      cited.push(ob);
    }
    if (out.kind !== "hipotesis" && cited.length === 0) {
      flags.push({ opportunityId: o.id, field: "evidence", code: "no_evidence", message: "Un hecho o una inferencia necesita citar al menos una observación.", blocking: true });
    }
    if (out.kind === "hecho" && cited.some((c) => c.status === "not_detected")) {
      flags.push({ opportunityId: o.id, field: "kind", code: "fact_on_absence", message: "Algo que «no se detectó» es una inferencia (puede cargarse por JavaScript), no un hecho.", blocking: true });
    }
    if (cited.length > 0 && cited.every((c) => c.status === "not_detected" || c.confidence === "low")) {
      for (const f of ["observation", "opportunity", "impact"] as const) {
        if (NEGATION.test(out[f])) flags.push({ opportunityId: o.id, field: f, code: "strong_negation", message: "Afirma una ausencia que solo es «no detectada»; usa «no se detecta en el sitio».", blocking: true });
      }
    }

    // Cifras: deben salir de la evidencia citada
    const support = numbersInEvidence(cited);
    for (const f of TEXT_FIELDS) {
      const unsupported = [...new Set(numbersIn(out[f]).filter((n) => !support.has(n)))];
      if (unsupported.length) flags.push({ opportunityId: o.id, field: f, code: "number_without_support", message: `Cifra sin respaldo en la evidencia: ${unsupported.slice(0, 3).join(", ")}.`, blocking: true });
    }
    if (out.serviceSlug && !ctx.serviceSlugs.has(out.serviceSlug)) {
      flags.push({ opportunityId: o.id, field: "serviceSlug", code: "unknown_service", message: "El servicio no está en el catálogo; se dejó vacío.", blocking: false });
      out.serviceSlug = null;
    }
    return out;
  });

  const content: DiagnosticContent = {
    headline: clean("global", "headline", parsed.headline),
    summary: clean("global", "summary", parsed.summary),
    opportunities: cleanedOpps,
    nextStep: clean("global", "nextStep", parsed.nextStep),
    caveats: parsed.caveats.map((c) => clean("global", "caveats", c)),
  };
  // El resumen, el titular y el siguiente paso no pueden traer cifras: no citan evidencia propia.
  for (const f of ["headline", "summary", "nextStep"] as const) {
    const all = new Set<number>();
    for (const o of cleanedOpps) for (const id of o.evidence) { const ob = ctx.observations.get(id); if (ob && ob.status !== "unverifiable") for (const n of numbersInEvidence([ob])) all.add(n); }
    const unsupported = [...new Set(numbersIn(content[f]).filter((n) => !all.has(n)))];
    if (unsupported.length) flags.push({ opportunityId: "global", field: f, code: "number_without_support", message: `Cifra sin respaldo en la evidencia: ${unsupported.slice(0, 3).join(", ")}.`, blocking: true });
  }
  return { content, flags, blocking: flags.filter((f) => f.blocking).length };
}
