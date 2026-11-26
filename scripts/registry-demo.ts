/* Genera un padrón DE DEMOSTRACIÓN (todos los datos son inventados) con el mismo formato que el de SUNAT, en la carpeta de
 * importación (data/import). Sirve para que cualquier persona del equipo pueda probar Radar sin el archivo real de SUNAT. Uso:
 *   npm run registry:demo                (20.000 empresas)
 *   npm run registry:demo -- --rows 5000
 * Luego cárgalo: npm run registry:import -- --file padron_demo_ruc.txt --note "DEMO (datos inventados)"
 * o desde la pantalla «Cargar padrón». */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { syntheticLines } from "../src/lib/registry/synthetic";

const args = process.argv.slice(2);
const i = args.indexOf("--rows");
const rows = Math.min(Math.max(Number(i >= 0 ? args[i + 1] : 20000) || 20000, 100), 500_000);
const dir = path.resolve(process.env.REGISTRY_IMPORT_DIR || "data/import");
mkdirSync(dir, { recursive: true });

// Windows-1252 (como SUNAT): las tildes de la cabecera se escriben en latin1.
const file = path.join(dir, "padron_demo_ruc.txt");
const parts: Buffer[] = [];
for (const line of syntheticLines("ruc", rows)) parts.push(Buffer.from(`${line}\r\n`, "latin1"));
writeFileSync(file, Buffer.concat(parts));
console.log(`Listo: ${rows.toLocaleString("es-PE")} empresas inventadas en ${file}`);
console.log('Cárgalas con: npm run registry:import -- --file padron_demo_ruc.txt --note "DEMO (datos inventados)"');
