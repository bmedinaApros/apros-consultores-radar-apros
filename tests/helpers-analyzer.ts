import { disabledPageSpeed } from "@/lib/analyzer/pagespeed";
import { DomainThrottle, type Fetcher, type FetchResult } from "@/lib/analyzer/safe-fetch";
import type { AnalyzerDeps } from "@/lib/analyzer/run";
import * as F from "./fixtures/sites";

/** Un sitio ficticio por dominio: portada y robots. El resto de rutas responde 404. */
export type SiteMap = Record<string, { home?: string; homeResult?: FetchResult; robots?: "none" | string }>;

export function fakeAnalyzerDeps(sites: SiteMap, extra: Partial<AnalyzerDeps> = {}): { deps: AnalyzerDeps; calls: string[] } {
  const calls: string[] = [];
  const fetcher: Fetcher = async (url, o) => {
    calls.push(`${o?.method ?? "GET"} ${url}`);
    const u = new URL(url);
    const site = sites[u.hostname];
    if (!site) return F.failure(url, "blocked", "el dominio no se pudo resolver (ENOTFOUND)");
    if (u.pathname === "/robots.txt") return site.robots && site.robots !== "none" ? F.ok(url, site.robots, { headers: { "content-type": "text/plain" } }) : F.httpError(url, 404);
    if (u.pathname === "/") return site.homeResult ?? (site.home !== undefined ? F.ok(url, site.home, { tls: { validTo: "2027-01-01T00:00:00.000Z", issuer: "Test CA", protocol: "TLSv1.3", authorized: true } }) : F.httpError(url, 404));
    return F.httpError(url, 404, "no existe");
  };
  return { calls, deps: { fetcher, throttle: new DomainThrottle(0), pageSpeed: disabledPageSpeed, userAgent: "RadarAPROS/1.0", maxPages: 4, cacheDays: 7, linkCheckBudget: 2, ...extra } };
}

export const POOR = "<html><body><p>Bienvenidos</p></body></html>";
export const GOOD = `<html lang="es"><head><title>Empresa con buen sitio</title><meta name="description" content="Descripción"><meta name="viewport" content="width=device-width">
<script>gtag('config','G-AAAAAAAAAA')</script><script>fbq('init','12345678901')</script><script type="application/ld+json">{"@type":"Organization","telephone":"1","address":"x"}</script></head>
<body><h1>Hola</h1><a href="tel:+5111111111">Llámanos</a><a href="https://wa.me/51999999999">WhatsApp</a><form></form><p>Cotiza ahora tu proyecto. Contáctanos. © 2026 </p></body></html>`;
