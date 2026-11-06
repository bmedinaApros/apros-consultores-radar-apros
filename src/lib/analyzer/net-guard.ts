import { isIP } from "node:net";
import dns from "node:dns/promises";

/**
 * Protección contra SSRF. Toda dirección que el analizador vaya a contactar debe pasar por aquí:
 *  1. validateUrl: esquema, puerto, credenciales y nombre de host.
 *  2. resolveAndValidate: resuelve el DNS y rechaza si CUALQUIER respuesta es una dirección no pública.
 *  3. El fetcher se conecta a la IP ya validada (no vuelve a resolver), lo que impide el DNS rebinding.
 * Esto se repite en cada redirección.
 */

export class BlockedError extends Error {
  override name = "BlockedError";
  constructor(public reason: string) {
    super(reason);
  }
}

// ---------- IPv4 ----------

const parseV4 = (ip: string): number | null => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
};

const V4_BLOCKED: [string, number, string][] = [
  ["0.0.0.0", 8, "red actual (0.0.0.0/8)"],
  ["10.0.0.0", 8, "red privada (10.0.0.0/8)"],
  ["100.64.0.0", 10, "espacio compartido CGNAT (100.64.0.0/10)"],
  ["127.0.0.0", 8, "loopback (127.0.0.0/8)"],
  ["169.254.0.0", 16, "enlace local y metadatos de nube (169.254.0.0/16)"],
  ["172.16.0.0", 12, "red privada (172.16.0.0/12)"],
  ["192.0.0.0", 24, "protocolo IETF (192.0.0.0/24)"],
  ["192.0.2.0", 24, "documentación (192.0.2.0/24)"],
  ["192.88.99.0", 24, "relé 6to4 (192.88.99.0/24)"],
  ["192.168.0.0", 16, "red privada (192.168.0.0/16)"],
  ["198.18.0.0", 15, "pruebas de rendimiento (198.18.0.0/15)"],
  ["198.51.100.0", 24, "documentación (198.51.100.0/24)"],
  ["203.0.113.0", 24, "documentación (203.0.113.0/24)"],
  ["224.0.0.0", 4, "multidifusión (224.0.0.0/4)"],
  ["240.0.0.0", 4, "reservada (240.0.0.0/4)"],
];

function classifyV4(ip: string): string | null {
  const n = parseV4(ip);
  if (n === null) return "dirección IPv4 inválida";
  for (const [base, bits, why] of V4_BLOCKED) {
    const b = parseV4(base)!;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    if (((n & mask) >>> 0) === ((b & mask) >>> 0)) return why;
  }
  return null;
}

// ---------- IPv6 ----------

/** Expande una IPv6 a ocho grupos de 16 bits. Devuelve null si no es válida o tiene zona (%). */
function parseV6(ip: string): number[] | null {
  if (ip.includes("%") || isIP(ip) !== 6) return null;
  let s = ip.toLowerCase();
  // Cola con IPv4 incrustada (::ffff:1.2.3.4)
  const tail = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(s);
  if (tail) {
    const v4 = parseV4(tail[1]!);
    if (v4 === null) return null;
    s = s.slice(0, -tail[1]!.length) + ((v4 >>> 16) & 0xffff).toString(16) + ":" + (v4 & 0xffff).toString(16);
  }
  const [head, rest, ...extra] = s.split("::");
  if (extra.length) return null;
  const h = head ? head.split(":") : [];
  const r = rest !== undefined && rest !== "" ? rest.split(":") : [];
  const fill = rest === undefined ? 0 : 8 - h.length - r.length;
  if (fill < 0 || (rest === undefined && h.length !== 8)) return null;
  const groups = [...h, ...Array(fill).fill("0"), ...r].map((g) => parseInt(g, 16));
  return groups.length === 8 && groups.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? groups : null;
}

const v4FromGroups = (hi: number, lo: number) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;

function classifyV6(ip: string): string | null {
  const g = parseV6(ip);
  if (!g) return "dirección IPv6 inválida";
  const [a, b, c, d, e, f, gg, h] = g as [number, number, number, number, number, number, number, number];
  const allZeroFirst5 = a === 0 && b === 0 && c === 0 && d === 0 && e === 0;
  if (allZeroFirst5 && f === 0 && gg === 0 && h === 0) return "dirección no especificada (::)";
  if (allZeroFirst5 && f === 0 && gg === 0 && h === 1) return "loopback (::1)";
  // IPv4 mapeada ::ffff:a.b.c.d → se evalúa la IPv4 incrustada
  if (allZeroFirst5 && f === 0xffff) return classifyV4(v4FromGroups(gg, h)) ?? null;
  // IPv4 compatible (obsoleta) ::a.b.c.d
  if (allZeroFirst5 && f === 0) return "IPv4 compatible (obsoleta)";
  // NAT64 64:ff9b::/96 → IPv4 incrustada
  if (a === 0x64 && b === 0xff9b && c === 0 && d === 0 && e === 0 && f === 0) return classifyV4(v4FromGroups(gg, h)) ?? null;
  if (a === 0x64 && b === 0xff9b && c === 1) return "NAT64 local (64:ff9b:1::/48)";
  // 6to4 2002::/16 → IPv4 en los bits 16–48
  if (a === 0x2002) return classifyV4(v4FromGroups(b, c)) ?? null;
  if (a === 0x2001 && b === 0) return "Teredo (2001::/32)";
  if (a === 0x2001 && b === 0xdb8) return "documentación (2001:db8::/32)";
  if (a === 0x2001 && (b & 0xfff0) === 0x10) return "ORCHID (2001:10::/28)";
  if (a === 0x2001 && (b & 0xfff0) === 0x20) return "ORCHIDv2 (2001:20::/28)";
  if (a === 0x3fff && (b & 0xf000) === 0) return "documentación (3fff::/20)";
  if (a === 0x100 && b === 0 && c === 0 && d === 0) return "descarte (100::/64)";
  if ((a & 0xffc0) === 0xfe80) return "enlace local (fe80::/10)";
  if ((a & 0xfe00) === 0xfc00) return "red privada ULA (fc00::/7)";
  if ((a & 0xff00) === 0xff00) return "multidifusión (ff00::/8)";
  // Solo se permite unicast global 2000::/3
  if ((a & 0xe000) !== 0x2000) return "fuera del unicast global (2000::/3)";
  return null;
}

/** Devuelve el motivo de bloqueo o null si la IP es pública y permitida. */
export function blockedReason(ip: string): string | null {
  const kind = isIP(ip);
  if (kind === 4) return classifyV4(ip);
  if (kind === 6) return classifyV6(ip);
  return "no es una dirección IP";
}

export const isPublicIp = (ip: string): boolean => blockedReason(ip) === null;

// ---------- URL ----------

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home.arpa", ".intranet", ".corp", ".private", ".invalid"];
const BLOCKED_HOSTS = new Set(["localhost", "metadata", "metadata.google.internal", "instance-data"]);

export interface ValidatedUrl {
  url: URL;
  hostname: string;
  port: number;
}

export function parseAllowedPorts(csv: string): number[] {
  const ports = csv.split(",").map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0 && n < 65536);
  return ports.length ? ports : [80, 443];
}

export function validateUrl(input: string, allowedPorts: number[] = [80, 443]): ValidatedUrl {
  if (input.length > 2048) throw new BlockedError("URL demasiado larga");
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new BlockedError("URL inválida");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new BlockedError(`esquema no permitido (${url.protocol})`);
  if (url.username || url.password) throw new BlockedError("la URL no puede incluir credenciales");
  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
  if (!allowedPorts.includes(port)) throw new BlockedError(`puerto no permitido (${port})`);

  // WHATWG normaliza formas como 2130706433, 0x7f.1 o 127.1 a 127.0.0.1; los corchetes de IPv6 se quitan aquí.
  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!hostname) throw new BlockedError("falta el nombre de host");
  if (isIP(hostname)) {
    const why = blockedReason(hostname);
    if (why) throw new BlockedError(`dirección no pública: ${why}`);
    return { url, hostname, port };
  }
  if (BLOCKED_HOSTS.has(hostname) || BLOCKED_SUFFIXES.some((s) => hostname.endsWith(s))) throw new BlockedError("nombre de host interno");
  if (!hostname.includes(".")) throw new BlockedError("nombre de host sin extensión");
  if (hostname.length > 253) throw new BlockedError("nombre de host demasiado largo");
  return { url, hostname, port };
}

// ---------- DNS ----------

export type Resolver = (hostname: string) => Promise<{ address: string; family: 4 | 6 }[]>;

export const systemResolver: Resolver = async (hostname) => {
  const res = await dns.lookup(hostname, { all: true, verbatim: true });
  return res.map((r) => ({ address: r.address, family: r.family as 4 | 6 }));
};

export interface PinnedAddress {
  address: string;
  family: 4 | 6;
}

/**
 * Resuelve y valida. Si CUALQUIERA de las respuestas es no pública se rechaza todo el nombre
 * (una respuesta mixta es la firma típica de un ataque de rebinding o de una configuración peligrosa).
 */
export async function resolveAndValidate(
  hostname: string,
  resolver: Resolver = systemResolver,
  timeoutMs = 5000,
): Promise<PinnedAddress> {
  if (isIP(hostname)) {
    const why = blockedReason(hostname);
    if (why) throw new BlockedError(`dirección no pública: ${why}`);
    return { address: hostname, family: isIP(hostname) as 4 | 6 };
  }
  let timer: NodeJS.Timeout | undefined;
  const answers = await Promise.race([
    resolver(hostname),
    new Promise<never>((_, rej) => { timer = setTimeout(() => rej(new BlockedError("tiempo de espera agotado al resolver el dominio")), timeoutMs); }),
  ]).catch((e) => {
    if (e instanceof BlockedError) throw e;
    throw new BlockedError(`el dominio no se pudo resolver (${(e as { code?: string }).code ?? "error de DNS"})`);
  }).finally(() => clearTimeout(timer));
  if (answers.length === 0) throw new BlockedError("el dominio no tiene direcciones");
  for (const a of answers) {
    const why = blockedReason(a.address);
    if (why) throw new BlockedError(`el dominio resuelve a una dirección no pública: ${why}`);
  }
  return answers[0]!;
}
