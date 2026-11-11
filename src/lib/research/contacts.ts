import * as cheerio from "cheerio";
import type { ContactKind, RawContact } from "./provider";

export interface Contact { kind: ContactKind; value: string; source_url: string }

const SOCIAL_HOSTS = ["facebook.com", "instagram.com", "linkedin.com", "tiktok.com", "youtube.com", "x.com", "twitter.com"];
const FAKE_EMAIL = /@(example|ejemplo|test|sentry|wixpress|domain)\.(com|pe|org)$|^(user|usuario|tucorreo|correo|email|nombre)@/i;

const hostOf = (u: URL) => u.hostname.replace(/^www\./, "").toLowerCase();
const cleanUrl = (raw: string): URL | null => {
  try { const u = new URL(raw.trim()); return /^https?:$/.test(u.protocol) && u.username === "" && u.password === "" ? u : null; } catch { return null; }
};
/** Dígitos de un teléfono, sin el prefijo del país (51) ni el 0 de marcado de provincia. Válido: 7 a 9 dígitos (fijo con código o celular). */
export const phoneDigits = (raw: string): string | null => {
  let d = raw.replace(/[^\d]/g, "");
  if (d.startsWith("0051")) d = d.slice(4); else if (d.startsWith("51") && d.length >= 10) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d.length >= 7 && d.length <= 9 ? d : null;
};

/** Deja pasar solo contactos con forma válida y fuente verificable; lo demás se descarta. Nunca se confía en lo que dijo el modelo. */
export function sanitizeContact(c: RawContact): Contact | null {
  const src = cleanUrl(c.source_url);
  if (!src) return null;
  const source_url = src.toString().slice(0, 500);
  const v = c.value.trim();
  switch (c.kind) {
    case "telefono": { const d = phoneDigits(v); return d ? { kind: "telefono", value: d.length === 9 && d.startsWith("9") ? `+51 ${d}` : d, source_url } : null; }
    case "whatsapp": {
      const u = cleanUrl(v);
      const raw = u && /(^|\.)(wa\.me|whatsapp\.com)$/.test(hostOf(u)) ? (u.searchParams.get("phone") ?? u.pathname.replace(/\//g, "")) : v;
      const d = phoneDigits(raw);
      return d && d.length === 9 && d.startsWith("9") ? { kind: "whatsapp", value: `+51 ${d}`, source_url } : null;
    }
    case "correo": {
      const e = v.toLowerCase();
      return /^[a-z0-9._%+-]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/.test(e) && e.length <= 120 && !FAKE_EMAIL.test(e) ? { kind: "correo", value: e, source_url } : null;
    }
    case "formulario": { const u = cleanUrl(v); return u ? { kind: "formulario", value: u.toString().slice(0, 300), source_url } : null; }
    case "red_social": {
      const u = cleanUrl(v);
      return u && SOCIAL_HOSTS.some((h) => hostOf(u) === h || hostOf(u).endsWith(`.${h}`)) ? { kind: "red_social", value: u.toString().slice(0, 300), source_url } : null;
    }
  }
}

export const sanitizeContacts = (raw: RawContact[]): Contact[] => {
  const seen = new Set<string>();
  const out: Contact[] = [];
  for (const r of raw) {
    const c = sanitizeContact(r);
    if (!c || seen.has(`${c.kind}|${c.value}`)) continue;
    seen.add(`${c.kind}|${c.value}`);
    out.push(c);
  }
  return out;
};

/** Texto y enlaces de una página, para comprobar si un contacto aparece de verdad en el sitio de la empresa. */
export function pageEvidence(html: string): { text: string; hrefs: string[] } {
  const $ = cheerio.load(html);
  const hrefs: string[] = [];
  $("a[href]").each((_, el) => { hrefs.push(($(el).attr("href") ?? "").trim().slice(0, 500)); });
  $("script, style, noscript, template, svg").remove();
  return { text: $("body").text().replace(/\s+/g, " ").slice(0, 120_000), hrefs };
}

/** ¿Aparece este contacto en el sitio propio de la empresa? (teléfono y WhatsApp por sus dígitos; correo por texto o mailto; formulario si es del mismo dominio; red social por enlace) */
export function appearsOnSite(c: Contact, domain: string, pages: { text: string; hrefs: string[] }[]): boolean {
  const text = pages.map((p) => p.text.toLowerCase()).join(" ");
  const hrefs = pages.flatMap((p) => p.hrefs.map((h) => h.toLowerCase()));
  const digits = pages.map((p) => p.text.replace(/[^\d]/g, "")).join(" ") + " " + hrefs.map((h) => h.replace(/[^\d]/g, "")).join(" ");
  switch (c.kind) {
    case "telefono": case "whatsapp": { const d = phoneDigits(c.value); return Boolean(d) && digits.includes(d!); }
    case "correo": return text.includes(c.value) || hrefs.some((h) => h.includes(c.value));
    case "formulario": { const u = cleanUrl(c.value); return Boolean(u) && (hostOf(u!) === domain || hostOf(u!).endsWith(`.${domain}`)); }
    case "red_social": { const u = cleanUrl(c.value); return Boolean(u) && hrefs.some((h) => h.replace(/\/$/, "").includes(`${hostOf(u!)}${u!.pathname.replace(/\/$/, "").toLowerCase()}`)); }
  }
}
