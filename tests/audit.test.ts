import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { audit, recentAudit, verifyAuditChain } from "@/lib/audit";
import { pool } from "@/lib/db";
import { ownerPool, resetData } from "./helpers";

beforeEach(resetData);
afterAll(() => pool().end());

describe("auditoría", () => {
  it("registra eventos encadenados y la cadena es válida", async () => {
    await audit({ action: "a.uno", actorEmail: "x@apros.pe" });
    await audit({ action: "a.dos", metadata: { k: 1 } });
    await audit({ action: "a.tres", entityType: "user", entityId: "42" });
    const rows = await recentAudit(10);
    expect(rows.map((r) => r.action)).toEqual(["a.tres", "a.dos", "a.uno"]);
    expect(await verifyAuditChain()).toBeNull();
  });

  it("la aplicación no puede actualizar ni borrar eventos", async () => {
    await audit({ action: "inmutable" });
    await expect(pool().query("UPDATE audit_log SET action = 'x'")).rejects.toThrow();
    await expect(pool().query("DELETE FROM audit_log")).rejects.toThrow();
    await expect(pool().query("TRUNCATE audit_log")).rejects.toThrow();
  });

  it("ni siquiera el propietario puede editar sin desactivar los triggers", async () => {
    await audit({ action: "inmutable" });
    const owner = ownerPool();
    await expect(owner.query("UPDATE audit_log SET action = 'x'")).rejects.toThrow(/solo inserción/);
    await owner.end();
  });

  it("detecta una manipulación hecha desactivando los triggers", async () => {
    await audit({ action: "uno" });
    await audit({ action: "dos" });
    await audit({ action: "tres" });
    const owner = ownerPool();
    await owner.query("ALTER TABLE audit_log DISABLE TRIGGER USER");
    await owner.query("UPDATE audit_log SET action = 'alterado' WHERE action = 'dos'");
    await owner.query("ALTER TABLE audit_log ENABLE TRIGGER USER");
    await owner.end();
    expect(await verifyAuditChain()).not.toBeNull();
  });

  it("detecta un evento eliminado", async () => {
    await audit({ action: "uno" });
    await audit({ action: "dos" });
    await audit({ action: "tres" });
    const owner = ownerPool();
    await owner.query("ALTER TABLE audit_log DISABLE TRIGGER USER");
    await owner.query("DELETE FROM audit_log WHERE action = 'dos'");
    await owner.query("ALTER TABLE audit_log ENABLE TRIGGER USER");
    await owner.end();
    expect(await verifyAuditChain()).not.toBeNull();
  });
});
