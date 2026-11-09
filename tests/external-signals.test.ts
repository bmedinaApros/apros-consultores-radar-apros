import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { createCompany } from "@/lib/companies/service";
import { addExternalSignal, listExternalSignals, removeExternalSignal, searchLinks } from "@/lib/companies/external-signals";
import { ForbiddenError } from "@/lib/rbac";
import { mkActor, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

const today = new Date().toISOString().slice(0, 10);

describe("señales externas manuales", () => {
  it("registra, lista con quién la anotó, audita y permite quitar", async () => {
    const a = await mkActor("sales_lead");
    const c = await createCompany(a, { legal_name: "Constructora Andina S.A.C.", website: "andina.example.com" });
    await addExternalSignal(a, c.id, { kind: "aviso_empleo", source: "Computrabajo", detail: "Busca community manager", url: "https://pe.computrabajo.com/x", observedOn: today });
    const l = await listExternalSignals(c.id);
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ kind: "aviso_empleo", source: "Computrabajo", observed_on: today });
    expect((await pool().query(`SELECT count(*)::int AS n FROM audit_log WHERE action = 'company.external_signal_added'`)).rows[0].n).toBe(1);
    await removeExternalSignal(a, l[0]!.id);
    expect(await listExternalSignals(c.id)).toHaveLength(0);
  });

  it("rechaza datos inválidos, fechas futuras y enlaces que no son http(s)", async () => {
    const a = await mkActor("sales_lead");
    const c = await createCompany(a, { legal_name: "Empresa Uno S.A.C.", website: "uno.example.com" });
    await expect(addExternalSignal(a, c.id, { kind: "otra", detail: "ab", observedOn: today })).rejects.toThrow(/Revisa/);
    await expect(addExternalSignal(a, c.id, { kind: "otra", detail: "algo válido", url: "javascript:alert(1)", observedOn: today })).rejects.toThrow();
    await expect(addExternalSignal(a, c.id, { kind: "otra", detail: "algo válido", observedOn: "2099-01-01" })).rejects.toThrow(/futura/);
    await expect(addExternalSignal(a, c.id, { kind: "inventado", detail: "algo válido", observedOn: today })).rejects.toThrow();
    expect(await listExternalSignals(c.id)).toHaveLength(0);
  });

  it("solo quien puede editar la empresa registra señales", async () => {
    const a = await mkActor("sales_lead");
    const c = await createCompany(a, { legal_name: "Empresa Dos S.A.C.", website: "dos.example.com" });
    const ro = await mkActor("read_only");
    await expect(addExternalSignal(ro, c.id, { kind: "otra", detail: "algo válido", observedOn: today })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("los enlaces de búsqueda apuntan a sitios conocidos y codifican el nombre", () => {
    const l = searchLinks('Mi "Empresa" & Cía S.A.C.');
    expect(l.map((x) => x.label)).toEqual(["Computrabajo", "Bumeran", "Laborum", "Biblioteca de anuncios de Meta", "Indecopi (marcas)"]);
    for (const x of l) {
      const u = new URL(x.href);
      expect(["www.google.com", "www.facebook.com"]).toContain(u.hostname);
      expect(x.href).not.toContain('"Empresa"');
    }
  });
});
