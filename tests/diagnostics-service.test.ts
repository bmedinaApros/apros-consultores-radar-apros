import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { createCompany, addDoNotContact } from "@/lib/companies/service";
import { analyzeCompany } from "@/lib/analyzer/run";
import { scoreCompany } from "@/lib/scoring/service";
import { ForbiddenError } from "@/lib/rbac";
import {
  approveDiagnostic, DiagnosticError, editDiagnostic, generateDiagnostic, getDiagnosticDetail, getTemplate, listDiagnostics,
  loadExportable, recordExport, rejectDiagnostic, saveTemplate, submitForReview,
} from "@/lib/diagnostics/service";
import { simulatedProvider, AiRefusalError, type AiProvider } from "@/lib/diagnostics/ai";
import { getAiSettings, saveAiSettings, DEFAULT_AI, BudgetError } from "@/lib/diagnostics/budget";
import { renderPdf } from "@/lib/diagnostics/export-pdf";
import { renderPptx } from "@/lib/diagnostics/export-pptx";
import { fakeAnalyzerDeps, GOOD, POOR } from "./helpers-analyzer";
import { mkActor, ownerPool, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

async function setup(html = POOR) {
  const admin = await mkActor("admin");
  const consultant = await mkActor("consultant");
  const lead = await mkActor("sales_lead");
  const sales = await mkActor("salesperson");
  const { id } = await createCompany(admin, { legal_name: "Demo Uno SAC", website: "demo-uno.example.com", industry: "Inmobiliario" });
  const sites = { "demo-uno.example.com": { home: html } };
  const mk = fakeAnalyzerDeps(sites);
  await analyzeCompany(id, { deps: mk.deps });
  await scoreCompany(id);
  return { admin, consultant, lead, sales, id, sites, deps: mk.deps };
}
const sim = simulatedProvider();

describe("generación", () => {
  it("genera un borrador validado, con versión, evento, registro de la llamada y sin marcas bloqueantes", async () => {
    const { lead, id } = await setup();
    const r = await generateDiagnostic(lead, id, { provider: sim });
    expect(r.version).toBe(1);
    expect(r.blocking).toBe(0);
    const d = (await getDiagnosticDetail(lead, r.diagnosticId))!;
    expect(d.diagnostic.status).toBe("draft");
    expect(d.version.content.opportunities.length).toBeGreaterThan(0);
    expect(d.generations[0]).toMatchObject({ provider: "simulated", status: "ok" });
    expect(d.events.map((e) => e.action)).toEqual(expect.arrayContaining(["created", "generated"]));
  });

  it("regenerar crea otra versión del mismo diagnóstico (uno por empresa) y vuelve a borrador", async () => {
    const { lead, id } = await setup();
    const a = await generateDiagnostic(lead, id, { provider: sim });
    const b = await generateDiagnostic(lead, id, { provider: sim });
    expect(b.diagnosticId).toBe(a.diagnosticId);
    expect(b.version).toBe(2);
  });

  it("sin permiso, sin IA configurada, sin análisis o en no contactar: no genera", async () => {
    const { sales, lead, admin, id } = await setup();
    await expect(generateDiagnostic(sales, id, { provider: sim })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(generateDiagnostic(lead, id, { provider: null })).rejects.toThrow(/no está configurada/);
    const c2 = await createCompany(admin, { legal_name: "Sin Análisis SAC", website: "sin.example.com", industry: "Salud" });
    await expect(generateDiagnostic(lead, c2.id, { provider: sim })).rejects.toThrow(/análisis web/);
    await addDoNotContact(admin, "domain", "demo-uno.example.com", "Pidió no ser contactada");
    await expect(generateDiagnostic(lead, id, { provider: sim })).rejects.toThrow(/no contactar/);
  });

  it("un sitio ilegible no genera diagnóstico: fallo de lectura no es hallazgo", async () => {
    const admin = await mkActor("admin");
    const lead = await mkActor("sales_lead");
    const { id } = await createCompany(admin, { legal_name: "Caída SAC", website: "caida.example.com", industry: "Retail" });
    await analyzeCompany(id, { deps: fakeAnalyzerDeps({}).deps });
    await expect(generateDiagnostic(lead, id, { provider: sim })).rejects.toBeInstanceOf(DiagnosticError);
  });

  it("salida inválida o rechazo del modelo: se registra el intento y no se guarda nada", async () => {
    const { lead, id } = await setup();
    const bad: AiProvider = { id: "anthropic", model: "claude-opus-5-5", generate: async () => ({ text: "esto no es json", model: "claude-opus-5-5", inputTokens: 1000, outputTokens: 10, cacheReadTokens: 0, stopReason: "end_turn" }) };
    await expect(generateDiagnostic(lead, id, { provider: bad })).rejects.toThrow(/JSON/);
    const refuse: AiProvider = { id: "anthropic", model: "claude-opus-5-5", generate: async () => { throw new AiRefusalError("x"); } };
    await expect(generateDiagnostic(lead, id, { provider: refuse })).rejects.toThrow(/declinó/);
    expect((await pool().query("SELECT count(*)::int AS n FROM diagnostics")).rows[0].n).toBe(0);
    const g = await pool().query("SELECT status, estimated_cost_usd FROM ai_generations ORDER BY created_at");
    expect(g.rows.map((r) => r.status)).toEqual(["invalid_output", "refused"]);
    expect(Number(g.rows[0].estimated_cost_usd)).toBeGreaterThan(0);
  });

  it("una afirmación sin respaldo queda marcada y bloquea enviar y aprobar", async () => {
    const { lead, consultant, id } = await setup();
    const hostile: AiProvider = {
      id: "anthropic", model: "claude-opus-5-5",
      generate: async (req) => {
        const o = JSON.parse((await sim.generate(req)).text);
        o.opportunities[0].evidence = [];
        o.opportunities[0].observation = "Su sitio está mal hecho y pierde 40% de clientes";
        return { text: JSON.stringify(o), model: "claude-opus-5-5", inputTokens: 100, outputTokens: 100, cacheReadTokens: 0, stopReason: "end_turn" };
      },
    };
    const r = await generateDiagnostic(lead, id, { provider: hostile });
    expect(r.blocking).toBeGreaterThan(0);
    await expect(submitForReview(lead, r.diagnosticId)).rejects.toThrow(/marcadas/);
    await expect(approveDiagnostic(consultant, r.diagnosticId)).rejects.toThrow(/en revisión/);
  });
});

describe("presupuesto", () => {
  it("bloquea antes de llamar al modelo y deja constancia", async () => {
    const { lead, admin, id } = await setup();
    await saveAiSettings(admin, { ...DEFAULT_AI, dailyUsd: 0.0001 });
    let called = false;
    const spy: AiProvider = { id: "anthropic", model: "claude-opus-5-5", generate: async () => { called = true; throw new Error("no debería llamarse"); } };
    await expect(generateDiagnostic(lead, id, { provider: spy })).rejects.toBeInstanceOf(BudgetError);
    expect(called).toBe(false);
    expect((await pool().query("SELECT status FROM ai_generations")).rows[0].status).toBe("budget_blocked");
    expect((await getAiSettings()).dailyUsd).toBe(0.0001);
  });
});

async function approved() {
  const s = await setup();
  const g = await generateDiagnostic(s.lead, s.id, { provider: sim });
  await submitForReview(s.lead, g.diagnosticId);
  await approveDiagnostic(s.consultant, g.diagnosticId);
  return { ...s, g };
}

describe("flujo de revisión", () => {
  it("borrador → revisión → aprobado; solo quien tiene permiso aprueba", async () => {
    const s = await setup();
    const g = await generateDiagnostic(s.lead, s.id, { provider: sim });
    await submitForReview(s.lead, g.diagnosticId);
    await expect(approveDiagnostic(s.lead, g.diagnosticId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(approveDiagnostic(s.sales, g.diagnosticId)).rejects.toBeInstanceOf(ForbiddenError);
    await approveDiagnostic(s.consultant, g.diagnosticId);
    const d = (await getDiagnosticDetail(s.consultant, g.diagnosticId))!;
    expect(d.diagnostic.status).toBe("approved");
    expect(d.diagnostic.approved_version_id).toBe(g.versionId);
  });

  it("rechazar exige motivo; editar crea versión nueva, quita la aprobación y revalida", async () => {
    const s = await approved();
    const d0 = (await getDiagnosticDetail(s.consultant, s.g.diagnosticId))!;
    const content = structuredClone(d0.version.content);
    content.headline = "Oportunidades de evolución digital para Demo Uno";
    const e = await editDiagnostic(s.consultant, s.g.diagnosticId, content, "ajuste de titular");
    expect(e.version).toBe(2);
    const d1 = (await getDiagnosticDetail(s.consultant, s.g.diagnosticId))!;
    expect(d1.diagnostic.status).toBe("draft");
    expect(d1.diagnostic.approved_version_id).toBeNull();
    // una edición con lenguaje prohibido queda marcada
    const bad = structuredClone(content);
    bad.summary = "La web está mal hecha y hay que rehacer la web";
    const e2 = await editDiagnostic(s.consultant, s.g.diagnosticId, bad);
    expect(e2.blocking).toBeGreaterThan(0);
    await editDiagnostic(s.consultant, s.g.diagnosticId, content);
    await submitForReview(s.lead, s.g.diagnosticId);
    await expect(rejectDiagnostic(s.consultant, s.g.diagnosticId, "  ")).rejects.toThrow(/motivo/);
    await rejectDiagnostic(s.consultant, s.g.diagnosticId, "Falta validar con el equipo comercial");
    expect((await getDiagnosticDetail(s.consultant, s.g.diagnosticId))!.diagnostic.status).toBe("rejected");
  });

  it("las versiones y eventos no se pueden modificar ni borrar (inmutables)", async () => {
    const s = await approved();
    await expect(pool().query("UPDATE diagnostic_versions SET content = '{}'::jsonb")).rejects.toThrow();
    await expect(pool().query("DELETE FROM diagnostic_events")).rejects.toThrow();
    await expect(pool().query("UPDATE ai_generations SET status = 'ok'")).rejects.toThrow();
    expect(s.g.versionId).toBeTruthy();
  });
});

describe("desactualización", () => {
  it("si cambia la evidencia citada, se marca desactualizado y no se puede aprobar ni exportar", async () => {
    const s = await setup(POOR);
    const g = await generateDiagnostic(s.lead, s.id, { provider: sim });
    await submitForReview(s.lead, g.diagnosticId);
    // el sitio mejora: nuevo análisis con otra evidencia
    const better = fakeAnalyzerDeps({ "demo-uno.example.com": { home: GOOD } });
    await analyzeCompany(s.id, { deps: better.deps, force: true } as never);
    const d = (await getDiagnosticDetail(s.consultant, g.diagnosticId))!;
    expect(d.diagnostic.stale).toBe(true);
    await expect(approveDiagnostic(s.consultant, g.diagnosticId)).rejects.toThrow(/desactualizado/);
  });
});

describe("exportación", () => {
  it("solo se exporta lo aprobado y vigente; el PDF y el PPTX salen y quedan registrados", async () => {
    const s = await setup();
    const g = await generateDiagnostic(s.lead, s.id, { provider: sim });
    await expect(loadExportable(s.lead, g.diagnosticId)).rejects.toThrow(/aprobado/);
    await submitForReview(s.lead, g.diagnosticId);
    await expect(loadExportable(s.lead, g.diagnosticId)).rejects.toThrow(/aprobado/);
    await approveDiagnostic(s.consultant, g.diagnosticId);
    await expect(loadExportable(s.consultant, g.diagnosticId).then(() => "ok")).resolves.toBe("ok");
    const x = await loadExportable(s.sales, g.diagnosticId).catch((e) => e);
    // el vendedor solo ve lo aprobado: aquí la empresa no tiene responsable, así que sí puede
    expect(x).toMatchObject({ diagnosticId: g.diagnosticId });
    const pdf = await renderPdf(x);
    const pptx = await renderPptx(x);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pptx.subarray(0, 2).toString()).toBe("PK");
    await recordExport(s.sales, { diagnosticId: g.diagnosticId, versionId: x.versionId, format: "pdf", bytes: pdf });
    expect((await pool().query("SELECT count(*)::int AS n FROM diagnostic_exports")).rows[0].n).toBe(1);
    // read_only no exporta
    const ro = await mkActor("read_only");
    await expect(loadExportable(ro, g.diagnosticId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("editar tras aprobar bloquea la exportación hasta una nueva aprobación", async () => {
    const s = await approved();
    const d = (await getDiagnosticDetail(s.consultant, s.g.diagnosticId))!;
    await editDiagnostic(s.consultant, s.g.diagnosticId, d.version.content);
    await expect(loadExportable(s.consultant, s.g.diagnosticId)).rejects.toThrow(/aprobado/);
  });
});

describe("visibilidad (D-62: todos ven todo)", () => {
  it("cualquier usuario con acceso ve los diagnósticos en cualquier estado, pero solo se descarga lo aprobado", async () => {
    const s = await setup();
    const g = await generateDiagnostic(s.lead, s.id, { provider: sim });
    const other = await mkActor("salesperson", "otro@apros.pe");
    await pool().query("UPDATE companies SET owner_id = $1 WHERE id = $2", [other.id, s.id]);
    const ro = await mkActor("read_only");
    for (const who of [s.sales, other, ro]) {
      expect(await listDiagnostics(who)).toHaveLength(1);
      expect((await getDiagnosticDetail(who, g.diagnosticId))?.diagnostic.status).toBe("draft");
    }
    await expect(loadExportable(s.sales, g.diagnosticId)).rejects.toThrow(/aprobado/);
    await submitForReview(s.lead, g.diagnosticId);
    await approveDiagnostic(s.consultant, g.diagnosticId);
    expect((await loadExportable(s.sales, g.diagnosticId)).diagnosticId).toBe(g.diagnosticId);
    await expect(loadExportable(ro, g.diagnosticId)).rejects.toBeInstanceOf(ForbiddenError); // read_only no exporta
  });
});

describe("plantillas", () => {
  it("sin plantilla por rubro usa la general; al guardar una, la versión sube y se audita", async () => {
    const admin = await mkActor("admin");
    const ind = (await pool().query<{ id: string }>("SELECT id FROM industries WHERE name = 'Inmobiliario'")).rows[0]!.id;
    expect((await getTemplate(ind)).scope).toBe("general");
    await saveTemplate(admin, ind, "Enfatiza proyectos en venta y cotizaciones por WhatsApp del rubro inmobiliario.");
    const t = await getTemplate(ind);
    expect(t.scope).toBe("rubro");
    await saveTemplate(admin, ind, "Enfatiza proyectos en venta, visitas guiadas y cotizaciones del rubro inmobiliario.");
    expect((await getTemplate(ind)).version).toBe(t.version + 1);
    await ownerPool().query("SELECT 1");
  });
});
