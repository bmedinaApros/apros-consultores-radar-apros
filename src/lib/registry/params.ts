import { filtersSchema, type RegistryFilters } from "./service";
import { parseQuickQuery, type Dept, type QuickParse } from "./quick";

const flag = (v: string | undefined) => (v === "1" || v === "on" ? true : undefined);

/** Convierte los parámetros de la dirección (caja única y filtros avanzados) en filtros de búsqueda. La usan la pantalla y la descarga. */
export function registryParams(q: Record<string, string | undefined>, depts: Dept[]): { filters: RegistryFilters | null; quick: QuickParse } {
  const quick = parseQuickQuery(q.s ?? "", depts);
  const parsed = filtersSchema.safeParse({
    q: q.q || quick.q || undefined, status: q.status || undefined, condition: q.condition || undefined, person: q.person || undefined,
    ubigeo: q.ubigeo || q.dept || quick.ubigeo || undefined, industry: q.industry || undefined, notPromoted: flag(q.notPromoted) ?? false,
    includeMissing: flag(q.includeMissing) ?? false, after: q.after || undefined,
  });
  return { filters: parsed.success ? parsed.data : null, quick };
}
