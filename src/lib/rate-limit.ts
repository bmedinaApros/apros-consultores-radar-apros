interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Limitador en memoria de ventana fija. Suficiente para una sola instancia (despliegue previsto);
 * si se escala a varias instancias hay que moverlo a PostgreSQL. Ver docs/SECURITY.md.
 */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const buckets = new Map<string, Bucket>();
  return {
    check(key: string): { allowed: boolean; retryAfterSec: number } {
      const t = now();
      const b = buckets.get(key);
      if (!b || b.resetAt <= t) {
        buckets.set(key, { count: 1, resetAt: t + windowMs });
        if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.resetAt <= t) buckets.delete(k);
        return { allowed: true, retryAfterSec: 0 };
      }
      b.count += 1;
      return b.count <= limit
        ? { allowed: true, retryAfterSec: 0 }
        : { allowed: false, retryAfterSec: Math.ceil((b.resetAt - t) / 1000) };
    },
  };
}

export const loginLimiter = createRateLimiter(10, 15 * 60 * 1000);

export function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
