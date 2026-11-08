import { audit } from "../audit";
import { pool } from "../db";
import { CompanyError, type ActorInfo } from "../companies/service";
import { requirePermission } from "../rbac";
import { stripAccents } from "./format";

/** Palabra clave en minúsculas, sin tildes ni signos (misma forma que `normalized_name`). */
export const normalizeKeyword = (s: string): string => stripAccents(s.toLowerCase()).replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

export type RubroRules = { industryId: string; words: string[] }[];

export async function loadRubroRules(): Promise<RubroRules> {
  const r = await pool().query<{ industry_id: string; keyword: string }>(
    `SELECT k.industry_id, k.keyword FROM industry_keywords k JOIN industries i ON i.id = k.industry_id WHERE k.active AND i.active`);
  const by = new Map<string, string[]>();
  for (const x of r.rows) by.set(x.industry_id, [...(by.get(x.industry_id) ?? []), x.keyword]);
  return [...by].map(([industryId, words]) => ({ industryId, words }));
}

/**
 * Sugiere un rubro por palabras completas de la razón social. Gana el rubro con más palabras distintas; con empate no se
 * sugiere nada (mejor «por clasificar» que un rubro dudoso). Es una sugerencia: la persona confirma al promover.
 */
export function suggestIndustry(normalizedName: string, rules: RubroRules): string | null {
  if (!normalizedName || rules.length === 0) return null;
  const hay = ` ${normalizedName} `;
  let best: { id: string; hits: number } | null = null;
  let tie = false;
  for (const r of rules) {
    const hits = new Set(r.words.filter((w) => hay.includes(` ${w} `))).size;
    if (hits === 0) continue;
    if (!best || hits > best.hits) { best = { id: r.industryId, hits }; tie = false; }
    else if (hits === best.hits) tie = true;
  }
  return best && !tie ? best.id : null;
}

export interface KeywordRow { id: string; industry_id: string; industry_name: string; keyword: string; active: boolean }

export async function listKeywords(): Promise<KeywordRow[]> {
  return (await pool().query<KeywordRow>(
    `SELECT k.id, k.industry_id, i.name AS industry_name, k.keyword, k.active FROM industry_keywords k JOIN industries i ON i.id = k.industry_id ORDER BY i.name, k.keyword`)).rows;
}

export async function addKeyword(actor: ActorInfo, industryId: string, keyword: string): Promise<void> {
  requirePermission(actor, "catalog.manage");
  const k = normalizeKeyword(keyword);
  if (k.length < 3 || k.length > 40) throw new CompanyError("La palabra debe tener entre 3 y 40 letras o números");
  const ind = await pool().query(`SELECT 1 FROM industries WHERE id = $1`, [industryId]);
  if (!ind.rowCount) throw new CompanyError("Rubro no encontrado");
  const r = await pool().query<{ id: string }>(
    `INSERT INTO industry_keywords (industry_id, keyword, created_by) VALUES ($1,$2,$3) ON CONFLICT (industry_id, keyword) DO NOTHING RETURNING id`, [industryId, k, actor.id]);
  if (!r.rows[0]) throw new CompanyError("Esa palabra ya existe en ese rubro");
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "industry_keyword.added", entityType: "industry_keyword", entityId: r.rows[0].id, metadata: { industryId, keyword: k } });
}

export async function removeKeyword(actor: ActorInfo, id: string): Promise<void> {
  requirePermission(actor, "catalog.manage");
  const r = await pool().query(`DELETE FROM industry_keywords WHERE id = $1`, [id]);
  if (!r.rowCount) throw new CompanyError("Palabra no encontrada");
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "industry_keyword.removed", entityType: "industry_keyword", entityId: id });
}

/** Palabras de ejemplo (editables) para los rubros de ejemplo; no se cargan solas. */
export const EXAMPLE_KEYWORDS: Record<string, string[]> = {
  inmobiliario: ["inmobiliaria", "inmobiliario", "inmuebles", "bienes raices", "propiedades", "constructora", "edificaciones"],
  salud: ["clinica", "hospital", "salud", "medico", "dental", "odontologica", "laboratorio clinico", "centro medico"],
  educacion: ["colegio", "instituto", "universidad", "academia", "educativa", "educacion", "escuela"],
  retail: ["tienda", "boutique", "supermercado", "comercial", "mercado", "minimarket"],
  industria: ["industrias", "industrial", "manufactura", "metalmecanica", "plasticos", "fabrica", "textil"],
  "servicios-profesionales": ["consultores", "consultoria", "asesores", "abogados", "estudio contable", "ingenieros", "auditores"],
  "consumo-masivo": ["distribuidora", "alimentos", "bebidas", "abarrotes", "lacteos", "agroindustrial"],
};

export async function seedExampleKeywords(actor: ActorInfo): Promise<number> {
  requirePermission(actor, "catalog.manage");
  const inds = (await pool().query<{ id: string; slug: string }>(`SELECT id, slug FROM industries WHERE active`)).rows;
  let added = 0;
  for (const i of inds) {
    for (const w of EXAMPLE_KEYWORDS[i.slug] ?? []) {
      const r = await pool().query(`INSERT INTO industry_keywords (industry_id, keyword, created_by) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [i.id, normalizeKeyword(w), actor.id]);
      added += r.rowCount ?? 0;
    }
  }
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "industry_keyword.seeded", entityType: "industry_keyword", entityId: "ejemplos", metadata: { added } });
  return added;
}
