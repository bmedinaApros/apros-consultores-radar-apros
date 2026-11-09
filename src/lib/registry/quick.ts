import { stripAccents } from "./format";

export interface Dept { code: string; department: string }
export interface QuickParse {
  /** Filtros que se desprenden de la frase (pueden combinarse con filtros avanzados). */
  q?: string;
  ubigeo?: string;
  /** Lo que se entendió, en palabras, para mostrarlo y poder corregirlo. */
  understood: string[];
}

const norm = (s: string): string => stripAccents(s.toLowerCase()).replace(/[^a-z0-9ñ ]+/g, " ").replace(/\s+/g, " ").trim();
// Palabras de relleno de una frase pedida a una persona o a una IA («busca inmobiliarias en Lima»).
const FILLER = new Set(["busca", "buscar", "buscame", "dame", "quiero", "necesito", "muestrame", "mostrar", "todas", "todos", "empresa", "empresas", "con", "que", "sean", "solo", "en", "de", "del", "para", "la", "las", "los", "el"]);

/** Singular simple: «hoteles» → «hotel», «clínicas» → «clinica». Si no es plural reconocible, no se toca. */
const stem = (t: string): string => (t.length > 5 && t.endsWith("es") ? t.slice(0, -2) : t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t);

/**
 * Interpreta una frase corta: un RUC (o su inicio), un departamento al inicio o al final («… en Lima») y el resto como
 * palabras del nombre (el plural se tolera: «clínicas» busca «clinica»). No hay magia: si algo no se entiende queda como
 * palabra del nombre y se ve en «Lo que entendí».
 */
export function parseQuickQuery(text: string, depts: Dept[]): QuickParse {
  const clean = norm(text).slice(0, 100);
  const understood: string[] = [];
  if (!clean) return { understood };
  if (/^\d{3,11}$/.test(clean.replace(/ /g, ""))) {
    const ruc = clean.replace(/ /g, "");
    return { q: ruc, understood: [ruc.length === 11 ? `RUC ${ruc}` : `RUC que empieza con ${ruc}`] };
  }
  let tokens = clean.split(" ");
  const byName = new Map(depts.map((d) => [norm(d.department), d]));
  let ubigeo: string | undefined;
  // El departamento puede ser de 1 a 3 palabras («la libertad», «madre de dios») y va al final o al principio.
  for (const n of [3, 2, 1]) {
    if (tokens.length < n) continue;
    const tail = tokens.slice(-n).join(" ");
    const head = tokens.slice(0, n).join(" ");
    if (byName.has(tail)) { ubigeo = byName.get(tail)!.code; tokens = tokens.slice(0, -n); understood.push(`departamento ${byName.get(tail)!.department}`); break; }
    if (tokens.length > n && byName.has(head)) { ubigeo = byName.get(head)!.code; tokens = tokens.slice(n); understood.push(`departamento ${byName.get(head)!.department}`); break; }
  }
  const words = tokens.filter((t) => t.length >= 2 && !FILLER.has(t) && !/^\d{1,2}$/.test(t)).map(stem);
  const q = words.join(" ") || undefined;
  if (q) understood.unshift(`el nombre contiene ${words.map((w) => `«${w}»`).join(" y ")}`);
  return { q, ubigeo, understood };
}
