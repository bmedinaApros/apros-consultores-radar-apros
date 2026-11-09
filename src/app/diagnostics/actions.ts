"use server";
import { z } from "zod";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { enqueueDiagnostic } from "@/lib/jobs/queue";
import { loadContext, companiesNeedingDiagnostic, DiagnosticError, generateDiagnostic } from "@/lib/diagnostics/service";
import { getAiSettings } from "@/lib/diagnostics/budget";
import { resolveProvider } from "@/lib/diagnostics/ai";

async function ensureReady(): Promise<void> {
  resolveProvider(); // siempre hay generador: plantillas y reglas por defecto
  if (!(await getAiSettings()).enabled) throw new DiagnosticError("La generación de diagnósticos está desactivada en Configuración → Diagnósticos: reglas e IA.");
}

/**
 * Genera el diagnóstico de una empresa. Con plantillas y reglas (lo normal) es instantáneo: se genera aquí mismo, se abre
 * el diagnóstico y cualquier problema se muestra en pantalla. Con IA (opcional) puede tardar y se hace en segundo plano.
 */
export async function generateOneAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("diagnostics.write");
  const companyId = z.string().uuid().parse(formData.get("companyId"));
  return guarded(`/companies/${companyId}`, async () => {
    await ensureReady();
    await loadContext(companyId); // falla con un mensaje claro si no hay evidencia, está en no contactar, etc.
    if (resolveProvider().id === "rules") {
      const r = await generateDiagnostic(toActor(user), companyId);
      const marks = r.blocking > 0 ? ` Tiene ${r.blocking} afirmaciones marcadas por resolver.` : "";
      return { to: `/diagnostics/${r.diagnosticId}`, ok: `Diagnóstico generado con plantillas y reglas (versión ${r.version}). Revísalo, envíalo a revisión y apruébalo para poder descargarlo.${marks}` };
    }
    await enqueueDiagnostic({ companyId, requestedBy: user.userId });
    return "Diagnóstico con IA en preparación. Aparecerá en Diagnósticos en unos segundos (el proceso de segundo plano debe estar activo).";
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
    if (resolveProvider().id === "rules") {
      let ok = 0;
      const why: string[] = [];
      for (const t of todo) {
        try { await generateDiagnostic(toActor(user), t.companyId); ok++; }
        catch (e) { if (e instanceof DiagnosticError) why.push(`${t.name}: ${e.message}`); else throw e; }
      }
      return `Se generaron ${ok} de ${todo.length} diagnósticos con plantillas y reglas. Los encuentras en Analizar → Diagnósticos.${why.length ? ` No se pudieron generar: ${why.slice(0, 3).join(" · ")}${why.length > 3 ? " …" : ""}` : ""}`;
    }
    for (const t of todo) await enqueueDiagnostic({ companyId: t.companyId, requestedBy: user.userId });
    return `Se pusieron en cola ${todo.length} diagnósticos con IA (máximo 30 por lote). Se generan de a uno, respetando el presupuesto diario.`;
  });
}
