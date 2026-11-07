import { AppShell } from "@/components/app-shell";
import { requirePermissionPage } from "@/lib/current-user";
import { ROLES, ROLE_LABELS } from "@/lib/rbac";
import { listUsers } from "@/lib/users";
import { saveUserAccess } from "./actions";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" });

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const me = await requirePermissionPage("users.manage");
  const { ok, error } = await searchParams;
  const users = await listUsers();
  return (
    <AppShell user={me} current="/admin/users">
      <h1>Usuarios y roles</h1>
      <p className="muted">Quienes ingresan por primera vez con Google quedan con rol Lectura hasta que un administrador lo cambie.</p>
      {ok && <div className="alert alert-ok" role="status">Cambios guardados.</div>}
      {error && <div className="alert" role="alert">{error}</div>}
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable">
        <table>
          <caption className="muted">Usuarios con acceso a Radar</caption>
          <thead>
            <tr>
              <th scope="col">Correo</th>
              <th scope="col">Último ingreso</th>
              <th scope="col">Rol y estado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.last_login_at ? fmt.format(u.last_login_at) : "Nunca"}</td>
                <td>
                  <form action={saveUserAccess} className="row">
                    <input type="hidden" name="userId" value={u.id} />
                    <label className="muted" htmlFor={`role-${u.id}`}>Rol</label>
                    <select id={`role-${u.id}`} name="role" defaultValue={u.role}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    <label className="muted" htmlFor={`active-${u.id}`}>Estado</label>
                    <select id={`active-${u.id}`} name="active" defaultValue={String(u.active)}>
                      <option value="true">Activo</option>
                      <option value="false">Desactivado</option>
                    </select>
                    <button className="btn btn-primary btn-small" type="submit">Guardar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
