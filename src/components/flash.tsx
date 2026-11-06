export function Flash({ ok, error }: { ok?: string; error?: string }) {
  return (
    <>
      {ok && <div className="alert alert-ok" role="status">{ok}</div>}
      {error && <div className="alert" role="alert">{error}</div>}
    </>
  );
}
