import Link from "next/link";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { BandBadge } from "@/components/band-badge";
import { requirePermissionPage } from "@/lib/current-user";
import { listIndustries } from "@/lib/companies/service";
import { INBOX_PAGE, listInbox } from "@/lib/weekly/service";
import { COMMON_SIGNALS } from "@/lib/analyzer/observations";
import { listIndustrySignals } from "@/lib/analyzer/service";
import { listUsers } from "@/lib/users";
import { STAGE_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

const qs = z.object({
  owner: z.string().max(40).optional(), industryId: z.string().uuid().optional().catch(undefined), city: z.string().max(80).optional(),
  band: z.enum(["sales", "nurturing"]).optional().catch(undefined), minScore: z.coerce.number().min(0).max(100).optional().catch(undefined),
  signal: z.string().regex(/^[a-z0-9_.-]+$/).max(80).optional().catch(undefined), signalStatus: z.enum(["observed", "not_detected"]).optional().catch(undefined),
  stage: z.string().max(30).optional(), review: z.enum(["pending_review", "approved", "rejected"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10000).optional().catch(undefined),
});

export default async function InboxPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("weekly.read");
  const raw = await searchParams;
  const f = qs.parse(Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== "")));
  const owner = f.owner && (f.owner === "mine" || f.owner === "unassigned" || f.owner === "any" || z.string().uuid().safeParse(f.owner).success) ? f.owner : undefined;
  const [{ rows, total }, industries, users, indSignals] = await Promise.all([
    listInbox({ id: user.userId, role: user.role }, { ...f, owner }), listIndustries(), listUsers(), listIndustrySignals(),
  ]);
  const page = f.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / INBOX_PAGE));
  const link = (p: number) => `/inbox?${new URLSearchParams(Object.entries({ ...raw, page: String(p) }).filter(([, v]) => v) as [string, string][])}`;
  const signals = [...COMMON_SIGNALS.map((s) => ({ code: s.code, name: s.name })), ...indSignals.map((s) => ({ code: `industry.${s.slug}`, name: `${s.industry_name}: ${s.name}` }))];
  return (
    <AppShell user={user} current="/inbox">
      <h1>Bandeja priorizada</h1>
      <p className="muted">Empresas con puntaje, de mayor a menor. Los puntajes de rubros distintos usan modelos distintos y solo son comparables si el modelo es el mismo.</p>
      <form method="get" className="card row" role="search" aria-label="Filtrar la bandeja">
        <div><label htmlFor="owner">Responsable</label>
          <select id="owner" name="owner" defaultValue={owner ?? ""}>
            <option value="">Todos</option><option value="mine">Mías</option><option value="unassigned">Sin asignar</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
          </select></div>
        <div><label htmlFor="industryId">Rubro</label>
          <select id="industryId" name="industryId" defaultValue={f.industryId ?? ""}><option value="">Todos</option>{industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
        <div><label htmlFor="city">Ciudad</label><input id="city" name="city" defaultValue={f.city} /></div>
        <div><label htmlFor="band">Banda</label>
          <select id="band" name="band" defaultValue={f.band ?? ""}><option value="">Todas</option><option value="sales">Pasa a ventas</option><option value="nurturing">Nurturing</option></select></div>
        <div><label htmlFor="minScore">Puntaje mínimo</label><input id="minScore" name="minScore" type="number" min={0} max={100} defaultValue={f.minScore} /></div>
        <div><label htmlFor="signal">Señal</label>
          <select id="signal" name="signal" defaultValue={f.signal ?? ""}><option value="">Cualquiera</option>{signals.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}</select></div>
        <div><label htmlFor="signalStatus">Estado de la señal</label>
          <select id="signalStatus" name="signalStatus" defaultValue={f.signalStatus ?? "observed"}><option value="observed">Observada</option><option value="not_detected">No detectada</option></select></div>
        <div><label htmlFor="stage">Etapa</label>
          <select id="stage" name="stage" defaultValue={f.stage ?? ""}><option value="">Todas</option>{Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label htmlFor="review">Revisión</label>
          <select id="review" name="review" defaultValue={f.review ?? ""}><option value="">Todas</option><option value="pending_review">Pendiente</option><option value="approved">Aprobada</option><option value="rejected">Rechazada</option></select></div>
        <button className="btn btn-secondary" type="submit">Filtrar</button>
      </form>
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de la bandeja">
        {rows.length === 0 ? (
          <div className="empty"><h2>No hay empresas con estos filtros</h2><p>Prueba con otros filtros o espera a la próxima ejecución semanal.</p></div>
        ) : (
          <table>
            <caption className="muted">{total} empresa{total === 1 ? "" : "s"} · página {page} de {pages}</caption>
            <thead><tr><th scope="col">Empresa</th><th scope="col">Puntaje</th><th scope="col">Rubro</th><th scope="col">Ciudad</th><th scope="col">Etapa</th><th scope="col">Responsable</th><th scope="col">Modelo</th><th scope="col">Por qué</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.company_id}>
                <td><Link href={`/companies/${r.company_id}`}>{r.legal_name}</Link><br /><span className="muted">{r.domain ?? "sin sitio"}</span></td>
                <td>{Number(r.total).toFixed(1)} <BandBadge band={r.band} /></td>
                <td>{r.industry_name ?? "por confirmar"}</td><td>{r.city ?? "—"}</td><td>{STAGE_LABELS[r.stage]}</td>
                <td>{r.owner_email ?? <span className="muted">Sin asignar</span>}</td>
                <td>{r.model_name} v{r.model_version}</td>
                <td><details><summary>Ver motivos</summary><ul>{r.reasons.map((x, i) => <li key={i}>{x}</li>)}</ul></details></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {pages > 1 && <nav className="row" aria-label="Paginación">{page > 1 && <Link className="btn btn-secondary btn-small" href={link(page - 1)}>Anterior</Link>}{page < pages && <Link className="btn btn-secondary btn-small" href={link(page + 1)}>Siguiente</Link>}</nav>}
    </AppShell>
  );
}
