import * as oidc from "openid-client";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export const OIDC_COOKIE = "radar_oidc";
export const googleConfigured = (): boolean => Boolean(env().GOOGLE_CLIENT_ID && env().GOOGLE_CLIENT_SECRET);
export const redirectUri = (): string => new URL("/api/auth/google/callback", env().APP_URL).toString();

let config: Promise<oidc.Configuration> | undefined;
function getConfig() {
  config ??= oidc.discovery(new URL("https://accounts.google.com"), env().GOOGLE_CLIENT_ID, env().GOOGLE_CLIENT_SECRET);
  return config;
}

const sign = (payload: string) => createHmac("sha256", env().SESSION_SECRET).update(payload).digest("base64url");

export function packState(data: { state: string; nonce: string; verifier: string }): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function unpackState(value: string | undefined): { state: string; nonce: string; verifier: string } | null {
  if (!value) return null;
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function startAuthorization() {
  const verifier = oidc.randomPKCECodeVerifier();
  const state = oidc.randomState();
  const nonce = randomBytes(16).toString("base64url");
  const domains = env().AUTH_ALLOWED_DOMAINS.split(",").map((d) => d.trim()).filter(Boolean);
  const params: Record<string, string> = {
    redirect_uri: redirectUri(),
    scope: "openid email profile",
    code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
    code_challenge_method: "S256",
    state,
    nonce,
  };
  if (domains.length === 1) params.hd = domains[0]!; // solo una sugerencia de UI; la validación real se hace al volver
  const url = oidc.buildAuthorizationUrl(await getConfig(), params);
  return { url, cookie: packState({ state, nonce, verifier }) };
}

export async function finishAuthorization(currentUrl: URL, saved: { state: string; nonce: string; verifier: string }) {
  const tokens = await oidc.authorizationCodeGrant(await getConfig(), currentUrl, {
    pkceCodeVerifier: saved.verifier,
    expectedState: saved.state,
    expectedNonce: saved.nonce,
  });
  const claims = tokens.claims();
  if (!claims || typeof claims.email !== "string") throw new Error("Google no devolvió el correo");
  return {
    sub: claims.sub,
    email: claims.email,
    emailVerified: claims.email_verified === true,
    name: typeof claims.name === "string" ? claims.name : undefined,
  };
}
