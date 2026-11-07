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
import { updateCompanyAction } from "../actions";

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
      <section className="card" aria-labelledby="fuentes">
        <h2 id="fuentes">Procedencia de los datos</h2>
        {sources.length === 0 ? <p className="muted">Sin registros.</p> : (
          <ul>{sources.map((s, i) => <li key={i}>{s.source_code} · {fmt.format(s.first_seen_at)} · finalidad: {s.purpose}</li>)}</ul>
        )}
      </section>
    </AppShell>
  );
}
