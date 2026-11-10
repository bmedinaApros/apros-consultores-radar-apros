export const EXPORT_MAX = 5000;

/** Celda de CSV a prueba de «inyección de fórmulas» en Excel (=, +, -, @ al inicio) y con comillas escapadas. */
export const csvCell = (v: string | null | undefined): string => {
  let s = (v ?? "").replace(/[\r\n]+/g, " ");
  if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
  return /[",;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
