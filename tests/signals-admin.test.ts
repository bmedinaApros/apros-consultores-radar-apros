import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { createIndustrySignal, deleteIndustrySignal, listIndustrySignals, parseKeywords, updateIndustrySignal } from "@/lib/analyzer/service";
import { listIndustries } from "@/lib/companies/service";
import { ForbiddenError } from "@/lib/rbac";
import { buildRobotsPolicy } from "@/lib/analyzer/robots";
import { looksLikeChallenge } from "@/lib/analyzer/extract";
import { mkActor, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

describe("señales por rubro configurables", () => {
  it("vienen cargadas para los siete rubros de ejemplo", async () => {
    const s = await listIndustrySignals();
    expect(new Set(s.map((x) => x.industry_name)).size).toBe(7);
  });

  it("un administrador crea, edita y elimina una señal sin tocar código", async () => {
    const admin = await mkActor("admin");
    const industry = (await listIndustries()).find((i) => i.slug === "salud")!;
    await createIndustrySignal(admin, { industryId: industry.id, name: "Telemedicina", keywords: "teleconsulta\nvideoconsulta, consulta virtual", scope: "text" });
    const created = (await listIndustrySignals()).find((s) => s.slug === "telemedicina")!;
    expect(created.keywords).toEqual(["teleconsulta", "videoconsulta", "consulta virtual"]);
    await updateIndustrySignal(admin, created.id, { name: "Telemedicina", keywords: "teleconsulta", scope: "links", active: false });
    expect((await listIndustrySignals()).find((s) => s.id === created.id)).toMatchObject({ scope: "links", active: false });
    await deleteIndustrySignal(admin, created.id);
    expect((await listIndustrySignals()).find((s) => s.id === created.id)).toBeUndefined();
  });

  it("rechaza duplicados y solo el administrador puede editar", async () => {
    const admin = await mkActor("admin");
    const lead = await mkActor("sales_lead");
    const industry = (await listIndustries())[0]!;
    await createIndustrySignal(admin, { industryId: industry.id, name: "Nueva", keywords: "uno", scope: "text" });
    await expect(createIndustrySignal(admin, { industryId: industry.id, name: "Nueva", keywords: "dos", scope: "text" })).rejects.toThrow(/Ya existe/);
    await expect(createIndustrySignal(lead, { industryId: industry.id, name: "Otra", keywords: "uno", scope: "text" })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("las palabras clave son texto simple, acotado y sin duplicados", () => {
    expect(parseKeywords("Cotiza, COTIZA ;  simulador \n\n x")).toEqual(["Cotiza", "simulador"]);
    expect(() => parseKeywords("  ,  ")).toThrow();
    expect(() => parseKeywords(Array.from({ length: 21 }, (_, i) => `palabra${i}`).join("\n"))).toThrow(/Máximo 20/);
    // una expresión regular maliciosa se trata como texto literal (no se compila)
    expect(parseKeywords("(a+)+$")).toEqual(["(a+)+$"]);
  });
});

describe("robots.txt", () => {
  const UA = "RadarAPROS/1.0 (+https://apros.pe)";
  it("aplica reglas por agente, comodines y Allow", () => {
    const p = buildRobotsPolicy("https://x.pe", { kind: "rules", text: "User-agent: *\nDisallow: /privado/\nAllow: /privado/publico\n\nUser-agent: RadarAPROS\nDisallow: /solo-nosotros\n" }, UA);
    expect(p.allowed("https://x.pe/solo-nosotros")).toBe(false);
    expect(p.allowed("https://x.pe/privado/x")).toBe(true); // el grupo específico reemplaza a «*»
    expect(p.allowed("https://x.pe/")).toBe(true);
  });
  it("sin robots.txt (404) se permite; con error del servidor no se rastrea", () => {
    expect(buildRobotsPolicy("https://x.pe", { kind: "none" }, UA).allowed("https://x.pe/a")).toBe(true);
    expect(buildRobotsPolicy("https://x.pe", { kind: "unreachable", reason: "503" }, UA).allowed("https://x.pe/a")).toBe(false);
  });
  it("distingue una regla explícita de una heredada para rastreadores de IA", () => {
    const p = buildRobotsPolicy("https://x.pe", { kind: "rules", text: "User-agent: *\nDisallow: /\n\nUser-agent: GPTBot\nAllow: /\n" }, UA);
    const r = p.aiRules();
    expect(r.GPTBot).toBe("allowed");
    expect(r.ClaudeBot).toBe("unspecified_blocked");
  });
});

describe("detección de bloqueos antibots", () => {
  it("reconoce desafíos conocidos y respuestas 429, pero no una página normal", () => {
    expect(looksLikeChallenge(403, {}, "<title>Just a moment...</title>")).toBe(true);
    expect(looksLikeChallenge(200, { "cf-mitigated": "challenge" }, "")).toBe(true);
    expect(looksLikeChallenge(429, {}, "")).toBe(true);
    expect(looksLikeChallenge(200, {}, "<html><title>Inicio</title><p>Bienvenidos</p></html>")).toBe(false);
    expect(looksLikeChallenge(404, {}, "<p>No encontrada</p>")).toBe(false);
  });
});
