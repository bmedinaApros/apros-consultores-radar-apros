import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { dummyHash, generateTempPassword, hashPassword, passwordPolicyError, verifyPassword } from "@/lib/password";
import {
  changeOwnPassword, createUserFromCli, createUserWithTempPassword, loginWithPassword, PasswordChangeError, resetPassword, unlockUser,
} from "@/lib/auth-password";
import { getSessionUser, revokeSession } from "@/lib/session";
import { ForbiddenError } from "@/lib/rbac";
import { UserUpdateError } from "@/lib/users";
import { mkActor, ownerPool, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

describe("hash de contraseñas", () => {
  it("verifica la correcta, rechaza la incorrecta y usa sal distinta cada vez", async () => {
    const a = await hashPassword("una frase bastante larga");
    const b = await hashPassword("una frase bastante larga");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("una frase bastante larga", a)).toBe(true);
    expect(await verifyPassword("otra frase bastante larga", a)).toBe(false);
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await verifyPassword("x", "texto-cualquiera")).toBe(false);
  });

  it("un hash guardado con parámetros peligrosos o corruptos no se procesa (no agota memoria)", async () => {
    expect(await verifyPassword("x", "scrypt$1073741824$8$1$c2Fs$aGFzaGhhc2hoYXNoaGFzaA")).toBe(false);
    expect(await verifyPassword("x", "scrypt$32768$999$1$c2Fs$aGFzaGhhc2hoYXNoaGFzaA")).toBe(false);
    expect(await verifyPassword("x", "scrypt$32768$8$1$c2Fs$YQ")).toBe(false);
    expect(await verifyPassword("x", await dummyHash())).toBe(false);
  });

  it("la política exige longitud y rechaza el correo y las claves comunes", () => {
    expect(passwordPolicyError("corta")).toMatch(/al menos 12/);
    expect(passwordPolicyError("maria.lopez@apros.pe", "maria.lopez@apros.pe")).toMatch(/correo/);
    expect(passwordPolicyError("mi clave maria.lopez 2026", "maria.lopez@apros.pe")).toMatch(/correo/);
    expect(passwordPolicyError("password1234")).toMatch(/común/);
    expect(passwordPolicyError("aaaaaaaaaaaaaa")).toMatch(/común/);
    expect(passwordPolicyError("x".repeat(201) + "ab")).toMatch(/superar/);
    expect(passwordPolicyError("una frase larga y razonable")).toBeNull();
  });

  it("las claves temporales son legibles y distintas", () => {
    const a = generateTempPassword();
    expect(a).toMatch(/^[A-Za-z0-9]{4}(-[A-Za-z0-9]{4}){3}$/);
    expect(generateTempPassword()).not.toBe(a);
  });
});

async function newUser(admin: Awaited<ReturnType<typeof mkActor>>, email = "ana@apros.pe", role: "consultant" | "admin" = "consultant") {
  return createUserWithTempPassword(admin, { email, name: "Ana", role });
}

describe("alta y primer ingreso", () => {
  it("un administrador crea el usuario con clave temporal; el ingreso queda restringido hasta cambiarla", async () => {
    const admin = await mkActor("admin");
    const u = await newUser(admin);
    expect(u.tempPassword).toMatch(/^[A-Za-z0-9-]{19}$/);
    const hash = (await pool().query("SELECT password_hash FROM users WHERE id = $1", [u.userId])).rows[0].password_hash as string;
    expect(hash).not.toContain(u.tempPassword);

    const r = await loginWithPassword("Ana@Apros.pe ", u.tempPassword, "test");
    expect(r.ok && r.mustChange).toBe(true);
    if (!r.ok) throw new Error("login");
    // Una ruta que no pide allowRestricted la ve como inexistente
    expect(await getSessionUser(r.token)).toBeNull();
    const restricted = await getSessionUser(r.token, { allowRestricted: true });
    expect(restricted?.restricted).toBe(true);

    await changeOwnPassword({ userId: u.userId, email: u.email, sessionId: restricted!.sessionId }, u.tempPassword, "una frase nueva y larga");
    const full = await getSessionUser(r.token);
    expect(full?.restricted).toBe(false);
    const again = await loginWithPassword("ana@apros.pe", "una frase nueva y larga", "test");
    expect(again.ok && !again.mustChange).toBe(true);
    expect((await loginWithPassword("ana@apros.pe", u.tempPassword, "test")).ok).toBe(false);
  });

  it("solo quien tiene permiso crea o restablece; correos duplicados o inválidos se rechazan", async () => {
    const admin = await mkActor("admin");
    const lead = await mkActor("sales_lead");
    await expect(createUserWithTempPassword(lead, { email: "x@apros.pe", name: "", role: "consultant" })).rejects.toBeInstanceOf(ForbiddenError);
    await newUser(admin);
    await expect(newUser(admin)).rejects.toThrow(/Ya existe/);
    await expect(createUserWithTempPassword(admin, { email: "no-es-correo", name: "", role: "consultant" })).rejects.toBeInstanceOf(UserUpdateError);
    const u = await pool().query<{ id: string }>("SELECT id FROM users WHERE email = 'ana@apros.pe'");
    await expect(resetPassword(lead, u.rows[0]!.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("inicio de sesión", () => {
  async function ready() {
    const admin = await mkActor("admin");
    const u = await newUser(admin);
    const full = await loginWithPassword(u.email, u.tempPassword, "t");
    if (!full.ok) throw new Error("login");
    const s = await getSessionUser(full.token, { allowRestricted: true });
    await changeOwnPassword({ userId: u.userId, email: u.email, sessionId: s!.sessionId }, u.tempPassword, "una frase de prueba larga");
    return { admin, u, pw: "una frase de prueba larga" };
  }

  it("todo fallo es igual y no distingue usuario inexistente, clave incorrecta o cuenta desactivada", async () => {
    const { u, admin, pw } = await ready();
    const unknown = await loginWithPassword("nadie@apros.pe", "cualquier cosa larga", "t");
    const wrong = await loginWithPassword(u.email, "clave equivocada larga", "t");
    expect(unknown).toEqual({ ok: false });
    expect(wrong).toEqual({ ok: false });
    await pool().query("UPDATE users SET active = false WHERE id = $1", [u.userId]);
    expect(await loginWithPassword(u.email, pw, "t")).toEqual({ ok: false });
    const reasons = (await pool().query(`SELECT metadata->>'reason' AS r FROM audit_log WHERE action = 'auth.login_failed' ORDER BY id`)).rows.map((x) => x.r);
    expect(reasons).toEqual(["unknown", "bad_password", "inactive"]);
    expect(admin.id).toBeTruthy();
  });

  it("se bloquea tras 5 fallos (aunque luego se use la clave correcta) y el administrador la desbloquea", async () => {
    const { u, admin, pw } = await ready();
    for (let i = 0; i < 5; i++) expect((await loginWithPassword(u.email, "intento equivocado " + i, "t")).ok).toBe(false);
    const row = (await pool().query("SELECT failed_attempts, locked_until FROM users WHERE id = $1", [u.userId])).rows[0];
    expect(row.failed_attempts).toBe(5);
    expect(new Date(row.locked_until).getTime()).toBeGreaterThan(Date.now() + 10 * 60_000);
    expect((await loginWithPassword(u.email, pw, "t")).ok).toBe(false); // bloqueada: ni la clave correcta entra
    await unlockUser(admin, u.userId);
    expect((await loginWithPassword(u.email, pw, "t")).ok).toBe(true);
  });

  it("el bloqueo crece con la reincidencia y un ingreso correcto reinicia el contador", async () => {
    const { u, pw } = await ready();
    for (let i = 0; i < 5; i++) await loginWithPassword(u.email, "mal " + i + " mal mal", "t");
    await pool().query("UPDATE users SET locked_until = now() - interval '1 minute' WHERE id = $1", [u.userId]); // venció el primer bloqueo
    for (let i = 0; i < 5; i++) await loginWithPassword(u.email, "mal otra vez " + i, "t");
    const row = (await pool().query("SELECT locked_until FROM users WHERE id = $1", [u.userId])).rows[0];
    expect(new Date(row.locked_until).getTime()).toBeGreaterThan(Date.now() + 25 * 60_000); // 30 min la segunda vez
    await pool().query("UPDATE users SET locked_until = NULL WHERE id = $1", [u.userId]);
    expect((await loginWithPassword(u.email, pw, "t")).ok).toBe(true);
    expect((await pool().query("SELECT failed_attempts FROM users WHERE id = $1", [u.userId])).rows[0].failed_attempts).toBe(0);
  });

  it("la auditoría registra ingresos y fallos sin guardar claves", async () => {
    const { u, pw } = await ready();
    await loginWithPassword(u.email, "clave equivocada larga", "t");
    await loginWithPassword(u.email, pw, "t");
    const all = JSON.stringify((await pool().query("SELECT action, metadata FROM audit_log")).rows);
    expect(all).toContain("auth.login_failed");
    expect(all).toContain("auth.login_password");
    expect(all).not.toContain(pw);
    expect(all).not.toContain(u.tempPassword);
  });
});

describe("cambio y restablecimiento de clave", () => {
  it("cambiar la clave cierra las demás sesiones pero conserva la actual", async () => {
    const admin = await mkActor("admin");
    const created = await createUserFromCli({ email: "eva@apros.pe", name: "Eva", role: "consultant", password: "clave inicial bien larga" });
    const a = await loginWithPassword("eva@apros.pe", "clave inicial bien larga", "equipo A");
    const b = await loginWithPassword("eva@apros.pe", "clave inicial bien larga", "equipo B");
    if (!a.ok || !b.ok) throw new Error("login");
    const sa = (await getSessionUser(a.token))!;
    await changeOwnPassword({ userId: created.userId, email: "eva@apros.pe", sessionId: sa.sessionId }, "clave inicial bien larga", "clave nueva bien larga 2");
    expect(await getSessionUser(a.token)).not.toBeNull();
    expect(await getSessionUser(b.token)).toBeNull();
    expect(admin.id).toBeTruthy();
  });

  it("exige la clave actual, cumple la política y los fallos cuentan para el bloqueo", async () => {
    const c = await createUserFromCli({ email: "eva@apros.pe", name: "", role: "consultant", password: "clave inicial bien larga" });
    const l = await loginWithPassword("eva@apros.pe", "clave inicial bien larga", "t");
    if (!l.ok) throw new Error("login");
    const me = { userId: c.userId, email: "eva@apros.pe", sessionId: (await getSessionUser(l.token))!.sessionId };
    await expect(changeOwnPassword(me, "no es la actual", "otra clave bien larga")).rejects.toThrow(/actual no es correcta/);
    await expect(changeOwnPassword(me, "clave inicial bien larga", "corta")).rejects.toThrow(/al menos 12/);
    await expect(changeOwnPassword(me, "clave inicial bien larga", "clave inicial bien larga")).rejects.toBeInstanceOf(PasswordChangeError);
    expect((await pool().query("SELECT failed_attempts FROM users WHERE id = $1", [c.userId])).rows[0].failed_attempts).toBe(1);
  });

  it("restablecer da una clave temporal nueva, cierra sesiones y levanta el bloqueo", async () => {
    const admin = await mkActor("admin");
    const c = await createUserFromCli({ email: "eva@apros.pe", name: "", role: "consultant", password: "clave inicial bien larga" });
    const l = await loginWithPassword("eva@apros.pe", "clave inicial bien larga", "t");
    if (!l.ok) throw new Error("login");
    for (let i = 0; i < 5; i++) await loginWithPassword("eva@apros.pe", "intento malo " + i + " largo", "t");
    const r = await resetPassword(admin, c.userId);
    expect(await getSessionUser(l.token)).toBeNull();
    const again = await loginWithPassword("eva@apros.pe", r.tempPassword, "t");
    expect(again.ok && again.mustChange).toBe(true);
    await expect(resetPassword(admin, "00000000-0000-0000-0000-000000000000")).rejects.toThrow(/no encontrado/);
  });
});

describe("comando local", () => {
  it("crea el primer administrador con clave propia (sin cambio forzado) y valida la política", async () => {
    await expect(createUserFromCli({ email: "adm@apros.pe", name: "", role: "admin", password: "corta" })).rejects.toThrow(/al menos 12/);
    const r = await createUserFromCli({ email: "adm@apros.pe", name: "Admin", role: "admin", password: "una clave de administrador" });
    expect(r.tempPassword).toBe("");
    const l = await loginWithPassword("adm@apros.pe", "una clave de administrador", "t");
    expect(l.ok && !l.mustChange).toBe(true);
    const t = await createUserFromCli({ email: "adm2@apros.pe", name: "", role: "admin", password: null });
    expect(t.tempPassword).not.toBe("");
  });

  it("cerrar una sesión restringida la invalida", async () => {
    const admin = await mkActor("admin");
    const u = await newUser(admin);
    const l = await loginWithPassword(u.email, u.tempPassword, "t");
    if (!l.ok) throw new Error("login");
    const s = (await getSessionUser(l.token, { allowRestricted: true }))!;
    await revokeSession(s.sessionId);
    expect(await getSessionUser(l.token, { allowRestricted: true })).toBeNull();
    await ownerPool().query("SELECT 1");
  });
});
