import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { createCompany, getCompany } from "@/lib/companies/service";
import { acceptCandidate, companiesNeedingWebsite, discoverWebsite, domainCandidates, listAllPendingCandidates, listPendingCandidates, websiteStats, matchEvidence, nameTokens, proposeWebsite, rejectCandidate } from "@/lib/companies/discover-web";
import type { WebDeps } from "@/lib/companies/web";
import type { Fetcher } from "@/lib/analyzer/safe-fetch";
import * as F from "./fixtures/sites";
import { mkActor, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

const page = (title: string, body = "") => `<html><head><title>${title}</title></head><body><h1>${title}</h1><p>${body}</p></body></html>`;
/** Descargador simulado: solo resuelven los dominios dados; todos permiten robots (404 = sin reglas). */
function deps(sites: Record<string, string>): { deps: WebDeps; calls: string[] } {
  const calls: string[] = [];
  const fetcher: Fetcher = async (url) => {
    calls.push(url);
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const html = sites[host];
    if (html === undefined) return F.failure(url, "blocked", "el dominio no se pudo resolver (ENOTFOUND)");
    if (u.pathname === "/robots.txt") return F.httpError(url, 404);
    return F.ok(url, html);
  };
  return { deps: { fetcher, userAgent: "RadarAPROS/1.0" }, calls };
}

describe("direcciones probables y coincidencia", () => {
  it("arma pocas direcciones válidas, sin palabras vacías ni genéricas solas", () => {
    expect(nameTokens("COMPAÑIA NACIONAL DE MARMOLES S A")).toEqual(["compania", "nacional", "marmoles"]);
    const c = domainCandidates("Marmoles Andinos S.A.C.");
    expect(c).toContain("marmolesandinos.com.pe");
    expect(c).toContain("marmoles-andinos.pe");
    expect(c.length).toBeLessThanOrEqual(9);
    expect(domainCandidates("Inmobiliaria S.A.C.").some((d) => d.startsWith("inmobiliaria."))).toBe(false); // una palabra genérica sola no sirve
    expect(domainCandidates("S.A.")).toEqual([]);
  });

  it("alta si aparece el RUC, media si el nombre está en el título, baja solo en el cuerpo, nada si está en venta", () => {
    const n = "Marmoles Andinos S.A.C.";
    expect(matchEvidence(page("Inicio", "RUC 20100070970"), n, "20100070970").confidence).toBe("alta");
    expect(matchEvidence(page("Mármoles Andinos | Cotiza"), n, "20100070970").confidence).toBe("media");
    expect(matchEvidence(page("Bienvenidos", "trabajamos con marmoles andinos desde 2010"), n, null).confidence).toBe("baja");
    expect(matchEvidence(page("Marmoles Andinos", "This domain may be for sale"), n, null).confidence).toBeNull();
    expect(matchEvidence(page("Otra empresa", "nada que ver"), n, "20100070970").confidence).toBeNull();
  });
});

describe("búsqueda automática del sitio", () => {
  it("asigna solo cuando el RUC aparece en la portada y deja constancia", async () => {
    const a = await mkActor("sales_lead");
    const c = await createCompany(a, { legal_name: "Marmoles Andinos S.A.C.", ruc: "20100070970", industry: "Industria" } as never);
    const { deps: d } = deps({ "marmolesandinos.com.pe": page("Mármoles Andinos", "Contacto · RUC 20100070970") });
    const r = await discoverWebsite(c.id, d);
    expect(r.assigned).toBe("marmolesandinos.com.pe");
    expect((await getCompany(c.id))!.domain).toBe("marmolesandinos.com.pe");
    expect((await pool().query(`SELECT count(*)::int AS n FROM audit_log WHERE action = 'company.website_auto_assigned'`)).rows[0].n).toBe(1);
    expect((await pool().query(`SELECT status FROM company_website_candidates WHERE company_id = $1`, [c.id])).rows[0].status).toBe("accepted");
  });

  it("si solo coincide el nombre, queda sugerido y una persona lo confirma o lo descarta", async () => {
    const a = await mkActor("sales_lead");
    const c = await createCompany(a, { legal_name: "Marmoles Andinos S.A.C.", industry: "Industria" } as never);
    const { deps: d } = deps({ "marmolesandinos.com.pe": page("Mármoles Andinos | Inicio"), "marmoles-andinos.pe": page("Marmoles Andinos Lima") });
    const r = await discoverWebsite(c.id, d);
    expect(r.assigned).toBeNull();
    expect(r.pending.sort()).toEqual(["marmoles-andinos.pe", "marmolesandinos.com.pe"]);
    expect((await getCompany(c.id))!.domain).toBeNull();
    const [first, second] = await listPendingCandidates(c.id);
    await rejectCandidate(a, second!.id);
    await acceptCandidate(a, first!.id, d);
    expect((await getCompany(c.id))!.domain).toBe(first!.domain);
    expect(await listPendingCandidates(c.id)).toHaveLength(0);
  });

  it("no inventa: sin coincidencias no propone nada, y no se vuelve a intentar enseguida", async () => {
    const a = await mkActor("sales_lead");
    const c = await createCompany(a, { legal_name: "Marmoles Andinos S.A.C.", industry: "Industria" } as never);
    const { deps: d } = deps({ "marmolesandinos.com": page("Dominio de otra empresa", "Textiles del Sur") });
    const r = await discoverWebsite(c.id, d);
    expect(r).toMatchObject({ found: 0, assigned: null, pending: [] });
    expect((await companiesNeedingWebsite(10)).map((x) => x.id)).not.toContain(c.id);
    await pool().query(`UPDATE company_website_attempts SET attempted_at = now() - interval '40 days'`);
    expect((await companiesNeedingWebsite(10)).map((x) => x.id)).toContain(c.id);
  });

  it("no busca para empresas con sitio ni en no contactar", async () => {
    const a = await mkActor("sales_lead");
    const c = await createCompany(a, { legal_name: "Con Sitio S.A.C.", website: "consitio.example.com", industry: "Industria" } as never);
    const { deps: d, calls } = deps({});
    expect((await discoverWebsite(c.id, d)).skipped).toMatch(/ya tiene/);
    expect(calls).toHaveLength(0);
  });
});

describe("propuesta externa (Comité IA)", () => {
  it("valida la propuesta como cualquier otra: sin evidencia se rechaza, con RUC se asigna, con nombre queda pendiente", async () => {
    const a = await mkActor("sales_lead");
    const c = await createCompany(a, { legal_name: "Marmoles Andinos S.A.C.", ruc: "20100070970", industry: "Industria" } as never);
    const { deps: d } = deps({ "otra.example.com": page("Textiles del Sur"), "ruc.example.com": page("Inicio", "RUC 20100070970"), "nombre.example.com": page("Marmoles Andinos") });
    expect((await proposeWebsite(c.id, "https://otra.example.com", "ia", d)).status).toBe("rejected");
    expect((await proposeWebsite(c.id, "inexistente.example.com", "ia", d)).status).toBe("rejected");
    expect((await proposeWebsite(c.id, "facebook.com/marmoles", "ia", d)).status).toBe("rejected");
    expect((await proposeWebsite(c.id, "nombre.example.com", "ia", d)).status).toBe("pending");
    expect((await getCompany(c.id))!.domain).toBeNull();
    expect((await proposeWebsite(c.id, "https://www.ruc.example.com/contacto", "ia", d)).status).toBe("assigned");
    expect((await getCompany(c.id))!.domain).toBe("ruc.example.com");
  });
});

describe("vista de sitios por confirmar", () => {
  it("junta las sugerencias de todas las empresas, con el resumen, y deja de listar las resueltas", async () => {
    const a = await mkActor("sales_lead");
    const c1 = await createCompany(a, { legal_name: "Marmoles Andinos S.A.C.", industry: "Industria" } as never);
    const c2 = await createCompany(a, { legal_name: "Cementos Norte S.A.C.", industry: "Industria" } as never);
    const c3 = await createCompany(a, { legal_name: "Sin Rastro S.A.C.", industry: "Industria" } as never);
    const { deps: d } = deps({ "marmolesandinos.com.pe": page("Mármoles Andinos"), "cementosnorte.com.pe": page("Cementos Norte | Lima") });
    for (const c of [c1, c2, c3]) await discoverWebsite(c.id, d);
    const st = await websiteStats();
    expect(st).toMatchObject({ intentadas: 3, por_confirmar: 2, asignadas: 0, sin_sitio: 3, con_sitio: 0 });
    const all = await listAllPendingCandidates();
    expect(all.total).toBe(2);
    expect(all.rows.map((r) => r.legal_name).sort()).toEqual(["Cementos Norte S.A.C.", "Marmoles Andinos S.A.C."]);
    expect(all.rows[0]).toMatchObject({ confidence: "media", source: "auto" });
    await acceptCandidate(a, all.rows[0]!.id, d);
    expect((await listAllPendingCandidates()).total).toBe(1);
    expect(await websiteStats()).toMatchObject({ por_confirmar: 1, asignadas: 1, con_sitio: 1 });
  });
});
