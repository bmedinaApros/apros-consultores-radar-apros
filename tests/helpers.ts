import { Pool } from "pg";

export const ownerPool = () =>
  new Pool({ connectionString: process.env.MIGRATE_DATABASE_URL });

export async function resetData() {
  const owner = ownerPool();
  await owner.query("ALTER TABLE audit_log DISABLE TRIGGER USER");
  await owner.query("TRUNCATE audit_log, sessions, users, companies, import_batches, do_not_contact, active_clients, discovery_runs, source_providers RESTART IDENTITY CASCADE");
  await owner.query("ALTER TABLE audit_log ENABLE TRIGGER USER");
  await owner.end();
}

export const mkActor = async (role: "admin" | "sales_lead" | "salesperson" | "consultant" | "read_only", email = `${role}@apros.pe`) => {
  const owner = ownerPool();
  const r = await owner.query<{ id: string }>(
    `INSERT INTO users (email, name, role) VALUES ($1, $1, $2::user_role) ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role RETURNING id`,
    [email, role]);
  await owner.end();
  return { id: r.rows[0]!.id, email, role };
};
