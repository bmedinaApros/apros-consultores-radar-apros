import { audit } from "../audit";
import { pool } from "../db";
import { env } from "../env";
import { findActiveClient, findDoNotContact } from "../companies/exclusions";
import { ANALYZER_VERSION, extractPage, looksLikeChallenge, type PageFacts } from "./extract";
import { buildObservations, type IndustrySignalDef, type Observation, type SiteInput } from "./observations";
import { disabledPageSpeed, type PageSpeedProvider } from "./pagespeed";
import { buildRobotsPolicy, productToken, type RobotsPolicy, type RobotsState } from "./robots";
import { DomainThrottle, createSafeFetcher, type Fetcher, type FetchResult } from "./safe-fetch";

export interface AnalyzerDeps {
  fetcher: Fetcher;
  throttle: DomainThrottle;
  pageSpeed: PageSpeedProvider;
  userAgent: string;
  maxPages: number;
  cacheDays: number;
  linkCheckBudget: number;
}

export function defaultDeps(): AnalyzerDeps {
  const e = env();
  const ports = e.CRAWLER_ALLOWED_PORTS.split(",").map(Number).filter((n) => n > 0);
  return {
    fetcher: createSafeFetcher({ userAgent: e.CRAWLER_USER_AGENT, allowedPorts: ports }),
    throttle: new DomainThrottle(1000),
    pageSpeed: disabledPageSpeed,
    userAgent: e.CRAWLER_USER_AGENT,
    maxPages: e.CRAWLER_MAX_PAGES,
    cacheDays: e.ANALYSIS_CACHE_DAYS,
    linkCheckBudget: 6,
  };
}

export interface AnalysisOutcome {
  runId: string;
  status: "completed" | "failed" | "skipped";
  cached: boolean;
  skipReason?: string;
}

const PRIORITY = /(contact|servicio|nosotros|quienes|empresa|producto|proyecto|cotiz|reserv|agend|admision|matricula|citas|catalogo|tienda)/i;
const sameSite = (a: string, b: string) => new URL(a).hostname.replace(/^www\./, "") === new URL(b).hostname.replace(/^www\./, "");

async function logFetch(runId: string, r: FetchResult, url: string): Promise<void> {
  await pool().query(
    `INSERT INTO fetch_log (run_id, url, outcome, http_status, bytes, duration_ms, reason) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [runId, url.slice(0, 500), r.outcome, r.status ?? null, r.bytes, r.durationMs, r.reason?.slice(0, 200) ?? null],
  );
}

/**
 * Analiza el sitio público de una empresa y guarda observaciones con evidencia.
 * Reglas: solo páginas públicas, presupuesto de páginas por dominio, robots.txt respetado,
 * y un fallo de lectura jamás se convierte en un hallazgo negativo.
 */
export async function analyzeCompany(
  companyId: string,
  opts: { triggeredBy?: string | null; force?: boolean; deps?: AnalyzerDeps } = {},
): Promise<AnalysisOutcome> {
  const deps = opts.deps ?? defaultDeps();
  const c = await pool().query<{ id: string; legal_name: string; domain: string | null; ruc: string | null; industry_id: string | null; stage: string }>(
    `SELECT id, legal_name, domain, ruc, industry_id, stage FROM companies WHERE id = $1`, [companyId]);
  const company = c.rows[0];
  if (!company) throw new Error("Empresa no encontrada");

  const skip = async (reason: string): Promise<AnalysisOutcome> => {
    const r = await pool().query<{ id: string }>(
      `INSERT INTO analysis_runs (company_id, status, analyzer_version, domain, triggered_by, pages_budget, skip_reason, finished_at)
       VALUES ($1,'skipped',$2,$3,$4,0,$5,now()) RETURNING id`,
      [companyId, ANALYZER_VERSION, company.domain ?? "", opts.triggeredBy ?? null, reason]);
    return { runId: r.rows[0]!.id, status: "skipped", cached: false, skipReason: reason };
  };

  if (!company.domain) return skip("La empresa no tiene sitio web conocido");
  if (await findDoNotContact({ name: company.legal_name, domain: company.domain, ruc: company.ruc })) return skip("La empresa está en la lista de no contactar");
  if (await findActiveClient({ name: company.legal_name, domain: company.domain, ruc: company.ruc })) return skip("La empresa es cliente activo");

  // Caché por empresa, versión del analizador y vigencia.
  if (!opts.force && deps.cacheDays > 0) {
    const cached = await pool().query<{ id: string }>(
      `SELECT id FROM analysis_runs WHERE company_id = $1 AND status = 'completed' AND analyzer_version = $2
          AND finished_at > now() - ($3::int * interval '1 day') ORDER BY finished_at DESC LIMIT 1`,
      [companyId, ANALYZER_VERSION, deps.cacheDays]);
    if (cached.rows[0]) return { runId: cached.rows[0].id, status: "completed", cached: true };
  }

  const run = await pool().query<{ id: string }>(
    `INSERT INTO analysis_runs (company_id, status, analyzer_version, domain, triggered_by, pages_budget) VALUES ($1,'running',$2,$3,$4,$5) RETURNING id`,
    [companyId, ANALYZER_VERSION, company.domain, opts.triggeredBy ?? null, deps.maxPages]);
  const runId = run.rows[0]!.id;

  try {
    const industrySignals: IndustrySignalDef[] = company.industry_id
      ? (await pool().query<IndustrySignalDef>(
          `SELECT slug, name, keywords, scope FROM industry_signals WHERE industry_id = $1 AND active ORDER BY slug`, [company.industry_id])).rows
      : [];

    const domain = company.domain;
    const input: SiteInput = {
      domain, homepage: null, pages: [], homepageFailure: null, robots: null, robotsOutcome: null, sitemap: null, tls: null,
      brokenLinks: { checked: 0, broken: [], unverifiable: 0 }, pagespeed: { result: null, reason: "No se intentó" }, industrySignals,
    };
    let fetched = 0;
    const get = async (url: string, o: Parameters<Fetcher>[1] = {}): Promise<FetchResult> => {
      await deps.throttle.wait(new URL(url).hostname.replace(/^www\./, ""));
      const r = await deps.fetcher(url, o);
      await logFetch(runId, r, url);
      return r;
    };

    // 1) robots.txt (RFC 9309): 4xx = sin restricciones; 5xx o error = no se rastrea.
    const origin = `https://${domain}`;
    const rr = await get(`${origin}/robots.txt`, { maxBytes: 512 * 1024, contentTypes: /^(text\/plain|text\/html|application\/octet-stream)/i, accept: "text/plain,*/*;q=0.1" });
    input.robotsOutcome = rr.outcome;
    // El certificado TLS se observa ya en la primera conexión, aunque luego no se pueda leer la portada.
    if (rr.outcome === "tls_error") input.tls = { info: null, error: rr.reason ?? "error de certificado", https: true };
    else if (rr.tls) input.tls = { info: rr.tls, error: null, https: true };
    let state: RobotsState;
    if (rr.outcome === "ok") state = { kind: "rules", text: rr.body };
    else if (rr.outcome === "http_error" && rr.status && rr.status >= 400 && rr.status < 500 && !looksLikeChallenge(rr.status, rr.headers, rr.body)) state = { kind: "none" };
    else state = { kind: "unreachable", reason: looksLikeChallenge(rr.status, rr.headers, rr.body) ? "El sitio presentó un desafío antibots" : `No se pudo leer robots.txt (${rr.reason ?? rr.outcome})` };
    const robots: RobotsPolicy = buildRobotsPolicy(origin, state, deps.userAgent);
    input.robots = robots;

    // 2) Portada (solo si robots.txt lo permite)
    const pages: PageFacts[] = [];
    const visit = async (url: string, isHome = false): Promise<PageFacts | null> => {
      if (fetched >= deps.maxPages) return null;
      if (!robots.allowed(url)) {
        if (isHome) input.homepageFailure = { outcome: "robots_disallowed", reason: "robots.txt no permite el rastreo de la portada", challenge: false };
        return null;
      }
      fetched++;
      const r = await get(url);
      if (r.outcome === "ok" && r.status && !looksLikeChallenge(r.status, r.headers, r.body)) {
        const facts = extractPage(r.body, r.url, r.status, r.headers as Record<string, string | string[] | undefined>);
        pages.push(facts);
        if (isHome) {
          input.homepage = facts;
          if (r.url.startsWith("https:")) { if (r.tls) input.tls = { info: r.tls, error: null, https: true }; }
          else input.tls = { info: null, error: null, https: false };
        }
        return facts;
      }
      if (isHome) {
        const challenge = looksLikeChallenge(r.status, r.headers, r.body);
        input.homepageFailure = { outcome: r.outcome, reason: r.reason ?? r.outcome, challenge };
        if (r.outcome === "tls_error") input.tls = { info: null, error: r.reason ?? "error de certificado", https: true };
      }
      return null;
    };

    let home = state.kind === "unreachable" ? null : await visit(`${origin}/`, true);
    if (!home && !input.homepageFailure) input.homepageFailure = { outcome: "unreachable", reason: "No se pudo leer", challenge: false };
    if (!home && state.kind !== "unreachable" && input.homepageFailure?.outcome !== "robots_disallowed" && input.homepageFailure?.outcome !== "tls_error" && !input.homepageFailure?.challenge) {
      // Algunos sitios solo responden en http: se intenta una vez, y con las mismas validaciones.
      home = await visit(`http://${domain}/`, true);
    }
    if (state.kind === "unreachable") input.homepageFailure = { outcome: "robots_unreachable", reason: state.reason, challenge: state.reason.includes("antibots") };

    // 3) Páginas internas prioritarias
    if (home) {
      const candidates = [...new Map(home.links.filter((l) => sameSite(l.href, home!.url) && !/\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|mp4)(\?|$)/i.test(l.href)).map((l) => [l.href.split("#")[0]!, l])).values()];
      candidates.sort((a, b) => Number(PRIORITY.test(b.href + b.text)) - Number(PRIORITY.test(a.href + a.text)));
      const picked: string[] = [];
      for (const l of candidates) {
        if (fetched >= deps.maxPages) break;
        const url = l.href.split("#")[0]!;
        if (url === home.url || picked.includes(url)) continue;
        picked.push(url);
        await visit(url);
      }
      input.pages = pages;

      // 4) Sitemap
      const declared = robots.sitemaps().find((u) => { try { return sameSite(u, home!.url); } catch { return false; } });
      const smUrl = declared ?? `${origin}/sitemap.xml`;
      if (robots.allowed(smUrl)) {
        const sm = await get(smUrl, { maxBytes: 2_000_000, contentTypes: /^(text\/xml|application\/xml|text\/plain|application\/octet-stream|text\/html)/i, accept: "application/xml,text/xml,*/*;q=0.1" });
        if (sm.outcome === "ok" && /<(urlset|sitemapindex)\b/i.test(sm.body)) {
          const lastmods = [...sm.body.matchAll(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/gi)].map((m) => Date.parse(m[1]!)).filter((t) => !Number.isNaN(t) && t <= Date.now() + 86_400_000);
          input.sitemap = { state: "found", url: sm.url, urls: (sm.body.match(/<loc>/gi) ?? []).length, lastmod: lastmods.length ? new Date(Math.max(...lastmods)).toISOString() : undefined };
        } else if (sm.outcome === "http_error" && sm.status === 404) input.sitemap = { state: "not_found" };
        else input.sitemap = { state: sm.outcome === "ok" ? "not_found" : "unverifiable", reason: sm.reason };
      } else input.sitemap = { state: "unverifiable", reason: "robots.txt no permite leer el sitemap" };

      // 5) Enlaces rotos: muestra de enlaces internos no visitados
      const visited = new Set(pages.map((p) => p.url));
      const sample = candidates.map((l) => l.href.split("#")[0]!).filter((u) => !visited.has(u)).slice(0, deps.linkCheckBudget);
      for (const link of sample) {
        if (!robots.allowed(link)) { input.brokenLinks.unverifiable++; continue; }
        let r = await get(link, { method: "HEAD", timeoutMs: 8000 });
        if (r.outcome === "http_error" && r.status === 405) r = await get(link, { timeoutMs: 8000, maxBytes: 50_000 });
        const challenge = looksLikeChallenge(r.status, r.headers, r.body);
        if (r.outcome === "ok") input.brokenLinks.checked++;
        else if (r.outcome === "http_error" && r.status && [404, 410].includes(r.status) && !challenge) { input.brokenLinks.checked++; input.brokenLinks.broken.push({ url: link, status: r.status }); }
        else input.brokenLinks.unverifiable++; // 403, 429, 5xx, red: no se sabe
      }

      // 6) PageSpeed
      const ps = await deps.pageSpeed.run(home.url);
      input.pagespeed = { result: ps.result, reason: ps.reason };
      if (ps.result) await pool().query(`UPDATE analysis_runs SET pagespeed = $2 WHERE id = $1`, [runId, JSON.stringify(ps.result)]);
    } else {
      input.pages = pages;
      if (state.kind === "rules" || state.kind === "none") input.sitemap = { state: "unverifiable", reason: "No se pudo leer la portada" };
    }

    const observations: Observation[] = buildObservations(input);
    for (const o of observations) {
      await pool().query(
        `INSERT INTO signal_observations (company_id, analysis_run_id, signal_code, status, kind, value, confidence, evidence_url, evidence_excerpt, analyzer_version)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)`,
        [companyId, runId, o.signal_code, o.status, o.kind, JSON.stringify(o.value ?? null), o.confidence, o.evidence_url, o.evidence_excerpt, ANALYZER_VERSION]);
    }
    await pool().query(`UPDATE analysis_runs SET status='completed', pages_fetched=$2, finished_at=now() WHERE id=$1`, [runId, fetched]);
    if (home && company.stage === "detected") await pool().query(`UPDATE companies SET stage='analyzed', updated_at=now() WHERE id=$1 AND stage='detected'`, [companyId]);
    await audit({ actorId: opts.triggeredBy ?? null, action: "analysis.completed", entityType: "company", entityId: companyId, metadata: { runId, pages: fetched, signals: observations.length } });
    return { runId, status: "completed", cached: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 300) : "error desconocido";
    await pool().query(`UPDATE analysis_runs SET status='failed', error=$2, finished_at=now() WHERE id=$1`, [runId, msg]);
    return { runId, status: "failed", cached: false, skipReason: msg };
  }
}

export { productToken };
