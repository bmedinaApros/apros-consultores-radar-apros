import { NextResponse } from "next/server";
import { OIDC_COOKIE, finishAuthorization, unpackState } from "@/lib/google";
import { LoginDeniedError, loginWithGoogle } from "@/lib/users";
import { createSession, sessionCookieName, sessionCookieOptions } from "@/lib/session";
import { audit } from "@/lib/audit";
import { clientKey, loginLimiter } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

const back = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, env().APP_URL));

export async function GET(request: Request) {
  if (!loginLimiter.check(clientKey(request)).allowed) return new NextResponse("Demasiados intentos", { status: 429 });
  const cookieHeader = request.headers.get("cookie") ?? "";
  const raw = cookieHeader.split(/;\s*/).find((c) => c.startsWith(`${OIDC_COOKIE}=`))?.slice(OIDC_COOKIE.length + 1);
  const saved = unpackState(raw);
  if (!saved) return back("sesion_expirada");

  try {
    // Se reconstruye la URL con APP_URL para no confiar en el encabezado Host.
    const incoming = new URL(request.url);
    const current = new URL(incoming.pathname + incoming.search, env().APP_URL);
    const claims = await finishAuthorization(current, saved);
    const user = await loginWithGoogle(claims);
    const { token, expiresAt } = await createSession(user.id, request.headers.get("user-agent"));
    const res = NextResponse.redirect(new URL("/", env().APP_URL));
    res.cookies.set(sessionCookieName(), token, sessionCookieOptions(expiresAt));
    res.cookies.delete({ name: OIDC_COOKIE, path: "/api/auth/google" });
    return res;
  } catch (e) {
    if (e instanceof LoginDeniedError) {
      await audit({ action: "auth.login_denied", metadata: { reason: e.reason } });
      return back(e.reason === "domain" ? "dominio_no_autorizado" : e.reason === "inactive" ? "usuario_inactivo" : "correo_no_verificado");
    }
    log("error", "fallo en callback de Google", { error: e instanceof Error ? e.message : "desconocido" });
    return back("error_de_acceso");
  }
}
