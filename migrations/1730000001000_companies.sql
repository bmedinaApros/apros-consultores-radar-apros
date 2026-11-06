-- Up Migration

CREATE TYPE pipeline_stage AS ENUM (
  'detected', 'analyzed', 'prioritized', 'diagnosis_approved', 'contacted',
  'meeting', 'proposal', 'won', 'lost', 'nurturing', 'discarded'
);
CREATE TYPE classification_status AS ENUM ('classified', 'to_classify');

-- Rubros: editables desde la interfaz. parent_id permite subrubros.
CREATE TABLE industries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL,
  name       text NOT NULL,
  parent_id  uuid REFERENCES industries(id) ON DELETE RESTRICT,
  active     boolean NOT NULL DEFAULT true,
  is_example boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT industries_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
CREATE UNIQUE INDEX industries_slug_key ON industries (slug);

INSERT INTO industries (slug, name, is_example) VALUES
  ('inmobiliario', 'Inmobiliario', true),
  ('consumo-masivo', 'Consumo masivo', true),
  ('salud', 'Salud', true),
  ('educacion', 'Educación', true),
  ('retail', 'Retail', true),
  ('servicios-profesionales', 'Servicios profesionales', true),
  ('industria', 'Industria', true);

CREATE TABLE import_batches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename     text NOT NULL,
  uploaded_by  uuid NOT NULL REFERENCES users(id),
  status       text NOT NULL DEFAULT 'previewed',
  total_rows   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  committed_at timestamptz,
  undone_at    timestamptz,
  CONSTRAINT import_batches_status CHECK (status IN ('previewed', 'committed', 'undone', 'discarded'))
);

CREATE TABLE companies (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name            text NOT NULL,
  trade_name            text,
  normalized_name       text NOT NULL,
  domain                text,
  ruc                   text,
  industry_id           uuid REFERENCES industries(id) ON DELETE SET NULL,
  subindustry           text,
  city                  text,
  owner_id              uuid REFERENCES users(id) ON DELETE SET NULL,
  stage                 pipeline_stage NOT NULL DEFAULT 'detected',
  classification        classification_status NOT NULL DEFAULT 'to_classify',
  import_batch_id       uuid REFERENCES import_batches(id) ON DELETE SET NULL,
  created_by            uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT companies_ruc_format CHECK (ruc IS NULL OR ruc ~ '^[0-9]{11}$'),
  CONSTRAINT companies_domain_format CHECK (domain IS NULL OR domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'),
  CONSTRAINT companies_name_not_blank CHECK (length(btrim(legal_name)) > 0),
  CONSTRAINT companies_classified_has_industry CHECK (classification = 'to_classify' OR industry_id IS NOT NULL)
);
CREATE UNIQUE INDEX companies_domain_key ON companies (domain) WHERE domain IS NOT NULL;
CREATE UNIQUE INDEX companies_ruc_key ON companies (ruc) WHERE ruc IS NOT NULL;
CREATE INDEX companies_owner_stage_idx ON companies (owner_id, stage);
CREATE INDEX companies_industry_idx ON companies (industry_id);
CREATE INDEX companies_batch_idx ON companies (import_batch_id);
CREATE INDEX companies_classification_idx ON companies (classification);

-- Procedencia: fuente, fecha y finalidad de cada dato de empresa.
CREATE TABLE company_sources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_code   text NOT NULL,
  source_ref    text,
  purpose       text NOT NULL DEFAULT 'prospección comercial B2B',
  import_batch_id uuid REFERENCES import_batches(id) ON DELETE SET NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX company_sources_company_idx ON company_sources (company_id);

CREATE TABLE import_rows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id    uuid NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number  integer NOT NULL,
  raw         jsonb NOT NULL,
  normalized  jsonb,
  status      text NOT NULL,
  errors      jsonb NOT NULL DEFAULT '[]'::jsonb,
  match_company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  match_kind  text,
  match_score numeric(4,3),
  decision    text,
  company_id  uuid REFERENCES companies(id) ON DELETE SET NULL,
  CONSTRAINT import_rows_status CHECK (status IN ('valid', 'error', 'duplicate', 'possible_duplicate', 'blocked', 'excluded_client')),
  CONSTRAINT import_rows_decision CHECK (decision IS NULL OR decision IN ('create', 'skip', 'merge'))
);
CREATE INDEX import_rows_batch_idx ON import_rows (batch_id, row_number);

CREATE TABLE duplicate_candidates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  other_company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reason           text NOT NULL,
  score            numeric(4,3) NOT NULL,
  status           text NOT NULL DEFAULT 'pending',
  resolved_by      uuid REFERENCES users(id),
  resolved_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT duplicate_candidates_distinct CHECK (company_id <> other_company_id),
  CONSTRAINT duplicate_candidates_status CHECK (status IN ('pending', 'merged', 'dismissed'))
);
CREATE UNIQUE INDEX duplicate_candidates_pair_key
  ON duplicate_candidates (least(company_id, other_company_id), greatest(company_id, other_company_id));

-- Lista de no contactar: por empresa (RUC o nombre normalizado), dominio o correo.
CREATE TABLE do_not_contact (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       text NOT NULL,
  value      text NOT NULL,
  reason     text NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT do_not_contact_kind CHECK (kind IN ('company', 'domain', 'email')),
  CONSTRAINT do_not_contact_value_lower CHECK (value = lower(value)),
  CONSTRAINT do_not_contact_reason CHECK (length(btrim(reason)) > 0)
);
CREATE UNIQUE INDEX do_not_contact_key ON do_not_contact (kind, value);

-- Clientes activos: se excluyen del descubrimiento (la cartera es otro sistema).
CREATE TABLE active_clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  normalized_name text NOT NULL,
  domain          text,
  ruc             text,
  created_by      uuid REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT active_clients_ruc_format CHECK (ruc IS NULL OR ruc ~ '^[0-9]{11}$')
);
CREATE INDEX active_clients_domain_idx ON active_clients (domain);
CREATE INDEX active_clients_ruc_idx ON active_clients (ruc);
CREATE INDEX active_clients_name_idx ON active_clients (normalized_name);

-- Proveedores de fuentes: desactivados por defecto; solo se activan con términos aprobados.
CREATE TABLE source_providers (
  code               text PRIMARY KEY,
  name               text NOT NULL,
  enabled            boolean NOT NULL DEFAULT false,
  terms_doc_path     text,
  terms_approved_by  uuid REFERENCES users(id),
  terms_approved_at  timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT source_providers_enabled_needs_terms
    CHECK (NOT enabled OR (terms_doc_path IS NOT NULL AND terms_approved_by IS NOT NULL AND terms_approved_at IS NOT NULL))
);

CREATE TABLE discovery_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code text NOT NULL REFERENCES source_providers(code),
  started_by    uuid REFERENCES users(id),
  status        text NOT NULL DEFAULT 'running',
  found         integer NOT NULL DEFAULT 0,
  created       integer NOT NULL DEFAULT 0,
  duplicates    integer NOT NULL DEFAULT 0,
  blocked       integer NOT NULL DEFAULT 0,
  excluded      integer NOT NULL DEFAULT 0,
  error         text,
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz,
  CONSTRAINT discovery_runs_status CHECK (status IN ('running', 'completed', 'failed'))
);

-- Mínimos privilegios para la aplicación.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'radar_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON companies, company_sources, import_rows, duplicate_candidates,
      do_not_contact, active_clients TO radar_app;
    GRANT SELECT, INSERT, UPDATE ON industries, import_batches, source_providers, discovery_runs TO radar_app;
    GRANT DELETE ON industries TO radar_app;
  END IF;
END
$$;

-- Down Migration

DROP TABLE IF EXISTS discovery_runs;
DROP TABLE IF EXISTS source_providers;
DROP TABLE IF EXISTS active_clients;
DROP TABLE IF EXISTS do_not_contact;
DROP TABLE IF EXISTS duplicate_candidates;
DROP TABLE IF EXISTS import_rows;
DROP TABLE IF EXISTS company_sources;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS import_batches;
DROP TABLE IF EXISTS industries;
DROP TYPE IF EXISTS classification_status;
DROP TYPE IF EXISTS pipeline_stage;
