-- Up Migration

CREATE TYPE user_role AS ENUM ('admin', 'sales_lead', 'salesperson', 'consultant', 'read_only');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  name          text NOT NULL DEFAULT '',
  role          user_role NOT NULL DEFAULT 'read_only',
  active        boolean NOT NULL DEFAULT true,
  google_sub    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  CONSTRAINT users_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT users_email_format CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
CREATE UNIQUE INDEX users_email_key ON users (email);
CREATE UNIQUE INDEX users_google_sub_key ON users (google_sub) WHERE google_sub IS NOT NULL;

CREATE TABLE sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   bytea NOT NULL,
  csrf_secret  text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  user_agent   text
);
CREATE UNIQUE INDEX sessions_token_hash_key ON sessions (token_hash);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);

-- Auditoría: solo inserción, con cadena de hashes para detectar manipulación.
CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  actor_id    uuid,
  actor_email text,
  action      text NOT NULL,
  entity_type text,
  entity_id   text,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_id  text,
  prev_hash   bytea,
  hash        bytea
);
CREATE INDEX audit_log_entity_idx ON audit_log (entity_type, entity_id, at);
CREATE INDEX audit_log_at_idx ON audit_log (at DESC);

CREATE FUNCTION audit_log_chain() RETURNS trigger AS $$
DECLARE
  last_hash bytea;
BEGIN
  PERFORM pg_advisory_xact_lock(727001);
  SELECT hash INTO last_hash FROM audit_log ORDER BY id DESC LIMIT 1;
  NEW.at := now();
  NEW.prev_hash := last_hash;
  NEW.hash := sha256(
    convert_to(
      coalesce(encode(last_hash, 'hex'), '') || '|' || to_char(NEW.at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || '|' ||
      coalesce(NEW.actor_id::text, '') || '|' || coalesce(NEW.actor_email, '') || '|' ||
      NEW.action || '|' || coalesce(NEW.entity_type, '') || '|' || coalesce(NEW.entity_id, '') || '|' ||
      NEW.metadata::text || '|' || coalesce(NEW.request_id, ''),
      'UTF8'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_chain_trg BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_chain();

CREATE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log es de solo inserción';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_immutable();

-- Mínimos privilegios para el rol de la aplicación (si existe).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'radar_app') THEN
    GRANT USAGE ON SCHEMA public TO radar_app;
    GRANT SELECT, INSERT, UPDATE ON users TO radar_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO radar_app;
    GRANT SELECT, INSERT ON audit_log TO radar_app;
    GRANT USAGE, SELECT ON SEQUENCE audit_log_id_seq TO radar_app;
  END IF;
END
$$;

-- Down Migration

DROP TABLE IF EXISTS audit_log;
DROP FUNCTION IF EXISTS audit_log_chain();
DROP FUNCTION IF EXISTS audit_log_immutable();
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS user_role;
