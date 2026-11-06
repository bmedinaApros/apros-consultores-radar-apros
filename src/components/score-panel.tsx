import { BandBadge } from "@/components/band-badge";
import type { ScoreResult } from "@/lib/scoring/engine";
import { MANUAL_CRITERIA } from "@/lib/scoring/model";
import type { ServiceMatch } from "@/lib/offers/service";

const SOURCE = { web: "Observado", inferido: "Inferido", manual: "Manual", empresa: "Dato de la empresa" } as const;
const pct = (n: number) => `${Math.round(n * 100)} %`;

export function ScorePanel({ total, band, computed, breakdown, modelName, modelVersion, computedAt, reproducible, services, adjustment }: {
  total: number; band: string; computed: number; breakdown: ScoreResult; modelName: string; modelVersion: number; computedAt: string; reproducible: boolean | null;
  services: ServiceMatch[]; adjustment: { delta: number; reason: string } | null;
}) {
  const label = (k: string) => MANUAL_CRITERIA.find((c) => c.key === k)?.label ?? k;
  return (
    <div className="stack">
      <div className="card stack">
        <div className="row">
          <span className="stat">{total.toFixed(1)}</span><span>de 100</span><BandBadge band={band} />
          {breakdown.disqualified && <span className="badge badge-off">Descalificada</span>}
        </div>
        <p className="muted">
          Modelo: <strong>{modelName} v{modelVersion}</strong> · calculado el {computedAt} · cobertura de datos web {pct(breakdown.dataCoverage)}
          {adjustment ? ` · incluye un ajuste manual de ${adjustment.delta > 0 ? "+" : ""}${adjustment.delta} (${adjustment.reason}); puntaje calculado ${computed.toFixed(1)}` : ""}
          {reproducible === true && " · verificado: el cálculo se reproduce exactamente con sus entradas guardadas"}
          {reproducible === false && " · ATENCIÓN: el recálculo no coincide con lo guardado"}
        </p>
        <p className="muted">Los puntajes solo se comparan directamente entre empresas que usan el mismo modelo.</p>
        {breakdown.disqualifiers.length > 0 && <ul>{breakdown.disqualifiers.map((d) => <li key={d.id}><strong>Descalificador:</strong> {d.label}</li>)}</ul>}
        <details open>
          <summary>Por qué tiene este puntaje</summary>
          <ul>{breakdown.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </details>
      </div>
      <div className="card table-wrap" tabIndex={0} role="region" aria-label="Desglose del puntaje">
        <table>
          <caption className="muted">Desglose por dimensión</caption>
          <thead><tr><th scope="col">Dimensión</th><th scope="col">Peso</th><th scope="col">Puntos de la dimensión</th><th scope="col">Aporte al total</th><th scope="col">Reglas que sumaron</th></tr></thead>
          <tbody>{breakdown.dimensions.map((d) => (
            <tr key={d.key}>
              <td>{d.label}</td><td>{d.weight}</td><td>{d.raw.toFixed(1)} / 100</td><td>{d.contribution.toFixed(1)}</td>
              <td>{d.fired.length === 0 ? <span className="muted">Ninguna</span> : (
                <ul>{d.fired.map((f) => (
                  <li key={f.id}>{f.label} — <strong>{f.effective}</strong> pts{f.factor < 1 ? ` (${f.points} × ${f.factor} por confianza ${f.confidence === "low" ? "baja" : "media"})` : ""} · <span className={`badge ${f.source === "manual" ? "badge-info" : f.source === "inferido" ? "badge-warn" : "badge-ok"}`}>{SOURCE[f.source]}</span></li>
                ))}</ul>
              )}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {breakdown.missingManual.length > 0 && (
        <p className="muted" role="note">Criterios que no se pueden observar en la web y faltan por capturar a mano: {breakdown.missingManual.map(label).join(", ")}. Hasta entonces no suman puntos.</p>
      )}
      {services.length > 0 && (
        <div className="card">
          <h3>Servicios de APROS que podrían encajar</h3>
          <p className="muted">Hipótesis a validar con el prospecto; no son hechos.</p>
          <ul>{services.map((s) => <li key={s.slug}><strong>{s.name}</strong><ul>{s.reasons.map((r, i) => <li key={i}>{r.rationale}</li>)}</ul></li>)}</ul>
        </div>
      )}
    </div>
  );
}
