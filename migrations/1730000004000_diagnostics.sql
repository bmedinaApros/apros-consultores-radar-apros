-- Up Migration

-- ===== Plantillas por rubro (orientan el lenguaje y los ejemplos; no aportan datos) =====
CREATE TABLE diagnostic_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id uuid REFERENCES industries(id) ON DELETE CASCADE,
  name        text NOT NULL,
  guidance    text NOT NULL,
  version     integer NOT NULL DEFAULT 1,
  updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT diagnostic_templates_guidance_len CHECK (length(guidance) BETWEEN 10 AND 3000)
);
CREATE UNIQUE INDEX diagnostic_templates_industry_key ON diagnostic_templates (industry_id) WHERE industry_id IS NOT NULL;
CREATE UNIQUE INDEX diagnostic_templates_general_key ON diagnostic_templates ((true)) WHERE industry_id IS NULL;

-- ===== Diagnósticos =====
CREATE TABLE diagnostics (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status              text NOT NULL DEFAULT 'draft',
  current_version_id  uuid,
  approved_version_id uuid,
  stale               boolean NOT NULL DEFAULT false,
  stale_reason        text,
  created_by          uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  approved_by         uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at         timestamptz,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT diagnostics_status CHECK (status IN ('draft', 'in_review', 'approved', 'rejected')),
  CONSTRAINT diagnostics_approved_has_version CHECK (status <> 'approved' OR (approved_version_id IS NOT NULL AND approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE UNIQUE INDEX diagnostics_company_key ON diagnostics (company_id);
CREATE INDEX diagnostics_status_idx ON diagnostics (status);

-- ===== Versiones (solo inserción): cada generación o edición crea una nueva =====
CREATE TABLE diagnostic_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id   uuid NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  version         integer NOT NULL,
  source          text NOT NULL,
  content         jsonb NOT NULL,
  flags           jsonb NOT NULL DEFAULT '[]'::jsonb,
  blocking_flags  integer NOT NULL DEFAULT 0,
  evidence_run_id uuid REFERENCES analysis_runs(id) ON DELETE SET NULL,
  observation_ids bigint[] NOT NULL DEFAULT '{}',
  score_id        uuid REFERENCES scores(id) ON DELETE SET NULL,
  generation_id   uuid,
  template_hash   text,
  content_hash    text NOT NULL,
  edited_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (diagnostic_id, version),
  CONSTRAINT diagnostic_versions_source CHECK (source IN ('ai', 'simulated', 'human_edit'))
);
CREATE INDEX diagnostic_versions_diag_idx ON diagnostic_versions (diagnostic_id, version DESC);
ALTER TABLE diagnostics ADD CONSTRAINT diagnostics_current_fk FOREIGN KEY (current_version_id) REFERENCES diagnostic_versions(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE diagnostics ADD CONSTRAINT diagnostics_approved_fk FOREIGN KEY (approved_version_id) REFERENCES diagnostic_versions(id) DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER diagnostic_versions_immutable BEFORE UPDATE OR DELETE ON diagnostic_versions
  FOR EACH ROW EXECUTE FUNCTION immutable_row();

-- ===== Historial de eventos (autor, cambios, aprobador) =====
CREATE TABLE diagnostic_events (
  id            bigserial PRIMARY KEY,
  diagnostic_id uuid NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  version_id    uuid,
  action        text NOT NULL,
  actor_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  note          text,
  at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX diagnostic_events_diag_idx ON diagnostic_events (diagnostic_id, id);
CREATE TRIGGER diagnostic_events_immutable BEFORE UPDATE OR DELETE ON diagnostic_events
  FOR EACH ROW EXECUTE FUNCTION immutable_row();

-- ===== Generaciones con IA: modelo, versión del prompt, tokens y costo =====
CREATE TABLE ai_generations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id    uuid REFERENCES diagnostics(id) ON DELETE SET NULL,
  company_id       uuid REFERENCES companies(id) ON DELETE SET NULL,
  provider         text NOT NULL,
  model            text NOT NULL,
  prompt_version   text NOT NULL,
  template_hash    text,
  input_tokens     integer NOT NULL DEFAULT 0,
  output_tokens    integer NOT NULL DEFAULT 0,
  cache_read_tokens integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  status           text NOT NULL,
  error            text,
  duration_ms      integer NOT NULL DEFAULT 0,
  raw_output       jsonb,
  requested_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_generations_status CHECK (status IN ('ok', 'invalid_output', 'refused', 'error', 'budget_blocked')),
  CONSTRAINT ai_generations_cost CHECK (estimated_cost_usd >= 0)
);
CREATE INDEX ai_generations_created_idx ON ai_generations (created_at DESC);
CREATE INDEX ai_generations_company_idx ON ai_generations (company_id, created_at DESC);
CREATE TRIGGER ai_generations_immutable BEFORE UPDATE OR DELETE ON ai_generations
  FOR EACH ROW EXECUTE FUNCTION immutable_row();

-- ===== Exportaciones (auditoría de lo que salió del sistema) =====
CREATE TABLE diagnostic_exports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id uuid NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  version_id    uuid NOT NULL REFERENCES diagnostic_versions(id),
  format        text NOT NULL,
  sha256        text NOT NULL,
  bytes         integer NOT NULL,
  exported_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT diagnostic_exports_format CHECK (format IN ('pdf', 'pptx'))
);
CREATE INDEX diagnostic_exports_diag_idx ON diagnostic_exports (diagnostic_id, created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'radar_app') THEN
    GRANT SELECT, INSERT, UPDATE ON diagnostic_templates, diagnostics TO radar_app;
    GRANT SELECT, INSERT ON diagnostic_versions, diagnostic_events, ai_generations, diagnostic_exports TO radar_app;
    GRANT USAGE, SELECT ON SEQUENCE diagnostic_events_id_seq TO radar_app;
  END IF;
END
$$;

-- Down Migration

DROP TABLE IF EXISTS diagnostic_exports;
DROP TABLE IF EXISTS ai_generations;
DROP TABLE IF EXISTS diagnostic_events;
ALTER TABLE IF EXISTS diagnostics DROP CONSTRAINT IF EXISTS diagnostics_current_fk;
ALTER TABLE IF EXISTS diagnostics DROP CONSTRAINT IF EXISTS diagnostics_approved_fk;
DROP TABLE IF EXISTS diagnostic_versions;
DROP TABLE IF EXISTS diagnostics;
DROP TABLE IF EXISTS diagnostic_templates;
