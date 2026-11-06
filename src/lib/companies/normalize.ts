import { isIP } from "node:net";

const stripAccents = (s: string) => s.normalize("NFD").replace(/\p{M}+/gu, "");

const LEGAL_FORMS = [
  "sociedad anonima cerrada",
  "sociedad anonima abierta",
  "sociedad anonima",
  "sociedad comercial de responsabilidad limitada",
  "s a c",
  "s a a",
  "s a",
  "s r l",
  "s c r l",
  "e i r l",
  "sac",
  "saa",
  "sa",
  "srl",
  "scrl",
  "eirl",
  "sas",
  "ltda",
];
const LEGAL_RE = new RegExp(`( ${LEGAL_FORMS.join("| ")})$`);

/** Nombre normalizado para deduplicar: sin tildes, sin signos y sin forma societaria final. */
export function normalizeName(input: string): string {
  let s = stripAccents(input.toLowerCase())
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  for (let i = 0; i < 3; i++) {
    const next = s.replace(LEGAL_RE, "").trim();
    if (next === s || next.length === 0) break;
    s = next;
  }
  return s;
}

const NOT_OWN_SITE = new Set([
  "facebook.com", "fb.com", "instagram.com", "linkedin.com", "twitter.com", "x.com", "tiktok.com",
  "youtube.com", "wa.me", "linktr.ee", "google.com", "goo.gl", "gmail.com", "hotmail.com",
  "outlook.com", "yahoo.com", "live.com", "icloud.com", "wixsite.com", "blogspot.com", "wordpress.com",
]);
const RESERVED_SUFFIX = [".local", ".internal", ".localhost", ".lan", ".home.arpa", ".invalid", ".test", ".example"];

export type DomainResult = { ok: true; domain: string } | { ok: false; error: string };

/**
 * Normaliza un sitio web o dominio. Rechaza IPs, nombres internos y redes sociales:
 * el analizador solo debe apuntar al sitio propio de una empresa.
 */
export function normalizeDomain(input: string): DomainResult {
  let s = input.trim().toLowerCase();
  if (!s) return { ok: false, error: "dominio vacío" };
  if (s.length > 300) return { ok: false, error: "dominio demasiado largo" };
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  s = s.replace(/^[^/@]*@/, "");
  s = s.split(/[/?#]/)[0] ?? "";
  if (s.startsWith("[")) return { ok: false, error: "no se aceptan direcciones IP" };
  s = s.replace(/:\d+$/, "").replace(/\.$/, "");
  let host: string;
  try {
    host = new URL(`http://${s}`).hostname;
  } catch {
    return { ok: false, error: "dominio inválido" };
  }
  host = host.replace(/^www\./, "");
  if (isIP(host)) return { ok: false, error: "no se aceptan direcciones IP" };
  if (!host.includes(".")) return { ok: false, error: "dominio sin extensión" };
  if (RESERVED_SUFFIX.some((x) => host.endsWith(x))) return { ok: false, error: "dominio interno o reservado" };
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host) || host.length > 253) {
    return { ok: false, error: "dominio inválido" };
  }
  if (/^[0-9]+$/.test(host.split(".").pop() ?? "")) return { ok: false, error: "dominio inválido" };
  const parts = host.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    if (NOT_OWN_SITE.has(parts.slice(i).join("."))) {
      return { ok: false, error: "es una red social o correo gratuito; usa el sitio propio de la empresa" };
    }
  }
  return { ok: true, domain: host };
}

export function normalizeEmailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const host = email.slice(at + 1).trim().toLowerCase();
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) ? host : null;
}

const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
const RUC_PREFIXES = ["10", "15", "16", "17", "20"];

export function isValidRuc(ruc: string): boolean {
  if (!/^[0-9]{11}$/.test(ruc)) return false;
  if (!RUC_PREFIXES.includes(ruc.slice(0, 2))) return false;
  const sum = RUC_WEIGHTS.reduce((acc, w, i) => acc + w * Number(ruc[i]), 0);
  const check = (11 - (sum % 11)) % 10;
  return check === Number(ruc[10]);
}

export function normalizeRuc(input: string): { ok: true; ruc: string } | { ok: false; error: string } {
  const digits = input.replace(/[\s.-]/g, "");
  if (!isValidRuc(digits)) return { ok: false, error: "RUC inválido (11 dígitos y dígito verificador)" };
  return { ok: true, ruc: digits };
}

export const cleanText = (s: string | undefined | null, max = 200): string | null => {
  const t = (s ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
};

const bigrams = (s: string): Map<string, number> => {
  const m = new Map<string, number>();
  const t = ` ${s} `;
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2);
    m.set(g, (m.get(g) ?? 0) + 1);
  }
  return m;
};

/** Coeficiente de Dice sobre bigramas, de 0 a 1. */
export function nameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  for (const [g, n] of A) inter += Math.min(n, B.get(g) ?? 0);
  const total = [...A.values()].reduce((x, y) => x + y, 0) + [...B.values()].reduce((x, y) => x + y, 0);
  return total === 0 ? 0 : (2 * inter) / total;
}

const digitTokens = (s: string) => s.split(" ").filter((t) => /\d/.test(t)).sort().join(" ");

/**
 * Similitud para detectar duplicados. Si los nombres difieren en sus números (por ejemplo «Empresa 1» y
 * «Empresa 2», «Sucursal 10»), no son la misma empresa aunque se parezcan mucho.
 */
export function duplicateScore(a: string, b: string): number {
  if (digitTokens(a) !== digitTokens(b)) return 0;
  return nameSimilarity(a, b);
}
