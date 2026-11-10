import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { parseEnv } from "@/lib/env";
import { localUser } from "@/lib/session";
import { csvCell } from "@/lib/registry/csv";
import { mkActor, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

const base = { DATABASE_URL: "postgres://x", SESSION_SECRET: "x".repeat(40) };

describe("modo local", () => {
  it("no se permite en producción y por defecto está apagado", () => {
    expect(parseEnv({ ...base }).LOCAL_MODE).toBe("false");
    expect(() => parseEnv({ ...base, NODE_ENV: "production", LOCAL_MODE: "true" })).toThrow(/LOCAL_MODE/);
    expect(parseEnv({ ...base, NODE_ENV: "development", LOCAL_MODE: "true" }).LOCAL_MODE).toBe("true");
  });

  it("actúa como el primer administrador activo y no escribe nada", async () => {
    expect(await localUser()).toBeNull(); // sin administradores no hay sesión
    await mkActor("sales_lead");
    expect(await localUser()).toBeNull(); // solo un administrador sirve
    const admin = await mkActor("admin");
    const u = await localUser();
    expect(u).toMatchObject({ userId: admin.id, role: "admin", restricted: false });
    expect((await pool().query("SELECT count(*)::int AS n FROM sessions")).rows[0].n).toBe(0);
    await pool().query(`UPDATE users SET active = false WHERE id = $1`, [admin.id]);
    expect(await localUser()).toBeNull();
  });
});

describe("CSV de resultados", () => {
  it("escapa comillas y comas y neutraliza fórmulas de Excel", () => {
    expect(csvCell('ACME "SAC", Lima')).toBe('"ACME ""SAC"", Lima"');
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("+51 999")).toBe("'+51 999");
    expect(csvCell(null)).toBe("");
    expect(csvCell("línea\r\nnueva")).toBe("línea nueva");
  });
});
