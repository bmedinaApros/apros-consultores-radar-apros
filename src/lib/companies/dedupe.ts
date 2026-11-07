import type { Pool, PoolClient } from "pg";
import { pool } from "../db";
import { duplicateScore } from "./normalize";

type Db = Pick<Pool | PoolClient, "query">;

export const SIMILARITY_THRESHOLD = 0.85;

export interface MatchInput {
  normalizedName: string;
  domain: string | null;
  ruc: string | null;
}

export interface Match {
  companyId: string;
  kind: "ruc" | "domain" | "name";
  score: number;
}

/**
 * Índice en memoria de empresas existentes. Se carga una sola vez por lote (evita N+1) y admite
 * agregar filas del mismo archivo para detectar duplicados internos.
 * Pensado para miles de empresas, no para millones.
 */
export class CompanyIndex {
  private byRuc = new Map<string, string>();
  private byDomain = new Map<string, string>();
  private names: { id: string; name: string }[] = [];

  static async load(db: Db = pool(), excludeId?: string): Promise<CompanyIndex> {
    const idx = new CompanyIndex();
    const res = await db.query<{ id: string; normalized_name: string; ruc: string | null; domain: string | null }>(
      `SELECT id, normalized_name, ruc, domain FROM companies WHERE ($1::uuid IS NULL OR id <> $1)`,
      [excludeId ?? null],
    );
    for (const r of res.rows) idx.add(r.id, { normalizedName: r.normalized_name, ruc: r.ruc, domain: r.domain });
    return idx;
  }

  add(id: string, c: MatchInput): void {
    if (c.ruc) this.byRuc.set(c.ruc, id);
    if (c.domain) this.byDomain.set(c.domain, id);
    this.names.push({ id, name: c.normalizedName });
  }

  match(input: MatchInput): Match | null {
    const byRuc = input.ruc ? this.byRuc.get(input.ruc) : undefined;
    if (byRuc) return { companyId: byRuc, kind: "ruc", score: 1 };
    const byDomain = input.domain ? this.byDomain.get(input.domain) : undefined;
    if (byDomain) return { companyId: byDomain, kind: "domain", score: 1 };
    let best: Match | null = null;
    for (const n of this.names) {
      const score = duplicateScore(input.normalizedName, n.name);
      if (score >= SIMILARITY_THRESHOLD && (!best || score > best.score)) {
        best = { companyId: n.id, kind: "name", score: Math.round(score * 1000) / 1000 };
      }
    }
    return best;
  }
}

export async function findMatch(input: MatchInput, db: Db = pool(), excludeId?: string): Promise<Match | null> {
  return (await CompanyIndex.load(db, excludeId)).match(input);
}
