import path from "node:path";
import { COMMON_SIGNALS } from "../analyzer/observations";
import { COMMERCIAL_LABELS, KIND_LABELS, type Opportunity } from "./schema";
import type { Exportable } from "./service";

export const BRAND = {
  navy: "#070926", indigo: "#232391", blue: "#0054FC", cyan: "#00CEFF", teal: "#15F2C6", white: "#FFFFFF",
  gray900: "#1A1D3A", gray600: "#5B5F7A", gray400: "#A3A6BD", gray200: "#E3E5EF", gray50: "#F5F7FC",
} as const;

const root = process.cwd();
export const ASSETS = {
  logoWhite: path.join(root, "assets/brand/apros-logotipo-horizontal-blanco.png"),
  logoColor: path.join(root, "assets/brand/apros-logotipo-horizontal-color.png"),
  questrial: path.join(root, "assets/fonts/questrial-latin-400-normal.woff"),
  roboto400: path.join(root, "assets/fonts/roboto-latin-400-normal.woff"),
  roboto500: path.join(root, "assets/fonts/roboto-latin-500-normal.woff"),
  roboto700: path.join(root, "assets/fonts/roboto-latin-700-normal.woff"),
};

/** Solo caracteres que las fuentes de la marca (subconjunto latino) pueden dibujar. */
export const safeText = (s: string): string =>
  s.replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, " ").replace(/[^ -ɏ–—‘’“”•…€→]/g, "").replace(/\s+/g, " ").trim();

export const fmtDate = (d: Date): string => new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Lima" }).format(d);

export const kindLabel = (o: Opportunity) => KIND_LABELS[o.kind];
export const modelLabel = (o: Opportunity) => COMMERCIAL_LABELS[o.commercialModel];
export const priorityLabel = (o: Opportunity) => ({ alta: "Prioridad alta", media: "Prioridad media", baja: "Prioridad baja" })[o.priority];

export function evidenceLine(x: Exportable, o: Opportunity): string {
  const names = o.evidence
    .map((id) => x.evidence.get(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .map((e) => COMMON_SIGNALS.find((s) => s.code === e.signal_code)?.name ?? e.signal_code);
  const date = x.evidenceDate ? fmtDate(x.evidenceDate) : "";
  if (o.kind === "hipotesis" && names.length === 0) return "Hipótesis a validar con la empresa.";
  return names.length ? `Evidencia: ${[...new Set(names)].join(", ")} · ${x.companyDomain}${date ? `, ${date}` : ""}` : "";
}

export const LEGEND = (x: Exportable) =>
  `Basado en información pública del sitio${x.evidenceDate ? ` al ${fmtDate(x.evidenceDate)}` : ""}. Las hipótesis requieren validación con la empresa. Documento revisado y aprobado por el equipo de APROS.`;
