"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Ellipsis, FileSearch, House, Menu, Search, Settings, Upload, X } from "lucide-react";
import {
  createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore,
  type ComponentType, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject,
} from "react";
import { activeFor, type IconKey, type VisibleGroup } from "@/lib/nav";
import { setNavCollapsed } from "@/app/actions/nav";

const ICONS: Record<IconKey, ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>> = {
  home: House, prospect: Search, analyze: FileSearch, settings: Settings, upload: Upload, more: Ellipsis,
};
const ICON = { size: 20, strokeWidth: 1.75, "aria-hidden": true } as const;

const MOBILE_QUERY = "(max-width: 800px)";
const subscribeMobile = (cb: () => void) => { const m = window.matchMedia(MOBILE_QUERY); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
const useIsMobile = () => useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE_QUERY).matches, () => false);

const isEditable = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
};

interface Chrome {
  collapsed: boolean; isMobile: boolean; mobileOpen: boolean;
  toggleCollapsed: () => void; setMobileOpen: (v: boolean) => void; menuButtonRef: RefObject<HTMLButtonElement | null>;
}
const Ctx = createContext<Chrome | null>(null);
const useChrome = (): Chrome => { const c = useContext(Ctx); if (!c) throw new Error("ChromeProvider ausente"); return c; };

/** Estado compartido del menú (colapsado, panel móvil) y atajo Ctrl/⌘+B. Dibuja el contenedor `.shell`. */
export function ChromeProvider({ initialCollapsed, children }: { initialCollapsed: boolean; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const collapsedRef = useRef(initialCollapsed);

  const toggleCollapsed = useCallback(() => {
    const next = !collapsedRef.current;
    collapsedRef.current = next;
    setCollapsed(next);
    void setNavCollapsed(next).catch(() => undefined); // si no se puede guardar, igual se aplica en pantalla
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "b" && !isEditable(e.target) && !isMobile) {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed, isMobile]);

  const value = useMemo(() => ({ collapsed, isMobile, mobileOpen, toggleCollapsed, setMobileOpen, menuButtonRef }), [collapsed, isMobile, mobileOpen, toggleCollapsed]);
  return (
    <Ctx.Provider value={value}>
      <div className="shell" data-collapsed={collapsed && !isMobile ? "true" : "false"}>{children}</div>
    </Ctx.Provider>
  );
}

interface SideNavProps { main: VisibleGroup[]; settings: VisibleGroup | null }

export function SideNav({ main, settings }: SideNavProps) {
  const { collapsed: prefCollapsed, isMobile, mobileOpen, setMobileOpen, toggleCollapsed, menuButtonRef } = useChrome();
  const collapsed = prefCollapsed && !isMobile;
  const pathname = usePathname();
  const all = useMemo(() => (settings ? [...main, settings] : main), [main, settings]);
  const active = useMemo(() => activeFor(all, pathname), [all, pathname]);
  const [open, setOpen] = useState<string | null>(() => (active.groupId && all.find((g) => g.id === active.groupId)?.items.length ? active.groupId : null));
  const [fly, setFly] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);
  const uid = useId();

  // Al elegir una entrada se cierran el panel flotante y el panel móvil. (Cada pantalla vuelve a dibujar el marco con
  // el grupo activo abierto, así que no hace falta sincronizar el estado con la ruta.)
  const closeAll = useCallback(() => { setFly(null); setPinned(false); setMobileOpen(false); }, [setMobileOpen]);

  // Panel flotante: se cierra al hacer clic fuera.
  useEffect(() => {
    if (!fly) return;
    const onDown = (e: PointerEvent) => { if (!asideRef.current?.contains(e.target as Node)) { setFly(null); setPinned(false); } };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [fly]);

  // Panel móvil: foco dentro, Esc cierra, el foco vuelve al botón y no se desplaza el fondo.
  useEffect(() => {
    if (!isMobile || !mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    asideRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const btn = menuButtonRef.current;
    return () => { document.body.style.overflow = prev; btn?.focus(); };
  }, [isMobile, mobileOpen, menuButtonRef]);

  const onAsideKey = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (!isMobile || !mobileOpen) return;
    if (e.key === "Escape") { e.preventDefault(); setMobileOpen(false); return; }
    if (e.key !== "Tab") return;
    const f = Array.from(asideRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select") ?? []).filter((n) => n.offsetParent !== null);
    if (f.length === 0) return;
    const first = f[0]!, last = f[f.length - 1]!;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const group = (g: VisibleGroup) => {
    const Icon = ICONS[g.icon];
    const groupActive = active.groupId === g.id;
    if (g.href) {
      return (
        <li key={g.id} className="nav-item">
          <Link href={g.href} className="nav-btn" data-active={groupActive || undefined} aria-current={active.href === g.href ? "page" : undefined} onClick={closeAll}>
            <Icon {...ICON} /><span className="nav-label">{g.label}</span><span className="rail-tip" aria-hidden="true">{g.label}</span>
          </Link>
        </li>
      );
    }
    const subId = `${uid}-${g.id}`;
    const shown = collapsed ? fly === g.id : open === g.id;
    return (
      <li
        key={g.id} className="nav-item"
        onMouseEnter={() => { if (collapsed && !pinned) setFly(g.id); }}
        onMouseLeave={() => { if (collapsed && !pinned) setFly(null); }}
        onBlur={(e) => { if (collapsed && !e.currentTarget.contains(e.relatedTarget as Node | null)) { setFly(null); setPinned(false); } }}
        onKeyDown={(e) => { if (collapsed && e.key === "Escape" && fly === g.id) { e.preventDefault(); setFly(null); setPinned(false); e.currentTarget.querySelector<HTMLElement>("button")?.focus(); } }}
      >
        <button
          type="button" className="nav-btn" data-active={groupActive || undefined} aria-current={groupActive ? "true" : undefined}
          aria-expanded={shown} aria-controls={subId}
          onClick={() => {
            if (collapsed) { if (fly === g.id && pinned) { setFly(null); setPinned(false); } else { setFly(g.id); setPinned(true); } }
            else setOpen(open === g.id ? null : g.id); // acordeón: solo un grupo abierto
          }}
        >
          <Icon {...ICON} /><span className="nav-label">{g.label}</span>
          <ChevronDown className="nav-chevron" size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="rail-tip" aria-hidden="true">{g.label}</span>
        </button>
        <div id={subId} className="sub" hidden={!shown}>
          <p className="sub-title" aria-hidden="true">{g.label}</p>
          <ul>
            {g.items.map((i) => (
              <li key={i.href}><Link href={i.href} aria-current={active.href === i.href ? "page" : undefined} onClick={closeAll}>{i.label}</Link></li>
            ))}
          </ul>
        </div>
      </li>
    );
  };

  return (
    <>
      {isMobile && mobileOpen && <div className="nav-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <aside
        id="sidebar" ref={asideRef} className="sidebar" data-collapsed={collapsed ? "true" : "false"} data-open={mobileOpen ? "true" : "false"}
        role={isMobile ? "dialog" : undefined} aria-modal={isMobile ? true : undefined} aria-label={isMobile ? "Menú principal" : undefined}
        onKeyDown={onAsideKey}
      >
        <div className="sidebar-head">
          <Image className="logo" src="/brand/apros-logotipo-horizontal-blanco.png" alt="APROS" width={512} height={112} unoptimized priority />
          {isMobile && <button type="button" className="icon-btn" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"><X {...ICON} /></button>}
          {!isMobile && (
            <button
              type="button" className="icon-btn nav-toggle" onClick={toggleCollapsed} aria-expanded={!collapsed} aria-controls="main-nav"
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"} aria-keyshortcuts="Control+B Meta+B" title={`${collapsed ? "Expandir" : "Colapsar"} menú (Ctrl/⌘ + B)`}
            >
              {collapsed ? <ChevronRight {...ICON} /> : <ChevronLeft {...ICON} />}
            </button>
          )}
        </div>
        <nav id="main-nav" aria-label="Principal" className="nav2">
          <ul className="nav-list">{main.map(group)}</ul>
          {settings && <ul className="nav-list nav-settings">{group(settings)}</ul>}
        </nav>
      </aside>
    </>
  );
}

interface Hit { id: string; name: string; domain: string | null; ruc: string | null; industry: string | null; dnc: boolean; kind?: "company" | "registry" }

/** Búsqueda global por RUC, razón social o dominio (patrón combobox accesible). Atajo: «/». */
function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [activeIdx, setActiveIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const uid = useId();
  const listId = `${uid}-list`;
  const term = q.trim();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditable(e.target)) { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (term.length < 3) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setStatus("loading");
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal, credentials: "same-origin" });
        if (!r.ok) throw new Error(String(r.status));
        const data = (await r.json()) as { hits: Hit[] };
        setHits(data.hits); setActiveIdx(-1); setStatus("idle");
      } catch (e) { if ((e as Error).name !== "AbortError") setStatus("error"); }
    }, 250);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [term]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const go = (h: Hit | undefined) => {
    setOpen(false);
    router.push(h ? (h.kind === "registry" ? `/registry/${h.id}` : `/companies/${h.id}`) : `/registry?q=${encodeURIComponent(term)}`);
  };
  const shown = term.length >= 3 ? hits : [];
  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActiveIdx((i) => Math.min(shown.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(-1, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (term.length >= 3) go(shown[activeIdx]); }
    else if (e.key === "Escape") { if (open) { e.preventDefault(); setOpen(false); } else setQ(""); }
  };

  const showList = open && term.length >= 3;
  const message = status === "loading" ? "Buscando…" : status === "error" ? "No se pudo buscar. Inténtalo de nuevo." : shown.length === 0 ? "Sin coincidencias en las empresas de trabajo." : `${shown.length} resultado${shown.length === 1 ? "" : "s"}`;
  return (
    <div className="gsearch" ref={boxRef} role="search" aria-label="Búsqueda global">
      <label htmlFor={`${uid}-input`} className="sr-only">Buscar por RUC, razón social o dominio</label>
      <Search className="gsearch-icon" size={18} strokeWidth={1.75} aria-hidden="true" />
      <input
        id={`${uid}-input`} ref={inputRef} type="search" value={q} maxLength={100} autoComplete="off" placeholder="Buscar RUC, razón social o dominio  ( / )"
        role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={showList && activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
      />
      <div role="status" aria-live="polite" className="sr-only">{showList ? message : ""}</div>
      {showList && (
        <ul id={listId} role="listbox" aria-label="Resultados de búsqueda" className="gsearch-list">
          {shown.length === 0 ? <li className="gsearch-empty" role="presentation">{message}</li> : shown.map((h, i) => (
            <li
              key={h.id} id={`${listId}-${i}`} role="option" aria-selected={i === activeIdx} data-active={i === activeIdx || undefined}
              onMouseEnter={() => setActiveIdx(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => go(h)}
            >
              <strong>{h.name}</strong>
              <span className="muted">{[h.ruc, h.domain, h.industry].filter(Boolean).join(" · ") || "sin datos"}</span>
              {h.kind === "registry" && <span className="badge badge-info">En el padrón, aún no en la base</span>}
              {h.dnc && <span className="badge badge-off">No contactar</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Menú de la cuenta (nombre, cambio de clave y cierre de sesión): siempre accesible, esté o no colapsado el menú lateral. */
function AccountMenu({ user, csrf }: { user: { name: string; email: string; roleLabel: string }; csrf: string }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  const initial = (user.name || user.email).trim().charAt(0).toUpperCase();
  return (
    <div
      className="account" ref={boxRef}
      onKeyDown={(e) => { if (e.key === "Escape" && open) { e.preventDefault(); setOpen(false); btnRef.current?.focus(); } }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}
    >
      <button ref={btnRef} type="button" className="account-btn" aria-label={`Cuenta de ${user.name || user.email}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <span className="avatar" aria-hidden="true">{initial}</span>
        <span className="account-name">{user.name || user.email}</span>
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <div id={panelId} className="account-panel" hidden={!open}>
        <strong>{user.name || user.email}</strong>
        <span className="muted">{user.email}</span>
        <span className="muted">{user.roleLabel}</span>
        <Link href="/account/password">Cambiar mi clave</Link>
        <form action="/api/auth/logout" method="post">
          <input type="hidden" name="csrf" value={csrf} />
          <button className="btn btn-secondary btn-small" type="submit">Cerrar sesión</button>
        </form>
      </div>
    </div>
  );
}

export function Topbar({ user, csrf }: { user: { name: string; email: string; roleLabel: string }; csrf: string }) {
  const { isMobile, mobileOpen, setMobileOpen, menuButtonRef } = useChrome();
  return (
    <header className="topbar">
      {isMobile && (
        <button ref={menuButtonRef} type="button" className="icon-btn menu-btn" aria-label="Abrir menú" aria-expanded={mobileOpen} aria-controls="sidebar" onClick={() => setMobileOpen(true)}>
          <Menu size={22} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
      <GlobalSearch />
      <AccountMenu user={user} csrf={csrf} />
    </header>
  );
}
