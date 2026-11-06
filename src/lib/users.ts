import type { Pool, PoolClient } from "pg";
import { pool, withTransaction } from "./db";
import { audit } from "./audit";
import { env, splitList } from "./env";
import { ROLES, type Role } from "./rbac";
import { revokeUserSessions } from "./session";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  last_login_at: Date | null;
  created_at: Date;
}

type Queryable = Pick<Pool | PoolClient, "query">;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export function isAllowedDomain(email: string, allowed: string[] = splitList(env().AUTH_ALLOWED_DOMAINS)): boolean {
  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  return allowed.includes(email.slice(at + 1).toLowerCase());
}

export async function findUserByEmail(email: string, db: Queryable = pool()): Promise<UserRow | null> {
  const res = await db.query<UserRow>(
    `SELECT id, email, name, role, active, last_login_at, created_at FROM users WHERE email = $1`,
    [normalizeEmail(email)],
  );
  return res.rows[0] ?? null;
}

export class LoginDeniedError extends Error {
  constructor(public reason: "domain" | "inactive" | "unverified") {
    super(`login denegado: ${reason}`);
  }
}

/**
 * Inicio de sesión con Google. Reglas:
 *  - el correo debe estar verificado y pertenecer a un dominio autorizado;
 *  - el primer ingreso crea al usuario como "lectura", salvo los correos de INITIAL_ADMIN_EMAILS;
 *  - un usuario desactivado no puede entrar.
 */
export async function loginWithGoogle(claims: {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}): Promise<UserRow> {
  const email = normalizeEmail(claims.email);
  if (!claims.emailVerified) throw new LoginDeniedError("unverified");
  if (!isAllowedDomain(email)) throw new LoginDeniedError("domain");

  const admins = splitList(env().INITIAL_ADMIN_EMAILS);
  const user = await withTransaction(async (c) => {
    const existing = await findUserByEmail(email, c);
    if (existing && !existing.active) throw new LoginDeniedError("inactive");
    if (existing) {
      await c.query(`UPDATE users SET google_sub = coalesce(google_sub, $2), name = $3, last_login_at = now() WHERE id = $1`, [
        existing.id,
        claims.sub,
        claims.name ?? existing.name,
      ]);
      return existing;
    }
    const role: Role = admins.includes(email) ? "admin" : "read_only";
    const res = await c.query<UserRow>(
      `INSERT INTO users (email, name, role, google_sub, last_login_at) VALUES ($1, $2, $3, $4, now())
       RETURNING id, email, name, role, active, last_login_at, created_at`,
      [email, claims.name ?? "", role, claims.sub],
    );
    const created = res.rows[0]!;
    await audit(
      { actorId: created.id, actorEmail: email, action: "user.created", entityType: "user", entityId: created.id, metadata: { role } },
      c,
    );
    return created;
  });
  await audit({ actorId: user.id, actorEmail: user.email, action: "auth.login", entityType: "user", entityId: user.id });
  return user;
}

export async function listUsers(db: Queryable = pool()): Promise<UserRow[]> {
  const res = await db.query<UserRow>(
    `SELECT id, email, name, role, active, last_login_at, created_at FROM users ORDER BY email`,
  );
  return res.rows;
}

export class UserUpdateError extends Error {
  override name = "UserUpdateError";
}

export async function updateUserAccess(
  actor: { id: string; email: string },
  targetId: string,
  change: { role?: Role; active?: boolean },
): Promise<void> {
  if (change.role !== undefined && !ROLES.includes(change.role)) throw new UserUpdateError("Rol inválido");
  await withTransaction(async (c) => {
    // Bloquea a los administradores para evitar que dos cambios simultáneos dejen el sistema sin ninguno.
    await c.query(`SELECT id FROM users WHERE role = 'admin' FOR UPDATE`);
    const res = await c.query<UserRow>(`SELECT id, email, name, role, active, last_login_at, created_at FROM users WHERE id = $1 FOR UPDATE`, [targetId]);
    const target = res.rows[0];
    if (!target) throw new UserUpdateError("Usuario no encontrado");
    const nextRole = change.role ?? target.role;
    const nextActive = change.active ?? target.active;
    if (target.role === "admin" && (nextRole !== "admin" || !nextActive)) {
      const admins = await c.query<{ n: string }>(`SELECT count(*) AS n FROM users WHERE role = 'admin' AND active`);
      if (Number(admins.rows[0]!.n) <= 1) throw new UserUpdateError("Debe quedar al menos un administrador activo");
    }
    await c.query(`UPDATE users SET role = $2, active = $3 WHERE id = $1`, [targetId, nextRole, nextActive]);
    await audit(
      {
        actorId: actor.id,
        actorEmail: actor.email,
        action: "user.access_changed",
        entityType: "user",
        entityId: targetId,
        metadata: { from: { role: target.role, active: target.active }, to: { role: nextRole, active: nextActive } },
      },
      c,
    );
  });
  // Un cambio de rol o la desactivación cierran las sesiones abiertas del usuario.
  await revokeUserSessions(targetId);
}
