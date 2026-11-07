import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request-guard";
import { csrfToken, verifyCsrfToken } from "@/lib/session";
import { packState, unpackState } from "@/lib/google";

describe("rate limiter", () => {
  it("bloquea al superar el límite y se libera al vencer la ventana", () => {
    let t = 0;
    const rl = createRateLimiter(2, 1000, () => t);
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(true);
    const blocked = rl.check("a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(rl.check("b").allowed).toBe(true);
    t = 1001;
    expect(rl.check("a").allowed).toBe(true);
  });
});

describe("protección de origen (CSRF)", () => {
  const req = (headers: Record<string, string>) => new Request("http://localhost:3000/x", { method: "POST", headers });
  it("acepta el mismo origen", () => {
    expect(isSameOrigin(req({ origin: "http://localhost:3000" }))).toBe(true);
  });
  it("rechaza otro origen", () => {
    expect(isSameOrigin(req({ origin: "https://evil.example" }))).toBe(false);
  });
  it("rechaza si no hay Origin ni Sec-Fetch-Site", () => {
    expect(isSameOrigin(req({}))).toBe(false);
  });
  it("rechaza Sec-Fetch-Site cross-site", () => {
    expect(isSameOrigin(req({ "sec-fetch-site": "cross-site" }))).toBe(false);
  });
});

describe("token CSRF", () => {
  it("valida el token correcto y rechaza otros", () => {
    const t = csrfToken("secreto-de-sesion");
    expect(verifyCsrfToken("secreto-de-sesion", t)).toBe(true);
    expect(verifyCsrfToken("otro-secreto", t)).toBe(false);
    expect(verifyCsrfToken("secreto-de-sesion", "falso")).toBe(false);
    expect(verifyCsrfToken("secreto-de-sesion", null)).toBe(false);
  });
});

describe("estado OIDC firmado", () => {
  it("ida y vuelta", () => {
    const s = { state: "s", nonce: "n", verifier: "v" };
    expect(unpackState(packState(s))).toEqual(s);
  });
  it("detecta manipulación", () => {
    const packed = packState({ state: "s", nonce: "n", verifier: "v" });
    const [payload, mac] = packed.split(".");
    const forged = Buffer.from(JSON.stringify({ state: "x", nonce: "n", verifier: "v" })).toString("base64url");
    expect(unpackState(`${forged}.${mac}`)).toBeNull();
    expect(unpackState(`${payload}.AAAA`)).toBeNull();
    expect(unpackState(undefined)).toBeNull();
  });
});
