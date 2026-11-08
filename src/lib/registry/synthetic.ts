/**
 * Archivos sintéticos con el MISMO formato que los de SUNAT (texto «|», Windows-1252, cabecera con tildes, «-» como vacío,
 * «|» final). Todos los datos son inventados. Sirven para probar volumen, reanudación y filtros sin datos reales.
 */
export const RUC_HEADER = "RUC|NOMBRE O RAZÓN SOCIAL|ESTADO DEL CONTRIBUYENTE|CONDICIÓN DE DOMICILIO|UBIGEO|TIPO DE VÍA|NOMBRE DE VÍA|CÓDIGO DE ZONA|TIPO DE ZONA|NÚMERO|INTERIOR|LOTE|DEPARTAMENTO|MANZANA|KILÓMETRO|";
export const ANEXO_HEADER = " RUC|UBIGEO|TIPO DE VÍA|NOMBRE DE VÍA|CÓDIGO DE ZONA|TIPO DE ZONA|NÚMERO|KILÓMETRO|INTERIOR|LOTE|DEPARTAMENTO|MANZANA|";

/** Completa un RUC de 10 dígitos con su dígito verificador (módulo 11 de SUNAT). */
export function withCheckDigit(base10: string): string {
  const w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const s = [...base10].reduce((a, d, i) => a + Number(d) * w[i]!, 0);
  const r = 11 - (s % 11);
  return base10 + String(r === 10 ? 0 : r === 11 ? 1 : r);
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 0x100000000; };
}
const pick = <T,>(r: () => number, a: readonly T[]): T => a[Math.floor(r() * a.length)]!;

const WORDS = ["ANDINA", "PACIFICO", "NORTE", "SUR", "ALFA", "BETA", "DELTA", "MIRAFLORES", "COSTA", "SIERRA", "SELVA", "INCA", "LIMA", "GLOBAL", "UNION"];
const ACT = ["INMOBILIARIA", "CLINICA", "COLEGIO", "CONSTRUCTORA", "DISTRIBUIDORA", "CONSULTORES", "INDUSTRIAS", "COMERCIAL", "TRANSPORTES", "SERVICIOS"];
const SUFFIX = ["S.A.C.", "S.A.", "E.I.R.L.", "S.R.L."];
const STATUS = ["ACTIVO", "ACTIVO", "ACTIVO", "BAJA DE OFICIO", "SUSPENSION TEMPORAL", "BAJA DEFINITIVA"];
const COND = ["HABIDO", "HABIDO", "HABIDO", "NO HABIDO", "NO HALLADO"];
const UBIGEOS = ["150101", "150122", "150131", "070101", "040101", "130101", "140101", "200101", "080101", "120101"];
const VIA = ["AV.", "JR.", "CAL.", "PSJ."];
const ROAD = ["LOS OLIVOS", "UNION", "GRAU", "BOLOGNESI", "SAN MARTIN", "AREQUIPA", "PARDO"];

/** Líneas (sin salto de línea) de un archivo sintético. `n` filas de datos; el RUC crece de forma única. */
export function* syntheticLines(kind: "ruc" | "anexo", n: number, seed = 1): Generator<string> {
  const r = rng(seed);
  yield kind === "ruc" ? RUC_HEADER : ANEXO_HEADER;
  for (let i = 0; i < n; i++) {
    const natural = r() < 0.3;
    const base = `${natural ? "10" : "20"}${String(100000 + Math.floor(i / 1)).padStart(8, "0")}`.slice(0, 10);
    const ruc = withCheckDigit(base);
    const ub = pick(r, UBIGEOS);
    const via = pick(r, VIA), road = pick(r, ROAD), num = String(1 + Math.floor(r() * 2000));
    if (kind === "ruc") {
      const name = natural ? `PEREZ GOMEZ JUAN ${i}` : `${pick(r, ACT)} ${pick(r, WORDS)} ${pick(r, WORDS)} ${pick(r, SUFFIX)}`;
      yield [ruc, name, pick(r, STATUS), pick(r, COND), ub, via, road, "-", "-", num, "-", "-", "-", "-", "-", ""].join("|");
    } else {
      yield [ruc, ub, via, road, "-", "-", num, "-", "-", "-", "-", "-", ""].join("|");
    }
  }
}
