import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { commitImport, decideRow, errorReportCsv, getBatchSummary, ImportError, previewImport, undoImport } from "@/lib/companies/import";
import { addActiveClient, addDoNotContact, createCompany } from "@/lib/companies/service";
import { verifyAuditChain } from "@/lib/audit";
import { mkActor, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

const CSV = [
  "razon_social,sitio_web,ruc,rubro,ciudad,responsable",
  "Alfa Inmobiliaria S.A.C.,https://www.alfa-inmo.pe,20100070970,Inmobiliario,Lima,",
  "Beta Salud S.A.,beta-salud.pe,,Salud,Lima,",
  "Gamma Sin Rubro SAC,gamma.pe,,Rubro Inventado,Arequipa,",
  ",sin-nombre.pe,,Retail,Lima,",
  "Delta RUC Malo SAC,delta.pe,12345678901,Retail,Lima,",
  "Epsilon Redes SAC,https://linkedin.com/company/epsilon,,Retail,Lima,",
].join("\n");

describe("importación CSV", () => {
  it("la vista previa clasifica filas y no crea empresas", async () => {
    const admin = await mkActor("admin");
    const s = await previewImport(admin, "empresas.csv", CSV);
    expect(s.total).toBe(6);
    expect(s.counts).toMatchObject({ valid: 4, error: 2, duplicate: 0 });
    const { rows } = await pool().query("SELECT count(*)::int AS n FROM companies");
    expect(rows[0].n).toBe(0);
  });

  it("el informe de errores lista filas con problemas y neutraliza fórmulas", async () => {
    const admin = await mkActor("admin");
    const csv = "razon_social,sitio_web,ruc\n=CMD|calc,x.pe,99\n";
    const s = await previewImport(admin, "e.csv", csv);
    const report = await errorReportCsv(s.id);
    expect(report).toContain("RUC inválido");
    expect(report).toContain("'=CMD|calc");
    expect(report).not.toMatch(/,=CMD/);
  });

  it("al confirmar crea las filas válidas; el rubro dudoso queda por clasificar", async () => {
    const admin = await mkActor("admin");
    const s = await previewImport(admin, "empresas.csv", CSV);
    const r = await commitImport(admin, s.id);
    expect(r.created).toBe(4);
    const { rows } = await pool().query(`SELECT legal_name, classification, domain, stage FROM companies ORDER BY legal_name`);
    expect(rows).toHaveLength(4);
    const gamma = rows.find((x) => x.legal_name.startsWith("Gamma"));
    expect(gamma.classification).toBe("to_classify");
    expect(rows.find((x) => x.legal_name.startsWith("Alfa")).classification).toBe("classified");
    expect(rows.find((x) => x.legal_name.startsWith("Epsilon")).domain).toBeNull(); // dominio de red social descartado
    expect(rows.every((x) => x.stage === "detected")).toBe(true);
  });

  it("registra fuente y finalidad de cada empresa", async () => {
    const admin = await mkActor("admin");
    const s = await previewImport(admin, "x.csv", CSV);
    await commitImport(admin, s.id);
    const { rows } = await pool().query(`SELECT source_code, purpose FROM company_sources`);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ source_code: "csv", purpose: "prospección comercial B2B" });
  });

  it("no se puede confirmar dos veces el mismo lote", async () => {
    const admin = await mkActor("admin");
    const s = await previewImport(admin, "x.csv", CSV);
    await commitImport(admin, s.id);
    await expect(commitImport(admin, s.id)).rejects.toBeInstanceOf(ImportError);
  });

  it("deshacer elimina lo creado por el lote y conserva lo que ya avanzó", async () => {
    const admin = await mkActor("admin");
    const s = await previewImport(admin, "x.csv", CSV);
    await commitImport(admin, s.id);
    await pool().query(`UPDATE companies SET stage = 'contacted' WHERE legal_name LIKE 'Alfa%'`);
    const u = await undoImport(admin, s.id);
    expect(u).toEqual({ removed: 3, kept: 1 });
    const { rows } = await pool().query(`SELECT legal_name FROM companies`);
    expect(rows.map((r) => r.legal_name)).toEqual(["Alfa Inmobiliaria S.A.C."]);
    expect((await getBatchSummary(s.id)).status).toBe("undone");
    await expect(undoImport(admin, s.id)).rejects.toBeInstanceOf(ImportError);
  });

  it("detecta repetidos dentro del mismo archivo", async () => {
    const admin = await mkActor("admin");
    const csv = "razon_social,sitio_web\nUno SAC,uno.pe\nUno S.A.C.,otro.pe\nDos SAC,uno.pe\n";
    const s = await previewImport(admin, "x.csv", csv);
    expect(s.counts.valid).toBe(1);
    expect(s.counts.duplicate + s.counts.possible_duplicate).toBe(2);
    const r = await commitImport(admin, s.id).catch((e) => e);
    // si hay posibles duplicados sin resolver, no se confirma
    if (s.pendingDecisions > 0) expect(r).toBeInstanceOf(ImportError);
  });

  it("deja registro en la auditoría con la cadena íntegra", async () => {
    const admin = await mkActor("admin");
    const s = await previewImport(admin, "x.csv", CSV);
    await commitImport(admin, s.id);
    await undoImport(admin, s.id);
    const { rows } = await pool().query(`SELECT action FROM audit_log WHERE action LIKE 'import.%' ORDER BY id`);
    expect(rows.map((r) => r.action)).toEqual(["import.previewed", "import.committed", "import.undone"]);
    expect(await verifyAuditChain()).toBeNull();
  });
});

describe("deduplicación contra empresas existentes", () => {
  it("RUC o dominio iguales son duplicado exacto y se omiten por defecto", async () => {
    const admin = await mkActor("admin");
    await createCompany(admin, { legal_name: "Acme SAC", website: "acme.pe", ruc: "20100070970" });
    const s = await previewImport(admin, "x.csv", "razon_social,sitio_web,ruc\nOtro Nombre,acme.pe,\nAcme Distinto,x.pe,20100070970\n");
    expect(s.counts.duplicate).toBe(2);
    const r = await commitImport(admin, s.id);
    expect(r.created).toBe(0);
    expect((await pool().query("SELECT count(*)::int AS n FROM companies")).rows[0].n).toBe(1);
  });

  it("un duplicado exacto no se puede forzar a crear", async () => {
    const admin = await mkActor("admin");
    await createCompany(admin, { legal_name: "Acme SAC", website: "acme.pe" });
    const s = await previewImport(admin, "x.csv", "razon_social,sitio_web\nAcme Otra,acme.pe\n");
    const row = (await pool().query("SELECT id FROM import_rows WHERE batch_id = $1", [s.id])).rows[0];
    await expect(decideRow(admin, s.id, row.id, "create")).rejects.toBeInstanceOf(ImportError);
  });

  it("un nombre muy parecido exige decisión humana antes de confirmar", async () => {
    const admin = await mkActor("admin");
    await createCompany(admin, { legal_name: "Inversiones Pérez S.A.C." });
    const s = await previewImport(admin, "x.csv", "razon_social,ciudad\nInversiones Peres SAC,Lima\n");
    expect(s.counts.possible_duplicate).toBe(1);
    expect(s.pendingDecisions).toBe(1);
    await expect(commitImport(admin, s.id)).rejects.toThrow(/sin resolver/);
    const row = (await pool().query("SELECT id FROM import_rows WHERE batch_id = $1", [s.id])).rows[0];
    await decideRow(admin, s.id, row.id, "merge");
    const r = await commitImport(admin, s.id);
    expect(r.merged).toBe(1);
    const { rows } = await pool().query("SELECT city FROM companies");
    expect(rows).toEqual([{ city: "Lima" }]); // completó el campo vacío, sin duplicar
  });

  it("fusionar nunca sobrescribe datos existentes", async () => {
    const admin = await mkActor("admin");
    await createCompany(admin, { legal_name: "Inversiones Pérez SAC", city: "Cusco" });
    const s = await previewImport(admin, "x.csv", "razon_social,ciudad\nInversiones Peres SAC,Lima\n");
    const row = (await pool().query("SELECT id FROM import_rows WHERE batch_id = $1", [s.id])).rows[0];
    await decideRow(admin, s.id, row.id, "merge");
    await commitImport(admin, s.id);
    expect((await pool().query("SELECT city FROM companies")).rows[0].city).toBe("Cusco");
  });
});

describe("lista de no contactar y clientes activos", () => {
  it("bloquea por dominio, por RUC, por nombre y por correo", async () => {
    const admin = await mkActor("admin");
    await addDoNotContact(admin, "domain", "https://www.bloqueada.pe/", "Pidió no ser contactada");
    await addDoNotContact(admin, "company", "20100070970", "Reclamo");
    await addDoNotContact(admin, "company", "Empresa Vetada S.A.C.", "Política interna");
    const csv = "razon_social,sitio_web,ruc\nUno SAC,bloqueada.pe,\nDos SAC,dos.pe,20100070970\nEmpresa Vetada SAC,vetada.pe,\nTres SAC,tres.pe,\n";
    const s = await previewImport(admin, "x.csv", csv);
    expect(s.counts.blocked).toBe(3);
    expect(s.counts.valid).toBe(1);
    await commitImport(admin, s.id);
    expect((await pool().query("SELECT legal_name FROM companies")).rows).toEqual([{ legal_name: "Tres SAC" }]);
  });

  it("también bloquea el alta manual", async () => {
    const admin = await mkActor("admin");
    await addDoNotContact(admin, "domain", "bloqueada.pe", "x");
    await expect(createCompany(admin, { legal_name: "Uno SAC", website: "bloqueada.pe" })).rejects.toThrow(/no contactar/);
  });

  it("si una empresa pasa a la lista después de la vista previa, se bloquea al confirmar", async () => {
    const admin = await mkActor("admin");
    const s = await previewImport(admin, "x.csv", "razon_social,sitio_web\nUno SAC,uno.pe\n");
    await addDoNotContact(admin, "domain", "uno.pe", "Llegó después");
    const r = await commitImport(admin, s.id);
    expect(r.created).toBe(0);
    expect(r.blockedAtCommit).toBe(1);
    expect((await pool().query("SELECT count(*)::int AS n FROM companies")).rows[0].n).toBe(0);
  });

  it("excluye clientes activos por RUC, dominio o nombre", async () => {
    const admin = await mkActor("admin");
    await addActiveClient(admin, { name: "Cliente Actual SAC", website: "cliente.pe", ruc: "20100070970" });
    const csv = "razon_social,sitio_web,ruc\nOtra Razón,otra.pe,20100070970\nOtra Más,cliente.pe,\nCliente Actual S.A.C.,x.pe,\nLibre SAC,libre.pe,\n";
    const s = await previewImport(admin, "x.csv", csv);
    expect(s.counts.excluded_client).toBe(3);
    expect(s.counts.valid).toBe(1);
  });

  it("el motivo es obligatorio y solo líder o administrador gestionan la lista", async () => {
    const admin = await mkActor("admin");
    const seller = await mkActor("salesperson");
    await expect(addDoNotContact(admin, "domain", "x.pe", "  ")).rejects.toThrow(/motivo/);
    await expect(addDoNotContact(seller, "domain", "x.pe", "motivo")).rejects.toThrow();
  });
});
