import { env } from "../env";
import type { PageSpeedSummary } from "./observations";

export interface PageSpeedProvider {
  run(url: string): Promise<{ result: PageSpeedSummary | null; reason?: string; raw?: unknown }>;
}

/** Sin clave de API: no se inventa un resultado. */
export const disabledPageSpeed: PageSpeedProvider = {
  async run() {
    return { result: null, reason: "PageSpeed Insights no está configurado (falta la clave de API)" };
  },
};

/**
 * Cliente de la API oficial de PageSpeed Insights. El host es fijo (no depende de datos de terceros);
 * la URL analizada ya pasó por las validaciones del analizador antes de llegar aquí.
 */
export function googlePageSpeed(apiKey: string = env().PAGESPEED_API_KEY): PageSpeedProvider {
  return {
    async run(url) {
      if (!apiKey) return disabledPageSpeed.run(url);
      const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
      endpoint.searchParams.set("url", url);
      endpoint.searchParams.set("strategy", "mobile");
      endpoint.searchParams.set("category", "performance");
      endpoint.searchParams.set("key", apiKey);
      try {
        const res = await fetch(endpoint, { signal: AbortSignal.timeout(60_000) });
        if (!res.ok) return { result: null, reason: `PageSpeed respondió HTTP ${res.status}` };
        const data = (await res.json()) as {
          lighthouseResult?: { categories?: { performance?: { score?: number } }; audits?: Record<string, { numericValue?: number }>; finalUrl?: string };
        };
        const lh = data.lighthouseResult;
        const score = lh?.categories?.performance?.score;
        return {
          result: {
            strategy: "mobile",
            performanceScore: typeof score === "number" ? Math.round(score * 100) : null,
            lcpMs: lh?.audits?.["largest-contentful-paint"]?.numericValue ? Math.round(lh.audits["largest-contentful-paint"].numericValue) : null,
            cls: lh?.audits?.["cumulative-layout-shift"]?.numericValue ?? null,
            fetchedUrl: lh?.finalUrl ?? url,
          },
          raw: { score, finalUrl: lh?.finalUrl },
        };
      } catch {
        return { result: null, reason: "No se pudo consultar PageSpeed (red o tiempo de espera)" };
      }
    },
  };
}
