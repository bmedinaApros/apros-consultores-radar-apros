import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { requirePermissionPage } from "@/lib/current-user";
import { listBatches, type Batch } from "@/lib/registry/import";
import { importDir, listImportFiles } from "@/lib/registry/source";
import { cancelImportAction, resumeImportAction, startImportAction } from "../actions";
import { AutoRefresh } from "./auto-refresh";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" });
const nf = new Intl.NumberFormat("es-PE");
const mb = (n: number) => `${(n / 1048576).toFixed(n > 1073741824 ? 0 : 1)} MB`;
const STATUS: Record<string, string> = { queued: "En cola", running: "En curso", completed: "Completada", failed: "Fallida (se puede reanudar)", cancelling: "Cancelando", cancelled: "Cancelada (se puede reanudar)" };
const REASONS: Record<string, string> = { persona_natural: "personas naturales", persona_juridica: "personas jurídicas", estado: "estado distinto", condicion: "condición distinta", zona: "fuera de la zona", ya_cargado_o_sin_registro: "ya cargadas o sin RUC en el padrón" };

function Progress({ b }: { b: Batch }) {
  return (
    <span>
      {nf.format(Number(b.rows_read))} leídas · {nf.format(Number(b.rows_loaded))} cargadas · {nf.format(Number(b.rows_skipped))} descartadas · {nf.format(Number(b.rows_invalid))} inválidas
    </span>
  );
}

export default async function ImportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("registry.import");
  const q = await searchParams;
  const [files, batches] = await Promise.all([listImportFiles(), listBatches(15)]);
  const active = batches.some((b) => b.status === "running" || b.status === "cancelling");
  return (
    <AppShell user={user} current="/registry/imports">
      {active && <AutoRefresh />}
      <h1>Importaciones del padrón</h1>
      <p className="muted">
        Radar carga el padrón reducido de SUNAT desde un archivo que tú descargas (modo asistido). Copia el archivo a la carpeta <code>{importDir()}</code> del equipo donde corre Radar
        (acepta <code>.zip</code>, <code>.gz</code> y <code>.txt</code>). La carga corre en segundo plano, se puede reanudar si se interrumpe y por defecto solo guarda personas jurídicas,
        activas y habidas: las personas naturales no se guardan.
      </p>
      <Flash ok={q.ok} error={q.error} />
      <form action={startImportAction} className="card stack">
        <h2>Nueva carga</h2>
        {files.length === 0 ? <p className="muted">No hay archivos en la carpeta de importación.</p> : (
          <>
            <div><label htmlFor="file">Archivo</label>
              <select id="file" name="file" required>{files.map((f) => <option key={f.name} value={f.name}>{f.name} · {mb(f.size)} · {fmt.format(f.modified)}</option>)}</select></div>
            <div><label htmlFor="note">Nota de la fuente (aparece en cada dato)</label><input id="note" name="note" maxLength={200} placeholder="Ej.: Actualizado al 07/11/2026" /></div>
            <div className="row">
              <div><label htmlFor="persons">Tipo de persona</label>
                <select id="persons" name="persons" defaultValue="juridica"><option value="juridica">Solo jurídicas (RUC 20)</option><option value="natural">Solo naturales</option><option value="all">Todas</option></select></div>
              <div><label htmlFor="statuses">Estados (separados por coma; vacío = todos)</label><input id="statuses" name="statuses" defaultValue="ACTIVO" maxLength={120} /></div>
              <div><label htmlFor="conditions">Condiciones (vacío = todas)</label><input id="conditions" name="conditions" defaultValue="HABIDO" maxLength={120} /></div>
              <div><label htmlFor="ubigeo">Zonas por ubigeo (2, 4 o 6 dígitos, separados por coma; vacío = todas)</label><input id="ubigeo" name="ubigeo" maxLength={200} placeholder="15,07" /></div>
            </div>
            <div><label><input type="checkbox" name="onlyKnown" /> Archivo de locales: cargar solo los de empresas que ya están en el padrón</label></div>
            <button className="btn btn-primary" type="submit">Cargar</button>
            <p className="muted">Si es el archivo de locales anexos, cárgalo después del archivo principal de RUC. Los estados y condiciones solo se aplican al archivo de RUC.</p>
          </>
        )}
      </form>
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de cargas">
        <table>
          <caption className="muted">Cargas recientes{active ? " (esta página se actualiza sola)" : ""}</caption>
          <thead><tr><th scope="col">Archivo</th><th scope="col">Tipo</th><th scope="col">Estado</th><th scope="col">Avance</th><th scope="col">Detalle</th><th scope="col">Acciones</th></tr></thead>
          <tbody>{batches.length === 0 ? <tr><td colSpan={6} className="muted">Aún no hay cargas.</td></tr> : batches.map((b) => (
            <tr key={b.id}>
              <td>{b.file_name}<div className="muted">{b.source_note ?? "sin nota"} · {fmt.format(b.created_at)}</div></td>
              <td>{b.kind === "ruc" ? "RUC" : "Locales"}</td>
              <td>{STATUS[b.status] ?? b.status}{b.error ? <div className="muted">{b.error}</div> : null}</td>
              <td><Progress b={b} /></td>
              <td className="muted">{Object.entries(b.skipped).map(([k, v]) => `${REASONS[k] ?? k}: ${nf.format(v)}`).join(" · ") || "—"}
                <div>Filtros: {b.filters.personKinds.join("+")} · estados {b.filters.statuses.join(",") || "todos"} · condiciones {b.filters.conditions.join(",") || "todas"}{b.filters.ubigeoPrefixes.length ? ` · zonas ${b.filters.ubigeoPrefixes.join(",")}` : ""}</div></td>
              <td>
                {["failed", "cancelled", "queued"].includes(b.status) && <form action={resumeImportAction}><input type="hidden" name="id" value={b.id} /><button className="btn btn-secondary btn-small" type="submit">{b.status === "queued" ? "Iniciar" : "Reanudar"}</button></form>}
                {["queued", "running", "failed"].includes(b.status) && <form action={cancelImportAction}><input type="hidden" name="id" value={b.id} /><button className="btn btn-secondary btn-small" type="submit">Cancelar</button></form>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </AppShell>
  );
}
