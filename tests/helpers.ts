import { Pool } from "pg";

export const ownerPool = () =>
  new Pool({ connectionString: process.env.MIGRATE_DATABASE_URL });

export async function resetData() {
  const owner = ownerPool();
  await owner.query("ALTER TABLE audit_log DISABLE TRIGGER USER");
  await owner.query("TRUNCATE audit_log, sessions, users RESTART IDENTITY CASCADE");
  await owner.query("ALTER TABLE audit_log ENABLE TRIGGER USER");
  await owner.end();
}
