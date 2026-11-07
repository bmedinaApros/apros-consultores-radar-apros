import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, revokeSession, sessionCookieName, verifyCsrfToken } from "@/lib/session";
import { isSameOrigin } from "@/lib/request-guard";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido", { status: 403 });
  const store = await cookies();
  const user = await getSessionUser(store.get(sessionCookieName())?.value);
  const res = NextResponse.redirect(new URL("/login", env().APP_URL), 303);
  if (user) {
    const form = await request.formData();
    if (!verifyCsrfToken(user.csrfSecret, String(form.get("csrf") ?? ""))) {
      return new NextResponse("Token CSRF inválido", { status: 403 });
    }
    await revokeSession(user.sessionId);
    await audit({ actorId: user.userId, actorEmail: user.email, action: "auth.logout", entityType: "user", entityId: user.userId });
  }
  res.cookies.delete(sessionCookieName());
  return res;
}
