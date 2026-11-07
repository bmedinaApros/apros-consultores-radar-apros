import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { requirePermissionPage } from "@/lib/current-user";
import { pool } from "@/lib/db";
import { getBatchSummary, ImportError } from "@/lib/companies/import";
import { commitAction, decideAction, discardAction, undoAction } from "../actions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  valid: { label: "Válida", cls: "badge-ok" },
  error: { label: "Error", cls: "badge-off" },
  duplicate: { label: "Duplicado exacto", cls: "badge-warn" },
  possible_duplicate: { label: "Posible duplicado", cls: "badge-warn" },
  blocked: { label: "No contactar", cls: "badge-off" },
  excluded_client: { label: "Cliente activo", cls: "badge-info" },
};

export default async function BatchPage({ params, searchParams }: { params: Promise<{ batchId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("companies.import");
  const { batchId } = await params;
  if (!z.string().uuid().safeParse(batchId).success) notFound();
  const summary = await getBatchSummary(batchId).catch((e) => { if (e instanceof ImportError) notFound(); throw e; });
  const q = await searchParams;
  const rows = (await pool().query<{ id: string; row_number: number; raw: Record<string, string>; status: string; errors: { level: string; message: string }[]; decision: string | null; match_company_id: string | null; match_name: string | null }>(
    `SELECT r.id, r.row_number, r.raw, r.status, r.errors, r.decision, r.match_company_id, c.legal_name AS match_name
       FROM import_rows r LEFT JOIN companies c ON c.id = r.match_company_id
      WHERE r.batch_id = $1 AND (r.status <> 'valid' OR r.errors <> '[]'::jsonb) ORDER BY r.row_number LIMIT 300`, [batchId])).rows;
  const open = summary.status === "previewed";
  const c = summary.counts;
  return (
    <AppShell user={user} current="/companies/import">
      <p><Link href="/companies/import">← Importar</Link></p>
      <h1>Vista previa: {summary.filename}</h1>
      <Flash ok={q.ok} error={q.error} />
      <p className="muted">Estado del lote: <strong>{{ previewed: "pendiente de confirmar", committed: "confirmado", undone: "deshecho", discarded: "descartado" }[summary.status]}</strong></p>
      <div className="grid-2">
        {Object.entries(STATUS).map(([k, v]) => (
          <div key={k} className="card"><div className="stat">{c[k as keyof typeof c]}</div><span className={`badge ${v.cls}`}>{v.label}</span></div>
        ))}
      </div>
      <div className="card row">
        {open && (
          <>
            <form action={commitAction}><input type="hidden" name="batchId" value={batchId} />
              <button className="btn btn-primary" type="submit" disabled={summary.pendingDecisions > 0}>Confirmar importación</button></form>
            <form action={discardAction}><input type="hidden" name="batchId" value={batchId} />
              <button className="btn btn-secondary" type="submit">Descartar</button></form>
            {summary.pendingDecisions > 0 && <span className="muted">Resuelve {summary.pendingDecisions} posible(s) duplicado(s) para poder confirmar.</span>}
          </>
        )}
        {summary.status === "committed" && (
          <form action={undoAction}><input type="hidden" name="batchId" value={batchId} />
            <button className="btn btn-secondary" type="submit">Deshacer este lote</button></form>
        )}
        <a className="btn btn-secondary" href={`/api/companies/import/${batchId}/report`}>Descargar informe CSV</a>
      </div>
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de filas con observaciones">
        {rows.length === 0 ? <p className="empty">Todas las filas son válidas y sin observaciones.</p> : (
          <table>
            <caption className="muted">Filas con observaciones (máximo 300; el informe CSV trae todas)</caption>
            <thead><tr><th scope="col">Fila</th><th scope="col">Empresa</th><th scope="col">Estado</th><th scope="col">Detalle</th><th scope="col">Decisión</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.row_number}</td>
                  <td>{r.raw.legal_name || <span className="muted">(sin nombre)</span>}<br /><span className="muted">{r.raw.website}</span></td>
                  <td><span className={`badge ${STATUS[r.status]?.cls}`}>{STATUS[r.status]?.label}</span></td>
                  <td>{r.errors.map((e, i) => <div key={i}>{e.message}</div>)}{r.match_name && <div className="muted">Coincide con: <Link href={`/companies/${r.match_company_id}`}>{r.match_name}</Link></div>}</td>
                  <td>
                    {open && (r.status === "possible_duplicate" || r.status === "duplicate") ? (
                      <form action={decideAction} className="inline-form">
                        <input type="hidden" name="batchId" value={batchId} /><input type="hidden" name="rowId" value={r.id} />
                        <label className="muted" htmlFor={`d-${r.id}`}>Acción</label>
                        <select id={`d-${r.id}`} name="decision" defaultValue={r.decision ?? ""} required>
                          <option value="" disabled>Elegir…</option>
                          {r.status === "possible_duplicate" && <option value="create">Crear como nueva</option>}
                          {r.match_company_id && <option value="merge">Fusionar con la existente</option>}
                          <option value="skip">Omitir</option>
                        </select>
                        <button className="btn btn-secondary btn-small" type="submit">Guardar</button>
                      </form>
                    ) : r.decision === "skip" ? "Omitida" : r.decision === "create" ? "Se crea" : r.decision === "merge" ? "Se fusiona" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
