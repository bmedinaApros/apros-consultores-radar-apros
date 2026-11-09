import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";
import type { GenerationContext } from "./prompt";
import { rulesProvider } from "./rules";

export interface AiInput {
  system: string;
  user: string;
  schema: { [key: string]: unknown };
  maxTokens: number;
  context: GenerationContext;
}

export interface AiOutput {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  stopReason: string;
}

export interface AiProvider {
  id: "anthropic" | "rules";
  model: string;
  generate(input: AiInput): Promise<AiOutput>;
}

export class AiRefusalError extends Error {
  override name = "AiRefusalError";
}
export class AiCallError extends Error {
  override name = "AiCallError";
  constructor(message: string, public retryable = false) {
    super(message);
  }
}

/** Subconjunto del cliente del SDK que usamos; permite probar sin red. */
export interface MessagesClient {
  messages: { create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message> };
}

/**
 * Proveedor de Anthropic. El modelo NO recibe herramientas, secretos ni acceso a la red: solo texto y un esquema de
 * salida. No se envían parámetros de muestreo (los modelos actuales los rechazan).
 */
export function anthropicProvider(opts: { apiKey?: string; model: string; client?: MessagesClient; effort?: "low" | "medium" | "high" }): AiProvider {
  const client: MessagesClient = opts.client ?? new Anthropic({ apiKey: opts.apiKey, maxRetries: 2, timeout: 180_000 });
  return {
    id: "anthropic",
    model: opts.model,
    async generate(input) {
      let res: Anthropic.Message;
      try {
        res = await client.messages.create({
          model: opts.model,
          max_tokens: input.maxTokens,
          system: input.system,
          messages: [{ role: "user", content: input.user }],
          output_config: { effort: opts.effort ?? "medium", format: { type: "json_schema", schema: input.schema } },
        });
      } catch (e) {
        if (e instanceof Anthropic.APIError) {
          const status = e.status ?? 0;
          throw new AiCallError(`La API de IA respondió ${status || "con un error de red"}`, status === 429 || status >= 500 || status === 0);
        }
        throw new AiCallError("No se pudo llamar a la API de IA", true);
      }
      if (res.stop_reason === "refusal") throw new AiRefusalError("El modelo declinó responder esta solicitud");
      if (res.stop_reason === "max_tokens") throw new AiCallError("La respuesta se cortó por el límite de tokens", false);
      const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
      return {
        text, model: res.model ?? opts.model, stopReason: String(res.stop_reason),
        inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, cacheReadTokens: res.usage.cache_read_input_tokens ?? 0,
      };
    },
  };
}

/**
 * Elige el generador. Por defecto (y siempre que no haya IA configurada) se usan las plantillas y reglas: costo cero y
 * disponible en cualquier entorno. La IA de Anthropic es opcional: AI_PROVIDER=anthropic y una clave propia.
 */
export function resolveProvider(): AiProvider {
  const e = env();
  if (e.AI_PROVIDER === "anthropic" && e.ANTHROPIC_API_KEY) return anthropicProvider({ apiKey: e.ANTHROPIC_API_KEY, model: e.ANTHROPIC_MODEL });
  return rulesProvider();
}
