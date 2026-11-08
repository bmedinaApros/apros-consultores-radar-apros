/**
 * Formato de los archivos del padrón reducido de SUNAT. Se interpreta por **cabecera**, nunca por posición:
 * si la cabecera no trae lo necesario, la carga se rechaza con un mensaje claro (no se adivina).
 *
 * Verificado con el archivo real «padron_reducido_local_anexo.txt» (2026-11-07): texto separado por «|»,
 * codificación Windows-1252/ISO-8859-1, cabecera con espacio inicial, «-» como valor vacío y un «|» final en cada fila.
 * El archivo principal de RUC (con razón social, estado y condición) se acepta por las mismas reglas de cabecera, pero su
 * formato real aún no se ha verificado con un archivo.
 */
export const CONNECTOR_VERSION = "sunat-padron/1";

export type FileKind = "ruc" | "local_anexo";
export class FormatError extends Error {
  override name = "FormatError";
}

export const stripAccents = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
export const normHeader = (s: string): string => stripAccents(s).replace(/^﻿/, "").replace(/\s+/g, " ").trim().toUpperCase();

const ALIASES = {
  ruc: ["RUC"],
  name: ["NOMBRE O RAZON SOCIAL", "RAZON SOCIAL", "NOMBRE / RAZON SOCIAL", "NOMBRE"],
  status: ["ESTADO DEL CONTRIBUYENTE", "ESTADO CONTRIBUYENTE", "ESTADO"],
  condition: ["CONDICION DE DOMICILIO", "CONDICION DOMICILIO", "CONDICION"],
  ubigeo: ["UBIGEO"],
  roadType: ["TIPO DE VIA"],
  road: ["NOMBRE DE VIA"],
  zoneCode: ["CODIGO DE ZONA"],
  zoneType: ["TIPO DE ZONA"],
  number: ["NUMERO"],
  km: ["KILOMETRO"],
  interior: ["INTERIOR"],
  lot: ["LOTE"],
  dpto: ["DEPARTAMENTO"],
  block: ["MANZANA"],
} as const;
type Field = keyof typeof ALIASES;

export interface Format {
  kind: FileKind;
  index: Partial<Record<Field, number>>;
  columns: number;
}

/** Detecta el tipo de archivo y dónde está cada columna. Lanza FormatError si falta algo imprescindible. */
export function detectFormat(headerLine: string): Format {
  const cols = headerLine.replace(/\r?\n$/, "").split("|").map(normHeader);
  while (cols.length && cols[cols.length - 1] === "") cols.pop(); // «|» final
  const index: Partial<Record<Field, number>> = {};
  for (const [field, names] of Object.entries(ALIASES) as [Field, readonly string[]][]) {
    const i = cols.findIndex((c) => names.includes(c));
    if (i >= 0) index[field] = i;
  }
  const missing = (need: Field[]) => need.filter((f) => index[f] === undefined);
  const kind: FileKind = index.name !== undefined ? "ruc" : "local_anexo";
  const need: Field[] = kind === "ruc" ? ["ruc", "name", "status", "condition", "ubigeo"] : ["ruc", "ubigeo", "road"];
  const lack = missing(need);
  if (lack.length) {
    throw new FormatError(
      `La cabecera del archivo no coincide con el formato esperado. Faltan: ${lack.map((f) => ALIASES[f][0]).join(", ")}. ` +
      `Columnas encontradas: ${cols.slice(0, 20).join(" | ") || "(ninguna)"}.`,
    );
  }
  return { kind, index, columns: cols.length };
}

/** «-», «----» y vacío son «sin dato». */
export const clean = (v: string | undefined): string | null => {
  const s = (v ?? "").replace(/\s+/g, " ").trim();
  return s === "" || /^-+$/.test(s) ? null : s;
};

export interface RegistryRow {
  ruc: string;
  legalName: string | null;
  status: string | null;
  condition: string | null;
  ubigeo: string | null;
  address: string | null;
}
export type RowResult = { ok: true; row: RegistryRow } | { ok: false; reason: "ruc_invalido" | "columnas" | "sin_nombre" };

/** Dirección legible a partir de los componentes (los que no tienen dato se omiten). */
export function buildAddress(g: (f: Field) => string | null): string | null {
  const parts = [
    [g("roadType"), g("road"), g("number")].filter(Boolean).join(" "),
    g("km") && g("km") !== "S/N" ? `KM ${g("km")}` : null,
    g("block") ? `MZA. ${g("block")}` : null,
    g("lot") ? `LOTE ${g("lot")}` : null,
    g("interior") ? `INT. ${g("interior")}` : null,
    g("dpto") ? `DPTO. ${g("dpto")}` : null,
    [g("zoneType"), g("zoneCode"), ].filter(Boolean).join(" "),
  ].filter((p): p is string => Boolean(p && p.trim()));
  const s = parts.join(", ").replace(/\s+/g, " ").trim();
  return s ? s.slice(0, 300) : null;
}

/** Ubigeo de 6 dígitos. Si llegó con 5 (se perdió el cero inicial al guardarse como número) se completa; otro valor → sin dato. */
export function normalizeUbigeo(v: string | null): string | null {
  if (!v) return null;
  if (/^\d{6}$/.test(v)) return v;
  if (/^\d{5}$/.test(v)) return `0${v}`;
  return null;
}

export function parseRow(fields: string[], fmt: Format): RowResult {
  if (fields.length < fmt.columns) return { ok: false, reason: "columnas" };
  const get = (f: Field): string | null => (fmt.index[f] === undefined ? null : clean(fields[fmt.index[f]!]));
  const ruc = (fields[fmt.index.ruc!] ?? "").trim();
  if (!/^\d{11}$/.test(ruc)) return { ok: false, reason: "ruc_invalido" };
  const legalName = get("name");
  if (fmt.kind === "ruc" && !legalName) return { ok: false, reason: "sin_nombre" };
  return {
    ok: true,
    row: {
      ruc,
      legalName: legalName ? legalName.slice(0, 300) : null,
      status: get("status")?.toUpperCase() ?? null,
      condition: get("condition")?.toUpperCase() ?? null,
      ubigeo: normalizeUbigeo(get("ubigeo")),
      address: buildAddress(get),
    },
  };
}
