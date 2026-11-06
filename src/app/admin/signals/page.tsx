import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { listIndustries } from "@/lib/companies/service";
import { createIndustrySignal, deleteIndustrySignal, listIndustrySignals, updateIndustrySignal } from "@/lib/analyzer/service";

export const dynamic = "force-dynamic";

const scope = z.enum(["text", "links"]);

async function createAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ industryId: z.string().uuid(), name: z.string().min(1).max(80), keywords: z.string().min(1).max(2000), scope }).parse(Object.fromEntries(formData));
  return guarded("/admin/signals", async () => { await createIndustrySignal(toActor(user), d); return "Señal creada."; });
}
async function updateAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ id: z.string().uuid(), name: z.string().min(1).max(80), keywords: z.string().min(1).max(2000), scope, active: z.enum(["true", "false"]) }).parse(Object.fromEntries(formData));
  return guarded("/admin/signals", async () => { await updateIndustrySignal(toActor(user), d.id, { ...d, active: d.active === "true" }); });
}
async function deleteAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ id: z.string().uuid() }).parse(Object.fromEntries(formData));
  return guarded("/admin/signals", async () => { await deleteIndustrySignal(toActor(user), d.id); return "Señal eliminada."; });
}

export default async function SignalsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("catalog.manage");
  const q = await searchParams;
  const [signals, industries] = await Promise.all([listIndustrySignals(), listIndustries()]);
  return (
    <AppShell user={user} current="/admin/signals">
      <h1>Señales por rubro</h1>
      <p className="muted">Cada rubro puede activar señales propias a partir de palabras clave que aparecen en el sitio. Una señal que no aplica al rubro de una empresa no se evalúa ni resta puntaje. Son textos simples, no expresiones regulares.</p>
      <Flash ok={q.ok} error={q.error} />
      <form action={createAction} className="card stack">
        <h2>Nueva señal</h2>
        <div><label htmlFor="industryId">Rubro</label><select id="industryId" name="industryId" required>{industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
        <div><label htmlFor="name">Nombre</label><input id="name" name="name" required maxLength={80} /></div>
        <div><label htmlFor="keywords">Palabras clave (una por línea, máximo 20)</label><textarea id="keywords" name="keywords" required rows={3} maxLength={2000} /></div>
        <div><label htmlFor="scope">Dónde buscar</label><select id="scope" name="scope"><option value="text">En el texto visible</option><option value="links">En enlaces (texto y dirección)</option></select></div>
        <button className="btn btn-primary" type="submit">Crear señal</button>
      </form>
      <div className="stack">
        {signals.map((s) => (
          <form key={s.id} action={updateAction} className="card stack">
            <input type="hidden" name="id" value={s.id} />
            <strong>{s.industry_name}</strong>
            <div><label htmlFor={`n-${s.id}`}>Nombre</label><input id={`n-${s.id}`} name="name" defaultValue={s.name} required maxLength={80} /></div>
            <div><label htmlFor={`k-${s.id}`}>Palabras clave</label><textarea id={`k-${s.id}`} name="keywords" rows={2} defaultValue={s.keywords.join("\n")} required maxLength={2000} /></div>
            <div className="row">
              <label htmlFor={`s-${s.id}`}>Dónde</label>
              <select id={`s-${s.id}`} name="scope" defaultValue={s.scope}><option value="text">Texto visible</option><option value="links">Enlaces</option></select>
              <label htmlFor={`a-${s.id}`}>Estado</label>
              <select id={`a-${s.id}`} name="active" defaultValue={String(s.active)}><option value="true">Activa</option><option value="false">Inactiva</option></select>
              <button className="btn btn-primary btn-small" type="submit">Guardar</button>
              <button className="btn btn-secondary btn-small" type="submit" formAction={deleteAction}>Eliminar</button>
            </div>
          </form>
        ))}
      </div>
    </AppShell>
  );
}
