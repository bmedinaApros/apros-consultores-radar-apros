-- Up Migration

CREATE TABLE analysis_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'running',
  analyzer_version text NOT NULL,
  domain           text NOT NULL,
  triggered_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  pages_fetched    integer NOT NULL DEFAULT 0,
  pages_budget     integer NOT NULL,
  skip_reason      text,
  error            text,
  pagespeed        jsonb,
  started_at       timestamptz NOT NULL DEFAULT now(),
  finished_at      timestamptz,
  CONSTRAINT analysis_runs_status CHECK (status IN ('running', 'completed', 'failed', 'skipped'))
);
CREATE INDEX analysis_runs_company_idx ON analysis_runs (company_id, started_at DESC);

-- Observaciones: historial de solo inserción (permite detectar cambios en el tiempo).
CREATE TABLE signal_observations (
  id               bigserial PRIMARY KEY,
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  analysis_run_id  uuid NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  signal_code      text NOT NULL,
  status           text NOT NULL,
  kind             text NOT NULL,
  value            jsonb,
  confidence       text NOT NULL,
  evidence_url     text,
  evidence_excerpt text,
  observed_at      timestamptz NOT NULL DEFAULT now(),
  analyzer_version text NOT NULL,
  CONSTRAINT signal_observations_status CHECK (status IN ('observed', 'not_detected', 'unverifiable')),
  CONSTRAINT signal_observations_kind CHECK (kind IN ('observed', 'inferred')),
  CONSTRAINT signal_observations_confidence CHECK (confidence IN ('high', 'medium', 'low')),
  CONSTRAINT signal_observations_excerpt_len CHECK (evidence_excerpt IS NULL OR length(evidence_excerpt) <= 400)
);
CREATE INDEX signal_observations_company_signal_idx ON signal_observations (company_id, signal_code, observed_at DESC);
CREATE INDEX signal_observations_run_idx ON signal_observations (analysis_run_id);

CREATE FUNCTION signal_observations_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'signal_observations es de solo inserción';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER signal_observations_no_update BEFORE UPDATE ON signal_observations
  FOR EACH ROW EXECUTE FUNCTION signal_observations_immutable();

CREATE TABLE fetch_log (
  id           bigserial PRIMARY KEY,
  run_id       uuid NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  url          text NOT NULL,
  outcome      text NOT NULL,
  http_status  integer,
  bytes        integer NOT NULL DEFAULT 0,
  duration_ms  integer NOT NULL DEFAULT 0,
  reason       text,
  fetched_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fetch_log_run_idx ON fetch_log (run_id);

-- Señales por rubro, configurables sin tocar código (detectores de palabras clave).
CREATE TABLE industry_signals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id uuid NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  name        text NOT NULL,
  keywords    text[] NOT NULL,
  scope       text NOT NULL DEFAULT 'text',
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT industry_signals_slug CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT industry_signals_scope CHECK (scope IN ('text', 'links')),
  CONSTRAINT industry_signals_keywords CHECK (cardinality(keywords) BETWEEN 1 AND 20)
);
CREATE UNIQUE INDEX industry_signals_key ON industry_signals (industry_id, slug);

INSERT INTO industry_signals (industry_id, slug, name, keywords, scope)
SELECT i.id, v.slug, v.name, v.keywords, 'text'
FROM (VALUES
  ('inmobiliario', 'cotizacion', 'Cotización o simulador de compra', ARRAY['cotiza', 'cotizar', 'cotización', 'simulador', 'simula tu']),
  ('inmobiliario', 'proyectos', 'Catálogo de proyectos', ARRAY['proyectos', 'departamentos en venta', 'preventa']),
  ('salud', 'citas', 'Reserva de citas', ARRAY['agendar cita', 'reservar cita', 'reserva tu cita', 'solicitar cita', 'pedir cita']),
  ('educacion', 'admision', 'Admisión o matrícula', ARRAY['admisión', 'admision', 'matrícula', 'matricula', 'postula']),
  ('retail', 'comercio-electronico', 'Compra en línea', ARRAY['añadir al carrito', 'agregar al carrito', 'carrito de compras', 'comprar ahora']),
  ('consumo-masivo', 'donde-comprar', 'Dónde comprar / distribuidores', ARRAY['dónde comprar', 'donde comprar', 'distribuidores', 'puntos de venta']),
  ('servicios-profesionales', 'consulta', 'Solicitud de consulta o reunión', ARRAY['agenda una reunión', 'solicita una consulta', 'agendar reunión', 'solicitar asesoría']),
  ('industria', 'cotizacion-industrial', 'Solicitud de cotización industrial', ARRAY['solicitar cotización', 'solicita tu cotización', 'catálogo de productos', 'fichas técnicas'])
) AS v(industry, slug, name, keywords)
JOIN industries i ON i.slug = v.industry;

-- Cola de trabajos (pg-boss): esquema propio, con permisos solo sobre ese esquema.
CREATE SCHEMA IF NOT EXISTS pgboss;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'radar_app') THEN
    GRANT SELECT, INSERT, UPDATE ON analysis_runs TO radar_app;
    GRANT SELECT, INSERT ON signal_observations, fetch_log TO radar_app;
    GRANT USAGE, SELECT ON SEQUENCE signal_observations_id_seq, fetch_log_id_seq TO radar_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON industry_signals TO radar_app;
    GRANT ALL ON SCHEMA pgboss TO radar_app;
  END IF;
END
$$;

-- Down Migration

DROP SCHEMA IF EXISTS pgboss CASCADE;
DROP TABLE IF EXISTS industry_signals;
DROP TABLE IF EXISTS fetch_log;
DROP TABLE IF EXISTS signal_observations;
DROP FUNCTION IF EXISTS signal_observations_immutable();
DROP TABLE IF EXISTS analysis_runs;
