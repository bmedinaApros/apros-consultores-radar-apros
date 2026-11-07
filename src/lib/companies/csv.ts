import { parse } from "csv-parse/sync";

export const CSV_LIMITS = { maxBytes: 5 * 1024 * 1024, maxRows: 5000, maxColumns: 30, maxCellChars: 500 } as const;

export class CsvError extends Error {
  override name = "CsvError";
}

/** Valida y decodifica un archivo subido. No ejecuta ni interpreta su contenido. */
export function decodeUpload(bytes: Uint8Array, filename: string): string {
  if (!/\.csv$/i.test(filename)) throw new CsvError("El archivo debe tener extensión .csv");
  if (bytes.byteLength === 0) throw new CsvError("El archivo está vacío");
  if (bytes.byteLength > CSV_LIMITS.maxBytes) throw new CsvError("El archivo supera los 5 MB");
  if (bytes.includes(0)) throw new CsvError("El archivo no es un CSV de texto");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    throw new CsvError("El archivo debe estar codificado en UTF-8");
  }
}

const detectDelimiter = (firstLine: string): string => {
  const counts = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length - 1] as const);
  return counts.sort((a, b) => b[1] - a[1])[0]![0];
};

const headerKey = (h: string) =>
  h.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const ALIASES: Record<string, string> = {
  razon_social: "legal_name", empresa: "legal_name", nombre: "legal_name", company: "legal_name",
  nombre_comercial: "trade_name", marca: "trade_name",
  sitio_web: "website", web: "website", dominio: "website", website: "website", url: "website", pagina_web: "website",
  ruc: "ruc",
  rubro: "industry", industria: "industry", sector: "industry",
  subrubro: "subindustry", sub_rubro: "subindustry",
  ciudad: "city", distrito: "city", provincia: "city",
  responsable: "owner_email", vendedor: "owner_email", propietario: "owner_email",
};

export interface ParsedCsv {
  rows: Record<string, string>[]; // claves ya canónicas (legal_name, website, …)
  ignoredColumns: string[];
}

export function parseCompaniesCsv(text: string): ParsedCsv {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  let records: string[][];
  try {
    records = parse(text, {
      delimiter: detectDelimiter(firstLine),
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      max_record_size: CSV_LIMITS.maxCellChars * CSV_LIMITS.maxColumns * 2,
    });
  } catch (e) {
    throw new CsvError(`No se pudo leer el CSV: ${e instanceof Error ? e.message : "formato inválido"}`);
  }
  if (records.length < 2) throw new CsvError("El CSV no tiene filas de datos");
  const header = records[0]!;
  if (header.length > CSV_LIMITS.maxColumns) throw new CsvError("El CSV tiene demasiadas columnas");
  if (records.length - 1 > CSV_LIMITS.maxRows) throw new CsvError(`El CSV supera las ${CSV_LIMITS.maxRows} filas`);

  const mapped = header.map((h) => ALIASES[headerKey(h)] ?? null);
  if (!mapped.includes("legal_name")) throw new CsvError("Falta la columna obligatoria «razon_social»");
  const ignoredColumns = header.filter((_, i) => mapped[i] === null);

  const rows = records.slice(1).map((r) => {
    const out: Record<string, string> = {};
    mapped.forEach((key, i) => {
      if (key && out[key] === undefined) out[key] = (r[i] ?? "").slice(0, CSV_LIMITS.maxCellChars);
    });
    return out;
  });
  return { rows, ignoredColumns };
}

/** Neutraliza celdas que una hoja de cálculo interpretaría como fórmula. */
export function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    const s = neutralizeFormula(v == null ? "" : String(v));
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
