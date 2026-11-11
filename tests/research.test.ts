import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { addDoNotContact, createCompany, getCompany } from "@/lib/companies/service";
import type { WebDeps } from "@/lib/companies/web";
import type { Fetcher } from "@/lib/analyzer/safe-fetch";
import { estimateCostUsd, extractJson, ResearchCallError, xaiProvider, type ResearchProvider, type ResearchResult } from "@/lib/research/provider";
import { appearsOnSite, pageEvidence, sanitizeContacts } from "@/lib/research/contacts";
import { companiesNeedingResearch, contactsByCompany, listContacts, researchBatch, researchCompany } from "@/lib/research/service";
import { runWeeklyPipeline } from "@/lib/weekly/pipeline";
import { fakeAnalyzerDeps, GOOD } from "./helpers-analyzer";
import * as F from "./fixtures/sites";
import { mkActor, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

const RUC = "20100070970";
const page = (title: string, body = "") => `<html><head><title>${title}</title></head><body><h1>${title}</h1><p>${body}</p><a href="/contacto">Contacto</a></body></html>`;
function web(sites: Record<string, string>): WebDeps {
  const fetcher: Fetcher = async (url) => {
    const u = new URL(url);
    const html = sites[u.hostname.replace(/^www\./, "")];
    if (html === undefined) return F.failure(url, "blocked", "no resuelve");
    if (u.pathname === "/robots.txt") return F.httpError(url, 404);
    if (u.pathname === "/contacto") return F.ok(url, page("Contacto", "Escríbenos a ventas@marmolesandinos.example.com · WhatsApp 987 654 321"));
    return F.ok(url, html);
  };
  return { fetcher, userAgent: "RadarAPROS/1.0" };
}
const fake = (r: Partial<ResearchResult>, cost = { inputTokens: 4000, outputTokens: 500, searches: 3 }): ResearchProvider & { calls: unknown[] } => {
  const calls: unknown[] = [];
  return { id: "grok", model: "grok-4.3", calls, async research(i) { calls.push(i); return { website: null, contacts: [], model: "grok-4.3", usage: cost, ...r }; } };
};

describe("proveedor xAI (respuesta simulada)", () => {
  const okBody = (text: string, extra: Record<string, unknown> = {}) => ({ ok: true, status: 200, json: async () => ({ model: "grok-4.3", output: [{ type: "web_search_call" }, { type: "web_search_call" }, { type: "message", content: [{ type: "output_text", text }] }], usage: { input_tokens: 5000, output_tokens: 400 }, ...extra }), text: async () => "" });

  it("envía solo nombre, RUC y ciudad con la herramienta de búsqueda web y lee el JSON de la respuesta", async () => {
    let seen: { url: string; headers: Record<string, string>; body: string } | null = null;
    const p = xaiProvider({ apiKey: "xai-secreta", model: "grok-4.3", baseUrl: "https://api.x.ai/v1/", fetchFn: async (url, init) => { seen = { url, headers: init.headers, body: init.body }; return okBody('Resultado:\n{"website":"marmolesandinos.com.pe","contacts":[{"kind":"correo","value":"ventas@marmolesandinos.com.pe","source_url":"https://marmolesandinos.com.pe/contacto"}]}'); } });
    const r = await p.research({ name: "Mármoles Andinos SAC", ruc: RUC, city: "Lima", knownDomain: null });
    expect(r).toMatchObject({ website: "marmolesandinos.com.pe", usage: { inputTokens: 5000, outputTokens: 400, searches: 2 } });
    expect(r.contacts).toHaveLength(1);
    expect(seen!.url).toBe("https://api.x.ai/v1/responses");
    expect(seen!.headers.authorization).toBe("Bearer xai-secreta");
    const body = JSON.parse(seen!.body);
    expect(body.tools).toEqual([{ type: "web_search" }]);
    expect(JSON.stringify(body.input)).toContain(RUC);
    expect(JSON.stringify(body)).not.toMatch(/xai-secreta|@apros/);
  });

  it("reintenta una vez ante un error del servidor, y explica la clave inválida sin filtrarla", async () => {
    let n = 0;
    const flaky = xaiProvider({ apiKey: "k", model: "grok-4.3", baseUrl: "https://api.x.ai/v1", sleep: async () => undefined, fetchFn: async () => (++n === 1 ? { ok: false, status: 503, json: async () => ({}), text: async () => "busy" } : okBody('{"website":null,"contacts":[]}')) });
    expect((await flaky.research({ name: "X", ruc: null, city: null, knownDomain: null })).website).toBeNull();
    expect(n).toBe(2);
    const bad = xaiProvider({ apiKey: "xai-secreta", model: "grok-4.3", baseUrl: "https://api.x.ai/v1", fetchFn: async () => ({ ok: false, status: 401, json: async () => ({}), text: async () => "unauthorized" }) });
    const e = await bad.research({ name: "X", ruc: null, city: null, knownDomain: null }).catch((x) => x);
    expect(e).toBeInstanceOf(ResearchCallError);
    expect(e.message).toMatch(/401.*XAI_API_KEY/);
    expect(e.message).not.toContain("xai-secreta");
  });

  it("rechaza respuestas que no son el JSON esperado", async () => {
    const mk = (text: string) => xaiProvider({ apiKey: "k", model: "grok-4.3", baseUrl: "https://api.x.ai/v1", fetchFn: async () => okBody(text) });
    for (const t of ["no hay json", '{"website": 5}', '{"website":null,"contacts":[{"kind":"hackeo","value":"x","source_url":"https://a.com"}]}']) {
      await expect(mk(t).research({ name: "X", ruc: null, city: null, knownDomain: null })).rejects.toBeInstanceOf(ResearchCallError);
    }
    expect(() => extractJson("{roto")).toThrow();
  });

  it("estima el costo con la tarifa del modelo y la de búsquedas (y sube si el modelo no se conoce)", () => {
    expect(estimateCostUsd("grok-4.3", { inputTokens: 1_000_000, outputTokens: 1_000_000, searches: 1000 })).toBeCloseTo(1.25 + 2.5 + 5, 5);
    expect(estimateCostUsd("grok-desconocido", { inputTokens: 1_000_000, outputTokens: 0, searches: 0 })).toBeCloseTo(2, 5);
  });
});

describe("filtro de contactos", () => {
  it("deja pasar solo lo que tiene forma válida y fuente, y normaliza", () => {
    const src = "https://empresa.example.com/contacto";
    const out = sanitizeContacts([
      { kind: "telefono", value: "(01) 234-5678", source_url: src }, { kind: "telefono", value: "+51 987 654 321", source_url: src }, { kind: "telefono", value: "123", source_url: src },
      { kind: "whatsapp", value: "https://wa.me/51987654321", source_url: src }, { kind: "whatsapp", value: "987654321", source_url: src }, { kind: "correo", value: "Ventas@Empresa.com.pe", source_url: src },
      { kind: "correo", value: "usuario@example.com", source_url: src }, { kind: "correo", value: "roto@", source_url: src }, { kind: "formulario", value: "javascript:alert(1)", source_url: src },
      { kind: "red_social", value: "https://www.facebook.com/empresa", source_url: src }, { kind: "red_social", value: "https://malo.com/empresa", source_url: src },
      { kind: "correo", value: "ok@empresa.com.pe", source_url: "no-es-url" },
    ]);
    expect(out.map((c) => `${c.kind}:${c.value}`)).toEqual(["telefono:12345678", "telefono:+51 987654321", "whatsapp:+51 987654321", "correo:ventas@empresa.com.pe", "red_social:https://www.facebook.com/empresa"]);
  });

  it("comprueba si un contacto aparece de verdad en el sitio de la empresa", () => {
    const ev = [pageEvidence(`<body>Llámanos al 987 654 321 o a ventas@empresa.com.pe <a href="https://www.facebook.com/empresa">FB</a></body>`)];
    const c = (kind: never, value: string) => ({ kind, value, source_url: "https://x.com" } as never);
    expect(appearsOnSite(c("telefono" as never, "+51 987654321"), "empresa.com.pe", ev)).toBe(true);
    expect(appearsOnSite(c("telefono" as never, "+51 911111111"), "empresa.com.pe", ev)).toBe(false);
    expect(appearsOnSite(c("correo" as never, "ventas@empresa.com.pe"), "empresa.com.pe", ev)).toBe(true);
    expect(appearsOnSite(c("red_social" as never, "https://www.facebook.com/empresa"), "empresa.com.pe", ev)).toBe(true);
    expect(appearsOnSite(c("formulario" as never, "https://empresa.com.pe/form"), "empresa.com.pe", ev)).toBe(true);
    expect(appearsOnSite(c("formulario" as never, "https://otro.com/form"), "empresa.com.pe", ev)).toBe(false);
  });
});

describe("investigación de una empresa", () => {
  it("asigna el sitio si en su portada aparece el RUC, guarda los contactos con su fuente y verifica los que ve en el sitio", async () => {
    const a = await mkActor("sales_lead");
    const co = await createCompany(a, { legal_name: "Marmoles Andinos S.A.C.", ruc: RUC, industry: "Industria" } as never);
    const w = web({ "marmolesandinos.example.com": page("Mármoles Andinos", `Contacto · RUC ${RUC}`) });
    const p = fake({ website: "https://www.marmolesandinos.example.com/", contacts: [
      { kind: "correo", value: "ventas@marmolesandinos.example.com", source_url: "https://marmolesandinos.example.com/contacto" },
      { kind: "whatsapp", value: "987654321", source_url: "https://marmolesandinos.example.com/contacto" },
      { kind: "telefono", value: "999 111 222", source_url: "https://directorio.example.com/marmoles" },
      { kind: "correo", value: "basura@example.com", source_url: "https://a.com" },
    ] });
    const r = await researchCompany(co.id, p, w);
    expect(r.status).toBe("ok");
    expect(r.website).toMatchObject({ status: "assigned", domain: "marmolesandinos.example.com" });
    expect((await getCompany(co.id))!.domain).toBe("marmolesandinos.example.com");
    expect(r.contacts).toEqual({ found: 3, verified: 2 });
    const cs = await listContacts(co.id);
    expect(cs.map((c) => `${c.kind}:${c.status}`).sort()).toEqual(["correo:verificado_en_sitio", "telefono:sin_verificar", "whatsapp:verificado_en_sitio"]);
    expect(cs.every((c) => /^https:\/\//.test(c.source_url))).toBe(true);
    const row = (await pool().query(`SELECT status, searches, cost_usd::float AS cost FROM company_research WHERE company_id = $1`, [co.id])).rows[0];
    expect(row).toMatchObject({ status: "ok", searches: 3 });
    expect(row.cost).toBeGreaterThan(0.015);
    // repetir no duplica
    await researchCompany(co.id, p, w);
    expect(await listContacts(co.id)).toHaveLength(3);
    expect((await contactsByCompany([co.id])).get(co.id)).toHaveLength(3);
  });

  it("si solo coincide el nombre, el sitio queda por confirmar; un sitio inventado se rechaza", async () => {
    const a = await mkActor("sales_lead");
    const c1 = await createCompany(a, { legal_name: "Marmoles Andinos S.A.C.", industry: "Industria" } as never);
    const c2 = await createCompany(a, { legal_name: "Cementos Norte S.A.C.", industry: "Industria" } as never);
    const w = web({ "marmolesandinos.example.com": page("Mármoles Andinos | Inicio"), "otra.example.com": page("Textiles del Sur") });
    expect((await researchCompany(c1.id, fake({ website: "marmolesandinos.example.com" }), w)).website.status).toBe("pending");
    expect((await researchCompany(c2.id, fake({ website: "otra.example.com" }), w)).website.status).toBe("rejected");
    expect((await getCompany(c1.id))!.domain).toBeNull();
    const src = (await pool().query(`SELECT source FROM company_website_candidates WHERE company_id = $1`, [c1.id])).rows[0].source;
    expect(src).toBe("grok");
  });

  it("no investiga a quien está en no contactar y registra los fallos del proveedor sin romperse", async () => {
    const a = await mkActor("admin");
    const blocked = await createCompany(a, { legal_name: "Bloqueada S.A.C.", ruc: RUC, industry: "Industria" } as never);
    await addDoNotContact(a, "company", RUC, "pidió no ser contactada");
    const p = fake({ website: "x.example.com" });
    expect(await researchCompany(blocked.id, p, web({}))).toMatchObject({ status: "skipped" });
    expect(p.calls).toHaveLength(0);
    const ok = await createCompany(a, { legal_name: "Normal S.A.C.", industry: "Industria" } as never);
    const failing: ResearchProvider = { id: "grok", model: "grok-4.3", async research() { throw new ResearchCallError("xAI respondió 500"); } };
    expect(await researchCompany(ok.id, failing, web({}))).toMatchObject({ status: "error", error: expect.stringContaining("500") });
    expect((await pool().query(`SELECT status FROM company_research WHERE company_id = $1`, [ok.id])).rows[0].status).toBe("error");
    expect((await companiesNeedingResearch(10)).map((x) => x.id)).not.toContain(ok.id); // un error espera 3 días
  });

  it("el lote respeta el tope de gasto y no repite empresas ya investigadas", async () => {
    const a = await mkActor("admin");
    for (const n of ["Uno", "Dos", "Tres", "Cuatro"]) await createCompany(a, { legal_name: `${n} Empresa S.A.C.`, industry: "Industria" } as never);
    const p = fake({}, { inputTokens: 0, outputTokens: 0, searches: 200 }); // ~1 USD por empresa
    const r = await researchBatch(p, { limit: 10, maxUsd: 2, webDeps: web({}) });
    expect(r).toMatchObject({ tried: 2, stoppedForBudget: true });
    expect(r.costUsd).toBeCloseTo(2, 1);
    expect((await companiesNeedingResearch(10))).toHaveLength(2);
  });
});

describe("corrida semanal con Grok", () => {
  it("investiga primero a las empresas sin sitio y deja el resumen en las estadísticas", async () => {
    const admin = await mkActor("admin");
    const co = await createCompany(admin, { legal_name: "Beta Buena SAC", ruc: RUC, industry: "Salud" } as never);
    const { deps } = fakeAnalyzerDeps({ "beta.example.com": { home: GOOD } });
    const p = fake({ website: "beta.example.com", contacts: [{ kind: "correo", value: "info@beta.example.com", source_url: "https://beta.example.com/contacto" }] });
    const r = await runWeeklyPipeline({ triggeredBy: admin.id, kind: "manual" }, { analyzer: deps, research: p, researchWeb: web({ "beta.example.com": page("Beta Buena", `RUC ${RUC}`) }) });
    expect(r.stats.research).toMatchObject({ tried: 1, websites: 1, contacts: 1 });
    expect((await getCompany(co.id))!.domain).toBe("beta.example.com");
    expect(r.stats.candidates).toBe(1); // y esa misma corrida ya la analiza
  });
});
