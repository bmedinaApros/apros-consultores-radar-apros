import { NextResponse } from "next/server";
import { loginWithPassword } from "@/lib/auth-password";
import { env } from "@/lib/env";
import { clientKey, passwordLoginLimiter } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request-guard";
import { sessionCookieName, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const back = (error: string) => NextResponse.redirect(new URL(`/login?error=${error}`, env().APP_URL), 303);

/** Inicio de sesión con correo y clave. Mismo origen obligatorio, límite por IP y un único mensaje de error. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido", { status: 403 });
  if (!passwordLoginLimiter.check(clientKey(request)).allowed) return back("demasiados_intentos");
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return back("credenciales_invalidas");
  const r = await loginWithPassword(email, password, request.headers.get("user-agent"));
  if (!r.ok) return back("credenciales_invalidas");
  const res = NextResponse.redirect(new URL(r.mustChange ? "/account/password" : "/", env().APP_URL), 303);
  res.cookies.set(sessionCookieName(), r.token, sessionCookieOptions(r.expiresAt));
  return res;
}
