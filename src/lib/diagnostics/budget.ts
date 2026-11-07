import { z } from "zod";
import { audit } from "../audit";
import { pool, withTransaction } from "../db";
import { CompanyError, type ActorInfo } from "../companies/service";
import { requirePermission } from "../rbac";

/** Precios en USD por millón de tokens (Anthropic, API directa). Se pueden corregir sin tocar código en Configuración de IA. */
export interface Price { input: number; output: number; cacheRead: number }
export const DEFAULT_PRICES: Record<string, Price> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
  "claude-fable-5-1": { input: 10, output: 50, cacheRead: 1 },
  simulado: { input: 0, output: 0, cacheRead: 0 },
};
/** Si el modelo no está en la tabla se usa el precio más alto conocido: nunca se subestima el gasto. */
const FALLBACK_PRICE: Price = { input: 10, output: 50, cacheRead: 1 };

export const priceFor = (model: string, overrides?: Record<string, Price>): { price: Price; known: boolean } => {
  const p = overrides?.[model] ?? DEFAULT_PRICES[model];
  return p ? { price: p, known: true } : { price: FALLBACK_PRICE, known: false };
};

export function estimateCost(model: string, u: { inputTokens: number; outputTokens: number; cacheReadTokens: number }, overrides?: Record<string, Price>): number {
  const { price } = priceFor(model, overrides);
  const fresh = Math.max(0, u.inputTokens);
  return Math.round(((fresh * price.input + u.outputTokens * price.output + u.cacheReadTokens * price.cacheRead) / 1_000_000) * 1_000_000) / 1_000_000;
}

/** Peor caso de una generación antes de hacerla: entrada estimada + todos los tokens de salida permitidos. */
export const worstCaseCost = (model: string, promptChars: number, maxTokens: number, overrides?: Record<string, Price>): number =>
  estimateCost(model, { inputTokens: Math.ceil(promptChars / 3), outputTokens: maxTokens, cacheReadTokens: 0 }, overrides);

export const aiSettingsSchema = z.object({
  enabled: z.boolean(),
  dailyUsd: z.number().min(0).max(100_000),
  monthlyUsd: z.number().min(0).max(1_000_000),
  maxOutputTokens: z.number().int().min(1000).max(64_000),
});
export type AiSettings = z.infer<typeof aiSettingsSchema>;
export const DEFAULT_AI: AiSettings = { enabled: true, dailyUsd: 5, monthlyUsd: 50, maxOutputTokens: 16_000 };

export async function getAiSettings(): Promise<AiSettings> {
  const r = await pool().query<{ value: unknown }>(`SELECT value FROM app_settings WHERE key = 'ai'`);
  const parsed = aiSettingsSchema.safeParse({ ...DEFAULT_AI, ...(r.rows[0]?.value as object | undefined) });
  return parsed.success ? parsed.data : DEFAULT_AI;
}

export async function saveAiSettings(actor: ActorInfo, input: unknown): Promise<AiSettings> {
  requirePermission(actor, "catalog.manage");
  const parsed = aiSettingsSchema.safeParse(input);
  if (!parsed.success) throw new CompanyError("Configuración de IA inválida");
  await withTransaction(async (c) => {
    await c.query(`INSERT INTO app_settings (key, value, updated_by, updated_at) VALUES ('ai', $1::jsonb, $2, now())
                   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`, [JSON.stringify(parsed.data), actor.id]);
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "settings.ai_changed", entityType: "app_settings", entityId: "ai", metadata: { ...parsed.data } }, c);
  });
  return parsed.data;
}

export interface Spend { today: number; month: number }

/** Gasto estimado en hora de Lima. No cuenta las generaciones bloqueadas por presupuesto (costo 0). */
export async function currentSpend(): Promise<Spend> {
  const r = await pool().query<{ today: string; month: string }>(
    `SELECT COALESCE(sum(estimated_cost_usd) FILTER (WHERE (created_at AT TIME ZONE 'America/Lima')::date = (now() AT TIME ZONE 'America/Lima')::date), 0) AS today,
            COALESCE(sum(estimated_cost_usd) FILTER (WHERE date_trunc('month', created_at AT TIME ZONE 'America/Lima') = date_trunc('month', now() AT TIME ZONE 'America/Lima')), 0) AS month
       FROM ai_generations`);
  return { today: Number(r.rows[0]!.today), month: Number(r.rows[0]!.month) };
}

export class BudgetError extends Error {
  override name = "BudgetError";
}

/** Rechaza la generación si el peor caso supera el presupuesto diario o mensual. El trabajo ya hecho se conserva. */
export function assertWithinBudget(settings: AiSettings, spend: Spend, worstCase: number): void {
  if (!settings.enabled) throw new BudgetError("La generación con IA está pausada por un administrador.");
  if (spend.today + worstCase > settings.dailyUsd) {
    throw new BudgetError(`Presupuesto diario de IA agotado (gastado hoy USD ${spend.today.toFixed(2)} de ${settings.dailyUsd.toFixed(2)}). Se reanuda mañana o un administrador puede subir el límite. Lo ya generado se conserva.`);
  }
  if (spend.month + worstCase > settings.monthlyUsd) {
    throw new BudgetError(`Presupuesto mensual de IA agotado (gastado este mes USD ${spend.month.toFixed(2)} de ${settings.monthlyUsd.toFixed(2)}). Un administrador puede subir el límite. Lo ya generado se conserva.`);
  }
}
