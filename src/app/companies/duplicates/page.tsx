import Link from "next/link";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requireUser } from "@/lib/current-user";
import { listPendingDuplicates, resolveDuplicate } from "@/lib/companies/service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function resolveAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requireUser();
  const d = z.object({ id: z.string().uuid(), action: z.enum(["dismiss", "keep_first", "keep_second"]) }).parse(Object.fromEntries(formData));
  return guarded("/companies/duplicates", async () => { await resolveDuplicate(toActor(user), d.id, d.action); return "Duplicado resuelto."; });
}

export default async function DuplicatesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "sales_lead") redirect("/?denegado=1");
  const q = await searchParams;
  const rows = await listPendingDuplicates();
  return (
    <AppShell user={user} current="/companies/duplicates">
      <h1>Posibles duplicados</h1>
      <p className="muted">Empresas con nombre muy parecido. Nada se fusiona sin tu decisión.</p>
      <Flash ok={q.ok} error={q.error} />
      {rows.length === 0 ? <div className="card empty"><h2>No hay duplicados pendientes</h2></div> : rows.map((d) => (
        <div key={d.id} className="card stack">
          <div className="grid-2">
            <div><strong><Link href={`/companies/${d.a_id}`}>{d.a_name}</Link></strong><br /><span className="muted">{d.a_domain ?? "sin sitio"}</span></div>
            <div><strong><Link href={`/companies/${d.b_id}`}>{d.b_name}</Link></strong><br /><span className="muted">{d.b_domain ?? "sin sitio"}</span></div>
          </div>
          <p className="muted">Similitud {Math.round(Number(d.score) * 100)} %</p>
          <form action={resolveAction} className="inline-form">
            <input type="hidden" name="id" value={d.id} />
            <button className="btn btn-primary btn-small" name="action" value="keep_first" type="submit">Conservar la primera y fusionar</button>
            <button className="btn btn-primary btn-small" name="action" value="keep_second" type="submit">Conservar la segunda y fusionar</button>
            <button className="btn btn-secondary btn-small" name="action" value="dismiss" type="submit">Son distintas</button>
          </form>
        </div>
      ))}
    </AppShell>
  );
}
