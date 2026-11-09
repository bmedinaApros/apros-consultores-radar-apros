-- Up Migration

-- V2-4: señales externas registradas A MANO por una persona (avisos de empleo, marca en Indecopi, publicidad en Meta, otras).
-- Cada una queda con su fuente, fecha y quién la registró; no se obtienen automáticamente.
CREATE TABLE company_external_signals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind         text NOT NULL,
  source       text,
  detail       text NOT NULL,
  url          text,
  observed_on  date NOT NULL,
  created_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_external_signals_kind CHECK (kind IN ('aviso_empleo', 'indecopi', 'meta_ads', 'otra')),
  CONSTRAINT company_external_signals_detail CHECK (char_length(detail) BETWEEN 3 AND 500),
  CONSTRAINT company_external_signals_url CHECK (url IS NULL OR (char_length(url) <= 500 AND url ~* '^https?://'))
);
CREATE INDEX company_external_signals_company_idx ON company_external_signals (company_id, observed_on DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'radar_app') THEN
    GRANT SELECT, INSERT, DELETE ON company_external_signals TO radar_app;
  END IF;
END
$$;

-- Down Migration

DROP TABLE IF EXISTS company_external_signals;
