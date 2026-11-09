-- Up Migration
ALTER TABLE diagnostic_exports DROP CONSTRAINT IF EXISTS diagnostic_exports_format;
ALTER TABLE diagnostic_exports ADD CONSTRAINT diagnostic_exports_format CHECK (format IN ('pdf','pptx','informe'));

-- Down Migration
DELETE FROM diagnostic_exports WHERE format = 'informe';
ALTER TABLE diagnostic_exports DROP CONSTRAINT IF EXISTS diagnostic_exports_format;
ALTER TABLE diagnostic_exports ADD CONSTRAINT diagnostic_exports_format CHECK (format IN ('pdf','pptx'));
