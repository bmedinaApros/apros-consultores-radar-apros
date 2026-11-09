import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { requirePermissionPage } from "@/lib/current-user";
import { pool } from "@/lib/db";
import { duplicateScore, normalizeName } from "@/lib/companies/normalize";
import { SIMILARITY_THRESHOLD } from "@/lib/companies/dedupe";
import { listIndustries } from "@/lib/companies/service";
import { can } from "@/lib/rbac";
import { getRegistryCompany } from "@/lib/registry/service";
import { linkAction, promoteAction } from "../actions";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "America/Lima" });

export default async function RegistryDetailPage({ params, searchParams }: { params: Promise<{ ruc: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("registry.read");
  const { ruc } = await params;
  const d = await getRegistryCompany(ruc);
  if (!d) notFound();
  const q = await searchParams;
  const { row } = d;
  const [industries, similar] = await Promise.all([
    listIndustries(),
    row.company_id ? Promise.resolve([]) : pool().query<{ id: string; legal_name: string; normalized_name: string; domain: string | null }>(`SELECT id, legal_name, normalized_name, domain FROM companies WHERE ruc IS NULL`)
      .then((r) => r.rows.map((c) => ({ ...c, score: duplicateScore(normalizeName(row.legal_name), c.normalized_name) })).filter((c) => c.score >= SIMILARITY_THRESHOLD)),
  ]);
  const mayPromote = can(user.role, "registry.promote");
  return (
    <AppShell user={user} current="/registry">
      <p><Link href="/registry">← Buscar empresas</Link></p>
      <h1>{row.legal_name}</h1>
      <Flash ok={q.ok} error={q.error} />
      <p>
        {row.dnc && <span className="badge badge-off">No contactar</span>}{" "}
        {row.client && <span className="badge badge-off">Cliente activo</span>}{" "}
        {row.missing_since && <span className="badge badge-info">Ya no aparece en el último padrón</span>}
      </p>
      <section className="card stack" aria-labelledby="datos">
        <h2 id="datos">Datos del padrón</h2>
        <dl>
          <dt>RUC</dt><dd>{row.ruc}</dd>
          <dt>Estado · condición de domicilio</dt><dd>{row.status ?? "—"} · {row.condition ?? "—"}</dd>
          <dt>Domicilio fiscal</dt><dd>{row.address ?? "sin dirección"}{row.ubigeo ? ` · ubigeo ${row.ubigeo}` : ""}{row.department ? ` · ${row.department}` : ""}</dd>
          <dt>Rubro sugerido</dt><dd>{row.suggested_industry_name ?? "Sin sugerencia"} <span className="muted">(por palabras de la razón social; se confirma al promover)</span></dd>
          <dt>Fuente</dt>
          <dd>
            SUNAT, padrón reducido{d.batch?.source_note ? ` · ${d.batch.source_note}` : ""}
            {d.batch ? <span className="muted"> · archivo {d.batch.file_name}{d.batch.finished_at ? `, cargado el ${fmt.format(d.batch.finished_at)}` : ""}, conector {d.batch.connector_version}</span> : null}
          </dd>
        </dl>
      </section>

      <section className="card stack" aria-labelledby="base">
        <h2 id="base">En la base de trabajo</h2>
        {row.company_id ? (
          <p>Ya está en la base. <Link href={`/companies/${row.company_id}`}>Abrir la ficha de la empresa</Link></p>
        ) : mayPromote && !row.dnc && !row.client ? (
          <form action={promoteAction} className="row">
            <input type="hidden" name="ruc" value={row.ruc} /><input type="hidden" name="back" value={`/registry/${row.ruc}`} />
            <label htmlFor="mode">Rubro</label>
            <select id="mode" name="mode" defaultValue="suggested">
              <option value="suggested">El sugerido (si lo hay)</option><option value="none">Ninguno (por clasificar)</option>
              {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <button className="btn btn-primary" type="submit">Promover a la base</button>
          </form>
        ) : <p className="muted">{row.dnc || row.client ? "No se puede promover: está en no contactar o es cliente activo." : "No tienes permiso para promover empresas."}</p>}
        {similar.length > 0 && mayPromote && (
          <div className="note note-warn" role="note">
            <strong>Posible duplicado.</strong> Hay empresas en la base, sin RUC, con un nombre muy parecido. Si es la misma, vincula el RUC en lugar de crear otra:
            <ul>{similar.map((c) => (
              <li key={c.id}>
                <Link href={`/companies/${c.id}`}>{c.legal_name}</Link>{c.domain ? ` (${c.domain})` : ""}
                <form action={linkAction} className="row"><input type="hidden" name="companyId" value={c.id} /><input type="hidden" name="ruc" value={row.ruc} />
                  <button className="btn btn-secondary btn-small" type="submit">Es la misma: vincular este RUC</button></form>
              </li>
            ))}</ul>
          </div>
        )}
      </section>

      <section className="card stack" aria-labelledby="locales">
        <h2 id="locales">Establecimientos anexos ({d.locationCount})</h2>
        {d.locationCount === 0 ? <p className="muted">Sin locales registrados (o aún no se cargó el archivo de locales anexos).</p> : (
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de locales">
            <table><thead><tr><th scope="col">Dirección</th><th scope="col">Departamento</th><th scope="col">Ubigeo</th></tr></thead>
              <tbody>{d.locations.map((l, i) => <tr key={i}><td>{l.address}</td><td>{l.department ?? "—"}</td><td>{l.ubigeo ?? "—"}</td></tr>)}</tbody></table>
            {d.locationCount > d.locations.length && <p className="muted">Se muestran los primeros {d.locations.length}.</p>}
          </div>
        )}
      </section>
    </AppShell>
  );
}
