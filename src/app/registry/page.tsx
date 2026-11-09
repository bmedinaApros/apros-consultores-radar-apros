import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { requirePermissionPage } from "@/lib/current-user";
import { can } from "@/lib/rbac";
import { pool } from "@/lib/db";
import { listIndustries } from "@/lib/companies/service";
import { COUNT_CAP, REGISTRY_PAGE, filtersSchema, registryStats, searchRegistry } from "@/lib/registry/service";
import { parseQuickQuery } from "@/lib/registry/quick";
import { promoteAction } from "./actions";
import { SelectAll } from "./select-all";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "America/Lima" });
const nf = new Intl.NumberFormat("es-PE");

const flag = (v: string | undefined) => (v === "1" || v === "on" ? true : undefined);

export default async function RegistryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("registry.read");
  const q = await searchParams;
  const [depts, industries, stats] = await Promise.all([
    pool().query<{ code: string; department: string }>(`SELECT code, department FROM ubigeo WHERE length(code) = 2 ORDER BY department`),
    listIndustries(), registryStats(),
  ]);
  // Una sola caja: la frase se interpreta (RUC, departamento, palabras del nombre); lo avanzado, si se usa, manda sobre ella.
  const quick = parseQuickQuery(q.s ?? "", depts.rows);
  const parsed = filtersSchema.safeParse({
    q: q.q || quick.q || undefined, status: q.status || undefined, condition: q.condition || undefined, person: q.person || undefined,
    ubigeo: q.ubigeo || q.dept || quick.ubigeo || undefined, industry: q.industry || undefined, notPromoted: flag(q.notPromoted) ?? false,
    includeMissing: flag(q.includeMissing) ?? false, after: q.after || undefined,
  });
  const result = parsed.success ? await searchRegistry(parsed.data) : null;
  const mayPromote = can(user.role, "registry.promote");
  const keep = new URLSearchParams(Object.entries(q).filter(([k, v]) => v && k !== "after" && k !== "ok" && k !== "error") as [string, string][]);
  const back = `/registry${keep.size ? `?${keep}` : ""}`;
  const next = result?.nextAfter ? `/registry?${new URLSearchParams([...keep, ["after", result.nextAfter]])}` : null;
  return (
    <AppShell user={user} current="/registry">
      <h1>Buscar empresas</h1>
      <p className="muted">
        Padrón de SUNAT cargado: {nf.format(stats.companies)} empresas
        {stats.lastBatch?.finished_at ? ` · última carga el ${fmt.format(stats.lastBatch.finished_at)}${stats.lastBatch.source_note ? ` (${stats.lastBatch.source_note})` : ""}` : " · aún no hay una carga completa"}.
        Estar en el padrón no convierte a una empresa en candidata: tú eliges cuáles pasan a la base de trabajo.
      </p>
      <Flash ok={q.ok} error={q.error ?? (parsed.success ? undefined : "Revisa los filtros: alguno no tiene un formato válido.")} />
      <form method="get" className="card stack" role="search" aria-label="Buscar en el padrón">
        <div className="row">
          <div style={{ flex: "1 1 320px" }}>
            <label htmlFor="s">¿Qué empresas buscas?</label>
            <input id="s" name="s" defaultValue={q.s} maxLength={100} style={{ width: "100%" }} autoFocus placeholder="Ej.: inmobiliarias en Lima · clínicas Arequipa · 20100193117" />
          </div>
          <button className="btn btn-primary" type="submit">Buscar</button>
        </div>
        {q.s && quick.understood.length > 0 && <p className="muted" role="status">Lo que entendí: {quick.understood.join(" · ")}. Jurídicas, activas y habidas.</p>}
        <details>
          <summary>Más filtros (opcionales)</summary>
          <div className="row">
            <div><label htmlFor="q">Razón social o RUC (exacto)</label><input id="q" name="q" defaultValue={q.q} maxLength={100} /></div>
            <div><label htmlFor="dept">Departamento</label>
              <select id="dept" name="dept" defaultValue={q.dept ?? ""}><option value="">Todos</option>{depts.rows.map((d) => <option key={d.code} value={d.code}>{d.department}</option>)}</select></div>
            <div><label htmlFor="ubigeo">Ubigeo (2, 4 o 6 dígitos)</label><input id="ubigeo" name="ubigeo" defaultValue={q.ubigeo} inputMode="numeric" pattern="\d{2}(\d{2}(\d{2})?)?" maxLength={6} /></div>
            <div><label htmlFor="industry">Rubro sugerido</label>
              <select id="industry" name="industry" defaultValue={q.industry ?? ""}><option value="">Todos</option><option value="none">Sin sugerencia</option>{industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
            <div><label htmlFor="status">Estado</label><input id="status" name="status" list="estados" defaultValue={q.status} maxLength={40} placeholder="ACTIVO" />
              <datalist id="estados"><option value="ACTIVO" /><option value="SUSPENSION TEMPORAL" /><option value="BAJA DE OFICIO" /><option value="BAJA DEFINITIVA" /></datalist></div>
            <div><label htmlFor="condition">Condición</label><input id="condition" name="condition" list="condiciones" defaultValue={q.condition} maxLength={40} placeholder="HABIDO" />
              <datalist id="condiciones"><option value="HABIDO" /><option value="NO HABIDO" /><option value="NO HALLADO" /></datalist></div>
            <div><label htmlFor="person">Tipo</label>
              <select id="person" name="person" defaultValue={q.person ?? "juridica"}><option value="juridica">Personas jurídicas (RUC 20)</option><option value="natural">Personas naturales</option><option value="all">Todas</option></select></div>
            <div><label><input type="checkbox" name="notPromoted" value="1" defaultChecked={flag(q.notPromoted)} /> Solo las que aún no están en la base</label>
              <label><input type="checkbox" name="includeMissing" value="1" defaultChecked={flag(q.includeMissing)} /> Incluir las que ya no aparecen en el padrón</label></div>
          </div>
        </details>
      </form>

      {result && (result.rows.length === 0 ? (
        <div className="card empty">
          <h2>{stats.companies === 0 ? "Aún no hay padrón cargado" : "No hay empresas con estos filtros"}</h2>
          <p>{stats.companies === 0 ? "Un administrador debe cargar el archivo del padrón en Prospectar → Importaciones del padrón." : "Prueba con menos filtros."}</p>
        </div>
      ) : (
        <form id="promover" action={promoteAction} className="stack">
          <input type="hidden" name="back" value={back} />
          <p className="muted" role="status">
            {result.totalCapped ? `Más de ${nf.format(COUNT_CAP)}` : nf.format(result.total)} coincidencias · {REGISTRY_PAGE} por página, ordenadas por RUC.
          </p>
          <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de empresas del padrón">
            <table>
              <thead><tr>
                {mayPromote && <th scope="col"><span className="sr-only">Seleccionar</span></th>}
                <th scope="col">RUC</th><th scope="col">Razón social</th><th scope="col">Departamento</th><th scope="col">Estado · condición</th>
                <th scope="col">Rubro sugerido</th><th scope="col">En la base</th><th scope="col">Avisos</th><th scope="col">Fuente</th>
              </tr></thead>
              <tbody>{result.rows.map((r) => {
                const blocked = r.dnc || r.client;
                return (
                  <tr key={r.ruc}>
                    {mayPromote && <td><input type="checkbox" name="ruc" value={r.ruc} disabled={Boolean(r.company_id) || blocked} aria-label={`Seleccionar ${r.legal_name}`} /></td>}
                    <td><Link href={`/registry/${r.ruc}`}>{r.ruc}</Link></td>
                    <td>{r.legal_name}<div className="muted">{r.address ?? "sin dirección"}</div></td>
                    <td>{r.department ?? "—"}</td>
                    <td>{r.status ?? "—"} · {r.condition ?? "—"}</td>
                    <td>{r.suggested_industry_name ?? <span className="muted">sin sugerencia</span>}</td>
                    <td>{r.company_id ? <Link href={`/companies/${r.company_id}`}>Ya está</Link> : "No"}</td>
                    <td>
                      {r.dnc && <span className="badge badge-off">No contactar</span>}{" "}
                      {r.client && <span className="badge badge-off">Cliente activo</span>}{" "}
                      {r.missing_since && <span className="badge badge-info">Ya no aparece</span>}
                    </td>
                    <td className="muted">SUNAT{r.source_note ? ` · ${r.source_note}` : r.loaded_at ? ` · cargado ${fmt.format(r.loaded_at)}` : ""}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          {mayPromote && (
            <div className="card row">
              <SelectAll formId="promover" />
              <label htmlFor="mode">Rubro al promover</label>
              <select id="mode" name="mode" defaultValue="suggested">
                <option value="suggested">El sugerido para cada empresa (si lo hay)</option>
                <option value="none">Ninguno (por clasificar)</option>
                {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <button className="btn btn-primary" type="submit">Promover seleccionadas (máx. 200)</button>
              <span className="muted">Las que están en no contactar o son clientes no se pueden promover.</span>
            </div>
          )}
          <nav className="row" aria-label="Paginación">
            {q.after && <Link className="btn btn-secondary btn-small" href={back}>← Primera página</Link>}
            {next && <Link className="btn btn-secondary btn-small" href={next}>Siguiente página →</Link>}
          </nav>
        </form>
      ))}
    </AppShell>
  );
}
