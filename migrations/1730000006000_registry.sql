-- Up Migration

-- V2-2: base oficial. El padrón vive en tablas propias (no en `companies`): millones de filas sin web ni análisis.
-- Una empresa pasa a `companies` solo cuando una persona la promueve.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Códigos de ubigeo (INEI). Se siembran los 25 departamentos (2 dígitos); provincias y distritos se pueden cargar después.
CREATE TABLE ubigeo (
  code       text PRIMARY KEY,
  department text NOT NULL,
  province   text,
  district   text,
  CONSTRAINT ubigeo_code_format CHECK (code ~ '^[0-9]{2}([0-9]{2}([0-9]{2})?)?$')
);
INSERT INTO ubigeo (code, department) VALUES
  ('01','Amazonas'),('02','Áncash'),('03','Apurímac'),('04','Arequipa'),('05','Ayacucho'),('06','Cajamarca'),('07','Callao'),
  ('08','Cusco'),('09','Huancavelica'),('10','Huánuco'),('11','Ica'),('12','Junín'),('13','La Libertad'),('14','Lambayeque'),
  ('15','Lima'),('16','Loreto'),('17','Madre de Dios'),('18','Moquegua'),('19','Pasco'),('20','Piura'),('21','Puno'),
  ('22','San Martín'),('23','Tacna'),('24','Tumbes'),('25','Ucayali');

-- Cada carga de un archivo. El punto de control (`last_line`) permite reanudar sin repetir lo ya cargado.
CREATE TABLE registry_batches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind             text NOT NULL,
  file_name        text NOT NULL,
  file_size        bigint,
  file_fingerprint text,
  source_code      text NOT NULL DEFAULT 'sunat_padron',
  source_url       text,
  source_note      text,
  connector_version text NOT NULL,
  filters          jsonb NOT NULL DEFAULT '{}'::jsonb,
  filters_hash     text NOT NULL,
  status           text NOT NULL DEFAULT 'queued',
  rows_read        bigint NOT NULL DEFAULT 0,
  rows_loaded      bigint NOT NULL DEFAULT 0,
  rows_skipped     bigint NOT NULL DEFAULT 0,
  rows_invalid     bigint NOT NULL DEFAULT 0,
  skipped          jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_line        bigint NOT NULL DEFAULT 0,
  error            text,
  started_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  started_at       timestamptz,
  finished_at      timestamptz,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT registry_batches_kind CHECK (kind IN ('ruc', 'local_anexo')),
  CONSTRAINT registry_batches_status CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelling', 'cancelled'))
);
CREATE INDEX registry_batches_created_idx ON registry_batches (created_at DESC);

CREATE TABLE registry_companies (
  ruc                  text PRIMARY KEY,
  legal_name           text NOT NULL,
  normalized_name      text NOT NULL,
  status               text,
  condition            text,
  ubigeo               text,
  address              text,
  is_legal_entity      boolean GENERATED ALWAYS AS (left(ruc, 2) = '20') STORED,
  suggested_industry_id uuid REFERENCES industries(id) ON DELETE SET NULL,
  first_batch_id       uuid REFERENCES registry_batches(id) ON DELETE SET NULL,
  last_batch_id        uuid REFERENCES registry_batches(id) ON DELETE SET NULL,
  loaded_at            timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  missing_since        timestamptz,
  CONSTRAINT registry_companies_ruc_format CHECK (ruc ~ '^[0-9]{11}$'),
  CONSTRAINT registry_companies_ubigeo_format CHECK (ubigeo IS NULL OR ubigeo ~ '^[0-9]{6}$')
);
CREATE INDEX registry_companies_name_trgm ON registry_companies USING gin (normalized_name gin_trgm_ops);
CREATE INDEX registry_companies_ubigeo_idx ON registry_companies (ubigeo text_pattern_ops);
CREATE INDEX registry_companies_state_idx ON registry_companies (status, condition);
CREATE INDEX registry_companies_industry_idx ON registry_companies (suggested_industry_id) WHERE suggested_industry_id IS NOT NULL;
CREATE INDEX registry_companies_batch_idx ON registry_companies (last_batch_id);

-- Establecimientos anexos (sucursales, locales). Una empresa puede tener muchos.
CREATE TABLE registry_locations (
  id        bigserial PRIMARY KEY,
  ruc       text NOT NULL,
  ubigeo    text,
  address   text NOT NULL,
  loc_key   text NOT NULL,
  batch_id  uuid REFERENCES registry_batches(id) ON DELETE SET NULL,
  CONSTRAINT registry_locations_ruc_format CHECK (ruc ~ '^[0-9]{11}$'),
  CONSTRAINT registry_locations_ubigeo_format CHECK (ubigeo IS NULL OR ubigeo ~ '^[0-9]{6}$')
);
CREATE UNIQUE INDEX registry_locations_key ON registry_locations (ruc, loc_key);
CREATE INDEX registry_locations_ubigeo_idx ON registry_locations (ubigeo text_pattern_ops);

-- Palabras que sugieren un rubro a partir de la razón social (reglas editables; la persona confirma al promover).
CREATE TABLE industry_keywords (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id uuid NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  keyword     text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT industry_keywords_format CHECK (keyword ~ '^[a-z0-9]+( [a-z0-9]+)*$' AND length(keyword) BETWEEN 3 AND 40)
);
CREATE UNIQUE INDEX industry_keywords_key ON industry_keywords (industry_id, keyword);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'radar_app') THEN
    GRANT SELECT ON ubigeo TO radar_app;
    GRANT SELECT, INSERT, UPDATE ON registry_batches, registry_companies TO radar_app;
    GRANT SELECT, INSERT ON registry_locations TO radar_app;
    GRANT USAGE, SELECT ON SEQUENCE registry_locations_id_seq TO radar_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON industry_keywords TO radar_app;
  END IF;
END
$$;

-- Down Migration

DROP TABLE IF EXISTS industry_keywords;
DROP TABLE IF EXISTS registry_locations;
DROP TABLE IF EXISTS registry_companies;
DROP TABLE IF EXISTS registry_batches;
DROP TABLE IF EXISTS ubigeo;
