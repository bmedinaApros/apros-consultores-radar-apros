import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import type { IncomingHttpHeaders, IncomingMessage } from "node:http";
import { BlockedError, resolveAndValidate, systemResolver, validateUrl, type PinnedAddress, type Resolver, type ValidatedUrl } from "./net-guard";

export type Outcome =
  | "ok" | "blocked" | "timeout" | "too_large" | "bad_content_type" | "http_error"
  | "network_error" | "too_many_redirects" | "tls_error";

export interface FetchOptions {
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  method?: "GET" | "HEAD";
  accept?: string;
  /** Tipos de contenido aceptados en respuestas 2xx. Por defecto, HTML y texto. */
  contentTypes?: RegExp;
}

export interface TlsInfo {
  validTo: string | null;
  issuer: string | null;
  protocol: string | null;
  authorized: boolean;
}

export interface FetchResult {
  outcome: Outcome;
  reason?: string;
  url: string; // URL final tras redirecciones
  status?: number;
  headers: IncomingHttpHeaders;
  body: string;
  bytes: number;
  truncated: boolean;
  redirects: string[];
  tls?: TlsInfo;
  durationMs: number;
}

export type Fetcher = (url: string, opts?: FetchOptions) => Promise<FetchResult>;

export interface FetcherDeps {
  userAgent: string;
  allowedPorts?: number[];
  resolver?: Resolver;
  /** SOLO PRUEBAS: traduce una dirección pública ya validada hacia un servidor local. Nunca se configura desde el entorno. */
  testRoute?: (pinned: PinnedAddress, port: number) => { host: string; port: number } | null;
  /** SOLO PRUEBAS: autoridad certificadora adicional para un servidor local de prueba. Nunca se configura desde el entorno. */
  testCa?: string;
}

const DEFAULTS = { maxBytes: 1_500_000, timeoutMs: 10_000, maxRedirects: 5 };
const TEXTUAL = /^(text\/html|application\/xhtml\+xml|text\/plain|text\/xml|application\/xml)\b/i;
const ERROR_BODY_CAP = 64 * 1024;

class HopError extends Error {
  constructor(public outcome: Outcome, public reason: string) {
    super(reason);
  }
}

interface Hop {
  status: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
  truncated: boolean;
  tls?: TlsInfo;
}

const TLS_CODES = /^(CERT_|ERR_TLS|ERR_SSL|DEPTH_ZERO|UNABLE_TO_|SELF_SIGNED|HOSTNAME_MISMATCH|ERR_OSSL)/;

function requestOnce(
  target: ValidatedUrl,
  pinned: PinnedAddress,
  opts: Required<Pick<FetchOptions, "maxBytes" | "method" | "accept" | "contentTypes">>,
  deadlineMs: number,
  deps: FetcherDeps,
): Promise<Hop> {
  return new Promise((resolve, reject) => {
    const remaining = deadlineMs - Date.now();
    if (remaining <= 0) return reject(new HopError("timeout", "tiempo de espera agotado"));
    const secure = target.url.protocol === "https:";
    const route = deps.testRoute?.(pinned, target.port) ?? null;
    const lib = secure ? https : http;
    // El nombre se resuelve UNA vez (ya validado) y la conexión se fija a esa IP: no hay segunda resolución.
    const lookup: http.RequestOptions["lookup"] = (_host, options, cb) => {
      const all = (options as { all?: boolean }).all;
      if (all) (cb as unknown as (e: null, a: { address: string; family: number }[]) => void)(null, [{ address: pinned.address, family: pinned.family }]);
      else cb(null, pinned.address, pinned.family);
    };
    let tls: TlsInfo | undefined;
    const req = lib.request(
      {
        host: route?.host ?? target.hostname,
        port: route?.port ?? target.port,
        path: `${target.url.pathname}${target.url.search}`,
        method: opts.method,
        lookup: route ? undefined : lookup,
        servername: secure ? target.hostname : undefined,
        ...(secure && deps.testCa ? { ca: deps.testCa } : {}),
        agent: false,
        maxHeaderSize: 16 * 1024,
        headers: {
          Host: target.url.host,
          "User-Agent": deps.userAgent,
          Accept: opts.accept,
          "Accept-Encoding": "gzip",
          "Accept-Language": "es-PE,es;q=0.9",
          Connection: "close",
        },
      },
      (res: IncomingMessage) => {
        const status = res.statusCode ?? 0;
        const headers = res.headers;
        const ctype = String(headers["content-type"] ?? "");
        const isRedirect = [301, 302, 303, 307, 308].includes(status) && headers.location;
        const okStatus = status >= 200 && status < 300;
        if (okStatus && opts.method === "GET" && !opts.contentTypes.test(ctype)) {
          res.destroy();
          return reject(new HopError("bad_content_type", `tipo de contenido no permitido (${ctype.split(";")[0] || "desconocido"})`));
        }
        const declared = Number(headers["content-length"] ?? 0);
        if (okStatus && declared > opts.maxBytes * 4) {
          res.destroy();
          return reject(new HopError("too_large", `la respuesta declara ${declared} bytes`));
        }
        if (opts.method === "HEAD" || isRedirect) {
          res.resume();
          return resolve({ status, headers, body: Buffer.alloc(0), truncated: false, tls });
        }
        const enc = String(headers["content-encoding"] ?? "identity").toLowerCase();
        if (enc !== "identity" && enc !== "gzip") {
          res.destroy();
          return reject(new HopError("network_error", `codificación no soportada (${enc})`));
        }
        const cap = okStatus ? opts.maxBytes : ERROR_BODY_CAP;
        const chunks: Buffer[] = [];
        let size = 0;
        let truncated = false;
        let rawSize = 0;
        const finish = () => resolve({ status, headers, body: Buffer.concat(chunks), truncated, tls });
        const onData = (c: Buffer) => {
          if (truncated) return;
          size += c.length;
          if (size > cap) {
            truncated = true;
            chunks.push(c.subarray(0, c.length - (size - cap)));
            res.destroy();
            gunzip?.destroy();
            return finish();
          }
          chunks.push(c);
        };
        let gunzip: zlib.Gunzip | undefined;
        if (enc === "gzip") {
          gunzip = zlib.createGunzip();
          gunzip.on("data", onData);
          gunzip.on("end", () => !truncated && finish());
          gunzip.on("error", () => !truncated && reject(new HopError("network_error", "contenido comprimido inválido")));
          res.on("data", (c: Buffer) => {
            rawSize += c.length;
            // Tope también sobre los bytes comprimidos, además del tope sobre los descomprimidos.
            if (rawSize > cap) { res.destroy(); gunzip?.destroy(); if (!truncated) { truncated = true; finish(); } return; }
            gunzip!.write(c);
          });
          res.on("end", () => gunzip!.end());
        } else {
          res.on("data", onData);
          res.on("end", () => !truncated && finish());
        }
        res.on("error", () => !truncated && reject(new HopError("network_error", "conexión interrumpida")));
        res.on("aborted", () => !truncated && reject(new HopError("network_error", "conexión interrumpida")));
      },
    );
    // El plazo cubre todo el intercambio, incluso si el servidor gotea datos muy despacio.
    const timer = setTimeout(() => {
      req.destroy();
      reject(new HopError("timeout", "tiempo de espera agotado"));
    }, remaining);
    req.on("close", () => clearTimeout(timer));
    req.on("socket", (socket) => {
      if (secure) {
        socket.once("secureConnect", () => {
          const s = socket as unknown as import("node:tls").TLSSocket;
          const cert = s.getPeerCertificate();
          const org = cert?.issuer?.O;
          tls = {
            validTo: cert?.valid_to ? new Date(cert.valid_to).toISOString() : null,
            issuer: Array.isArray(org) ? org[0] ?? null : org ?? null,
            protocol: s.getProtocol(),
            authorized: s.authorized,
          };
        });
      }
    });
    req.on("error", (e: NodeJS.ErrnoException) => {
      const code = e.code ?? "";
      if (TLS_CODES.test(code)) return reject(new HopError("tls_error", `error de certificado TLS (${code})`));
      reject(new HopError("network_error", `error de red (${code || e.message.slice(0, 80)})`));
    });
    req.end();
  });
}

const decode = (buf: Buffer, headers: IncomingHttpHeaders): string => {
  const m = /charset=([\w-]+)/i.exec(String(headers["content-type"] ?? ""));
  try {
    return new TextDecoder(m?.[1]?.toLowerCase() ?? "utf-8").decode(buf);
  } catch {
    return new TextDecoder("utf-8").decode(buf);
  }
};

export function createSafeFetcher(deps: FetcherDeps): Fetcher {
  return async (rawUrl, o = {}) => {
    const t0 = Date.now();
    const opts = {
      maxBytes: o.maxBytes ?? DEFAULTS.maxBytes,
      method: o.method ?? "GET",
      accept: o.accept ?? "text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8,*/*;q=0.1",
      contentTypes: o.contentTypes ?? TEXTUAL,
    };
    const deadline = t0 + (o.timeoutMs ?? DEFAULTS.timeoutMs);
    const maxRedirects = o.maxRedirects ?? DEFAULTS.maxRedirects;
    const redirects: string[] = [];
    let current = rawUrl;
    const result = (r: Partial<FetchResult> & { outcome: Outcome }): FetchResult => ({
      url: current, headers: {}, body: "", bytes: 0, truncated: false, redirects, durationMs: Date.now() - t0, ...r,
    });

    for (let hop = 0; hop <= maxRedirects; hop++) {
      let target: ValidatedUrl;
      let pinned: PinnedAddress;
      try {
        target = validateUrl(current, deps.allowedPorts);
        pinned = await resolveAndValidate(target.hostname, deps.resolver ?? systemResolver);
      } catch (e) {
        if (e instanceof BlockedError) return result({ outcome: "blocked", reason: e.reason });
        throw e;
      }
      let res: Hop;
      try {
        res = await requestOnce(target, pinned, opts, deadline, deps);
      } catch (e) {
        if (e instanceof HopError) return result({ outcome: e.outcome, reason: e.reason });
        return result({ outcome: "network_error", reason: "error inesperado de red" });
      }
      const loc = res.headers.location;
      if ([301, 302, 303, 307, 308].includes(res.status) && loc) {
        if (hop === maxRedirects) return result({ outcome: "too_many_redirects", reason: `más de ${maxRedirects} redirecciones`, status: res.status });
        let next: URL;
        try {
          next = new URL(loc, target.url);
        } catch {
          return result({ outcome: "blocked", reason: "redirección a una URL inválida", status: res.status });
        }
        if (target.url.protocol === "https:" && next.protocol === "http:") {
          return result({ outcome: "blocked", reason: "redirección de https a http (degradación)", status: res.status });
        }
        redirects.push(current);
        current = next.toString();
        continue; // la nueva URL vuelve a pasar por validateUrl y resolveAndValidate
      }
      const text = decode(res.body, res.headers);
      const ok = res.status >= 200 && res.status < 300;
      return result({
        outcome: ok ? "ok" : "http_error",
        reason: ok ? undefined : `HTTP ${res.status}`,
        status: res.status, headers: res.headers, body: text, bytes: res.body.length, truncated: res.truncated, tls: res.tls,
      });
    }
    return result({ outcome: "too_many_redirects", reason: `más de ${maxRedirects} redirecciones` });
  };
}

/** Espaciado mínimo entre peticiones al mismo dominio. */
export class DomainThrottle {
  private last = new Map<string, number>();
  constructor(
    private minIntervalMs = 1000,
    private now: () => number = Date.now,
    private sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {}
  async wait(host: string): Promise<void> {
    const t = this.now();
    const prev = this.last.get(host);
    const next = prev === undefined ? t : Math.max(t, prev + this.minIntervalMs);
    this.last.set(host, next);
    if (next > t) await this.sleep(next - t);
  }
}
