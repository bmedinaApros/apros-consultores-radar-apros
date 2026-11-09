import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { requirePermissionPage } from "@/lib/current-user";
import { canModifyOwned } from "@/lib/rbac";
import { companySources, getCompany, listIndustries } from "@/lib/companies/service";
import { findDoNotContact } from "@/lib/companies/exclusions";
import { listUsers } from "@/lib/users";
import { CLASSIFICATION_LABELS, STAGE_LABELS } from "@/lib/labels";
import { adjustmentAction, analyzeAction, manualCriteriaAction, recomputeScoreAction, revalidateWebsiteAction, setWebsiteAction, updateCompanyAction } from "../actions";
import { pool } from "@/lib/db";
import { ScorePanel } from "@/components/score-panel";
import { latestAdjustment, latestManual, latestScore, reproduceScore } from "@/lib/scoring/service";
import { MANUAL_CRITERIA } from "@/lib/scoring/model";
import { listOffers, matchServices } from "@/lib/offers/service";
import { buildFacts, type ObservationInput } from "@/lib/scoring/engine";
import { can } from "@/lib/rbac";
import { SignalsPanel } from "@/components/signals-panel";
import { generateOneAction } from "@/app/diagnostics/actions";
import { latestWebValidation } from "@/lib/companies/web";
import { canAnalyze, latestCompletedRunId, listIndustrySignals, listRuns, observationsForRun, signalChanges } from "@/lib/analyzer/service";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" });

export default async function CompanyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("companies.read");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const company = await getCompany(id);
  if (!company) notFound();
  const q = await searchParams;
  const [sources, industries, users, dnc] = await Promise.all([
    companySources(id), listIndustries(), listUsers(), findDoNotContact({ name: company.legal_name, domain: company.domain, ruc: company.ruc }),
  ]);
  const runId = await latestCompletedRunId(id);
  const webCheck = await latestWebValidation(id);
  const diag = (await pool().query<{ id: string }>(`SELECT id FROM diagnostics WHERE company_id = $1`, [id])).rows[0];
  const [runs, rows, changes, indSignals] = await Promise.all([listRuns(id, 5), runId ? observationsForRun(runId) : Promise.resolve([]), signalChanges(id), listIndustrySignals()]);
  const industryNames = Object.fromEntries(indSignals.map((x) => [`industry.${x.slug}`, x.name]));
  const [score, manual, adjustment] = await Promise.all([latestScore(id), latestManual(id), latestAdjustment(id)]);
  const repro = score ? await reproduceScore(score.id).then((x) => x.matches).catch(() => null) : null;
  let services: Awaited<ReturnType<typeof matchServices>> = [];
  if (score) {
    const obs = await pool().query<ObservationInput>(`SELECT id::text AS id, signal_code, status, kind, value, confidence, evidence_url FROM signal_observations WHERE id = ANY($1::bigint[])`, [score.observation_ids]);
    services = matchServices(await listOffers(false), buildFacts({ observations: obs.rows, manual: score.manual_snapshot, company: score.company_snapshot, adjustment: score.adjustment, asOf: new Date(score.as_of).toISOString() }));
  }
  const canManual = canModifyOwned({ id: user.userId, role: user.role }, { ownerId: company.owner_id }, "companies.write");
  const mayAnalyze = canAnalyze({ id: user.userId, role: user.role }, company);
  const editable = canModifyOwned({ id: user.userId, role: user.role }, { ownerId: company.owner_id }, "companies.write");
  const manager = user.role === "admin" || user.role === "sales_lead";
  return (
    <AppShell user={user} current="/companies">
      <p><Link href="/companies">← Empresas</Link></p>
      <h1>{company.legal_name}</h1>
      <Flash ok={q.ok} error={q.error} />
      {dnc && <div className="alert" role="alert"><strong>No contactar.</strong> {dnc.reason}. Esta empresa no puede usarse comercialmente.</div>}
      <div className="row">
        <span className="badge badge-info">{STAGE_LABELS[company.stage]}</span>
        <span className={`badge ${company.classification === "classified" ? "badge-ok" : "badge-warn"}`}>{CLASSIFICATION_LABELS[company.classification]}</span>
      </div>
      <form action={updateCompanyAction} className="card stack">
        <input type="hidden" name="id" value={company.id} />
        <fieldset disabled={!editable} className="stack">
          <legend className="muted">{editable ? "Datos de la empresa" : "Solo lectura: esta empresa pertenece a otra persona o tu rol no puede editarla"}</legend>
          <div><label htmlFor="legal_name">Razón social</label><input id="legal_name" name="legal_name" required defaultValue={company.legal_name} /></div>
          <div><label htmlFor="trade_name">Nombre comercial</label><input id="trade_name" name="trade_name" defaultValue={company.trade_name ?? ""} /></div>
          <div><label htmlFor="website">Sitio web</label><input id="website" name="website" defaultValue={company.domain ?? ""} /></div>
          <div><label htmlFor="ruc">RUC</label><input id="ruc" name="ruc" defaultValue={company.ruc ?? ""} /></div>
          <div><label htmlFor="industryId">Rubro (confirmación humana)</label>
            <select id="industryId" name="industryId" defaultValue={company.industry_id ?? ""}>
              <option value="">Por clasificar</option>
              {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select></div>
          <div><label htmlFor="subindustry">Subrubro</label><input id="subindustry" name="subindustry" defaultValue={company.subindustry ?? ""} /></div>
          <div><label htmlFor="city">Ciudad</label><input id="city" name="city" defaultValue={company.city ?? ""} /></div>
          <div><label htmlFor="ownerId">Responsable</label>
            <select id="ownerId" name="ownerId" defaultValue={company.owner_id ?? ""}>
              <option value="">Sin asignar</option>
              {(manager ? users : users.filter((u) => u.id === user.userId || u.id === company.owner_id)).map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
            </select></div>
          <button className="btn btn-primary" type="submit">Guardar cambios</button>
        </fieldset>
      </form>
      <section aria-labelledby="analisis" className="stack">
        <h2 id="analisis">Análisis web</h2>
        <p className="muted">Solo se leen páginas públicas del sitio de la empresa. Lo que no se puede leer figura como «no se pudo verificar», nunca como un hallazgo negativo.</p>
        {mayAnalyze && company.domain && !dnc && (
          <form action={analyzeAction} className="inline-form">
            <input type="hidden" name="id" value={company.id} />
            <button className="btn btn-primary btn-small" type="submit" name="force" value="0">{runId ? "Reutilizar o actualizar análisis" : "Analizar ahora"}</button>
            {runId && <button className="btn btn-secondary btn-small" type="submit" name="force" value="1">Forzar un análisis nuevo</button>}
          </form>
        )}
        {can(user.role, "diagnostics.write") && runId && !dnc && (
          <form action={generateOneAction} className="inline-form">
            <input type="hidden" name="companyId" value={company.id} />
            <button className="btn btn-secondary btn-small" type="submit">Generar diagnóstico</button>
            {diag && <Link href={`/diagnostics/${diag.id}`}>Ver diagnóstico existente</Link>}
          </form>
        )}
        {!company.domain && <p className="muted">La empresa no tiene sitio web conocido; no se puede analizar hasta asignarle uno.</p>}
        {editable && (
          <form action={setWebsiteAction} className="card stack" aria-labelledby="web-title">
            <h3 id="web-title">{company.domain ? "Corregir el sitio web" : "Agregar el sitio web"}</h3>
            <p className="muted">Escribe la dirección y Radar comprueba que exista, que responda y qué permite su <code>robots.txt</code> antes de guardarla. No se aceptan redes sociales ni correos gratuitos.</p>
            <input type="hidden" name="id" value={company.id} />
            <div className="row">
              <div><label htmlFor="website-new">Sitio web</label><input id="website-new" name="website" defaultValue={company.domain ?? ""} maxLength={300} placeholder="ejemplo.com.pe" required /></div>
              <button className="btn btn-primary" type="submit">Validar y guardar</button>
            </div>
          </form>
        )}
        {webCheck && company.domain && (
          <p className={webCheck.status === "ok" ? "" : "muted"} role="status">
            Última comprobación ({fmt.format(webCheck.checked_at)}{webCheck.checked_by_email ? ` · ${webCheck.checked_by_email}` : ""}):{" "}
            <span className={`badge ${webCheck.status === "ok" ? "badge-ok" : "badge-info"}`}>{webCheck.status === "ok" ? "Sitio verificado" : webCheck.status === "warning" ? "Con avisos" : "No verificado"}</span>{" "}
            {(webCheck.detail.messages ?? []).join(" ")}
          </p>
        )}
        {editable && company.domain && (
          <form action={revalidateWebsiteAction}><input type="hidden" name="id" value={company.id} /><button className="btn btn-secondary btn-small" type="submit">Volver a comprobar el sitio</button></form>
        )}
        {runs.length > 0 && (
          <ul className="muted">
            {runs.map((r) => <li key={r.id}>{fmt.format(r.started_at)} · {({ running: "en curso", completed: "completado", failed: "falló", skipped: "omitido" } as Record<string, string>)[r.status]} · {r.status === "skipped" ? r.skip_reason : r.status === "failed" ? r.error : `${r.pages_fetched} páginas · versión ${r.analyzer_version}`}</li>)}
          </ul>
        )}
        {rows.length > 0 ? <SignalsPanel rows={rows} industryNames={industryNames} changes={changes} /> : <div className="card empty"><p>Aún no hay señales. Lanza un análisis para obtenerlas.</p></div>}
      </section>
      <section aria-labelledby="puntaje" className="stack">
        <h2 id="puntaje">Puntaje</h2>
        {score ? (
          <ScorePanel total={Number(score.total)} band={score.band} computed={Number(score.computed)} breakdown={score.breakdown} modelName={score.model_name} modelVersion={score.model_version}
            computedAt={fmt.format(score.computed_at)} reproducible={repro} services={services} adjustment={score.adjustment} />
        ) : <div className="card empty"><p>Aún no hay puntaje. Se calcula cuando existe un análisis web completado.</p></div>}
        {mayAnalyze && runId && <form action={recomputeScoreAction}><input type="hidden" name="id" value={company.id} /><button className="btn btn-secondary btn-small" type="submit">Recalcular puntaje</button></form>}
        <form action={manualCriteriaAction} className="card stack">
          <input type="hidden" name="id" value={company.id} />
          <fieldset disabled={!canManual} className="stack">
            <legend><strong>Criterios manuales</strong> <span className="muted">(no se pueden observar en la web; los captura una persona)</span></legend>
            {MANUAL_CRITERIA.map((c) => (
              <div key={c.key}><label htmlFor={`m-${c.key}`}>{c.label}</label>
                <select id={`m-${c.key}`} name={c.key} defaultValue={manual[c.key] ?? ""} aria-describedby={`h-${c.key}`}>
                  <option value="">Sin capturar</option>{c.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select><span id={`h-${c.key}`} className="muted"> {c.help}</span></div>
            ))}
            <button className="btn btn-primary btn-small" type="submit">Guardar criterios</button>
          </fieldset>
        </form>
        {can(user.role, "scoring.adjust") && (
          <form action={adjustmentAction} className="card stack">
            <input type="hidden" name="id" value={company.id} />
            <fieldset className="stack"><legend><strong>Ajuste manual del puntaje</strong> <span className="muted">(el motivo es obligatorio y queda en la auditoría; 0 retira el ajuste)</span></legend>
            <div><label htmlFor="delta">Puntos (−50 a 50)</label><input id="delta" name="delta" type="number" min={-50} max={50} step="0.5" required defaultValue={adjustment?.delta ?? 0} /></div>
            <div><label htmlFor="reason">Motivo *</label><input id="reason" name="reason" required maxLength={300} defaultValue={adjustment?.reason ?? ""} /></div>
            <button className="btn btn-primary btn-small" type="submit">Guardar ajuste</button>
            </fieldset>
          </form>
        )}
      </section>
      <section className="card" aria-labelledby="fuentes">
        <h2 id="fuentes">Procedencia de los datos</h2>
        {sources.length === 0 ? <p className="muted">Sin registros.</p> : (
          <ul>{sources.map((s, i) => <li key={i}>{s.source_code} · {fmt.format(s.first_seen_at)} · finalidad: {s.purpose}</li>)}</ul>
        )}
      </section>
    </AppShell>
  );
}
