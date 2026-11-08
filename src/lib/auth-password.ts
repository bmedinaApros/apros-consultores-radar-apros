import { audit } from "./audit";
import { pool, withTransaction } from "./db";
import type { ActorInfo } from "./companies/service";
import { dummyHash, generateTempPassword, hashPassword, passwordPolicyError, verifyPassword, PASSWORD_MAX_LENGTH } from "./password";
import { ROLES, requirePermission, type Role } from "./rbac";
import { createSession, revokeUserSessions } from "./session";
import { normalizeEmail, UserUpdateError } from "./users";

/** Cada 5 intentos fallidos seguidos la cuenta se bloquea: 15 min, luego el doble, hasta un día. */
export const LOCK_EVERY = 5;
export const LOCK_BASE_MINUTES = 15;
export const LOCK_MAX_MINUTES = 24 * 60;

interface AuthRow {
  id: string; email: string; role: Role; active: boolean; password_hash: string | null;
  must_change_password: boolean; locked_until: Date | null;
}

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date; mustChange: boolean; userId: string }
  | { ok: false };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Inicio de sesión con usuario y clave. Para quien intenta entrar, todo fallo es igual (clave incorrecta, usuario
 * inexistente, desactivado o bloqueado): no se revela qué correos existen. Internamente se distingue en la auditoría.
 */
export async function loginWithPassword(emailInput: string, password: string, userAgent: string | null): Promise<LoginResult> {
  const email = normalizeEmail(emailInput).slice(0, 254);
  const pw = password.slice(0, PASSWORD_MAX_LENGTH + 1);
  const found = EMAIL_RE.test(email)
    ? (await pool().query<AuthRow>(`SELECT id, email, role, active, password_hash, must_change_password, locked_until FROM users WHERE email = $1`, [email])).rows[0]
    : undefined;

  const deny = async (reason: "unknown" | "inactive" | "locked" | "no_password" | "bad_password"): Promise<LoginResult> => {
    await audit({
      actorId: found?.id ?? null, actorEmail: found?.email ?? null, action: "auth.login_failed",
      entityType: "user", entityId: found?.id ?? "desconocido", metadata: { reason },
    });
    return { ok: false };
  };

  if (!found || !found.password_hash || !found.active) {
    await verifyPassword(pw, await dummyHash()); // mismo trabajo que un intento real
    return deny(!found ? "unknown" : !found.active ? "inactive" : "no_password");
  }
  if (found.locked_until && found.locked_until.getTime() > Date.now()) {
    await verifyPassword(pw, await dummyHash());
    return deny("locked");
  }
  if (pw.length > PASSWORD_MAX_LENGTH || !(await verifyPassword(pw, found.password_hash))) {
    await registerFailure(found.id);
    return deny("bad_password");
  }

  await pool().query(`UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = now() WHERE id = $1`, [found.id]);
  const { token, expiresAt } = await createSession(found.id, userAgent, { restricted: found.must_change_password });
  await audit({ actorId: found.id, actorEmail: found.email, action: "auth.login_password", entityType: "user", entityId: found.id, metadata: { mustChange: found.must_change_password } });
  return { ok: true, token, expiresAt, mustChange: found.must_change_password, userId: found.id };
}

/** Suma un fallo y, al llegar a un múltiplo de LOCK_EVERY, bloquea con duración creciente (una sola sentencia: sin carreras). */
async function registerFailure(userId: string): Promise<void> {
  await pool().query(
    `UPDATE users SET failed_attempts = failed_attempts + 1,
            locked_until = CASE WHEN (failed_attempts + 1) % $2 = 0
              THEN now() + make_interval(mins => LEAST($3 * power(2, (failed_attempts + 1) / $2 - 1)::int, $4))
              ELSE locked_until END
      WHERE id = $1`,
    [userId, LOCK_EVERY, LOCK_BASE_MINUTES, LOCK_MAX_MINUTES],
  );
}

export interface CreatedUser { userId: string; email: string; tempPassword: string }

/** Alta por un administrador: crea el usuario con una clave temporal que se muestra una sola vez y debe cambiarse al entrar. */
export async function createUserWithTempPassword(actor: ActorInfo, input: { email: string; name: string; role: Role }): Promise<CreatedUser> {
  requirePermission(actor, "users.manage");
  const email = normalizeEmail(input.email);
  if (!EMAIL_RE.test(email) || email.length > 254) throw new UserUpdateError("Correo inválido");
  if (!ROLES.includes(input.role)) throw new UserUpdateError("Rol inválido");
  const name = input.name.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 100);
  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);
  const id = await withTransaction(async (c) => {
    const dup = await c.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
    if (dup.rowCount) throw new UserUpdateError("Ya existe un usuario con ese correo");
    const r = await c.query<{ id: string }>(
      `INSERT INTO users (email, name, role, password_hash, password_set_at, must_change_password) VALUES ($1,$2,$3::user_role,$4,now(),true) RETURNING id`,
      [email, name, input.role, hash]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "user.created", entityType: "user", entityId: r.rows[0]!.id, metadata: { role: input.role, method: "password" } }, c);
    return r.rows[0]!.id;
  });
  return { userId: id, email, tempPassword };
}

/** Restablece la clave de un usuario (clave temporal nueva, cierra sus sesiones y levanta el bloqueo). */
export async function resetPassword(actor: ActorInfo, targetId: string): Promise<CreatedUser> {
  requirePermission(actor, "users.manage");
  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);
  const email = await withTransaction(async (c) => {
    const r = await c.query<{ email: string }>(
      `UPDATE users SET password_hash = $2, password_set_at = now(), must_change_password = true, failed_attempts = 0, locked_until = NULL WHERE id = $1 RETURNING email`,
      [targetId, hash]);
    if (!r.rows[0]) throw new UserUpdateError("Usuario no encontrado");
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "user.password_reset", entityType: "user", entityId: targetId }, c);
    return r.rows[0].email;
  });
  await revokeUserSessions(targetId);
  return { userId: targetId, email, tempPassword };
}

export async function unlockUser(actor: ActorInfo, targetId: string): Promise<void> {
  requirePermission(actor, "users.manage");
  const r = await pool().query(`UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1`, [targetId]);
  if (!r.rowCount) throw new UserUpdateError("Usuario no encontrado");
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "user.unlocked", entityType: "user", entityId: targetId });
}

export class PasswordChangeError extends Error {
  override name = "UserUpdateError"; // se muestra como mensaje visible en `guarded`
}

/** Cambio de clave propio: exige la actual (los fallos cuentan para el bloqueo), cierra las demás sesiones y libera la actual. */
export async function changeOwnPassword(me: { userId: string; email: string; sessionId: string }, current: string, next: string): Promise<void> {
  const row = (await pool().query<{ password_hash: string | null; locked_until: Date | null }>(`SELECT password_hash, locked_until FROM users WHERE id = $1`, [me.userId])).rows[0];
  if (!row) throw new PasswordChangeError("Usuario no encontrado");
  if (row.locked_until && row.locked_until.getTime() > Date.now()) throw new PasswordChangeError("Demasiados intentos. Inténtalo más tarde.");
  if (current.length > PASSWORD_MAX_LENGTH || !(await verifyPassword(current, row.password_hash))) {
    await registerFailure(me.userId);
    await audit({ actorId: me.userId, actorEmail: me.email, action: "auth.password_change_failed", entityType: "user", entityId: me.userId });
    throw new PasswordChangeError("La clave actual no es correcta.");
  }
  const policy = passwordPolicyError(next, me.email);
  if (policy) throw new PasswordChangeError(policy);
  if (next === current) throw new PasswordChangeError("La clave nueva debe ser distinta de la actual.");
  const hash = await hashPassword(next);
  await withTransaction(async (c) => {
    await c.query(`UPDATE users SET password_hash = $2, password_set_at = now(), must_change_password = false, failed_attempts = 0, locked_until = NULL WHERE id = $1`, [me.userId, hash]);
    await c.query(`UPDATE sessions SET restricted = false WHERE id = $1`, [me.sessionId]);
    await audit({ actorId: me.userId, actorEmail: me.email, action: "auth.password_changed", entityType: "user", entityId: me.userId }, c);
  });
  await revokeUserSessions(me.userId, me.sessionId);
}

/** Solo para el comando local `npm run user:create` (primer administrador). No pasa por permisos: quien ejecuta ya tiene acceso al servidor. */
export async function createUserFromCli(input: { email: string; name: string; role: Role; password: string | null }): Promise<CreatedUser> {
  const email = normalizeEmail(input.email);
  if (!EMAIL_RE.test(email)) throw new UserUpdateError("Correo inválido");
  if (!ROLES.includes(input.role)) throw new UserUpdateError("Rol inválido");
  const temp = input.password === null;
  const password = input.password ?? generateTempPassword();
  if (!temp) {
    const policy = passwordPolicyError(password, email);
    if (policy) throw new UserUpdateError(policy);
  }
  const hash = await hashPassword(password);
  const id = await withTransaction(async (c) => {
    const r = await c.query<{ id: string }>(
      `INSERT INTO users (email, name, role, password_hash, password_set_at, must_change_password) VALUES ($1,$2,$3::user_role,$4,now(),$5)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, password_set_at = now(), must_change_password = EXCLUDED.must_change_password,
         role = EXCLUDED.role, active = true, failed_attempts = 0, locked_until = NULL RETURNING id`,
      [email, input.name.trim().slice(0, 100), input.role, hash, temp]);
    await audit({ actorId: null, actorEmail: "cli", action: "user.created_cli", entityType: "user", entityId: r.rows[0]!.id, metadata: { role: input.role, temporary: temp } }, c);
    return r.rows[0]!.id;
  });
  await revokeUserSessions(id);
  return { userId: id, email, tempPassword: temp ? password : "" };
}
