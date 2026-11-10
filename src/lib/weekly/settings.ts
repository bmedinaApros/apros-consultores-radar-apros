import { z } from "zod";
import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import { CompanyError, type ActorInfo } from "../companies/service";
import { requirePermission } from "../rbac";

export const weeklySettingsSchema = z.object({
  listSize: z.number().int().min(1).max(200),
  /** Puntaje mínimo para entrar en la lista (por defecto, el umbral de nurturing). */
  minScore: z.number().min(0).max(100),
  /** Fracción mínima de señales verificables para que una empresa entre en la lista. */
  minCoverage: z.number().min(0).max(1),
  /** Máximo de empresas que se analizan (sitios que se visitan) por ejecución. */
  analysisBudget: z.number().int().min(0).max(1000),
  /** Un análisis más viejo que esto se considera vencido y se vuelve a hacer. */
  reanalyzeAfterDays: z.number().int().min(1).max(365),
  /** Máximo de consultas a PageSpeed por ejecución (0 = sin PageSpeed). */
  pagespeedBudget: z.number().int().min(0).max(500),
  scheduleEnabled: z.boolean(),
  /** Expresión cron en hora de Lima. Por defecto, lunes 08:30. */
  cron: z.string().regex(/^[\d*/,\- ]{5,40}$/),
  /** Cuántas semanas se evita repetir una empresa, salvo que cambie una señal relevante. 0 = nunca repetir. */
  noveltyWeeks: z.number().int().min(0).max(520),
});

export type WeeklySettings = z.infer<typeof weeklySettingsSchema>;

export const DEFAULT_WEEKLY: WeeklySettings = {
  listSize: 50, minScore: 50, minCoverage: 0.4, analysisBudget: 60, reanalyzeAfterDays: 30, pagespeedBudget: 0,
  scheduleEnabled: true, cron: "30 8 * * 1", noveltyWeeks: 0,
};

export async function getWeeklySettings(): Promise<WeeklySettings> {
  const r = await pool().query<{ value: unknown }>(`SELECT value FROM app_settings WHERE key = 'weekly'`);
  const parsed = weeklySettingsSchema.safeParse({ ...DEFAULT_WEEKLY, ...(r.rows[0]?.value as object | undefined) });
  return parsed.success ? parsed.data : DEFAULT_WEEKLY;
}

export async function saveWeeklySettings(actor: ActorInfo, input: unknown): Promise<WeeklySettings> {
  requirePermission(actor, "catalog.manage");
  const parsed = weeklySettingsSchema.safeParse(input);
  if (!parsed.success) throw new CompanyError(`Configuración inválida: ${parsed.error.issues.slice(0, 2).map((i) => i.path.join(".")).join(", ")}`);
  await withTransaction(async (c) => {
    await c.query(`INSERT INTO app_settings (key, value, updated_by, updated_at) VALUES ('weekly', $1::jsonb, $2, now())
                   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`, [JSON.stringify(parsed.data), actor.id]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "settings.weekly_changed", entityType: "app_settings", entityId: "weekly", metadata: { ...parsed.data } }, c);
  });
  return parsed.data;
}

/** Lunes de la semana (hora de Lima) en formato YYYY-MM-DD. */
export function weekStartLima(d: Date = new Date()): string {
  const lima = new Date(d.getTime() - 5 * 3600_000); // Lima es UTC−5 todo el año
  const dow = (lima.getUTCDay() + 6) % 7; // lunes = 0
  lima.setUTCDate(lima.getUTCDate() - dow);
  return lima.toISOString().slice(0, 10);
}
