import { NextResponse } from "next/server";
import { OIDC_COOKIE, googleConfigured, startAuthorization } from "@/lib/google";
import { clientKey, loginLimiter } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!loginLimiter.check(clientKey(request)).allowed) return new NextResponse("Demasiados intentos", { status: 429 });
  if (!googleConfigured()) return NextResponse.redirect(new URL("/login?error=google_no_configurado", env().APP_URL));
  const { url, cookie } = await startAuthorization();
  const res = NextResponse.redirect(url);
  res.cookies.set(OIDC_COOKIE, cookie, {
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
