import PptxGenJS from "pptxgenjs";
import { ASSETS, BRAND, evidenceLine, fmtDate, kindLabel, LEGEND, modelLabel, priorityLabel, safeText } from "./export-common";
import type { Exportable } from "./service";

const hex = (c: string) => c.replace("#", "");
const TITLE = "Questrial";
const BODY = "Roboto";
const MX = 0.7;

/**
 * Presentación con la marca APROS, a partir de los mismos datos validados que el PDF. Texto plano, sin enlaces.
 * Las fuentes Questrial y Roboto deben estar instaladas en el equipo que abra el archivo; si no, PowerPoint usa otra.
 */
export async function renderPptx(x: Exportable): Promise<Buffer> {
  const c = x.content;
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE"; // 13,33 × 7,5 in
  pres.author = "APROS Consultores Digitales";
  pres.company = "APROS";
  pres.title = `Diagnóstico de oportunidades digitales — ${safeText(x.companyName)}`;
  const name = safeText(x.companyName);
  let page = 0;

  const footer = (slide: PptxGenJS.Slide, dark = false) => {
    page++;
    const col = dark ? hex(BRAND.gray400) : hex(BRAND.gray600);
    slide.addShape("line", { x: MX, y: 6.95, w: 13.33 - 2 * MX, h: 0, line: { color: dark ? hex(BRAND.gray600) : hex(BRAND.gray200), width: 0.75 } });
    slide.addText(`Diagnóstico · ${name}`, { x: MX, y: 7.0, w: 8, h: 0.3, fontFace: BODY, fontSize: 10, color: col });
    slide.addText(String(page), { x: 13.33 - MX - 1, y: 7.0, w: 1, h: 0.3, fontFace: BODY, fontSize: 10, bold: true, color: dark ? hex(BRAND.white) : hex(BRAND.navy), align: "right" });
  };
  const title = (slide: PptxGenJS.Slide, text: string, sub?: string, dark = false) => {
    slide.addText(safeText(text), { x: MX, y: 0.45, w: 13.33 - 2 * MX, h: 0.7, fontFace: TITLE, fontSize: 28, color: dark ? hex(BRAND.white) : hex(BRAND.navy), valign: "top" });
    if (sub) slide.addText(safeText(sub), { x: MX, y: 1.15, w: 13.33 - 2 * MX, h: 0.4, fontFace: BODY, fontSize: 13, color: dark ? hex(BRAND.gray400) : hex(BRAND.gray600) });
  };

  // 1. Portada (navy, logotipo blanco)
  {
    const s = pres.addSlide();
    s.background = { color: hex(BRAND.navy) };
    s.addShape("ellipse", { x: 9.6, y: 3.9, w: 5, h: 5, fill: { color: hex(BRAND.blue), transparency: 82 }, line: { color: hex(BRAND.blue), transparency: 100 } });
    s.addImage({ path: ASSETS.logoWhite, x: MX, y: 0.6, w: 2.7, h: 0.59 });
    s.addText("Diagnóstico de oportunidades digitales", { x: MX, y: 2.5, w: 10.5, h: 1.1, fontFace: TITLE, fontSize: 40, color: hex(BRAND.white), valign: "top" });
    s.addText(name, { x: MX, y: 3.75, w: 10.5, h: 0.7, fontFace: TITLE, fontSize: 26, color: hex(BRAND.cyan), valign: "top" });
    s.addText(safeText([x.companyDomain, x.industryName].filter(Boolean).join(" · ")), { x: MX, y: 4.5, w: 10.5, h: 0.4, fontFace: BODY, fontSize: 14, color: hex(BRAND.gray400) });
    s.addText(fmtDate(x.approvedAt), { x: MX, y: 6.6, w: 6, h: 0.4, fontFace: BODY, fontSize: 12, color: hex(BRAND.gray400) });
    page++;
  }

  // 2. Lo que observamos
  {
    const s = pres.addSlide();
    s.background = { color: hex(BRAND.white) };
    title(s, c.headline, "Lo que observamos en su presencia digital");
    s.addShape("roundRect", { x: MX, y: 1.8, w: 13.33 - 2 * MX, h: 1.3, fill: { color: hex(BRAND.gray50) }, line: { color: hex(BRAND.gray50) }, rectRadius: 0.1 });
    s.addText(safeText(c.summary), { x: MX + 0.25, y: 1.85, w: 13.33 - 2 * MX - 0.5, h: 1.2, fontFace: BODY, fontSize: 15, color: hex(BRAND.gray900), valign: "middle" });
    c.opportunities.forEach((o, i) => {
      const y = 3.4 + i * 1.15;
      s.addShape("ellipse", { x: MX, y: y + 0.05, w: 0.42, h: 0.42, fill: { color: hex(BRAND.blue) }, line: { color: hex(BRAND.blue) } });
      s.addText(String(i + 1), { x: MX, y: y + 0.05, w: 0.42, h: 0.42, fontFace: BODY, fontSize: 14, bold: true, color: hex(BRAND.white), align: "center", valign: "middle" });
      s.addText([
        { text: safeText(o.title), options: { fontFace: TITLE, fontSize: 15, color: hex(BRAND.navy), breakLine: true } },
        { text: safeText(o.observation), options: { fontFace: BODY, fontSize: 12, color: hex(BRAND.gray900), breakLine: true } },
        { text: safeText(evidenceLine(x, o)), options: { fontFace: BODY, fontSize: 9.5, color: hex(BRAND.gray600) } },
      ], { x: MX + 0.65, y, w: 13.33 - 2 * MX - 0.65, h: 1.05, valign: "top" });
    });
    footer(s);
  }

  // 3.. Una diapositiva por oportunidad
  c.opportunities.forEach((o, i) => {
    const s = pres.addSlide();
    s.background = { color: hex(BRAND.white) };
    title(s, `${i + 1}. ${o.title}`);
    const chip = (label: string, cx: number, fill: string, color: string, border?: string) => {
      s.addText(label, { x: cx, y: 1.2, w: 2.2, h: 0.32, fontFace: BODY, fontSize: 10.5, bold: true, color: hex(color), fill: { color: hex(fill) }, align: "center", valign: "middle", rectRadius: 0.16, shape: "roundRect" as never, line: border ? { color: hex(border), width: 1 } : undefined });
    };
    chip(kindLabel(o), MX, o.kind === "hipotesis" ? BRAND.white : BRAND.gray200, BRAND.navy, o.kind === "hipotesis" ? BRAND.navy : undefined);
    chip(priorityLabel(o), MX + 2.4, BRAND.navy, BRAND.white);
    const cards: [string, string][] = [["LO QUE OBSERVAMOS", o.observation], ["OPORTUNIDAD", o.opportunity], ["IMPACTO", o.impact], ["PROPUESTA", o.solution]];
    const cw = (13.33 - 2 * MX - 0.3) / 2;
    cards.forEach(([label, text], k) => {
      const cx = MX + (k % 2) * (cw + 0.3), cy = 1.85 + Math.floor(k / 2) * 1.75;
      s.addShape("roundRect", { x: cx, y: cy, w: cw, h: 1.55, fill: { color: hex(BRAND.gray50) }, line: { color: hex(BRAND.gray200), width: 0.75 }, rectRadius: 0.1 });
      s.addText(label, { x: cx + 0.2, y: cy + 0.1, w: cw - 0.4, h: 0.3, fontFace: BODY, fontSize: 10, bold: true, color: hex(BRAND.indigo), charSpacing: 1.5 });
      s.addText(safeText(text), { x: cx + 0.2, y: cy + 0.4, w: cw - 0.4, h: 1.1, fontFace: BODY, fontSize: 14, color: hex(BRAND.gray900), valign: "top", fit: "shrink" });
    });
    s.addText([
      { text: "Entregable: ", options: { bold: true, color: hex(BRAND.navy) } }, { text: safeText(o.deliverable), options: { color: hex(BRAND.gray900) } },
      { text: "   ·   ", options: { color: hex(BRAND.gray400) } }, { text: modelLabel(o), options: { bold: true, color: hex(BRAND.navy) } },
      { text: "   ·   ", options: { color: hex(BRAND.gray400) } }, { text: "KPI: ", options: { bold: true, color: hex(BRAND.navy) } }, { text: safeText(o.kpi), options: { color: hex(BRAND.gray900) } },
    ], { x: MX, y: 5.45, w: 13.33 - 2 * MX, h: 0.6, fontFace: BODY, fontSize: 12.5, valign: "top" });
    const ev = evidenceLine(x, o);
    if (ev) s.addText(safeText(ev), { x: MX, y: 6.2, w: 13.33 - 2 * MX, h: 0.5, fontFace: BODY, fontSize: 10, color: hex(BRAND.gray600), valign: "top" });
    footer(s);
  });

  // Propuesta y siguiente paso
  {
    const s = pres.addSlide();
    s.background = { color: hex(BRAND.navy) };
    title(s, "Propuesta y siguiente paso", "Iniciativas priorizadas por valor para el negocio", true);
    const head = (t: string) => ({ text: t, options: { bold: true, color: hex(BRAND.white), fill: { color: hex(BRAND.indigo) }, fontFace: BODY, fontSize: 12 } });
    const rows = [
      [head("Iniciativa"), head("Tipo"), head("Prioridad"), head("Entregable")],
      ...c.opportunities.map((o) => [safeText(o.title), modelLabel(o), priorityLabel(o), safeText(o.deliverable)].map((t) => ({ text: t, options: { color: hex(BRAND.white), fontFace: BODY, fontSize: 12, fill: { color: hex(BRAND.gray900) } } }))),
    ];
    s.addTable(rows as never, { x: MX, y: 1.8, w: 13.33 - 2 * MX, colW: [4.2, 2.4, 1.9, 4.43], border: { type: "solid", color: hex(BRAND.gray600), pt: 0.5 }, rowH: 0.5, valign: "middle" });
    s.addShape("roundRect", { x: MX, y: 4.7, w: 13.33 - 2 * MX, h: 1.6, fill: { color: hex(BRAND.blue) }, line: { color: hex(BRAND.blue) }, rectRadius: 0.1 });
    s.addText("Siguiente paso", { x: MX + 0.3, y: 4.8, w: 6, h: 0.4, fontFace: TITLE, fontSize: 16, color: hex(BRAND.white) });
    s.addText(safeText(c.nextStep), { x: MX + 0.3, y: 5.2, w: 13.33 - 2 * MX - 0.6, h: 1.0, fontFace: BODY, fontSize: 14, color: hex(BRAND.white), valign: "top" });
    if (c.caveats.length) s.addText(safeText(c.caveats.join(" ")), { x: MX, y: 6.4, w: 13.33 - 2 * MX, h: 0.45, fontFace: BODY, fontSize: 9.5, color: hex(BRAND.gray400), valign: "top" });
    footer(s, true);
  }

  // Contraportada (logotipo a color sobre claro)
  {
    const s = pres.addSlide();
    s.background = { color: hex(BRAND.white) };
    s.addShape("rect", { x: 9.6, y: 0, w: 3.73, h: 7.5, fill: { color: hex(BRAND.teal), transparency: 75 }, line: { color: hex(BRAND.teal), transparency: 100 } });
    s.addImage({ path: ASSETS.logoColor, x: 2.6, y: 2.9, w: 4.4, h: 0.96 });
    s.addText("Hacemos tu presencia digital memorable y relevante.", { x: 1.5, y: 4.2, w: 7, h: 0.5, fontFace: TITLE, fontSize: 18, color: hex(BRAND.navy), align: "center" });
    s.addText(safeText(LEGEND(x)), { x: 1.5, y: 6.3, w: 7.5, h: 0.7, fontFace: BODY, fontSize: 9.5, color: hex(BRAND.gray600), align: "center", valign: "top" });
  }

  const out = (await pres.write({ outputType: "nodebuffer" })) as Buffer;
  return Buffer.from(out);
}
