import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { BandBadge } from "@/components/band-badge";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { pool } from "@/lib/db";
import { can } from "@/lib/rbac";
import { MANUAL_CRITERIA } from "@/lib/scoring/model";
import { getList, listItems, listWeeklyLists, reviewCounts, reviewItem } from "@/lib/weekly/service";
import { generateBatchAction } from "@/app/diagnostics/actions";
import { listIndustrySignals, signalName } from "@/lib/analyzer/service";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "America/Lima" });
const REVIEW = { pending_review: "Pendiente de revisión", approved: "Aprobada", rejected: "Rechazada" } as const;

async function reviewAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("weekly.review");
  const d = z.object({
    listId: z.string().uuid(), itemId: z.string().uuid(), decision: z.enum(["approved", "rejected", "pending_review"]),
    note: z.string().max(400).default(""), assignedTo: z.string().uuid().or(z.literal("")).default(""),
  }).parse(Object.fromEntries(formData));
  return guarded(`/weekly/${d.listId}`, async () => {
    await reviewItem(toActor(user), d.itemId, { decision: d.decision, note: d.note, assignedTo: d.assignedTo || null });
    return d.decision === "approved" ? "Empresa aprobada para ventas." : d.decision === "rejected" ? "Empresa rechazada." : "Devuelta a pendiente.";
  });
}

export default async function WeeklyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("weekly.read");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const list = await getList(id);
  if (!list) notFound();
  const q = await searchParams;
  const review = z.enum(["pending_review", "approved", "rejected"]).optional().catch(undefined).parse(q.review);
  const [items, counts, sellers, all] = await Promise.all([
    listItems({ id: user.userId, role: user.role }, id, { review }), reviewCounts(id),
    pool().query<{ id: string; email: string }>(`SELECT id, email FROM users WHERE active AND role IN ('salesperson', 'sales_lead') ORDER BY email`),
    listWeeklyLists(12),
  ]);
  const reviewer = can(user.role, "weekly.review");
  const modelsDiffer = list.model_versions.length > 1;
  const industryNames = Object.fromEntries((await listIndustrySignals()).map((x) => [`industry.${x.slug}`, x.name]));
  return (
    <AppShell user={user} current="/weekly">
      <p><Link href="/weekly?all=1">← Todas las listas</Link></p>
      <h1>Lista semanal · semana del {fmt.format(new Date(`${list.week_start}T12:00:00Z`))}</h1>
      <Flash ok={q.ok} error={q.error} />
      {list.partial && (
        <div className="note note-warn" role="note">
          <strong>Cobertura parcial.</strong> {list.budget.partialReasons.join(". ")}. Lo ya analizado se conservó y la siguiente ejecución continúa con lo pendiente.
        </div>
      )}
      <div className="grid-2">
        <div className="card"><div className="stat">{list.total_items}</div>empresas en la lista</div>
        <div className="card"><div className="stat">{list.coverage.analyzedPct}%</div>de las empresas con sitio fueron analizadas ({list.coverage.analyzed} de {list.coverage.companiesWithSite})</div>
        <div className="card"><div className="stat">{list.coverage.unverifiablePct}%</div>de las señales no se pudieron verificar</div>
        <div className="card"><div className="stat">{(counts.pending_review ?? 0)}</div>pendientes de revisión · {counts.approved ?? 0} aprobadas · {counts.rejected ?? 0} rechazadas</div>
      </div>
      {modelsDiffer && (
        <div className="note" role="note">
          <strong>Los puntajes de rubros distintos usan modelos distintos</strong> ({list.model_versions.map((m) => `${m.name} v${m.version}`).join(", ")}). Solo son comparables directamente los puntajes que usan el mismo modelo.
        </div>
      )}
      <p className="muted">Los servicios sugeridos son <strong>hipótesis de encaje a validar</strong>, no hechos. Las señales «no detectadas» solo significan que no aparecieron en el HTML del sitio.</p>
      {can(user.role, "diagnostics.write") && (counts.approved ?? 0) > 0 && (
        <form action={generateBatchAction} className="row">
          <input type="hidden" name="listId" value={id} />
          <button className="btn btn-secondary btn-small" type="submit">Generar diagnósticos de las aprobadas (máx. 30)</button>
          <span className="muted">Solo empresas aprobadas que aún no tienen diagnóstico.</span>
        </form>
      )}
      <nav className="row" aria-label="Filtrar por revisión">
        <Link className="btn btn-secondary btn-small" href={`/weekly/${id}`}>Todas</Link>
        {(Object.keys(REVIEW) as (keyof typeof REVIEW)[]).map((k) => <Link key={k} className="btn btn-secondary btn-small" href={`/weekly/${id}?review=${k}`}>{REVIEW[k]}</Link>)}
      </nav>
      {items.length === 0 ? (
        <div className="card empty"><h2>No hay empresas con este filtro</h2></div>
      ) : items.map((it) => (
        <article key={it.id} className="card stack" aria-labelledby={`it-${it.id}`}>
          <div className="row">
            <strong id={`it-${it.id}`}>#{it.rank} · {it.company_id ? <Link href={`/companies/${it.company_id}`}>{it.company_name}</Link> : it.company_name}</strong>
            <BandBadge band={it.band} />
            <span className="badge badge-info">{Number(it.score).toFixed(1)} pts</span>
            <span className="muted">{it.company_domain ?? "sin sitio"} · {it.industry_name ?? "rubro por confirmar"}{it.city ? ` · ${it.city}` : ""}</span>
          </div>
          <p className="muted">Modelo: {it.model_name} v{it.model_version} · cobertura de datos {Math.round(Number(it.data_coverage) * 100)} % · {REVIEW[it.review_status]}{it.assigned_email ? ` · asignada a ${it.assigned_email}` : ""}</p>
          {it.flags.reappearsDueToChange && <p className="badge badge-info" role="note">Reaparece por cambios: {it.flags.reappearsDueToChange.map((c) => signalName(c, industryNames)).join(", ")}</p>}
          {it.flags.industryToConfirm && <p className="badge badge-warn" role="note">El rubro está por confirmar</p>}
          {it.flags.missingManual && it.flags.missingManual.length > 0 && <p className="muted">Faltan criterios manuales (no se infieren de la web): {it.flags.missingManual.map((k) => MANUAL_CRITERIA.find((c) => c.key === k)?.label ?? k).join(", ")}.</p>}
          <details>
            <summary>Por qué está en la lista</summary>
            <ul>{it.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </details>
          {it.services.length > 0 && (
            <details>
              <summary>Servicios sugeridos (hipótesis a validar)</summary>
              <ul>{it.services.map((s) => <li key={s.slug}><strong>{s.name}</strong><ul>{s.reasons.map((r, i) => <li key={i}>{r.rationale}</li>)}</ul></li>)}</ul>
            </details>
          )}
          {reviewer && (
            <form action={reviewAction} className="row">
              <input type="hidden" name="listId" value={id} /><input type="hidden" name="itemId" value={it.id} />
              <label htmlFor={`as-${it.id}`}>Asignar a</label>
              <select id={`as-${it.id}`} name="assignedTo" defaultValue={it.assigned_to ?? ""}>
                <option value="">Sin asignar</option>
                {sellers.rows.map((s) => <option key={s.id} value={s.id}>{s.email}</option>)}
              </select>
              <label htmlFor={`n-${it.id}`}>Nota</label>
              <input id={`n-${it.id}`} name="note" maxLength={400} defaultValue={it.review_note ?? ""} placeholder="Obligatoria al rechazar" />
              <button className="btn btn-primary btn-small" type="submit" name="decision" value="approved">Aprobar</button>
              <button className="btn btn-secondary btn-small" type="submit" name="decision" value="rejected">Rechazar</button>
              {it.review_status !== "pending_review" && <button className="btn btn-secondary btn-small" type="submit" name="decision" value="pending_review">Devolver a pendiente</button>}
            </form>
          )}
          {!reviewer && it.review_note && <p className="muted">Nota de revisión: {it.review_note}</p>}
        </article>
      ))}
      <p className="muted">{all.length > 1 ? `Hay ${all.length} listas guardadas; cada una es un registro que no se modifica.` : ""} Excluidas en esta ejecución: {Object.entries(list.excluded).map(([k, v]) => `${k} (${v})`).join(", ") || "ninguna"}.</p>
    </AppShell>
  );
}
