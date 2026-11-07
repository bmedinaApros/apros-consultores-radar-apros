import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { analyzeCompany, type AnalyzerDeps } from "@/lib/analyzer/run";
import { COMMON_SIGNALS } from "@/lib/analyzer/observations";
import { disabledPageSpeed, type PageSpeedProvider } from "@/lib/analyzer/pagespeed";
import { DomainThrottle, type Fetcher } from "@/lib/analyzer/safe-fetch";
import { observationsForRun, signalChanges, type ObservationRow } from "@/lib/analyzer/service";
import { addActiveClient, addDoNotContact, createCompany } from "@/lib/companies/service";
import { ANALYZER_VERSION } from "@/lib/analyzer/extract";
import { mkActor, resetData } from "./helpers";
import * as F from "./fixtures/sites";

beforeEach(resetData);
afterAll(() => pool().end());

type Site = Record<string, ReturnType<typeof F.ok> | ReturnType<typeof F.httpError> | ReturnType<typeof F.failure>>;
const DOMAIN = "rica.example.com";
const base = (path: string) => `https://${DOMAIN}${path}`;

function mkDeps(site: Site, extra: Partial<AnalyzerDeps> = {}): { deps: AnalyzerDeps; calls: string[] } {
  const calls: string[] = [];
  const fetcher: Fetcher = async (url, o) => {
    calls.push(`${o?.method ?? "GET"} ${url}`);
    const hit = site[url] ?? site[url.replace("https://", "http://")];
    return hit ?? F.httpError(url, 404, "no existe");
  };
  return {
    calls,
    deps: { fetcher, throttle: new DomainThrottle(0), pageSpeed: disabledPageSpeed, userAgent: "RadarAPROS/1.0 (+https://apros.pe)", maxPages: 8, cacheDays: 7, linkCheckBudget: 6, ...extra },
  };
}

const richSite = (): Site => ({
  [base("/robots.txt")]: F.ok(base("/robots.txt"), F.ROBOTS_AI_BLOCK, { headers: { "content-type": "text/plain" } }),
  [base("/")]: F.ok(base("/"), F.RICH_HOME, { tls: { validTo: "2026-12-01T00:00:00.000Z", issuer: "Let's Encrypt", protocol: "TLSv1.3", authorized: true } }),
  [base("/contacto")]: F.ok(base("/contacto"), "<html><title>Contacto</title><body><h1>Contacto</h1></body></html>"),
  [base("/proyectos")]: F.ok(base("/proyectos"), "<html><title>Proyectos</title><body><h1>Proyectos</h1></body></html>"),
  [base("/nosotros")]: F.ok(base("/nosotros"), "<html><title>Nosotros</title><body><h1>Nosotros</h1></body></html>"),
  [base("/cotiza")]: F.ok(base("/cotiza"), "<html><title>Cotiza</title><body><h1>Cotiza</h1></body></html>"),
  [base("/rota")]: F.httpError(base("/rota"), 404),
  [base("/sitemap.xml")]: F.ok(base("/sitemap.xml"), F.SITEMAP_XML, { headers: { "content-type": "application/xml" } }),
});

async function mkCompany(domain: string | null = DOMAIN, industry = "Inmobiliario") {
  const admin = await mkActor("admin");
  const { id } = await createCompany(admin, { legal_name: "Empresa Demo SAC", website: domain ?? "", industry });
  return { id, admin };
}

const byCode = (rows: ObservationRow[]) => Object.fromEntries(rows.map((r) => [r.signal_code, r]));

describe("análisis de un sitio completo", () => {
  it("guarda una observación por cada señal común más las del rubro, con evidencia", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps(richSite());
    const r = await analyzeCompany(id, { deps });
    expect(r.status).toBe("completed");
    const rows = await observationsForRun(r.runId);
    const codes = rows.map((x) => x.signal_code);
    for (const s of COMMON_SIGNALS) expect(codes).toContain(s.code);
    expect(codes).toContain("industry.cotizacion");
    expect(rows.every((x) => x.analyzer_version === ANALYZER_VERSION)).toBe(true);
    // Lo observado trae su URL de evidencia
    const o = byCode(rows);
    expect(o["seo.title"]).toMatchObject({ status: "observed", kind: "observed", evidence_url: base("/") });
    expect(o["seo.title"]!.evidence_excerpt).toContain("Inmobiliaria Demo");
  });

  it("detecta medición, conversión, tecnología y estructura en la portada", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps(richSite());
    const o = byCode(await observationsForRun((await analyzeCompany(id, { deps })).runId));
    expect(o["meas.ga4"]).toMatchObject({ status: "observed", value: { detected: true, id: "G-ABC123XYZ9" } });
    expect(o["meas.gtm"]!.value).toMatchObject({ id: "GTM-ABCD123" });
    expect(o["meas.meta_pixel"]!.status).toBe("observed");
    expect(o["meas.google_ads"]!.status).toBe("observed");
    expect(o["meas.clarity"]!.status).toBe("observed");
    expect(o["conv.form"]!.status).toBe("observed");
    expect(o["conv.whatsapp"]!.status).toBe("observed");
    expect(o["conv.phone"]!.status).toBe("observed");
    expect(o["conv.cta"]!.kind).toBe("inferred");
    expect(o["conv.booking_or_quote"]!.status).toBe("observed");
    expect(o["conv.mobile_viewport"]!.status).toBe("observed");
    expect(o["tech.cms"]!.value).toMatchObject({ name: "WordPress", via: "generator" });
    expect(o["tech.vendor_credit"]!.value).toMatchObject({ href: "https://agenciax.example.net/" });
    expect(o["tech.last_content"]!.value).toMatchObject({ source: "sitemap lastmod", copyrightYear: 2024 });
    expect(o["tech.tls"]!.value).toMatchObject({ valid: true, issuer: "Let's Encrypt" });
    expect(o["sd.jsonld"]!.value).toMatchObject({ valid: 1, invalid: 1, types: ["RealEstateAgent", "PostalAddress"] });
    expect(o["geo.entity_info"]).toMatchObject({ kind: "inferred", value: { organizationSchema: true, address: true, phone: true } });
    expect(o["seo.sitemap"]!.value).toMatchObject({ present: true, urls: 2 });
    expect(o["seo.canonical"]!.status).toBe("observed");
  });

  it("informa las reglas de robots.txt para rastreadores de IA", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps(richSite());
    const o = byCode(await observationsForRun((await analyzeCompany(id, { deps })).runId));
    const v = o["geo.ai_crawlers"]!.value as { rules: Record<string, string>; blocked: string[] };
    expect(v.rules.GPTBot).toBe("blocked");
    expect(v.rules.ClaudeBot).toBe("unspecified_allowed");
    expect(v.blocked).toEqual(["GPTBot"]);
  });

  it("las señales del rubro salen del catálogo editable, no del código", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps(richSite());
    const o = byCode(await observationsForRun((await analyzeCompany(id, { deps })).runId));
    expect(o["industry.cotizacion"]).toMatchObject({ status: "observed", kind: "inferred" });
    expect(o["industry.proyectos"]!.status).toBe("observed");
    expect(o["industry.citas"]).toBeUndefined(); // señal de otro rubro: no aplica y no resta
  });

  it("detecta enlaces rotos de la muestra", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps(richSite());
    const o = byCode(await observationsForRun((await analyzeCompany(id, { deps })).runId));
    expect(o["seo.broken_links"]!.value).toMatchObject({ broken: 1, examples: [{ url: base("/rota"), status: 404 }] });
  });

  it("marca la empresa como analizada y la deja en la bitácora de descargas", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps(richSite());
    const r = await analyzeCompany(id, { deps });
    expect((await pool().query("SELECT stage FROM companies WHERE id = $1", [id])).rows[0].stage).toBe("analyzed");
    const log = await pool().query("SELECT outcome, url FROM fetch_log WHERE run_id = $1", [r.runId]);
    expect(log.rows.length).toBeGreaterThan(3);
    expect(log.rows.some((x) => x.url.endsWith("/robots.txt"))).toBe(true);
  });
});

describe("veracidad: lo que no se puede verificar no es un hallazgo negativo", () => {
  const allUnverifiable = (rows: ObservationRow[]) => {
    const page = rows.filter((r) => !["seo.robots_txt", "seo.sitemap", "geo.ai_crawlers", "perf.pagespeed", "tech.tls"].includes(r.signal_code));
    return page.every((r) => r.status === "unverifiable");
  };

  it("un desafío antibots deja todo como «no se pudo verificar»", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps({
      [base("/robots.txt")]: F.ok(base("/robots.txt"), "User-agent: *\nAllow: /", { headers: { "content-type": "text/plain" } }),
      [base("/")]: F.httpError(base("/"), 403, F.CHALLENGE_HTML, { "cf-mitigated": "challenge" }),
    });
    const rows = await observationsForRun((await analyzeCompany(id, { deps })).runId);
    expect(allUnverifiable(rows)).toBe(true);
    expect(rows.find((r) => r.signal_code === "seo.title")!.value).toMatchObject({ reason: expect.stringMatching(/antibots/) });
    expect(rows.some((r) => r.status === "not_detected" && r.signal_code.startsWith("meas."))).toBe(false);
  });

  it("un 200 con página de reto también se trata como bloqueo", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps({ [base("/robots.txt")]: F.httpError(base("/robots.txt"), 404), [base("/")]: F.ok(base("/"), F.CHALLENGE_HTML) });
    const rows = await observationsForRun((await analyzeCompany(id, { deps })).runId);
    expect(allUnverifiable(rows)).toBe(true);
  });

  it.each([
    ["error 500", () => F.httpError(base("/"), 500, "Error interno")],
    ["tiempo agotado", () => F.failure(base("/"), "timeout", "tiempo de espera agotado")],
    ["destino bloqueado por SSRF", () => F.failure(base("/"), "blocked", "el dominio resuelve a una dirección no pública")],
    ["error de red", () => F.failure(base("/"), "network_error", "error de red (ECONNREFUSED)")],
  ])("un fallo de lectura (%s) es «no se pudo verificar»", async (_n, mk) => {
    const { id } = await mkCompany();
    const { deps } = mkDeps({ [base("/robots.txt")]: F.httpError(base("/robots.txt"), 404), [base("/")]: mk() });
    const r = await analyzeCompany(id, { deps });
    expect(r.status).toBe("completed");
    const rows = await observationsForRun(r.runId);
    expect(allUnverifiable(rows)).toBe(true);
    expect((await pool().query("SELECT stage FROM companies WHERE id = $1", [id])).rows[0].stage).toBe("detected"); // sin lectura no avanza
  });

  it("un certificado TLS inválido se informa como observado (con el código de error), no como ausencia", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps({
      [base("/robots.txt")]: F.failure(base("/robots.txt"), "tls_error", "error de certificado TLS (CERT_HAS_EXPIRED)"),
      [base("/")]: F.failure(base("/"), "tls_error", "error de certificado TLS (CERT_HAS_EXPIRED)"),
    });
    const o = byCode(await observationsForRun((await analyzeCompany(id, { deps })).runId));
    expect(o["tech.tls"]).toMatchObject({ status: "observed", value: { valid: false } });
    expect(o["seo.title"]!.status).toBe("unverifiable");
  });

  it("si hay Google Tag Manager, la ausencia de otras etiquetas es «no verificable» (pueden estar dentro del contenedor)", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps({
      [base("/robots.txt")]: F.httpError(base("/robots.txt"), 404),
      [base("/")]: F.ok(base("/"), F.GTM_ONLY_HOME),
    });
    const o = byCode(await observationsForRun((await analyzeCompany(id, { deps })).runId));
    expect(o["meas.gtm"]!.status).toBe("observed");
    for (const c of ["meas.ga4", "meas.meta_pixel", "meas.google_ads", "meas.clarity"]) expect(o[c]!.status).toBe("unverifiable");
  });

  it("sin GTM, una etiqueta ausente se registra como «no detectada» con confianza baja y la salvedad", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps({ [base("/robots.txt")]: F.httpError(base("/robots.txt"), 404), [base("/")]: F.ok(base("/"), F.POOR_HOME) });
    const o = byCode(await observationsForRun((await analyzeCompany(id, { deps })).runId));
    expect(o["meas.ga4"]).toMatchObject({ status: "not_detected", confidence: "low" });
    expect(JSON.stringify(o["meas.ga4"]!.value)).toMatch(/JavaScript/);
    expect(o["seo.title"]!.status).toBe("not_detected");
    expect(o["conv.mobile_viewport"]!.status).toBe("not_detected");
  });

  it("noindex se reporta como observado", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps({ [base("/robots.txt")]: F.httpError(base("/robots.txt"), 404), [base("/")]: F.ok(base("/"), F.NOINDEX_HOME) });
    const o = byCode(await observationsForRun((await analyzeCompany(id, { deps })).runId));
    expect(o["seo.indexable"]!.value).toMatchObject({ indexable: false, via: "meta robots" });
  });

  it("los enlaces que dan 403 o 429 en la muestra no cuentan como rotos", async () => {
    const { id } = await mkCompany();
    const s = richSite();
    s[base("/rota")] = F.httpError(base("/rota"), 403, "Forbidden");
    const { deps } = mkDeps(s);
    const o = byCode(await observationsForRun((await analyzeCompany(id, { deps })).runId));
    // Todas las respuestas fueron bloqueos: no hay base para decir que haya enlaces rotos
    expect(o["seo.broken_links"]).toMatchObject({ status: "unverifiable" });
    expect(JSON.stringify(o["seo.broken_links"]!.value)).not.toMatch(/"broken"/);
  });

  it("PageSpeed sin clave es «no se pudo verificar»; con un proveedor simulado guarda el resultado", async () => {
    const { id } = await mkCompany();
    const a = byCode(await observationsForRun((await analyzeCompany(id, { deps: mkDeps(richSite()).deps })).runId));
    expect(a["perf.pagespeed"]!.status).toBe("unverifiable");
    const sim: PageSpeedProvider = { run: async (u) => ({ result: { strategy: "mobile", performanceScore: 61, lcpMs: 3400, cls: 0.12, fetchedUrl: u } }) };
    const r = await analyzeCompany(id, { force: true, deps: mkDeps(richSite(), { pageSpeed: sim }).deps });
    const b = byCode(await observationsForRun(r.runId));
    expect(b["perf.pagespeed"]).toMatchObject({ status: "observed", value: { performanceScore: 61, lcpMs: 3400 } });
    expect((await pool().query("SELECT pagespeed FROM analysis_runs WHERE id = $1", [r.runId])).rows[0].pagespeed).toMatchObject({ performanceScore: 61 });
  });
});

describe("robots.txt y presupuesto", () => {
  it("respeta Disallow: no descarga la portada y todo queda «no verificable»", async () => {
    const { id } = await mkCompany();
    const { deps, calls } = mkDeps({ ...richSite(), [base("/robots.txt")]: F.ok(base("/robots.txt"), "User-agent: *\nDisallow: /", { headers: { "content-type": "text/plain" } }) });
    const r = await analyzeCompany(id, { deps });
    expect(calls.filter((c) => !c.includes("robots.txt"))).toEqual([]);
    const rows = await observationsForRun(r.runId);
    expect(rows.find((x) => x.signal_code === "seo.title")).toMatchObject({ status: "unverifiable" });
  });

  it("respeta un Disallow dirigido a nuestro rastreador y solo para esa ruta", async () => {
    const { id } = await mkCompany();
    const { deps, calls } = mkDeps({ ...richSite(), [base("/robots.txt")]: F.ok(base("/robots.txt"), "User-agent: RadarAPROS\nDisallow: /proyectos\n", { headers: { "content-type": "text/plain" } }) });
    await analyzeCompany(id, { deps });
    expect(calls.some((c) => c.endsWith("/proyectos"))).toBe(false);
    expect(calls.some((c) => c === `GET ${base("/")}`)).toBe(true);
  });

  it("si robots.txt da error 5xx no se rastrea (RFC 9309)", async () => {
    const { id } = await mkCompany();
    const { deps, calls } = mkDeps({ ...richSite(), [base("/robots.txt")]: F.httpError(base("/robots.txt"), 503, "") });
    const rows = await observationsForRun((await analyzeCompany(id, { deps })).runId);
    expect(calls.filter((c) => !c.includes("robots.txt"))).toEqual([]);
    expect(rows.find((x) => x.signal_code === "seo.robots_txt")!.status).toBe("unverifiable");
  });

  it("si robots.txt no existe (404) se rastrea con normalidad", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps({ ...richSite(), [base("/robots.txt")]: F.httpError(base("/robots.txt"), 404) });
    const o = byCode(await observationsForRun((await analyzeCompany(id, { deps })).runId));
    expect(o["seo.robots_txt"]).toMatchObject({ status: "not_detected" });
    expect(o["seo.title"]!.status).toBe("observed");
  });

  it("no excede el presupuesto de páginas", async () => {
    const { id } = await mkCompany();
    const { deps, calls } = mkDeps(richSite(), { maxPages: 3 });
    const r = await analyzeCompany(id, { deps });
    const pages = calls.filter((c) => c.startsWith("GET") && !/robots|sitemap/.test(c));
    expect(pages.length).toBeLessThanOrEqual(3);
    expect((await pool().query("SELECT pages_fetched FROM analysis_runs WHERE id = $1", [r.runId])).rows[0].pages_fetched).toBeLessThanOrEqual(3);
  });

  it("no sigue enlaces a otros dominios", async () => {
    const { id } = await mkCompany();
    const { deps, calls } = mkDeps(richSite());
    await analyzeCompany(id, { deps });
    expect(calls.some((c) => c.includes("externo.example.org"))).toBe(false);
  });
});

describe("contenido hostil", () => {
  it("las instrucciones dentro de la página no afectan las señales ni se guardan sin acotar", async () => {
    const { id } = await mkCompany();
    const { deps, calls } = mkDeps({ [base("/robots.txt")]: F.httpError(base("/robots.txt"), 404), [base("/")]: F.ok(base("/"), F.HOSTILE_HOME) });
    const r = await analyzeCompany(id, { deps });
    expect(r.status).toBe("completed");
    const rows = await observationsForRun(r.runId);
    // Nunca se visitan los enlaces internos, de loopback, de archivo ni de JavaScript que trae la página
    expect(calls.some((c) => /169\.254|127\.0\.0\.1|file:|javascript:/.test(c))).toBe(false);
    for (const row of rows) {
      expect(row.evidence_excerpt === null || row.evidence_excerpt.length <= 300).toBe(true);
      // sin caracteres de control ni marcas de dirección bidireccional
      expect(row.evidence_excerpt ?? "").not.toMatch(/[\u0000-\u001f‪-‮]/);
    }
    const title = rows.find((x) => x.signal_code === "seo.title")!;
    expect(title.status).toBe("observed"); // se informa como dato, sin obedecerlo
    expect(rows.every((x) => ["observed", "not_detected", "unverifiable"].includes(x.status))).toBe(true);
    expect(rows.find((x) => x.signal_code === "meas.ga4")!.status).toBe("not_detected");
  });

  it("la base impide guardar una evidencia de más de 400 caracteres", async () => {
    const { id } = await mkCompany();
    const run = await analyzeCompany(id, { deps: mkDeps(richSite()).deps });
    await expect(pool().query(
      `INSERT INTO signal_observations (company_id, analysis_run_id, signal_code, status, kind, confidence, evidence_excerpt, analyzer_version)
       VALUES ($1,$2,'x','observed','observed','high',$3,'t')`, [id, run.runId, "a".repeat(401)])).rejects.toThrow();
  });
});

describe("omisiones, caché e historial", () => {
  it("omite empresas sin sitio, en no contactar o clientes activos, sin tocar la red", async () => {
    const admin = await mkActor("admin");
    const noSite = (await createCompany(admin, { legal_name: "Sin Sitio SAC" })).id;
    const dncC = (await createCompany(admin, { legal_name: "Bloqueada SAC", website: "bloqueada.pe" })).id;
    const cliC = (await createCompany(admin, { legal_name: "Cliente SAC", website: "cliente.pe" })).id;
    await addDoNotContact(admin, "domain", "bloqueada.pe", "x");
    await addActiveClient(admin, { name: "Cliente SAC" });
    const { deps, calls } = mkDeps({});
    for (const [cid, why] of [[noSite, /sitio web/], [dncC, /no contactar/], [cliC, /cliente activo/]] as const) {
      const r = await analyzeCompany(cid, { deps });
      expect(r.status).toBe("skipped");
      expect(r.skipReason).toMatch(why);
    }
    expect(calls).toEqual([]);
  });

  it("reutiliza el análisis reciente (caché) y vuelve a ejecutar con force", async () => {
    const { id } = await mkCompany();
    const { deps, calls } = mkDeps(richSite());
    const a = await analyzeCompany(id, { deps });
    const n = calls.length;
    const b = await analyzeCompany(id, { deps });
    expect(b).toMatchObject({ cached: true, runId: a.runId });
    expect(calls.length).toBe(n);
    const c = await analyzeCompany(id, { deps, force: true });
    expect(c.cached).toBe(false);
    expect(c.runId).not.toBe(a.runId);
  });

  it("conserva el historial y detecta cambios entre corridas, ignorando lo no verificable", async () => {
    const { id } = await mkCompany();
    const withPixel = `<html><head><title>Hola</title><script>fbq('init','1234567890123');</script></head><body><h1>Hola</h1><a href="tel:+5115555555">Llamar</a></body></html>`;
    const without = `<html><head><title>Hola</title></head><body><h1>Hola</h1></body></html>`;
    const site = (home: string): Site => ({ [base("/robots.txt")]: F.httpError(base("/robots.txt"), 404), [base("/")]: F.ok(base("/"), home, { tls: { validTo: "2026-12-01T00:00:00.000Z", issuer: "X", protocol: "TLSv1.3", authorized: true } }) });
    await analyzeCompany(id, { deps: mkDeps(site(withPixel)).deps });
    expect(await signalChanges(id)).toEqual([]); // una sola corrida
    await analyzeCompany(id, { force: true, deps: mkDeps(site(without)).deps });
    const total = (await pool().query("SELECT count(DISTINCT analysis_run_id)::int AS n FROM signal_observations WHERE company_id = $1", [id])).rows[0].n;
    expect(total).toBe(2);
    const codes = (await signalChanges(id)).map((c) => c.signal_code);
    expect(codes).toContain("meas.meta_pixel");
    expect(codes).toContain("conv.phone");
    expect(codes).not.toContain("meas.ga4"); // sin cambio
    expect(codes).not.toContain("tech.tls");
  });

  it("una señal que pasa a «no verificable» no se reporta como cambio", async () => {
    const { id } = await mkCompany();
    await analyzeCompany(id, { deps: mkDeps(richSite()).deps });
    const blocked: Site = { [base("/robots.txt")]: F.httpError(base("/robots.txt"), 404), [base("/")]: F.httpError(base("/"), 403, F.CHALLENGE_HTML) };
    await analyzeCompany(id, { force: true, deps: mkDeps(blocked).deps });
    const codes = (await signalChanges(id)).map((c) => c.signal_code);
    expect(codes.filter((c) => c.startsWith("meas.") || c.startsWith("conv.") || c.startsWith("seo.title"))).toEqual([]);
  });

  it("las observaciones no se pueden modificar", async () => {
    const { id } = await mkCompany();
    await analyzeCompany(id, { deps: mkDeps(richSite()).deps });
    await expect(pool().query("UPDATE signal_observations SET status = 'observed'")).rejects.toThrow();
  });

  it("un error inesperado deja la corrida como fallida y no a medias", async () => {
    const { id } = await mkCompany();
    const { deps } = mkDeps({}, { fetcher: async () => { throw new Error("explotó"); } });
    const r = await analyzeCompany(id, { deps });
    expect(r.status).toBe("failed");
    const run = (await pool().query("SELECT status, error FROM analysis_runs WHERE id = $1", [r.runId])).rows[0];
    expect(run).toMatchObject({ status: "failed", error: "explotó" });
  });
});
