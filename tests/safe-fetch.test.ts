import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { createSafeFetcher, DomainThrottle } from "@/lib/analyzer/safe-fetch";
import type { Resolver } from "@/lib/analyzer/net-guard";

const PUBLIC_IP = "93.184.216.34";
const UA = "RadarAPROS-Test/1.0";

let server: http.Server;
let tlsServer: https.Server;
let port = 0;
let tlsPort = 0;
const hits: string[] = [];
let lastHeaders: http.IncomingHttpHeaders = {};

const handlers: Record<string, (req: http.IncomingMessage, res: http.ServerResponse) => void> = {
  "/ok": (_q, res) => { res.setHeader("content-type", "text/html; charset=utf-8"); res.end("<html><title>Hola</title></html>"); },
  "/404": (_q, res) => { res.statusCode = 404; res.setHeader("content-type", "text/html"); res.end("<html>no existe</html>"); },
  "/to-private-ip": (_q, res) => { res.statusCode = 302; res.setHeader("location", "http://127.0.0.1:80/secreto"); res.end(); },
  "/to-metadata": (_q, res) => { res.statusCode = 301; res.setHeader("location", "http://169.254.169.254/latest/meta-data/"); res.end(); },
  "/to-internal-name": (_q, res) => { res.statusCode = 302; res.setHeader("location", "http://admin.internal/"); res.end(); },
  "/to-private-host": (_q, res) => { res.statusCode = 302; res.setHeader("location", "http://rebind.example/ok"); res.end(); },
  "/to-file": (_q, res) => { res.statusCode = 302; res.setHeader("location", "file:///etc/passwd"); res.end(); },
  "/to-bad-port": (_q, res) => { res.statusCode = 302; res.setHeader("location", "http://sitio.pe:6379/"); res.end(); },
  "/loop": (_q, res) => { res.statusCode = 302; res.setHeader("location", "/loop"); res.end(); },
  "/relative": (_q, res) => { res.statusCode = 302; res.setHeader("location", "/ok"); res.end(); },
  "/big": (_q, res) => { res.setHeader("content-type", "text/html"); const chunk = Buffer.alloc(64 * 1024, 97); let n = 0; const t = setInterval(() => { res.write(chunk); if (++n > 200) { clearInterval(t); res.end(); } }, 1); res.on("close", () => clearInterval(t)); },
  "/huge-declared": (_q, res) => { res.setHeader("content-type", "text/html"); res.setHeader("content-length", String(500_000_000)); res.write("x"); setTimeout(() => res.destroy(), 200); },
  "/pdf": (_q, res) => { res.setHeader("content-type", "application/pdf"); res.end("%PDF-1.4"); },
  "/image": (_q, res) => { res.setHeader("content-type", "image/png"); res.end("x"); },
  "/gzip-ok": (_q, res) => { res.setHeader("content-type", "text/html"); res.setHeader("content-encoding", "gzip"); res.end(zlib.gzipSync("<html><title>Comprimido</title></html>")); },
  "/gzip-bomb": (_q, res) => { res.setHeader("content-type", "text/html"); res.setHeader("content-encoding", "gzip"); res.end(zlib.gzipSync(Buffer.alloc(80 * 1024 * 1024, 97))); },
  "/brotli": (_q, res) => { res.setHeader("content-type", "text/html"); res.setHeader("content-encoding", "br"); res.end("x"); },
  "/slow": (_q, res) => { res.setHeader("content-type", "text/html"); const t = setInterval(() => res.write("a"), 100); res.on("close", () => clearInterval(t)); },
  "/silent": () => { /* nunca responde */ },
  "/echo": (req, res) => { lastHeaders = req.headers; res.setHeader("content-type", "text/plain"); res.end("ok"); },
  "/head": (req, res) => { res.setHeader("content-type", "text/html"); res.end(req.method === "HEAD" ? undefined : "cuerpo"); },
  "/utf16": (_q, res) => { res.setHeader("content-type", "text/html; charset=iso-8859-1"); res.end(Buffer.from("<p>Educaci\xf3n</p>", "latin1")); },
};

beforeAll(async () => {
  server = http.createServer((req, res) => { hits.push(req.url ?? ""); (handlers[req.url?.split("?")[0] ?? ""] ?? ((_q, r) => { r.statusCode = 404; r.end(); }))(req, res); });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  port = (server.address() as AddressInfo).port;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "radar-tls-"));
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", path.join(dir, "k.pem"), "-out", path.join(dir, "c.pem"), "-days", "1", "-subj", "/CN=autofirmado.pe"], { stdio: "ignore" });
  tlsServer = https.createServer({ key: fs.readFileSync(path.join(dir, "k.pem")), cert: fs.readFileSync(path.join(dir, "c.pem")) }, (_q, res) => { res.setHeader("content-type", "text/html"); res.end("<html>tls</html>"); });
  await new Promise<void>((r) => tlsServer.listen(0, "127.0.0.1", r));
  tlsPort = (tlsServer.address() as AddressInfo).port;
});
afterAll(() => { server.closeAllConnections?.(); server.close(); tlsServer.closeAllConnections?.(); tlsServer.close(); });

let resolverCalls: string[] = [];
const publicResolver: Resolver = async (host) => {
  resolverCalls.push(host);
  if (host === "rebind.example") return [{ address: "10.0.0.7", family: 4 }];
  return [{ address: PUBLIC_IP, family: 4 }];
};
const fetcher = (extra: { resolver?: Resolver } = {}) =>
  createSafeFetcher({
    userAgent: UA,
    resolver: extra.resolver ?? publicResolver,
    testRoute: (pinned, p) => (pinned.address === PUBLIC_IP ? { host: "127.0.0.1", port: p === 443 ? tlsPort : port } : null),
  });
const url = (p: string) => `http://sitio.pe${p}`;

describe("descarga segura: caso normal", () => {
  it("descarga HTML y devuelve estado, cuerpo y cabeceras", async () => {
    const r = await fetcher()(url("/ok"));
    expect(r).toMatchObject({ outcome: "ok", status: 200 });
    expect(r.body).toContain("<title>Hola</title>");
  });
  it("envía el User-Agent identificable y el Host correcto", async () => {
    await fetcher()(url("/echo"));
    expect(lastHeaders["user-agent"]).toBe(UA);
    expect(lastHeaders.host).toBe("sitio.pe");
    expect(lastHeaders["accept-encoding"]).toBe("gzip");
  });
  it("descomprime gzip", async () => {
    expect((await fetcher()(url("/gzip-ok"))).body).toContain("Comprimido");
  });
  it("respeta el charset declarado", async () => {
    expect((await fetcher()(url("/utf16"))).body).toContain("Educación");
  });
  it("sigue una redirección relativa", async () => {
    const r = await fetcher()(url("/relative"));
    expect(r.outcome).toBe("ok");
    expect(r.redirects).toEqual([url("/relative")]);
  });
  it("una respuesta 404 se informa como error HTTP con su cuerpo (para detectar bloqueos)", async () => {
    const r = await fetcher()(url("/404"));
    expect(r).toMatchObject({ outcome: "http_error", status: 404 });
    expect(r.body).toContain("no existe");
  });
  it("HEAD no descarga cuerpo", async () => {
    const r = await fetcher()(url("/head"), { method: "HEAD" });
    expect(r).toMatchObject({ outcome: "ok", body: "" });
  });
});

describe("SSRF: destinos bloqueados antes de conectar", () => {
  const before = () => hits.length;
  it.each([
    "http://127.0.0.1/ok", "http://localhost/ok", "http://[::1]/ok", "http://169.254.169.254/latest/meta-data/", "http://10.0.0.1/", "http://2130706433/",
    "http://0x7f.1/", "file:///etc/passwd", "ftp://sitio.pe/", "http://sitio.pe:22/", "http://usuario:clave@sitio.pe/",
  ])("bloquea %s sin abrir conexión", async (u) => {
    const n = before();
    const r = await fetcher()(u);
    expect(r.outcome).toBe("blocked");
    expect(hits.length).toBe(n);
  });

  it("bloquea un dominio que resuelve a una IP privada", async () => {
    const n = before();
    const r = await fetcher()("http://rebind.example/ok");
    expect(r).toMatchObject({ outcome: "blocked" });
    expect(r.reason).toMatch(/no pública/);
    expect(hits.length).toBe(n);
  });
});

describe("SSRF: redirecciones", () => {
  it.each([
    ["/to-private-ip", /no pública/], ["/to-metadata", /no pública/], ["/to-internal-name", /interno/],
    ["/to-private-host", /no pública/], ["/to-file", /esquema/], ["/to-bad-port", /puerto/],
  ])("revalida el destino de %s y no lo sigue", async (p, why) => {
    const r = await fetcher()(url(p as string));
    expect(r.outcome).toBe("blocked");
    expect(r.reason).toMatch(why as RegExp);
    expect(hits.filter((h) => h.includes("secreto") || h.includes("meta-data"))).toEqual([]);
  });

  it("corta bucles de redirección", async () => {
    const r = await fetcher()(url("/loop"), { maxRedirects: 3 });
    expect(r.outcome).toBe("too_many_redirects");
    expect(r.redirects.length).toBe(3);
  });
});

describe("SSRF: DNS rebinding", () => {
  it("resuelve el nombre una sola vez por petición y se conecta a esa IP validada", async () => {
    resolverCalls = [];
    const connectedTo: string[] = [];
    const f = createSafeFetcher({
      userAgent: UA,
      resolver: publicResolver,
      testRoute: (pinned) => { connectedTo.push(pinned.address); return { host: "127.0.0.1", port }; },
    });
    await f(url("/ok"));
    expect(resolverCalls).toEqual(["sitio.pe"]);
    expect(connectedTo).toEqual([PUBLIC_IP]);
  });

  it("un resolvedor que cambia de respuesta (pública y luego privada) no logra que se conecte a la privada", async () => {
    let n = 0;
    const flaky: Resolver = async () => (++n === 1 ? [{ address: PUBLIC_IP, family: 4 }] : [{ address: "127.0.0.1", family: 4 }]);
    const connectedTo: string[] = [];
    const f = createSafeFetcher({ userAgent: UA, resolver: flaky, testRoute: (pinned) => { connectedTo.push(pinned.address); return { host: "127.0.0.1", port }; } });
    const r = await f(url("/ok"));
    expect(r.outcome).toBe("ok");
    expect(connectedTo).toEqual([PUBLIC_IP]); // solo la IP validada; la segunda resolución nunca ocurre
    expect(n).toBe(1);
  });

  it("en una redirección vuelve a resolver y valida el nuevo nombre", async () => {
    let n = 0;
    const flaky: Resolver = async (h) => (h === "sitio.pe" ? [{ address: PUBLIC_IP, family: 4 }] : (++n, [{ address: "192.168.1.10", family: 4 }]));
    const f = createSafeFetcher({ userAgent: UA, resolver: flaky, testRoute: () => ({ host: "127.0.0.1", port }) });
    const r = await f(url("/to-private-host"));
    expect(r.outcome).toBe("blocked");
    expect(n).toBe(1);
  });
});

describe("límites de tamaño, tiempo y tipo", () => {
  it("corta una respuesta enorme en el tope y lo informa", async () => {
    const r = await fetcher()(url("/big"), { maxBytes: 100_000 });
    expect(r.outcome).toBe("ok");
    expect(r.truncated).toBe(true);
    expect(r.bytes).toBeLessThanOrEqual(100_000);
  });

  it("rechaza una respuesta que declara un tamaño exorbitante", async () => {
    const r = await fetcher()(url("/huge-declared"), { maxBytes: 100_000 });
    expect(r.outcome).toBe("too_large");
  });

  it("una bomba gzip se corta en el tope de bytes descomprimidos", async () => {
    const before = process.memoryUsage().rss;
    const r = await fetcher()(url("/gzip-bomb"), { maxBytes: 200_000 });
    expect(r.truncated).toBe(true);
    expect(r.bytes).toBeLessThanOrEqual(200_000);
    expect(process.memoryUsage().rss - before).toBeLessThan(150 * 1024 * 1024);
  });

  it("rechaza tipos de contenido no permitidos", async () => {
    expect((await fetcher()(url("/pdf"))).outcome).toBe("bad_content_type");
    expect((await fetcher()(url("/image"))).outcome).toBe("bad_content_type");
  });

  it("rechaza codificaciones que no anunció", async () => {
    const r = await fetcher()(url("/brotli"));
    expect(r.outcome).toBe("network_error");
    expect(r.reason).toMatch(/codificación/);
  });

  it("corta a un servidor que gotea datos (slow-loris) con el plazo total", async () => {
    const t0 = Date.now();
    const r = await fetcher()(url("/slow"), { timeoutMs: 600 });
    expect(r.outcome).toBe("timeout");
    expect(Date.now() - t0).toBeLessThan(2500);
  });

  it("corta a un servidor que nunca responde", async () => {
    const r = await fetcher()(url("/silent"), { timeoutMs: 400 });
    expect(r.outcome).toBe("timeout");
  });

  it("una conexión rechazada es un error de red, no un hallazgo", async () => {
    const f = createSafeFetcher({ userAgent: UA, resolver: publicResolver, testRoute: () => ({ host: "127.0.0.1", port: 1 }) });
    expect((await f(url("/ok"))).outcome).toBe("network_error");
  });
});

describe("TLS", () => {
  it("un certificado inválido produce un error de TLS (no se ignora)", async () => {
    const r = await fetcher()("https://sitio.pe/");
    expect(r.outcome).toBe("tls_error");
    expect(r.reason).toMatch(/certificado/);
  });
});

describe("espaciado por dominio", () => {
  it("separa las peticiones al mismo dominio y no retrasa a otros", async () => {
    let t = 0;
    const sleeps: number[] = [];
    const th = new DomainThrottle(1000, () => t, async (ms) => { sleeps.push(ms); t += ms; });
    await th.wait("a.pe");
    await th.wait("a.pe");
    await th.wait("a.pe");
    await th.wait("b.pe");
    expect(sleeps).toEqual([1000, 1000]);
  });
});
