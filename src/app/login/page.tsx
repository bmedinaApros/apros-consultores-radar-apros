import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentUserAllowRestricted } from "@/lib/current-user";
import { env, isDevLoginAllowed } from "@/lib/env";
import { googleConfigured } from "@/lib/google";
import { listUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  credenciales_invalidas: "Usuario o clave incorrectos, o la cuenta está bloqueada temporalmente.",
  demasiados_intentos: "Demasiados intentos desde este equipo. Espera unos minutos e inténtalo de nuevo.",
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
  if (await getCurrentUserAllowRestricted()) redirect("/account/password");
  const { error } = await searchParams;
  const dev = isDevLoginAllowed(env());
  const devUsers = dev ? await listUsers() : [];
  const google = googleConfigured();
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
        <form method="post" action="/api/auth/login" className="stack">
          <div>
            <label htmlFor="login-email">Correo</label>
            <input id="login-email" name="email" type="email" autoComplete="username" maxLength={254} required />
          </div>
          <div>
            <label htmlFor="login-password">Clave</label>
            <input id="login-password" name="password" type="password" autoComplete="current-password" maxLength={200} required />
          </div>
          <button className="btn btn-primary" type="submit">Ingresar</button>
          <p className="muted">¿No tienes acceso o olvidaste tu clave? Pídele a un administrador que te cree o restablezca el acceso.</p>
        </form>
        {google && (
          <a className="btn btn-secondary" href="/api/auth/google/start">
            Ingresar con Google
          </a>
        )}
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
