/* Imprime el bloque que se pega en la configuración de Claude Desktop, con las rutas reales de este equipo. Uso: npm run mcp:config */
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const config = {
  mcpServers: {
    "radar-apros": {
      command: process.execPath,
      args: [`--env-file=${path.join(root, ".env")}`, "--import", pathToFileURL(path.join(root, "node_modules/tsx/dist/loader.mjs")).href, path.join(root, "scripts/mcp-server.ts")],
    },
  },
};
console.log(JSON.stringify(config, null, 2));
