import { runner } from "node-pg-migrate";
import { fileURLToPath } from "node:url";
import path from "node:path";

const direction = process.argv[2] === "down" ? "down" : "up";
const databaseUrl = process.env.MIGRATE_DATABASE_URL;
if (!databaseUrl) {
  console.error("Falta MIGRATE_DATABASE_URL");
  process.exit(1);
}
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../migrations");

// Las migraciones destructivas requieren aprobación expresa (ver docs/DECISIONS.md).
if (direction === "down" && process.env.ALLOW_ROLLBACK !== "yes") {
  console.error("Rollback bloqueado. Define ALLOW_ROLLBACK=yes si realmente lo necesitas.");
  process.exit(1);
}

await runner({
  databaseUrl,
  dir,
  direction,
  count: direction === "down" ? 1 : Infinity,
  migrationsTable: "pgmigrations",
  // Si tu base ya aplicó una migración de una rama que no llegó a main, el orden estricto falla: MIGRATE_NO_CHECK_ORDER=yes lo omite.
  checkOrder: process.env.MIGRATE_NO_CHECK_ORDER !== "yes",
  log: (m) => console.log(m),
});
