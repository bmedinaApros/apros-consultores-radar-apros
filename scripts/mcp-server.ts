/* Conector MCP de SOLO LECTURA para Claude (app de escritorio). Se lanza por entrada/salida estándar: no abre puertos.
 * Todo lo que se escribe en la consola rompe el protocolo, por eso los avisos van a stderr. */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRadarServer } from "../src/lib/mcp/server";

await createRadarServer().connect(new StdioServerTransport());
console.error("radar-apros MCP listo (solo lectura)");
