import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { enqueueWeeklyRun } from "@/lib/jobs/queue";
import { can } from "@/lib/rbac";
import { latestList, listWeeklyLists } from "@/lib/weekly/service";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "America/Lima" });
const fmtTime = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" });

async function runNowAction(): Promise<void> {
  "use server";
  const user = await requirePermissionPage("weekly.run");
  return guarded("/weekly", async () => {
    const id = await enqueueWeeklyRun({ triggeredBy: user.userId, kind: "manual" });
    return id ? "Ejecución semanal encolada. Se procesa en segundo plano (el worker debe estar corriendo)." : "Ya hay una ejecución pendiente.";
  });
}

export default async function WeeklyIndex({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("weekly.read");
  const q = await searchParams;
  const [latest, lists] = await Promise.all([latestList(), listWeeklyLists(12)]);
  if (latest && !q.ok && !q.error && !q.all) redirect(`/weekly/${latest.id}`);
  return (
    <AppShell user={user} current="/weekly">
      <h1>Lista semanal</h1>
      <Flash ok={q.ok} error={q.error} />
      {can(user.role, "weekly.run") && (
        <form action={runNowAction}><button className="btn btn-primary" type="submit">Ejecutar ahora</button></form>
      )}
      {lists.length === 0 ? (
        <div className="card empty">
          <h2>Aún no hay listas semanales</h2>
          <p>La primera se genera con la ejecución semanal programada o al pulsar «Ejecutar ahora». Antes conviene importar empresas y revisar las fuentes.</p>
        </div>
      ) : (
        <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de listas semanales">
          <table>
            <caption className="muted">Listas anteriores</caption>
            <thead><tr><th scope="col">Semana</th><th scope="col">Generada</th><th scope="col">Empresas</th><th scope="col">Estado</th></tr></thead>
            <tbody>{lists.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/weekly/${l.id}`}>Semana del {fmt.format(new Date(`${l.week_start}T12:00:00Z`))}</Link></td>
                <td>{fmtTime.format(l.created_at)} · {l.trigger_kind === "schedule" ? "programada" : "manual"}</td>
                <td>{l.total_items}</td>
                <td>{l.partial ? <span className="badge badge-warn">Cobertura parcial</span> : <span className="badge badge-ok">Completa</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
