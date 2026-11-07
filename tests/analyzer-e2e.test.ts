import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import https from "node:https";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { pool } from "@/lib/db";
import { analyzeCompany, type AnalyzerDeps } from "@/lib/analyzer/run";
import { createSafeFetcher, DomainThrottle } from "@/lib/analyzer/safe-fetch";
import { disabledPageSpeed } from "@/lib/analyzer/pagespeed";
import { observationsForRun } from "@/lib/analyzer/service";
import { createCompany } from "@/lib/companies/service";
import { mkActor, resetData } from "./helpers";
import * as F from "./fixtures/sites";

/**
 * Prueba de punta a punta con el descargador REAL (TLS verificado, validación de IP, límites) contra un servidor
 * HTTPS local con certificado propio. El nombre público se traduce a ese servidor solo en la prueba.
 */
const PUBLIC_IP = "93.184.216.34";
let server: https.Server;
let port = 0;
let cert = "";
const requests: string[] = [];

beforeAll(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "radar-e2e-"));
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", path.join(dir, "k.pem"), "-out", path.join(dir, "c.pem"), "-days", "30",
    "-subj", "/CN=rica.example.com/O=APROS Test", "-addext", "subjectAltName=DNS:rica.example.com"], { stdio: "ignore" });
  cert = fs.readFileSync(path.join(dir, "c.pem"), "utf8");
  server = https.createServer({ key: fs.readFileSync(path.join(dir, "k.pem")), cert }, (req, res) => {
    requests.push(`${req.method} ${req.url} UA=${req.headers["user-agent"]}`);
    const send = (status: number, type: string, body: string) => { res.statusCode = status; res.setHeader("content-type", type); res.end(body); };
    switch (req.url) {
      case "/robots.txt": return send(200, "text/plain", F.ROBOTS_AI_BLOCK.replace(/https:\/\/rica\.example\.com/g, "https://rica.example.com"));
      case "/": return send(200, "text/html; charset=utf-8", F.RICH_HOME);
      case "/sitemap.xml": return send(200, "application/xml", F.SITEMAP_XML);
      case "/rota": return send(404, "text/html", "no");
      default: return send(200, "text/html", "<html><title>Interna</title><body><h1>x</h1></body></html>");
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  port = (server.address() as AddressInfo).port;
});
afterAll(async () => { server.closeAllConnections?.(); server.close(); await pool().end(); });
beforeEach(async () => { await resetData(); requests.length = 0; });

describe("analizador de punta a punta con el descargador real", () => {
  it("lee robots, portada y páginas por HTTPS, extrae el certificado y guarda señales con evidencia", async () => {
    const admin = await mkActor("admin");
    const { id } = await createCompany(admin, { legal_name: "Rica SAC", website: "rica.example.com", industry: "Inmobiliario" });
    const deps: AnalyzerDeps = {
      fetcher: createSafeFetcher({
        userAgent: "RadarAPROS/1.0 (+https://apros.pe)", testCa: cert,
        resolver: async () => [{ address: PUBLIC_IP, family: 4 }],
        testRoute: (p) => (p.address === PUBLIC_IP ? { host: "127.0.0.1", port } : null),
      }),
      throttle: new DomainThrottle(0), pageSpeed: disabledPageSpeed, userAgent: "RadarAPROS/1.0 (+https://apros.pe)", maxPages: 6, cacheDays: 0, linkCheckBudget: 4,
    };
    const r = await analyzeCompany(id, { deps });
    expect(r.status).toBe("completed");
    const rows = Object.fromEntries((await observationsForRun(r.runId)).map((o) => [o.signal_code, o]));
    expect(rows["seo.title"]).toMatchObject({ status: "observed", evidence_url: "https://rica.example.com/" });
    expect(rows["tech.tls"]).toMatchObject({ status: "observed", value: { valid: true, issuer: "APROS Test", protocol: expect.stringMatching(/^TLSv1\.[23]$/) } });
    expect(rows["meas.ga4"]!.status).toBe("observed");
    expect(rows["geo.ai_crawlers"]!.value).toMatchObject({ blocked: ["GPTBot"] });
    expect(rows["seo.sitemap"]!.status).toBe("observed");
    // Se identificó con el User-Agent propio y respetó el presupuesto
    expect(requests.every((q) => q.includes("UA=RadarAPROS/1.0"))).toBe(true);
    expect(requests.filter((q) => !/robots|sitemap/.test(q) && q.startsWith("GET")).length).toBeLessThanOrEqual(6);
    expect((await pool().query("SELECT count(*)::int AS n FROM fetch_log WHERE run_id = $1", [r.runId])).rows[0].n).toBeGreaterThan(3);
  });

  it("si el certificado no es de confianza, el sitio queda «no se pudo verificar» y el TLS se informa como inválido", async () => {
    const admin = await mkActor("admin");
    const { id } = await createCompany(admin, { legal_name: "Rica SAC", website: "rica.example.com" });
    const deps: AnalyzerDeps = {
      fetcher: createSafeFetcher({ // sin testCa: el certificado autofirmado no es confiable
        userAgent: "RadarAPROS/1.0", resolver: async () => [{ address: PUBLIC_IP, family: 4 }],
        testRoute: (p) => (p.address === PUBLIC_IP ? { host: "127.0.0.1", port } : null),
      }),
      throttle: new DomainThrottle(0), pageSpeed: disabledPageSpeed, userAgent: "RadarAPROS/1.0", maxPages: 4, cacheDays: 0, linkCheckBudget: 2,
    };
    const r = await analyzeCompany(id, { deps });
    const rows = Object.fromEntries((await observationsForRun(r.runId)).map((o) => [o.signal_code, o]));
    expect(rows["tech.tls"]).toMatchObject({ status: "observed", value: { valid: false } });
    expect(rows["seo.title"]!.status).toBe("unverifiable");
    expect(rows["meas.ga4"]!.status).toBe("unverifiable");
  });

  it("si el dominio resuelve a una IP interna, no se conecta y todo queda «no se pudo verificar»", async () => {
    const admin = await mkActor("admin");
    const { id } = await createCompany(admin, { legal_name: "Trampa SAC", website: "trampa.example.com" });
    const before = requests.length;
    const deps: AnalyzerDeps = {
      fetcher: createSafeFetcher({ userAgent: "RadarAPROS/1.0", resolver: async () => [{ address: "10.0.0.5", family: 4 }], testRoute: () => ({ host: "127.0.0.1", port }) }),
      throttle: new DomainThrottle(0), pageSpeed: disabledPageSpeed, userAgent: "RadarAPROS/1.0", maxPages: 4, cacheDays: 0, linkCheckBudget: 2,
    };
    const r = await analyzeCompany(id, { deps });
    expect(requests.length).toBe(before); // jamás llegó al servidor
    const rows = await observationsForRun(r.runId);
    expect(rows.find((o) => o.signal_code === "seo.title")!.status).toBe("unverifiable");
    const logs = (await pool().query("SELECT outcome, reason FROM fetch_log WHERE run_id = $1", [r.runId])).rows;
    expect(logs.every((l) => l.outcome === "blocked")).toBe(true);
    expect(logs[0].reason).toMatch(/no pública/);
  });
});
