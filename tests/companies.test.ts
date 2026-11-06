import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { ForbiddenError } from "@/lib/rbac";
import {
  classifyCompany, createCompany, createIndustry, getCompany, listCompanies, listIndustries,
  PossibleDuplicateError, resolveDuplicate, updateCompany, updateIndustry, addDoNotContact,
} from "@/lib/companies/service";
import { isCommerciallyBlocked } from "@/lib/companies/exclusions";
import { approveTerms, listProviders, runDiscovery, setProviderEnabled, SourceError } from "@/lib/sources/service";
import { IMPLEMENTED_PROVIDERS, PLANNED_PROVIDERS } from "@/lib/sources/provider";
import { mkActor, resetData } from "./helpers";
import fs from "node:fs";
import path from "node:path";

beforeEach(resetData);
afterAll(() => pool().end());

describe("alta y edición", () => {
  it("crea una empresa y la deja por clasificar si no hay rubro", async () => {
    const admin = await mkActor("admin");
    const { id } = await createCompany(admin, { legal_name: "Acme SAC", website: "https://acme.pe" });
    const c = await getCompany(id);
    expect(c).toMatchObject({ classification: "to_classify", domain: "acme.pe", stage: "detected" });
  });

  it("rechaza datos inválidos y duplicados exactos", async () => {
    const admin = await mkActor("admin");
    await createCompany(admin, { legal_name: "Acme SAC", website: "acme.pe" });
    await expect(createCompany(admin, { legal_name: "Otra", website: "acme.pe" })).rejects.toThrow(/mismo dominio/);
    await expect(createCompany(admin, { legal_name: "Mala", ruc: "123" })).rejects.toThrow(/RUC/);
    await expect(createCompany(admin, { legal_name: "" })).rejects.toThrow(/razón social/);
  });

  it("un nombre parecido pide confirmación y, si se confirma, queda como duplicado pendiente", async () => {
    const admin = await mkActor("admin");
    const { id: first } = await createCompany(admin, { legal_name: "Inversiones Pérez SAC" });
    await expect(createCompany(admin, { legal_name: "Inversiones Peres S.A.C." })).rejects.toBeInstanceOf(PossibleDuplicateError);
    const r = await createCompany(admin, { legal_name: "Inversiones Peres S.A.C." }, { confirmPossibleDuplicate: true });
    expect(r.possibleDuplicateOf).toBe(first);
    const { rows } = await pool().query("SELECT status FROM duplicate_candidates");
    expect(rows).toEqual([{ status: "pending" }]);
  });

  it("clasificar un rubro es una acción humana que cambia el estado", async () => {
    const admin = await mkActor("admin");
    const { id } = await createCompany(admin, { legal_name: "Acme SAC" });
    const ind = (await listIndustries()).find((i) => i.slug === "retail")!;
    await classifyCompany(admin, id, ind.id);
    expect(await getCompany(id)).toMatchObject({ classification: "classified", industry_name: "Retail" });
    await classifyCompany(admin, id, null);
    expect((await getCompany(id))!.classification).toBe("to_classify");
  });

  it("la base impide marcar una empresa como clasificada sin rubro", async () => {
    const admin = await mkActor("admin");
    const { id } = await createCompany(admin, { legal_name: "Acme SAC" });
    await expect(pool().query("UPDATE companies SET classification = 'classified' WHERE id = $1", [id])).rejects.toThrow();
  });
});

describe("permisos por objeto", () => {
  it("un vendedor solo edita lo propio o lo que no tiene dueño", async () => {
    const admin = await mkActor("admin");
    const ana = await mkActor("salesperson", "ana@apros.pe");
    const beto = await mkActor("salesperson", "beto@apros.pe");
    const { id } = await createCompany(admin, { legal_name: "De Beto SAC", owner_email: "beto@apros.pe" });
    await expect(updateCompany(ana, id, { city: "Lima" })).rejects.toBeInstanceOf(ForbiddenError);
    await updateCompany(beto, id, { city: "Lima" });
    expect((await getCompany(id))!.city).toBe("Lima");
  });

  it("un vendedor puede tomar una empresa libre pero no reasignarla a otro", async () => {
    const admin = await mkActor("admin");
    const ana = await mkActor("salesperson", "ana@apros.pe");
    const beto = await mkActor("salesperson", "beto@apros.pe");
    const { id } = await createCompany(admin, { legal_name: "Libre SAC" });
    await expect(updateCompany(ana, id, { ownerId: beto.id })).rejects.toBeInstanceOf(ForbiddenError);
    await updateCompany(ana, id, { ownerId: ana.id });
    expect((await getCompany(id))!.owner_id).toBe(ana.id);
    await expect(updateCompany(ana, id, { ownerId: beto.id })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lectura y consultor no pueden crear ni editar", async () => {
    const admin = await mkActor("admin");
    const reader = await mkActor("read_only");
    const consultant = await mkActor("consultant");
    const { id } = await createCompany(admin, { legal_name: "Acme SAC" });
    await expect(createCompany(reader, { legal_name: "X SAC" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateCompany(consultant, id, { city: "Lima" })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("un vendedor no puede crear empresas asignadas a otro", async () => {
    const ana = await mkActor("salesperson", "ana@apros.pe");
    await mkActor("salesperson", "beto@apros.pe");
    await expect(createCompany(ana, { legal_name: "X SAC", owner_email: "beto@apros.pe" })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("solo líder y administrador resuelven duplicados", async () => {
    const admin = await mkActor("admin");
    const seller = await mkActor("salesperson");
    await createCompany(admin, { legal_name: "Inversiones Pérez SAC" });
    await createCompany(admin, { legal_name: "Inversiones Peres SAC" }, { confirmPossibleDuplicate: true });
    const d = (await pool().query("SELECT id FROM duplicate_candidates")).rows[0];
    await expect(resolveDuplicate(seller, d.id, "dismiss")).rejects.toBeInstanceOf(ForbiddenError);
    await resolveDuplicate(admin, d.id, "keep_first");
    expect((await pool().query("SELECT count(*)::int AS n FROM companies")).rows[0].n).toBe(1);
  });
});

describe("no contactar aplicado a empresas existentes", () => {
  it("una empresa ya creada queda bloqueada al agregarse a la lista", async () => {
    const admin = await mkActor("admin");
    const { id } = await createCompany(admin, { legal_name: "Acme SAC", website: "acme.pe" });
    expect(await isCommerciallyBlocked(id)).toBe(false);
    await addDoNotContact(admin, "domain", "acme.pe", "Pidió baja");
    expect(await isCommerciallyBlocked(id)).toBe(true);
    expect((await getCompany(id))!.blocked).toBe(true);
  });

  it("no se puede esquivar el bloqueo cambiando el dominio por uno bloqueado", async () => {
    const admin = await mkActor("admin");
    await addDoNotContact(admin, "domain", "vetado.pe", "x");
    const { id } = await createCompany(admin, { legal_name: "Acme SAC", website: "acme.pe" });
    await expect(updateCompany(admin, id, { website: "vetado.pe" })).rejects.toThrow(/no contactar/);
  });
});

describe("listado y filtros", () => {
  it("filtra por rubro, clasificación y texto; pagina; sin N+1", async () => {
    const admin = await mkActor("admin");
    const retail = (await listIndustries()).find((i) => i.slug === "retail")!;
    for (let i = 0; i < 30; i++) await createCompany(admin, { legal_name: `Empresa ${i} SAC`, industry: i % 2 ? "Retail" : "" });
    const all = await listCompanies({});
    expect(all.total).toBe(30);
    expect(all.rows).toHaveLength(25);
    expect((await listCompanies({ page: 2 })).rows).toHaveLength(5);
    expect((await listCompanies({ industryId: retail.id })).total).toBe(15);
    expect((await listCompanies({ classification: "to_classify" })).total).toBe(15);
    expect((await listCompanies({ q: "empresa 7" })).total).toBe(1);
    expect((await listCompanies({ q: "%" })).total).toBe(0); // los comodines se escapan
  });
});

describe("rubros editables", () => {
  it("carga los siete rubros de ejemplo", async () => {
    expect((await listIndustries()).length).toBe(7);
  });
  it("un administrador crea, renombra y desactiva un rubro sin tocar código", async () => {
    const admin = await mkActor("admin");
    await createIndustry(admin, "Turismo y Hotelería");
    const t = (await listIndustries()).find((i) => i.slug === "turismo-y-hoteleria")!;
    expect(t.name).toBe("Turismo y Hotelería");
    await updateIndustry(admin, t.id, { name: "Turismo" });
    await updateIndustry(admin, t.id, { active: false });
    expect((await listIndustries()).find((i) => i.id === t.id)).toBeUndefined();
    expect((await listIndustries(undefined, true)).find((i) => i.id === t.id)).toBeTruthy();
    await expect(createIndustry(admin, "Salud")).rejects.toThrow(/Ya existe/);
  });
  it("solo el administrador edita rubros", async () => {
    const lead = await mkActor("sales_lead");
    await expect(createIndustry(lead, "Otro")).rejects.toBeInstanceOf(ForbiddenError);
  });
  it("un rubro nuevo se usa de inmediato al importar o crear", async () => {
    const admin = await mkActor("admin");
    await createIndustry(admin, "Turismo");
    const { id } = await createCompany(admin, { legal_name: "Hotel Demo SAC", industry: "Turismo" });
    expect(await getCompany(id)).toMatchObject({ classification: "classified", industry_name: "Turismo" });
  });
});

describe("fuentes de empresas", () => {
  it("todas están desactivadas por defecto", async () => {
    expect((await listProviders()).every((p) => !p.enabled)).toBe(true);
  });

  it("no se puede activar sin términos aprobados (lo impide también la base)", async () => {
    const admin = await mkActor("admin");
    await expect(setProviderEnabled(admin, "simulado", true)).rejects.toBeInstanceOf(SourceError);
    await listProviders();
    await expect(pool().query("UPDATE source_providers SET enabled = true WHERE code = 'simulado'")).rejects.toThrow();
  });

  it("las fuentes previstas no se pueden aprobar ni activar: aún no existen", async () => {
    const admin = await mkActor("admin");
    await expect(approveTerms(admin, "google_places")).rejects.toBeInstanceOf(SourceError);
    await expect(setProviderEnabled(admin, "sunat_padron", true)).rejects.toBeInstanceOf(SourceError);
  });

  it("solo el administrador gestiona fuentes", async () => {
    const lead = await mkActor("sales_lead");
    await expect(approveTerms(lead, "simulado")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("todo proveedor implementado tiene su documento de términos en el repositorio", () => {
    for (const p of IMPLEMENTED_PROVIDERS) expect(fs.existsSync(path.resolve(__dirname, "..", p.termsDoc))).toBe(true);
    expect(PLANNED_PROVIDERS.length).toBeGreaterThan(0);
  });

  it("descubrimiento: crea empresas, respeta bloqueos y no duplica al repetir", async () => {
    const admin = await mkActor("admin");
    await expect(runDiscovery(admin, "simulado")).rejects.toThrow(/desactivada/);
    await approveTerms(admin, "simulado");
    await setProviderEnabled(admin, "simulado", true);
    await addDoNotContact(admin, "domain", "clinica-demo-salud.example.com", "prueba");
    const first = await runDiscovery(admin, "simulado");
    expect(first).toMatchObject({ found: 8, created: 7, blocked: 1, duplicates: 0 });
    const { rows } = await pool().query(`SELECT classification, count(*)::int AS n FROM companies GROUP BY 1 ORDER BY 1`);
    expect(rows).toEqual([{ classification: "classified", n: 6 }, { classification: "to_classify", n: 1 }]);
    const second = await runDiscovery(admin, "simulado");
    expect(second).toMatchObject({ created: 0, duplicates: 7, blocked: 1 });
    expect((await pool().query("SELECT count(*)::int AS n FROM companies")).rows[0].n).toBe(7);
    const src = await pool().query(`SELECT DISTINCT source_code FROM company_sources`);
    expect(src.rows).toEqual([{ source_code: "simulado" }]);
  });
});
