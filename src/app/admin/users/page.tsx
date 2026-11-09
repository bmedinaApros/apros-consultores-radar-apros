import { AppShell } from "@/components/app-shell";
import { requirePermissionPage } from "@/lib/current-user";
import { pool } from "@/lib/db";
import { ROLES, ROLE_LABELS } from "@/lib/rbac";
import { listUsers } from "@/lib/users";
import { createUserAction, resetPasswordAction, saveUserAccess, unlockAction } from "./actions";
import { CreateUserForm, ResetPasswordForm } from "./user-forms";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" });

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const me = await requirePermissionPage("users.manage");
  const { ok, error } = await searchParams;
  const users = await listUsers();
  const extra = new Map((await pool().query<{ id: string; locked_until: Date | null; locked: boolean; has_password: boolean; must_change_password: boolean }>(
    `SELECT id, locked_until, (locked_until IS NOT NULL AND locked_until > now()) AS locked, (password_hash IS NOT NULL) AS has_password, must_change_password FROM users`)).rows.map((r) => [r.id, r]));
  return (
    <AppShell user={me} current="/admin/users">
      <h1>Usuarios y accesos</h1>
      <p className="muted">Cada persona ingresa con su correo y una clave. Al crear o restablecer, se genera una clave temporal que se muestra una sola vez y que la persona debe cambiar al ingresar. Tras 5 intentos fallidos la cuenta se bloquea un tiempo.</p>
      {ok && <div className="alert alert-ok" role="status">Cambios guardados.</div>}
      {error && <div className="alert" role="alert">{error}</div>}
      <CreateUserForm action={createUserAction} />
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable">
        <table>
          <caption className="muted">Usuarios con acceso a Radar</caption>
          <thead>
            <tr>
              <th scope="col">Correo</th>
              <th scope="col">Acceso</th>
              <th scope="col">Rol y estado</th>
              <th scope="col">Clave</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const x = extra.get(u.id);
              const locked = x?.locked === true;
              return (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    {u.last_login_at ? `Último ingreso: ${fmt.format(u.last_login_at)}` : "Nunca ingresó"}
                    <div className="muted">
                      {x?.has_password ? (x.must_change_password ? "Clave temporal pendiente de cambio" : "Con clave") : "Sin clave (solo Google)"}
                      {locked && x?.locked_until ? ` · Bloqueada hasta ${fmt.format(x.locked_until)}` : ""}
                    </div>
                  </td>
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
                  <td>
                    <ResetPasswordForm action={resetPasswordAction} userId={u.id} email={u.email} />
                    {locked && (
                      <form action={unlockAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <button className="btn btn-secondary btn-small" type="submit">Desbloquear</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
