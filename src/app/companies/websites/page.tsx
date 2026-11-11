import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { requirePermissionPage } from "@/lib/current-user";
import { can } from "@/lib/rbac";
import { listAllPendingCandidates, websiteStats } from "@/lib/companies/discover-web";
import { acceptCandidateAction, discoverBatchAction, rejectCandidateAction } from "../actions";

export const dynamic = "force-dynamic";
const nf = new Intl.NumberFormat("es-PE");
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" });
const WHY = { alta: "El RUC de la empresa aparece en la portada", media: "El nombre de la empresa aparece en el título de la página", baja: "Coincidencia débil" } as const;

export default async function WebsitesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("companies.read");
  const q = await searchParams;
  const [{ rows, total }, st] = await Promise.all([listAllPendingCandidates(100, 0), websiteStats()]);
  const canWrite = can(user.role, "companies.write");
  return (
    <AppShell user={user} current="/companies/websites">
      <h1>Sitios por confirmar</h1>
      <p className="muted">Sitios web que Radar encontró para empresas que no tenían uno y que necesitan tu visto bueno. Abre el sitio, comprueba que sea la empresa y confirma o descarta.</p>
      <Flash ok={q.ok} error={q.error} />
      <section className="card" aria-label="Resumen de la búsqueda automática">
        <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, margin: 0 }}>
          <div><dt className="muted">Empresas intentadas</dt><dd style={{ margin: 0, fontSize: 24 }}>{nf.format(st.intentadas)}</dd></div>
          <div><dt className="muted">Con sitio asignado</dt><dd style={{ margin: 0, fontSize: 24 }}>{nf.format(st.asignadas)}</dd></div>
          <div><dt className="muted">Por confirmar</dt><dd style={{ margin: 0, fontSize: 24 }}>{nf.format(st.por_confirmar)}</dd></div>
          <div><dt className="muted">Siguen sin sitio</dt><dd style={{ margin: 0, fontSize: 24 }}>{nf.format(st.sin_sitio)}</dd></div>
          <div><dt className="muted">Con sitio</dt><dd style={{ margin: 0, fontSize: 24 }}>{nf.format(st.con_sitio)}</dd></div>
          <div><dt className="muted">Último intento</dt><dd style={{ margin: 0, fontSize: 24 }}>{st.ultimo_intento ? fmt.format(st.ultimo_intento) : "—"}</dd></div>
        </dl>
        {canWrite && (
          <form action={discoverBatchAction} className="row">
            <button className="btn btn-secondary" type="submit">Buscar sitios web automáticamente (lote de 20)</button>
            <span className="muted">Toma las siguientes 20 empresas sin sitio que no se hayan intentado en los últimos 30 días.</span>
          </form>
        )}
      </section>
      {rows.length === 0 ? (
        <div className="card empty"><h2>No hay sitios por confirmar</h2><p>Cuando la búsqueda automática o Comité IA propongan un sitio que no se pueda asignar solo, aparecerá aquí.</p></div>
      ) : (
        <div className="card table-wrap" tabIndex={0} role="region" aria-label="Tabla desplazable de sitios por confirmar">
          <p className="muted" role="status">{nf.format(total)} por confirmar{total > rows.length ? ` · se muestran las primeras ${rows.length}` : ""}</p>
          <table>
            <thead><tr><th scope="col">Empresa</th><th scope="col">Sitio sugerido</th><th scope="col">Coincidencia</th><th scope="col">Origen</th>{canWrite && <th scope="col">Decisión</th>}</tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/companies/${r.company_id}`}>{r.legal_name}</Link><div className="muted">{r.ruc ?? "sin RUC"}{r.city ? ` · ${r.city}` : ""}</div></td>
                <td><a href={`https://${r.domain}`} target="_blank" rel="noopener noreferrer">{r.domain}</a>{r.evidence.title ? <div className="muted">Título: «{r.evidence.title}»</div> : null}</td>
                <td><strong>{r.confidence}</strong><div className="muted">{WHY[r.confidence]}</div></td>
                <td>{r.source === "ia" ? "Comité IA" : r.source === "grok" ? "Grok (búsqueda web)" : "Búsqueda automática"}</td>
                {canWrite && (
                  <td>
                    <div className="row">
                      <form action={acceptCandidateAction}><input type="hidden" name="id" value={r.company_id} /><input type="hidden" name="candidateId" value={r.id} /><input type="hidden" name="back" value="list" /><button className="btn btn-primary btn-small" type="submit">Confirmar</button></form>
                      <form action={rejectCandidateAction}><input type="hidden" name="id" value={r.company_id} /><input type="hidden" name="candidateId" value={r.id} /><input type="hidden" name="back" value="list" /><button className="btn btn-secondary btn-small" type="submit">No es</button></form>
                    </div>
                  </td>
                )}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
