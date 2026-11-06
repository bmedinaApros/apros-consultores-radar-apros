import { AI_CRAWLERS, type RobotsPolicy } from "./robots";
import { ANALYZER_VERSION, cleanExcerpt, type PageFacts } from "./extract";
import type { TlsInfo } from "./safe-fetch";

export type ObsStatus = "observed" | "not_detected" | "unverifiable";
export type Confidence = "high" | "medium" | "low";

export interface Observation {
  signal_code: string;
  status: ObsStatus;
  kind: "observed" | "inferred";
  value: unknown;
  confidence: Confidence;
  evidence_url: string | null;
  evidence_excerpt: string | null;
}

export interface SignalDef {
  code: string;
  name: string;
  category: "SEO técnico" | "Datos estructurados" | "GEO" | "Medición y publicidad" | "Conversión" | "Rendimiento" | "Tecnología y actividad";
}

export const COMMON_SIGNALS: SignalDef[] = [
  { code: "seo.title", name: "Título de la página (title)", category: "SEO técnico" },
  { code: "seo.meta_description", name: "Meta descripción", category: "SEO técnico" },
  { code: "seo.h1", name: "Encabezado principal (H1)", category: "SEO técnico" },
  { code: "seo.canonical", name: "URL canónica", category: "SEO técnico" },
  { code: "seo.indexable", name: "Indexabilidad", category: "SEO técnico" },
  { code: "seo.robots_txt", name: "Archivo robots.txt", category: "SEO técnico" },
  { code: "seo.sitemap", name: "Mapa del sitio (sitemap)", category: "SEO técnico" },
  { code: "seo.broken_links", name: "Enlaces rotos en la muestra", category: "SEO técnico" },
  { code: "sd.jsonld", name: "Datos estructurados (JSON-LD)", category: "Datos estructurados" },
  { code: "geo.ai_crawlers", name: "Reglas para rastreadores de IA", category: "GEO" },
  { code: "geo.entity_info", name: "Información de la entidad legible por máquinas", category: "GEO" },
  { code: "meas.ga4", name: "Google Analytics 4", category: "Medición y publicidad" },
  { code: "meas.gtm", name: "Google Tag Manager", category: "Medición y publicidad" },
  { code: "meas.meta_pixel", name: "Píxel de Meta", category: "Medición y publicidad" },
  { code: "meas.google_ads", name: "Etiqueta de Google Ads", category: "Medición y publicidad" },
  { code: "meas.clarity", name: "Microsoft Clarity", category: "Medición y publicidad" },
  { code: "conv.form", name: "Formularios", category: "Conversión" },
  { code: "conv.whatsapp", name: "Enlace a WhatsApp", category: "Conversión" },
  { code: "conv.phone", name: "Teléfono clicable", category: "Conversión" },
  { code: "conv.cta", name: "Llamados a la acción", category: "Conversión" },
  { code: "conv.booking_or_quote", name: "Reserva o cotización", category: "Conversión" },
  { code: "conv.mobile_viewport", name: "Adaptación a móvil (viewport)", category: "Conversión" },
  { code: "perf.pagespeed", name: "Rendimiento (PageSpeed Insights)", category: "Rendimiento" },
  { code: "tech.cms", name: "CMS o plataforma", category: "Tecnología y actividad" },
  { code: "tech.tls", name: "Certificado TLS", category: "Tecnología y actividad" },
  { code: "tech.last_content", name: "Fecha del último contenido", category: "Tecnología y actividad" },
  { code: "tech.vendor_credit", name: "Crédito visible de un proveedor", category: "Tecnología y actividad" },
];

export interface IndustrySignalDef {
  slug: string;
  name: string;
  keywords: string[];
  scope: "text" | "links";
}

export interface PageSpeedSummary {
  strategy: "mobile";
  performanceScore: number | null; // 0–100
  lcpMs: number | null;
  cls: number | null;
  fetchedUrl: string;
}

export interface SiteInput {
  domain: string;
  homepage: PageFacts | null;
  pages: PageFacts[];
  homepageFailure: { outcome: string; reason: string; challenge: boolean } | null;
  robots: RobotsPolicy | null;
  robotsOutcome: string | null;
  sitemap: { state: "found" | "not_found" | "unverifiable"; url?: string; urls?: number; lastmod?: string; reason?: string } | null;
  tls: { info: TlsInfo | null; error: string | null; https: boolean } | null;
  brokenLinks: { checked: number; broken: { url: string; status: number }[]; unverifiable: number };
  pagespeed: { result: PageSpeedSummary | null; reason?: string };
  industrySignals: IndustrySignalDef[];
}

const obs = (
  code: string, status: ObsStatus, value: unknown, confidence: Confidence,
  evidenceUrl: string | null = null, excerpt: string | null = null, kind: "observed" | "inferred" = "observed",
): Observation => ({
  signal_code: code, status, kind, value, confidence, evidence_url: evidenceUrl,
  evidence_excerpt: excerpt ? cleanExcerpt(excerpt) : null,
});

const unverifiable = (code: string, reason: string, url: string | null = null): Observation =>
  obs(code, "unverifiable", { reason }, "low", url);

const around = (hay: string, needle: string | RegExp, span = 70): string | null => {
  const m = typeof needle === "string" ? (hay.toLowerCase().includes(needle.toLowerCase()) ? { index: hay.toLowerCase().indexOf(needle.toLowerCase()), 0: needle } : null) : needle.exec(hay);
  if (!m || m.index === undefined) return null;
  return cleanExcerpt(hay.slice(Math.max(0, m.index - span), m.index + String(m[0]).length + span), 300);
};

const NOT_STATIC = "Se busca solo en el HTML recibido; puede cargarse mediante JavaScript o Tag Manager.";

export function buildObservations(s: SiteInput): Observation[] {
  const out: Observation[] = [];
  const home = s.homepage;

  // Sin portada legible: toda señal derivada de la página queda «no se pudo verificar». Nunca es un hallazgo negativo.
  const pageSignals = COMMON_SIGNALS.filter((d) => !["seo.robots_txt", "seo.sitemap", "geo.ai_crawlers", "perf.pagespeed", "tech.tls"].includes(d.code));
  if (!home) {
    const r = s.homepageFailure?.reason ?? "";
    const why = s.homepageFailure ? (s.homepageFailure.challenge ? "El sitio presentó un desafío antibots o bloqueó la lectura" : /^No se pudo/.test(r) ? r : `No se pudo leer la página (${r || "motivo desconocido"})`) : "No se pudo leer la página";
    for (const d of pageSignals) out.push(unverifiable(d.code, why));
    for (const i of s.industrySignals) out.push(unverifiable(`industry.${i.slug}`, why));
  } else {
    out.push(...pageObservations(s, home));
  }

  // robots.txt, GEO y sitemap
  if (!s.robots || s.robots.state.kind === "unreachable") {
    const why = s.robots?.state.kind === "unreachable" ? s.robots.state.reason : "No se pudo leer robots.txt";
    out.push(unverifiable("seo.robots_txt", why), unverifiable("geo.ai_crawlers", why));
  } else if (s.robots.state.kind === "none") {
    out.push(obs("seo.robots_txt", "not_detected", { present: false }, "high", `https://${s.domain}/robots.txt`));
    out.push(obs("geo.ai_crawlers", "observed", { rules: s.robots.aiRules(), note: "Sin robots.txt: no hay reglas explícitas" }, "high", `https://${s.domain}/robots.txt`));
  } else {
    const rules = s.robots.aiRules();
    const blocked = AI_CRAWLERS.filter((u) => rules[u] === "blocked" || rules[u] === "unspecified_blocked");
    out.push(obs("seo.robots_txt", "observed", { present: true, sitemaps: s.robots.sitemaps().length }, "high", `https://${s.domain}/robots.txt`, s.robots.state.text.slice(0, 200)));
    out.push(obs("geo.ai_crawlers", "observed", { rules, blocked }, "high", `https://${s.domain}/robots.txt`,
      blocked.length ? `Bloqueados: ${blocked.join(", ")}` : "Ningún rastreador de IA está bloqueado"));
  }
  if (!s.sitemap || s.sitemap.state === "unverifiable") out.push(unverifiable("seo.sitemap", s.sitemap?.reason ?? "No se pudo comprobar el sitemap"));
  else if (s.sitemap.state === "found") out.push(obs("seo.sitemap", "observed", { present: true, urls: s.sitemap.urls ?? null, lastmod: s.sitemap.lastmod ?? null }, "high", s.sitemap.url ?? null));
  else out.push(obs("seo.sitemap", "not_detected", { present: false }, "medium", `https://${s.domain}/sitemap.xml`));

  // Enlaces rotos (muestra)
  const bl = s.brokenLinks;
  if (bl.checked === 0) out.push(unverifiable("seo.broken_links", bl.unverifiable > 0 ? "Los enlaces de la muestra no respondieron de forma verificable (bloqueos, límites o errores de red)" : "No hubo enlaces internos adicionales que comprobar"));
  else out.push(obs("seo.broken_links", "observed", { checked: bl.checked, broken: bl.broken.length, examples: bl.broken.slice(0, 5), unverifiable: bl.unverifiable }, "medium", null,
    bl.broken.length ? `${bl.broken.length} de ${bl.checked} enlaces comprobados no respondieron bien` : `${bl.checked} enlaces comprobados sin errores`));

  // TLS
  if (!s.tls) out.push(unverifiable("tech.tls", "No se pudo establecer la conexión"));
  else if (s.tls.error) out.push(obs("tech.tls", "observed", { valid: false, error: s.tls.error }, "high", `https://${s.domain}/`, s.tls.error));
  else if (s.tls.info) out.push(obs("tech.tls", "observed", { valid: s.tls.info.authorized, validTo: s.tls.info.validTo, issuer: s.tls.info.issuer, protocol: s.tls.info.protocol }, "high", `https://${s.domain}/`));
  else out.push(obs("tech.tls", "not_detected", { https: false, note: "La portada se sirvió sin HTTPS" }, "high", `http://${s.domain}/`));

  // PageSpeed
  if (!s.pagespeed.result) out.push(unverifiable("perf.pagespeed", s.pagespeed.reason ?? "PageSpeed no disponible"));
  else out.push(obs("perf.pagespeed", "observed", s.pagespeed.result, "high", s.pagespeed.result.fetchedUrl, `Puntaje móvil ${s.pagespeed.result.performanceScore ?? "n/d"}, LCP ${s.pagespeed.result.lcpMs ?? "n/d"} ms`));

  return out;
}

function pageObservations(s: SiteInput, home: PageFacts): Observation[] {
  const out: Observation[] = [];
  const u = home.url;
  const all = s.pages;
  const anyPage = (f: (p: PageFacts) => boolean) => all.find(f);

  // SEO técnico
  out.push(home.title
    ? obs("seo.title", "observed", { text: home.title, length: home.title.length }, "high", u, home.title)
    : obs("seo.title", "not_detected", { note: "No se encontró <title> en el HTML recibido" }, "medium", u));
  out.push(home.metaDescription
    ? obs("seo.meta_description", "observed", { text: home.metaDescription, length: home.metaDescription.length }, "high", u, home.metaDescription)
    : obs("seo.meta_description", "not_detected", { note: "No se encontró meta descripción en el HTML recibido" }, "medium", u));
  out.push(home.h1.length
    ? obs("seo.h1", "observed", { count: home.h1.length, first: home.h1[0] }, "high", u, home.h1[0])
    : obs("seo.h1", "not_detected", { note: "No se encontró H1 en el HTML recibido" }, "medium", u));
  out.push(home.canonical
    ? obs("seo.canonical", "observed", { href: home.canonical }, "high", u, home.canonical)
    : obs("seo.canonical", "not_detected", {}, "medium", u));
  const noindex = /noindex/i.test(home.robotsMeta ?? "") || /noindex/i.test(home.xRobotsTag ?? "");
  out.push(noindex
    ? obs("seo.indexable", "observed", { indexable: false, via: /noindex/i.test(home.robotsMeta ?? "") ? "meta robots" : "X-Robots-Tag" }, "high", u, home.robotsMeta ?? home.xRobotsTag)
    : obs("seo.indexable", "observed", { indexable: true, note: "No se encontró una directiva noindex" }, "high", u));

  // Datos estructurados
  const j = all.reduce((a, p) => ({ types: [...a.types, ...p.jsonLd.types], valid: a.valid + p.jsonLd.valid, invalid: a.invalid + p.jsonLd.invalid, org: a.org || p.jsonLd.hasOrganization, addr: a.addr || p.jsonLd.hasAddress, phone: a.phone || p.jsonLd.hasPhone }), { types: [] as string[], valid: 0, invalid: 0, org: false, addr: false, phone: false });
  const types = [...new Set(j.types)];
  out.push(j.valid + j.invalid > 0
    ? obs("sd.jsonld", "observed", { blocks: j.valid + j.invalid, valid: j.valid, invalid: j.invalid, types }, "high", u, types.join(", "))
    : obs("sd.jsonld", "not_detected", { note: NOT_STATIC }, "medium", u));
  out.push(obs("geo.entity_info", "observed", { organizationSchema: j.org, address: j.addr, phone: j.phone, metaDescription: Boolean(home.metaDescription), h1: home.h1.length > 0 }, "medium", u,
    "Inferencia a partir de datos estructurados y metadatos", "inferred"));

  // Medición y publicidad (solo HTML estático)
  const blob = `${home.scriptSrcs.join("\n")}\n${home.inlineScripts}\n${home.rawHtml}`;
  const gtm = /GTM-[A-Z0-9]{4,8}/.exec(blob);
  const ga4 = /\bG-[A-Z0-9]{6,12}\b/.exec(blob);
  const ua = /\bUA-\d{4,10}-\d{1,3}\b/.exec(blob);
  const pixel = /fbq\(\s*['"]init['"]\s*,\s*['"]?(\d{8,20})|connect\.facebook\.net\/[^"']*fbevents\.js|facebook\.com\/tr\?id=(\d+)/i.exec(blob);
  const ads = /\bAW-\d{6,}\b|googleadservices\.com|googleads\.g\.doubleclick\.net/i.exec(blob);
  const clarity = /clarity\.ms\/tag\/|window\.clarity|clarity\(\s*['"]/i.exec(blob);
  const insideGtm = "Hay Google Tag Manager: la etiqueta puede estar configurada dentro del contenedor y no verse en el HTML.";
  const tag = (code: string, _label: string, m: RegExpExecArray | null, extra: Record<string, unknown> = {}) => {
    if (m) out.push(obs(code, "observed", { detected: true, ...extra }, "high", u, around(blob, m[0]) ?? m[0]));
    else if (gtm) out.push(obs(code, "unverifiable", { reason: insideGtm }, "low", u));
    else out.push(obs(code, "not_detected", { detected: false, note: NOT_STATIC }, "low", u));
  };
  if (ga4) out.push(obs("meas.ga4", "observed", { detected: true, id: ga4[0] }, "high", u, around(blob, ga4[0]) ?? ga4[0]));
  else if (ua) out.push(obs("meas.ga4", "observed", { detected: false, legacyUniversalAnalytics: true, id: ua[0], note: "Solo se encontró Universal Analytics (obsoleto)" }, "high", u, around(blob, ua[0]) ?? ua[0]));
  else tag("meas.ga4", "GA4", null);
  out.push(gtm ? obs("meas.gtm", "observed", { detected: true, id: gtm[0] }, "high", u, around(blob, gtm[0]) ?? gtm[0]) : obs("meas.gtm", "not_detected", { detected: false, note: NOT_STATIC }, "low", u));
  tag("meas.meta_pixel", "Meta", pixel, { id: pixel?.[1] ?? pixel?.[2] ?? null });
  tag("meas.google_ads", "Ads", ads);
  tag("meas.clarity", "Clarity", clarity);

  // Conversión
  const forms = all.reduce((n, p) => n + p.forms, 0);
  out.push(forms ? obs("conv.form", "observed", { count: forms }, "high", u) : obs("conv.form", "not_detected", { note: NOT_STATIC }, "low", u));
  const wa = anyPage((p) => p.whatsappLinks.length > 0);
  out.push(wa ? obs("conv.whatsapp", "observed", { link: wa.whatsappLinks[0] }, "high", wa.url, wa.whatsappLinks[0]) : obs("conv.whatsapp", "not_detected", { note: NOT_STATIC + " Algunos sitios usan un botón flotante con script." }, "low", u));
  const tel = anyPage((p) => p.telLinks.length > 0);
  out.push(tel ? obs("conv.phone", "observed", { link: tel.telLinks[0] }, "high", tel.url, tel.telLinks[0]) : obs("conv.phone", "not_detected", {}, "low", u));
  const ctaPage = anyPage((p) => p.ctas.length > 0);
  out.push(ctaPage ? obs("conv.cta", "observed", { count: all.reduce((n, p) => n + p.ctas.length, 0), examples: [...new Set(all.flatMap((p) => p.ctas))].slice(0, 5) }, "medium", ctaPage.url, ctaPage.ctas[0], "inferred") : obs("conv.cta", "not_detected", {}, "low", u));
  const bq = /(cotiz|reserv|agend|presupuesto|solicitar cita|booking)/i;
  const bqLink = all.flatMap((p) => p.links.map((l) => ({ p, l }))).find(({ l }) => bq.test(l.text) || bq.test(l.href));
  out.push(bqLink ? obs("conv.booking_or_quote", "observed", { text: bqLink.l.text, href: bqLink.l.href }, "medium", bqLink.p.url, bqLink.l.text || bqLink.l.href, "inferred") : obs("conv.booking_or_quote", "not_detected", {}, "low", u));
  out.push(home.viewport ? obs("conv.mobile_viewport", "observed", { viewport: true }, "high", u) : obs("conv.mobile_viewport", "not_detected", { note: "No se encontró meta viewport" }, "medium", u));

  // Tecnología y actividad
  const cms = detectCms(home, blob);
  out.push(cms ? obs("tech.cms", "observed", { name: cms.name, via: cms.via }, cms.via === "generator" ? "high" : "medium", u, cms.evidence) : obs("tech.cms", "not_detected", { note: "No se reconoció ninguna plataforma conocida" }, "low", u));
  const dates = [...all.flatMap((p) => p.dates), ...(all.map((p) => p.lastModifiedHeader).filter(Boolean).map((d) => ({ iso: d as string, source: "Last-Modified" })))];
  if (s.sitemap?.lastmod) dates.push({ iso: s.sitemap.lastmod, source: "sitemap lastmod" });
  const latest = dates.sort((a, b) => b.iso.localeCompare(a.iso))[0];
  if (latest) out.push(obs("tech.last_content", "observed", { date: latest.iso, source: latest.source, copyrightYear: home.copyrightYear }, "medium", u, `${latest.source}: ${latest.iso}`, "inferred"));
  else if (home.copyrightYear) out.push(obs("tech.last_content", "observed", { date: null, copyrightYear: home.copyrightYear, note: "Solo se encontró el año de copyright" }, "low", u, `© ${home.copyrightYear}`, "inferred"));
  else out.push(obs("tech.last_content", "not_detected", {}, "low", u));
  const vendor = anyPage((p) => p.vendorCredit !== null);
  out.push(vendor?.vendorCredit ? obs("tech.vendor_credit", "observed", { text: vendor.vendorCredit.text, href: vendor.vendorCredit.href }, "high", vendor.url, vendor.vendorCredit.text) : obs("tech.vendor_credit", "not_detected", {}, "medium", u));

  // Señales por rubro (palabras clave configurables)
  for (const sig of s.industrySignals) {
    const code = `industry.${sig.slug}`;
    let hit: { page: PageFacts; kw: string; excerpt: string } | null = null;
    for (const p of all) {
      const hay = sig.scope === "links" ? p.links.map((l) => `${l.text} ${l.href}`).join(" \n ") : p.text;
      const low = hay.toLowerCase();
      const kw = sig.keywords.find((k) => k && low.includes(k.toLowerCase()));
      if (kw) { hit = { page: p, kw, excerpt: around(hay, kw) ?? kw }; break; }
    }
    out.push(hit
      ? obs(code, "observed", { name: sig.name, keyword: hit.kw }, "medium", hit.page.url, hit.excerpt, "inferred")
      : obs(code, "not_detected", { name: sig.name, note: NOT_STATIC }, "low", u));
  }
  return out;
}

function detectCms(home: PageFacts, blob: string): { name: string; via: "generator" | "recursos"; evidence: string } | null {
  const gen = home.generator ?? "";
  const byGen: [RegExp, string][] = [[/wordpress/i, "WordPress"], [/wix\.com/i, "Wix"], [/joomla/i, "Joomla"], [/drupal/i, "Drupal"], [/shopify/i, "Shopify"], [/squarespace/i, "Squarespace"], [/webflow/i, "Webflow"], [/prestashop/i, "PrestaShop"], [/elementor|divi/i, "WordPress"]];
  for (const [re, name] of byGen) if (re.test(gen)) return { name, via: "generator", evidence: cleanExcerpt(`generator: ${gen}`) };
  const byRes: [RegExp, string][] = [[/\/wp-content\/|\/wp-includes\//i, "WordPress"], [/static\.wixstatic\.com|wix-code/i, "Wix"], [/cdn\.shopify\.com|Shopify\.theme/i, "Shopify"], [/squarespace-cdn|static1\.squarespace/i, "Squarespace"], [/data-wf-page|assets\.website-files\.com/i, "Webflow"], [/\/media\/jui\/|\/templates\/[a-z0-9_-]+\/css\//i, "Joomla"], [/\/sites\/default\/files\/|drupal-settings-json/i, "Drupal"], [/\/static\/frontend\/.*Magento|Mage\.Cookies/i, "Magento"]];
  for (const [re, name] of byRes) { const m = re.exec(blob); if (m) return { name, via: "recursos", evidence: around(blob, m[0], 40) ?? m[0] }; }
  return null;
}

export { ANALYZER_VERSION };
