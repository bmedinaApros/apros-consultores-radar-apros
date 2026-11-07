import { AppShell } from "@/components/app-shell";
import { requirePermissionPage } from "@/lib/current-user";
import { recentAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Lima" });

export default async function AuditPage() {
  const me = await requirePermissionPage("audit.read");
  const rows = await recentAudit(200);
  return (
    <AppShell user={me} current="/admin/audit">
      <h1>Registro de auditoría</h1>
      <p className="muted">Solo lectura. Los eventos no se pueden editar ni borrar desde la aplicación.</p>
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable">
        {rows.length === 0 ? (
          <p className="empty">Aún no hay eventos.</p>
        ) : (
          <table>
            <caption className="muted">Últimos 200 eventos</caption>
            <thead>
              <tr>
                <th scope="col">Fecha (Lima)</th>
                <th scope="col">Usuario</th>
                <th scope="col">Acción</th>
                <th scope="col">Objeto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{fmt.format(r.at)}</td>
                  <td>{r.actor_email ?? "sistema"}</td>
                  <td>{r.action}</td>
                  <td>{r.entity_type ? `${r.entity_type} ${r.entity_id ?? ""}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
