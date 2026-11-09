import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { listIndustries } from "@/lib/companies/service";
import { requirePermissionPage } from "@/lib/current-user";
import { addKeyword, listKeywords, recomputeSuggestions, removeKeyword, seedExampleKeywords } from "@/lib/registry/rubro";

export const dynamic = "force-dynamic";

async function addAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ industryId: z.string().uuid(), keyword: z.string().max(60) }).parse(Object.fromEntries(formData));
  return guarded("/admin/industry-rules", async () => { await addKeyword(toActor(user), d.industryId, d.keyword); return "Palabra agregada."; });
}
async function removeAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const id = z.string().uuid().parse(formData.get("id"));
  return guarded("/admin/industry-rules", async () => { await removeKeyword(toActor(user), id); return "Palabra eliminada."; });
}
async function recomputeAction(): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  return guarded("/admin/industry-rules", async () => {
    const r = await recomputeSuggestions(toActor(user));
    return `Rubros recalculados: ${r.checked.toLocaleString("es-PE")} empresas revisadas, ${r.changed.toLocaleString("es-PE")} con sugerencia nueva o distinta.`;
  });
}
async function seedAction(): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  return guarded("/admin/industry-rules", async () => `Se agregaron ${await seedExampleKeywords(toActor(user))} palabras de ejemplo.`);
}

export default async function IndustryRulesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("catalog.manage");
  const q = await searchParams;
  const [industries, words] = await Promise.all([listIndustries(), listKeywords()]);
  const by = new Map<string, typeof words>();
  for (const w of words) by.set(w.industry_id, [...(by.get(w.industry_id) ?? []), w]);
  return (
    <AppShell user={user} current="/admin/industry-rules">
      <h1>Reglas de rubro</h1>
      <p className="muted">
        El padrón de SUNAT no trae el rubro. Radar lo <strong>sugiere</strong> si la razón social contiene alguna de estas palabras (palabras completas, sin tildes). Gana el rubro con más palabras;
        con empate no se sugiere nada. Es solo una sugerencia: la persona la confirma al promover la empresa. Después de cambiar palabras, pulsa «Recalcular rubros del padrón» para aplicarlas
        a todo lo ya cargado (con cientos de miles de empresas puede tardar un minuto; no hace falta volver a cargar el archivo).
      </p>
      <form action={recomputeAction} className="card row">
        <button className="btn btn-primary" type="submit">Recalcular rubros del padrón</button>
        <span className="muted">Revisa todas las empresas del padrón con las palabras de abajo.</span>
      </form>
      <Flash ok={q.ok} error={q.error} />
      <form action={addAction} className="card row">
        <div><label htmlFor="industryId">Rubro</label><select id="industryId" name="industryId" required>{industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
        <div><label htmlFor="keyword">Palabra o frase corta</label><input id="keyword" name="keyword" maxLength={60} required placeholder="Ej.: clinica" /></div>
        <button className="btn btn-primary" type="submit">Agregar</button>
        <button className="btn btn-secondary" type="submit" formAction={seedAction} formNoValidate>Cargar palabras de ejemplo</button>
      </form>
      {industries.map((i) => (
        <section key={i.id} className="card stack" aria-labelledby={`r-${i.id}`}>
          <h2 id={`r-${i.id}`}>{i.name}</h2>
          {(by.get(i.id) ?? []).length === 0 ? <p className="muted">Sin palabras: no se sugerirá este rubro.</p> : (
            <ul className="row">
              {by.get(i.id)!.map((w) => (
                <li key={w.id} className="row">
                  <span className="badge badge-info">{w.keyword}</span>
                  <form action={removeAction}><input type="hidden" name="id" value={w.id} /><button className="btn btn-secondary btn-small" type="submit" aria-label={`Quitar «${w.keyword}» de ${i.name}`}>Quitar</button></form>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </AppShell>
  );
}
