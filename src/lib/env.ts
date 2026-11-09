import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET debe tener al menos 32 caracteres"),
  AUTH_ALLOWED_DOMAINS: z.string().default("apros.pe"),
  INITIAL_ADMIN_EMAILS: z.string().default(""),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  DEV_LOGIN_ENABLED: z.enum(["true", "false"]).default("false"),
  // Analizador web
  CRAWLER_USER_AGENT: z.string().default("RadarAPROS/1.0 (+https://apros.pe; analisis comercial B2B)"),
  CRAWLER_ALLOWED_PORTS: z.string().default("80,443"),
  CRAWLER_MAX_PAGES: z.coerce.number().int().min(1).max(30).default(8),
  CRAWLER_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  ANALYSIS_CACHE_DAYS: z.coerce.number().int().min(0).max(90).default(7),
  PAGESPEED_API_KEY: z.string().default(""),
  // Diagnósticos. Por defecto, plantillas y reglas (sin IA, costo cero). La IA es opcional y solo con la API de Anthropic y
  // clave propia (no se usan credenciales de suscripciones). «disabled» y «simulated» son valores antiguos: equivalen a «rules».
  AI_PROVIDER: z.enum(["rules", "anthropic", "disabled", "simulated"]).default("rules"),
  ANTHROPIC_API_KEY: z.string().default(""),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-opus-5-5"),
});

export type Env = z.infer<typeof schema>;

/** El acceso de desarrollo solo existe con NODE_ENV=development y la bandera activada. */
export function isDevLoginAllowed(env: Pick<Env, "NODE_ENV" | "DEV_LOGIN_ENABLED">): boolean {
  return env.NODE_ENV === "development" && env.DEV_LOGIN_ENABLED === "true";
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const env = schema.parse(source);
  if (env.NODE_ENV === "production" && env.DEV_LOGIN_ENABLED === "true") {
    throw new Error("DEV_LOGIN_ENABLED=true no está permitido en producción");
  }
  return env;
}

export const splitList = (value: string): string[] =>
  value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

let cached: Env | undefined;
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
