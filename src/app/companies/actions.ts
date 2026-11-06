"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { guarded, toActor } from "@/lib/actor";
import { requireUser } from "@/lib/current-user";
import { createCompany, PossibleDuplicateError, updateCompany, classifyCompany } from "@/lib/companies/service";

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
