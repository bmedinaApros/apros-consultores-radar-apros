import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { can } from "@/lib/rbac";
import { createRateLimiter } from "@/lib/rate-limit";
import { searchCompanies } from "@/lib/search";
import { getSessionUser, sessionCookieName } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const limiter = createRateLimiter(120, 60 * 1000);

/** Búsqueda global del encabezado. Sesión completa y permiso de lectura obligatorios; límite por usuario. */
export async function GET(request: Request) {
  const store = await cookies();
  const user = await getSessionUser(store.get(sessionCookieName())?.value);
  if (!user) return new NextResponse("No autenticado", { status: 401 });
  if (!can(user.role, "companies.read")) return new NextResponse("Sin permiso", { status: 403 });
  if (!limiter.check(user.userId).allowed) return new NextResponse("Demasiadas búsquedas; espera un momento", { status: 429 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const hits = await searchCompanies(q);
  return NextResponse.json({ hits }, { headers: { "cache-control": "private, no-store" } });
}
