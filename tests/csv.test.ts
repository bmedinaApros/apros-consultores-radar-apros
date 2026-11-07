import { describe, expect, it } from "vitest";
import { CSV_LIMITS, CsvError, decodeUpload, neutralizeFormula, parseCompaniesCsv, toCsv } from "@/lib/companies/csv";

const enc = (s: string) => new TextEncoder().encode(s);

describe("decodeUpload", () => {
  it("acepta UTF-8 con BOM", () => {
    expect(decodeUpload(enc("﻿razon_social\nA"), "x.csv")).toBe("razon_social\nA");
  });
  it("rechaza extensión, vacío, binario, tamaño y codificación inválidos", () => {
    expect(() => decodeUpload(enc("a"), "x.xlsx")).toThrow(CsvError);
    expect(() => decodeUpload(new Uint8Array(), "x.csv")).toThrow(/vacío/);
    expect(() => decodeUpload(new Uint8Array([97, 0, 98]), "x.csv")).toThrow(/texto/);
    expect(() => decodeUpload(new Uint8Array(CSV_LIMITS.maxBytes + 1).fill(97), "x.csv")).toThrow(/5 MB/);
    expect(() => decodeUpload(new Uint8Array([0xff, 0xfe, 0x41]), "x.csv")).toThrow(/UTF-8/);
  });
});

describe("parseCompaniesCsv", () => {
  it("reconoce alias, tildes y separador punto y coma", () => {
    const r = parseCompaniesCsv("Razón Social;Sitio Web;RUC;Rubro;Columna rara\nAcme SAC;acme.pe;20100070970;Retail;x\n");
    expect(r.rows[0]).toMatchObject({ legal_name: "Acme SAC", website: "acme.pe", ruc: "20100070970", industry: "Retail" });
    expect(r.ignoredColumns).toEqual(["Columna rara"]);
  });
  it("maneja comillas y comas dentro del campo", () => {
    const r = parseCompaniesCsv('razon_social,ciudad\n"Pérez, Hijos S.A.C.","Lima"\n');
    expect(r.rows[0]!.legal_name).toBe("Pérez, Hijos S.A.C.");
  });
  it("exige la columna razón social y al menos una fila", () => {
    expect(() => parseCompaniesCsv("ruc\n1\n")).toThrow(/razon_social/);
    expect(() => parseCompaniesCsv("razon_social\n")).toThrow(/filas de datos/);
  });
  it("limita filas y columnas", () => {
    const many = "razon_social\n" + Array.from({ length: CSV_LIMITS.maxRows + 1 }, (_, i) => `E${i}`).join("\n");
    expect(() => parseCompaniesCsv(many)).toThrow(/filas/);
    const wide = Array.from({ length: CSV_LIMITS.maxColumns + 1 }, (_, i) => `c${i}`).join(",") + "\n1";
    expect(() => parseCompaniesCsv(wide)).toThrow(/columnas/);
  });
  it("recorta celdas excesivas", () => {
    const r = parseCompaniesCsv(`razon_social\n${"x".repeat(2000)}\n`);
    expect(r.rows[0]!.legal_name!.length).toBe(CSV_LIMITS.maxCellChars);
  });
});

describe("inyección de fórmulas en exportaciones", () => {
  it("neutraliza los prefijos peligrosos", () => {
    for (const v of ["=1+1", "+cmd", "-2", "@SUM(A1)", "\tx", "\rx"]) expect(neutralizeFormula(v).startsWith("'")).toBe(true);
    expect(neutralizeFormula("Acme")).toBe("Acme");
  });
  it("toCsv neutraliza y escapa", () => {
    const out = toCsv([["a", '=HYPERLINK("http://x")'], ["b,c", 'd"e']]);
    expect(out).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(out).toContain(`"b,c","d""e"`);
  });
});
