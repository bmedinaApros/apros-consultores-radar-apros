import * as cheerio from "cheerio";

export const ANALYZER_VERSION = "1.0.0";

export interface PageFacts {
  url: string;
  status: number;
  lastModifiedHeader: string | null;
  xRobotsTag: string | null;
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  canonical: string | null;
  robotsMeta: string | null;
  viewport: boolean;
  lang: string | null;
  generator: string | null;
  jsonLd: { types: string[]; valid: number; invalid: number; hasOrganization: boolean; hasAddress: boolean; hasPhone: boolean; dates: string[] };
  scriptSrcs: string[];
  inlineScripts: string;
  rawHtml: string;
  links: { href: string; text: string }[];
  forms: number;
  telLinks: string[];
  whatsappLinks: string[];
  ctas: string[];
  dates: { iso: string; source: string }[];
  copyrightYear: number | null;
  vendorCredit: { text: string; href: string | null } | null;
  text: string;
}

const MAX_TEXT = 100_000;
const MAX_INLINE = 200_000;

/** Texto seguro para guardar como evidencia: sin caracteres de control, colapsado y acotado. */
export function cleanExcerpt(s: string, max = 300): string {
  return s.replace(/[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

const absolute = (href: string, base: string): string | null => {
  try {
    const u = new URL(href, base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
};

const CTA_WORDS = /\b(cotiz\w*|reserv\w*|agend\w*|cont[aá]ct\w*|solicit\w*|escr[ií]benos|comprar|compra ahora|suscr[ií]b\w*|descarg\w*|pide|pedir|llama|ll[aá]manos|whatsapp|inscr[ií]b\w*|postula|matr[ií]cula)\b/i;

function collectJsonLd($: cheerio.CheerioAPI): PageFacts["jsonLd"] {
  const out = { types: [] as string[], valid: 0, invalid: 0, hasOrganization: false, hasAddress: false, hasPhone: false, dates: [] as string[] };
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    if (raw.length > 300_000) { out.invalid++; return; }
    try {
      const data = JSON.parse(raw);
      out.valid++;
      const walk = (n: unknown, depth: number) => {
        if (depth > 6 || n === null || typeof n !== "object") return;
        if (Array.isArray(n)) { n.slice(0, 200).forEach((x) => walk(x, depth + 1)); return; }
        const o = n as Record<string, unknown>;
        const t = o["@type"];
        for (const x of Array.isArray(t) ? t : t ? [t] : []) if (typeof x === "string") out.types.push(x);
        if (typeof t === "string" && /organization|localbusiness|corporation|store|school|hospital|realestate|medical/i.test(t)) out.hasOrganization = true;
        if (o.address) out.hasAddress = true;
        if (o.telephone) out.hasPhone = true;
        for (const k of ["datePublished", "dateModified"]) if (typeof o[k] === "string") out.dates.push(o[k] as string);
        Object.values(o).forEach((v) => walk(v, depth + 1));
      };
      walk(data, 0);
    } catch {
      out.invalid++;
    }
  });
  out.types = [...new Set(out.types)].slice(0, 30);
  return out;
}

function validDate(s: string): string | null {
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  const y = d.getUTCFullYear();
  return y >= 1995 && t <= Date.now() + 86_400_000 ? d.toISOString() : null;
}

export function extractPage(html: string, url: string, status: number, headers: Record<string, string | string[] | undefined>): PageFacts {
  const $ = cheerio.load(html);
  const meta = (sel: string) => $(sel).first().attr("content")?.trim() || null;

  const scriptSrcs: string[] = [];
  let inline = "";
  $("script").each((_, el) => {
    const src = $(el).attr("src");
    if (src) scriptSrcs.push(src.slice(0, 500));
    else if (inline.length < MAX_INLINE) inline += ($(el).html() ?? "").slice(0, 50_000) + "\n";
  });
  $("iframe[src]").each((_, el) => { scriptSrcs.push(($(el).attr("src") ?? "").slice(0, 500)); });
  $("noscript").each((_, el) => { inline += ($(el).html() ?? "").slice(0, 5000) + "\n"; });

  const links: PageFacts["links"] = [];
  const telLinks: string[] = [];
  const whatsappLinks: string[] = [];
  const ctas: string[] = [];
  $("a[href], button, input[type=submit]").each((_, el) => {
    const $el = $(el);
    const text = ($el.text() || $el.attr("value") || $el.attr("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 120);
    const href = $el.attr("href")?.trim() ?? "";
    if (href.toLowerCase().startsWith("tel:")) telLinks.push(href.slice(0, 60));
    else if (/^(https?:)?\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)\//i.test(href) || /^whatsapp:/i.test(href)) whatsappLinks.push(href.slice(0, 200));
    else if (href && !href.startsWith("#") && !/^(mailto|javascript|data):/i.test(href) && links.length < 300) {
      const abs = absolute(href, url);
      if (abs) links.push({ href: abs, text });
    }
    if (text && CTA_WORDS.test(text) && ctas.length < 30) ctas.push(text);
  });

  const dates: PageFacts["dates"] = [];
  const addDate = (raw: string | undefined | null, source: string) => { const d = raw ? validDate(raw) : null; if (d) dates.push({ iso: d, source }); };
  addDate(meta('meta[property="article:published_time"]'), "article:published_time");
  addDate(meta('meta[property="article:modified_time"]'), "article:modified_time");
  addDate(meta('meta[name="date"]'), "meta date");
  $("time[datetime]").slice(0, 50).each((_, el) => addDate($(el).attr("datetime"), "time"));
  const jsonLd = collectJsonLd($);
  jsonLd.dates.forEach((d) => addDate(d, "json-ld"));
  const lm = headers["last-modified"];
  const lastModifiedHeader = typeof lm === "string" ? validDate(lm) : null;

  $("script, style, noscript, template, svg").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);

  const footerText = ($("footer").last().text() || text.slice(-1500)).replace(/\s+/g, " ").trim();
  const copyright = /(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d{2}|19\d{2})/i.exec(footerText);
  const credit = /(desarrollad[oa]|dise[ñn]ad[oa]|creado|hecho|powered|developed|designed|website|sitio web|web)\s*(?:por|by)\s*[:\-]?\s*([^|•\n]{2,60})/i.exec(footerText);
  let vendorCredit: PageFacts["vendorCredit"] = null;
  if (credit) {
    let href: string | null = null;
    $("footer a[href]").each((_, el) => {
      const h = $(el).attr("href") ?? "";
      const abs = absolute(h, url);
      if (abs && !href && new URL(abs).hostname !== new URL(url).hostname && credit[2] && $(el).text().trim() && credit[2].toLowerCase().includes($(el).text().trim().toLowerCase().slice(0, 12))) href = abs;
    });
    vendorCredit = { text: cleanExcerpt(credit[0], 120), href };
  }

  return {
    url, status,
    lastModifiedHeader,
    xRobotsTag: typeof headers["x-robots-tag"] === "string" ? (headers["x-robots-tag"] as string).slice(0, 200) : null,
    title: ($("title").first().text() || "").replace(/\s+/g, " ").trim().slice(0, 300) || null,
    metaDescription: meta('meta[name="description" i]'),
    h1: $("h1").map((_, el) => $(el).text().replace(/\s+/g, " ").trim().slice(0, 200)).get().slice(0, 10),
    canonical: $('link[rel="canonical" i]').first().attr("href")?.trim() || null,
    robotsMeta: meta('meta[name="robots" i]'),
    viewport: $('meta[name="viewport" i]').length > 0,
    lang: $("html").attr("lang") ?? null,
    generator: meta('meta[name="generator" i]'),
    jsonLd,
    scriptSrcs,
    inlineScripts: inline,
    rawHtml: html.slice(0, 1_500_000),
    links,
    forms: $("form").length,
    telLinks, whatsappLinks, ctas,
    dates,
    copyrightYear: copyright ? Number(copyright[1]) : null,
    vendorCredit,
    text,
  };
}

/** Prueba de reto antibots o bloqueo: nunca debe interpretarse como un hallazgo negativo. */
export function looksLikeChallenge(status: number | undefined, headers: Record<string, string | string[] | undefined>, body: string): boolean {
  const sample = body.slice(0, 20_000).toLowerCase();
  const marker = /(just a moment|cf-chl|cf-browser-verification|attention required|px-captcha|captcha-delivery|_incapsula_|incapsula incident|ddos protection by|checking your browser|enable javascript and cookies|are you a robot|acceso denegado|access denied)/.test(sample);
  if (String(headers["cf-mitigated"] ?? "").toLowerCase() === "challenge") return true;
  if (status !== undefined && [401, 403, 429, 503].includes(status)) return marker || status === 429 || status === 403;
  return marker && sample.length < 20_000;
}
