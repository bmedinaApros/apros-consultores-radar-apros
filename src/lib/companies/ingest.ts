import type { Pool, PoolClient } from "pg";
import { pool } from "../db";
import { CompanyIndex, type Match } from "./dedupe";
import { findActiveClient, findDoNotContact } from "./exclusions";
import { cleanText, normalizeDomain, normalizeName, normalizeRuc } from "./normalize";

type Db = Pick<Pool | PoolClient, "query">;

/** Datos de una empresa tal como llegan de cualquier fuente (CSV, manual, proveedor). */
export interface RawCompany {
  legal_name?: string;
  trade_name?: string;
  website?: string;
  ruc?: string;
  industry?: string;
  subindustry?: string;
  city?: string;
  owner_email?: string;
}

export interface PreparedCompany {
  legalName: string;
  tradeName: string | null;
  normalizedName: string;
  domain: string | null;
  ruc: string | null;
  industryId: string | null;
  subindustry: string | null;
  city: string | null;
  ownerId: string | null;
  classification: "classified" | "to_classify";
}

export interface Issue {
  level: "error" | "warning";
  message: string;
}

export interface Lookups {
  industries: Map<string, string>; // slug y nombre normalizado → id
  usersByEmail: Map<string, string>;
}

export async function loadLookups(db: Db = pool()): Promise<Lookups> {
  const [ind, usr] = await Promise.all([
    db.query<{ id: string; slug: string; name: string }>(`SELECT id, slug, name FROM industries WHERE active`),
    db.query<{ id: string; email: string }>(`SELECT id, email FROM users WHERE active`),
  ]);
  const industries = new Map<string, string>();
  for (const i of ind.rows) {
    industries.set(i.slug, i.id);
    industries.set(normalizeName(i.name), i.id);
  }
  return { industries, usersByEmail: new Map(usr.rows.map((u) => [u.email, u.id])) };
}

/** Valida y normaliza. Un error impide importar la fila; una advertencia no. */
export function prepareCompany(raw: RawCompany, lookups: Lookups): { prepared: PreparedCompany | null; issues: Issue[] } {
  const issues: Issue[] = [];
  const legalName = cleanText(raw.legal_name, 200);
  if (!legalName) issues.push({ level: "error", message: "Falta la razón social" });

  let ruc: string | null = null;
  if (cleanText(raw.ruc, 30)) {
    const r = normalizeRuc(raw.ruc!);
    if (r.ok) ruc = r.ruc;
    else issues.push({ level: "error", message: r.error });
  }

  let domain: string | null = null;
  if (cleanText(raw.website, 300)) {
    const d = normalizeDomain(raw.website!);
    if (d.ok) domain = d.domain;
    else issues.push({ level: "warning", message: `Sitio web descartado: ${d.error}` });
  }

  let industryId: string | null = null;
  const industryText = cleanText(raw.industry, 100);
  if (industryText) {
    industryId = lookups.industries.get(normalizeName(industryText)) ?? lookups.industries.get(industryText.toLowerCase()) ?? null;
    if (!industryId) issues.push({ level: "warning", message: `Rubro no reconocido («${industryText}»): queda por clasificar` });
  }

  let ownerId: string | null = null;
  const ownerText = cleanText(raw.owner_email, 200);
  if (ownerText) {
    ownerId = lookups.usersByEmail.get(ownerText.toLowerCase()) ?? null;
    if (!ownerId) issues.push({ level: "warning", message: "Responsable no encontrado: queda sin asignar" });
  }

  if (issues.some((i) => i.level === "error") || !legalName) return { prepared: null, issues };
  return {
    prepared: {
      legalName,
      tradeName: cleanText(raw.trade_name, 200),
      normalizedName: normalizeName(legalName),
      domain,
      ruc,
      industryId,
      subindustry: cleanText(raw.subindustry, 100),
      city: cleanText(raw.city, 100),
      ownerId,
      classification: industryId ? "classified" : "to_classify",
    },
    issues,
  };
}

export type RowStatus = "valid" | "error" | "duplicate" | "possible_duplicate" | "blocked" | "excluded_client";

export interface Evaluation {
  status: RowStatus;
  issues: Issue[];
  match: (Match & { inFile?: number }) | null;
}

/**
 * Orden de evaluación: error → no contactar → cliente activo → duplicado. Una empresa bloqueada o que ya es
 * cliente nunca se crea, aunque un usuario lo pida.
 */
export async function evaluate(
  prepared: PreparedCompany | null,
  issues: Issue[],
  index: CompanyIndex,
  db: Db = pool(),
): Promise<Evaluation> {
  if (!prepared) return { status: "error", issues, match: null };
  const dnc = await findDoNotContact({ name: prepared.legalName, domain: prepared.domain, ruc: prepared.ruc }, db);
  if (dnc) {
    return { status: "blocked", issues: [...issues, { level: "error", message: `En la lista de no contactar (${dnc.kind}): ${dnc.reason}` }], match: null };
  }
  const client = await findActiveClient({ name: prepared.legalName, domain: prepared.domain, ruc: prepared.ruc }, db);
  if (client) {
    return { status: "excluded_client", issues: [...issues, { level: "error", message: `Ya es cliente activo («${client.name}», por ${client.by})` }], match: null };
  }
  const match = index.match({ normalizedName: prepared.normalizedName, domain: prepared.domain, ruc: prepared.ruc });
  if (match) {
    const exact = match.kind !== "name";
    return {
      status: exact ? "duplicate" : "possible_duplicate",
      issues: [...issues, { level: "warning", message: exact ? `Ya existe una empresa con el mismo ${match.kind === "ruc" ? "RUC" : "dominio"}` : `Nombre muy parecido a una empresa existente (${Math.round(match.score * 100)} %)` }],
      match,
    };
  }
  return { status: "valid", issues, match: null };
}

export async function insertCompany(
  db: Db,
  p: PreparedCompany,
  meta: { createdBy: string | null; batchId?: string | null; sourceCode: string; sourceRef?: string | null },
): Promise<string> {
  const res = await db.query<{ id: string }>(
    `INSERT INTO companies (legal_name, trade_name, normalized_name, domain, ruc, industry_id, subindustry, city,
                            owner_id, classification, import_batch_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [p.legalName, p.tradeName, p.normalizedName, p.domain, p.ruc, p.industryId, p.subindustry, p.city, p.ownerId,
     p.classification, meta.batchId ?? null, meta.createdBy],
  );
  const id = res.rows[0]!.id;
  await db.query(
    `INSERT INTO company_sources (company_id, source_code, source_ref, import_batch_id) VALUES ($1,$2,$3,$4)`,
    [id, meta.sourceCode, meta.sourceRef ?? null, meta.batchId ?? null],
  );
  return id;
}

/** Completa solo los campos vacíos de la empresa existente; nunca sobrescribe. */
export async function mergeIntoCompany(
  db: Db,
  companyId: string,
  p: PreparedCompany,
  meta: { batchId?: string | null; sourceCode: string; sourceRef?: string | null },
): Promise<void> {
  // No se fusiona un dominio o RUC que ya pertenece a otra empresa (violaría la unicidad).
  const taken = await db.query<{ domain: string | null; ruc: string | null }>(
    `SELECT domain, ruc FROM companies WHERE id <> $1 AND (($2::text IS NOT NULL AND domain = $2) OR ($3::text IS NOT NULL AND ruc = $3))`,
    [companyId, p.domain, p.ruc],
  );
  const domain = taken.rows.some((r) => r.domain === p.domain) ? null : p.domain;
  const ruc = taken.rows.some((r) => r.ruc === p.ruc) ? null : p.ruc;
  p = { ...p, domain, ruc };
  await db.query(
    `UPDATE companies SET
       trade_name  = coalesce(trade_name, $2),
       domain      = coalesce(domain, $3),
       ruc         = coalesce(ruc, $4),
       industry_id = coalesce(industry_id, $5),
       classification = CASE WHEN industry_id IS NULL AND $5::uuid IS NOT NULL THEN 'classified'::classification_status ELSE classification END,
       subindustry = coalesce(subindustry, $6),
       city        = coalesce(city, $7),
       owner_id    = coalesce(owner_id, $8),
       updated_at  = now()
     WHERE id = $1`,
    [companyId, p.tradeName, p.domain, p.ruc, p.industryId, p.subindustry, p.city, p.ownerId],
  );
  await db.query(
    `INSERT INTO company_sources (company_id, source_code, source_ref, import_batch_id) VALUES ($1,$2,$3,$4)`,
    [companyId, meta.sourceCode, meta.sourceRef ?? null, meta.batchId ?? null],
  );
}
