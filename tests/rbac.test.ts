import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLES, can, canModifyOwned, requirePermission, ForbiddenError } from "@/lib/rbac";

describe("RBAC", () => {
  it("define los cinco roles del prompt", () => {
    expect([...ROLES].sort()).toEqual(["admin", "consultant", "read_only", "sales_lead", "salesperson"]);
  });

  it("el administrador tiene todos los permisos", () => {
    for (const p of PERMISSIONS) expect(can("admin", p)).toBe(true);
  });

  it("solo el administrador gestiona usuarios y catálogos", () => {
    for (const role of ROLES.filter((r) => r !== "admin")) {
      expect(can(role, "users.manage")).toBe(false);
      expect(can(role, "catalog.manage")).toBe(false);
      expect(can(role, "sources.manage")).toBe(false);
    }
  });

  it("el rol de lectura no puede escribir nada", () => {
    for (const p of PERMISSIONS.filter((p) => !p.endsWith(".read"))) expect(can("read_only", p)).toBe(false);
  });

  it("un vendedor no aprueba diagnósticos ni ve la auditoría", () => {
    expect(can("salesperson", "diagnostics.approve")).toBe(false);
    expect(can("salesperson", "audit.read")).toBe(false);
  });

  it("el consultor aprueba diagnósticos pero no importa empresas", () => {
    expect(can("consultant", "diagnostics.approve")).toBe(true);
    expect(can("consultant", "companies.import")).toBe(false);
  });

  it("un vendedor solo modifica lo propio o lo que no tiene dueño", () => {
    const me = { id: "u1", role: "salesperson" as const };
    expect(canModifyOwned(me, { ownerId: "u1" }, "companies.write")).toBe(true);
    expect(canModifyOwned(me, { ownerId: null }, "companies.write")).toBe(true);
    expect(canModifyOwned(me, { ownerId: "u2" }, "companies.write")).toBe(false);
  });

  it("el líder y el administrador modifican lo de cualquiera", () => {
    for (const role of ["admin", "sales_lead"] as const) {
      expect(canModifyOwned({ id: "u9", role }, { ownerId: "u2" }, "companies.write")).toBe(true);
    }
  });

  it("lectura y consultor no modifican empresas ajenas", () => {
    for (const role of ["read_only", "consultant"] as const) {
      expect(canModifyOwned({ id: "u9", role }, { ownerId: null }, "companies.write")).toBe(false);
    }
  });

  it("requirePermission lanza ForbiddenError", () => {
    expect(() => requirePermission({ role: "read_only" }, "users.manage")).toThrow(ForbiddenError);
    expect(() => requirePermission({ role: "admin" }, "users.manage")).not.toThrow();
  });
});

import { canAnalyze } from "@/lib/analyzer/service";

describe("permiso de análisis web", () => {
  it("admin, líder y consultor analizan cualquier empresa; lectura no", () => {
    for (const role of ["admin", "sales_lead", "consultant"] as const) expect(canAnalyze({ id: "u1", role }, { owner_id: "u2" })).toBe(true);
    expect(canAnalyze({ id: "u1", role: "read_only" }, { owner_id: null })).toBe(false);
  });
  it("un vendedor solo analiza lo propio o lo que no tiene dueño", () => {
    const me = { id: "u1", role: "salesperson" as const };
    expect(canAnalyze(me, { owner_id: "u1" })).toBe(true);
    expect(canAnalyze(me, { owner_id: null })).toBe(true);
    expect(canAnalyze(me, { owner_id: "u2" })).toBe(false);
  });
});
