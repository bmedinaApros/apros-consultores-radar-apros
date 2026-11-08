/* Crea (o restablece) un usuario con clave desde la consola del servidor. Uso:
 *   npm run user:create -- --email persona@apros.pe --name "Nombre" --role admin          (pide la clave sin mostrarla)
 *   npm run user:create -- --email persona@apros.pe --role admin --generate               (genera una clave temporal)
 * Sirve para el primer administrador. La clave nunca se pasa como argumento (quedaría en el historial del shell). */
import { createInterface } from "node:readline";
import { createUserFromCli } from "../src/lib/auth-password";
import { ROLES, type Role } from "../src/lib/rbac";
import { pool } from "../src/lib/db";

const args = process.argv.slice(2);
const arg = (k: string): string | undefined => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
const email = arg("email");
const role = (arg("role") ?? "admin") as Role;
const generate = args.includes("--generate");
if (!email || !ROLES.includes(role)) {
  console.error(`Uso: npm run user:create -- --email <correo> [--name <nombre>] [--role ${ROLES.join("|")}] [--generate]`);
  process.exit(2);
}

function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(new Error("No hay terminal interactiva: usa --generate para crear una clave temporal."));
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const w = rl as unknown as { _writeToOutput: (s: string) => void };
    process.stdout.write(prompt);
    w._writeToOutput = () => undefined; // no se muestra lo que se escribe
    rl.question("", (answer) => { rl.close(); process.stdout.write("\n"); resolve(answer); });
  });
}

try {
  let password: string | null = null;
  if (!generate) {
    password = await askHidden("Clave (mínimo 12 caracteres): ");
    const again = await askHidden("Repite la clave: ");
    if (password !== again) throw new Error("Las claves no coinciden.");
  }
  const r = await createUserFromCli({ email, name: arg("name") ?? "", role, password });
  console.log(`Usuario listo: ${r.email} (${role}).`);
  if (r.tempPassword) console.log(`Clave temporal (se muestra una sola vez; deberá cambiarla al ingresar): ${r.tempPassword}`);
} catch (e) {
  console.error(`No se pudo crear el usuario: ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await pool().end();
}
