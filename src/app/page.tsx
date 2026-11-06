import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/current-user";
import { ROLE_LABELS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ denegado?: string }> }) {
  const user = await requireUser();
  const { denegado } = await searchParams;
  return (
    <AppShell user={user} current="/">
      <h1>Radar APROS</h1>
      {denegado && (
        <div className="alert" role="alert">
          Tu rol no tiene permiso para esa sección.
        </div>
      )}
      <div className="card empty">
        <h2>Aún no hay listas semanales</h2>
        <p>
          La lista semanal de empresas llegará en la fase 4. Por ahora esta versión incluye acceso, roles y auditoría.
        </p>
        <p className="muted">Sesión iniciada como {ROLE_LABELS[user.role]}.</p>
      </div>
    </AppShell>
  );
}
