import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, sessionCookieName } from "@/lib/session";
import { can } from "@/lib/rbac";
import { pool } from "@/lib/db";
import { searchRegistry } from "@/lib/registry/service";
import { registryParams } from "@/lib/registry/params";
import { csvCell, EXPORT_MAX } from "@/lib/registry/csv";
import { createRateLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const limiter = createRateLimiter(30, 60 * 60 * 1000);

/** Descarga de los resultados de una búsqueda (hasta 5.000 filas) en CSV abierto por Excel. */
export async function GET(request: Request) {
  const store = await cookies();
  const user = await getSessionUser(store.get(sessionCookieName())?.value);
  if (!user) return new NextResponse("No autenticado", { status: 401 });
  if (!can(user.role, "registry.read")) return new NextResponse("Sin permiso", { status: 403 });
  if (!limiter.check(user.userId).allowed) return new NextResponse("Demasiadas descargas; intenta más tarde", { status: 429 });
  const url = new URL(request.url);
  const q: Record<string, string | undefined> = {};
  for (const [k, v] of url.searchParams) if (k !== "after") q[k] = v;
  const depts = (await pool().query<{ code: string; department: string }>(`SELECT code, department FROM ubigeo WHERE length(code) = 2`)).rows;
  const { filters } = registryParams(q, depts);
  if (!filters) return new NextResponse("Filtros inválidos", { status: 400 });

  const rows: Awaited<ReturnType<typeof searchRegistry>>["rows"] = [];
  let after: string | undefined;
  let truncated = false;
  while (rows.length < EXPORT_MAX) {
    const page = await searchRegistry({ ...filters, after }, { pageSize: 500, skipTotal: true });
    rows.push(...page.rows);
    if (!page.nextAfter) break;
    after = page.nextAfter;
    if (rows.length >= EXPORT_MAX) truncated = true;
  }
  const out = rows.slice(0, EXPORT_MAX);
  const head = ["RUC", "Razón social", "Estado", "Condición", "Departamento", "Dirección", "Rubro sugerido", "En la base", "No contactar", "Cliente activo"];
  const lines = [head.join(",")];
  for (const r of out) {
    lines.push([r.ruc, r.legal_name, r.status, r.condition, r.department, r.address, r.suggested_industry_name, r.company_id ? "Sí" : "No", r.dnc ? "Sí" : "", r.client ? "Sí" : ""].map((c) => csvCell(c)).join(","));
  }
  if (truncated) lines.push(csvCell(`Se muestran las primeras ${EXPORT_MAX} filas. Afina la búsqueda para ver el resto.`));
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="radar-busqueda-${stamp}.csv"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
