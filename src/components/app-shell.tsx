import Image from "next/image";
import Link from "next/link";
import { csrfToken, type SessionUser } from "@/lib/session";
import { ROLE_LABELS, can } from "@/lib/rbac";

interface NavItem {
  href: string;
  label: string;
  show: boolean;
}

export function AppShell({ user, current, children }: { user: SessionUser; current: string; children: React.ReactNode }) {
  const items: NavItem[] = [
    { href: "/", label: "Inicio", show: true },
    { href: "/admin/users", label: "Usuarios", show: can(user.role, "users.manage") },
    { href: "/admin/audit", label: "Auditoría", show: can(user.role, "audit.read") },
  ];
  return (
    <div className="shell">
      <aside className="sidebar">
        <Image className="logo" src="/brand/apros-logotipo-horizontal-blanco.png" alt="APROS" width={512} height={112} unoptimized priority />
        <nav className="nav" aria-label="Principal">
          {items.filter((i) => i.show).map((i) => (
            <Link key={i.href} href={i.href} aria-current={i.href === current ? "page" : undefined}>
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="user">
          <strong>{user.name || user.email}</strong>
          {ROLE_LABELS[user.role]}
          <form action="/api/auth/logout" method="post" className="stack">
            <input type="hidden" name="csrf" value={csrfToken(user.csrfSecret)} />
            <button className="btn btn-secondary btn-small" type="submit">Cerrar sesión</button>
          </form>
        </div>
      </aside>
      <main id="contenido" className="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
