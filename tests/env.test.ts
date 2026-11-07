import { describe, expect, it } from "vitest";
import { isDevLoginAllowed, parseEnv } from "@/lib/env";

const base = { DATABASE_URL: "postgres://x", SESSION_SECRET: "x".repeat(32) };

describe("acceso de desarrollo", () => {
  it("solo está permitido en desarrollo con la bandera activa", () => {
    expect(isDevLoginAllowed({ NODE_ENV: "development", DEV_LOGIN_ENABLED: "true" })).toBe(true);
    expect(isDevLoginAllowed({ NODE_ENV: "development", DEV_LOGIN_ENABLED: "false" })).toBe(false);
    expect(isDevLoginAllowed({ NODE_ENV: "production", DEV_LOGIN_ENABLED: "true" })).toBe(false);
    expect(isDevLoginAllowed({ NODE_ENV: "test", DEV_LOGIN_ENABLED: "true" })).toBe(false);
  });

  it("la configuración se niega a arrancar en producción con la bandera activa", () => {
    expect(() => parseEnv({ ...base, NODE_ENV: "production", DEV_LOGIN_ENABLED: "true" })).toThrow(/producción/);
    expect(() => parseEnv({ ...base, NODE_ENV: "production", DEV_LOGIN_ENABLED: "false" })).not.toThrow();
  });

  it("rechaza un SESSION_SECRET corto", () => {
    expect(() => parseEnv({ ...base, SESSION_SECRET: "corto" })).toThrow();
  });

  it("la ruta de acceso de desarrollo responde 404 fuera de desarrollo", async () => {
    const { POST } = await import("@/app/api/auth/dev-login/route");
    const body = new FormData();
    body.set("email", "admin.demo@apros.pe");
    const res = await POST(new Request("http://localhost:3000/api/auth/dev-login", { method: "POST", body }));
    expect(res.status).toBe(404);
  });
});
