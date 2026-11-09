-- Up Migration

-- V2-3a: el diagnóstico por plantillas y reglas queda como una fuente más de versiones (junto a «ai», «simulated» histórico y «human_edit»).
ALTER TABLE diagnostic_versions DROP CONSTRAINT diagnostic_versions_source;
ALTER TABLE diagnostic_versions ADD CONSTRAINT diagnostic_versions_source CHECK (source IN ('ai', 'rules', 'simulated', 'human_edit'));

-- Verificaciones del sitio web de una empresa (ingreso rápido con validación). Se conserva el historial.
CREATE TABLE company_web_validations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  domain        text NOT NULL,
  status        text NOT NULL,
  http_status   integer,
  final_url     text,
  robots        text NOT NULL,
  detail        jsonb NOT NULL DEFAULT '{}'::jsonb,
  checked_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  checked_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_web_validations_status CHECK (status IN ('ok', 'warning', 'failed')),
  CONSTRAINT company_web_validations_robots CHECK (robots IN ('permite', 'bloquea', 'sin_robots', 'no_verificado'))
);
CREATE INDEX company_web_validations_company_idx ON company_web_validations (company_id, checked_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'radar_app') THEN
    GRANT SELECT, INSERT ON company_web_validations TO radar_app;
  END IF;
END
$$;

-- Down Migration

DROP TABLE IF EXISTS company_web_validations;
-- La restricción de `diagnostic_versions.source` se deja ampliada: esas filas no se pueden modificar ni borrar (tabla inmutable).
