import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import { CompanyIndex } from "../companies/dedupe";
import { evaluate, insertCompany, loadLookups, prepareCompany } from "../companies/ingest";
import { requirePermission } from "../rbac";
import type { ActorInfo } from "../companies/service";
import { IMPLEMENTED_PROVIDERS, PLANNED_PROVIDERS } from "./provider";

export class SourceError extends Error {
  override name = "SourceError";
}

export interface ProviderState {
  code: string;
  name: string;
  implemented: boolean;
  enabled: boolean;
  termsDoc: string;
  termsApprovedAt: Date | null;
  note?: string;
}

async function ensureRows(): Promise<void> {
  const all = [...IMPLEMENTED_PROVIDERS, ...PLANNED_PROVIDERS];
  for (const p of all) {
    await pool().query(`INSERT INTO source_providers (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`, [p.code, p.name]);
  }
}

export async function listProviders(): Promise<ProviderState[]> {
  await ensureRows();
  const res = await pool().query<{ code: string; enabled: boolean; terms_approved_at: Date | null }>(
    `SELECT code, enabled, terms_approved_at FROM source_providers`);
  const byCode = new Map(res.rows.map((r) => [r.code, r]));
  return [
    ...IMPLEMENTED_PROVIDERS.map((p) => ({ code: p.code, name: p.name, implemented: true, termsDoc: p.termsDoc, note: undefined as string | undefined })),
    ...PLANNED_PROVIDERS.map((p) => ({ code: p.code, name: p.name, implemented: false, termsDoc: p.termsDoc, note: p.note as string | undefined })),
  ].map((p) => ({
    ...p,
    enabled: byCode.get(p.code)?.enabled ?? false,
    termsApprovedAt: byCode.get(p.code)?.terms_approved_at ?? null,
  }));
}

/** Un administrador atestigua que revisó los términos del proveedor (documento en el repositorio). */
export async function approveTerms(actor: ActorInfo, code: string): Promise<void> {
  requirePermission(actor, "sources.manage");
  const p = IMPLEMENTED_PROVIDERS.find((x) => x.code === code);
  if (!p) throw new SourceError("Esta fuente aún no está implementada; no se pueden aprobar sus términos");
  await ensureRows();
  await withTransaction(async (c) => {
    await c.query(
      `UPDATE source_providers SET terms_doc_path = $2, terms_approved_by = $3, terms_approved_at = now(), updated_at = now() WHERE code = $1`,
      [code, p.termsDoc, actor.id]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "source.terms_approved", entityType: "source_provider", entityId: code, metadata: { termsDoc: p.termsDoc } }, c);
  });
}

export async function setProviderEnabled(actor: ActorInfo, code: string, enabled: boolean): Promise<void> {
  requirePermission(actor, "sources.manage");
  if (!IMPLEMENTED_PROVIDERS.some((x) => x.code === code)) throw new SourceError("Esta fuente aún no está implementada");
  await ensureRows();
  await withTransaction(async (c) => {
    try {
      await c.query(`UPDATE source_providers SET enabled = $2, updated_at = now() WHERE code = $1`, [code, enabled]);
    } catch (e) {
      // La restricción de la base impide activar sin términos aprobados.
      if ((e as { code?: string }).code === "23514") throw new SourceError("No se puede activar: faltan los términos aprobados");
      throw e;
    }
    await audit({ actorId: actor.id, actorEmail: actor.email, action: enabled ? "source.enabled" : "source.disabled", entityType: "source_provider", entityId: code }, c);
  });
}

export interface DiscoveryResult { runId: string; found: number; created: number; duplicates: number; blocked: number; excluded: number }

/**
 * Ejecuta un proveedor activo y procesa sus empresas con las mismas reglas que una importación.
 * Las coincidencias dudosas no se crean automáticamente: solo se cuentan como duplicados.
 */
export async function runDiscovery(actor: ActorInfo, code: string): Promise<DiscoveryResult> {
  requirePermission(actor, "sources.manage");
  return runDiscoveryInternal(code, actor.id, actor);
}

/** Ejecución interna (también usada por la ejecución semanal programada, sin persona detrás). */
export async function runDiscoveryInternal(code: string, startedBy: string | null, actor?: ActorInfo): Promise<DiscoveryResult> {
  const provider = IMPLEMENTED_PROVIDERS.find((x) => x.code === code);
  if (!provider) throw new SourceError("Fuente no implementada");
  await ensureRows();
  const st = await pool().query<{ enabled: boolean }>(`SELECT enabled FROM source_providers WHERE code = $1`, [code]);
  if (!st.rows[0]?.enabled) throw new SourceError("La fuente está desactivada");

  const run = await pool().query<{ id: string }>(
    `INSERT INTO discovery_runs (provider_code, started_by) VALUES ($1, $2) RETURNING id`, [code, startedBy]);
  const runId = run.rows[0]!.id;
  const result: DiscoveryResult = { runId, found: 0, created: 0, duplicates: 0, blocked: 0, excluded: 0 };
  try {
    const found = (await provider.discover()).slice(0, provider.maxPerRun);
    result.found = found.length;
    await withTransaction(async (c) => {
      const lookups = await loadLookups(c);
      const index = await CompanyIndex.load(c);
      for (const raw of found) {
        const { prepared, issues } = prepareCompany(raw, lookups);
        const ev = await evaluate(prepared, issues, index, c);
        if (ev.status === "blocked") result.blocked++;
        else if (ev.status === "excluded_client") result.excluded++;
        else if (ev.status === "duplicate" || ev.status === "possible_duplicate") result.duplicates++;
        else if (ev.status === "valid" && prepared) {
          const id = await insertCompany(c, prepared, { createdBy: startedBy, sourceCode: code, sourceRef: runId });
          index.add(id, { normalizedName: prepared.normalizedName, domain: prepared.domain, ruc: prepared.ruc });
          result.created++;
        }
      }
    });
    await pool().query(
      `UPDATE discovery_runs SET status='completed', found=$2, created=$3, duplicates=$4, blocked=$5, excluded=$6, finished_at=now() WHERE id=$1`,
      [runId, result.found, result.created, result.duplicates, result.blocked, result.excluded]);
    await audit({ actorId: startedBy, actorEmail: actor?.email ?? null, action: "discovery.completed", entityType: "discovery_run", entityId: runId, metadata: { provider: code, ...result } });
    return result;
  } catch (e) {
    await pool().query(`UPDATE discovery_runs SET status='failed', error=$2, finished_at=now() WHERE id=$1`, [runId, e instanceof Error ? e.message.slice(0, 300) : "error"]);
    throw e;
  }
}

export async function recentRuns() {
  return (await pool().query<{ id: string; provider_code: string; status: string; found: number; created: number; duplicates: number; blocked: number; excluded: number; started_at: Date }>(
    `SELECT id, provider_code, status, found, created, duplicates, blocked, excluded, started_at FROM discovery_runs ORDER BY started_at DESC LIMIT 20`)).rows;
}
