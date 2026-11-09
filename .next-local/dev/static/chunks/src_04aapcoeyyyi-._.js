(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/actions/data:bef524 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "setNavCollapsed",
    ()=>$$RSC_SERVER_ACTION_0
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"408fcf24fa4953c5b13b3fc77f5aa5d69f4be9a29d":{"name":"setNavCollapsed"}},"src/app/actions/nav.ts",""] */ "use turbopack: no side effects";
;
const $$RSC_SERVER_ACTION_0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("408fcf24fa4953c5b13b3fc77f5aa5d69f4be9a29d", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "setNavCollapsed");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/registry/select-all.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SelectAll",
    ()=>SelectAll
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function SelectAll({ formId }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        className: "btn btn-secondary btn-small",
        onClick: (e)=>{
            const boxes = Array.from(document.querySelectorAll(`#${formId} input[type=checkbox][name=ruc]:not(:disabled)`));
            const allOn = boxes.length > 0 && boxes.every((b)=>b.checked);
            boxes.forEach((b)=>{
                b.checked = !allOn;
            });
            e.currentTarget.textContent = allOn ? "Seleccionar la página" : "Quitar selección";
        },
        children: "Seleccionar la página"
    }, void 0, false, {
        fileName: "[project]/src/app/registry/select-all.tsx",
        lineNumber: 6,
        columnNumber: 5
    }, this);
}
_c = SelectAll;
var _c;
__turbopack_context__.k.register(_c, "SelectAll");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/chrome.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChromeProvider",
    ()=>ChromeProvider,
    "SideNav",
    ()=>SideNav,
    "Topbar",
    ()=>Topbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$image$2d$component$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__Image__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/image-component.js [app-client] (ecmascript) <export Image as default>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Ellipsis$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/ellipsis.mjs [app-client] (ecmascript) <export default as Ellipsis>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSearch$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-search.mjs [app-client] (ecmascript) <export default as FileSearch>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__House$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/house.mjs [app-client] (ecmascript) <export default as House>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.mjs [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$panel$2d$left$2d$close$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PanelLeftClose$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/panel-left-close.mjs [app-client] (ecmascript) <export default as PanelLeftClose>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$panel$2d$left$2d$open$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PanelLeftOpen$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/panel-left-open.mjs [app-client] (ecmascript) <export default as PanelLeftOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.mjs [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.mjs [app-client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/nav.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$data$3a$bef524__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/app/actions/data:bef524 [app-client] (ecmascript) <text/javascript>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature(), _s5 = __turbopack_context__.k.signature(), _s6 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
const ICONS = {
    home: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__House$3e$__["House"],
    prospect: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"],
    analyze: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSearch$3e$__["FileSearch"],
    settings: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"],
    upload: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"],
    more: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Ellipsis$3e$__["Ellipsis"]
};
const ICON = {
    size: 20,
    strokeWidth: 1.75,
    "aria-hidden": true
};
const MOBILE_QUERY = "(max-width: 800px)";
const subscribeMobile = (cb)=>{
    const m = window.matchMedia(MOBILE_QUERY);
    m.addEventListener("change", cb);
    return ()=>m.removeEventListener("change", cb);
};
const useIsMobile = ()=>{
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"])(subscribeMobile, {
        "useIsMobile.useSyncExternalStore": ()=>window.matchMedia(MOBILE_QUERY).matches
    }["useIsMobile.useSyncExternalStore"], {
        "useIsMobile.useSyncExternalStore": ()=>false
    }["useIsMobile.useSyncExternalStore"]);
};
_s(useIsMobile, "FpwL93IKMLJZuQQXefVtWynbBPQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"]
    ];
});
const isEditable = (t)=>{
    const el = t;
    return !!el && (el.isContentEditable || [
        "INPUT",
        "TEXTAREA",
        "SELECT"
    ].includes(el.tagName));
};
const Ctx = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
const useChrome = ()=>{
    _s1();
    const c = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(Ctx);
    if (!c) throw new Error("ChromeProvider ausente");
    return c;
};
_s1(useChrome, "rCFJOMMDYLWM7qBzTJAGkiO6eRA=");
function ChromeProvider({ initialCollapsed, children }) {
    _s2();
    const [collapsed, setCollapsed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialCollapsed);
    const [mobileOpen, setMobileOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const isMobile = useIsMobile();
    const menuButtonRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const collapsedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(initialCollapsed);
    const toggleCollapsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ChromeProvider.useCallback[toggleCollapsed]": ()=>{
            const next = !collapsedRef.current;
            collapsedRef.current = next;
            setCollapsed(next);
            void (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$data$3a$bef524__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["setNavCollapsed"])(next).catch({
                "ChromeProvider.useCallback[toggleCollapsed]": ()=>undefined
            }["ChromeProvider.useCallback[toggleCollapsed]"]); // si no se puede guardar, igual se aplica en pantalla
        }
    }["ChromeProvider.useCallback[toggleCollapsed]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChromeProvider.useEffect": ()=>{
            const onKey = {
                "ChromeProvider.useEffect.onKey": (e)=>{
                    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "b" && !isEditable(e.target) && !isMobile) {
                        e.preventDefault();
                        toggleCollapsed();
                    }
                }
            }["ChromeProvider.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "ChromeProvider.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["ChromeProvider.useEffect"];
        }
    }["ChromeProvider.useEffect"], [
        toggleCollapsed,
        isMobile
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ChromeProvider.useMemo[value]": ()=>({
                collapsed,
                isMobile,
                mobileOpen,
                toggleCollapsed,
                setMobileOpen,
                menuButtonRef
            })
    }["ChromeProvider.useMemo[value]"], [
        collapsed,
        isMobile,
        mobileOpen,
        toggleCollapsed
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Ctx.Provider, {
        value: value,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "shell",
            "data-collapsed": collapsed && !isMobile ? "true" : "false",
            children: children
        }, void 0, false, {
            fileName: "[project]/src/components/chrome.tsx",
            lineNumber: 64,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/chrome.tsx",
        lineNumber: 63,
        columnNumber: 5
    }, this);
}
_s2(ChromeProvider, "Af52v6iNv7lLKQWZBkISpgnhYhs=", false, function() {
    return [
        useIsMobile
    ];
});
_c = ChromeProvider;
function SideNav({ main, settings }) {
    _s3();
    const { collapsed: prefCollapsed, isMobile, mobileOpen, setMobileOpen, toggleCollapsed, menuButtonRef } = useChrome();
    const collapsed = prefCollapsed && !isMobile;
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const all = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SideNav.useMemo[all]": ()=>settings ? [
                ...main,
                settings
            ] : main
    }["SideNav.useMemo[all]"], [
        main,
        settings
    ]);
    const active = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SideNav.useMemo[active]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$nav$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["activeFor"])(all, pathname)
    }["SideNav.useMemo[active]"], [
        all,
        pathname
    ]);
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "SideNav.useState": ()=>active.groupId && all.find({
                "SideNav.useState": (g)=>g.id === active.groupId
            }["SideNav.useState"])?.items.length ? active.groupId : null
    }["SideNav.useState"]);
    const [fly, setFly] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [pinned, setPinned] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const asideRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    // Al elegir una entrada se cierran el panel flotante y el panel móvil. (Cada pantalla vuelve a dibujar el marco con
    // el grupo activo abierto, así que no hace falta sincronizar el estado con la ruta.)
    const closeAll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SideNav.useCallback[closeAll]": ()=>{
            setFly(null);
            setPinned(false);
            setMobileOpen(false);
        }
    }["SideNav.useCallback[closeAll]"], [
        setMobileOpen
    ]);
    // Panel flotante: se cierra al hacer clic fuera.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SideNav.useEffect": ()=>{
            if (!fly) return;
            const onDown = {
                "SideNav.useEffect.onDown": (e)=>{
                    if (!asideRef.current?.contains(e.target)) {
                        setFly(null);
                        setPinned(false);
                    }
                }
            }["SideNav.useEffect.onDown"];
            document.addEventListener("pointerdown", onDown);
            return ({
                "SideNav.useEffect": ()=>document.removeEventListener("pointerdown", onDown)
            })["SideNav.useEffect"];
        }
    }["SideNav.useEffect"], [
        fly
    ]);
    // Panel móvil: foco dentro, Esc cierra, el foco vuelve al botón y no se desplaza el fondo.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SideNav.useEffect": ()=>{
            if (!isMobile || !mobileOpen) return;
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            asideRef.current?.querySelector("a, button")?.focus();
            const btn = menuButtonRef.current;
            return ({
                "SideNav.useEffect": ()=>{
                    document.body.style.overflow = prev;
                    btn?.focus();
                }
            })["SideNav.useEffect"];
        }
    }["SideNav.useEffect"], [
        isMobile,
        mobileOpen,
        menuButtonRef
    ]);
    const onAsideKey = (e)=>{
        if (!isMobile || !mobileOpen) return;
        if (e.key === "Escape") {
            e.preventDefault();
            setMobileOpen(false);
            return;
        }
        if (e.key !== "Tab") return;
        const f = Array.from(asideRef.current?.querySelectorAll("a[href], button:not([disabled]), input, select") ?? []).filter((n)=>n.offsetParent !== null);
        if (f.length === 0) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };
    const group = (g)=>{
        const Icon = ICONS[g.icon];
        const groupActive = active.groupId === g.id;
        if (g.href) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                className: "nav-item",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: g.href,
                    className: "nav-btn",
                    "data-active": groupActive || undefined,
                    "aria-current": active.href === g.href ? "page" : undefined,
                    onClick: closeAll,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                            ...ICON
                        }, void 0, false, {
                            fileName: "[project]/src/components/chrome.tsx",
                            lineNumber: 123,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "nav-label",
                            children: g.label
                        }, void 0, false, {
                            fileName: "[project]/src/components/chrome.tsx",
                            lineNumber: 123,
                            columnNumber: 31
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "rail-tip",
                            "aria-hidden": "true",
                            children: g.label
                        }, void 0, false, {
                            fileName: "[project]/src/components/chrome.tsx",
                            lineNumber: 123,
                            columnNumber: 75
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/chrome.tsx",
                    lineNumber: 122,
                    columnNumber: 11
                }, this)
            }, g.id, false, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 121,
                columnNumber: 9
            }, this);
        }
        const subId = `${uid}-${g.id}`;
        const shown = collapsed ? fly === g.id : open === g.id;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
            className: "nav-item",
            onMouseEnter: ()=>{
                if (collapsed && !pinned) setFly(g.id);
            },
            onMouseLeave: ()=>{
                if (collapsed && !pinned) setFly(null);
            },
            onBlur: (e)=>{
                if (collapsed && !e.currentTarget.contains(e.relatedTarget)) {
                    setFly(null);
                    setPinned(false);
                }
            },
            onKeyDown: (e)=>{
                if (collapsed && e.key === "Escape" && fly === g.id) {
                    e.preventDefault();
                    setFly(null);
                    setPinned(false);
                    e.currentTarget.querySelector("button")?.focus();
                }
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    className: "nav-btn",
                    "data-active": groupActive || undefined,
                    "aria-current": groupActive ? "true" : undefined,
                    "aria-expanded": shown,
                    "aria-controls": subId,
                    onClick: ()=>{
                        if (collapsed) {
                            if (fly === g.id && pinned) {
                                setFly(null);
                                setPinned(false);
                            } else {
                                setFly(g.id);
                                setPinned(true);
                            }
                        } else setOpen(open === g.id ? null : g.id); // acordeón: solo un grupo abierto
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                            ...ICON
                        }, void 0, false, {
                            fileName: "[project]/src/components/chrome.tsx",
                            lineNumber: 146,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "nav-label",
                            children: g.label
                        }, void 0, false, {
                            fileName: "[project]/src/components/chrome.tsx",
                            lineNumber: 146,
                            columnNumber: 29
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                            className: "nav-chevron",
                            size: 16,
                            strokeWidth: 1.75,
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/src/components/chrome.tsx",
                            lineNumber: 147,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "rail-tip",
                            "aria-hidden": "true",
                            children: g.label
                        }, void 0, false, {
                            fileName: "[project]/src/components/chrome.tsx",
                            lineNumber: 148,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/chrome.tsx",
                    lineNumber: 138,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    id: subId,
                    className: "sub",
                    hidden: !shown,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "sub-title",
                            "aria-hidden": "true",
                            children: g.label
                        }, void 0, false, {
                            fileName: "[project]/src/components/chrome.tsx",
                            lineNumber: 151,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                            children: g.items.map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: i.href,
                                        "aria-current": active.href === i.href ? "page" : undefined,
                                        onClick: closeAll,
                                        children: i.label
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/chrome.tsx",
                                        lineNumber: 154,
                                        columnNumber: 32
                                    }, this)
                                }, i.href, false, {
                                    fileName: "[project]/src/components/chrome.tsx",
                                    lineNumber: 154,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/chrome.tsx",
                            lineNumber: 152,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/chrome.tsx",
                    lineNumber: 150,
                    columnNumber: 9
                }, this)
            ]
        }, g.id, true, {
            fileName: "[project]/src/components/chrome.tsx",
            lineNumber: 131,
            columnNumber: 7
        }, this);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            isMobile && mobileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "nav-backdrop",
                onClick: ()=>setMobileOpen(false),
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 164,
                columnNumber: 34
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                id: "sidebar",
                ref: asideRef,
                className: "sidebar",
                "data-collapsed": collapsed ? "true" : "false",
                "data-open": mobileOpen ? "true" : "false",
                role: isMobile ? "dialog" : undefined,
                "aria-modal": isMobile ? true : undefined,
                "aria-label": isMobile ? "Menú principal" : undefined,
                onKeyDown: onAsideKey,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "sidebar-head",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$image$2d$component$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__Image__as__default$3e$__["default"], {
                                className: "logo",
                                src: "/brand/apros-logotipo-horizontal-blanco.png",
                                alt: "APROS",
                                width: 512,
                                height: 112,
                                unoptimized: true,
                                priority: true
                            }, void 0, false, {
                                fileName: "[project]/src/components/chrome.tsx",
                                lineNumber: 171,
                                columnNumber: 11
                            }, this),
                            isMobile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "icon-btn",
                                onClick: ()=>setMobileOpen(false),
                                "aria-label": "Cerrar menú",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    ...ICON
                                }, void 0, false, {
                                    fileName: "[project]/src/components/chrome.tsx",
                                    lineNumber: 172,
                                    columnNumber: 129
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/chrome.tsx",
                                lineNumber: 172,
                                columnNumber: 24
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 170,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        id: "main-nav",
                        "aria-label": "Principal",
                        className: "nav2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "nav-list",
                                children: main.map(group)
                            }, void 0, false, {
                                fileName: "[project]/src/components/chrome.tsx",
                                lineNumber: 175,
                                columnNumber: 11
                            }, this),
                            settings && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "nav-list nav-settings",
                                children: group(settings)
                            }, void 0, false, {
                                fileName: "[project]/src/components/chrome.tsx",
                                lineNumber: 176,
                                columnNumber: 24
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 174,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "sidebar-foot",
                        children: !isMobile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "nav-btn nav-toggle",
                            onClick: toggleCollapsed,
                            "aria-expanded": !collapsed,
                            "aria-controls": "main-nav",
                            "aria-keyshortcuts": "Control+B Meta+B",
                            title: "Ctrl/⌘ + B",
                            children: [
                                collapsed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$panel$2d$left$2d$open$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PanelLeftOpen$3e$__["PanelLeftOpen"], {
                                    ...ICON
                                }, void 0, false, {
                                    fileName: "[project]/src/components/chrome.tsx",
                                    lineNumber: 184,
                                    columnNumber: 28
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$panel$2d$left$2d$close$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PanelLeftClose$3e$__["PanelLeftClose"], {
                                    ...ICON
                                }, void 0, false, {
                                    fileName: "[project]/src/components/chrome.tsx",
                                    lineNumber: 184,
                                    columnNumber: 58
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "nav-label",
                                    children: collapsed ? "Expandir menú" : "Colapsar menú"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/chrome.tsx",
                                    lineNumber: 185,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "rail-tip",
                                    "aria-hidden": "true",
                                    children: collapsed ? "Expandir menú" : "Colapsar menú"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/chrome.tsx",
                                    lineNumber: 186,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/chrome.tsx",
                            lineNumber: 180,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 165,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/chrome.tsx",
        lineNumber: 163,
        columnNumber: 5
    }, this);
}
_s3(SideNav, "F69Hg/vYF3jkhob6j4BycEjiwoA=", false, function() {
    return [
        useChrome,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c1 = SideNav;
/** Búsqueda global por RUC, razón social o dominio (patrón combobox accesible). Atajo: «/». */ function GlobalSearch() {
    _s4();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [q, setQ] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [hits, setHits] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("idle");
    const [activeIdx, setActiveIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(-1);
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const boxRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    const listId = `${uid}-list`;
    const term = q.trim();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GlobalSearch.useEffect": ()=>{
            const onKey = {
                "GlobalSearch.useEffect.onKey": (e)=>{
                    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditable(e.target)) {
                        e.preventDefault();
                        inputRef.current?.focus();
                    }
                }
            }["GlobalSearch.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "GlobalSearch.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["GlobalSearch.useEffect"];
        }
    }["GlobalSearch.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GlobalSearch.useEffect": ()=>{
            if (term.length < 3) return;
            const ctl = new AbortController();
            const t = setTimeout({
                "GlobalSearch.useEffect.t": async ()=>{
                    setStatus("loading");
                    try {
                        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
                            signal: ctl.signal,
                            credentials: "same-origin"
                        });
                        if (!r.ok) throw new Error(String(r.status));
                        const data = await r.json();
                        setHits(data.hits);
                        setActiveIdx(-1);
                        setStatus("idle");
                    } catch (e) {
                        if (e.name !== "AbortError") setStatus("error");
                    }
                }
            }["GlobalSearch.useEffect.t"], 250);
            return ({
                "GlobalSearch.useEffect": ()=>{
                    clearTimeout(t);
                    ctl.abort();
                }
            })["GlobalSearch.useEffect"];
        }
    }["GlobalSearch.useEffect"], [
        term
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GlobalSearch.useEffect": ()=>{
            const onDown = {
                "GlobalSearch.useEffect.onDown": (e)=>{
                    if (!boxRef.current?.contains(e.target)) setOpen(false);
                }
            }["GlobalSearch.useEffect.onDown"];
            document.addEventListener("pointerdown", onDown);
            return ({
                "GlobalSearch.useEffect": ()=>document.removeEventListener("pointerdown", onDown)
            })["GlobalSearch.useEffect"];
        }
    }["GlobalSearch.useEffect"], []);
    const go = (h)=>{
        setOpen(false);
        router.push(h ? h.kind === "registry" ? `/registry/${h.id}` : `/companies/${h.id}` : `/registry?q=${encodeURIComponent(term)}`);
    };
    const shown = term.length >= 3 ? hits : [];
    const onKeyDown = (e)=>{
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActiveIdx((i)=>Math.min(shown.length - 1, i + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i)=>Math.max(-1, i - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (term.length >= 3) go(shown[activeIdx]);
        } else if (e.key === "Escape") {
            if (open) {
                e.preventDefault();
                setOpen(false);
            } else setQ("");
        }
    };
    const showList = open && term.length >= 3;
    const message = status === "loading" ? "Buscando…" : status === "error" ? "No se pudo buscar. Inténtalo de nuevo." : shown.length === 0 ? "Sin coincidencias en las empresas de trabajo." : `${shown.length} resultado${shown.length === 1 ? "" : "s"}`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "gsearch",
        ref: boxRef,
        role: "search",
        "aria-label": "Búsqueda global",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                htmlFor: `${uid}-input`,
                className: "sr-only",
                children: "Buscar por RUC, razón social o dominio"
            }, void 0, false, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 256,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                className: "gsearch-icon",
                size: 18,
                strokeWidth: 1.75,
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 257,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                id: `${uid}-input`,
                ref: inputRef,
                type: "search",
                value: q,
                maxLength: 100,
                autoComplete: "off",
                placeholder: "Buscar RUC, razón social o dominio  ( / )",
                role: "combobox",
                "aria-expanded": showList,
                "aria-controls": listId,
                "aria-autocomplete": "list",
                "aria-activedescendant": showList && activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined,
                onChange: (e)=>{
                    setQ(e.target.value);
                    setOpen(true);
                },
                onFocus: ()=>setOpen(true),
                onKeyDown: onKeyDown
            }, void 0, false, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 258,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "status",
                "aria-live": "polite",
                className: "sr-only",
                children: showList ? message : ""
            }, void 0, false, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 263,
                columnNumber: 7
            }, this),
            showList && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                id: listId,
                role: "listbox",
                "aria-label": "Resultados de búsqueda",
                className: "gsearch-list",
                children: shown.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                    className: "gsearch-empty",
                    role: "presentation",
                    children: message
                }, void 0, false, {
                    fileName: "[project]/src/components/chrome.tsx",
                    lineNumber: 266,
                    columnNumber: 33
                }, this) : shown.map((h, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        id: `${listId}-${i}`,
                        role: "option",
                        "aria-selected": i === activeIdx,
                        "data-active": i === activeIdx || undefined,
                        onMouseEnter: ()=>setActiveIdx(i),
                        onMouseDown: (e)=>e.preventDefault(),
                        onClick: ()=>go(h),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: h.name
                            }, void 0, false, {
                                fileName: "[project]/src/components/chrome.tsx",
                                lineNumber: 271,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "muted",
                                children: [
                                    h.ruc,
                                    h.domain,
                                    h.industry
                                ].filter(Boolean).join(" · ") || "sin datos"
                            }, void 0, false, {
                                fileName: "[project]/src/components/chrome.tsx",
                                lineNumber: 272,
                                columnNumber: 15
                            }, this),
                            h.kind === "registry" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "badge badge-info",
                                children: "En el padrón, aún no en la base"
                            }, void 0, false, {
                                fileName: "[project]/src/components/chrome.tsx",
                                lineNumber: 273,
                                columnNumber: 41
                            }, this),
                            h.dnc && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "badge badge-off",
                                children: "No contactar"
                            }, void 0, false, {
                                fileName: "[project]/src/components/chrome.tsx",
                                lineNumber: 274,
                                columnNumber: 25
                            }, this)
                        ]
                    }, h.id, true, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 267,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 265,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/chrome.tsx",
        lineNumber: 255,
        columnNumber: 5
    }, this);
}
_s4(GlobalSearch, "aF8ITSl6bdGnm6QgACEBjRODl9w=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c2 = GlobalSearch;
/** Menú de la cuenta (nombre, cambio de clave y cierre de sesión): siempre accesible, esté o no colapsado el menú lateral. */ function AccountMenu({ user, csrf }) {
    _s5();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const boxRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const btnRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const panelId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AccountMenu.useEffect": ()=>{
            if (!open) return;
            const onDown = {
                "AccountMenu.useEffect.onDown": (e)=>{
                    if (!boxRef.current?.contains(e.target)) setOpen(false);
                }
            }["AccountMenu.useEffect.onDown"];
            document.addEventListener("pointerdown", onDown);
            return ({
                "AccountMenu.useEffect": ()=>document.removeEventListener("pointerdown", onDown)
            })["AccountMenu.useEffect"];
        }
    }["AccountMenu.useEffect"], [
        open
    ]);
    const initial = (user.name || user.email).trim().charAt(0).toUpperCase();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "account",
        ref: boxRef,
        onKeyDown: (e)=>{
            if (e.key === "Escape" && open) {
                e.preventDefault();
                setOpen(false);
                btnRef.current?.focus();
            }
        },
        onBlur: (e)=>{
            if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                ref: btnRef,
                type: "button",
                className: "account-btn",
                "aria-label": `Cuenta de ${user.name || user.email}`,
                "aria-expanded": open,
                "aria-controls": panelId,
                onClick: ()=>setOpen((v)=>!v),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "avatar",
                        "aria-hidden": "true",
                        children: initial
                    }, void 0, false, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 303,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "account-name",
                        children: user.name || user.email
                    }, void 0, false, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 304,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        size: 16,
                        strokeWidth: 1.75,
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 305,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 302,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                id: panelId,
                className: "account-panel",
                hidden: !open,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: user.name || user.email
                    }, void 0, false, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 308,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "muted",
                        children: user.email
                    }, void 0, false, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 309,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "muted",
                        children: user.roleLabel
                    }, void 0, false, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 310,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/account/password",
                        children: "Cambiar mi clave"
                    }, void 0, false, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 311,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        action: "/api/auth/logout",
                        method: "post",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "csrf",
                                value: csrf
                            }, void 0, false, {
                                fileName: "[project]/src/components/chrome.tsx",
                                lineNumber: 313,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn btn-secondary btn-small",
                                type: "submit",
                                children: "Cerrar sesión"
                            }, void 0, false, {
                                fileName: "[project]/src/components/chrome.tsx",
                                lineNumber: 314,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/chrome.tsx",
                        lineNumber: 312,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 307,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/chrome.tsx",
        lineNumber: 297,
        columnNumber: 5
    }, this);
}
_s5(AccountMenu, "AQFKQ9vJCLUgTTsDcVBTXolwupQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c3 = AccountMenu;
function Topbar({ user, csrf }) {
    _s6();
    const { isMobile, mobileOpen, setMobileOpen, menuButtonRef } = useChrome();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "topbar",
        children: [
            isMobile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                ref: menuButtonRef,
                type: "button",
                className: "icon-btn menu-btn",
                "aria-label": "Abrir menú",
                "aria-expanded": mobileOpen,
                "aria-controls": "sidebar",
                onClick: ()=>setMobileOpen(true),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                    size: 22,
                    strokeWidth: 1.75,
                    "aria-hidden": "true"
                }, void 0, false, {
                    fileName: "[project]/src/components/chrome.tsx",
                    lineNumber: 327,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 326,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(GlobalSearch, {}, void 0, false, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 330,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AccountMenu, {
                user: user,
                csrf: csrf
            }, void 0, false, {
                fileName: "[project]/src/components/chrome.tsx",
                lineNumber: 331,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/chrome.tsx",
        lineNumber: 324,
        columnNumber: 5
    }, this);
}
_s6(Topbar, "e+q8pNW0Rbhd5lYipg1JxRUoFEM=", false, function() {
    return [
        useChrome
    ];
});
_c4 = Topbar;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "ChromeProvider");
__turbopack_context__.k.register(_c1, "SideNav");
__turbopack_context__.k.register(_c2, "GlobalSearch");
__turbopack_context__.k.register(_c3, "AccountMenu");
__turbopack_context__.k.register(_c4, "Topbar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/nav.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NAV",
    ()=>NAV,
    "NAV_SETTINGS",
    ()=>NAV_SETTINGS,
    "activeFor",
    ()=>activeFor,
    "parseUiPrefs",
    ()=>parseUiPrefs,
    "visibleNav",
    ()=>visibleNav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$rbac$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/rbac.ts [app-client] (ecmascript)");
;
const NAV = [
    {
        id: "buscar",
        label: "Buscar",
        icon: "prospect",
        href: "/registry",
        items: []
    },
    {
        id: "cargar",
        label: "Cargar padrón",
        icon: "upload",
        href: "/registry/imports",
        items: [],
        permission: "registry.import"
    },
    {
        // Todo lo demás sigue disponible, pero fuera del camino: la tarea principal es cargar el padrón y buscar en él.
        id: "mas",
        label: "Más",
        icon: "more",
        items: [
            {
                href: "/companies",
                label: "Empresas de la base",
                permission: "companies.read"
            },
            {
                href: "/diagnostics",
                label: "Diagnósticos",
                permission: "companies.read"
            },
            {
                href: "/weekly",
                label: "Lista semanal",
                permission: "weekly.read"
            },
            {
                href: "/inbox",
                label: "Bandeja de revisión",
                permission: "weekly.read"
            },
            {
                href: "/companies/import",
                label: "Importar CSV",
                permission: "companies.import"
            },
            {
                href: "/companies/duplicates",
                label: "Duplicados",
                roles: [
                    "admin",
                    "sales_lead"
                ]
            },
            {
                href: "/admin/sources",
                label: "Fuentes",
                permission: "sources.manage"
            }
        ]
    }
];
const NAV_SETTINGS = {
    id: "configuracion",
    label: "Configuración",
    icon: "settings",
    items: [
        {
            href: "/admin/industries",
            label: "Rubros",
            permission: "catalog.manage"
        },
        {
            href: "/admin/industry-rules",
            label: "Reglas de rubro",
            permission: "catalog.manage"
        },
        {
            href: "/admin/signals",
            label: "Señales por rubro",
            permission: "catalog.manage"
        },
        {
            href: "/admin/models",
            label: "Modelos de puntaje",
            permission: "catalog.manage"
        },
        {
            href: "/admin/services",
            label: "Servicios de APROS",
            permission: "catalog.manage"
        },
        {
            href: "/admin/weekly",
            label: "Ejecución semanal",
            permission: "catalog.manage"
        },
        {
            href: "/admin/ai",
            label: "IA y presupuesto",
            permission: "catalog.manage"
        },
        {
            href: "/admin/users",
            label: "Usuarios y accesos",
            permission: "users.manage"
        },
        {
            href: "/admin/dnc",
            label: "No contactar",
            permission: "dnc.manage"
        },
        {
            href: "/admin/clients",
            label: "Clientes activos",
            permission: "catalog.manage"
        },
        {
            href: "/admin/audit",
            label: "Auditoría",
            permission: "audit.read"
        }
    ]
};
const allowed = (role, x)=>(!x.permission || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$rbac$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["can"])(role, x.permission)) && (!x.roles || x.roles.includes(role));
function visibleNav(role) {
    const shape = (g)=>({
            id: g.id,
            label: g.label,
            icon: g.icon,
            href: g.href,
            items: g.items.filter((i)=>allowed(role, i)).map(({ href, label })=>({
                    href,
                    label
                }))
        });
    const main = NAV.filter((g)=>allowed(role, g)).map(shape).filter((g)=>g.href || g.items.length > 0);
    const settings = shape(NAV_SETTINGS);
    return {
        main,
        settings: settings.items.length > 0 ? settings : null
    };
}
const matches = (pathname, href)=>href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
function activeFor(groups, pathname) {
    let best = null;
    for (const g of groups){
        const hrefs = g.href ? [
            g.href
        ] : g.items.map((i)=>i.href);
        for (const href of hrefs)if (matches(pathname, href) && (!best || href.length > best.href.length)) best = {
            groupId: g.id,
            href
        };
    }
    return best ?? {
        groupId: null,
        href: null
    };
}
function parseUiPrefs(raw) {
    const o = raw && typeof raw === "object" ? raw : {};
    return {
        navCollapsed: o.navCollapsed === true
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/rbac.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ForbiddenError",
    ()=>ForbiddenError,
    "PERMISSIONS",
    ()=>PERMISSIONS,
    "ROLES",
    ()=>ROLES,
    "ROLE_LABELS",
    ()=>ROLE_LABELS,
    "can",
    ()=>can,
    "canModifyOwned",
    ()=>canModifyOwned,
    "requirePermission",
    ()=>requirePermission
]);
const ROLES = [
    "admin",
    "sales_lead",
    "salesperson",
    "consultant",
    "read_only"
];
const ROLE_LABELS = {
    admin: "Administrador",
    sales_lead: "Líder comercial",
    salesperson: "Vendedor",
    consultant: "Consultor",
    read_only: "Lectura"
};
const PERMISSIONS = [
    "users.read",
    "users.manage",
    "audit.read",
    "catalog.manage",
    "sources.manage",
    "dnc.manage",
    "companies.read",
    "companies.write",
    "companies.import",
    "registry.read",
    "registry.promote",
    "registry.import",
    "analysis.run",
    "weekly.read",
    "weekly.run",
    "weekly.review",
    "scoring.adjust",
    "diagnostics.write",
    "diagnostics.approve",
    "diagnostics.export",
    "pipeline.write",
    "dashboard.read"
];
const MATRIX = {
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
        "dashboard.read"
    ],
    salesperson: [
        "companies.read",
        "companies.write",
        "registry.read",
        "registry.promote",
        "analysis.run",
        "weekly.read",
        "pipeline.write",
        "diagnostics.export",
        "dashboard.read"
    ],
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
        "dashboard.read"
    ],
    read_only: [
        "companies.read",
        "registry.read",
        "weekly.read",
        "dashboard.read"
    ]
};
function can(role, permission) {
    return MATRIX[role].includes(permission);
}
function canModifyOwned(actor, resource, permission) {
    if (!can(actor.role, permission)) return false;
    if (actor.role === "admin" || actor.role === "sales_lead") return true;
    if (actor.role === "salesperson") return resource.ownerId === null || resource.ownerId === actor.id;
    return false;
}
class ForbiddenError extends Error {
    constructor(message = "No tienes permiso para esta acción"){
        super(message);
        this.name = "ForbiddenError";
    }
}
function requirePermission(actor, permission) {
    if (!can(actor.role, permission)) throw new ForbiddenError();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_04aapcoeyyyi-._.js.map