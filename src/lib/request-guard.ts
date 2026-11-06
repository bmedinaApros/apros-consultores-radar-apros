import { env } from "./env";

/** Rechaza peticiones que cambian estado y no provienen de este mismo origen. */
export function isSameOrigin(request: Request): boolean {
  const expected = new URL(env().APP_URL).origin;
  const origin = request.headers.get("origin");
  if (origin) return origin === expected;
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin" || site === "none";
  return false; // sin Origin ni Sec-Fetch-Site: se rechaza
}
