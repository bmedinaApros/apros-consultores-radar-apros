import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { addDoNotContact, listDoNotContact, removeDoNotContact } from "@/lib/companies/service";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "America/Lima" });
const KIND = { company: "Empresa (RUC o nombre)", domain: "Dominio", email: "Correo" } as const;

async function addAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("dnc.manage");
  const d = z.object({ kind: z.enum(["company", "domain", "email"]), value: z.string().min(1).max(200), reason: z.string().min(1).max(300) }).parse(Object.fromEntries(formData));
  return guarded("/admin/dnc", async () => { await addDoNotContact(toActor(user), d.kind, d.value, d.reason); return "Agregado a la lista de no contactar."; });
}
async function removeAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("dnc.manage");
  const d = z.object({ id: z.string().uuid() }).parse(Object.fromEntries(formData));
  return guarded("/admin/dnc", async () => { await removeDoNotContact(toActor(user), d.id); return "Retirado de la lista."; });
}

export default async function DncPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("dnc.manage");
  const q = await searchParams;
  const rows = await listDoNotContact();
  return (
    <AppShell user={user} current="/admin/dnc">
      <h1>Lista de no contactar</h1>
      <p className="muted">Se aplica en todo el sistema: importación, descubrimiento, alta manual y uso comercial. El motivo es obligatorio y queda en la auditoría.</p>
      <Flash ok={q.ok} error={q.error} />
      <form action={addAction} className="card stack">
        <div><label htmlFor="kind">Tipo</label>
          <select id="kind" name="kind">{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label htmlFor="value">Valor</label><input id="value" name="value" required maxLength={200} placeholder="RUC, nombre, dominio o correo" /></div>
        <div><label htmlFor="reason">Motivo *</label><input id="reason" name="reason" required maxLength={300} /></div>
        <button className="btn btn-primary" type="submit">Agregar</button>
      </form>
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de no contactar">
        {rows.length === 0 ? <p className="empty">La lista está vacía.</p> : (
          <table>
            <caption className="muted">{rows.length} registros</caption>
            <thead><tr><th scope="col">Tipo</th><th scope="col">Valor</th><th scope="col">Motivo</th><th scope="col">Fecha</th><th scope="col">Acción</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}><td>{KIND[r.kind]}</td><td>{r.value}</td><td>{r.reason}</td><td>{fmt.format(r.created_at)}</td>
                  <td><form action={removeAction}><input type="hidden" name="id" value={r.id} /><button className="btn btn-secondary btn-small" type="submit">Retirar</button></form></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
