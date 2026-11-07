/* Datos ficticios para desarrollo local. Nunca se ejecuta en producción. */
import { Pool } from "pg";

if (process.env.NODE_ENV === "production") {
  console.error("seed-dev no se ejecuta en producción");
  process.exit(1);
}

const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("Falta MIGRATE_DATABASE_URL o DATABASE_URL");

const users = [
  ["admin.demo@apros.pe", "Admin Demo (ficticio)", "admin"],
  ["lider.demo@apros.pe", "Líder Comercial Demo (ficticio)", "sales_lead"],
  ["vendedor.demo@apros.pe", "Vendedor Demo (ficticio)", "salesperson"],
  ["consultor.demo@apros.pe", "Consultor Demo (ficticio)", "consultant"],
  ["lectura.demo@apros.pe", "Lectura Demo (ficticio)", "read_only"],
] as const;

const pool = new Pool({ connectionString: url });
for (const [email, name, role] of users) {
  await pool.query(
    `INSERT INTO users (email, name, role) VALUES ($1, $2, $3::user_role)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, active = true`,
    [email, name, role],
  );
}
await pool.end();
console.log(`Usuarios ficticios listos: ${users.length}`);
