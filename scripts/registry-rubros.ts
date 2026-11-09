/* Recalcula el rubro sugerido de todo el padrón con las reglas actuales (Configuración → Reglas de rubro).
 * Uso: npm run registry:rubros */
import { recomputeSuggestions } from "../src/lib/registry/rubro";
import { pool } from "../src/lib/db";

try {
  const r = await recomputeSuggestions(null, (p) => process.stdout.write(`\r  revisadas ${p.checked.toLocaleString("es-PE")} · cambiadas ${p.changed.toLocaleString("es-PE")}   `));
  process.stdout.write("\n");
  console.log(`Listo. Revisadas ${r.checked}, con rubro sugerido nuevo o distinto: ${r.changed}.`);
} catch (e) {
  console.error(`No se pudo recalcular: ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await pool().end();
}
