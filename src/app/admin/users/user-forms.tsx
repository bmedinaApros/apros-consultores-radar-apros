"use client";

import { useActionState } from "react";
import { ROLES, ROLE_LABELS } from "@/lib/rbac";
import type { TempState } from "./actions";

type Action = (prev: TempState, formData: FormData) => Promise<TempState>;

function TempPassword({ state }: { state: TempState }) {
  if (state.error) return <div className="alert" role="alert">{state.error}</div>;
  if (!state.tempPassword) return null;
  return (
    <div className="note note-warn" role="status">
      <strong>Clave temporal para {state.email}:</strong> <code>{state.tempPassword}</code>
      <p className="muted">Se muestra una sola vez. Entrégala por un canal seguro; la persona deberá cambiarla al ingresar.</p>
    </div>
  );
}

export function CreateUserForm({ action }: { action: Action }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="card stack">
      <h2>Crear usuario</h2>
      <div><label htmlFor="new-email">Correo</label><input id="new-email" name="email" type="email" maxLength={254} required /></div>
      <div><label htmlFor="new-name">Nombre</label><input id="new-name" name="name" maxLength={100} /></div>
      <div><label htmlFor="new-role">Rol</label>
        <select id="new-role" name="role" defaultValue="consultant">{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></div>
      <button className="btn btn-primary" type="submit" disabled={pending}>Crear con clave temporal</button>
      <TempPassword state={state} />
    </form>
  );
}

export function ResetPasswordForm({ action, userId, email }: { action: Action; userId: string; email: string }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="stack">
      <input type="hidden" name="userId" value={userId} />
      <button className="btn btn-secondary btn-small" type="submit" disabled={pending} aria-label={`Restablecer la clave de ${email}`}>Restablecer clave</button>
      <TempPassword state={state} />
    </form>
  );
}
