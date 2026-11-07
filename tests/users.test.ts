import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { createSession, getSessionUser, revokeSession } from "@/lib/session";
import { LoginDeniedError, UserUpdateError, isAllowedDomain, loginWithGoogle, updateUserAccess } from "@/lib/users";
import { verifyAuditChain } from "@/lib/audit";
import { resetData, ownerPool } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

const claims = (email: string, extra = {}) => ({ sub: `sub-${email}`, email, emailVerified: true, name: "Prueba", ...extra });

describe("dominios", () => {
  it("solo acepta dominios autorizados", () => {
    expect(isAllowedDomain("a@apros.pe", ["apros.pe"])).toBe(true);
    expect(isAllowedDomain("a@APROS.PE", ["apros.pe"])).toBe(true);
    expect(isAllowedDomain("a@evil.com", ["apros.pe"])).toBe(false);
    expect(isAllowedDomain("a@apros.pe.evil.com", ["apros.pe"])).toBe(false);
    expect(isAllowedDomain("a@sub.apros.pe", ["apros.pe"])).toBe(false);
    expect(isAllowedDomain("sinarroba", ["apros.pe"])).toBe(false);
  });
});

describe("login con Google", () => {
  it("crea al usuario nuevo con rol de lectura", async () => {
    const u = await loginWithGoogle(claims("nuevo@apros.pe"));
    expect(u.role).toBe("read_only");
  });

  it("rechaza dominios no autorizados y correos no verificados", async () => {
    await expect(loginWithGoogle(claims("x@gmail.com"))).rejects.toMatchObject({ reason: "domain" });
    await expect(loginWithGoogle(claims("x@apros.pe", { emailVerified: false }))).rejects.toBeInstanceOf(LoginDeniedError);
  });

  it("no deja entrar a un usuario desactivado", async () => {
    const u = await loginWithGoogle(claims("baja@apros.pe"));
    await pool().query("UPDATE users SET active = false WHERE id = $1", [u.id]);
    await expect(loginWithGoogle(claims("baja@apros.pe"))).rejects.toMatchObject({ reason: "inactive" });
  });

  it("deja rastro en la auditoría con cadena válida", async () => {
    await loginWithGoogle(claims("rastro@apros.pe"));
    const { rows } = await pool().query("SELECT action FROM audit_log ORDER BY id");
    expect(rows.map((r) => r.action)).toEqual(["user.created", "auth.login"]);
    expect(await verifyAuditChain()).toBeNull();
  });
});

describe("sesiones", () => {
  it("una sesión válida devuelve al usuario y una revocada no", async () => {
    const u = await loginWithGoogle(claims("ses@apros.pe"));
    const { token } = await createSession(u.id, "test");
    expect((await getSessionUser(token))?.email).toBe("ses@apros.pe");
    const s = await getSessionUser(token);
    await revokeSession(s!.sessionId);
    expect(await getSessionUser(token)).toBeNull();
  });

  it("rechaza tokens inventados o ausentes", async () => {
    expect(await getSessionUser("inventado")).toBeNull();
    expect(await getSessionUser(undefined)).toBeNull();
  });

  it("una sesión vencida o inactiva no sirve", async () => {
    const u = await loginWithGoogle(claims("exp@apros.pe"));
    const { token } = await createSession(u.id, "test");
    const owner = ownerPool();
    await owner.query("UPDATE sessions SET last_seen_at = now() - interval '3 hours'");
    expect(await getSessionUser(token)).toBeNull();
    await owner.query("UPDATE sessions SET last_seen_at = now(), expires_at = now() - interval '1 minute'");
    expect(await getSessionUser(token)).toBeNull();
    await owner.end();
  });

  it("el token no se guarda en claro", async () => {
    const u = await loginWithGoogle(claims("hash@apros.pe"));
    const { token } = await createSession(u.id, "test");
    const { rows } = await pool().query("SELECT encode(token_hash,'escape') AS t FROM sessions");
    expect(JSON.stringify(rows)).not.toContain(token);
  });

  it("desactivar a un usuario cierra sus sesiones", async () => {
    const admin = await loginWithGoogle(claims("admin1@apros.pe"));
    await pool().query("UPDATE users SET role = 'admin' WHERE id = $1", [admin.id]);
    const u = await loginWithGoogle(claims("victima@apros.pe"));
    const { token } = await createSession(u.id, "test");
    await updateUserAccess({ id: admin.id, email: admin.email }, u.id, { active: false });
    expect(await getSessionUser(token)).toBeNull();
  });
});

describe("gestión de usuarios", () => {
  async function makeAdmin(email: string) {
    const u = await loginWithGoogle(claims(email));
    await pool().query("UPDATE users SET role = 'admin' WHERE id = $1", [u.id]);
    return u;
  }

  it("no permite quitar al último administrador", async () => {
    const a = await makeAdmin("unico@apros.pe");
    await expect(updateUserAccess({ id: a.id, email: a.email }, a.id, { role: "read_only" })).rejects.toBeInstanceOf(UserUpdateError);
    await expect(updateUserAccess({ id: a.id, email: a.email }, a.id, { active: false })).rejects.toBeInstanceOf(UserUpdateError);
  });

  it("permite cambiar el rol cuando hay otro administrador y lo audita", async () => {
    const a = await makeAdmin("a@apros.pe");
    const b = await makeAdmin("b@apros.pe");
    await updateUserAccess({ id: a.id, email: a.email }, b.id, { role: "salesperson" });
    const { rows } = await pool().query("SELECT role FROM users WHERE id = $1", [b.id]);
    expect(rows[0].role).toBe("salesperson");
    const audit = await pool().query("SELECT metadata FROM audit_log WHERE action = 'user.access_changed'");
    expect(audit.rows[0].metadata.to.role).toBe("salesperson");
  });

  it("rechaza roles inválidos", async () => {
    const a = await makeAdmin("a2@apros.pe");
    await expect(updateUserAccess({ id: a.id, email: a.email }, a.id, { role: "root" as never })).rejects.toBeInstanceOf(UserUpdateError);
  });
});
