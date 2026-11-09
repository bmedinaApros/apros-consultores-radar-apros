import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionUser, sessionCookieName } from "@/lib/session";
import { ForbiddenError } from "@/lib/rbac";
import { DiagnosticError, loadExportable, recordExport } from "@/lib/diagnostics/service";
import { PdfOverflowError, renderPdf } from "@/lib/diagnostics/export-pdf";
import { renderReport } from "@/lib/diagnostics/export-report";
import { renderPptx } from "@/lib/diagnostics/export-pptx";
import { createRateLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const limiter = createRateLimiter(60, 60 * 60 * 1000);
const MIME = { pdf: "application/pdf", informe: "application/pdf", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation" } as const;

/**
 * Descarga del diagnóstico. Toda la verificación (aprobado, versión vigente, sin marcas, evidencia al día, permiso y
 * visibilidad) ocurre aquí en el servidor: ocultar el botón no es un control.
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  const user = await getSessionUser(store.get(sessionCookieName())?.value);
  if (!user) return new NextResponse("No autenticado", { status: 401 });
  const { id } = await ctx.params;
  const format = z.enum(["pdf", "pptx", "informe"]).safeParse(new URL(request.url).searchParams.get("format"));
  if (!z.string().uuid().safeParse(id).success || !format.success) return new NextResponse("Solicitud inválida", { status: 400 });
  if (!limiter.check(user.userId).allowed) return new NextResponse("Demasiadas exportaciones; intenta más tarde", { status: 429 });
  const actor = { id: user.userId, email: user.email, role: user.role };
  try {
    const x = await loadExportable(actor, id);
    const bytes = format.data === "pdf" ? await renderPdf(x) : format.data === "informe" ? await renderReport(x) : await renderPptx(x);
    await recordExport(actor, { diagnosticId: id, versionId: x.versionId, format: format.data, bytes });
    const ext = format.data === "pptx" ? "pptx" : "pdf";
    const prefix = format.data === "informe" ? "informe" : "diagnostico";
    const base = x.companyName.normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "empresa";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "content-type": MIME[format.data],
        "content-disposition": `attachment; filename="${prefix}-${base}-v${x.version}.${ext}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (e) {
    if (e instanceof ForbiddenError) return new NextResponse("Sin permiso", { status: 403 });
    if (e instanceof DiagnosticError) return new NextResponse(e.message, { status: e.message.includes("no encontrado") ? 404 : 409 });
    if (e instanceof PdfOverflowError) return new NextResponse("El texto es demasiado largo para una página: acórtalo antes de exportar", { status: 422 });
    throw e;
  }
}
