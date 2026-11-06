import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { addActiveClient, listActiveClients, removeActiveClient } from "@/lib/companies/service";

export const dynamic = "force-dynamic";

async function addAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ name: z.string().min(1).max(200), website: z.string().max(300).default(""), ruc: z.string().max(30).default("") }).parse(Object.fromEntries(formData));
  return guarded("/admin/clients", async () => { await addActiveClient(toActor(user), d); return "Cliente activo agregado."; });
}
async function removeAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ id: z.string().uuid() }).parse(Object.fromEntries(formData));
  return guarded("/admin/clients", async () => { await removeActiveClient(toActor(user), d.id); return "Retirado."; });
}

export default async function ClientsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("catalog.manage");
  const q = await searchParams;
  const rows = await listActiveClients();
  return (
    <AppShell user={user} current="/admin/clients">
      <h1>Clientes activos</h1>
      <p className="muted">Los prospectos permanecen separados de la cartera. Las empresas de esta lista se excluyen automáticamente del descubrimiento y de las importaciones. La cartera real vendrá del Hub o del CRM cuando exista el contrato.</p>
      <Flash ok={q.ok} error={q.error} />
      <form action={addAction} className="card stack">
        <div><label htmlFor="name">Nombre *</label><input id="name" name="name" required maxLength={200} /></div>
        <div><label htmlFor="website">Sitio web</label><input id="website" name="website" /></div>
        <div><label htmlFor="ruc">RUC</label><input id="ruc" name="ruc" inputMode="numeric" /></div>
        <button className="btn btn-primary" type="submit">Agregar</button>
      </form>
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de clientes activos">
        {rows.length === 0 ? <p className="empty">Aún no hay clientes activos cargados.</p> : (
          <table>
            <caption className="muted">{rows.length} clientes</caption>
            <thead><tr><th scope="col">Nombre</th><th scope="col">Sitio</th><th scope="col">RUC</th><th scope="col">Acción</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}><td>{r.name}</td><td>{r.domain ?? "—"}</td><td>{r.ruc ?? "—"}</td>
                  <td><form action={removeAction}><input type="hidden" name="id" value={r.id} /><button className="btn btn-secondary btn-small" type="submit">Retirar</button></form></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
