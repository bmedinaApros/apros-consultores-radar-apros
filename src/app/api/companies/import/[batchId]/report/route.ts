import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionUser, sessionCookieName } from "@/lib/session";
import { can } from "@/lib/rbac";
import { errorReportCsv } from "@/lib/companies/import";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ batchId: string }> }) {
  const store = await cookies();
  const user = await getSessionUser(store.get(sessionCookieName())?.value);
  if (!user) return new NextResponse("No autenticado", { status: 401 });
  if (!can(user.role, "companies.import")) return new NextResponse("Sin permiso", { status: 403 });
  const { batchId } = await ctx.params;
  if (!z.string().uuid().safeParse(batchId).success) return new NextResponse("No encontrado", { status: 404 });
  const csv = await errorReportCsv(batchId);
  await audit({ actorId: user.userId, actorEmail: user.email, action: "export.import_report", entityType: "import_batch", entityId: batchId });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="informe-importacion-${batchId.slice(0, 8)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
