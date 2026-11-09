import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser, sessionCookieName, type SessionUser } from "./session";
import { can, type Permission } from "./rbac";

/** Usuario con sesión completa. Una sesión restringida (clave temporal sin cambiar) cuenta como sin sesión. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  return getSessionUser(store.get(sessionCookieName())?.value);
});

/** Solo para la pantalla de cambio de clave: también acepta la sesión restringida. */
export const getCurrentUserAllowRestricted = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  return getSessionUser(store.get(sessionCookieName())?.value, { allowRestricted: true });
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user) return user;
  // Quien tiene clave temporal solo puede ir a cambiarla.
  redirect((await getCurrentUserAllowRestricted()) ? "/account/password" : "/login");
}

/** Para páginas y acciones: sin permiso se redirige; la comprobación real vive en el servidor. */
export async function requirePermissionPage(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect("/?denegado=1");
  return user;
}
