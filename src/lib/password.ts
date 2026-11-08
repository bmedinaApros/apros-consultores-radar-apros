import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Contraseñas con scrypt (incluido en Node, sin dependencias). Formato guardado:
 *   scrypt$N$r$p$sal(base64url)$hash(base64url)
 * Los parámetros viajan con el hash, así se pueden subir sin invalidar claves existentes.
 */
const PARAMS = { N: 32768, r: 8, p: 1, keyLen: 32 } as const;
const MAXMEM = 128 * 1024 * 1024;

const derive = (password: string, salt: Buffer, N: number, r: number, p: number, keyLen: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const opts: ScryptOptions = { N, r, p, maxmem: MAXMEM };
    scrypt(password.normalize("NFKC"), salt, keyLen, opts, (e, key) => (e ? reject(e) : resolve(key)));
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, PARAMS.N, PARAMS.r, PARAMS.p, PARAMS.keyLen);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const parts = (stored ?? "").split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, salt, hash] = parts as [string, string, string, string, string, string];
  const N = Number(n), R = Number(r), P = Number(p);
  // Límites defensivos: un valor guardado alterado no debe poder agotar la memoria del servidor.
  if (!(N >= 1024 && N <= 1 << 20 && R >= 1 && R <= 16 && P >= 1 && P <= 4)) return false;
  if (128 * N * R > MAXMEM) return false;
  const expected = Buffer.from(hash, "base64url");
  if (expected.length < 16 || expected.length > 64) return false;
  const actual = await derive(password, Buffer.from(salt, "base64url"), N, R, P, expected.length);
  return timingSafeEqual(actual, expected);
}

/** Hash de relleno: se verifica contra él cuando el usuario no existe, para que el tiempo no delate qué correos existen. */
let dummy: Promise<string> | undefined;
export const dummyHash = (): Promise<string> => (dummy ??= hashPassword(randomBytes(12).toString("base64url")));

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;

// Lista corta de claves frecuentes (no reemplaza una lista completa; la longitud mínima hace el trabajo principal).
const COMMON = new Set([
  "password1234", "contraseña123", "contrasena123", "123456789012", "qwertyuiop12", "administrador1", "apros1234567",
  "abcdefghijkl", "111111111111", "password12345", "bienvenido123", "peru12345678", "lima12345678",
]);

/** Devuelve un mensaje si la clave no cumple la política, o null si es aceptable. */
export function passwordPolicyError(password: string, email = ""): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `La clave debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `La clave no puede superar ${PASSWORD_MAX_LENGTH} caracteres.`;
  const lower = password.toLowerCase();
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (email && (lower === email.toLowerCase() || (local.length >= 4 && lower.includes(local)))) return "La clave no debe contener tu correo.";
  if (COMMON.has(lower) || /^(.)\1+$/.test(password)) return "Esa clave es demasiado común. Usa una frase más larga.";
  return null;
}

/** Clave temporal legible (se muestra una sola vez al administrador): 4 grupos de 4 caracteres sin ambigüedades. */
export function generateTempPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]!);
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join("")).join("-");
}
