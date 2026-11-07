"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { commitImport, decideRow, discardImport, undoImport } from "@/lib/companies/import";

const base = z.object({ batchId: z.string().uuid() });

export async function decideAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("companies.import");
  const d = base.extend({ rowId: z.string().uuid(), decision: z.enum(["create", "skip", "merge"]) }).parse(Object.fromEntries(formData));
  return guarded(`/companies/import/${d.batchId}`, async () => { await decideRow(toActor(user), d.batchId, d.rowId, d.decision); return "Decisión guardada."; });
}

export async function commitAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("companies.import");
  const d = base.parse(Object.fromEntries(formData));
  return guarded(`/companies/import/${d.batchId}`, async () => {
    const r = await commitImport(toActor(user), d.batchId);
    return `Importación confirmada: ${r.created} creadas, ${r.merged} fusionadas, ${r.skipped} omitidas.`;
  });
}

export async function undoAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("companies.import");
  const d = base.parse(Object.fromEntries(formData));
  return guarded(`/companies/import/${d.batchId}`, async () => {
    const r = await undoImport(toActor(user), d.batchId);
    return `Lote deshecho: ${r.removed} empresas eliminadas, ${r.kept} conservadas porque ya avanzaron.`;
  });
}

export async function discardAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("companies.import");
  const d = base.parse(Object.fromEntries(formData));
  await guarded(`/companies/import/${d.batchId}`, async () => { await discardImport(toActor(user), d.batchId); });
  redirect("/companies/import");
}
