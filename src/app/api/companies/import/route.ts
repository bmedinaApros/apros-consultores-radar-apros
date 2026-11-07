import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, sessionCookieName } from "@/lib/session";
import { isSameOrigin } from "@/lib/request-guard";
import { can } from "@/lib/rbac";
import { CSV_LIMITS, CsvError, decodeUpload } from "@/lib/companies/csv";
import { previewImport } from "@/lib/companies/import";
import { createRateLimiter } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const importLimiter = createRateLimiter(20, 60 * 60 * 1000);
const back = (msg: string) => NextResponse.redirect(new URL(`/companies/import?error=${encodeURIComponent(msg)}`, env().APP_URL), 303);

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido", { status: 403 });
  const store = await cookies();
  const user = await getSessionUser(store.get(sessionCookieName())?.value);
  if (!user) return new NextResponse("No autenticado", { status: 401 });
  if (!can(user.role, "companies.import")) return new NextResponse("Sin permiso", { status: 403 });
  if (!importLimiter.check(user.userId).allowed) return new NextResponse("Demasiadas importaciones; intenta más tarde", { status: 429 });

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > CSV_LIMITS.maxBytes + 4096) return back("El archivo supera los 5 MB");

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return back("Selecciona un archivo CSV");
    const text = decodeUpload(new Uint8Array(await file.arrayBuffer()), file.name);
    const summary = await previewImport({ id: user.userId, email: user.email }, file.name, text);
    return NextResponse.redirect(new URL(`/companies/import/${summary.id}`, env().APP_URL), 303);
  } catch (e) {
    if (e instanceof CsvError) return back(e.message);
    throw e;
  }
}
