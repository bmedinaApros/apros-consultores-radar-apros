import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { requirePermissionPage } from "@/lib/current-user";
import { listIndustries } from "@/lib/companies/service";
import { createCompanyAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCompanyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("companies.write");
  const q = await searchParams;
  const industries = await listIndustries();
  return (
    <AppShell user={user} current="/companies">
      <h1>Nueva empresa</h1>
      <Flash error={q.error} />
      <form action={createCompanyAction} className="card stack">
        <div><label htmlFor="legal_name">Razón social *</label><input id="legal_name" name="legal_name" required maxLength={200} defaultValue={q.legal_name} /></div>
        <div><label htmlFor="trade_name">Nombre comercial</label><input id="trade_name" name="trade_name" maxLength={200} defaultValue={q.trade_name} /></div>
        <div><label htmlFor="website">Sitio web</label><input id="website" name="website" placeholder="empresa.pe" defaultValue={q.website} /></div>
        <div><label htmlFor="ruc">RUC</label><input id="ruc" name="ruc" inputMode="numeric" maxLength={14} defaultValue={q.ruc} /></div>
        <div><label htmlFor="industry">Rubro</label>
          <select id="industry" name="industry" defaultValue={q.industry ?? ""}>
            <option value="">Por clasificar</option>
            {industries.map((i) => <option key={i.id} value={i.slug}>{i.name}</option>)}
          </select></div>
        <div><label htmlFor="subindustry">Subrubro</label><input id="subindustry" name="subindustry" maxLength={100} defaultValue={q.subindustry} /></div>
        <div><label htmlFor="city">Ciudad</label><input id="city" name="city" maxLength={100} defaultValue={q.city} /></div>
        {q.confirmar && (
          <div className="alert" role="note">
            <label><input type="checkbox" name="confirm" value="1" required /> Confirmo que es otra empresa y no un duplicado.</label>
          </div>
        )}
        <button className="btn btn-primary" type="submit">Crear empresa</button>
      </form>
    </AppShell>
  );
}
