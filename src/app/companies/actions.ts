"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { guarded, toActor } from "@/lib/actor";
import { requireUser } from "@/lib/current-user";
import { createCompany, PossibleDuplicateError, updateCompany, classifyCompany, getCompany, CompanyError } from "@/lib/companies/service";
import { ForbiddenError } from "@/lib/rbac";
import { canAnalyze } from "@/lib/analyzer/service";
import { createRateLimiter } from "@/lib/rate-limit";
import { enqueueAnalysis } from "@/lib/jobs/queue";
import { revalidateCompanyWebsite, setCompanyWebsite } from "@/lib/companies/web";

const str = z.string().max(300).optional().default("");
const createSchema = z.object({
  legal_name: str, trade_name: str, website: str, ruc: str, industry: str, subindustry: str, city: str, owner_email: str,
  confirm: z.string().optional(),
});

export async function createCompanyAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const data = createSchema.parse(Object.fromEntries(formData));
  const { confirm, ...raw } = data;
  let newId: string | null = null;
  const qs = new URLSearchParams(Object.entries(raw).filter(([, v]) => v));
  try {
    const r = await createCompany(toActor(user), raw, { confirmPossibleDuplicate: confirm === "1" });
    newId = r.id;
  } catch (e) {
    if (e instanceof PossibleDuplicateError) {
      qs.set("confirmar", "1");
      qs.set("error", `${e.message}. Si de verdad es otra empresa, confirma abajo.`);
      redirect(`/companies/new?${qs}`);
    }
    return guarded(`/companies/new?${qs}`, async () => { throw e; });
  }
  redirect(`/companies/${newId}?ok=${encodeURIComponent("Empresa creada.")}`);
}

const updateSchema = z.object({
  id: z.string().uuid(), legal_name: str, trade_name: str, website: str, ruc: str, subindustry: str, city: str,
  industryId: z.string().uuid().or(z.literal("")).optional().default(""),
  ownerId: z.string().uuid().or(z.literal("")).optional().default(""),
});

export async function updateCompanyAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const d = updateSchema.parse(Object.fromEntries(formData));
  return guarded(`/companies/${d.id}`, async () => {
    await updateCompany(toActor(user), d.id, {
      legal_name: d.legal_name, trade_name: d.trade_name, website: d.website, ruc: d.ruc, subindustry: d.subindustry, city: d.city,
      industryId: d.industryId || null, ownerId: d.ownerId || null,
    });
  });
}

export async function classifyAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const d = z.object({ id: z.string().uuid(), industryId: z.string().uuid(), back: z.string().startsWith("/companies").max(300).optional() }).parse(Object.fromEntries(formData));
  return guarded(d.back ?? `/companies/${d.id}`, async () => {
    await classifyCompany(toActor(user), d.id, d.industryId);
    return "Rubro confirmado.";
  });
}

const analysisLimiter = createRateLimiter(30, 60 * 60 * 1000);

/** Encola un análisis web. El trabajo lo ejecuta el worker; aquí solo se valida permiso y se limita la tasa. */
export async function analyzeAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const d = z.object({ id: z.string().uuid(), force: z.enum(["1", "0"]).default("0") }).parse(Object.fromEntries(formData));
  return guarded(`/companies/${d.id}`, async () => {
    const company = await getCompany(d.id);
    if (!company) throw new CompanyError("Empresa no encontrada");
    if (!canAnalyze({ id: user.userId, role: user.role }, company)) throw new ForbiddenError("No puedes analizar esta empresa");
    if (!company.domain) throw new CompanyError("La empresa no tiene sitio web conocido");
    if (company.blocked) throw new CompanyError("La empresa está en la lista de no contactar");
    if (!analysisLimiter.check(user.userId).allowed) throw new CompanyError("Demasiados análisis solicitados; intenta más tarde");
    const id = await enqueueAnalysis({ companyId: d.id, triggeredBy: user.userId, force: d.force === "1" });
    return id ? "Análisis encolado. Se ejecuta en segundo plano (el worker debe estar corriendo)." : "Ya hay un análisis pendiente para esta empresa.";
  });
}

import { MANUAL_CRITERIA } from "@/lib/scoring/model";
import { latestManual, scoreCompany, setManualCriterion, setScoreAdjustment } from "@/lib/scoring/service";

/** Guarda los criterios manuales que cambiaron (no se infieren de la web; quedan etiquetados como manuales). */
export async function manualCriteriaAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = z.string().uuid().parse(formData.get("id"));
  return guarded(`/companies/${id}`, async () => {
    const current = await latestManual(id);
    let changed = 0;
    for (const c of MANUAL_CRITERIA) {
      const v = String(formData.get(c.key) ?? "");
      if (v !== (current[c.key] ?? "")) { await setManualCriterion(toActor(user), id, c.key, v); changed++; }
    }
    if (changed) await scoreCompany(id);
    return changed ? `${changed} criterio(s) manual(es) guardado(s) y puntaje recalculado.` : "No hubo cambios.";
  });
}

export async function adjustmentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const d = z.object({ id: z.string().uuid(), delta: z.coerce.number().min(-50).max(50), reason: z.string().max(300) }).parse(Object.fromEntries(formData));
  return guarded(`/companies/${d.id}`, async () => {
    await setScoreAdjustment(toActor(user), d.id, d.delta, d.reason);
    await scoreCompany(d.id);
    return d.delta === 0 ? "Ajuste retirado." : "Ajuste guardado y puntaje recalculado.";
  });
}

export async function recomputeScoreAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = z.string().uuid().parse(formData.get("id"));
  return guarded(`/companies/${id}`, async () => {
    const company = await getCompany(id);
    if (!company) throw new CompanyError("Empresa no encontrada");
    if (!canAnalyze({ id: user.userId, role: user.role }, company)) throw new ForbiddenError("No puedes recalcular esta empresa");
    const r = await scoreCompany(id);
    return !r ? "Aún no hay análisis completado: no se puede puntuar." : r.created ? "Puntaje recalculado." : "El puntaje ya estaba al día (nada cambió).";
  });
}

const webLimiter = createRateLimiter(60, 60 * 60 * 1000);

/** Ingreso rápido del sitio web: valida (DNS, robots, portada) y, si el dominio es consultable, lo asigna. */
export async function setWebsiteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const d = z.object({ id: z.string().uuid(), website: z.string().max(300) }).parse(Object.fromEntries(formData));
  return guarded(`/companies/${d.id}`, async () => {
    if (!webLimiter.check(user.userId).allowed) throw new CompanyError("Demasiadas comprobaciones de sitios web; intenta más tarde");
    const r = await setCompanyWebsite(toActor(user), d.id, d.website);
    return `Sitio web guardado: ${r.domain}. ${r.messages.join(" ")}`;
  });
}

export async function revalidateWebsiteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = z.string().uuid().parse(formData.get("id"));
  return guarded(`/companies/${id}`, async () => {
    if (!webLimiter.check(user.userId).allowed) throw new CompanyError("Demasiadas comprobaciones de sitios web; intenta más tarde");
    const r = await revalidateCompanyWebsite(toActor(user), id);
    return `Sitio comprobado: ${r.messages.join(" ")}`;
  });
}
