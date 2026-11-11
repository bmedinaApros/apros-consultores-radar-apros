-- Up Migration

-- V2-6: investigación con un proveedor de búsqueda web (Grok): sitio web y medios de contacto públicos, siempre con su fuente.
ALTER TABLE company_website_candidates DROP CONSTRAINT company_website_candidates_source;
ALTER TABLE company_website_candidates ADD CONSTRAINT company_website_candidates_source CHECK (source IN ('auto', 'ia', 'grok'));

CREATE TABLE company_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind         text NOT NULL,
  value        text NOT NULL,
  source_url   text NOT NULL,
  status       text NOT NULL DEFAULT 'sin_verificar',
  found_by     text NOT NULL DEFAULT 'grok',
  created_at   timestamptz NOT NULL DEFAULT now(),
  verified_at  timestamptz,
  CONSTRAINT company_contacts_kind CHECK (kind IN ('telefono', 'whatsapp', 'correo', 'formulario', 'red_social')),
  CONSTRAINT company_contacts_value CHECK (char_length(value) BETWEEN 3 AND 300),
  CONSTRAINT company_contacts_source CHECK (char_length(source_url) <= 500 AND source_url ~* '^https?://'),
  CONSTRAINT company_contacts_status CHECK (status IN ('sin_verificar', 'verificado_en_sitio', 'descartado')),
  CONSTRAINT company_contacts_unique UNIQUE (company_id, kind, value)
);
CREATE INDEX company_contacts_company_idx ON company_contacts (company_id);

-- Cada consulta al proveedor deja constancia: qué se pidió, qué costó (estimado) y si falló.
CREATE TABLE company_research (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider        text NOT NULL,
  model           text NOT NULL,
  status          text NOT NULL,
  website         text,
  contacts_found  integer NOT NULL DEFAULT 0,
  searches        integer NOT NULL DEFAULT 0,
  input_tokens    integer NOT NULL DEFAULT 0,
  output_tokens   integer NOT NULL DEFAULT 0,
  cost_usd        numeric(10, 4) NOT NULL DEFAULT 0,
  error           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_research_status CHECK (status IN ('ok', 'error'))
);
CREATE INDEX company_research_company_idx ON company_research (company_id, created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'radar_app') THEN
    GRANT SELECT, INSERT, UPDATE ON company_contacts TO radar_app;
    GRANT SELECT, INSERT ON company_research TO radar_app;
  END IF;
END
$$;

-- Down Migration

DROP TABLE IF EXISTS company_research;
DROP TABLE IF EXISTS company_contacts;
DELETE FROM company_website_candidates WHERE source = 'grok';
ALTER TABLE company_website_candidates DROP CONSTRAINT company_website_candidates_source;
ALTER TABLE company_website_candidates ADD CONSTRAINT company_website_candidates_source CHECK (source IN ('auto', 'ia'));
