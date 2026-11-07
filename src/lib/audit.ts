import type { Pool, PoolClient } from "pg";
import { pool } from "./db";

export interface AuditEvent {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
}

type Queryable = Pick<Pool | PoolClient, "query">;

export async function audit(event: AuditEvent, db: Queryable = pool()): Promise<void> {
  await db.query(
    `INSERT INTO audit_log (actor_id, actor_email, action, entity_type, entity_id, metadata, request_id)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [
      event.actorId ?? null,
      event.actorEmail ?? null,
      event.action,
      event.entityType ?? null,
      event.entityId ?? null,
      JSON.stringify(event.metadata ?? {}),
      event.requestId ?? null,
    ],
  );
}

export interface AuditRow {
  id: string;
  at: Date;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
}

export async function recentAudit(limit = 100, db: Queryable = pool()): Promise<AuditRow[]> {
  const res = await db.query<AuditRow>(
    `SELECT id, at, actor_email, action, entity_type, entity_id, metadata
       FROM audit_log ORDER BY id DESC LIMIT $1`,
    [Math.min(Math.max(limit, 1), 500)],
  );
  return res.rows;
}

/** Recalcula la cadena de hashes. Devuelve el id de la primera fila inconsistente o null. */
export async function verifyAuditChain(db: Queryable = pool()): Promise<number | null> {
  const res = await db.query<{ id: string; ok: boolean }>(
    `SELECT id, (
        hash = sha256(convert_to(
          coalesce(encode(prev_hash, 'hex'), '') || '|' || to_char(at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || '|' ||
          coalesce(actor_id::text, '') || '|' || coalesce(actor_email, '') || '|' ||
          action || '|' || coalesce(entity_type, '') || '|' || coalesce(entity_id, '') || '|' ||
          metadata::text || '|' || coalesce(request_id, ''), 'UTF8'))
        AND prev_hash IS NOT DISTINCT FROM lag(hash) OVER (ORDER BY id)
      ) AS ok
       FROM audit_log ORDER BY id`,
  );
  const bad = res.rows.find((r) => !r.ok);
  return bad ? Number(bad.id) : null;
}
