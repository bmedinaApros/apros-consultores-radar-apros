import { pool } from "./db";
import { findDoNotContact } from "./companies/exclusions";

export interface SearchHit { id: string; name: string; domain: string | null; ruc: string | null; industry: string | null; dnc: boolean }

export const SEARCH_MIN = 3;
export const SEARCH_MAX_RESULTS = 8;

/** Cómo se interpreta lo que se escribe: RUC (solo dígitos), dominio (con punto) o nombre. */
export function classifyQuery(raw: string): { kind: "ruc" | "domain" | "name"; value: string } | null {
  const q = raw.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 100);
  if (q.length < SEARCH_MIN) return null;
  if (/^\d+$/.test(q)) return { kind: "ruc", value: q };
  const host = q.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0]!;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return { kind: "domain", value: host };
  return { kind: "name", value: q };
}

const esc = (s: string) => s.replace(/[\\%_]/g, "\\$&");

/**
 * Búsqueda global sobre las empresas de trabajo: RUC (exacto de 11 dígitos o prefijo), dominio o nombre.
 * Las que están en la lista de no contactar se marcan; nunca se ocultan (la persona debe saberlo).
 */
export async function searchCompanies(raw: string): Promise<SearchHit[]> {
  const c = classifyQuery(raw);
  if (!c) return [];
  const where = c.kind === "ruc" ? `c.ruc LIKE $1 ESCAPE '\\'` : c.kind === "domain" ? `c.domain LIKE $1 ESCAPE '\\'` : `(c.normalized_name LIKE $1 ESCAPE '\\' OR lower(c.legal_name) LIKE $1 ESCAPE '\\')`;
  const like = c.kind === "name" ? `%${esc(c.value)}%` : `${esc(c.value)}%`;
  const rows = (await pool().query<{ id: string; legal_name: string; domain: string | null; ruc: string | null; industry: string | null }>(
    `SELECT c.id, c.legal_name, c.domain, c.ruc, i.name AS industry FROM companies c LEFT JOIN industries i ON i.id = c.industry_id
      WHERE ${where} ORDER BY (c.ruc = $2 OR c.domain = $2) DESC, c.legal_name LIMIT ${SEARCH_MAX_RESULTS}`, [like, c.value])).rows;
  const hits: SearchHit[] = [];
  for (const r of rows) {
    const dnc = await findDoNotContact({ name: r.legal_name, domain: r.domain, ruc: r.ruc });
    hits.push({ id: r.id, name: r.legal_name, domain: r.domain, ruc: r.ruc, industry: r.industry, dnc: Boolean(dnc) });
  }
  return hits;
}
