-- V2-1: acceso con usuario y contraseña, y preferencias de interfaz por usuario.
ALTER TABLE users
  ADD COLUMN password_hash        text,
  ADD COLUMN password_set_at      timestamptz,
  ADD COLUMN must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN failed_attempts      integer NOT NULL DEFAULT 0,
  ADD COLUMN locked_until         timestamptz,
  ADD COLUMN ui_prefs             jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD CONSTRAINT users_failed_attempts_nonneg CHECK (failed_attempts >= 0),
  ADD CONSTRAINT users_ui_prefs_object CHECK (jsonb_typeof(ui_prefs) = 'object' AND pg_column_size(ui_prefs) < 2048);

-- Una sesión «restringida» solo sirve para cambiar la clave temporal; el resto de la aplicación la trata como inexistente.
ALTER TABLE sessions ADD COLUMN restricted boolean NOT NULL DEFAULT false;
