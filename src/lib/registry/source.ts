import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import yauzl from "yauzl";

export class SourceFileError extends Error {
  override name = "SourceFileError";
}

export const ALLOWED_EXT = [".txt", ".csv", ".zip", ".gz"] as const;
/** Tope de bytes ya descomprimidos que se aceptan de un archivo (protege de «bombas» de compresión). */
export const MAX_UNCOMPRESSED_BYTES = 30 * 1024 ** 3;
const MAX_LINE = 16 * 1024;

export const importDir = (): string => path.resolve(process.env.REGISTRY_IMPORT_DIR || "data/import");

export interface ImportFile { name: string; size: number; modified: Date }

export async function listImportFiles(dir = importDir()): Promise<ImportFile[]> {
  let names: string[];
  try { names = await fs.readdir(dir); } catch { return []; }
  const out: ImportFile[] = [];
  for (const name of names) {
    if (!ALLOWED_EXT.includes(path.extname(name).toLowerCase() as (typeof ALLOWED_EXT)[number]) || name.startsWith(".")) continue;
    const st = await fs.stat(path.join(dir, name)).catch(() => null);
    if (st?.isFile()) out.push({ name, size: st.size, modified: st.mtime });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Solo se leen archivos de la carpeta de importación: un nombre simple, sin rutas ni enlaces que escapen de ella.
 * (La pantalla y la cola nunca reciben una ruta arbitraria del usuario.)
 */
export async function resolveImportFile(name: string, dir = importDir()): Promise<string> {
  if (!name || name !== path.basename(name) || name.startsWith(".") || name.includes("\0")) throw new SourceFileError("Nombre de archivo no permitido");
  if (!ALLOWED_EXT.includes(path.extname(name).toLowerCase() as (typeof ALLOWED_EXT)[number])) throw new SourceFileError("Solo se aceptan archivos .txt, .csv, .zip o .gz");
  const base = await fs.realpath(dir).catch(() => { throw new SourceFileError("La carpeta de importación no existe"); });
  const real = await fs.realpath(path.join(base, name)).catch(() => { throw new SourceFileError("No se encontró el archivo en la carpeta de importación"); });
  if (path.dirname(real) !== base) throw new SourceFileError("El archivo debe estar directamente en la carpeta de importación");
  if (!(await fs.stat(real)).isFile()) throw new SourceFileError("No es un archivo");
  return real;
}

/** Huella del archivo: tamaño y SHA-256 del primer megabyte. Sirve para saber si una carga reanudada lee el mismo archivo. */
export async function fingerprint(file: string): Promise<{ size: number; fingerprint: string }> {
  const st = await fs.stat(file);
  const fh = await fs.open(file, "r");
  try {
    const buf = Buffer.alloc(Math.min(1024 * 1024, st.size));
    await fh.read(buf, 0, buf.length, 0);
    return { size: st.size, fingerprint: createHash("sha256").update(buf).digest("hex") };
  } finally { await fh.close(); }
}

/** Abre el archivo como flujo de bytes. El tipo se detecta por los primeros bytes, no por la extensión. */
export async function openSource(file: string): Promise<Readable> {
  const fh = await fs.open(file, "r");
  const magic = Buffer.alloc(4);
  await fh.read(magic, 0, 4, 0);
  await fh.close();
  if (magic[0] === 0x50 && magic[1] === 0x4b) return openZipEntry(file);
  if (magic[0] === 0x1f && magic[1] === 0x8b) return limit(createReadStream(file).pipe(createGunzip()));
  return limit(createReadStream(file));
}

function openZipEntry(file: string): Promise<Readable> {
  return new Promise((resolve, reject) => {
    yauzl.open(file, { lazyEntries: true, autoClose: true }, (err, zip) => {
      if (err || !zip) return reject(new SourceFileError("No se pudo abrir el zip (¿está dañado?)"));
      zip.on("error", () => reject(new SourceFileError("El zip está dañado")));
      zip.on("end", () => reject(new SourceFileError("El zip no contiene un archivo .txt o .csv")));
      zip.on("entry", (entry: yauzl.Entry) => {
        const n = entry.fileName.toLowerCase();
        if (/\/$/.test(n) || n.includes("..") || !(n.endsWith(".txt") || n.endsWith(".csv"))) return zip.readEntry();
        if (entry.uncompressedSize > MAX_UNCOMPRESSED_BYTES) return reject(new SourceFileError("El archivo descomprimido supera el tope permitido"));
        zip.openReadStream(entry, (e, stream) => (e || !stream ? reject(new SourceFileError("No se pudo leer el archivo dentro del zip")) : resolve(limit(stream))));
      });
      zip.readEntry();
    });
  });
}

/** Corta el flujo si se descomprime más de lo permitido. */
function limit(src: Readable): Readable {
  let total = 0;
  src.on("data", (c: Buffer) => { total += c.length; if (total > MAX_UNCOMPRESSED_BYTES) src.destroy(new SourceFileError("El archivo descomprimido supera el tope permitido")); });
  return src;
}

/** Líneas de texto (Windows-1252 ⊃ ISO-8859-1), tolera CRLF y descarta líneas absurdamente largas. */
export async function* readLines(stream: Readable): AsyncGenerator<string> {
  const dec = new TextDecoder("windows-1252");
  let rest = "";
  let skipping = false;
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    rest += dec.decode(chunk, { stream: true });
    let i: number;
    while ((i = rest.indexOf("\n")) >= 0) {
      const line = rest.slice(0, i);
      rest = rest.slice(i + 1);
      if (skipping) { skipping = false; yield "\u0000TOO_LONG"; continue; }
      yield line.endsWith("\r") ? line.slice(0, -1) : line;
    }
    if (rest.length > MAX_LINE) { rest = ""; skipping = true; }
  }
  rest += dec.decode();
  if (skipping) yield "\u0000TOO_LONG";
  else if (rest.length) yield rest.endsWith("\r") ? rest.slice(0, -1) : rest;
}
export const TOO_LONG = "\u0000TOO_LONG";
