/* Busca en el padrón desde la terminal (pensado para personas y para una IA que consulte Radar). Uso:
 *   npm run registry:search -- "inmobiliarias en Lima"
 *   npm run registry:search -- "clínicas arequipa" --limit 50 --json
 *   npm run registry:search -- "20100193117"
 * Opciones: --limit N (máx. 200)   --json (salida para máquinas)   --all (incluye las que ya están en la base) */
import { pool } from "../src/lib/db";
import { parseQuickQuery } from "../src/lib/registry/quick";
import { searchRegistry } from "../src/lib/registry/service";

const args = process.argv.slice(2);
const flag = (k: string) => args.includes(`--${k}`);
const opt = (k: string) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
const text = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--limit").join(" ").trim();
if (!text) {
  console.error('Uso: npm run registry:search -- "inmobiliarias en Lima" [--limit 20] [--json] [--all]');
  process.exit(2);
}

try {
  const limit = Math.min(Math.max(Number(opt("limit") ?? 20) || 20, 1), 200);
  const depts = (await pool().query<{ code: string; department: string }>(`SELECT code, department FROM ubigeo WHERE length(code) = 2`)).rows;
  const parsed = parseQuickQuery(text, depts);
  const rows: Awaited<ReturnType<typeof searchRegistry>>["rows"] = [];
  let after: string | undefined;
  let total = 0, capped = false;
  while (rows.length < limit) {
    const page = await searchRegistry({ q: parsed.q, ubigeo: parsed.ubigeo, notPromoted: !flag("all"), after });
    total = page.total; capped = page.totalCapped;
    rows.push(...page.rows);
    if (!page.nextAfter) break;
    after = page.nextAfter;
  }
  const out = rows.slice(0, limit).map((r) => ({
    ruc: r.ruc, razon_social: r.legal_name, estado: r.status, condicion: r.condition, departamento: r.department, direccion: r.address,
    rubro_sugerido: r.suggested_industry_name, en_la_base: Boolean(r.company_id), no_contactar: r.dnc, cliente_activo: r.client,
  }));
  if (flag("json")) {
    console.log(JSON.stringify({ consulta: text, entendido: parsed.understood, total_coincidencias: total, total_es_minimo: capped, devueltas: out.length, resultados: out }, null, 2));
  } else {
    console.log(`Consulta: «${text}» → ${parsed.understood.join(" · ") || "sin filtros"}`);
    console.log(`${capped ? "Más de " : ""}${total.toLocaleString("es-PE")} coincidencias; se muestran ${out.length}.\n`);
    for (const r of out) console.log(`${r.ruc}  ${r.razon_social}  [${r.departamento ?? "—"}]${r.rubro_sugerido ? `  rubro: ${r.rubro_sugerido}` : ""}${r.no_contactar ? "  ⚠ NO CONTACTAR" : ""}${r.cliente_activo ? "  ⚠ CLIENTE ACTIVO" : ""}${r.en_la_base ? "  (ya en la base)" : ""}`);
  }
} catch (e) {
  console.error(`No se pudo buscar: ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await pool().end();
}
