import { Pool } from "pg";
import { runner } from "node-pg-migrate";
import path from "node:path";

/** Recrea el esquema de la base de pruebas y aplica todas las migraciones. */
export default async function setup() {
  const url =
    process.env.TEST_MIGRATE_DATABASE_URL ?? "postgres://radar_owner:radar_dev@localhost:5432/radar_test";
  const pool = new Pool({ connectionString: url });
  await pool.query("DROP SCHEMA IF EXISTS pgboss CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await pool.end();
  await runner({
    databaseUrl: url,
    dir: path.resolve(__dirname, "../migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    log: () => {},
  });
}
