import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { getWeeklySettings, saveWeeklySettings } from "@/lib/weekly/settings";
import { syncWeeklySchedule } from "@/lib/jobs/queue";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" });

async function saveAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const n = (k: string) => z.coerce.number().parse(formData.get(k));
  return guarded("/admin/weekly", async () => {
    const s = await saveWeeklySettings(toActor(user), {
      listSize: n("listSize"), minScore: n("minScore"), minCoverage: n("minCoverage") / 100, analysisBudget: n("analysisBudget"), reanalyzeAfterDays: n("reanalyzeAfterDays"),
      pagespeedBudget: n("pagespeedBudget"), noveltyWeeks: n("noveltyWeeks"), scheduleEnabled: formData.get("scheduleEnabled") === "on", cron: String(formData.get("cron") ?? ""),
    });
    await syncWeeklySchedule(s.scheduleEnabled, s.cron).catch(() => undefined); // si la cola no está disponible, el worker la sincroniza al arrancar
    return "Configuración guardada.";
  });
}

export default async function WeeklySettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("catalog.manage");
  const q = await searchParams;
  const s = await getWeeklySettings();
  const runs = (await pool().query<{ id: string; week_start: string; status: string; trigger_kind: string; partial: boolean; started_at: Date; error: string | null; stats: { eligible?: number } }>(
    `SELECT id, week_start::text, status, trigger_kind, partial, started_at, error, stats FROM weekly_runs ORDER BY started_at DESC LIMIT 10`)).rows;
  return (
    <AppShell user={user} current="/admin/weekly">
      <h1>Ejecución semanal</h1>
      <p className="muted">Cada semana Radar descubre empresas en las fuentes activas, analiza su sitio público, las puntúa y guarda una lista que una persona revisa. Si se agota un presupuesto, conserva lo hecho y lo informa.</p>
      <Flash ok={q.ok} error={q.error} />
      <form action={saveAction} className="card stack">
        <div><label htmlFor="listSize">Tamaño de la lista (empresas por semana)</label><input id="listSize" name="listSize" type="number" min={1} max={200} defaultValue={s.listSize} required /></div>
        <div><label htmlFor="minScore">Puntaje mínimo adicional para entrar (además de la banda del modelo)</label><input id="minScore" name="minScore" type="number" min={0} max={100} defaultValue={s.minScore} required /></div>
        <div><label htmlFor="minCoverage">Cobertura mínima de datos web (%)</label><input id="minCoverage" name="minCoverage" type="number" min={0} max={100} defaultValue={Math.round(s.minCoverage * 100)} required /></div>
        <div><label htmlFor="analysisBudget">Presupuesto: máximo de sitios que se analizan por ejecución</label><input id="analysisBudget" name="analysisBudget" type="number" min={0} max={1000} defaultValue={s.analysisBudget} required /></div>
        <div><label htmlFor="reanalyzeAfterDays">Un análisis se considera vencido después de (días)</label><input id="reanalyzeAfterDays" name="reanalyzeAfterDays" type="number" min={1} max={365} defaultValue={s.reanalyzeAfterDays} required /></div>
        <div><label htmlFor="pagespeedBudget">Máximo de consultas a PageSpeed por ejecución (0 = ninguna)</label><input id="pagespeedBudget" name="pagespeedBudget" type="number" min={0} max={500} defaultValue={s.pagespeedBudget} required /></div>
        <div><label htmlFor="noveltyWeeks">Semanas sin repetir una empresa (0 = nunca, salvo que cambie una señal relevante)</label><input id="noveltyWeeks" name="noveltyWeeks" type="number" min={0} max={520} defaultValue={s.noveltyWeeks} required /></div>
        <div><label><input type="checkbox" name="scheduleEnabled" defaultChecked={s.scheduleEnabled} /> Ejecutar automáticamente</label></div>
        <div><label htmlFor="cron">Calendario (cron, hora de Lima; por defecto lunes 06:00)</label><input id="cron" name="cron" defaultValue={s.cron} required pattern="[0-9*/,\- ]{5,40}" /></div>
        <button className="btn btn-primary" type="submit">Guardar</button>
      </form>
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de ejecuciones recientes">
        <table>
          <caption className="muted">Ejecuciones recientes</caption>
          <thead><tr><th scope="col">Inicio</th><th scope="col">Semana</th><th scope="col">Origen</th><th scope="col">Estado</th><th scope="col">Empresas en la lista</th></tr></thead>
          <tbody>{runs.length === 0 ? <tr><td colSpan={5} className="muted">Aún no hay ejecuciones.</td></tr> : runs.map((r) => (
            <tr key={r.id}><td>{fmt.format(r.started_at)}</td><td>{r.week_start}</td><td>{r.trigger_kind === "schedule" ? "Programada" : "Manual"}</td>
              <td>{{ running: "En curso", completed: r.partial ? "Completada (parcial)" : "Completada", failed: `Falló: ${r.error ?? ""}` }[r.status]}</td><td>{r.stats.eligible ?? "—"}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </AppShell>
  );
}
