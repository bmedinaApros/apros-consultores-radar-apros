const BANDS: Record<string, { label: string; cls: string }> = {
  sales: { label: "Pasa a ventas", cls: "badge-ok" },
  nurturing: { label: "Nurturing", cls: "badge-warn" },
  discard: { label: "Descartar", cls: "badge-off" },
};

export function BandBadge({ band }: { band: string }) {
  const b = BANDS[band] ?? { label: band, cls: "badge-info" };
  return <span className={`badge ${b.cls}`}>{b.label}</span>;
}
