"use server";

import { z } from "zod";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { cancelBatch, createBatch, RegistryError } from "@/lib/registry/import";
import { getBatch } from "@/lib/registry/import";
import { linkRucToCompany, promoteRegistry, type IndustryMode } from "@/lib/registry/service";
import { enqueueRegistryImport } from "@/lib/jobs/queue";
import { CompanyError } from "@/lib/companies/service";
import { setCompanyWebsite, validateWebsite, type WebCheck } from "@/lib/companies/web";

/** Solo se vuelve a pantallas del propio módulo (nunca a una dirección que llegue del formulario sin revisar). */
const safeBack = (v: FormDataEntryValue | null, fallback = "/registry"): string =>
  typeof v === "string" && /^\/registry(\/(imports|\d{11}))?(\?[A-Za-z0-9%=&.+_-]{0,400})?$/.test(v) ? v : fallback;

export async function promoteAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("registry.promote");
  const back = safeBack(formData.get("back"));
  const rucs = formData.getAll("ruc").map(String);
  const modeRaw = String(formData.get("mode") ?? "suggested");
  const mode: IndustryMode = modeRaw === "suggested" || modeRaw === "none" ? modeRaw : { industryId: z.string().uuid().parse(modeRaw) };
  const website = String(formData.get("website") ?? "").trim();
  return guarded(back, async () => {
    // Si se indicó el sitio web, se valida ANTES de promover: una dirección mala no deja una empresa a medias.
    let pre: WebCheck | undefined;
    if (website) {
      if (rucs.length !== 1) throw new CompanyError("El sitio web solo se puede indicar al promover una empresa a la vez");
      pre = await validateWebsite(website);
      if (pre.status === "failed") throw new CompanyError(pre.messages.join(" "));
    }
    const r = await promoteRegistry(toActor(user), rucs, mode);
    let web = "";
    if (pre && r.created[0]) {
      const c = await setCompanyWebsite(toActor(user), r.created[0].companyId, website, undefined, pre);
      web = ` Sitio web guardado (${c.domain}): ${c.messages.join(" ")}`;
    }
    const parts = [`${r.created.length} promovida${r.created.length === 1 ? "" : "s"}${web}`];
    if (r.alreadyInBase.length) parts.push(`${r.alreadyInBase.length} ya estaba${r.alreadyInBase.length === 1 ? "" : "n"} en la base`);
    if (r.needsReview.length) parts.push(`${r.needsReview.length} con nombre parecido a una empresa existente (ábrelas para vincular: ${r.needsReview.map((x) => x.ruc).join(", ")})`);
    if (r.blocked.length) parts.push(`${r.blocked.length} bloqueada${r.blocked.length === 1 ? "" : "s"} (no contactar o cliente activo)`);
    if (r.notFound.length) parts.push(`${r.notFound.length} no encontrada${r.notFound.length === 1 ? "" : "s"}`);
    return parts.join(" · ") + ".";
  });
}

export async function linkAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("registry.promote");
  const d = z.object({ companyId: z.string().uuid(), ruc: z.string().regex(/^\d{11}$/) }).parse(Object.fromEntries(formData));
  return guarded(`/registry/${d.ruc}`, async () => {
    await linkRucToCompany(toActor(user), d.companyId, d.ruc);
    return "RUC vinculado a la empresa existente.";
  });
}

const csv = (v: FormDataEntryValue | null): string[] => String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export async function startImportAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("registry.import");
  const persons = String(formData.get("persons") ?? "juridica");
  const filters = {
    personKinds: persons === "all" ? ["juridica", "natural"] : [persons === "natural" ? "natural" : "juridica"],
    statuses: csv(formData.get("statuses")),
    conditions: csv(formData.get("conditions")),
    ubigeoPrefixes: csv(formData.get("ubigeo")),
    onlyKnownRucs: formData.get("onlyKnown") === "on",
  };
  return guarded("/registry/imports", async () => {
    const b = await createBatch(toActor(user), { fileName: String(formData.get("file") ?? ""), filters, sourceNote: String(formData.get("note") ?? "") });
    await enqueueRegistryImport({ batchId: b.id, requestedBy: user.userId });
    return "Carga en cola. Se procesa en segundo plano (el proceso del worker debe estar activo); el avance se ve abajo.";
  });
}

export async function resumeImportAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("registry.import");
  const id = z.string().uuid().parse(formData.get("id"));
  return guarded("/registry/imports", async () => {
    const b = await getBatch(id);
    if (!b || !["failed", "cancelled", "queued"].includes(b.status)) throw new RegistryError("Solo se reanuda una carga fallida, cancelada o en cola");
    await enqueueRegistryImport({ batchId: id, requestedBy: user.userId });
    return "Reanudación en cola: continúa donde quedó.";
  });
}

export async function cancelImportAction(formData: FormData): Promise<void> {
  const user = await requirePermissionPage("registry.import");
  const id = z.string().uuid().parse(formData.get("id"));
  return guarded("/registry/imports", async () => {
    await cancelBatch(toActor(user), id);
    return "Cancelación solicitada: termina en el siguiente bloque y conserva lo ya cargado.";
  });
}
