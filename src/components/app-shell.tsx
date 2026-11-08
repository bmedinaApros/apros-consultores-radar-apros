import { ChromeProvider, SideNav, Topbar } from "./chrome";
import { visibleNav } from "@/lib/nav";
import { ROLE_LABELS } from "@/lib/rbac";
import { csrfToken, type SessionUser } from "@/lib/session";

/**
 * Marco de todas las pantallas: menú lateral por tareas (colapsable, con panel móvil), barra superior con búsqueda
 * global y menú de cuenta, y el contenido. El grupo y la página activos se calculan en el cliente a partir de la ruta.
 */
export function AppShell({ user, children }: { user: SessionUser; current?: string; children: React.ReactNode }) {
  const { main, settings } = visibleNav(user.role);
  return (
    <ChromeProvider initialCollapsed={user.uiPrefs.navCollapsed}>
      <SideNav main={main} settings={settings} />
      <div className="content-col">
        <Topbar user={{ name: user.name, email: user.email, roleLabel: ROLE_LABELS[user.role] }} csrf={csrfToken(user.csrfSecret)} />
        <main id="contenido" className="main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </ChromeProvider>
  );
}
