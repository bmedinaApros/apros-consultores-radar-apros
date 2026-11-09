import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { can } from "@/lib/rbac";
import { COMMON_SIGNALS } from "@/lib/analyzer/observations";
import { COMMERCIAL_LABELS, COMMERCIAL_MODELS, KIND_LABELS, LIMITS, STATUS_LABEL, type DiagnosticContent } from "@/lib/diagnostics/schema";
import { approveDiagnostic, editDiagnostic, getDiagnosticDetail, rejectDiagnostic, submitForReview } from "@/lib/diagnostics/service";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" });
const EVENT_LABEL: Record<string, string> = { created: "Creado", generated: "Generado", edited: "Editado", submitted: "Enviado a revisión", approved: "Aprobado", rejected: "Rechazado", exported_pdf: "PDF descargado", exported_pptx: "PPTX descargado" };

const idSchema = z.string().uuid();

async function transition(formData: FormData): Promise<void> {
  "use server";
  const d = z.object({ id: idSchema, op: z.enum(["submit", "approve", "reject"]), reason: z.string().max(300).default("") }).parse(Object.fromEntries(formData));
  const user = await requirePermissionPage(d.op === "submit" ? "diagnostics.write" : "diagnostics.approve");
  return guarded(`/diagnostics/${d.id}`, async () => {
    if (d.op === "submit") { await submitForReview(toActor(user), d.id); return "Enviado a revisión."; }
    if (d.op === "approve") { await approveDiagnostic(toActor(user), d.id); return "Diagnóstico aprobado."; }
    await rejectDiagnostic(toActor(user), d.id, d.reason); return "Diagnóstico rechazado.";
  });
}

async function edit(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("diagnostics.write");
  const id = idSchema.parse(formData.get("id"));
  const s = (k: string) => String(formData.get(k) ?? "");
  const n = Number(s("count"));
  const opportunities = Array.from({ length: Math.min(Math.max(n, 0), 3) }, (_, i) => {
    const p = `o${i}_`;
    return {
      id: `o${i + 1}`, title: s(`${p}title`), kind: s(`${p}kind`), observation: s(`${p}observation`), opportunity: s(`${p}opportunity`), impact: s(`${p}impact`),
      solution: s(`${p}solution`), deliverable: s(`${p}deliverable`), commercialModel: s(`${p}commercialModel`), kpi: s(`${p}kpi`), priority: s(`${p}priority`),
      evidence: s(`${p}evidence`).split(/[,\s]+/).filter(Boolean), serviceSlug: s(`${p}serviceSlug`) || null,
    };
  });
  const content = { headline: s("headline"), summary: s("summary"), opportunities, nextStep: s("nextStep"), caveats: s("caveats").split("\n").map((x) => x.trim()).filter(Boolean) };
  return guarded(`/diagnostics/${id}`, async () => {
    const r = await editDiagnostic(toActor(user), id, content, s("note"));
    return r.blocking > 0 ? `Versión ${r.version} guardada, con ${r.blocking} marcas por resolver.` : `Versión ${r.version} guardada.`;
  });
}

export default async function DiagnosticPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("companies.read");
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const q = await searchParams;
  const d = await getDiagnosticDetail({ id: user.userId, role: user.role }, id);
  if (!d) notFound();
  const { diagnostic: g, version: v } = d;
  const c = v.content as DiagnosticContent;
  const writer = can(user.role, "diagnostics.write");
  const approver = can(user.role, "diagnostics.approve");
  const exporter = can(user.role, "diagnostics.export") && g.status === "approved" && g.approved_version_id === g.current_version_id && !g.stale && v.blocking_flags === 0;
  const signalName = (code: string) => COMMON_SIGNALS.find((s) => s.code === code)?.name ?? code;
  const flagsFor = (oid: string) => v.flags.filter((f) => f.opportunityId === oid);
  return (
    <AppShell user={user} current="/diagnostics">
      <p><Link href="/diagnostics">← Diagnósticos</Link> · <Link href={`/companies/${g.company_id}`}>Ficha de la empresa</Link></p>
      <h1>{g.company_name}</h1>
      <p className="muted">{g.company_domain} · {g.industry_name ?? "rubro por confirmar"} · versión {v.version} · {v.source === "rules" ? "generado con plantillas y reglas (sin IA)" : v.source === "simulated" ? "texto de demostración (versión antigua)" : v.source === "human_edit" ? "editado por una persona" : "generado con IA"}</p>
      <Flash ok={q.ok} error={q.error} />
      <p><span className="badge badge-info">{STATUS_LABEL[g.status]}</span>{g.stale && <span className="badge badge-warn"> Desactualizado: {g.stale_reason}</span>}</p>
      {v.source === "simulated" && <div className="note note-warn" role="note"><strong>Texto de demostración (versión antigua).</strong> No lo generó un modelo de IA; regenéralo con plantillas y reglas.</div>}
      {v.source === "rules" && <div className="note" role="note">Generado con plantillas y reglas a partir de las señales observadas; no usa IA ni envía datos a terceros. Una persona debe revisarlo antes de descargarlo.</div>}
      {g.stale && <div className="note note-warn" role="note">La evidencia citada cambió desde que se generó el texto. Regenera el diagnóstico con el análisis más reciente antes de aprobarlo o descargarlo.</div>}
      {v.blocking_flags > 0 && <div className="note note-warn" role="alert"><strong>{v.blocking_flags} afirmaciones marcadas.</strong> Corrígelas (ver detalle abajo) para poder enviar a revisión y aprobar.</div>}

      <section aria-labelledby="texto" className="card stack">
        <h2 id="texto">{c.headline}</h2>
        <p>{c.summary}</p>
        {c.opportunities.map((o) => (
          <article key={o.id} className="stack" aria-labelledby={`op-${o.id}`}>
            <h3 id={`op-${o.id}`}>{o.title} <span className="badge badge-info">{KIND_LABELS[o.kind]}</span> <span className="badge badge-info">Prioridad {o.priority}</span></h3>
            <dl>
              <dt>Observación</dt><dd>{o.observation}</dd>
              <dt>Oportunidad</dt><dd>{o.opportunity}</dd>
              <dt>Impacto</dt><dd>{o.impact}</dd>
              <dt>Propuesta</dt><dd>{o.solution}</dd>
              <dt>Entregable · modelo · KPI</dt><dd>{o.deliverable} · {COMMERCIAL_LABELS[o.commercialModel]} · {o.kpi}</dd>
            </dl>
            <div className="muted">
              <strong>Evidencia a la vista:</strong>
              {o.evidence.length === 0 ? " ninguna citada" : (
                <ul>{o.evidence.map((eid) => {
                  const e = d.evidence.get(eid);
                  return <li key={eid}>{e ? <>{signalName(e.signal_code)} — {e.status === "observed" ? "detectado" : "no detectado en el HTML"}{e.evidence_excerpt ? <> · «{e.evidence_excerpt.slice(0, 160)}»</> : null}{e.evidence_url ? <> · {e.evidence_url}</> : null}</> : `Observación ${eid} (no encontrada)`}</li>;
                })}</ul>
              )}
            </div>
            {flagsFor(o.id).map((f, i) => <p key={i} className={f.blocking ? "alert" : "note"} role={f.blocking ? "alert" : "note"}>{f.blocking ? "Por resolver" : "Aviso"} ({f.field}): {f.message}</p>)}
          </article>
        ))}
        <p><strong>Siguiente paso:</strong> {c.nextStep}</p>
        {c.caveats.length > 0 && <ul className="muted">{c.caveats.map((x, i) => <li key={i}>{x}</li>)}</ul>}
        {flagsFor("global").map((f, i) => <p key={i} className={f.blocking ? "alert" : "note"} role={f.blocking ? "alert" : "note"}>{f.blocking ? "Por resolver" : "Aviso"} ({f.field}): {f.message}</p>)}
      </section>

      <section aria-labelledby="acciones" className="card stack">
        <h2 id="acciones">Revisión y descarga</h2>
        <div className="row">
          {writer && g.status === "draft" && <form action={transition}><input type="hidden" name="id" value={g.id} /><button className="btn btn-primary" name="op" value="submit" type="submit">Enviar a revisión</button></form>}
          {approver && g.status === "in_review" && <form action={transition}><input type="hidden" name="id" value={g.id} /><button className="btn btn-primary" name="op" value="approve" type="submit">Aprobar</button></form>}
          {exporter && <><a className="btn btn-secondary" href={`/api/diagnostics/${g.id}/export?format=pdf`}>Descargar PDF (1 página)</a><a className="btn btn-secondary" href={`/api/diagnostics/${g.id}/export?format=pptx`}>Descargar PPTX</a></>}
        </div>
        {approver && g.status === "in_review" && (
          <form action={transition} className="row"><input type="hidden" name="id" value={g.id} /><input type="hidden" name="op" value="reject" />
            <label htmlFor="reason">Motivo del rechazo</label><input id="reason" name="reason" maxLength={300} required />
            <button className="btn btn-secondary" type="submit">Rechazar</button></form>
        )}
        {g.status === "approved" && <p className="muted">Aprobado por {g.approved_by_email ?? "—"} el {g.approved_at ? fmt.format(g.approved_at) : "—"}. Editar el texto retira la aprobación.</p>}
        {!exporter && g.status === "approved" && <p className="muted">La descarga está bloqueada mientras haya marcas por resolver, el texto esté desactualizado o la versión aprobada no sea la vigente.</p>}
      </section>

      {writer && (
        <details className="card">
          <summary>Editar el texto (crea una versión nueva y se vuelve a validar)</summary>
          <form action={edit} className="stack">
            <input type="hidden" name="id" value={g.id} /><input type="hidden" name="count" value={c.opportunities.length} />
            <div><label htmlFor="headline">Titular</label><input id="headline" name="headline" defaultValue={c.headline} maxLength={LIMITS.headline} required /></div>
            <div><label htmlFor="summary">Resumen</label><textarea id="summary" name="summary" defaultValue={c.summary} maxLength={LIMITS.summary} rows={3} required /></div>
            {c.opportunities.map((o, i) => (
              <fieldset key={o.id} className="stack"><legend>Oportunidad {i + 1}</legend>
                {(["title", "observation", "opportunity", "impact", "solution", "deliverable", "kpi"] as const).map((f) => (
                  <div key={f}><label htmlFor={`o${i}_${f}`}>{{ title: "Título", observation: "Observación", opportunity: "Oportunidad", impact: "Impacto", solution: "Propuesta", deliverable: "Entregable", kpi: "KPI" }[f]}</label>
                    <textarea id={`o${i}_${f}`} name={`o${i}_${f}`} defaultValue={o[f]} maxLength={LIMITS[f]} rows={f === "title" || f === "kpi" || f === "deliverable" ? 1 : 2} required /></div>
                ))}
                <div className="row">
                  <label htmlFor={`o${i}_kind`}>Tipo de afirmación</label>
                  <select id={`o${i}_kind`} name={`o${i}_kind`} defaultValue={o.kind}>{Object.entries(KIND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                  <label htmlFor={`o${i}_priority`}>Prioridad</label>
                  <select id={`o${i}_priority`} name={`o${i}_priority`} defaultValue={o.priority}>{["alta", "media", "baja"].map((k) => <option key={k} value={k}>{k}</option>)}</select>
                  <label htmlFor={`o${i}_commercialModel`}>Modelo comercial</label>
                  <select id={`o${i}_commercialModel`} name={`o${i}_commercialModel`} defaultValue={o.commercialModel}>{COMMERCIAL_MODELS.map((k) => <option key={k} value={k}>{COMMERCIAL_LABELS[k]}</option>)}</select>
                </div>
                <div><label htmlFor={`o${i}_evidence`}>Identificadores de evidencia (separados por coma)</label><input id={`o${i}_evidence`} name={`o${i}_evidence`} defaultValue={o.evidence.join(", ")} /></div>
                <input type="hidden" name={`o${i}_serviceSlug`} value={o.serviceSlug ?? ""} />
              </fieldset>
            ))}
            <div><label htmlFor="nextStep">Siguiente paso</label><textarea id="nextStep" name="nextStep" defaultValue={c.nextStep} maxLength={LIMITS.nextStep} rows={2} required /></div>
            <div><label htmlFor="caveats">Salvedades (una por línea)</label><textarea id="caveats" name="caveats" defaultValue={c.caveats.join("\n")} rows={3} /></div>
            <div><label htmlFor="note">Nota del cambio (opcional)</label><input id="note" name="note" maxLength={300} /></div>
            <button className="btn btn-primary" type="submit">Guardar nueva versión</button>
          </form>
        </details>
      )}

      <section aria-labelledby="hist" className="card stack">
        <h2 id="hist">Historial</h2>
        <ul>{d.events.map((e) => <li key={e.id}>{fmt.format(e.at)} · {EVENT_LABEL[e.action] ?? e.action}{e.version ? ` (v${e.version})` : ""}{e.actor_email ? ` · ${e.actor_email}` : ""}{e.note ? ` · ${e.note}` : ""}</li>)}</ul>
        {d.generations.length > 0 && (
          <details><summary>Llamadas a la IA de esta empresa</summary>
            <ul>{d.generations.map((x) => <li key={x.id}>{fmt.format(x.created_at)} · {x.provider}/{x.model} · {x.prompt_version} · {x.status} · {x.input_tokens}+{x.output_tokens} tokens · ${Number(x.estimated_cost_usd).toFixed(4)}{x.error ? ` · ${x.error}` : ""}</li>)}</ul>
          </details>
        )}
      </section>
    </AppShell>
  );
}
