import PDFDocument from "pdfkit";
import { ASSETS, BRAND, evidenceLine, fmtDate, kindLabel, LEGEND, modelLabel, priorityLabel, safeText } from "./export-common";
import type { Exportable } from "./service";

const W = 595.28, M = 40, CW = W - 2 * M, FOOT = 790;
const LABEL_W = 78;

export class PdfOverflowError extends Error {
  override name = "PdfOverflowError";
}

type Doc = InstanceType<typeof PDFDocument>;
const SCALES = [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7];

/**
 * PDF de una página con la marca APROS. Todo el texto es plano y viene validado. Se elige la escala más grande que
 * quepa en una página; si ni la más pequeña cabe, se rechaza en lugar de cortar texto.
 */
export async function renderPdf(x: Exportable): Promise<Buffer> {
  for (const scale of SCALES) {
    const probe = newDoc(x);
    const used = layout(probe, x, scale, false);
    probe.end();
    if (used <= FOOT - 8) {
      const doc = newDoc(x);
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      const done = new Promise<Buffer>((res) => doc.on("end", () => res(Buffer.concat(chunks))));
      layout(doc, x, scale, true);
      doc.end();
      return done;
    }
  }
  throw new PdfOverflowError("El diagnóstico no cabe en una página: acorta los textos antes de exportar");
}

function newDoc(x: Exportable): Doc {
  const doc = new PDFDocument({
    size: "A4", margin: 0, font: null as never, autoFirstPage: true, bufferPages: false,
    info: { Title: `Diagnóstico de oportunidades digitales — ${safeText(x.companyName)}`, Author: "APROS Consultores Digitales", Creator: "Radar APROS", Producer: "Radar APROS" },
  });
  doc.registerFont("Questrial", ASSETS.questrial);
  doc.registerFont("Roboto", ASSETS.roboto400);
  doc.registerFont("Roboto-Medium", ASSETS.roboto500);
  doc.registerFont("Roboto-Bold", ASSETS.roboto700);
  doc.font("Roboto");
  return doc;
}

function layout(doc: Doc, x: Exportable, s: number, draw: boolean): number {
  const c = x.content;
  const t = (font: string, size: number, text: string, opts: { width?: number; x?: number; y?: number; color?: string; align?: "left" | "right" | "center"; lineGap?: number; characterSpacing?: number } = {}): number => {
    doc.font(font).fontSize(size);
    const width = opts.width ?? CW;
    const h = doc.heightOfString(text, { width, lineGap: opts.lineGap ?? 1.5, characterSpacing: opts.characterSpacing });
    if (draw) doc.fillColor(opts.color ?? BRAND.gray900).text(text, opts.x ?? M, opts.y ?? 0, { width, align: opts.align ?? "left", lineGap: opts.lineGap ?? 1.5, characterSpacing: opts.characterSpacing });
    return h;
  };

  // Cabecera (navy, logotipo blanco sin alterar)
  if (draw) {
    doc.rect(0, 0, W, 78).fill(BRAND.navy);
    doc.image(ASSETS.logoWhite, M, 24, { width: 126 });
    const g = doc.linearGradient(0, 78, W, 78);
    g.stop(0, BRAND.blue).stop(0.5, BRAND.cyan).stop(1, BRAND.teal);
    doc.rect(0, 78, W, 3).fill(g);
  }
  t("Questrial", 10.5, "Diagnóstico de oportunidades digitales", { x: W - M - 250, y: 28, width: 250, align: "right", color: BRAND.white });
  t("Roboto", 8, fmtDate(x.approvedAt), { x: W - M - 250, y: 45, width: 250, align: "right", color: BRAND.gray400 });

  let y = 98;
  const name = safeText(x.companyName);
  y += t("Questrial", 20 * s, name, { y }) + 1;
  y += t("Roboto", 8.5 * s, safeText([x.companyDomain, x.industryName].filter(Boolean).join(" · ")), { y, color: BRAND.gray600 }) + 8;

  y += t("Questrial", 12.5 * s, safeText(c.headline), { y, color: BRAND.indigo }) + 5;
  const sumH = t("Roboto", 9 * s, safeText(c.summary), { y: y + 7, x: M + 10, width: CW - 20 });
  if (draw) {
    doc.roundedRect(M, y, CW, sumH + 14, 6).fill(BRAND.gray50);
    t("Roboto", 9 * s, safeText(c.summary), { y: y + 7, x: M + 10, width: CW - 20 });
  }
  y += sumH + 14 + 10;

  // Oportunidades
  c.opportunities.forEach((o, i) => {
    const colX = M + LABEL_W, colW = CW - LABEL_W;
    const rows: [string, string][] = [["OBSERVACIÓN", o.observation], ["OPORTUNIDAD", o.opportunity], ["IMPACTO", o.impact], ["PROPUESTA", o.solution]];
    const top = y;
    if (draw) {
      doc.circle(M + 9, y + 9, 9).fill(BRAND.blue);
      doc.font("Roboto-Bold").fontSize(10).fillColor(BRAND.white).text(String(i + 1), M, y + 5, { width: 18, align: "center" });
    }
    const titleH = t("Questrial", 11 * s, safeText(o.title), { x: M + 26, y: y + 1, width: CW - 26 - 150 });
    // etiquetas de tipo y prioridad (el estado nunca depende solo del color)
    if (draw) {
      doc.font("Roboto-Medium").fontSize(7);
      const chip = (label: string, cx: number, fill: string, color: string) => {
        const w = doc.widthOfString(label) + 12;
        doc.roundedRect(cx - w, y + 2, w, 13, 6.5).fill(fill);
        doc.fillColor(color).text(label, cx - w, y + 5.5, { width: w, align: "center" });
        return w;
      };
      const w2 = chip(priorityLabel(o), W - M, BRAND.navy, BRAND.white);
      chip(kindLabel(o), W - M - w2 - 5, o.kind === "hipotesis" ? BRAND.white : BRAND.gray200, BRAND.navy);
      if (o.kind === "hipotesis") {
        doc.roundedRect(W - M - w2 - 5 - (doc.widthOfString(kindLabel(o)) + 12), y + 2, doc.widthOfString(kindLabel(o)) + 12, 13, 6.5).lineWidth(0.8).stroke(BRAND.navy);
      }
    }
    y += Math.max(titleH, 15) + 4;
    for (const [label, text] of rows) {
      const h = t("Roboto", 8.4 * s, safeText(text), { x: colX, y, width: colW });
      if (draw) t("Roboto-Medium", 6.8 * s, label, { x: M, y: y + 1, width: LABEL_W - 4, color: BRAND.indigo, characterSpacing: 0.6 });
      y += h + 2.5;
    }
    const meta = `Entregable: ${safeText(o.deliverable)}  ·  ${modelLabel(o)}  ·  KPI: ${safeText(o.kpi)}`;
    y += t("Roboto", 7.6 * s, meta, { x: colX, y, width: colW, color: BRAND.gray600 }) + 1.5;
    const ev = evidenceLine(x, o);
    if (ev) y += t("Roboto", 7 * s, safeText(ev), { x: colX, y, width: colW, color: BRAND.gray600 }) + 1;
    y += 5;
    if (draw && i < c.opportunities.length - 1) doc.moveTo(M, y - 2).lineTo(W - M, y - 2).lineWidth(0.5).stroke(BRAND.gray200);
    void top;
    y += 4;
  });

  // Siguiente paso
  y += 2;
  const nextH = t("Roboto", 8.8 * s, safeText(c.nextStep), { x: M + 14, y: y + 20, width: CW - 24 });
  if (draw) {
    doc.roundedRect(M, y, CW, nextH + 30, 6).fill(BRAND.navy);
    doc.rect(M, y + 6, 3, nextH + 18).fill(BRAND.cyan);
    t("Questrial", 10.5 * s, "Siguiente paso", { x: M + 14, y: y + 8, width: CW - 24, color: BRAND.white });
    t("Roboto", 8.8 * s, safeText(c.nextStep), { x: M + 14, y: y + 22, width: CW - 24, color: BRAND.white });
  }
  y += nextH + 30 + 6;
  if (c.caveats.length) y += t("Roboto", 7 * s, safeText(c.caveats.join(" ")), { y, color: BRAND.gray600 }) + 2;

  // Pie
  if (draw) {
    doc.moveTo(M, FOOT).lineTo(W - M, FOOT).lineWidth(0.6).stroke(BRAND.gray200);
    t("Roboto", 6.8, safeText(LEGEND(x)), { x: M, y: FOOT + 6, width: CW - 90, color: BRAND.gray600 });
    t("Roboto", 7.5, "APROS · apros.pe", { x: M, y: FOOT + 28, width: 200, color: BRAND.gray600 });
    t("Roboto-Bold", 9, "1", { x: W - M - 30, y: FOOT + 6, width: 30, align: "right", color: BRAND.navy });
  }
  return y;
}
