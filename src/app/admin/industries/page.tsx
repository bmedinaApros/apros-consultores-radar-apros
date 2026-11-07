import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { createIndustry, listIndustries, updateIndustry } from "@/lib/companies/service";

export const dynamic = "force-dynamic";

async function createAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ name: z.string().min(1).max(80) }).parse(Object.fromEntries(formData));
  return guarded("/admin/industries", async () => { await createIndustry(toActor(user), d.name); return "Rubro creado."; });
}
async function updateAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ id: z.string().uuid(), name: z.string().min(1).max(80), active: z.enum(["true", "false"]) }).parse(Object.fromEntries(formData));
  return guarded("/admin/industries", async () => { await updateIndustry(toActor(user), d.id, { name: d.name, active: d.active === "true" }); });
}

export default async function IndustriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("catalog.manage");
  const q = await searchParams;
  const rows = await listIndustries(undefined, true);
  return (
    <AppShell user={user} current="/admin/industries">
      <h1>Rubros</h1>
      <p className="muted">Los rubros marcados como ejemplo son editables. Un rubro nuevo se puede usar de inmediato al importar o crear empresas.</p>
      <Flash ok={q.ok} error={q.error} />
      <form action={createAction} className="card inline-form">
        <label htmlFor="name">Nuevo rubro</label><input id="name" name="name" required maxLength={80} />
        <button className="btn btn-primary btn-small" type="submit">Crear</button>
      </form>
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de rubros">
        <table>
          <caption className="muted">{rows.length} rubros</caption>
          <thead><tr><th scope="col">Rubro</th><th scope="col">Empresas</th><th scope="col">Edición</th></tr></thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id}>
                <td>{i.name} {i.is_example && <span className="badge badge-info">Ejemplo</span>} {!i.active && <span className="badge badge-off">Inactivo</span>}</td>
                <td>{i.companies}</td>
                <td>
                  <form action={updateAction} className="inline-form">
                    <input type="hidden" name="id" value={i.id} />
                    <label className="muted" htmlFor={`n-${i.id}`}>Nombre</label>
                    <input id={`n-${i.id}`} name="name" defaultValue={i.name} required maxLength={80} />
                    <label className="muted" htmlFor={`a-${i.id}`}>Estado</label>
                    <select id={`a-${i.id}`} name="active" defaultValue={String(i.active)}><option value="true">Activo</option><option value="false">Inactivo</option></select>
                    <button className="btn btn-secondary btn-small" type="submit">Guardar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
