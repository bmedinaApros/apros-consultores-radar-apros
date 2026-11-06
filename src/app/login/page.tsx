import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { env, isDevLoginAllowed } from "@/lib/env";
import { googleConfigured } from "@/lib/google";
import { listUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  dominio_no_autorizado: "Tu correo no pertenece a un dominio autorizado.",
  usuario_inactivo: "Tu usuario está desactivado. Habla con un administrador.",
  correo_no_verificado: "Google indica que tu correo no está verificado.",
  sesion_expirada: "La sesión de acceso expiró. Intenta de nuevo.",
  error_de_acceso: "No pudimos completar el acceso. Intenta de nuevo.",
  google_no_configurado: "El acceso con Google aún no está configurado en este entorno.",
  usuario_desconocido: "Ese usuario de desarrollo no existe.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;
  const dev = isDevLoginAllowed(env());
  const devUsers = dev ? await listUsers() : [];
  return (
    <div className="login">
      <section className="login-hero">
        <Image className="logo" src="/brand/apros-logotipo-horizontal-blanco.png" alt="APROS" width={512} height={112} unoptimized priority />
        <h1>Encuentra la próxima oportunidad.</h1>
        <p className="muted">Radar APROS · uso interno</p>
      </section>
      <section className="login-panel" id="contenido">
        <h2>Ingresar</h2>
        {error && ERRORS[error] && (
          <div className="alert" role="alert">
            {ERRORS[error]}
          </div>
        )}
        <a className="btn btn-primary" href="/api/auth/google/start" aria-disabled={!googleConfigured()}>
          Ingresar con Google
        </a>
        {!googleConfigured() && <p className="muted">Google aún no está configurado en este entorno.</p>}
        {dev && (
          <form method="post" action="/api/auth/dev-login" className="card stack">
            <h3>Acceso de desarrollo</h3>
            <p className="muted">Solo existe en tu equipo local con datos ficticios.</p>
            <div>
              <label htmlFor="email">Usuario</label>
              <select id="email" name="email" required>
                {devUsers.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.email} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-secondary" type="submit">Entrar como este usuario</button>
          </form>
        )}
      </section>
    </div>
  );
}
