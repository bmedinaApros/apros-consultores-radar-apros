import PDFDocument from "pdfkit";
import { COMMON_SIGNALS } from "../analyzer/observations";
import { ASSETS, BRAND, fmtDate, kindLabel, LEGEND, modelLabel, priorityLabel, safeText } from "./export-common";
import type { Exportable } from "./service";

const W = 595.28, H = 841.89, M = 48, CW = W - 2 * M, TOP = 84, BOTTOM = H - 62;

const STATUS_LABEL = { observed: "Detectado", not_detected: "No se detectó en el HTML", unverifiable: "No se pudo verificar" } as const;

function signalName(code: string): { name: string; category: string } {
  const s = COMMON_SIGNALS.find((d) => d.code === code);
  if (s) return { name: s.name, category: s.category };
  if (code.startsWith("industry.")) return { name: safeText(code.slice(9).replace(/[-_]/g, " ")), category: "Señales del rubro" };
  return { name: safeText(code), category: "Otras señales" };
}

/**
 * Informe de oportunidades digitales con la marca APROS: portada, resumen ejecutivo, una sección por oportunidad con su
 * evidencia, anexo de señales revisadas y metodología. Solo se genera desde un diagnóstico aprobado (loadExportable).
 */
export async function renderReport(x: Exportable): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4", margin: 0, font: null as never, bufferPages: true,
    info: { Title: `Informe de oportunidades digitales — ${safeText(x.companyName)}`, Author: "APROS Consultores Digitales", Creator: "Radar APROS", Producer: "Radar APROS" },
  });
  doc.registerFont("Questrial", ASSETS.questrial);
  doc.registerFont("Roboto", ASSETS.roboto400);
  doc.registerFont("Roboto-Medium", ASSETS.roboto500);
  doc.registerFont("Roboto-Bold", ASSETS.roboto700);
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((res) => doc.on("end", () => res(Buffer.concat(chunks))));

  const c = x.content;
  let y = TOP;
  const text = (font: string, size: number, str: string, o: { x?: number; width?: number; color?: string; align?: "left" | "right" | "center"; gap?: number; spacing?: number } = {}): number => {
    const width = o.width ?? CW;
    doc.font(font).fontSize(size);
    const opts = { width, align: o.align ?? "left", lineGap: o.gap ?? 2, characterSpacing: o.spacing };
    const h = doc.heightOfString(str, opts);
    doc.fillColor(o.color ?? BRAND.gray900).text(str, o.x ?? M, y, opts);
    return h;
  };
  const measure = (font: string, size: number, str: string, width = CW, gap = 2): number => { doc.font(font).fontSize(size); return doc.heightOfString(str, { width, lineGap: gap }); };
  const newPage = () => { doc.addPage(); y = TOP; };
  const ensure = (h: number) => { if (y + h > BOTTOM) newPage(); };
  const h2 = (title: string) => {
    ensure(50);
    text("Questrial", 17, title, { color: BRAND.navy });
    y += 25;
    doc.rect(M, y, 36, 3).fill(BRAND.blue); y += 14;
  };
  const para = (str: string, o: { size?: number; color?: string; font?: string } = {}) => {
    const s = safeText(str); const size = o.size ?? 9.5;
    ensure(measure(o.font ?? "Roboto", size, s) + 6);
    y += text(o.font ?? "Roboto", size, s, { color: o.color ?? BRAND.gray900, gap: 2.5 }) + 7;
  };

  // ---------- Portada ----------
  doc.rect(0, 0, W, H).fill(BRAND.navy);
  const strip = () => { const g = doc.linearGradient(0, 0, W, 0); return g.stop(0, BRAND.blue).stop(0.5, BRAND.cyan).stop(1, BRAND.teal); };
  doc.rect(0, H - 14, W, 14).fill(strip());
  doc.image(ASSETS.logoWhite, M, 60, { width: 170 });
  y = 300;
  text("Roboto-Medium", 9.5, "INFORME DE OPORTUNIDADES DIGITALES", { color: BRAND.gray400, spacing: 1.4 }); y += 26;
  y += text("Questrial", 34, safeText(x.companyName), { color: BRAND.white, gap: 4 }) + 14;
  doc.rect(M, y, 54, 4).fill(BRAND.cyan); y += 20;
  y += text("Roboto", 12, safeText([x.companyDomain, x.industryName].filter(Boolean).join(" · ")), { color: BRAND.gray200 }) + 6;
  text("Roboto", 10.5, `Versión ${x.version} · Aprobado el ${fmtDate(x.approvedAt)}`, { color: BRAND.gray400 });
  y = H - 120;
  text("Roboto-Medium", 9, "APROS Consultores Digitales", { color: BRAND.white }); y += 14;
  text("Roboto", 8.5, "apros.pe · Documento de uso comercial, basado en información pública.", { color: BRAND.gray400 });

  // ---------- Resumen ejecutivo ----------
  newPage();
  h2("Resumen ejecutivo");
  y += text("Questrial", 14, safeText(c.headline), { color: BRAND.indigo, gap: 3 }) + 10;
  const sh = measure("Roboto", 10, safeText(c.summary), CW - 28, 3);
  doc.roundedRect(M, y, CW, sh + 24, 6).fill(BRAND.gray50);
  y += 12; y += text("Roboto", 10, safeText(c.summary), { x: M + 14, width: CW - 28, gap: 3 }) + 24;

  text("Questrial", 12, "Oportunidades identificadas", { color: BRAND.navy }); y += 22;
  c.opportunities.forEach((o, i) => {
    const title = safeText(o.title);
    const th = measure("Roboto-Medium", 9.5, title, CW - 200);
    ensure(Math.max(th, 14) + 14);
    doc.circle(M + 9, y + 8, 9).fill(BRAND.blue);
    doc.font("Roboto-Bold").fontSize(9.5).fillColor(BRAND.white).text(String(i + 1), M, y + 4.5, { width: 18, align: "center" });
    text("Roboto-Medium", 9.5, title, { x: M + 28, width: CW - 230 });
    text("Roboto", 8, `${kindLabel(o)} · ${priorityLabel(o)} · ${modelLabel(o)}`, { x: W - M - 200, width: 200, align: "right", color: BRAND.gray600 });
    y += Math.max(th, 14) + 10;
  });
  y += 8;
  ensure(90);
  const nh = measure("Roboto", 10, safeText(c.nextStep), CW - 36, 3);
  doc.roundedRect(M, y, CW, nh + 42, 6).fill(BRAND.navy);
  doc.rect(M, y + 8, 3, nh + 26).fill(BRAND.cyan);
  y += 12; text("Questrial", 11.5, "Siguiente paso recomendado", { x: M + 18, width: CW - 36, color: BRAND.white }); y += 20;
  y += text("Roboto", 10, safeText(c.nextStep), { x: M + 18, width: CW - 36, color: BRAND.white, gap: 3 }) + 22;
  y += 6;
  ensure(70);
  text("Questrial", 11, "Cómo leer este informe", { color: BRAND.navy }); y += 18;
  para(`${"Hecho"}: algo que se observó directamente en el sitio. ${"Inferencia"}: conclusión razonable a partir de lo observado. ${"Hipótesis a validar"}: idea que depende de datos de la empresa y debe confirmarse con ella antes de actuar.`, { size: 8.8, color: BRAND.gray600 });

  // ---------- Contexto y alcance ----------
  h2("Contexto y alcance del análisis");
  const rows: [string, string][] = [
    ["Empresa", safeText(x.companyName)], ["Sitio web", safeText(x.companyDomain || "No registrado")], ["Rubro", safeText(x.industryName ?? "Sin clasificar")],
    ["Análisis del sitio", x.evidenceDate ? fmtDate(x.evidenceDate) : "Sin fecha"],
    ["Páginas leídas", x.pagesFetched != null ? String(x.pagesFetched) : "—"],
    ["Señales revisadas", String(x.allObservations.length || "—")],
  ];
  for (const [k, v] of rows) {
    ensure(18);
    text("Roboto-Medium", 8, k.toUpperCase(), { width: 130, color: BRAND.indigo, spacing: 0.6 });
    y += text("Roboto", 9.5, v, { x: M + 140, width: CW - 140 }) + 6;
  }
  y += 4;
  para("El análisis se basó únicamente en información pública del sitio web, leída de forma automatizada y respetando su archivo robots.txt. No se accedió a sistemas internos ni a datos privados de la empresa.", { size: 9, color: BRAND.gray600 });

  // ---------- Oportunidades ----------
  c.opportunities.forEach((o, i) => {
    newPage();
    doc.circle(M + 14, y + 12, 14).fill(BRAND.blue);
    doc.font("Roboto-Bold").fontSize(14).fillColor(BRAND.white).text(String(i + 1), M, y + 6.5, { width: 28, align: "center" });
    const t = safeText(o.title);
    const th = text("Questrial", 17, t, { x: M + 40, width: CW - 40, color: BRAND.navy, gap: 3 });
    y += Math.max(th, 28) + 8;
    text("Roboto-Medium", 8.3, `${kindLabel(o).toUpperCase()}  ·  ${priorityLabel(o).toUpperCase()}  ·  ${modelLabel(o).toUpperCase()}`, { color: BRAND.indigo, spacing: 0.5 }); y += 22;
    const chain: [string, string][] = [["Observación", o.observation], ["Oportunidad", o.opportunity], ["Impacto esperado", o.impact], ["Propuesta", o.solution], ["Entregable", o.deliverable], ["Indicador de éxito (KPI)", o.kpi]];
    for (const [label, body] of chain) {
      const b = safeText(body); const bh = measure("Roboto", 10, b, CW - 14, 3);
      ensure(bh + 30);
      doc.rect(M, y, 3, bh + 18).fill(label === "Propuesta" ? BRAND.blue : BRAND.gray200);
      text("Roboto-Medium", 7.8, label.toUpperCase(), { x: M + 14, width: CW - 14, color: BRAND.indigo, spacing: 0.7 }); y += 12;
      y += text("Roboto", 10, b, { x: M + 14, width: CW - 14, gap: 3 }) + 14;
    }
    // Evidencia
    ensure(40);
    y += 4;
    text("Questrial", 11.5, "Evidencia que respalda este punto", { color: BRAND.navy }); y += 19;
    const obs = o.evidence.map((id) => x.evidence.get(id)).filter((e): e is NonNullable<typeof e> => Boolean(e));
    if (obs.length === 0) para(o.kind === "hipotesis" ? "Hipótesis a validar con la empresa: no se apoya en una observación del sitio." : "Sin observaciones citadas.", { size: 9, color: BRAND.gray600 });
    for (const e of obs) {
      const nm = signalName(e.signal_code).name;
      const detail = [e.evidence_excerpt ? `«${safeText(e.evidence_excerpt).slice(0, 160)}»` : "", e.evidence_url ? safeText(e.evidence_url).slice(0, 120) : ""].filter(Boolean).join("  ");
      const line = `${nm} — ${STATUS_LABEL[e.status]}${detail ? `. ${detail}` : ""}`;
      const lh = measure("Roboto", 8.6, safeText(line), CW - 14);
      ensure(lh + 8);
      doc.circle(M + 3, y + 5, 2).fill(BRAND.indigo);
      y += text("Roboto", 8.6, safeText(line), { x: M + 14, width: CW - 14, color: BRAND.gray600 }) + 5;
    }
  });

  // ---------- Anexo de señales ----------
  if (x.allObservations.length) {
    newPage();
    h2("Anexo: señales revisadas en el sitio");
    para("«No se detectó en el HTML» significa que el análisis automático no encontró la señal en las páginas leídas; no prueba que no exista (puede cargarse después, estar en otra página o no ser visible para un lector automático). «No se pudo verificar» indica que la lectura falló o fue bloqueada.", { size: 8.8, color: BRAND.gray600 });
    const groups = new Map<string, { name: string; status: keyof typeof STATUS_LABEL }[]>();
    for (const o of x.allObservations) {
      const s = signalName(o.signal_code);
      groups.set(s.category, [...(groups.get(s.category) ?? []), { name: s.name, status: o.status }]);
    }
    for (const [cat, list] of groups) {
      ensure(40);
      text("Roboto-Medium", 8.3, cat.toUpperCase(), { color: BRAND.indigo, spacing: 0.7 }); y += 15;
      for (const it of list) {
        ensure(16);
        text("Roboto", 9, it.name, { width: CW - 190 });
        text("Roboto-Medium", 8.3, STATUS_LABEL[it.status], { x: W - M - 180, width: 180, align: "right", color: it.status === "observed" ? BRAND.navy : BRAND.gray600 });
        y += 13;
        doc.moveTo(M, y - 2).lineTo(W - M, y - 2).lineWidth(0.4).stroke(BRAND.gray200);
      }
      y += 8;
    }
  }

  // ---------- Metodología y notas ----------
  ensure(200);
  h2("Cómo trabajamos");
  const steps = ["Revisamos tu presencia digital con fuentes públicas y verificables.", "Priorizamos las oportunidades por impacto y esfuerzo, separando hechos de hipótesis.", "Validamos contigo el punto de partida y los datos que solo tu empresa conoce.", "Proponemos un entregable concreto, con un indicador de éxito acordado."];
  steps.forEach((s, i) => {
    const sh2 = measure("Roboto", 9.5, s, CW - 30, 2.5);
    ensure(sh2 + 12);
    doc.circle(M + 8, y + 7, 8).lineWidth(1).stroke(BRAND.blue);
    doc.font("Roboto-Bold").fontSize(8.5).fillColor(BRAND.blue).text(String(i + 1), M, y + 4, { width: 16, align: "center" });
    y += text("Roboto", 9.5, s, { x: M + 28, width: CW - 30, gap: 2.5 }) + 9;
  });
  if (c.caveats.length) {
    y += 6; ensure(40);
    text("Questrial", 11, "Notas y límites", { color: BRAND.navy }); y += 18;
    for (const cv of c.caveats) para(`• ${cv}`, { size: 8.8, color: BRAND.gray600 });
  }
  para(LEGEND(x), { size: 8, color: BRAND.gray600 });

  // ---------- Encabezado y pie en las páginas interiores ----------
  const range = doc.bufferedPageRange();
  for (let i = 1; i < range.count; i++) {
    doc.switchToPage(i);
    doc.rect(0, 0, W, 54).fill(BRAND.navy);
    doc.image(ASSETS.logoWhite, M, 18, { width: 92 });
    doc.rect(0, 54, W, 2.5).fill(strip()); // un degradado nuevo por página (los recursos son por página)
    doc.font("Roboto").fontSize(8).fillColor(BRAND.gray400).text(safeText(x.companyName), W - M - 260, 22, { width: 260, align: "right", lineBreak: false });
    doc.moveTo(M, H - 44).lineTo(W - M, H - 44).lineWidth(0.5).stroke(BRAND.gray200);
    doc.font("Roboto").fontSize(7.5).fillColor(BRAND.gray600).text("APROS Consultores Digitales · apros.pe", M, H - 34, { width: 300, lineBreak: false });
    doc.font("Roboto-Medium").fontSize(8).fillColor(BRAND.navy).text(`${i + 1} de ${range.count}`, W - M - 80, H - 34, { width: 80, align: "right", lineBreak: false });
  }
  doc.end();
  return done;
}
