import { crc32, gzipSync } from "node:zlib";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { syntheticLines } from "@/lib/registry/synthetic";

/** Carpeta de importación temporal para una prueba. */
export function useImportDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "radar-import-"));
  process.env.REGISTRY_IMPORT_DIR = dir;
  return dir;
}

/** Texto del archivo (Windows-1252, como el de SUNAT). */
export const toFile = (lines: Iterable<string>): Buffer => Buffer.from([...lines].join("\n") + "\n", "latin1");

export function writeSynthetic(dir: string, name: string, kind: "ruc" | "anexo", n: number, seed = 1): string {
  const buf = toFile(syntheticLines(kind, n, seed));
  const file = path.join(dir, name);
  if (name.endsWith(".gz")) writeFileSync(file, gzipSync(buf));
  else if (name.endsWith(".zip")) writeFileSync(file, storedZip(name.replace(/\.zip$/, ".txt"), buf));
  else writeFileSync(file, buf);
  return file;
}

/** Zip mínimo con un archivo sin compresión (método 0), suficiente para probar la lectura de zips. */
export function storedZip(entryName: string, data: Buffer): Buffer {
  const name = Buffer.from(entryName);
  const crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6); local.writeUInt16LE(0, 8);
  local.writeUInt16LE(0, 10); local.writeUInt16LE(0x21, 12); local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0, 8); central.writeUInt16LE(0, 10);
  central.writeUInt16LE(0, 12); central.writeUInt16LE(0x21, 14); central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(0, 42);
  const localPart = Buffer.concat([local, name, data]);
  const cd = Buffer.concat([central, name]);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(localPart.length, 16);
  return Buffer.concat([localPart, cd, end]);
}
