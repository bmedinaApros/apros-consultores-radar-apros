export const ROLES = ["admin", "sales_lead", "salesperson", "consultant", "read_only"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  sales_lead: "Líder comercial",
  salesperson: "Vendedor",
  consultant: "Consultor",
  read_only: "Lectura",
};

export const PERMISSIONS = [
  "users.read",
  "users.manage",
  "audit.read",
  "catalog.manage", // rubros, señales, modelos, servicios
  "sources.manage",
  "dnc.manage",
  "companies.read",
  "companies.write",
  "companies.import",
  "registry.read", // ver el padrón y sus locales
  "registry.promote", // pasar empresas del padrón a empresas de trabajo
  "registry.import", // cargar archivos del padrón
  "analysis.run",
  "weekly.read",
  "weekly.run",
  "weekly.review",
  "scoring.adjust",
  "diagnostics.write",
  "diagnostics.approve",
  "diagnostics.export",
  "pipeline.write",
  "dashboard.read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  sales_lead: [
    "audit.read",
    "dnc.manage",
    "companies.read",
    "companies.write",
    "companies.import",
    "registry.read",
    "registry.promote",
    "registry.import",
    "weekly.read",
    "weekly.run",
    "weekly.review",
    "scoring.adjust",
    "diagnostics.write",
    "diagnostics.export",
    "pipeline.write",
    "analysis.run",
    "dashboard.read",
  ],
  salesperson: ["companies.read", "companies.write", "registry.read", "registry.promote", "analysis.run", "weekly.read", "pipeline.write", "diagnostics.export", "dashboard.read"],
  consultant: [
    "companies.read",
    "registry.read",
    "registry.promote",
    "weekly.read",
    "weekly.review",
    "scoring.adjust",
    "diagnostics.write",
    "diagnostics.approve",
    "diagnostics.export",
    "analysis.run",
    "dashboard.read",
  ],
  read_only: ["companies.read", "registry.read", "weekly.read", "dashboard.read"],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

export interface Actor {
  id: string;
  role: Role;
}

export interface OwnedResource {
  ownerId: string | null;
}

/**
 * Autorización por objeto. Un vendedor solo modifica lo que le pertenece o lo que no tiene dueño;
 * quienes pueden gestionar el equipo (admin, líder) modifican todo.
 */
export function canModifyOwned(actor: Actor, resource: OwnedResource, permission: Permission): boolean {
  if (!can(actor.role, permission)) return false;
  if (actor.role === "admin" || actor.role === "sales_lead") return true;
  if (actor.role === "salesperson") return resource.ownerId === null || resource.ownerId === actor.id;
  return false;
}

export class ForbiddenError extends Error {
  constructor(message = "No tienes permiso para esta acción") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function requirePermission(actor: { role: Role }, permission: Permission): void {
  if (!can(actor.role, permission)) throw new ForbiddenError();
}
