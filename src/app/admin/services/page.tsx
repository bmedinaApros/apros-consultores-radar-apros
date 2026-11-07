import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { COMMON_SIGNALS } from "@/lib/analyzer/observations";
import { listIndustrySignals } from "@/lib/analyzer/service";
import { addRule, createOffer, deleteRule, listOffers, updateOffer } from "@/lib/offers/service";
import { describePredicate } from "@/lib/scoring/predicate";

export const dynamic = "force-dynamic";

async function createAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ name: z.string().min(1).max(120), description: z.string().max(300).default("") }).parse(Object.fromEntries(formData));
  return guarded("/admin/services", async () => { await createOffer(toActor(user), d); return "Servicio creado."; });
}
async function updateAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ id: z.string().uuid(), name: z.string().min(1).max(120), description: z.string().max(300).default(""), active: z.enum(["true", "false"]) }).parse(Object.fromEntries(formData));
  return guarded("/admin/services", async () => { await updateOffer(toActor(user), d.id, { ...d, active: d.active === "true" }); });
}
async function addRuleAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ serviceId: z.string().uuid(), signal: z.string().regex(/^[a-z0-9_.-]+$/).max(80), status: z.enum(["observed", "not_detected"]), rationale: z.string().min(1).max(200) }).parse(Object.fromEntries(formData));
  return guarded("/admin/services", async () => { await addRule(toActor(user), d.serviceId, { rationale: d.rationale, predicate: { signal: d.signal, status: d.status } }); return "Regla agregada."; });
}
async function deleteRuleAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ ruleId: z.string().uuid() }).parse(Object.fromEntries(formData));
  return guarded("/admin/services", async () => { await deleteRule(toActor(user), d.ruleId); return "Regla eliminada."; });
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("catalog.manage");
  const q = await searchParams;
  const [offers, indSignals] = await Promise.all([listOffers(), listIndustrySignals()]);
  const signals = [...COMMON_SIGNALS.map((s) => ({ code: s.code, name: s.name })), ...indSignals.map((s) => ({ code: `industry.${s.slug}`, name: `${s.industry_name}: ${s.name}` }))];
  return (
    <AppShell user={user} current="/admin/services">
      <h1>Servicios de APROS</h1>
      <p className="muted">Catálogo de los servicios que Radar puede sugerir y las señales que los justifican. <strong>El catálogo cargado es un ejemplo</strong>: reemplázalo por la oferta real de APROS. Las sugerencias siempre se presentan como hipótesis a validar.</p>
      <Flash ok={q.ok} error={q.error} />
      <form action={createAction} className="card stack">
        <h2>Nuevo servicio</h2>
        <div><label htmlFor="name">Nombre</label><input id="name" name="name" required maxLength={120} /></div>
        <div><label htmlFor="description">Descripción</label><input id="description" name="description" maxLength={300} /></div>
        <button className="btn btn-primary" type="submit">Crear</button>
      </form>
      {offers.map((o) => (
        <section key={o.id} className="card stack" aria-labelledby={`o-${o.id}`}>
          <h2 id={`o-${o.id}`}>{o.name} {o.is_example && <span className="badge badge-info">Ejemplo</span>} {!o.active && <span className="badge badge-off">Inactivo</span>}</h2>
          <form action={updateAction} className="row">
            <input type="hidden" name="id" value={o.id} />
            <label htmlFor={`n-${o.id}`}>Nombre</label><input id={`n-${o.id}`} name="name" defaultValue={o.name} required maxLength={120} />
            <label htmlFor={`d-${o.id}`}>Descripción</label><input id={`d-${o.id}`} name="description" defaultValue={o.description} maxLength={300} />
            <label htmlFor={`a-${o.id}`}>Estado</label>
            <select id={`a-${o.id}`} name="active" defaultValue={String(o.active)}><option value="true">Activo</option><option value="false">Inactivo</option></select>
            <button className="btn btn-secondary btn-small" type="submit">Guardar</button>
          </form>
          <ul>{o.rules.map((r) => (
            <li key={r.id}>{r.rationale} <span className="muted">({describePredicate(r.predicate)})</span>
              <form action={deleteRuleAction} className="inline-form"><input type="hidden" name="ruleId" value={r.id} /><button className="btn btn-secondary btn-small" type="submit">Quitar</button></form></li>
          ))}</ul>
          <form action={addRuleAction} className="row">
            <input type="hidden" name="serviceId" value={o.id} />
            <label htmlFor={`s-${o.id}`}>Señal</label>
            <select id={`s-${o.id}`} name="signal">{signals.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}</select>
            <label htmlFor={`st-${o.id}`}>Cuando está</label>
            <select id={`st-${o.id}`} name="status"><option value="not_detected">No detectada</option><option value="observed">Observada</option></select>
            <label htmlFor={`r-${o.id}`}>Motivo que verá el equipo</label><input id={`r-${o.id}`} name="rationale" required maxLength={200} />
            <button className="btn btn-primary btn-small" type="submit">Agregar regla</button>
          </form>
        </section>
      ))}
    </AppShell>
  );
}
