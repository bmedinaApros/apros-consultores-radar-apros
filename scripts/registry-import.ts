/* Carga un archivo del padrón de SUNAT desde la carpeta de importación (por defecto data/import). Uso:
 *   npm run registry:import -- --file padron_reducido_ruc.zip --note "Actualizado al 07/11/2026"
 *   npm run registry:import -- --file padron_reducido_local_anexo.zip --only-known
 *   npm run registry:import -- --resume <id-de-la-carga>
 * Filtros (por defecto: solo personas jurídicas, ACTIVO y HABIDO):
 *   --persons juridica|natural|all   --status ACTIVO,SUSPENSION TEMPORAL|any   --condition HABIDO|any   --ubigeo 15,07,0401
 * Se puede detener con Ctrl+C y reanudar con --resume: continúa donde quedó.
 *   npm run registry:import -- --file padron_reducido_ruc.zip --check     (solo revisa el formato; no carga nada) */
import { createBatchInternal, getBatch, inspectFile, runBatch, type ImportFilters } from "../src/lib/registry/import";
import { pool } from "../src/lib/db";

const args = process.argv.slice(2);
const arg = (k: string): string | undefined => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
const list = (v: string | undefined): string[] | undefined => (v === undefined ? undefined : v === "any" ? [] : v.split(",").map((s) => s.trim()).filter(Boolean));

const file = arg("file");
const resume = arg("resume");
if (!file && !resume) {
  console.error("Uso: npm run registry:import -- --file <archivo en la carpeta de importación> [--note ...] [--persons ...] [--status ...] [--condition ...] [--ubigeo ...] [--only-known]\n     npm run registry:import -- --resume <id>");
  process.exit(2);
}

if (args.includes("--check")) {
  try {
    const r = await inspectFile(file!);
    console.log(`Formato reconocido: ${r.kind === "ruc" ? "padrón de RUC (con razón social)" : "locales anexos"}`);
    console.log("Cabecera:", r.header.join(" | "));
    console.log("Columnas usadas:", JSON.stringify(r.columns));
    console.log(`Primeras ${r.linesChecked} filas: pasarían el filtro por defecto ${r.wouldLoad}, inválidas ${r.invalid}, descartadas ${JSON.stringify(r.wouldSkip)}`);
    console.log("Ejemplos de personas jurídicas:"); for (const s of r.sample) console.log("  ", JSON.stringify(s));
  } catch (e) { console.error(`No se reconoce el archivo: ${(e as Error).message}`); process.exitCode = 1; }
  await pool().end();
  process.exit(process.exitCode ?? 0);
}

const t0 = Date.now();
try {
  let id = resume;
  if (!id) {
    const persons = arg("persons");
    const filters: Partial<ImportFilters> = {
      ...(persons ? { personKinds: persons === "all" ? ["juridica", "natural"] : [persons as "juridica" | "natural"] } : {}),
      ...(list(arg("status")) ? { statuses: list(arg("status")) } : {}),
      ...(list(arg("condition")) ? { conditions: list(arg("condition")) } : {}),
      ...(list(arg("ubigeo")) ? { ubigeoPrefixes: list(arg("ubigeo")) } : {}),
      ...(args.includes("--only-known") ? { onlyKnownRucs: true } : {}),
    };
    const b = await createBatchInternal({ fileName: file!, filters, sourceNote: arg("note") }, null);
    id = b.id;
    console.log(`Carga creada (${b.kind}): ${id}`);
  }
  const done = await runBatch(id!, {
    onProgress: (p) => {
      const s = Math.max(1, (Date.now() - t0) / 1000);
      process.stdout.write(`\r  leídas ${p.read.toLocaleString("es-PE")} · cargadas ${p.loaded.toLocaleString("es-PE")} · descartadas ${p.skipped.toLocaleString("es-PE")} · inválidas ${p.invalid} · ${Math.round(p.read / s).toLocaleString("es-PE")} filas/s   `);
    },
  });
  process.stdout.write("\n");
  console.log(`Estado: ${done.status}. Leídas ${done.rows_read}, cargadas ${done.rows_loaded}, descartadas ${done.rows_skipped}, inválidas ${done.rows_invalid}.`);
  console.log("Motivos de descarte:", JSON.stringify(done.skipped));
  console.log(`Tiempo: ${((Date.now() - t0) / 1000).toFixed(1)} s · memoria máxima: ${Math.round(process.memoryUsage().rss / 1048576)} MB`);
  if (done.status !== "completed") process.exitCode = 1;
} catch (e) {
  process.stdout.write("\n");
  console.error(`La carga falló: ${(e as Error).message}`);
  if (resume) { const b = await getBatch(resume); if (b) console.error(`Punto de control: línea ${b.last_line}. Puedes reanudar con --resume ${resume}.`); }
  process.exitCode = 1;
} finally {
  await pool().end();
}
