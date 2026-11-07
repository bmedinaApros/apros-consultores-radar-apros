import Link from "next/link";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { requirePermissionPage } from "@/lib/current-user";
import { can } from "@/lib/rbac";
import { listCompanies, listIndustries, PAGE_SIZE } from "@/lib/companies/service";
import { CLASSIFICATION_LABELS, STAGE_LABELS } from "@/lib/labels";
import { classifyAction } from "./actions";

export const dynamic = "force-dynamic";

const qsSchema = z.object({
  q: z.string().max(100).optional(),
  industryId: z.string().uuid().optional().catch(undefined),
  classification: z.enum(["classified", "to_classify"]).optional().catch(undefined),
  stage: z.string().max(30).optional(),
  page: z.coerce.number().int().min(1).max(10000).optional().catch(undefined),
  ok: z.string().max(200).optional(),
  error: z.string().max(300).optional(),
});

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("companies.read");
  const f = qsSchema.parse(await searchParams);
  const [{ rows, total }, industries] = await Promise.all([listCompanies(f), listIndustries()]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = f.page ?? 1;
  const canWrite = can(user.role, "companies.write");
  const link = (p: number) => {
    const qs = new URLSearchParams(Object.entries({ ...f, page: String(p), ok: undefined, error: undefined }).filter(([, v]) => v) as [string, string][]);
    return `/companies?${qs}`;
  };
  return (
    <AppShell user={user} current="/companies">
      <div className="row"><h1>Empresas</h1>{canWrite && <Link className="btn btn-primary btn-small" href="/companies/new">Nueva empresa</Link>}</div>
      <Flash ok={f.ok} error={f.error} />
      <form method="get" className="card row" role="search" aria-label="Filtrar empresas">
        <div><label htmlFor="q">Buscar</label><input id="q" name="q" defaultValue={f.q} placeholder="Nombre, dominio o RUC" /></div>
        <div><label htmlFor="industryId">Rubro</label>
          <select id="industryId" name="industryId" defaultValue={f.industryId ?? ""}>
            <option value="">Todos</option>
            {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select></div>
        <div><label htmlFor="classification">Clasificación</label>
          <select id="classification" name="classification" defaultValue={f.classification ?? ""}>
            <option value="">Todas</option><option value="to_classify">Por clasificar</option><option value="classified">Clasificadas</option>
          </select></div>
        <div><label htmlFor="stage">Etapa</label>
          <select id="stage" name="stage" defaultValue={f.stage ?? ""}>
            <option value="">Todas</option>
            {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
        <button className="btn btn-secondary" type="submit">Filtrar</button>
      </form>
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de empresas">
        {rows.length === 0 ? (
          <div className="empty"><h2>No hay empresas con estos filtros</h2><p>Importa un CSV o crea una empresa para empezar.</p></div>
        ) : (
          <table>
            <caption className="muted">{total} empresa{total === 1 ? "" : "s"} · página {page} de {pages}</caption>
            <thead><tr><th scope="col">Empresa</th><th scope="col">Sitio</th><th scope="col">Rubro</th><th scope="col">Ciudad</th><th scope="col">Responsable</th><th scope="col">Estado</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/companies/${c.id}`}>{c.legal_name}</Link></td>
                  <td>{c.domain ?? <span className="muted">Sin sitio</span>}</td>
                  <td>
                    {c.industry_name ?? (canWrite ? (
                      <form action={classifyAction} className="row">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="back" value="/companies" />
                        <label className="muted" htmlFor={`ind-${c.id}`}>Confirmar rubro</label>
                        <select id={`ind-${c.id}`} name="industryId" required defaultValue="">
                          <option value="" disabled>Elegir…</option>
                          {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                        <button className="btn btn-secondary btn-small" type="submit">Guardar</button>
                      </form>
                    ) : <span className="badge badge-warn">{CLASSIFICATION_LABELS.to_classify}</span>)}
                  </td>
                  <td>{c.city ?? "—"}</td>
                  <td>{c.owner_email ?? <span className="muted">Sin asignar</span>}</td>
                  <td>
                    {STAGE_LABELS[c.stage]}
                    {c.blocked && <> <span className="badge badge-off">No contactar</span></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {pages > 1 && (
        <nav className="row" aria-label="Paginación">
          {page > 1 && <Link className="btn btn-secondary btn-small" href={link(page - 1)}>Anterior</Link>}
          {page < pages && <Link className="btn btn-secondary btn-small" href={link(page + 1)}>Siguiente</Link>}
        </nav>
      )}
    </AppShell>
  );
}
