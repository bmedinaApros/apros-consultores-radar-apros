import { COMMON_SIGNALS } from "@/lib/analyzer/observations";
import type { ObservationRow, SignalChange } from "@/lib/analyzer/service";

const STATUS: Record<string, { label: string; cls: string; help: string }> = {
  observed: { label: "Observado", cls: "badge-ok", help: "Se encontró en el sitio" },
  not_detected: { label: "No detectado", cls: "badge-warn", help: "No apareció en el HTML recibido; no equivale a que no exista" },
  unverifiable: { label: "No se pudo verificar", cls: "badge-info", help: "Bloqueo, error o falta de acceso; no es un hallazgo negativo" },
};
const CONF = { high: "alta", medium: "media", low: "baja" } as const;

const safeHref = (u: string | null): string | null => {
  try {
    const x = new URL(u ?? "");
    return x.protocol === "https:" || x.protocol === "http:" ? x.toString() : null;
  } catch {
    return null;
  }
};

function valueText(o: ObservationRow): string {
  const v = o.value;
  if (!v) return "";
  if (typeof v.reason === "string") return v.reason;
  if (typeof v.note === "string" && o.status !== "observed") return v.note;
  const pairs = Object.entries(v).filter(([, x]) => x !== null && typeof x !== "object").slice(0, 4).map(([k, x]) => `${k}: ${String(x).slice(0, 80)}`);
  return pairs.join(" · ");
}

export function SignalsPanel({ rows, industryNames, changes }: { rows: ObservationRow[]; industryNames: Record<string, string>; changes: SignalChange[] }) {
  const common = COMMON_SIGNALS.map((d) => ({ def: d, row: rows.find((r) => r.signal_code === d.code) })).filter((x) => x.row);
  const categories = [...new Set(common.map((x) => x.def.category))];
  const industry = rows.filter((r) => r.signal_code.startsWith("industry."));
  const render = (name: string, o: ObservationRow) => {
    const st = STATUS[o.status]!;
    const href = safeHref(o.evidence_url);
    return (
      <tr key={o.id}>
        <td>{name}</td>
        <td><span className={`badge ${st.cls}`} title={st.help}>{st.label}</span></td>
        <td>{o.kind === "inferred" ? "Inferido" : "Observado"} · confianza {CONF[o.confidence]}</td>
        <td>
          {valueText(o)}
          {o.evidence_excerpt && <blockquote className="evidence">{o.evidence_excerpt}</blockquote>}
          {href && <a href={href} target="_blank" rel="noopener noreferrer nofollow">Ver fuente</a>}
        </td>
      </tr>
    );
  };
  return (
    <>
      {changes.length > 0 && (
        <div className="card" role="note">
          <h3>Cambios desde el análisis anterior</h3>
          <ul>{changes.slice(0, 12).map((c) => <li key={c.signal_code}>{COMMON_SIGNALS.find((s) => s.code === c.signal_code)?.name ?? industryNames[c.signal_code] ?? c.signal_code}: {c.from ? STATUS[c.from.status]?.label : "nueva"} → {STATUS[c.to.status]?.label}</li>)}</ul>
        </div>
      )}
      {categories.map((cat) => (
        <div key={cat} className="card table-wrap" tabIndex={0} role="region" aria-label={`Señales de ${cat}`}>
          <table>
            <caption className="muted">{cat}</caption>
            <thead><tr><th scope="col">Señal</th><th scope="col">Estado</th><th scope="col">Tipo</th><th scope="col">Evidencia</th></tr></thead>
            <tbody>{common.filter((x) => x.def.category === cat).map((x) => render(x.def.name, x.row!))}</tbody>
          </table>
        </div>
      ))}
      {industry.length > 0 && (
        <div className="card table-wrap" tabIndex={0} role="region" aria-label="Señales del rubro">
          <table>
            <caption className="muted">Señales del rubro</caption>
            <thead><tr><th scope="col">Señal</th><th scope="col">Estado</th><th scope="col">Tipo</th><th scope="col">Evidencia</th></tr></thead>
            <tbody>{industry.map((o) => render(industryNames[o.signal_code] ?? o.signal_code, o))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
