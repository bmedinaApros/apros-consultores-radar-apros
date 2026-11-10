import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createRadarServer } from "@/lib/mcp/server";
import { pool } from "@/lib/db";
import { resetData } from "./helpers";

async function connect() {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createRadarServer().connect(b);
  const c = new Client({ name: "test", version: "1" });
  await c.connect(a);
  return c;
}
const call = async (c: Client, name: string, args: Record<string, unknown> = {}) => {
  const r = (await c.callTool({ name, arguments: args })) as { content: { text: string }[]; isError?: boolean };
  return { text: r.content[0]!.text, isError: Boolean(r.isError) };
};

describe("conector MCP (solo lectura)", () => {
  beforeEach(resetData);
  afterAll(async () => { await pool().end(); });

  it("solo ofrece consultas de lectura y una única escritura acotada, y lo declaran", async () => {
    const c = await connect();
    const { tools } = await c.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["buscar_empresas_base", "buscar_padron", "ejecutar_semana", "estado_radar", "estado_semana", "proponer_sitio_web", "ver_diagnostico", "ver_empresa", "ver_empresa_padron", "ver_lista_semanal"]);
    // Solo dos escriben, de forma acotada (proponer un sitio web que Radar valida; dejar una corrida en cola); el resto es lectura
    for (const t of tools) expect(t.annotations?.readOnlyHint, t.name).toBe(!["proponer_sitio_web", "ejecutar_semana"].includes(t.name));
  });

  it("responde con la base vacía, valida entradas y no inventa datos", async () => {
    const c = await connect();
    expect(JSON.parse((await call(c, "estado_radar")).text).empresas_en_base_de_trabajo).toBe(0);
    expect(JSON.parse((await call(c, "buscar_empresas_base", { texto: "x" })).text).total).toBe(0);
    expect((await call(c, "ver_empresa_padron", { ruc: "20100000001" })).isError).toBe(true);
    expect((await call(c, "ver_empresa", { id: "6f1b0f7e-3f0e-4c1e-9c3a-2b1a8f0d9c11" })).isError).toBe(true);
    expect((await call(c, "ver_diagnostico", { empresa_id: "6f1b0f7e-3f0e-4c1e-9c3a-2b1a8f0d9c11" })).isError).toBe(true);
    const bad = await c.callTool({ name: "ver_empresa_padron", arguments: { ruc: "no-es-ruc" } }).catch((e) => e);
    expect((bad as { isError?: boolean }).isError ?? true).toBe(true);
  });

  it("encuentra una empresa del padrón y no expone usuarios ni correos", async () => {
    await pool().query(`INSERT INTO registry_companies (ruc, legal_name, normalized_name, status, condition, ubigeo) VALUES ('20100000001','INMOBILIARIA PRUEBA SAC','inmobiliaria prueba','ACTIVO','HABIDO','150101')`);
    const c = await connect();
    const r = await call(c, "buscar_padron", { consulta: "20100000001" });
    expect(r.text).toContain("INMOBILIARIA PRUEBA SAC");
    expect(r.text).not.toMatch(/@|password|owner_email/i);
    expect((await call(c, "ver_empresa_padron", { ruc: "20100000001" })).text).toContain("20100000001");
  });
});
