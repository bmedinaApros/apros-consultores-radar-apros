import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import { toCsv, parseCompaniesCsv } from "./csv";
import { CompanyIndex } from "./dedupe";
import {
  evaluate, insertCompany, loadLookups, mergeIntoCompany, prepareCompany,
  type Issue, type PreparedCompany, type RawCompany, type RowStatus,
} from "./ingest";
import { findActiveClient, findDoNotContact } from "./exclusions";

export class ImportError extends Error {
  override name = "ImportError";
}

export interface BatchSummary {
  id: string;
  filename: string;
  status: string;
  total: number;
  counts: Record<RowStatus, number>;
  pendingDecisions: number;
  ignoredColumns: string[];
}

const emptyCounts = (): Record<RowStatus, number> => ({
  valid: 0, error: 0, duplicate: 0, possible_duplicate: 0, blocked: 0, excluded_client: 0,
});

/** Paso 1: analiza el archivo y guarda una vista previa. No crea empresas. */
export async function previewImport(
  actor: { id: string; email: string },
  filename: string,
  csvText: string,
): Promise<BatchSummary> {
  const parsed = parseCompaniesCsv(csvText);
  const lookups = await loadLookups();
  const index = await CompanyIndex.load();
  const seenInFile = new Map<string, number>(); // clave de identidad → número de fila

  const evaluated: {
    n: number; raw: RawCompany; prepared: PreparedCompany | null; status: RowStatus; issues: Issue[];
    matchId: string | null; matchKind: string | null; matchScore: number | null;
  }[] = [];

  for (const [i, raw] of parsed.rows.entries()) {
    const n = i + 2; // fila 1 = encabezado
    const { prepared, issues } = prepareCompany(raw, lookups);
    let ev = await evaluate(prepared, issues, index);
    if (prepared && ev.status === "valid") {
      const keys = [prepared.ruc && `ruc:${prepared.ruc}`, prepared.domain && `dom:${prepared.domain}`, `name:${prepared.normalizedName}`].filter((k): k is string => Boolean(k));
      const dupRow = keys.map((k) => seenInFile.get(k)).find((v) => v !== undefined);
      if (dupRow !== undefined) {
        ev = { status: "duplicate", issues: [...ev.issues, { level: "warning", message: `Repetida en el archivo (fila ${dupRow})` }], match: null };
      } else {
        for (const k of keys) seenInFile.set(k, n);
        index.add(`file:${n}`, { normalizedName: prepared.normalizedName, domain: prepared.domain, ruc: prepared.ruc });
      }
    }
    // Coincidencias contra filas del mismo archivo no tienen id de empresa.
    const isFileMatch = ev.match?.companyId.startsWith("file:");
    evaluated.push({
      n, raw, prepared, status: ev.status, issues: ev.issues,
      matchId: ev.match && !isFileMatch ? ev.match.companyId : null,
      matchKind: ev.match?.kind ?? null,
      matchScore: ev.match?.score ?? null,
    });
  }

  return withTransaction(async (c) => {
    const b = await c.query<{ id: string }>(
      `INSERT INTO import_batches (filename, uploaded_by, total_rows) VALUES ($1, $2, $3) RETURNING id`,
      [filename.slice(0, 200), actor.id, evaluated.length],
    );
    const batchId = b.rows[0]!.id;
    for (const r of evaluated) {
      await c.query(
        `INSERT INTO import_rows (batch_id, row_number, raw, normalized, status, errors, match_company_id, match_kind, match_score, decision)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [batchId, r.n, JSON.stringify(r.raw), r.prepared ? JSON.stringify(r.prepared) : null, r.status,
         JSON.stringify(r.issues), r.matchId, r.matchKind, r.matchScore,
         r.status === "valid" ? "create" : r.status === "duplicate" ? "skip" : null],
      );
    }
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "import.previewed", entityType: "import_batch", entityId: batchId, metadata: { filename, rows: evaluated.length } }, c);
    const summary = await getBatchSummary(batchId, c);
    summary.ignoredColumns = parsed.ignoredColumns;
    return summary;
  });
}

type Q = Pick<import("pg").Pool | import("pg").PoolClient, "query">;

export async function getBatchSummary(batchId: string, db: Q = pool()): Promise<BatchSummary> {
  const b = await db.query<{ id: string; filename: string; status: string; total_rows: number }>(
    `SELECT id, filename, status, total_rows FROM import_batches WHERE id = $1`, [batchId]);
  const batch = b.rows[0];
  if (!batch) throw new ImportError("Lote no encontrado");
  const counts = emptyCounts();
  const rows = await db.query<{ status: RowStatus; n: string; undecided: string }>(
    `SELECT status, count(*) AS n, count(*) FILTER (WHERE decision IS NULL) AS undecided FROM import_rows WHERE batch_id = $1 GROUP BY status`, [batchId]);
  let pending = 0;
  for (const r of rows.rows) {
    counts[r.status] = Number(r.n);
    if (r.status === "possible_duplicate") pending += Number(r.undecided);
  }
  return { id: batch.id, filename: batch.filename, status: batch.status, total: batch.total_rows, counts, pendingDecisions: pending, ignoredColumns: [] };
}

/** Un humano decide qué hacer con un posible duplicado (o con un duplicado exacto, para fusionarlo). */
export async function decideRow(
  actor: { id: string; email: string },
  batchId: string,
  rowId: string,
  decision: "create" | "skip" | "merge",
): Promise<void> {
  await withTransaction(async (c) => {
    const res = await c.query<{ status: RowStatus; match_company_id: string | null; batch_status: string }>(
      `SELECT r.status, r.match_company_id, b.status AS batch_status
         FROM import_rows r JOIN import_batches b ON b.id = r.batch_id
        WHERE r.id = $1 AND r.batch_id = $2 FOR UPDATE OF r`, [rowId, batchId]);
    const row = res.rows[0];
    if (!row) throw new ImportError("Fila no encontrada");
    if (row.batch_status !== "previewed") throw new ImportError("El lote ya no admite cambios");
    if (row.status !== "possible_duplicate" && row.status !== "duplicate") throw new ImportError("Esta fila no requiere decisión");
    if (decision === "merge" && !row.match_company_id) throw new ImportError("No hay una empresa existente con la cual fusionar");
    // Un duplicado exacto no puede crearse de nuevo: chocaría con la unicidad de RUC o dominio.
    if (decision === "create" && row.status === "duplicate") throw new ImportError("Un duplicado exacto no puede crearse; omítelo o fusiónalo");
    await c.query(`UPDATE import_rows SET decision = $2 WHERE id = $1`, [rowId, decision]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "import.row_decided", entityType: "import_batch", entityId: batchId, metadata: { rowId, decision } }, c);
  });
}

export interface CommitResult { created: number; merged: number; skipped: number; blockedAtCommit: number }

/** Paso 2: crea las empresas. Falla si quedan posibles duplicados sin decidir. */
export async function commitImport(actor: { id: string; email: string }, batchId: string): Promise<CommitResult> {
  return withTransaction(async (c) => {
    const b = await c.query<{ status: string }>(`SELECT status FROM import_batches WHERE id = $1 FOR UPDATE`, [batchId]);
    if (!b.rows[0]) throw new ImportError("Lote no encontrado");
    if (b.rows[0].status !== "previewed") throw new ImportError("El lote ya fue procesado");
    const undecided = await c.query<{ n: string }>(
      `SELECT count(*) AS n FROM import_rows WHERE batch_id = $1 AND status = 'possible_duplicate' AND decision IS NULL`, [batchId]);
    if (Number(undecided.rows[0]!.n) > 0) throw new ImportError("Hay posibles duplicados sin resolver");

    const rows = await c.query<{ id: string; status: RowStatus; normalized: PreparedCompany; decision: string | null; match_company_id: string | null }>(
      `SELECT id, status, normalized, decision, match_company_id FROM import_rows
        WHERE batch_id = $1 AND decision IN ('create', 'merge') ORDER BY row_number`, [batchId]);

    const result: CommitResult = { created: 0, merged: 0, skipped: 0, blockedAtCommit: 0 };
    for (const r of rows.rows) {
      const p = r.normalized;
      // El estado pudo cambiar desde la vista previa: se vuelve a comprobar antes de usar la empresa.
      const dnc = await findDoNotContact({ name: p.legalName, domain: p.domain, ruc: p.ruc }, c);
      const client = dnc ? null : await findActiveClient({ name: p.legalName, domain: p.domain, ruc: p.ruc }, c);
      if (dnc || client) {
        result.blockedAtCommit++;
        await c.query(`UPDATE import_rows SET status = $2, decision = 'skip' WHERE id = $1`, [r.id, dnc ? "blocked" : "excluded_client"]);
        continue;
      }
      if (r.decision === "merge" && r.match_company_id) {
        await mergeIntoCompany(c, r.match_company_id, p, { batchId, sourceCode: "csv", sourceRef: String(r.id) });
        await c.query(`UPDATE import_rows SET company_id = $2 WHERE id = $1`, [r.id, r.match_company_id]);
        result.merged++;
        continue;
      }
      await c.query("SAVEPOINT row_insert");
      try {
        const id = await insertCompany(c, p, { createdBy: actor.id, batchId, sourceCode: "csv", sourceRef: String(r.id) });
        await c.query(`UPDATE import_rows SET company_id = $2 WHERE id = $1`, [r.id, id]);
        await c.query("RELEASE SAVEPOINT row_insert");
        result.created++;
      } catch (e) {
        await c.query("ROLLBACK TO SAVEPOINT row_insert");
        if ((e as { code?: string }).code === "23505") {
          // Otro proceso creó la misma empresa entre la vista previa y la confirmación.
          await c.query(`UPDATE import_rows SET status = 'duplicate', decision = 'skip' WHERE id = $1`, [r.id]);
          result.skipped++;
        } else throw e;
      }
    }
    const skipped = await c.query<{ n: string }>(`SELECT count(*) AS n FROM import_rows WHERE batch_id = $1 AND (decision IS NULL OR decision = 'skip')`, [batchId]);
    result.skipped += Number(skipped.rows[0]!.n);
    await c.query(`UPDATE import_batches SET status = 'committed', committed_at = now() WHERE id = $1`, [batchId]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "import.committed", entityType: "import_batch", entityId: batchId, metadata: { ...result } }, c);
    return result;
  });
}

export interface UndoResult { removed: number; kept: number }

/**
 * Deshacer: elimina las empresas creadas por el lote que siguen en la etapa "Detectada".
 * Las que ya avanzaron se conservan. Los datos fusionados en empresas existentes no se revierten.
 */
export async function undoImport(actor: { id: string; email: string }, batchId: string): Promise<UndoResult> {
  return withTransaction(async (c) => {
    const b = await c.query<{ status: string }>(`SELECT status FROM import_batches WHERE id = $1 FOR UPDATE`, [batchId]);
    if (!b.rows[0]) throw new ImportError("Lote no encontrado");
    if (b.rows[0].status !== "committed") throw new ImportError("Solo se pueden deshacer lotes confirmados");
    const removed = await c.query(`DELETE FROM companies WHERE import_batch_id = $1 AND stage = 'detected'`, [batchId]);
    const kept = await c.query<{ n: string }>(`SELECT count(*) AS n FROM companies WHERE import_batch_id = $1`, [batchId]);
    await c.query(`DELETE FROM company_sources WHERE import_batch_id = $1`, [batchId]);
    await c.query(`UPDATE import_batches SET status = 'undone', undone_at = now() WHERE id = $1`, [batchId]);
    const result = { removed: removed.rowCount ?? 0, kept: Number(kept.rows[0]!.n) };
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "import.undone", entityType: "import_batch", entityId: batchId, metadata: { ...result } }, c);
    return result;
  });
}

export async function discardImport(actor: { id: string; email: string }, batchId: string): Promise<void> {
  await withTransaction(async (c) => {
    const r = await c.query(`UPDATE import_batches SET status = 'discarded' WHERE id = $1 AND status = 'previewed'`, [batchId]);
    if (r.rowCount === 0) throw new ImportError("El lote no se puede descartar");
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "import.discarded", entityType: "import_batch", entityId: batchId }, c);
  });
}

const STATUS_LABEL: Record<RowStatus, string> = {
  valid: "Válida", error: "Error", duplicate: "Duplicado exacto", possible_duplicate: "Posible duplicado",
  blocked: "No contactar", excluded_client: "Cliente activo",
};

/** Informe de errores y advertencias en CSV (con neutralización de fórmulas). */
export async function errorReportCsv(batchId: string): Promise<string> {
  const res = await pool().query<{ row_number: number; status: RowStatus; raw: Record<string, string>; errors: Issue[] }>(
    `SELECT row_number, status, raw, errors FROM import_rows
      WHERE batch_id = $1 AND (status <> 'valid' OR errors <> '[]'::jsonb) ORDER BY row_number`, [batchId]);
  return toCsv([
    ["fila", "estado", "razon_social", "sitio_web", "ruc", "detalle"],
    ...res.rows.map((r) => [r.row_number, STATUS_LABEL[r.status], r.raw.legal_name, r.raw.website, r.raw.ruc, r.errors.map((e) => e.message).join(" | ")]),
  ]);
}
