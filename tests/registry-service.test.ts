import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { addActiveClient, addDoNotContact, createCompany } from "@/lib/companies/service";
import { createBatchInternal, runBatch } from "@/lib/registry/import";
import { seedExampleKeywords } from "@/lib/registry/rubro";
import { getRegistryCompany, linkRucToCompany, promoteRegistry, PROMOTE_MAX, REGISTRY_PAGE, searchRegistry } from "@/lib/registry/service";
import { ForbiddenError } from "@/lib/rbac";
import { mkActor, resetData } from "./helpers";
import { useImportDir, writeSynthetic } from "./helpers-registry";

beforeEach(resetData);
afterAll(() => pool().end());

async function setup(n = 3000) {
  const admin = await mkActor("admin");
  const dir = useImportDir();
  await seedExampleKeywords(admin); // las palabras de ejemplo sugieren rubro al cargar
  writeSynthetic(dir, "padron.txt", "ruc", n, 1);
  writeSynthetic(dir, "anexo.txt", "anexo", n, 1);
  const b = await createBatchInternal({ fileName: "padron.txt", sourceNote: "Actualizado al 07/11/2026 (sintético)" }, admin.id);
  await runBatch(b.id, { chunkLines: 500 });
  return { admin, batchId: b.id };
}
const firstRuc = async (where = "TRUE") => (await pool().query<{ ruc: string; legal_name: string }>(`SELECT ruc, legal_name FROM registry_companies WHERE ${where} ORDER BY ruc LIMIT 1`)).rows[0]!;

describe("búsqueda en el padrón", () => {
  it("filtra por nombre (palabras en cualquier orden), RUC, zona y rubro sugerido", async () => {
    await setup();
    const clin = await searchRegistry({ q: "clinica" });
    expect(clin.rows.length).toBeGreaterThan(0);
    expect(clin.rows.every((r) => /clinica/i.test(r.legal_name))).toBe(true);
    const two = clin.rows[0]!.legal_name.split(" ").slice(1, 3).reverse().join(" ");
    expect((await searchRegistry({ q: two })).rows.some((r) => r.ruc === clin.rows[0]!.ruc)).toBe(true);
    const ruc = clin.rows[0]!.ruc;
    expect((await searchRegistry({ q: ruc })).rows.map((r) => r.ruc)).toEqual([ruc]);
    expect((await searchRegistry({ q: ruc.slice(0, 6) })).rows.every((r) => r.ruc.startsWith(ruc.slice(0, 6)))).toBe(true);
    const lima = await searchRegistry({ ubigeo: "15" });
    expect(lima.rows.length).toBeGreaterThan(0);
    expect(lima.rows.every((r) => r.ubigeo!.startsWith("15") && r.department === "Lima")).toBe(true);
    const dist = await searchRegistry({ ubigeo: "150122" });
    expect(dist.rows.every((r) => r.ubigeo === "150122")).toBe(true);
    const salud = (await pool().query<{ id: string }>(`SELECT id FROM industries WHERE slug = 'salud'`)).rows[0]!.id;
    const bySalud = await searchRegistry({ industry: salud });
    expect(bySalud.rows.length).toBeGreaterThan(0);
    expect(bySalud.rows.every((r) => r.suggested_industry_name === "Salud")).toBe(true);
    expect((await searchRegistry({ industry: "none" })).rows.every((r) => r.suggested_industry_id === null)).toBe(true);
    expect((await searchRegistry({ person: "natural" })).rows).toEqual([]); // las personas naturales no se cargan
    expect((await searchRegistry({ q: "zzzzqqq" })).rows).toEqual([]);
  });

  it("pagina por cursor sin repetir ni saltar filas y nunca devuelve más de una página", async () => {
    await setup();
    const total = Number((await pool().query("SELECT count(*) AS n FROM registry_companies")).rows[0].n);
    expect(total).toBeGreaterThan(REGISTRY_PAGE * 3);
    const seen: string[] = [];
    let after: string | undefined;
    let pages = 0;
    do {
      const r = await searchRegistry({ after });
      expect(r.rows.length).toBeLessThanOrEqual(REGISTRY_PAGE);
      seen.push(...r.rows.map((x) => x.ruc));
      after = r.nextAfter ?? undefined;
      pages++;
    } while (after && pages < 500);
    expect(seen.length).toBe(total);
    expect(new Set(seen).size).toBe(total);
    expect([...seen].sort()).toEqual(seen); // orden estable por RUC
  });

  it("rechaza filtros mal formados y trata los comodines como texto", async () => {
    await setup(500);
    await expect(searchRegistry({ ubigeo: "1" })).rejects.toThrow();
    await expect(searchRegistry({ after: "abc" })).rejects.toThrow();
    await expect(searchRegistry({ industry: "no-es-uuid" })).rejects.toThrow();
    expect((await searchRegistry({ q: "%%%" })).rows).toEqual([]);
    expect((await searchRegistry({ q: "'; DROP TABLE registry_companies; --" })).rows).toEqual([]);
    expect(Number((await pool().query("SELECT count(*) AS n FROM registry_companies")).rows[0].n)).toBeGreaterThan(0);
  });

  it("marca no contactar, clientes activos y empresas ya promovidas sin ocultarlas", async () => {
    const { admin } = await setup(800);
    const a = await firstRuc();
    const b = await firstRuc(`ruc > '${a.ruc}'`);
    const c = await firstRuc(`ruc > '${b.ruc}'`);
    await addDoNotContact(admin, "company", a.ruc, "Pidió no ser contactada");
    await addActiveClient(admin, { name: b.legal_name, ruc: b.ruc });
    await promoteRegistry(admin, [c.ruc]);
    const rows = (await searchRegistry({ q: "" })).rows;
    const by = Object.fromEntries(rows.map((r) => [r.ruc, r]));
    expect(by[a.ruc]).toMatchObject({ dnc: true, client: false, company_id: null });
    expect(by[b.ruc]).toMatchObject({ dnc: false, client: true });
    expect(by[c.ruc]!.company_id).toBeTruthy();
    const open = await searchRegistry({ notPromoted: true });
    expect(open.rows.some((r) => r.ruc === c.ruc)).toBe(false);
  });

  it("cada fila muestra su fuente y fecha, y el detalle trae sus locales", async () => {
    const { admin } = await setup(1500);
    const anexo = await createBatchInternal({ fileName: "anexo.txt" }, admin.id);
    await runBatch(anexo.id);
    const withLocals = (await pool().query<{ ruc: string }>(`SELECT r.ruc FROM registry_companies r WHERE EXISTS (SELECT 1 FROM registry_locations l WHERE l.ruc = r.ruc) LIMIT 1`)).rows[0]!;
    const d = (await getRegistryCompany(withLocals.ruc))!;
    expect(d.row.source_note).toMatch(/07\/11\/2026/);
    expect(d.row.loaded_at).toBeInstanceOf(Date);
    expect(d.batch).toMatchObject({ file_name: "padron.txt", connector_version: "sunat-padron/1" });
    expect(d.locationCount).toBeGreaterThan(0);
    expect(d.locations[0]!.address.length).toBeGreaterThan(3);
    expect(await getRegistryCompany("123")).toBeNull();
    expect(await getRegistryCompany("20999999999")).toBeNull();
  });
});

describe("promoción a empresas de trabajo", () => {
  it("crea la empresa con RUC, rubro sugerido, departamento y su fuente; una segunda vez no duplica", async () => {
    const { admin, batchId } = await setup();
    const clin = (await searchRegistry({ q: "clinica" })).rows[0]!;
    const r = await promoteRegistry(admin, [clin.ruc]);
    expect(r.created).toHaveLength(1);
    const co = (await pool().query(`SELECT c.ruc, c.legal_name, c.city, c.classification, i.name AS industry, c.domain FROM companies c LEFT JOIN industries i ON i.id = c.industry_id WHERE c.id = $1`, [r.created[0]!.companyId])).rows[0];
    expect(co).toMatchObject({ ruc: clin.ruc, industry: "Salud", classification: "classified", domain: null });
    expect(co.city).toBeTruthy();
    const src = (await pool().query(`SELECT source_code, source_ref FROM company_sources WHERE company_id = $1`, [r.created[0]!.companyId])).rows[0];
    expect(src).toEqual({ source_code: "sunat_padron", source_ref: batchId });
    const again = await promoteRegistry(admin, [clin.ruc]);
    expect(again).toMatchObject({ created: [], alreadyInBase: [clin.ruc] });
    expect(Number((await pool().query("SELECT count(*) AS n FROM companies")).rows[0].n)).toBe(1);
    const audit = (await pool().query(`SELECT metadata FROM audit_log WHERE action = 'registry.promoted' ORDER BY id`)).rows;
    expect(audit.map((a) => a.metadata.created)).toEqual([1, 0]);
  });

  it("respeta el modo de rubro: ninguno, o uno elegido", async () => {
    const { admin } = await setup();
    const rows = (await searchRegistry({ q: "clinica" })).rows;
    const retail = (await pool().query<{ id: string }>(`SELECT id FROM industries WHERE slug = 'retail'`)).rows[0]!.id;
    const a = await promoteRegistry(admin, [rows[0]!.ruc], "none");
    const b = await promoteRegistry(admin, [rows[1]!.ruc], { industryId: retail });
    const get = async (id: string) => (await pool().query(`SELECT i.name AS industry, c.classification FROM companies c LEFT JOIN industries i ON i.id = c.industry_id WHERE c.id = $1`, [id])).rows[0];
    expect(await get(a.created[0]!.companyId)).toEqual({ industry: null, classification: "to_classify" });
    expect(await get(b.created[0]!.companyId)).toEqual({ industry: "Retail", classification: "classified" });
    await expect(promoteRegistry(admin, [rows[2]!.ruc], { industryId: "00000000-0000-0000-0000-000000000000" })).rejects.toThrow(/Rubro/);
  });

  it("no promueve empresas en no contactar ni clientes activos, y lo explica", async () => {
    const { admin } = await setup(800);
    const a = await firstRuc();
    const b = await firstRuc(`ruc > '${a.ruc}'`);
    const c = await firstRuc(`ruc > '${b.ruc}'`);
    await addDoNotContact(admin, "company", a.ruc, "Reclamo");
    await addActiveClient(admin, { name: b.legal_name, ruc: b.ruc });
    const r = await promoteRegistry(admin, [a.ruc, b.ruc, c.ruc]);
    expect(r.blocked.map((x) => x.ruc).sort()).toEqual([a.ruc, b.ruc].sort());
    expect(r.blocked.find((x) => x.ruc === a.ruc)!.reason).toMatch(/no contactar/i);
    expect(r.blocked.find((x) => x.ruc === b.ruc)!.reason).toMatch(/cliente activo/i);
    expect(r.created.map((x) => x.ruc)).toEqual([c.ruc]);
    expect(Number((await pool().query("SELECT count(*) AS n FROM companies WHERE ruc = ANY($1)", [[a.ruc, b.ruc]])).rows[0].n)).toBe(0);
  });

  it("deja para revisión una empresa de nombre casi igual a una ya existente sin RUC, y se puede vincular", async () => {
    const { admin } = await setup(800);
    const target = (await searchRegistry({ q: "clinica" })).rows[0]!;
    const manual = await createCompany(admin, { legal_name: target.legal_name, website: "clinica-manual.example.com", industry: "Salud" });
    const r = await promoteRegistry(admin, [target.ruc]);
    expect(r.created).toEqual([]);
    expect(r.needsReview).toHaveLength(1);
    expect(r.needsReview[0]).toMatchObject({ ruc: target.ruc, otherId: manual.id });
    await linkRucToCompany(admin, manual.id, target.ruc);
    expect((await pool().query("SELECT ruc FROM companies WHERE id = $1", [manual.id])).rows[0].ruc).toBe(target.ruc);
    expect((await promoteRegistry(admin, [target.ruc])).alreadyInBase).toEqual([target.ruc]);
    await expect(linkRucToCompany(admin, manual.id, "20999999999")).rejects.toThrow(/padrón/);
  });

  it("limita a 200 por acción, valida los RUC y avisa de los que no están en el padrón", async () => {
    const { admin } = await setup(500);
    const many = Array.from({ length: PROMOTE_MAX + 1 }, (_, i) => String(20000000000 + i));
    await expect(promoteRegistry(admin, many)).rejects.toThrow(/Máximo 200/);
    await expect(promoteRegistry(admin, [])).rejects.toThrow(/al menos una/);
    await expect(promoteRegistry(admin, ["abc"])).rejects.toThrow(/RUC inválido/);
    const r = await promoteRegistry(admin, ["20999999999"]);
    expect(r.notFound).toEqual(["20999999999"]);
    const ok = (await searchRegistry({})).rows.slice(0, 5).map((x) => x.ruc);
    const many2 = await promoteRegistry(admin, [...ok, ...ok]); // repetidos se cuentan una vez
    expect(many2.created).toHaveLength(5);
  });

  it("todos los roles con acceso promueven (salvo solo lectura) y la acción queda en la auditoría", async () => {
    await setup(500);
    const rows = (await searchRegistry({})).rows;
    const ro = await mkActor("read_only");
    await expect(promoteRegistry(ro, [rows[0]!.ruc])).rejects.toBeInstanceOf(ForbiddenError);
    let i = 1;
    for (const role of ["salesperson", "consultant", "sales_lead", "admin"] as const) {
      const r = await promoteRegistry(await mkActor(role), [rows[i++]!.ruc]);
      expect(r.created).toHaveLength(1);
    }
    expect((await pool().query(`SELECT count(*)::int AS n FROM audit_log WHERE action = 'registry.promoted'`)).rows[0].n).toBe(4);
  });
});
