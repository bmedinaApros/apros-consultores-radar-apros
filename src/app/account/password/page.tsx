import { redirect } from "next/navigation";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { changeOwnPassword, PasswordChangeError } from "@/lib/auth-password";
import { getCurrentUserAllowRestricted } from "@/lib/current-user";
import { csrfToken } from "@/lib/session";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";

export const dynamic = "force-dynamic";

async function changeAction(formData: FormData): Promise<void> {
  "use server";
  const me = await getCurrentUserAllowRestricted();
  if (!me) redirect("/login");
  const d = z.object({ current: z.string().max(200), next: z.string().max(200), confirm: z.string().max(200) }).safeParse(Object.fromEntries(formData));
  if (!d.success) redirect("/account/password?error=Datos+inv%C3%A1lidos");
  if (d.data.next !== d.data.confirm) redirect("/account/password?error=La+confirmaci%C3%B3n+no+coincide");
  try {
    await changeOwnPassword({ userId: me.userId, email: me.email, sessionId: me.sessionId }, d.data.current, d.data.next);
  } catch (e) {
    if (e instanceof PasswordChangeError) redirect(`/account/password?error=${encodeURIComponent(e.message)}`);
    throw e;
  }
  redirect("/?ok=" + encodeURIComponent("Clave actualizada."));
}

export default async function PasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUserAllowRestricted();
  if (!user) redirect("/login");
  const q = await searchParams;
  const form = (
    <>
      <h1>{user.restricted ? "Define tu clave" : "Cambiar mi clave"}</h1>
      {user.restricted && <div className="note note-warn" role="note">Tu clave actual es temporal. Define una nueva para continuar.</div>}
      <Flash ok={q.ok} error={q.error} />
      <form action={changeAction} className="card stack">
        <div><label htmlFor="current">Clave actual</label><input id="current" name="current" type="password" autoComplete="current-password" maxLength={200} required /></div>
        <div><label htmlFor="next">Clave nueva</label><input id="next" name="next" type="password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} maxLength={200} required aria-describedby="pw-help" />
          <p id="pw-help" className="muted">Al menos {PASSWORD_MIN_LENGTH} caracteres. Una frase larga es mejor que una clave corta con símbolos. No uses tu correo.</p></div>
        <div><label htmlFor="confirm">Repite la clave nueva</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" maxLength={200} required /></div>
        <button className="btn btn-primary" type="submit">Guardar clave</button>
        <p className="muted">Al cambiarla se cierran tus sesiones en otros equipos.</p>
      </form>
      {user.restricted && (
        <form action="/api/auth/logout" method="post">
          <input type="hidden" name="csrf" value={csrfToken(user.csrfSecret)} />
          <button className="btn btn-secondary btn-small" type="submit">Cerrar sesión</button>
        </form>
      )}
    </>
  );
  if (user.restricted) return <main id="contenido" className="main" style={{ maxWidth: 560, margin: "0 auto" }}>{form}</main>;
  return <AppShell user={user} current="/account/password">{form}</AppShell>;
}
