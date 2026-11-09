import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/current-user";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/** La pantalla de inicio es el buscador. Solo si el rol no puede buscar se muestra un aviso. */
export default async function Home({ searchParams }: { searchParams: Promise<{ denegado?: string }> }) {
  const user = await requireUser();
  const { denegado } = await searchParams;
  if (!denegado && can(user.role, "registry.read")) redirect("/registry");
  return (
    <AppShell user={user} current="/">
      <h1>Radar APROS</h1>
      {denegado && <div className="alert" role="alert">Tu rol no tiene permiso para esa sección.</div>}
    </AppShell>
  );
}
