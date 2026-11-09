import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { createCompany, listCompanies, getCompany } from "@/lib/companies/service";
import { latestWebValidation, revalidateCompanyWebsite, setCompanyWebsite, validateWebsite, type WebDeps } from "@/lib/companies/web";
import { ForbiddenError } from "@/lib/rbac";
import type { Fetcher, FetchResult } from "@/lib/analyzer/safe-fetch";
import * as F from "./fixtures/sites";
import { mkActor, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

type Route = { robots?: FetchResult | "none"; home?: FetchResult };
/** Descargador simulado: un sitio por dominio; lo demás no resuelve. Registra las URL pedidas. */
function deps(sites: Record<string, Route>): { deps: WebDeps; calls: string[] } {
  const calls: string[] = [];
  const fetcher: Fetcher = async (url) => {
    calls.push(url);
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const s = sites[host];
    if (!s) return F.failure(url, "blocked", "el dominio no se pudo resolver (ENOTFOUND)");
    if (u.pathname === "/robots.txt") return s.robots === "none" || !s.robots ? F.httpError(url, 404) : s.robots;
    return s.home ?? F.ok(url, F.RICH_HOME);
  };
  return { deps: { fetcher, userAgent: "RadarAPROS/1.0" }, calls };
}
const robotsOk = (host: string, text = "User-agent: *\nAllow: /\n") => F.ok(`https://${host}/robots.txt`, text, { headers: { "content-type": "text/plain" } });

describe("validación del sitio web", () => {
  it("un sitio que responde y cuyo robots.txt permite la lectura queda verificado", async () => {
    const { deps: d, calls } = deps({ "rica.example.com": { robots: robotsOk("rica.example.com"), home: F.ok("https://rica.example.com/", F.RICH_HOME) } });
    const r = await validateWebsite("https://www.Rica.example.com/contacto?x=1", d);
    expect(r).toMatchObject({ status: "ok", domain: "rica.example.com", robots: "permite", redirectsTo: null, httpStatus: 200 });
    expect(calls).toEqual(["https://rica.example.com/robots.txt", "https://rica.example.com/"]);
  });

  it("rechaza lo que no es una dirección propia, sin hacer ninguna petición", async () => {
    const { deps: d, calls } = deps({});
    for (const bad of ["", "no es un dominio", "http://127.0.0.1", "facebook.com/miempresa", "gmail.com", "localhost", "https://[::1]/"]) {
      const r = await validateWebsite(bad, d);
      expect(r.status, bad).toBe("failed");
      expect(r.domain, bad).toBeNull();
    }
    expect(calls).toEqual([]);
  });

  it("un dominio que no resuelve (o apunta a una dirección no pública) se rechaza", async () => {
    const { deps: d } = deps({});
    const r = await validateWebsite("no-existe.example.com", d);
    expect(r).toMatchObject({ status: "failed", domain: "no-existe.example.com" });
    expect(r.messages.join(" ")).toMatch(/no se pudo consultar/i);
  });

  it("si robots.txt no permite la portada, avisa y NO pide la portada", async () => {
    const { deps: d, calls } = deps({ "cerrado.example.com": { robots: robotsOk("cerrado.example.com", "User-agent: *\nDisallow: /\n") } });
    const r = await validateWebsite("cerrado.example.com", d);
    expect(r).toMatchObject({ status: "warning", robots: "bloquea" });
    expect(r.messages[0]).toMatch(/no permite la lectura automática/);
    expect(calls).toEqual(["https://cerrado.example.com/robots.txt"]);
  });

  it("avisa de redirecciones a otro dominio, errores HTTP y desafíos antibots, sin rechazar", async () => {
    const { deps: d } = deps({
      "viejo.example.com": { robots: "none", home: F.ok("https://nuevo.example.org/", F.RICH_HOME) },
      "roto.example.com": { robots: "none", home: F.httpError("https://roto.example.com/", 404) },
      "waf.example.com": { robots: "none", home: F.httpError("https://waf.example.com/", 403, F.CHALLENGE_HTML) },
      "lento.example.com": { robots: "none", home: F.failure("https://lento.example.com/", "timeout", "tiempo agotado") },
      "tls.example.com": { robots: "none", home: F.failure("https://tls.example.com/", "tls_error", "certificado") },
    });
    expect(await validateWebsite("viejo.example.com", d)).toMatchObject({ status: "warning", redirectsTo: "nuevo.example.org", robots: "sin_robots" });
    expect((await validateWebsite("roto.example.com", d)).messages.join(" ")).toMatch(/no encontrada/);
    expect((await validateWebsite("waf.example.com", d)).messages.join(" ")).toMatch(/antibots/);
    expect((await validateWebsite("lento.example.com", d)).messages.join(" ")).toMatch(/no respondió a tiempo/);
    expect((await validateWebsite("tls.example.com", d)).messages.join(" ")).toMatch(/certificado/);
    for (const h of ["roto", "waf", "lento", "tls"]) expect((await validateWebsite(`${h}.example.com`, d)).status).toBe("warning");
  });

  it("un robots.txt con desafío antibots se informa como «no verificado» y no bloquea el guardado", async () => {
    const { deps: d } = deps({ "waf.example.com": { robots: F.httpError("https://waf.example.com/robots.txt", 403, F.CHALLENGE_HTML), home: F.ok("https://waf.example.com/", F.RICH_HOME) } });
    const r = await validateWebsite("waf.example.com", d);
    expect(r).toMatchObject({ status: "warning", robots: "no_verificado" });
    expect(r.messages[0]).toMatch(/antibots/);
  });
});

describe("asignar el sitio web a una empresa", () => {
  async function setup() {
    const admin = await mkActor("admin");
    const { id } = await createCompany(admin, { legal_name: "Sin Web SAC", industry: "Salud" });
    return { admin, id };
  }

  it("valida, asigna el dominio normalizado y deja el registro de la comprobación con quién y cuándo", async () => {
    const { admin, id } = await setup();
    const { deps: d } = deps({ "sinweb.example.com": { robots: robotsOk("sinweb.example.com") } });
    const r = await setCompanyWebsite(admin, id, "HTTPS://www.SinWeb.example.com/inicio", d);
    expect(r.status).toBe("ok");
    expect((await getCompany(id))!.domain).toBe("sinweb.example.com");
    const v = (await latestWebValidation(id))!;
    expect(v).toMatchObject({ domain: "sinweb.example.com", status: "ok", robots: "permite", http_status: 200, checked_by_email: "admin@apros.pe" });
    expect((await pool().query(`SELECT count(*)::int AS n FROM audit_log WHERE action = 'company.web_validated'`)).rows[0].n).toBe(1);
  });

  it("un dominio que no resuelve no se guarda y no deja la empresa cambiada", async () => {
    const { admin, id } = await setup();
    await expect(setCompanyWebsite(admin, id, "no-existe.example.com", deps({}).deps)).rejects.toThrow(/no se pudo consultar/i);
    await expect(setCompanyWebsite(admin, id, "facebook.com/x", deps({}).deps)).rejects.toThrow(/no es válida/);
    expect((await getCompany(id))!.domain).toBeNull();
  });

  it("con avisos se guarda igual y el aviso queda registrado", async () => {
    const { admin, id } = await setup();
    const { deps: d } = deps({ "waf.example.com": { robots: "none", home: F.httpError("https://waf.example.com/", 403, F.CHALLENGE_HTML) } });
    const r = await setCompanyWebsite(admin, id, "waf.example.com", d);
    expect(r.status).toBe("warning");
    expect((await getCompany(id))!.domain).toBe("waf.example.com");
    expect((await latestWebValidation(id))!.detail.messages!.join(" ")).toMatch(/antibots/);
  });

  it("no permite el mismo dominio en dos empresas", async () => {
    const { admin, id } = await setup();
    const other = await createCompany(admin, { legal_name: "Otra SAC", website: "ocupado.example.com", industry: "Salud" });
    const { deps: d } = deps({ "ocupado.example.com": { robots: "none" } });
    await expect(setCompanyWebsite(admin, id, "ocupado.example.com", d)).rejects.toThrow(/ya|existe|dominio/i);
    expect((await getCompany(id))!.domain).toBeNull();
    expect(other.id).toBeTruthy();
  });

  it("respeta los permisos: lectura no cambia nada; un vendedor solo sus empresas o las libres; sin red si no tiene permiso", async () => {
    const { admin, id } = await setup();
    const { deps: d, calls } = deps({ "x.example.com": { robots: "none" } });
    await expect(setCompanyWebsite(await mkActor("read_only"), id, "x.example.com", d)).rejects.toBeInstanceOf(ForbiddenError);
    const ana = await mkActor("salesperson", "ana@apros.pe");
    const beto = await mkActor("salesperson", "beto@apros.pe");
    await pool().query("UPDATE companies SET owner_id = $1 WHERE id = $2", [beto.id, id]);
    await expect(setCompanyWebsite(ana, id, "x.example.com", d)).rejects.toBeInstanceOf(ForbiddenError);
    expect(calls).toEqual([]); // ni siquiera se consultó el sitio
    await setCompanyWebsite(beto, id, "x.example.com", d);
    expect((await getCompany(id))!.domain).toBe("x.example.com");
    expect(admin.id).toBeTruthy();
  });

  it("se puede volver a comprobar el sitio; sin sitio no hay nada que comprobar", async () => {
    const { admin, id } = await setup();
    await expect(revalidateCompanyWebsite(admin, id, deps({}).deps)).rejects.toThrow(/no tiene sitio web/);
    const { deps: d } = deps({ "sinweb.example.com": { robots: "none" } });
    await setCompanyWebsite(admin, id, "sinweb.example.com", d);
    const again = await revalidateCompanyWebsite(admin, id, d);
    expect(again.status).toBe("ok");
    expect((await pool().query("SELECT count(*)::int AS n FROM company_web_validations WHERE company_id = $1", [id])).rows[0].n).toBe(2);
  });

  it("el filtro «sin sitio web» de la lista de empresas encuentra solo las que no tienen", async () => {
    const { admin, id } = await setup();
    await createCompany(admin, { legal_name: "Con Web SAC", website: "conweb.example.com", industry: "Salud" });
    const noWeb = await listCompanies({ noWeb: true });
    expect(noWeb.rows.map((r) => r.id)).toEqual([id]);
    expect((await listCompanies({})).total).toBe(2);
  });
});
