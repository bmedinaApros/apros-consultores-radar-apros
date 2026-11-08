import { pool } from "./db";
import { findDoNotContact } from "./companies/exclusions";

export interface SearchHit {
  id: string; name: string; domain: string | null; ruc: string | null; industry: string | null; dnc: boolean;
  /** «registry»: está en el padrón pero aún no en la base de trabajo (su id es el RUC). */
  kind?: "company" | "registry";
}

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
    hits.push({ id: r.id, name: r.legal_name, domain: r.domain, ruc: r.ruc, industry: r.industry, dnc: Boolean(dnc), kind: "company" });
  }
  // Si sobra lugar, se completa con empresas del padrón que aún no están en la base de trabajo (nunca duplica las ya promovidas).
  if (hits.length < SEARCH_MAX_RESULTS && c.kind !== "domain") hits.push(...(await searchRegistryBrief(c, SEARCH_MAX_RESULTS - hits.length)));
  return hits;
}

const tokensOf = (v: string): string[] => v.replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter((t) => t.length >= 2);

async function searchRegistryBrief(c: { kind: string; value: string }, room: number): Promise<SearchHit[]> {
  const base = `FROM registry_companies r LEFT JOIN ubigeo u ON u.code = left(r.ubigeo, 2)
                 WHERE r.missing_since IS NULL AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.ruc = r.ruc)`;
  let rows: { ruc: string; legal_name: string; department: string | null }[];
  if (c.kind === "ruc") {
    rows = (await pool().query(`SELECT r.ruc, r.legal_name, u.department ${base} AND r.ruc LIKE $1 ORDER BY r.ruc LIMIT ${room}`, [`${esc(c.value)}%`])).rows;
  } else {
    const t = tokensOf(c.value);
    if (t.length === 0) return [];
    const conds = t.map((_, i) => `r.normalized_name LIKE $${i + 1}`).join(" AND ");
    rows = (await pool().query(`SELECT r.ruc, r.legal_name, u.department ${base} AND r.is_legal_entity AND ${conds} ORDER BY r.ruc LIMIT ${room}`, t.map((x) => `%${x}%`))).rows;
  }
  const out: SearchHit[] = [];
  for (const r of rows) {
    const dnc = await findDoNotContact({ name: r.legal_name, domain: null, ruc: r.ruc });
    out.push({ id: r.ruc, name: r.legal_name, domain: null, ruc: r.ruc, industry: r.department ? `Padrón · ${r.department}` : "Padrón", dnc: Boolean(dnc), kind: "registry" });
  }
  return out;
}
