-- Up Migration

-- V2-5: búsqueda automática del sitio web de una empresa. Cada sitio encontrado queda como candidato con su evidencia.
CREATE TABLE company_website_candidates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  domain      text NOT NULL,
  confidence  text NOT NULL,
  source      text NOT NULL,
  evidence    jsonb NOT NULL DEFAULT '{}'::jsonb,
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now(),
  decided_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  decided_at  timestamptz,
  CONSTRAINT company_website_candidates_confidence CHECK (confidence IN ('alta', 'media', 'baja')),
  CONSTRAINT company_website_candidates_source CHECK (source IN ('auto', 'ia')),
  CONSTRAINT company_website_candidates_status CHECK (status IN ('pending', 'accepted', 'rejected')),
  CONSTRAINT company_website_candidates_unique UNIQUE (company_id, domain)
);
CREATE INDEX company_website_candidates_pending_idx ON company_website_candidates (company_id) WHERE status = 'pending';

-- Un intento por empresa: evita volver a probar la misma empresa cada semana.
CREATE TABLE company_website_attempts (
  company_id    uuid PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  attempted_at  timestamptz NOT NULL DEFAULT now(),
  tried         integer NOT NULL DEFAULT 0,
  found         integer NOT NULL DEFAULT 0
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'radar_app') THEN
    GRANT SELECT, INSERT, UPDATE ON company_website_candidates, company_website_attempts TO radar_app;
  END IF;
END
$$;

-- Down Migration

DROP TABLE IF EXISTS company_website_attempts;
DROP TABLE IF EXISTS company_website_candidates;
