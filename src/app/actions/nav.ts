"use server";

import { requireUser } from "@/lib/current-user";
import { saveNavCollapsed } from "@/lib/ui-prefs";

/** Recuerda la preferencia del menú. Solo actúa sobre el usuario de la sesión. */
export async function setNavCollapsed(collapsed: boolean): Promise<void> {
  const user = await requireUser();
  await saveNavCollapsed(user.userId, collapsed === true);
}
