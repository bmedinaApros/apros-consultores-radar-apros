import { can, type Permission, type Role } from "./rbac";

/** Íconos disponibles (un solo set: lucide, trazo uniforme). La clave es lo que viaja al cliente; el componente la traduce. */
export type IconKey = "home" | "prospect" | "analyze" | "settings" | "upload" | "more";

export interface NavItemDef { href: string; label: string; permission?: Permission; roles?: readonly Role[] }
export interface NavGroupDef { id: string; label: string; icon: IconKey; /** Si no tiene subopciones, el grupo es un enlace. */ href?: string; items: NavItemDef[]; permission?: Permission; roles?: readonly Role[] }

/**
 * Estructura del menú: Buscar, Cargar padrón y «Más» (lo demás), más Configuración aparte y abajo.
 * Una pantalla que no existe no aparece. Cada rol ve solo lo que puede usar; la autorización real se vuelve a
 * comprobar en el servidor en cada página y acción: ocultar una entrada no es un control.
 */
export const NAV: readonly NavGroupDef[] = [
  { id: "buscar", label: "Buscar", icon: "prospect", href: "/registry", items: [] },
  { id: "cargar", label: "Cargar padrón", icon: "upload", href: "/registry/imports", items: [], permission: "registry.import" },
  {
    // Todo lo demás sigue disponible, pero fuera del camino: la tarea principal es cargar el padrón y buscar en él.
    id: "mas", label: "Más", icon: "more",
    items: [
      { href: "/companies", label: "Empresas de la base", permission: "companies.read" },
      { href: "/diagnostics", label: "Diagnósticos", permission: "companies.read" },
      { href: "/weekly", label: "Lista semanal", permission: "weekly.read" },
      { href: "/inbox", label: "Bandeja de revisión", permission: "weekly.read" },
      { href: "/companies/import", label: "Importar CSV", permission: "companies.import" },
      { href: "/companies/duplicates", label: "Duplicados", roles: ["admin", "sales_lead"] },
      { href: "/admin/sources", label: "Fuentes", permission: "sources.manage" },
    ],
  },
];

export const NAV_SETTINGS: NavGroupDef = {
  id: "configuracion", label: "Configuración", icon: "settings",
  items: [
    { href: "/admin/industries", label: "Rubros", permission: "catalog.manage" },
    { href: "/admin/industry-rules", label: "Reglas de rubro", permission: "catalog.manage" },
    { href: "/admin/signals", label: "Señales por rubro", permission: "catalog.manage" },
    { href: "/admin/models", label: "Modelos de puntaje", permission: "catalog.manage" },
    { href: "/admin/services", label: "Servicios de APROS", permission: "catalog.manage" },
    { href: "/admin/weekly", label: "Ejecución semanal", permission: "catalog.manage" },
    { href: "/admin/ai", label: "IA y presupuesto", permission: "catalog.manage" },
    { href: "/admin/users", label: "Usuarios y accesos", permission: "users.manage" },
    { href: "/admin/dnc", label: "No contactar", permission: "dnc.manage" },
    { href: "/admin/clients", label: "Clientes activos", permission: "catalog.manage" },
    { href: "/admin/audit", label: "Auditoría", permission: "audit.read" },
  ],
};

export interface VisibleGroup { id: string; label: string; icon: IconKey; href?: string; items: { href: string; label: string }[] }

const allowed = (role: Role, x: { permission?: Permission; roles?: readonly Role[] }): boolean =>
  (!x.permission || can(role, x.permission)) && (!x.roles || x.roles.includes(role));

/** Grupos que el rol puede ver. Un grupo sin entradas permitidas no se muestra; Configuración va siempre al final. */
export function visibleNav(role: Role): { main: VisibleGroup[]; settings: VisibleGroup | null } {
  const shape = (g: NavGroupDef): VisibleGroup => ({ id: g.id, label: g.label, icon: g.icon, href: g.href, items: g.items.filter((i) => allowed(role, i)).map(({ href, label }) => ({ href, label })) });
  const main = NAV.filter((g) => allowed(role, g)).map(shape).filter((g) => g.href || g.items.length > 0);
  const settings = shape(NAV_SETTINGS);
  return { main, settings: settings.items.length > 0 ? settings : null };
}

const matches = (pathname: string, href: string): boolean => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

/** Grupo y entrada activos para una ruta: gana la coincidencia más específica (p. ej. /companies/import sobre /companies). */
export function activeFor(groups: VisibleGroup[], pathname: string): { groupId: string | null; href: string | null } {
  let best: { groupId: string; href: string } | null = null;
  for (const g of groups) {
    const hrefs = g.href ? [g.href] : g.items.map((i) => i.href);
    for (const href of hrefs) if (matches(pathname, href) && (!best || href.length > best.href.length)) best = { groupId: g.id, href };
  }
  return best ?? { groupId: null, href: null };
}

export interface UiPrefs { navCollapsed: boolean }

/** Lee las preferencias guardadas descartando lo que no tenga la forma esperada. */
export function parseUiPrefs(raw: unknown): UiPrefs {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return { navCollapsed: o.navCollapsed === true };
}
