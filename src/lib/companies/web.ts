import { audit } from "../audit";
import { pool } from "../db";
import { env } from "../env";
import { buildRobotsPolicy, type RobotsState } from "../analyzer/robots";
import { looksLikeChallenge } from "../analyzer/extract";
import { createSafeFetcher, type Fetcher } from "../analyzer/safe-fetch";
import { canModifyOwned, requirePermission, ForbiddenError } from "../rbac";
import { CompanyError, getCompany, updateCompany, type ActorInfo } from "./service";
import { normalizeDomain } from "./normalize";

export type WebStatus = "ok" | "warning" | "failed";
export type RobotsLabel = "permite" | "bloquea" | "sin_robots" | "no_verificado";

export interface WebCheck {
  status: WebStatus;
  /** Dominio normalizado (sin «www.»); null si lo escrito no es una dirección válida. */
  domain: string | null;
  httpStatus: number | null;
  finalUrl: string | null;
  robots: RobotsLabel;
  /** Si la portada redirige a otro dominio, cuál. */
  redirectsTo: string | null;
  messages: string[];
}

export interface WebDeps { fetcher: Fetcher; userAgent: string; timeoutMs?: number }

export function defaultWebDeps(): WebDeps {
  const e = env();
  const ports = e.CRAWLER_ALLOWED_PORTS.split(",").map(Number).filter((n) => n > 0);
  return { fetcher: createSafeFetcher({ userAgent: e.CRAWLER_USER_AGENT, allowedPorts: ports }), userAgent: e.CRAWLER_USER_AGENT, timeoutMs: 8000 };
}

const failed = (domain: string | null, robots: RobotsLabel, ...messages: string[]): WebCheck => ({ status: "failed", domain, httpStatus: null, finalUrl: null, robots, redirectsTo: null, messages });

/**
 * Comprueba un sitio web ANTES de asignarlo a una empresa. Toda petición sale por el descargador seguro (anti-SSRF: solo
 * direcciones públicas, redirecciones revalidadas, límites de tamaño y tiempo) y respeta robots.txt. Un sitio que no
 * resuelve se rechaza; los demás problemas (bloqueo antibots, error HTTP, redirección) son avisos: se puede guardar igual.
 */
export async function validateWebsite(input: string, deps: WebDeps = defaultWebDeps()): Promise<WebCheck> {
  const nd = normalizeDomain(input);
  if (!nd.ok) return failed(null, "no_verificado", `La dirección no es válida: ${nd.error}.`);
  const domain = nd.domain;
  const origin = `https://${domain}`;
  const timeoutMs = deps.timeoutMs ?? 8000;

  // 1) robots.txt (RFC 9309). Un dominio que no resuelve o que apunta a una dirección no pública se rechaza aquí.
  const rr = await deps.fetcher(`${origin}/robots.txt`, { maxBytes: 512 * 1024, timeoutMs, contentTypes: /^(text\/plain|text\/html|application\/octet-stream)/i, accept: "text/plain,*/*;q=0.1" });
  if (rr.outcome === "blocked") return failed(domain, "no_verificado", `No se pudo consultar ${domain}: ${rr.reason ?? "el dominio no resuelve a un sitio público"}. Revisa que esté bien escrito.`);
  const challenge = looksLikeChallenge(rr.status, rr.headers, rr.body);
  let state: RobotsState;
  if (rr.outcome === "ok") state = { kind: "rules", text: rr.body };
  else if (rr.outcome === "http_error" && rr.status && rr.status >= 400 && rr.status < 500 && !challenge) state = { kind: "none" };
  else state = { kind: "unreachable", reason: challenge ? "desafío antibots" : rr.reason ?? rr.outcome };
  const policy = buildRobotsPolicy(origin, state, deps.userAgent);
  const robots: RobotsLabel = state.kind === "rules" ? (policy.allowed(`${origin}/`) ? "permite" : "bloquea") : state.kind === "none" ? "sin_robots" : "no_verificado";

  const messages: string[] = [];
  if (robots === "bloquea") {
    return { status: "warning", domain, httpStatus: null, finalUrl: null, robots, redirectsTo: null,
      messages: ["El robots.txt del sitio no permite la lectura automática de la portada. Se puede guardar, pero Radar no lo analizará."] };
  }
  if (robots === "no_verificado") messages.push(challenge ? "El sitio presenta un desafío antibots: Radar no podrá leerlo automáticamente." : "No se pudo leer el robots.txt del sitio; Radar solo lo analizará si logra leerlo.");

  // 2) Portada
  const home = await deps.fetcher(`${origin}/`, { timeoutMs });
  const httpStatus = home.status ?? null;
  let finalUrl: string | null = home.outcome === "ok" ? home.url : null;
  let redirectsTo: string | null = null;
  let status: WebStatus = messages.length ? "warning" : "ok";

  if (home.outcome === "ok") {
    try {
      const host = new URL(home.url).hostname.replace(/^www\./, "");
      if (host !== domain) { redirectsTo = host; status = "warning"; messages.push(`La portada redirige a otro dominio (${host}). Si ese es el sitio oficial de la empresa, úsalo.`); }
    } catch { /* URL final no interpretable: se ignora */ }
    if (messages.length === 0) messages.push("El sitio responde y su robots.txt permite la lectura.");
  } else if (home.outcome === "http_error") {
    status = "warning";
    if (looksLikeChallenge(home.status, home.headers, home.body)) messages.push("El sitio responde, pero bloquea la lectura automatizada (antibots).");
    else if (home.status === 404 || home.status === 410) messages.push("La portada respondió «no encontrada». Revisa que sea la dirección correcta.");
    else messages.push(`La portada respondió con error (${home.status ?? "sin código"}).`);
  } else if (home.outcome === "tls_error") {
    status = "warning"; messages.push("El certificado de seguridad del sitio no es válido.");
  } else {
    status = "warning"; messages.push(home.outcome === "timeout" ? "El sitio no respondió a tiempo." : "No se pudo abrir la portada ahora; se guardará sin verificar.");
  }
  if (home.outcome !== "ok") finalUrl = null;
  return { status, domain, httpStatus, finalUrl, robots, redirectsTo, messages };
}

export interface WebValidationRow { id: string; domain: string; status: WebStatus; http_status: number | null; final_url: string | null; robots: RobotsLabel; detail: { messages?: string[]; redirectsTo?: string | null }; checked_at: Date; checked_by_email: string | null }

export async function latestWebValidation(companyId: string): Promise<WebValidationRow | null> {
  return (await pool().query<WebValidationRow>(
    `SELECT v.id, v.domain, v.status, v.http_status, v.final_url, v.robots, v.detail, v.checked_at, u.email AS checked_by_email
       FROM company_web_validations v LEFT JOIN users u ON u.id = v.checked_by WHERE v.company_id = $1 ORDER BY v.checked_at DESC LIMIT 1`, [companyId])).rows[0] ?? null;
}

async function record(companyId: string, check: WebCheck, actor: ActorInfo): Promise<void> {
  if (!check.domain) return;
  await pool().query(
    `INSERT INTO company_web_validations (company_id, domain, status, http_status, final_url, robots, detail, checked_by) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
    [companyId, check.domain, check.status, check.httpStatus, check.finalUrl, check.robots, JSON.stringify({ messages: check.messages, redirectsTo: check.redirectsTo }), actor.id]);
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "company.web_validated", entityType: "company", entityId: companyId, metadata: { domain: check.domain, status: check.status, robots: check.robots } });
}

/**
 * Ingreso rápido del sitio web de una empresa: valida y, si el dominio es consultable, lo asigna. Un dominio que no resuelve
 * no se guarda. Se aplican los mismos permisos y la misma regla de dominio único que al editar la empresa.
 */
export async function setCompanyWebsite(actor: ActorInfo, companyId: string, input: string, deps?: WebDeps, precheck?: WebCheck): Promise<WebCheck> {
  requirePermission(actor, "companies.write");
  const company = await getCompany(companyId);
  if (!company) throw new CompanyError("Empresa no encontrada");
  if (!canModifyOwned(actor, { ownerId: company.owner_id }, "companies.write")) throw new ForbiddenError("Solo puedes modificar empresas tuyas o sin responsable");
  const check = precheck ?? (await validateWebsite(input, deps));
  if (check.status === "failed") throw new CompanyError(check.messages.join(" "));
  await updateCompany(actor, companyId, { website: check.domain! });
  await record(companyId, check, actor);
  return check;
}

/** Vuelve a comprobar el sitio que la empresa ya tiene (por ejemplo, después de que el dueño arregle algo). */
export async function revalidateCompanyWebsite(actor: ActorInfo, companyId: string, deps?: WebDeps): Promise<WebCheck> {
  requirePermission(actor, "companies.write");
  const company = await getCompany(companyId);
  if (!company) throw new CompanyError("Empresa no encontrada");
  if (!company.domain) throw new CompanyError("La empresa no tiene sitio web para comprobar");
  const check = await validateWebsite(company.domain, deps);
  await record(companyId, check, actor);
  return check;
}
