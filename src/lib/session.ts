import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { pool } from "./db";
import { env } from "./env";
import { parseUiPrefs, type UiPrefs } from "./nav";
import type { Role } from "./rbac";

export const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;
export const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;

export function sessionCookieName(): string {
  // El prefijo __Host- exige Secure, Path=/ y sin Domain: solo se usa donde hay HTTPS.
  return env().NODE_ENV === "production" ? "__Host-radar_session" : "radar_session";
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export const hashToken = (token: string): Buffer => createHash("sha256").update(token).digest();

export interface SessionUser {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  role: Role;
  csrfSecret: string;
  /** Sesión que solo puede cambiar la clave temporal. */
  restricted: boolean;
  uiPrefs: UiPrefs;
}

export async function createSession(userId: string, userAgent: string | null, opts: { restricted?: boolean } = {}) {
  const token = randomBytes(32).toString("base64url");
  const csrfSecret = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_ABSOLUTE_MS);
  await pool().query(
    `INSERT INTO sessions (user_id, token_hash, csrf_secret, expires_at, user_agent, restricted)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, hashToken(token), csrfSecret, expiresAt, userAgent?.slice(0, 300) ?? null, opts.restricted ?? false],
  );
  return { token, expiresAt };
}

/**
 * Por defecto una sesión restringida (clave temporal sin cambiar) se trata como inexistente: así ninguna ruta que
 * olvide comprobarlo deja pasar a ese usuario. Solo el cambio de clave y el cierre de sesión piden `allowRestricted`.
 */
export async function getSessionUser(token: string | undefined, opts: { allowRestricted?: boolean } = {}): Promise<SessionUser | null> {
  const real = await getRealSessionUser(token, opts);
  if (real || env().LOCAL_MODE !== "true") return real;
  return localUser();
}

/**
 * Modo local (LOCAL_MODE=true, nunca en producción): sin pantalla de acceso, se actúa como el primer administrador activo.
 * No escribe nada; si no hay administradores, no hay sesión y se pide acceso como siempre.
 */
export async function localUser(): Promise<SessionUser | null> {
  const r = await pool().query<{ id: string; email: string; name: string; role: Role; ui_prefs: unknown }>(
    `SELECT id, email, name, role, ui_prefs FROM users WHERE role = 'admin' AND active ORDER BY created_at LIMIT 1`);
  const u = r.rows[0];
  if (!u) return null;
  return {
    sessionId: "00000000-0000-0000-0000-000000000000", userId: u.id, email: u.email, name: u.name, role: u.role,
    csrfSecret: createHash("sha256").update(`local:${env().SESSION_SECRET}`).digest("base64url"), restricted: false, uiPrefs: parseUiPrefs(u.ui_prefs),
  };
}

async function getRealSessionUser(token: string | undefined, opts: { allowRestricted?: boolean } = {}): Promise<SessionUser | null> {
  if (!token || token.length > 200) return null;
  const res = await pool().query<{
    id: string;
    user_id: string;
    email: string;
    name: string;
    role: Role;
    csrf_secret: string;
    restricted: boolean;
    ui_prefs: unknown;
  }>(
    `SELECT s.id, s.user_id, u.email, u.name, u.role, s.csrf_secret, s.restricted, u.ui_prefs
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND s.last_seen_at > now() - ($2::bigint * interval '1 millisecond')
        AND u.active`,
    [hashToken(token), SESSION_IDLE_MS],
  );
  const row = res.rows[0];
  if (!row) return null;
  if (row.restricted && !opts.allowRestricted) return null;
  await pool().query(`UPDATE sessions SET last_seen_at = now() WHERE id = $1`, [row.id]);
  return {
    sessionId: row.id,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    role: row.role,
    csrfSecret: row.csrf_secret,
    restricted: row.restricted,
    uiPrefs: parseUiPrefs(row.ui_prefs),
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await pool().query(`UPDATE sessions SET revoked_at = now() WHERE id = $1`, [sessionId]);
}

export async function revokeUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
  await pool().query(
    `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL AND ($2::uuid IS NULL OR id <> $2)`,
    [userId, exceptSessionId ?? null],
  );
}

/** Token CSRF derivado de la sesión; se incluye en los formularios de rutas API. */
export function csrfToken(csrfSecret: string): string {
  return createHmac("sha256", env().SESSION_SECRET).update(csrfSecret).digest("base64url");
}

export function verifyCsrfToken(csrfSecret: string, provided: string | null | undefined): boolean {
  if (!provided) return false;
  const expected = Buffer.from(csrfToken(csrfSecret));
  const given = Buffer.from(provided);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
