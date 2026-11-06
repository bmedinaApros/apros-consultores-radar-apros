import type { Pool, PoolClient } from "pg";
import { pool } from "../db";
import { normalizeEmailDomain, normalizeName } from "./normalize";

type Db = Pick<Pool | PoolClient, "query">;

export interface CompanyIdentity {
  name?: string | null;
  domain?: string | null;
  ruc?: string | null;
  emails?: string[];
}

export interface DncMatch {
  kind: "company" | "domain" | "email";
  value: string;
  reason: string;
}

/** Devuelve la coincidencia con la lista de no contactar, si existe. Se aplica en todo uso comercial. */
export async function findDoNotContact(id: CompanyIdentity, db: Db = pool()): Promise<DncMatch | null> {
  const company = [id.ruc ?? null, id.name ? normalizeName(id.name) : null].filter((v): v is string => Boolean(v));
  const domains = new Set<string>();
  if (id.domain) domains.add(id.domain);
  for (const e of id.emails ?? []) {
    const d = normalizeEmailDomain(e);
    if (d) domains.add(d);
  }
  const emails = (id.emails ?? []).map((e) => e.trim().toLowerCase());
  const res = await db.query<DncMatch>(
    `SELECT kind, value, reason FROM do_not_contact
      WHERE (kind = 'company' AND value = ANY($1::text[]))
         OR (kind = 'domain'  AND value = ANY($2::text[]))
         OR (kind = 'email'   AND value = ANY($3::text[]))
      LIMIT 1`,
    [company, [...domains], emails],
  );
  return res.rows[0] ?? null;
}

export async function isCommerciallyBlocked(companyId: string, db: Db = pool()): Promise<boolean> {
  const res = await db.query<{ name: string; domain: string | null; ruc: string | null }>(
    `SELECT legal_name AS name, domain, ruc FROM companies WHERE id = $1`,
    [companyId],
  );
  const c = res.rows[0];
  if (!c) return true; // si no existe, no se puede usar
  return (await findDoNotContact({ name: c.name, domain: c.domain, ruc: c.ruc }, db)) !== null;
}

export interface ActiveClientMatch {
  name: string;
  by: "ruc" | "domain" | "name";
}

export async function findActiveClient(id: CompanyIdentity, db: Db = pool()): Promise<ActiveClientMatch | null> {
  const norm = id.name ? normalizeName(id.name) : null;
  const res = await db.query<{ name: string; ruc: string | null; domain: string | null; normalized_name: string }>(
    `SELECT name, ruc, domain, normalized_name FROM active_clients
      WHERE ($1::text IS NOT NULL AND ruc = $1)
         OR ($2::text IS NOT NULL AND domain = $2)
         OR ($3::text IS NOT NULL AND normalized_name = $3)
      LIMIT 1`,
    [id.ruc ?? null, id.domain ?? null, norm],
  );
  const r = res.rows[0];
  if (!r) return null;
  const by = id.ruc && r.ruc === id.ruc ? "ruc" : id.domain && r.domain === id.domain ? "domain" : "name";
  return { name: r.name, by };
}
