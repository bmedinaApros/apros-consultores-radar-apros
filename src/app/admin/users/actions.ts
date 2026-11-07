"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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
