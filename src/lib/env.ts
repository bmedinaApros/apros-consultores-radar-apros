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
