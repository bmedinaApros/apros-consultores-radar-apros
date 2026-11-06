import robotsParser from "robots-parser";

/** Rastreadores de IA cuya regla en robots.txt se informa (GEO). */
export const AI_CRAWLERS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot", "Applebot-Extended", "Bytespider"] as const;

export type RobotsState =
  | { kind: "rules"; text: string }   // robots.txt leído; se respetan sus reglas
  | { kind: "none" }                  // 4xx: sin robots.txt, se permite todo (RFC 9309)
  | { kind: "unreachable"; reason: string }; // 5xx, red o bloqueo: NO se rastrea (RFC 9309)

export interface RobotsPolicy {
  state: RobotsState;
  /** ¿Puede el rastreador (por su token de producto) pedir esta URL? */
  allowed(url: string): boolean;
  sitemaps(): string[];
  aiRules(): Record<string, "allowed" | "blocked" | "unspecified_allowed" | "unspecified_blocked">;
}

export const productToken = (userAgent: string): string => userAgent.split(/[\/\s]/)[0] || "RadarAPROS";

export function buildRobotsPolicy(origin: string, state: RobotsState, userAgent: string): RobotsPolicy {
  const token = productToken(userAgent);
  const parsed = state.kind === "rules" ? robotsParser(`${origin}/robots.txt`, state.text) : null;
  const mentioned = (ua: string) =>
    state.kind === "rules" && new RegExp(`^\\s*user-agent\\s*:\\s*${ua.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "im").test(state.text);
  return {
    state,
    allowed(url) {
      if (state.kind === "unreachable") return false;
      if (state.kind === "none") return true;
      return parsed!.isAllowed(url, token) !== false;
    },
    sitemaps: () => (parsed ? parsed.getSitemaps() : []),
    aiRules() {
      const out: ReturnType<RobotsPolicy["aiRules"]> = {};
      for (const ua of AI_CRAWLERS) {
        if (state.kind !== "rules") { out[ua] = "unspecified_allowed"; continue; }
        const allowed = parsed!.isAllowed(`${origin}/`, ua) !== false;
        out[ua] = mentioned(ua) ? (allowed ? "allowed" : "blocked") : allowed ? "unspecified_allowed" : "unspecified_blocked";
      }
      return out;
    },
  };
}
