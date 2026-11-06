import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { approveTerms, listProviders, recentRuns, runDiscovery, setProviderEnabled } from "@/lib/sources/service";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" });
const code = z.object({ code: z.string().regex(/^[a-z_]{2,40}$/) });

async function approveAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("sources.manage");
  const d = code.parse(Object.fromEntries(formData));
  return guarded("/admin/sources", async () => { await approveTerms(toActor(user), d.code); return "Términos aprobados."; });
}
async function toggleAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("sources.manage");
  const d = code.extend({ enabled: z.enum(["true", "false"]) }).parse(Object.fromEntries(formData));
  return guarded("/admin/sources", async () => { await setProviderEnabled(toActor(user), d.code, d.enabled === "true"); });
}
async function runAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("sources.manage");
  const d = code.parse(Object.fromEntries(formData));
  return guarded("/admin/sources", async () => {
    const r = await runDiscovery(toActor(user), d.code);
    return `Descubrimiento completo: ${r.found} encontradas, ${r.created} creadas, ${r.duplicates} duplicadas, ${r.blocked} bloqueadas, ${r.excluded} excluidas.`;
  });
}

export default async function SourcesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("sources.manage");
  const q = await searchParams;
  const [providers, runs] = await Promise.all([listProviders(), recentRuns()]);
  return (
    <AppShell user={user} current="/admin/sources">
      <h1>Fuentes de empresas</h1>
      <p className="muted">Todas las fuentes están desactivadas por defecto. Una fuente solo se activa después de revisar sus términos de uso (documento en <code>docs/sources/</code>) y de que un administrador los apruebe. Radar no hace scraping de Google ni de LinkedIn.</p>
      <Flash ok={q.ok} error={q.error} />
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de fuentes">
        <table>
          <caption className="muted">Fuentes disponibles y previstas</caption>
          <thead><tr><th scope="col">Fuente</th><th scope="col">Estado</th><th scope="col">Términos</th><th scope="col">Acciones</th></tr></thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.code}>
                <td><strong>{p.name}</strong><br /><span className="muted">{p.implemented ? "Implementada" : `Prevista, sin implementar. ${p.note}`}</span></td>
                <td><span className={`badge ${p.enabled ? "badge-ok" : "badge-off"}`}>{p.enabled ? "Activa" : "Desactivada"}</span></td>
                <td>{p.termsApprovedAt ? `Aprobados ${fmt.format(p.termsApprovedAt)}` : <span className="muted">Pendientes ({p.termsDoc})</span>}</td>
                <td>
                  {p.implemented ? (
                    <div className="inline-form">
                      {!p.termsApprovedAt && <form action={approveAction}><input type="hidden" name="code" value={p.code} /><button className="btn btn-secondary btn-small" type="submit">Aprobar términos</button></form>}
                      <form action={toggleAction}><input type="hidden" name="code" value={p.code} /><input type="hidden" name="enabled" value={String(!p.enabled)} />
                        <button className="btn btn-secondary btn-small" type="submit">{p.enabled ? "Desactivar" : "Activar"}</button></form>
                      {p.enabled && <form action={runAction}><input type="hidden" name="code" value={p.code} /><button className="btn btn-primary btn-small" type="submit">Ejecutar descubrimiento</button></form>}
                    </div>
                  ) : <span className="muted">No disponible</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="card" aria-labelledby="runs">
        <h2 id="runs">Últimas ejecuciones</h2>
        {runs.length === 0 ? <p className="muted">Aún no hay ejecuciones.</p> : (
          <ul>{runs.map((r) => <li key={r.id}>{fmt.format(r.started_at)} · {r.provider_code} · {r.status} · {r.found} encontradas, {r.created} creadas, {r.duplicates} duplicadas, {r.blocked} bloqueadas, {r.excluded} excluidas</li>)}</ul>
        )}
      </section>
    </AppShell>
  );
}
