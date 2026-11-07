import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser, sessionCookieName, type SessionUser } from "./session";
import { can, type Permission } from "./rbac";

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  return getSessionUser(store.get(sessionCookieName())?.value);
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Para páginas y acciones: sin permiso se redirige; la comprobación real vive en el servidor. */
export async function requirePermissionPage(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect("/?denegado=1");
  return user;
}
