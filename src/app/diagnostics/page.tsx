import Link from "next/link";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { requirePermissionPage } from "@/lib/current-user";
import { listDiagnostics } from "@/lib/diagnostics/service";
import { STATUS_LABEL } from "@/lib/diagnostics/schema";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" });
const STATUS_CLASS = { draft: "badge-info", in_review: "badge-warn", approved: "badge-ok", rejected: "badge-info" } as const;

export default async function DiagnosticsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("companies.read");
  const q = await searchParams;
  const status = z.enum(["draft", "in_review", "approved", "rejected"]).optional().catch(undefined).parse(q.status);
  const rows = await listDiagnostics({ id: user.userId, role: user.role }, { status });
  return (
    <AppShell user={user} current="/diagnostics">
      <h1>Diagnósticos</h1>
      <p className="muted">Cada diagnóstico se genera con IA a partir de lo observado en el sitio público, lo revisa una persona y solo entonces se puede descargar. {user.role === "salesperson" ? "Aquí ves los aprobados de tus empresas." : ""}</p>
      <nav className="row" aria-label="Filtrar por estado">
        <Link className="btn btn-secondary btn-small" href="/diagnostics">Todos</Link>
        {(Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).map((k) => <Link key={k} className="btn btn-secondary btn-small" href={`/diagnostics?status=${k}`}>{STATUS_LABEL[k]}</Link>)}
      </nav>
      {rows.length === 0 ? (
        <div className="card empty"><h2>Aún no hay diagnósticos</h2><p>Se generan desde la ficha de una empresa o desde una lista semanal con empresas aprobadas.</p></div>
      ) : (
        <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de diagnósticos">
          <table>
            <thead><tr><th scope="col">Empresa</th><th scope="col">Estado</th><th scope="col">Versión</th><th scope="col">Marcas por resolver</th><th scope="col">Origen</th><th scope="col">Actualizado</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/diagnostics/${r.id}`}>{r.company_name}</Link><div className="muted">{r.company_domain}</div></td>
                <td><span className={`badge ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span>{r.stale && <span className="badge badge-warn"> Desactualizado</span>}</td>
                <td>v{r.version}</td><td>{r.blocking_flags}</td>
                <td>{r.source === "simulated" ? "Simulado (demostración)" : r.source === "human_edit" ? "Editado por una persona" : "IA"}</td>
                <td>{fmt.format(r.updated_at)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
