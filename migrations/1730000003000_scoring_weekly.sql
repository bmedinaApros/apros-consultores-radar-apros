-- Up Migration

-- ===== Modelos de puntaje (versionados e inmutables) =====
CREATE TABLE scoring_models (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id uuid REFERENCES industries(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX scoring_models_industry_key ON scoring_models (industry_id) WHERE industry_id IS NOT NULL;
CREATE UNIQUE INDEX scoring_models_general_key ON scoring_models ((true)) WHERE industry_id IS NULL;

CREATE TABLE scoring_model_versions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id   uuid NOT NULL REFERENCES scoring_models(id) ON DELETE CASCADE,
  version    integer NOT NULL,
  definition jsonb NOT NULL,
  note       text,
  active     boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (model_id, version)
);
CREATE UNIQUE INDEX scoring_model_versions_active_key ON scoring_model_versions (model_id) WHERE active;

CREATE FUNCTION scoring_model_versions_guard() RETURNS trigger AS $$
BEGIN
  IF NEW.definition IS DISTINCT FROM OLD.definition OR NEW.version IS DISTINCT FROM OLD.version OR NEW.model_id IS DISTINCT FROM OLD.model_id THEN
    RAISE EXCEPTION 'las versiones de un modelo de puntaje son inmutables; crea una versión nueva';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER scoring_model_versions_guard_trg BEFORE UPDATE ON scoring_model_versions
  FOR EACH ROW EXECUTE FUNCTION scoring_model_versions_guard();

-- ===== Criterios manuales y ajustes (solo inserción) =====
CREATE TABLE manual_signals (
  id         bigserial PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key        text NOT NULL,
  value      text NOT NULL,
  set_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  set_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX manual_signals_company_idx ON manual_signals (company_id, key, id DESC);

CREATE TABLE score_adjustments (
  id         bigserial PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  delta      numeric(4,1) NOT NULL,
  reason     text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT score_adjustments_range CHECK (delta BETWEEN -50 AND 50),
  CONSTRAINT score_adjustments_reason CHECK (length(btrim(reason)) > 0)
);
CREATE INDEX score_adjustments_company_idx ON score_adjustments (company_id, id DESC);

-- ===== Puntajes (inmutables, explicables y reproducibles) =====
CREATE TABLE scores (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  analysis_run_id  uuid REFERENCES analysis_runs(id) ON DELETE SET NULL,
  model_version_id uuid NOT NULL REFERENCES scoring_model_versions(id),
  computed         numeric(4,1) NOT NULL,
  total            numeric(4,1) NOT NULL,
  band             text NOT NULL,
  disqualified     boolean NOT NULL DEFAULT false,
  data_coverage    numeric(3,2) NOT NULL,
  breakdown        jsonb NOT NULL,
  reasons          text[] NOT NULL,
  observation_ids  bigint[] NOT NULL,
  manual_snapshot  jsonb NOT NULL,
  adjustment       jsonb,
  company_snapshot jsonb NOT NULL,
  as_of            timestamptz NOT NULL,
  inputs_hash      text NOT NULL,
  computed_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scores_band CHECK (band IN ('sales', 'nurturing', 'discard')),
  CONSTRAINT scores_range CHECK (total BETWEEN 0 AND 100 AND computed BETWEEN 0 AND 100)
);
CREATE INDEX scores_company_idx ON scores (company_id, computed_at DESC);
CREATE INDEX scores_band_idx ON scores (band, total DESC);

CREATE FUNCTION immutable_row() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% es de solo inserción', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER scores_immutable BEFORE UPDATE ON scores FOR EACH ROW EXECUTE FUNCTION immutable_row();
CREATE TRIGGER manual_signals_immutable BEFORE UPDATE OR DELETE ON manual_signals FOR EACH ROW EXECUTE FUNCTION immutable_row();
CREATE TRIGGER score_adjustments_immutable BEFORE UPDATE ON score_adjustments FOR EACH ROW EXECUTE FUNCTION immutable_row();

-- ===== Catálogo de servicios de APROS y su relación con señales =====
CREATE TABLE service_offers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  active      boolean NOT NULL DEFAULT true,
  is_example  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_offers_slug CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
CREATE UNIQUE INDEX service_offers_slug_key ON service_offers (slug);

CREATE TABLE signal_service_rules (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES service_offers(id) ON DELETE CASCADE,
  rationale text NOT NULL,
  predicate jsonb NOT NULL,
  active    boolean NOT NULL DEFAULT true,
  CONSTRAINT signal_service_rules_rationale CHECK (length(btrim(rationale)) > 0)
);
CREATE INDEX signal_service_rules_service_idx ON signal_service_rules (service_id);

-- ===== Configuración =====
CREATE TABLE app_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Ejecución semanal y listas =====
CREATE TABLE weekly_runs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start   date NOT NULL,
  status       text NOT NULL DEFAULT 'running',
  triggered_by uuid REFERENCES users(id) ON DELETE SET NULL,
  trigger_kind text NOT NULL DEFAULT 'manual',
  partial      boolean NOT NULL DEFAULT false,
  stats        jsonb NOT NULL DEFAULT '{}'::jsonb,
  error        text,
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  CONSTRAINT weekly_runs_status CHECK (status IN ('running', 'completed', 'failed'))
);
CREATE INDEX weekly_runs_week_idx ON weekly_runs (week_start DESC, started_at DESC);

CREATE TABLE weekly_lists (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         uuid NOT NULL REFERENCES weekly_runs(id) ON DELETE CASCADE,
  week_start     date NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  total_items    integer NOT NULL,
  partial        boolean NOT NULL,
  coverage       jsonb NOT NULL,
  budget         jsonb NOT NULL,
  model_versions jsonb NOT NULL,
  settings       jsonb NOT NULL,
  excluded       jsonb NOT NULL
);
CREATE UNIQUE INDEX weekly_lists_run_key ON weekly_lists (run_id);
CREATE INDEX weekly_lists_week_idx ON weekly_lists (week_start DESC, created_at DESC);

CREATE TABLE weekly_list_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id       uuid NOT NULL REFERENCES weekly_lists(id) ON DELETE CASCADE,
  rank          integer NOT NULL,
  company_id    uuid REFERENCES companies(id) ON DELETE SET NULL,
  company_name  text NOT NULL,
  company_domain text,
  score_id      uuid REFERENCES scores(id) ON DELETE SET NULL,
  score         numeric(4,1) NOT NULL,
  band          text NOT NULL,
  model_name    text NOT NULL,
  model_version integer NOT NULL,
  model_version_id uuid NOT NULL,
  data_coverage numeric(3,2) NOT NULL,
  services      jsonb NOT NULL,
  reasons       jsonb NOT NULL,
  flags         jsonb NOT NULL,
  review_status text NOT NULL DEFAULT 'pending_review',
  reviewed_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  review_note   text,
  assigned_to   uuid REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT weekly_list_items_status CHECK (review_status IN ('pending_review', 'approved', 'rejected')),
  CONSTRAINT weekly_list_items_band CHECK (band IN ('sales', 'nurturing')),
  UNIQUE (list_id, rank)
);
CREATE INDEX weekly_list_items_company_idx ON weekly_list_items (company_id);
CREATE INDEX weekly_list_items_assigned_idx ON weekly_list_items (assigned_to, review_status);

-- El snapshot es inmutable: solo se pueden cambiar los campos de revisión y asignación.
CREATE FUNCTION weekly_list_items_guard() RETURNS trigger AS $$
BEGIN
  IF (NEW.list_id, NEW.rank, NEW.company_name, NEW.company_domain, NEW.score, NEW.band, NEW.model_name, NEW.model_version,
      NEW.model_version_id, NEW.data_coverage, NEW.services, NEW.reasons, NEW.flags)
     IS DISTINCT FROM
     (OLD.list_id, OLD.rank, OLD.company_name, OLD.company_domain, OLD.score, OLD.band, OLD.model_name, OLD.model_version,
      OLD.model_version_id, OLD.data_coverage, OLD.services, OLD.reasons, OLD.flags) THEN
    RAISE EXCEPTION 'la lista semanal es inmutable: solo se puede cambiar la revisión y la asignación';
  END IF;
  IF NEW.company_id IS DISTINCT FROM OLD.company_id AND NEW.company_id IS NOT NULL THEN
    RAISE EXCEPTION 'la lista semanal es inmutable';
  END IF;
  IF NEW.score_id IS DISTINCT FROM OLD.score_id AND NEW.score_id IS NOT NULL THEN
    RAISE EXCEPTION 'la lista semanal es inmutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER weekly_list_items_guard_trg BEFORE UPDATE ON weekly_list_items
  FOR EACH ROW EXECUTE FUNCTION weekly_list_items_guard();
CREATE TRIGGER weekly_lists_immutable BEFORE UPDATE ON weekly_lists FOR EACH ROW EXECUTE FUNCTION immutable_row();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'radar_app') THEN
    GRANT SELECT, INSERT, UPDATE ON scoring_models TO radar_app;
    GRANT SELECT, INSERT, UPDATE ON scoring_model_versions TO radar_app;
    GRANT SELECT, INSERT ON manual_signals, score_adjustments, scores, weekly_lists TO radar_app;
    GRANT USAGE, SELECT ON SEQUENCE manual_signals_id_seq, score_adjustments_id_seq TO radar_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON service_offers, signal_service_rules TO radar_app;
    GRANT SELECT, INSERT, UPDATE ON app_settings, weekly_runs TO radar_app;
    GRANT SELECT, INSERT, UPDATE ON weekly_list_items TO radar_app;
  END IF;
END
$$;

-- Down Migration

DROP TABLE IF EXISTS weekly_list_items;
DROP FUNCTION IF EXISTS weekly_list_items_guard();
DROP TABLE IF EXISTS weekly_lists;
DROP TABLE IF EXISTS weekly_runs;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS signal_service_rules;
DROP TABLE IF EXISTS service_offers;
DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS score_adjustments;
DROP TABLE IF EXISTS manual_signals;
DROP TABLE IF EXISTS scoring_model_versions;
DROP FUNCTION IF EXISTS scoring_model_versions_guard();
DROP TABLE IF EXISTS scoring_models;
DROP FUNCTION IF EXISTS immutable_row();
