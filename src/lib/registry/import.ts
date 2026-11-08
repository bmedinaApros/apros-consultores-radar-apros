import { createHash } from "node:crypto";
import { z } from "zod";
import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import type { ActorInfo } from "../companies/service";
import { normalizeName } from "../companies/normalize";
import { requirePermission } from "../rbac";
import { log } from "../logger";
import { CONNECTOR_VERSION, detectFormat, FormatError, parseRow, type Format, type FileKind } from "./format";
import { loadRubroRules, suggestIndustry } from "./rubro";
import { fingerprint, openSource, readLines, resolveImportFile, TOO_LONG } from "./source";

export class RegistryError extends Error {
  override name = "RegistryError";
}

/** Qué filas se cargan. Por defecto solo personas jurídicas (RUC 20), activas y habidas. Las personas naturales quedan fuera. */
export const filtersSchema = z.object({
  personKinds: z.array(z.enum(["juridica", "natural"])).min(1).default(["juridica"]),
  statuses: z.array(z.string().trim().min(1).max(40).transform((s) => s.toUpperCase())).max(10).default(["ACTIVO"]),
  conditions: z.array(z.string().trim().min(1).max(40).transform((s) => s.toUpperCase())).max(10).default(["HABIDO"]),
  ubigeoPrefixes: z.array(z.string().regex(/^\d{2}(\d{2}(\d{2})?)?$/)).max(200).default([]),
  /** Solo para el archivo de locales: cargar únicamente RUC que ya estén en el padrón. */
  onlyKnownRucs: z.boolean().default(false),
});
export type ImportFilters = z.infer<typeof filtersSchema>;
export const parseFilters = (raw: unknown = {}): ImportFilters => filtersSchema.parse(raw ?? {});

export const filtersHash = (f: ImportFilters): string =>
  createHash("sha256").update(JSON.stringify({
    p: [...f.personKinds].sort(), s: [...f.statuses].sort(), c: [...f.conditions].sort(), u: [...f.ubigeoPrefixes].sort(), k: f.onlyKnownRucs,
  })).digest("hex").slice(0, 16);

export const CHUNK_LINES = 5000;
const STALE_MINUTES = 10;

export interface Batch {
  id: string; kind: FileKind; file_name: string; file_size: string | null; file_fingerprint: string | null; source_note: string | null; source_url: string | null;
  connector_version: string; filters: ImportFilters; filters_hash: string; status: string; rows_read: string; rows_loaded: string; rows_skipped: string; rows_invalid: string;
  skipped: Record<string, number>; last_line: string; error: string | null; created_at: Date; started_at: Date | null; finished_at: Date | null; updated_at: Date;
}
const BATCH_COLS = `id, kind, file_name, file_size, file_fingerprint, source_note, source_url, connector_version, filters, filters_hash, status, rows_read, rows_loaded, rows_skipped, rows_invalid, skipped, last_line, error, created_at, started_at, finished_at, updated_at`;

export async function getBatch(id: string): Promise<Batch | null> {
  return (await pool().query<Batch>(`SELECT ${BATCH_COLS} FROM registry_batches WHERE id = $1`, [id])).rows[0] ?? null;
}
export async function listBatches(limit = 20): Promise<Batch[]> {
  return (await pool().query<Batch>(`SELECT ${BATCH_COLS} FROM registry_batches ORDER BY created_at DESC LIMIT $1`, [limit])).rows;
}

export async function readHeader(file: string): Promise<Format> {
  const stream = await openSource(file);
  try {
    for await (const line of readLines(stream)) return detectFormat(line);
    throw new FormatError("El archivo está vacío");
  } finally { stream.destroy(); }
}

export interface CreateInput { fileName: string; filters?: unknown; sourceNote?: string; sourceUrl?: string }

/** Registra la carga (no la ejecuta). Valida que el archivo exista en la carpeta de importación y que su cabecera sea reconocible. */
export async function createBatchInternal(input: CreateInput, startedBy: string | null, actor?: ActorInfo): Promise<{ id: string; kind: FileKind }> {
  const file = await resolveImportFile(input.fileName);
  const fmt = await readHeader(file).catch((e) => { if (e instanceof FormatError) throw new RegistryError(e.message); throw e; });
  const filters = parseFilters(input.filters);
  const fp = await fingerprint(file);
  const note = input.sourceNote?.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 200) || null;
  const r = await pool().query<{ id: string }>(
    `INSERT INTO registry_batches (kind, file_name, file_size, file_fingerprint, source_note, source_url, connector_version, filters, filters_hash, started_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10) RETURNING id`,
    [fmt.kind, input.fileName, fp.size, fp.fingerprint, note, input.sourceUrl ?? "https://www.sunat.gob.pe/descargaPRR/mrc137_padron_reducido.html", CONNECTOR_VERSION, JSON.stringify(filters), filtersHash(filters), startedBy]);
  await audit({ actorId: actor?.id ?? startedBy, actorEmail: actor?.email ?? "cli", action: "registry.batch_created", entityType: "registry_batch", entityId: r.rows[0]!.id, metadata: { file: input.fileName, kind: fmt.kind, filters } });
  return { id: r.rows[0]!.id, kind: fmt.kind };
}

export async function createBatch(actor: ActorInfo, input: CreateInput): Promise<{ id: string; kind: FileKind }> {
  requirePermission(actor, "registry.import");
  return createBatchInternal(input, actor.id, actor);
}

export async function cancelBatch(actor: ActorInfo, id: string): Promise<void> {
  requirePermission(actor, "registry.import");
  const r = await pool().query(`UPDATE registry_batches SET status = CASE WHEN status = 'running' THEN 'cancelling' ELSE 'cancelled' END, updated_at = now() WHERE id = $1 AND status IN ('queued','running','failed')`, [id]);
  if (!r.rowCount) throw new RegistryError("Solo se cancela una carga en cola, en curso o fallida");
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "registry.batch_cancelled", entityType: "registry_batch", entityId: id });
}

interface Counters { read: number; loaded: number; skipped: number; invalid: number; reasons: Record<string, number> }

/** Reglas de filtro. Devuelve el motivo si la fila se descarta, o null si se carga. */
export function skipReason(f: ImportFilters, kind: FileKind, row: { ruc: string; status: string | null; condition: string | null; ubigeo: string | null }): string | null {
  const natural = !row.ruc.startsWith("20");
  if (natural && !f.personKinds.includes("natural")) return "persona_natural";
  if (!natural && !f.personKinds.includes("juridica")) return "persona_juridica";
  if (kind === "ruc") {
    if (f.statuses.length && !(row.status && f.statuses.includes(row.status))) return "estado";
    if (f.conditions.length && !(row.condition && f.conditions.includes(row.condition))) return "condicion";
  }
  if (f.ubigeoPrefixes.length && !(row.ubigeo && f.ubigeoPrefixes.some((p) => row.ubigeo!.startsWith(p)))) return "zona";
  return null;
}

const bump = (c: Counters, reason: string) => { c.skipped++; c.reasons[reason] = (c.reasons[reason] ?? 0) + 1; };

export interface RunOptions {
  onProgress?: (b: { read: number; loaded: number; skipped: number; invalid: number }) => void;
  /** Líneas por bloque transaccional (por defecto CHUNK_LINES). Las pruebas usan un valor pequeño. */
  chunkLines?: number;
  /** Solo pruebas: detiene la carga después de N líneas, como si el proceso hubiera muerto. */
  crashAfterLines?: number;
}

/**
 * Ejecuta (o reanuda) una carga. Lee el archivo en flujo, procesa por bloques de CHUNK_LINES líneas y, en la misma
 * transacción que cada bloque, guarda el punto de control: si el proceso muere, al reanudar se salta lo ya cargado.
 */
export async function runBatch(batchId: string, opts: RunOptions = {}): Promise<Batch> {
  const b = await claim(batchId);
  let file: string;
  try {
    file = await resolveImportFile(b.file_name);
    const fp = await fingerprint(file);
    if (b.file_fingerprint && (fp.fingerprint !== b.file_fingerprint || String(fp.size) !== b.file_size)) throw new RegistryError("El archivo cambió desde que se creó la carga. Crea una carga nueva.");
    const fmt = await readHeader(file);
    if (fmt.kind !== b.kind) throw new RegistryError("El tipo de archivo ya no coincide con la carga");
    const rules = fmt.kind === "ruc" ? await loadRubroRules() : [];
    const c: Counters = { read: Number(b.rows_read), loaded: Number(b.rows_loaded), skipped: Number(b.rows_skipped), invalid: Number(b.rows_invalid), reasons: { ...b.skipped } };
    const resumeFrom = Number(b.last_line);

    let line = 0; // líneas de datos consumidas (sin la cabecera)
    let headerSeen = false;
    let chunk: ChunkRow[] = [];
    let lastFlush = resumeFrom;
    const stream = await openSource(file);
    try {
      for await (const text of readLines(stream)) {
        if (!headerSeen) { headerSeen = true; continue; }
        line++;
        if (line <= resumeFrom) continue; // ya cargada en un intento anterior
        c.read++;
        if (text === TOO_LONG || text.trim() === "") { c.invalid++; } else {
          const res = parseRow(text.split("|"), fmt);
          if (!res.ok) c.invalid++;
          else {
            const why = skipReason(b.filters, fmt.kind, res.row);
            if (why) bump(c, why);
            else chunk.push({ ...res.row, normalized: res.row.legalName ? normalizeName(res.row.legalName) : "", industryId: res.row.legalName ? suggestIndustry(normalizeName(res.row.legalName), rules) : null });
          }
        }
        if (line - lastFlush >= (opts.chunkLines ?? CHUNK_LINES)) {
          await flush(b, fmt.kind, chunk, c, line);
          chunk = []; lastFlush = line;
          opts.onProgress?.({ read: c.read, loaded: c.loaded, skipped: c.skipped, invalid: c.invalid });
          if (opts.crashAfterLines !== undefined && line >= opts.crashAfterLines) throw new RegistryError("Interrupción simulada");
          const st = await pool().query<{ status: string }>(`SELECT status FROM registry_batches WHERE id = $1`, [b.id]);
          if (st.rows[0]?.status === "cancelling") {
            await pool().query(`UPDATE registry_batches SET status = 'cancelled', finished_at = now(), updated_at = now() WHERE id = $1`, [b.id]);
            return (await getBatch(b.id))!;
          }
        }
      }
    } finally { stream.destroy(); }
    await flush(b, fmt.kind, chunk, c, line);
    opts.onProgress?.({ read: c.read, loaded: c.loaded, skipped: c.skipped, invalid: c.invalid });
    if (fmt.kind === "ruc") await markMissing(b);
    await pool().query(`UPDATE registry_batches SET status = 'completed', finished_at = now(), updated_at = now() WHERE id = $1`, [b.id]);
    await audit({ actorId: null, actorEmail: "sistema", action: "registry.batch_completed", entityType: "registry_batch", entityId: b.id, metadata: { read: c.read, loaded: c.loaded, skipped: c.skipped, invalid: c.invalid } });
    return (await getBatch(b.id))!;
  } catch (e) {
    const msg = (e instanceof RegistryError || e instanceof FormatError ? e.message : e instanceof Error ? e.message : "error").replace(/[\u0000-\u001f]/g, " ").slice(0, 300);
    await pool().query(`UPDATE registry_batches SET status = 'failed', error = $2, updated_at = now() WHERE id = $1`, [b.id, msg]);
    log("error", "falló la carga del padrón", { batchId: b.id, error: msg });
    throw e;
  }
}

/** Toma la carga de forma atómica: una sola a la vez en todo el sistema, y una «en curso» sin latidos por 10 min se considera caída. */
async function claim(batchId: string): Promise<Batch> {
  return withTransaction(async (c) => {
    await c.query(`SELECT pg_advisory_xact_lock(hashtext('registry_import'))`);
    const other = await c.query(`SELECT 1 FROM registry_batches WHERE status IN ('running','cancelling') AND id <> $1 AND updated_at > now() - make_interval(mins => $2)`, [batchId, STALE_MINUTES]);
    if (other.rowCount) throw new RegistryError("Hay otra carga del padrón en curso. Espera a que termine.");
    const r = await c.query<Batch>(
      `UPDATE registry_batches SET status = 'running', started_at = COALESCE(started_at, now()), error = NULL, updated_at = now()
        WHERE id = $1 AND (status IN ('queued','failed','cancelled') OR (status IN ('running','cancelling') AND updated_at < now() - make_interval(mins => $2)))
        RETURNING ${BATCH_COLS}`, [batchId, STALE_MINUTES]);
    if (!r.rows[0]) throw new RegistryError("La carga no existe, ya terminó o está en curso");
    return r.rows[0];
  });
}

interface ChunkRow { ruc: string; legalName: string | null; status: string | null; condition: string | null; ubigeo: string | null; address: string | null; normalized: string; industryId: string | null }

async function flush(b: Batch, kind: FileKind, rows: ChunkRow[], c: Counters, line: number): Promise<void> {
  await withTransaction(async (db) => {
    if (rows.length) {
      if (kind === "ruc") {
        const last = new Map<string, ChunkRow>(); // un RUC repetido dentro del bloque: gana el último
        for (const r of rows) last.set(r.ruc, r);
        const v = [...last.values()];
        const res = await db.query(
          `INSERT INTO registry_companies (ruc, legal_name, normalized_name, status, condition, ubigeo, address, suggested_industry_id, first_batch_id, last_batch_id)
           SELECT ruc, legal_name, normalized_name, status, condition, ubigeo, address, industry_id, $9::uuid, $9::uuid
             FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::uuid[]) AS t(ruc, legal_name, normalized_name, status, condition, ubigeo, address, industry_id)
           ON CONFLICT (ruc) DO UPDATE SET legal_name = EXCLUDED.legal_name, normalized_name = EXCLUDED.normalized_name, status = EXCLUDED.status, condition = EXCLUDED.condition,
             ubigeo = EXCLUDED.ubigeo, address = EXCLUDED.address, suggested_industry_id = EXCLUDED.suggested_industry_id, last_batch_id = EXCLUDED.last_batch_id, updated_at = now(), missing_since = NULL`,
          [v.map((r) => r.ruc), v.map((r) => r.legalName), v.map((r) => r.normalized), v.map((r) => r.status), v.map((r) => r.condition), v.map((r) => r.ubigeo), v.map((r) => r.address), v.map((r) => r.industryId), b.id]);
        c.loaded += res.rowCount ?? 0;
      } else {
        const keyed = rows.filter((r) => r.address).map((r) => ({ ...r, key: createHash("md5").update(`${r.ubigeo ?? ""}|${r.address}`).digest("hex") }));
        const res = await db.query(
          `INSERT INTO registry_locations (ruc, ubigeo, address, loc_key, batch_id)
           SELECT t.ruc, t.ubigeo, t.address, t.loc_key, $5::uuid
             FROM unnest($1::text[], $2::text[], $3::text[], $4::text[]) AS t(ruc, ubigeo, address, loc_key)
            WHERE (NOT $6::boolean) OR EXISTS (SELECT 1 FROM registry_companies rc WHERE rc.ruc = t.ruc)
           ON CONFLICT (ruc, loc_key) DO NOTHING`,
          [keyed.map((r) => r.ruc), keyed.map((r) => r.ubigeo), keyed.map((r) => r.address), keyed.map((r) => r.key), b.id, b.filters.onlyKnownRucs]);
        const inserted = res.rowCount ?? 0;
        c.loaded += inserted;
        const dropped = rows.length - inserted;
        if (dropped > 0) { c.skipped += dropped; c.reasons.ya_cargado_o_sin_registro = (c.reasons.ya_cargado_o_sin_registro ?? 0) + dropped; }
      }
    }
    await db.query(
      `UPDATE registry_batches SET rows_read = $2, rows_loaded = $3, rows_skipped = $4, rows_invalid = $5, skipped = $6::jsonb, last_line = $7, updated_at = now() WHERE id = $1`,
      [b.id, c.read, c.loaded, c.skipped, c.invalid, JSON.stringify(c.reasons), line]);
  });
}

/** Lo que una carga anterior con los MISMOS filtros cargó y esta ya no trae queda marcado como «ya no aparece» (no se borra). */
async function markMissing(b: Batch): Promise<void> {
  await pool().query(
    `UPDATE registry_companies SET missing_since = now()
      WHERE missing_since IS NULL AND last_batch_id <> $1
        AND last_batch_id IN (SELECT id FROM registry_batches WHERE kind = 'ruc' AND filters_hash = $2 AND id <> $1 AND status = 'completed')`, [b.id, b.filters_hash]);
}

export interface Inspection {
  kind: FileKind; header: string[]; columns: Record<string, number>; linesChecked: number; invalid: number;
  wouldLoad: number; wouldSkip: Record<string, number>; sample: { ruc: string; name: string | null; status: string | null; condition: string | null; ubigeo: string | null; address: string | null }[];
}

/**
 * Revisa un archivo SIN cargar nada: detecta el formato, cuenta cuántas de las primeras filas pasarían el filtro y muestra
 * hasta 3 filas de personas jurídicas de ejemplo (nunca de personas naturales).
 */
export async function inspectFile(fileName: string, filters?: unknown, maxRows = 50_000, hardCap = 30_000_000): Promise<Inspection> {
  const file = await resolveImportFile(fileName);
  const f = parseFilters(filters);
  const stream = await openSource(file);
  try {
    let fmt: Format | null = null;
    let header: string[] = [];
    const out: Inspection = { kind: "ruc", header, columns: {}, linesChecked: 0, invalid: 0, wouldLoad: 0, wouldSkip: {}, sample: [] };
    for await (const text of readLines(stream)) {
      if (!fmt) {
        fmt = detectFormat(text);
        header = text.split("|").map((x) => x.trim()).filter(Boolean);
        out.kind = fmt.kind; out.header = header; out.columns = Object.fromEntries(Object.entries(fmt.index).map(([k, v]) => [k, v as number]));
        continue;
      }
      // Los archivos vienen ordenados por RUC (primero los 10…, personas naturales): se sigue hasta ver ejemplos jurídicos.
      if (out.linesChecked >= hardCap || (out.linesChecked >= maxRows && out.sample.length >= 3)) break;
      out.linesChecked++;
      const res = text === TOO_LONG ? null : parseRow(text.split("|"), fmt);
      if (!res || !res.ok) { out.invalid++; continue; }
      const why = skipReason(f, fmt.kind, res.row);
      if (why) { out.wouldSkip[why] = (out.wouldSkip[why] ?? 0) + 1; continue; }
      out.wouldLoad++;
      if (out.sample.length < 3 && res.row.ruc.startsWith("20")) out.sample.push({ ruc: res.row.ruc, name: res.row.legalName, status: res.row.status, condition: res.row.condition, ubigeo: res.row.ubigeo, address: res.row.address });
    }
    if (!fmt) throw new RegistryError("El archivo está vacío");
    return out;
  } finally { stream.destroy(); }
}
