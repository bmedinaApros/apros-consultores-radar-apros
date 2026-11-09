"use server";
import { z } from "zod";
import { guarded } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { enqueueDiagnostic } from "@/lib/jobs/queue";
import { loadContext, companiesNeedingDiagnostic, DiagnosticError } from "@/lib/diagnostics/service";
import { getAiSettings } from "@/lib/diagnostics/budget";
import { resolveProvider } from "@/lib/diagnostics/ai";

async function ensureReady(): Promise<void> {
  resolveProvider(); // siempre hay generador: plantillas y reglas por defecto
  if (!(await getAiSettings()).enabled) throw new DiagnosticError("La generación de diagnósticos está desactivada en Configuración → Diagnósticos: reglas e IA.");
}

/** Genera (en segundo plano) el diagnóstico de una empresa. Las comprobaciones previas se muestran de inmediato. */
export async function generateOneAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("diagnostics.write");
  const companyId = z.string().uuid().parse(formData.get("companyId"));
  return guarded(`/companies/${companyId}`, async () => {
    await ensureReady();
    await loadContext(companyId); // falla con un mensaje claro si no hay evidencia, está en no contactar, etc.
    await enqueueDiagnostic({ companyId, requestedBy: user.userId });
    return "Diagnóstico en preparación. Aparecerá en Diagnósticos en unos segundos (el proceso de segundo plano debe estar activo).";
  });
}

/** Lote para el piloto: empresas aprobadas de una lista que aún no tienen diagnóstico (máximo 30). */
export async function generateBatchAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("diagnostics.write");
  const listId = z.string().uuid().parse(formData.get("listId"));
  return guarded(`/weekly/${listId}`, async () => {
    await ensureReady();
    const todo = await companiesNeedingDiagnostic(listId);
    if (todo.length === 0) throw new DiagnosticError("No hay empresas aprobadas sin diagnóstico en esta lista.");
    for (const t of todo) await enqueueDiagnostic({ companyId: t.companyId, requestedBy: user.userId });
    return `Se pusieron en cola ${todo.length} diagnósticos (máximo 30 por lote). Se generan de a uno, respetando el presupuesto diario.`;
  });
}
