"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createUserWithTempPassword, resetPassword, unlockUser } from "@/lib/auth-password";
import { requireUser } from "@/lib/current-user";
import { ROLES, requirePermission } from "@/lib/rbac";
import { UserUpdateError, updateUserAccess } from "@/lib/users";

const schema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ROLES),
  active: z.enum(["true", "false"]),
});

export async function saveUserAccess(formData: FormData): Promise<void> {
  const actor = await requireUser();
  requirePermission(actor, "users.manage"); // la autorización se vuelve a comprobar en el servidor
  const parsed = schema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    active: formData.get("active"),
  });
  if (!parsed.success) redirect("/admin/users?error=datos_invalidos");
  try {
    await updateUserAccess({ id: actor.userId, email: actor.email }, parsed.data.userId, {
      role: parsed.data.role,
      active: parsed.data.active === "true",
    });
  } catch (e) {
    if (e instanceof UserUpdateError) redirect(`/admin/users?error=${encodeURIComponent(e.message)}`);
    throw e;
  }
  revalidatePath("/admin/users");
  redirect("/admin/users?ok=1");
}

/** Estado que devuelven las acciones con clave temporal: la clave solo existe en esta respuesta, nunca en la URL ni en el registro. */
export interface TempState { error?: string; email?: string; tempPassword?: string }

export async function createUserAction(_prev: TempState, formData: FormData): Promise<TempState> {
  const actor = await requireUser();
  requirePermission(actor, "users.manage");
  const d = z.object({ email: z.string().max(254), name: z.string().max(100), role: z.enum(ROLES) }).safeParse(Object.fromEntries(formData));
  if (!d.success) return { error: "Datos inválidos" };
  try {
    const r = await createUserWithTempPassword({ id: actor.userId, email: actor.email, role: actor.role }, d.data);
    revalidatePath("/admin/users");
    return { email: r.email, tempPassword: r.tempPassword };
  } catch (e) {
    if (e instanceof UserUpdateError) return { error: e.message };
    throw e;
  }
}

export async function resetPasswordAction(_prev: TempState, formData: FormData): Promise<TempState> {
  const actor = await requireUser();
  requirePermission(actor, "users.manage");
  const id = z.string().uuid().safeParse(formData.get("userId"));
  if (!id.success) return { error: "Datos inválidos" };
  try {
    const r = await resetPassword({ id: actor.userId, email: actor.email, role: actor.role }, id.data);
    revalidatePath("/admin/users");
    return { email: r.email, tempPassword: r.tempPassword };
  } catch (e) {
    if (e instanceof UserUpdateError) return { error: e.message };
    throw e;
  }
}

export async function unlockAction(formData: FormData): Promise<void> {
  const actor = await requireUser();
  requirePermission(actor, "users.manage");
  const id = z.string().uuid().parse(formData.get("userId"));
  try {
    await unlockUser({ id: actor.userId, email: actor.email, role: actor.role }, id);
  } catch (e) {
    if (e instanceof UserUpdateError) redirect(`/admin/users?error=${encodeURIComponent(e.message)}`);
    throw e;
  }
  revalidatePath("/admin/users");
  redirect("/admin/users?ok=1");
}
