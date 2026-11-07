import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { guarded, toActor } from "@/lib/actor";
import { requirePermissionPage } from "@/lib/current-user";
import { env } from "@/lib/env";
import { pool } from "@/lib/db";
import { currentSpend, getAiSettings, saveAiSettings } from "@/lib/diagnostics/budget";
import { DEFAULT_GUIDANCE, listTemplates, saveTemplate } from "@/lib/diagnostics/service";
import { listIndustries } from "@/lib/companies/service";

export const dynamic = "force-dynamic";

async function saveSettingsAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const n = (k: string) => z.coerce.number().parse(formData.get(k));
  return guarded("/admin/ai", async () => {
    await saveAiSettings(toActor(user), { enabled: formData.get("enabled") === "on", dailyUsd: n("dailyUsd"), monthlyUsd: n("monthlyUsd"), maxOutputTokens: n("maxOutputTokens") });
    return "Configuración de IA guardada.";
  });
}

async function saveTemplateAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requirePermissionPage("catalog.manage");
  const d = z.object({ industryId: z.string().uuid().or(z.literal("")), guidance: z.string().max(3000) }).parse(Object.fromEntries(formData));
  return guarded("/admin/ai", async () => { await saveTemplate(toActor(user), d.industryId || null, d.guidance); return "Plantilla guardada."; });
}

export default async function AiAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("catalog.manage");
  const q = await searchParams;
  const [s, spend, templates, industries, recent] = await Promise.all([
    getAiSettings(), currentSpend(), listTemplates(), listIndustries(),
    pool().query<{ status: string; n: string }>(`SELECT status, count(*) AS n FROM ai_generations WHERE created_at > now() - interval '30 days' GROUP BY status ORDER BY status`),
  ]);
  const e = env();
  const mode = e.AI_PROVIDER === "anthropic" ? `Anthropic (${e.ANTHROPIC_MODEL})${e.ANTHROPIC_API_KEY ? "" : " — falta ANTHROPIC_API_KEY"}` : e.AI_PROVIDER === "simulated" ? "Simulado (solo demostración, no usa IA real)" : "Desactivada";
  const withTemplate = new Set(templates.map((t) => t.industry_id));
  return (
    <AppShell user={user} current="/admin/ai">
      <h1>IA y presupuesto</h1>
      <p className="muted">La IA solo redacta diagnósticos a partir de lo observado en el sitio público; una persona los revisa antes de descargarlos. Los datos que se envían al proveedor están descritos en <code>docs/AI-DATA.md</code>.</p>
      <Flash ok={q.ok} error={q.error} />
      <div className="grid-2">
        <div className="card"><strong>Modo</strong><p>{mode}</p><p className="muted">Se define con variables de entorno, no desde esta pantalla.</p></div>
        <div className="card"><strong>Gasto estimado</strong><p>Hoy: ${spend.today.toFixed(2)} de ${s.dailyUsd.toFixed(2)} · Mes: ${spend.month.toFixed(2)} de ${s.monthlyUsd.toFixed(2)}</p>
          <p className="muted">Estimación con precios de lista; la factura real del proveedor manda. Últimos 30 días: {recent.rows.map((r) => `${r.status} ${r.n}`).join(" · ") || "sin llamadas"}.</p></div>
      </div>
      <form action={saveSettingsAction} className="card stack">
        <h2>Límites</h2>
        <div><label><input type="checkbox" name="enabled" defaultChecked={s.enabled} /> Permitir generar diagnósticos con IA</label></div>
        <div><label htmlFor="dailyUsd">Tope diario (USD)</label><input id="dailyUsd" name="dailyUsd" type="number" min={0} step="0.01" defaultValue={s.dailyUsd} required /></div>
        <div><label htmlFor="monthlyUsd">Tope mensual (USD)</label><input id="monthlyUsd" name="monthlyUsd" type="number" min={0} step="0.01" defaultValue={s.monthlyUsd} required /></div>
        <div><label htmlFor="maxOutputTokens">Máximo de tokens de salida por diagnóstico</label><input id="maxOutputTokens" name="maxOutputTokens" type="number" min={1000} max={64000} step={500} defaultValue={s.maxOutputTokens} required /></div>
        <p className="muted">Antes de cada llamada se comprueba el peor caso (entrada + máximo de salida); si no cabe en el tope, no se llama.</p>
        <button className="btn btn-primary" type="submit">Guardar</button>
      </form>
      <section aria-labelledby="plantillas" className="stack">
        <h2 id="plantillas">Guía por rubro</h2>
        <p className="muted">Texto breve que orienta el tono y el enfoque del diagnóstico de cada rubro. No puede cambiar las reglas de evidencia ni de lenguaje. Los rubros sin guía propia usan la general.</p>
        {[{ id: "", name: "General (por defecto)", guidance: templates.find((t) => !t.industry_id)?.guidance ?? DEFAULT_GUIDANCE, version: templates.find((t) => !t.industry_id)?.version ?? 1 },
          ...industries.map((i) => ({ id: i.id, name: i.name, guidance: templates.find((t) => t.industry_id === i.id)?.guidance ?? "", version: templates.find((t) => t.industry_id === i.id)?.version ?? 0 }))].map((t) => (
          <form key={t.id || "general"} action={saveTemplateAction} className="card stack">
            <input type="hidden" name="industryId" value={t.id} />
            <label htmlFor={`g-${t.id || "general"}`}>{t.name}{t.id && !withTemplate.has(t.id) ? " — sin guía propia (usa la general)" : ` — versión ${t.version}`}</label>
            <textarea id={`g-${t.id || "general"}`} name="guidance" rows={3} minLength={10} maxLength={3000} defaultValue={t.guidance} placeholder="Escribe una guía para este rubro" required />
            <button className="btn btn-secondary btn-small" type="submit">Guardar guía</button>
          </form>
        ))}
      </section>
    </AppShell>
  );
}
