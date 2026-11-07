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
  "analysis.run",
  "weekly.read",
  "weekly.run",
  "scoring.adjust",
  "diagnostics.write",
  "diagnostics.approve",
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
    "weekly.read",
    "weekly.run",
    "scoring.adjust",
    "diagnostics.write",
    "pipeline.write",
    "analysis.run",
    "dashboard.read",
  ],
  salesperson: ["companies.read", "companies.write", "analysis.run", "weekly.read", "pipeline.write", "dashboard.read"],
  consultant: [
    "companies.read",
    "weekly.read",
    "scoring.adjust",
    "diagnostics.write",
    "diagnostics.approve",
    "analysis.run",
    "dashboard.read",
  ],
  read_only: ["companies.read", "weekly.read", "dashboard.read"],
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
