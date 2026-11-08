import { existsSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { NAV, NAV_SETTINGS, activeFor, parseUiPrefs, visibleNav } from "@/lib/nav";
import { ROLES } from "@/lib/rbac";
import { classifyQuery, searchCompanies, SEARCH_MAX_RESULTS } from "@/lib/search";
import { createSession, getSessionUser } from "@/lib/session";
import { saveNavCollapsed } from "@/lib/ui-prefs";
import { addDoNotContact, createCompany } from "@/lib/companies/service";
import { mkActor, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

describe("menú por tareas", () => {
  it("tiene como máximo cinco grupos principales más Configuración, sin entradas repetidas", () => {
    for (const role of ROLES) expect(visibleNav(role).main.length).toBeLessThanOrEqual(5);
    expect(NAV.length).toBeLessThanOrEqual(5);
    const hrefs = [...NAV.flatMap((g) => (g.href ? [g.href] : g.items.map((i) => i.href))), ...NAV_SETTINGS.items.map((i) => i.href)];
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("no tiene enlaces muertos: cada entrada corresponde a una pantalla que existe", () => {
    const hrefs = [...NAV.flatMap((g) => (g.href ? [g.href] : g.items.map((i) => i.href))), ...NAV_SETTINGS.items.map((i) => i.href)];
    for (const h of hrefs) {
      const page = path.resolve(__dirname, "../src/app", h === "/" ? "" : h.slice(1), "page.tsx");
      expect(existsSync(page), `${h} → ${page}`).toBe(true);
    }
  });

  it("cada rol ve solo lo que puede usar; Configuración solo aparece si hay algo permitido", () => {
    const labels = (r: (typeof ROLES)[number]) => visibleNav(r).main.flatMap((g) => g.items.map((i) => i.label));
    const settings = (r: (typeof ROLES)[number]) => visibleNav(r).settings?.items.map((i) => i.label) ?? null;
    expect(settings("admin")).toEqual(NAV_SETTINGS.items.map((i) => i.label));
    expect(labels("admin")).toEqual(expect.arrayContaining(["Empresas", "Importar CSV", "Fuentes", "Diagnósticos", "Duplicados"]));
    // El líder de ventas ve solo las dos entradas de Configuración que su permiso permite
    expect(settings("sales_lead")).toEqual(["No contactar", "Auditoría"]);
    expect(labels("sales_lead")).not.toContain("Fuentes");
    // Sin permisos de administración no hay Configuración
    for (const r of ["consultant", "salesperson", "read_only"] as const) expect(settings(r)).toBeNull();
    expect(labels("read_only")).toEqual(["Empresas", "Lista semanal", "Bandeja de revisión", "Diagnósticos"]);
    expect(labels("salesperson")).not.toContain("Duplicados");
    // Inicio siempre está
    for (const r of ROLES) expect(visibleNav(r).main[0]).toMatchObject({ id: "inicio", href: "/" });
  });

  it("resuelve el grupo y la página activos con la coincidencia más específica", () => {
    const admin = [...visibleNav("admin").main, visibleNav("admin").settings!];
    expect(activeFor(admin, "/")).toEqual({ groupId: "inicio", href: "/" });
    expect(activeFor(admin, "/companies")).toEqual({ groupId: "prospectar", href: "/companies" });
    expect(activeFor(admin, "/companies/0b7c")).toEqual({ groupId: "prospectar", href: "/companies" });
    expect(activeFor(admin, "/companies/import")).toEqual({ groupId: "prospectar", href: "/companies/import" });
    expect(activeFor(admin, "/companies/import/xyz")).toEqual({ groupId: "prospectar", href: "/companies/import" });
    expect(activeFor(admin, "/diagnostics/abc")).toEqual({ groupId: "analizar", href: "/diagnostics" });
    expect(activeFor(admin, "/admin/users")).toEqual({ groupId: "configuracion", href: "/admin/users" });
    expect(activeFor(admin, "/companiesx")).toEqual({ groupId: null, href: null }); // prefijo sin barra no cuenta
    expect(activeFor(admin, "/account/password")).toEqual({ groupId: null, href: null });
  });

  it("las preferencias guardadas con otra forma se descartan", () => {
    expect(parseUiPrefs(null)).toEqual({ navCollapsed: false });
    expect(parseUiPrefs("x")).toEqual({ navCollapsed: false });
    expect(parseUiPrefs({ navCollapsed: "true" })).toEqual({ navCollapsed: false });
    expect(parseUiPrefs({ navCollapsed: true })).toEqual({ navCollapsed: true });
  });
});

describe("preferencia del menú por usuario", () => {
  it("se guarda por usuario, sobrevive a cerrar sesión y no pisa otras claves ni a otros usuarios", async () => {
    const a = await mkActor("consultant", "a@apros.pe");
    const b = await mkActor("consultant", "b@apros.pe");
    await pool().query(`UPDATE users SET ui_prefs = '{"otra":1}'::jsonb WHERE id = $1`, [a.id]);
    const s1 = await createSession(a.id, "t");
    expect((await getSessionUser(s1.token))!.uiPrefs.navCollapsed).toBe(false);
    await saveNavCollapsed(a.id, true);
    expect((await getSessionUser(s1.token))!.uiPrefs.navCollapsed).toBe(true);
    // otra sesión (por ejemplo, tras cerrar y volver a entrar) mantiene la preferencia
    const s2 = await createSession(a.id, "t2");
    expect((await getSessionUser(s2.token))!.uiPrefs.navCollapsed).toBe(true);
    expect((await pool().query("SELECT ui_prefs FROM users WHERE id = $1", [a.id])).rows[0].ui_prefs).toEqual({ otra: 1, navCollapsed: true });
    const sb = await createSession(b.id, "t3");
    expect((await getSessionUser(sb.token))!.uiPrefs.navCollapsed).toBe(false);
    await saveNavCollapsed(a.id, false);
    expect((await getSessionUser(s2.token))!.uiPrefs.navCollapsed).toBe(false);
  });

  it("la base impide guardar preferencias enormes o con forma inválida", async () => {
    const a = await mkActor("consultant");
    await expect(pool().query(`UPDATE users SET ui_prefs = $2::jsonb WHERE id = $1`, [a.id, JSON.stringify({ x: "y".repeat(3000) })])).rejects.toThrow();
    await expect(pool().query(`UPDATE users SET ui_prefs = '[1]'::jsonb WHERE id = $1`, [a.id])).rejects.toThrow();
  });
});

describe("búsqueda global", () => {
  it("interpreta RUC, dominio y nombre, y exige al menos 3 caracteres", () => {
    expect(classifyQuery("ab")).toBeNull();
    expect(classifyQuery("  20123456789 ")).toEqual({ kind: "ruc", value: "20123456789" });
    expect(classifyQuery("https://www.Ejemplo.pe/contacto")).toEqual({ kind: "domain", value: "ejemplo.pe" });
    expect(classifyQuery("Inmobiliaria  Alfa")).toEqual({ kind: "name", value: "inmobiliaria alfa" });
  });

  async function seed() {
    const admin = await mkActor("admin");
    const mk = (legal_name: string, website: string, ruc?: string) => createCompany(admin, { legal_name, website, industry: "Inmobiliario", ...(ruc ? { ruc } : {}) });
    await mk("Inmobiliaria Alfa SAC", "alfa.example.com", "20111111112");
    await mk("Constructora Beta SAC", "beta.example.com", "20222222223");
    await mk("Gamma 100% Natural SAC", "gamma.example.com");
    return admin;
  }

  it("encuentra por RUC (exacto o prefijo), dominio y nombre", async () => {
    await seed();
    expect((await searchCompanies("20111111112")).map((h) => h.name)).toEqual(["Inmobiliaria Alfa SAC"]);
    expect((await searchCompanies("2022")).map((h) => h.name)).toEqual(["Constructora Beta SAC"]);
    expect((await searchCompanies("beta.example.com")).map((h) => h.name)).toEqual(["Constructora Beta SAC"]);
    expect((await searchCompanies("https://www.alfa.example.com/x")).map((h) => h.ruc)).toEqual(["20111111112"]);
    expect((await searchCompanies("constructora")).map((h) => h.name)).toEqual(["Constructora Beta SAC"]);
    expect(await searchCompanies("zzzzzz")).toEqual([]);
    expect(await searchCompanies("ab")).toEqual([]);
  });

  it("no interpreta comodines del usuario y no es vulnerable a inyección", async () => {
    await seed();
    expect(await searchCompanies("%%%")).toEqual([]);
    expect(await searchCompanies("___")).toEqual([]);
    expect((await searchCompanies("100% natural")).map((h) => h.name)).toEqual(["Gamma 100% Natural SAC"]);
    expect(await searchCompanies("'; DROP TABLE companies; --")).toEqual([]);
    expect((await pool().query("SELECT count(*)::int AS n FROM companies")).rows[0].n).toBe(3);
  });

  it("marca las empresas en no contactar sin ocultarlas, y limita los resultados", async () => {
    const admin = await seed();
    await addDoNotContact(admin, "domain", "alfa.example.com", "Pidió no ser contactada");
    const hit = (await searchCompanies("alfa.example.com"))[0]!;
    expect(hit).toMatchObject({ name: "Inmobiliaria Alfa SAC", dnc: true });
    expect((await searchCompanies("beta.example.com"))[0]!.dnc).toBe(false);
    for (let i = 0; i < 12; i++) await createCompany(admin, { legal_name: `Masiva ${i} SAC`, website: `masiva${i}.example.com`, industry: "Retail" });
    expect((await searchCompanies("masiva")).length).toBe(SEARCH_MAX_RESULTS);
  });
});
