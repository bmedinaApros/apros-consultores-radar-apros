import { NextResponse } from "next/server";
import { env, isDevLoginAllowed } from "@/lib/env";
import { isSameOrigin } from "@/lib/request-guard";
import { findUserByEmail } from "@/lib/users";
import { createSession, sessionCookieName, sessionCookieOptions } from "@/lib/session";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Acceso de desarrollo. Responde 404 en cualquier entorno que no sea desarrollo con la bandera activa. */
export async function POST(request: Request) {
  if (!isDevLoginAllowed(env())) return new NextResponse("No encontrado", { status: 404 });
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido", { status: 403 });
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const user = await findUserByEmail(email);
  if (!user || !user.active) return NextResponse.redirect(new URL("/login?error=usuario_desconocido", env().APP_URL), 303);
  const { token, expiresAt } = await createSession(user.id, request.headers.get("user-agent"));
  await audit({ actorId: user.id, actorEmail: user.email, action: "auth.login_dev", entityType: "user", entityId: user.id });
  const res = NextResponse.redirect(new URL("/", env().APP_URL), 303);
  res.cookies.set(sessionCookieName(), token, sessionCookieOptions(expiresAt));
  return res;
}
