import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { listIndustries } from "@/lib/companies/service";
import { activateModelVersion, createModelVersion, getModelVersion, listModels } from "@/lib/scoring/service";
import { generalModel } from "@/lib/scoring/model";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" });

async function newVersionAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ modelId: z.string().uuid().or(z.literal("")), industryId: z.string().uuid().or(z.literal("")), definition: z.string().min(2).max(200_000), note: z.string().max(300) }).parse(Object.fromEntries(formData));
  return guarded("/admin/models", async () => {
    const r = await createModelVersion(toActor(user), { modelId: d.modelId || undefined, industryId: d.industryId || undefined }, d.definition, d.note);
    return `Versión ${r.version} creada y activada. Los puntajes anteriores conservan la versión con la que se calcularon.`;
  });
}
async function activateAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ versionId: z.string().uuid() }).parse(Object.fromEntries(formData));
  return guarded("/admin/models", async () => { await activateModelVersion(toActor(user), d.versionId); return "Versión activada."; });
}

export default async function ModelsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("catalog.manage");
  const q = await searchParams;
  const [models, industries] = await Promise.all([listModels(), listIndustries()]);
  const withModel = new Set(models.map((m) => m.industry_id).filter(Boolean));
  const active = await Promise.all(models.map(async (m) => ({ m, v: await getModelVersion(m.versions.find((x) => x.active)!.id) })));
  return (
    <AppShell user={user} current="/admin/models">
      <h1>Modelos de puntaje</h1>
      <p className="muted">Un modelo general se aplica por defecto y cada rubro puede tener el suyo. Cada versión es inmutable: un cambio crea una versión nueva y los puntajes anteriores se siguen pudiendo reproducir. Los pesos deben sumar 100.</p>
      <Flash ok={q.ok} error={q.error} />
      {active.map(({ m, v }) => (
        <section key={m.model_id} className="card stack" aria-labelledby={`m-${m.model_id}`}>
          <h2 id={`m-${m.model_id}`}>{m.name} {m.industry_id ? "" : <span className="badge badge-info">General</span>}</h2>
          <p className="muted">Versiones: {m.versions.map((x) => `v${x.version}${x.active ? " (activa)" : ""} · ${fmt.format(new Date(x.created_at))}${x.note ? ` · ${x.note}` : ""}`).join(" | ")}</p>
          {v && (
            <>
              <p>Pesos: {v.definition.dimensions.map((d) => `${d.label} ${d.weight}`).join(" · ")} · Umbrales: ventas {v.definition.thresholds.sales}, nurturing {v.definition.thresholds.nurturing}</p>
              <details><summary>Editar (crea una versión nueva)</summary>
                <form action={newVersionAction} className="stack">
                  <input type="hidden" name="modelId" value={m.model_id} /><input type="hidden" name="industryId" value="" />
                  <div><label htmlFor={`d-${m.model_id}`}>Definición (JSON)</label>
                    <textarea id={`d-${m.model_id}`} name="definition" rows={14} defaultValue={JSON.stringify(v.definition, null, 2)} spellCheck={false} required /></div>
                  <div><label htmlFor={`n-${m.model_id}`}>¿Qué cambió? *</label><input id={`n-${m.model_id}`} name="note" required maxLength={300} /></div>
                  <button className="btn btn-primary btn-small" type="submit">Guardar como versión nueva</button>
                </form>
              </details>
            </>
          )}
          {m.versions.filter((x) => !x.active).length > 0 && (
            <form action={activateAction} className="inline-form">
              <label htmlFor={`v-${m.model_id}`}>Reactivar una versión anterior</label>
              <select id={`v-${m.model_id}`} name="versionId">{m.versions.filter((x) => !x.active).map((x) => <option key={x.id} value={x.id}>v{x.version}</option>)}</select>
              <button className="btn btn-secondary btn-small" type="submit">Reactivar</button>
            </form>
          )}
        </section>
      ))}
      <form action={newVersionAction} className="card stack">
        <h2>Crear un modelo propio para un rubro</h2>
        <input type="hidden" name="modelId" value="" />
        <div><label htmlFor="industryId">Rubro</label>
          <select id="industryId" name="industryId" required>{industries.filter((i) => !withModel.has(i.id)).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
        <div><label htmlFor="definition">Definición (JSON; parte del modelo general)</label>
          <textarea id="definition" name="definition" rows={10} defaultValue={JSON.stringify(generalModel(), null, 2)} spellCheck={false} required /></div>
        <div><label htmlFor="note">¿Qué cambió? *</label><input id="note" name="note" required maxLength={300} defaultValue="Modelo inicial" /></div>
        <button className="btn btn-primary" type="submit">Crear modelo</button>
      </form>
    </AppShell>
  );
}
