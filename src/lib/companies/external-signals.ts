import { z } from "zod";
import { audit } from "../audit";
import { pool } from "../db";
import { canModifyOwned, requirePermission, ForbiddenError } from "../rbac";
import { CompanyError, getCompany, type ActorInfo } from "./service";

export const SIGNAL_KINDS = ["aviso_empleo", "indecopi", "meta_ads", "otra"] as const;
export type SignalKind = (typeof SIGNAL_KINDS)[number];
export const SIGNAL_LABELS: Record<SignalKind, string> = {
  aviso_empleo: "Aviso de empleo", indecopi: "Marca en Indecopi", meta_ads: "Publicidad en Meta", otra: "Otra señal",
};
export const JOB_PORTALS = ["Computrabajo", "Bumeran", "Laborum", "Otro"] as const;

/**
 * Enlaces para que una PERSONA consulte por su cuenta, en su navegador y bajo los términos de cada sitio. Radar no descarga
 * ni lee esas páginas. Para los portales se usa una búsqueda de Google acotada al sitio (no depende de rutas internas).
 */
export function searchLinks(companyName: string): { label: string; href: string; note: string }[] {
  const n = companyName.replace(/\b(S\.?A\.?C\.?|S\.?A\.?|S\.?R\.?L\.?|E\.?I\.?R\.?L\.?)\s*$/i, "").replace(/[“”"]/g, "").trim().slice(0, 80);
  const q = encodeURIComponent(n);
  const site = (host: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:${host} "${n}"`)}`;
  return [
    { label: "Computrabajo", href: site("pe.computrabajo.com"), note: "avisos de empleo" },
    { label: "Bumeran", href: site("bumeran.com.pe"), note: "avisos de empleo" },
    { label: "Laborum", href: site("laborum.pe"), note: "avisos de empleo" },
    { label: "Biblioteca de anuncios de Meta", href: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=PE&q=${q}&search_type=keyword_unordered`, note: "publicidad activa" },
    { label: "Indecopi (marcas)", href: `https://www.google.com/search?q=${encodeURIComponent(`"${n}" marca registro indecopi`)}`, note: "registros de marca" },
  ];
}

const input = z.object({
  kind: z.enum(SIGNAL_KINDS),
  source: z.string().trim().max(60).optional(),
  detail: z.string().trim().min(3).max(500),
  url: z.string().trim().max(500).optional(),
  observedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export interface ExternalSignal { id: string; kind: SignalKind; source: string | null; detail: string; url: string | null; observed_on: string; created_by_email: string | null; created_at: Date }

export async function listExternalSignals(companyId: string): Promise<ExternalSignal[]> {
  return (await pool().query<ExternalSignal>(
    `SELECT s.id, s.kind, s.source, s.detail, s.url, to_char(s.observed_on, 'YYYY-MM-DD') AS observed_on, u.email AS created_by_email, s.created_at
       FROM company_external_signals s LEFT JOIN users u ON u.id = s.created_by WHERE s.company_id = $1 ORDER BY s.observed_on DESC, s.created_at DESC LIMIT 100`, [companyId])).rows;
}

async function guard(actor: ActorInfo, companyId: string) {
  requirePermission(actor, "companies.write");
  const c = await getCompany(companyId);
  if (!c) throw new CompanyError("Empresa no encontrada");
  if (!canModifyOwned(actor, { ownerId: c.owner_id }, "companies.write")) throw new ForbiddenError("Solo puedes modificar empresas tuyas o sin responsable");
}

export async function addExternalSignal(actor: ActorInfo, companyId: string, raw: unknown, now = new Date()): Promise<void> {
  await guard(actor, companyId);
  const p = input.safeParse(raw);
  if (!p.success) throw new CompanyError("Revisa los datos: describe lo observado (3 a 500 caracteres) e indica la fecha.");
  const d = p.data;
  if (d.url && !/^https?:\/\/[^\s]+$/i.test(d.url)) throw new CompanyError("El enlace debe empezar con http:// o https://");
  if (new Date(`${d.observedOn}T00:00:00Z`).getTime() > now.getTime() + 86_400_000) throw new CompanyError("La fecha no puede ser futura");
  const r = await pool().query<{ id: string }>(
    `INSERT INTO company_external_signals (company_id, kind, source, detail, url, observed_on, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [companyId, d.kind, d.source || null, d.detail, d.url || null, d.observedOn, actor.id]);
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "company.external_signal_added", entityType: "company", entityId: companyId, metadata: { signalId: r.rows[0]!.id, kind: d.kind } });
}

export async function removeExternalSignal(actor: ActorInfo, signalId: string): Promise<void> {
  const r = await pool().query<{ company_id: string; kind: string }>(`SELECT company_id, kind FROM company_external_signals WHERE id = $1`, [signalId]);
  const s = r.rows[0];
  if (!s) throw new CompanyError("Señal no encontrada");
  await guard(actor, s.company_id);
  await pool().query(`DELETE FROM company_external_signals WHERE id = $1`, [signalId]);
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "company.external_signal_removed", entityType: "company", entityId: s.company_id, metadata: { signalId, kind: s.kind } });
}
