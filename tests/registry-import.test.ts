import { mkdirSync, symlinkSync, writeFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";
import { ANEXO_HEADER, RUC_HEADER, syntheticLines } from "@/lib/registry/synthetic";
import { buildAddress, clean, detectFormat, FormatError, normalizeUbigeo, parseRow } from "@/lib/registry/format";
import { cancelBatch, createBatch, createBatchInternal, getBatch, parseFilters, RegistryError, runBatch, skipReason } from "@/lib/registry/import";
import { resolveImportFile, SourceFileError } from "@/lib/registry/source";
import { suggestIndustry } from "@/lib/registry/rubro";
import { ForbiddenError } from "@/lib/rbac";
import { mkActor, ownerPool, resetData } from "./helpers";
import { toFile, makeImportDir, writeSynthetic } from "./helpers-registry";

beforeEach(resetData);
afterAll(() => pool().end());

describe("formato del archivo", () => {
  it("reconoce el archivo principal y el de locales por su cabecera, con tildes, espacio inicial y «|» final", () => {
    const ruc = detectFormat(RUC_HEADER);
    expect(ruc.kind).toBe("ruc");
    expect(ruc.index).toMatchObject({ ruc: 0, name: 1, status: 2, condition: 3, ubigeo: 4 });
    const anexo = detectFormat(ANEXO_HEADER);
    expect(anexo.kind).toBe("local_anexo");
    expect(anexo.index).toMatchObject({ ruc: 0, ubigeo: 1, road: 3 });
    expect(detectFormat("﻿ruc|nombre o razon social|estado del contribuyente|condicion de domicilio|ubigeo|").kind).toBe("ruc");
  });

  it("rechaza con un mensaje claro una cabecera que no coincide (no adivina)", () => {
    expect(() => detectFormat("A|B|C|")).toThrow(FormatError);
    expect(() => detectFormat("RUC|NOMBRE O RAZÓN SOCIAL|UBIGEO|")).toThrow(/Faltan: ESTADO DEL CONTRIBUYENTE, CONDICION DE DOMICILIO/);
    expect(() => detectFormat("RUC|UBIGEO|")).toThrow(/NOMBRE DE VIA/);
  });

  it("limpia valores vacíos, completa el ubigeo de 5 dígitos y arma la dirección", () => {
    expect(clean(" - ")).toBeNull();
    expect(clean("----")).toBeNull();
    expect(clean("  AV.   GRAU ")).toBe("AV. GRAU");
    expect(normalizeUbigeo("10101")).toBe("010101");
    expect(normalizeUbigeo("150101")).toBe("150101");
    expect(normalizeUbigeo("1")).toBeNull();
    expect(normalizeUbigeo("ABCDEF")).toBeNull();
    const fmt = detectFormat(ANEXO_HEADER);
    const r = parseRow("20100000254|040701|CAL.|COMERCIO|-|-|390|-|2|-|-|-|".split("|"), fmt);
    expect(r).toMatchObject({ ok: true, row: { ruc: "20100000254", ubigeo: "040701", address: "CAL. COMERCIO 390, INT. 2" } });
    expect(buildAddress(() => null)).toBeNull();
  });

  it("descarta filas con RUC inválido o con columnas de menos, sin detener la carga", () => {
    const fmt = detectFormat(ANEXO_HEADER);
    expect(parseRow("laredo07159|130106|----|LAREDO|----|X|S/N|-|-|-|-|-|".split("|"), fmt)).toEqual({ ok: false, reason: "ruc_invalido" });
    expect(parseRow("20100000254|040701|CAL.".split("|"), fmt)).toEqual({ ok: false, reason: "columnas" });
    expect(parseRow("2010000025|040701|CAL.|X|-|-|1|-|-|-|-|-|".split("|"), fmt)).toEqual({ ok: false, reason: "ruc_invalido" });
  });

  it("los filtros por defecto dejan fuera personas naturales, bajas y no habidos", () => {
    const f = parseFilters();
    const row = { ruc: "20100000254", status: "ACTIVO", condition: "HABIDO", ubigeo: "150101" };
    expect(skipReason(f, "ruc", row)).toBeNull();
    expect(skipReason(f, "ruc", { ...row, ruc: "10100000254" })).toBe("persona_natural");
    expect(skipReason(f, "ruc", { ...row, status: "BAJA DE OFICIO" })).toBe("estado");
    expect(skipReason(f, "ruc", { ...row, condition: "NO HABIDO" })).toBe("condicion");
    expect(skipReason(parseFilters({ ubigeoPrefixes: ["07"] }), "ruc", row)).toBe("zona");
    expect(skipReason(parseFilters({ ubigeoPrefixes: ["15"] }), "ruc", row)).toBeNull();
    expect(skipReason(parseFilters({ personKinds: ["juridica", "natural"], statuses: [], conditions: [] }), "ruc", { ...row, ruc: "10100000254", status: "BAJA" })).toBeNull();
    expect(() => parseFilters({ ubigeoPrefixes: ["abc"] })).toThrow();
  });
});

describe("carga del padrón", () => {
  const counts = async () => Number((await pool().query("SELECT count(*) AS n FROM registry_companies")).rows[0].n);

  /** Cuántas filas debería cargar el filtro por defecto, calculado aparte con las mismas reglas. */
  function expectedLoaded(n: number, seed = 1): number {
    const fmt = detectFormat(RUC_HEADER);
    const f = parseFilters();
    let k = 0, i = 0;
    for (const line of syntheticLines("ruc", n, seed)) {
      if (i++ === 0) continue;
      const r = parseRow(line.split("|"), fmt);
      if (r.ok && !skipReason(f, "ruc", r.row)) k++;
    }
    return k;
  }

  it("carga solo lo que pasa el filtro (jurídicas, activas, habidas), con motivos de descarte y sin personas naturales", async () => {
    const dir = makeImportDir();
    writeSynthetic(dir, "padron.txt", "ruc", 12_000);
    const { id, kind } = await createBatchInternal({ fileName: "padron.txt", sourceNote: "Archivo sintético" }, null);
    expect(kind).toBe("ruc");
    const done = await runBatch(id, { chunkLines: 1000 });
    expect(done).toMatchObject({ status: "completed", rows_read: "12000", rows_invalid: "0", last_line: "12000" });
    const want = expectedLoaded(12_000);
    expect(want).toBeGreaterThan(2000);
    expect(await counts()).toBe(want);
    expect(Number(done.rows_loaded)).toBe(want);
    expect(Number(done.rows_loaded) + Number(done.rows_skipped)).toBe(12_000);
    expect(done.skipped.persona_natural).toBeGreaterThan(0);
    const bad = await pool().query(`SELECT count(*) AS n FROM registry_companies WHERE NOT is_legal_entity OR status <> 'ACTIVO' OR condition <> 'HABIDO'`);
    expect(Number(bad.rows[0].n)).toBe(0);
    const sample = (await pool().query(`SELECT legal_name, normalized_name, ubigeo, address FROM registry_companies ORDER BY ruc LIMIT 1`)).rows[0];
    expect(sample.normalized_name).toBe(sample.normalized_name.toLowerCase());
    expect(sample.ubigeo).toMatch(/^\d{6}$/);
  });

  it("reanuda tras una interrupción sin repetir ni perder filas (mismo resultado que una carga continua)", async () => {
    const dir = makeImportDir();
    writeSynthetic(dir, "padron.txt", "ruc", 9000);
    const a = await createBatchInternal({ fileName: "padron.txt" }, null);
    await expect(runBatch(a.id, { chunkLines: 1000, crashAfterLines: 3000 })).rejects.toThrow(/Interrupción simulada/);
    const mid = (await getBatch(a.id))!;
    expect(mid).toMatchObject({ status: "failed", last_line: "3000" });
    expect(Number(mid.rows_loaded)).toBeGreaterThan(0);
    const done = await runBatch(a.id, { chunkLines: 1000 });
    expect(done).toMatchObject({ status: "completed", rows_read: "9000", last_line: "9000" });
    const resumed = (await pool().query(`SELECT string_agg(ruc || legal_name, ',' ORDER BY ruc) AS s FROM registry_companies`)).rows[0].s;

    await resetData();
    const dir2 = makeImportDir();
    writeSynthetic(dir2, "padron.txt", "ruc", 9000);
    const b = await createBatchInternal({ fileName: "padron.txt" }, null);
    await runBatch(b.id, { chunkLines: 1000 });
    expect((await pool().query(`SELECT string_agg(ruc || legal_name, ',' ORDER BY ruc) AS s FROM registry_companies`)).rows[0].s).toBe(resumed);
    expect(Number((await getBatch(b.id))!.rows_loaded)).toBe(Number(done.rows_loaded));
  });

  it("si el archivo cambia entre un intento y otro, no reanuda (evita mezclar datos)", async () => {
    const dir = makeImportDir();
    const file = writeSynthetic(dir, "padron.txt", "ruc", 3000);
    const a = await createBatchInternal({ fileName: "padron.txt" }, null);
    await expect(runBatch(a.id, { chunkLines: 500, crashAfterLines: 1000 })).rejects.toThrow();
    writeFileSync(file, toFile(syntheticLines("ruc", 3000, 99)));
    await expect(runBatch(a.id)).rejects.toThrow(/cambió/);
    expect((await getBatch(a.id))!.status).toBe("failed");
  });

  it("lee .gz y .zip igual que el texto plano (se detecta por contenido, no por extensión)", async () => {
    const dir = makeImportDir();
    writeSynthetic(dir, "plano.txt", "ruc", 2500);
    writeSynthetic(dir, "comprimido.gz", "ruc", 2500);
    writeSynthetic(dir, "zipeado.zip", "ruc", 2500);
    const loaded: number[] = [];
    for (const name of ["plano.txt", "comprimido.gz", "zipeado.zip"]) {
      await resetData();
      const b = await createBatchInternal({ fileName: name }, null);
      loaded.push(Number((await runBatch(b.id, { chunkLines: 500 })).rows_loaded));
    }
    expect(new Set(loaded).size).toBe(1);
    expect(loaded[0]).toBeGreaterThan(500);
  });

  it("rechaza un archivo con otra cabecera al crear la carga y no deja nada a medias", async () => {
    const dir = makeImportDir();
    writeFileSync(path.join(dir, "raro.txt"), "COL1|COL2|COL3\n1|2|3\n");
    await expect(createBatchInternal({ fileName: "raro.txt" }, null)).rejects.toBeInstanceOf(RegistryError);
    writeFileSync(path.join(dir, "vacio.txt"), "");
    await expect(createBatchInternal({ fileName: "vacio.txt" }, null)).rejects.toThrow();
    expect((await pool().query("SELECT count(*)::int AS n FROM registry_batches")).rows[0].n).toBe(0);
  });

  it("tolera filas dañadas y líneas enormes: se cuentan como inválidas y la carga sigue", async () => {
    const dir = makeImportDir();
    const file = writeSynthetic(dir, "padron.txt", "ruc", 1000);
    appendFileSync(file, Buffer.from("laredo07159|X|ACTIVO|HABIDO|130106|\n", "latin1"));
    appendFileSync(file, Buffer.from("20100000254|SOLO DOS|\n", "latin1"));
    appendFileSync(file, Buffer.from(`${"X".repeat(40_000)}\n`, "latin1"));
    appendFileSync(file, Buffer.from("\n", "latin1"));
    const b = await createBatchInternal({ fileName: "padron.txt" }, null);
    const done = await runBatch(b.id, { chunkLines: 300 });
    expect(done.status).toBe("completed");
    expect(Number(done.rows_invalid)).toBe(4);
    expect(Number(done.rows_read)).toBe(1004);
  });

  it("un RUC repetido dentro del archivo se carga una sola vez (gana el último)", async () => {
    const dir = makeImportDir();
    const lines = [...syntheticLines("ruc", 50, 5)];
    const dup = lines.find((l, i) => i > 0 && l.startsWith("20") && l.split("|")[2] === "ACTIVO" && l.split("|")[3] === "HABIDO")!;
    const parts = dup.split("|");
    parts[1] = "NOMBRE ACTUALIZADO SAC";
    lines.push(parts.join("|"));
    writeFileSync(path.join(dir, "padron.txt"), toFile(lines));
    const b = await createBatchInternal({ fileName: "padron.txt" }, null);
    await runBatch(b.id);
    const row = (await pool().query(`SELECT legal_name FROM registry_companies WHERE ruc = $1`, [parts[0]])).rows;
    expect(row).toHaveLength(1);
    expect(row[0].legal_name).toBe("NOMBRE ACTUALIZADO SAC");
  });

  it("una segunda carga con los mismos filtros actualiza lo existente y marca como «ya no aparece» lo que falta, sin borrar", async () => {
    const dir = makeImportDir();
    writeSynthetic(dir, "v1.txt", "ruc", 4000, 1);
    const a = await createBatchInternal({ fileName: "v1.txt" }, null);
    await runBatch(a.id, { chunkLines: 1000 });
    const first = await counts();
    const all = (await pool().query<{ ruc: string }>(`SELECT ruc FROM registry_companies ORDER BY ruc`)).rows.map((r) => r.ruc);
    const keep = new Set(all.slice(0, Math.floor(all.length / 2)));
    const lines = [...syntheticLines("ruc", 4000, 1)].filter((l, i) => i === 0 || !l.split("|")[0]!.startsWith("20") || keep.has(l.split("|")[0]!) || l.split("|")[2] !== "ACTIVO");
    writeFileSync(path.join(dir, "v2.txt"), toFile(lines));
    const b = await createBatchInternal({ fileName: "v2.txt" }, null);
    await runBatch(b.id, { chunkLines: 1000 });
    expect(await counts()).toBe(first); // nada se borra
    const missing = Number((await pool().query(`SELECT count(*) AS n FROM registry_companies WHERE missing_since IS NOT NULL`)).rows[0].n);
    expect(missing).toBe(first - keep.size);
    const present = await pool().query(`SELECT count(*) AS n FROM registry_companies WHERE missing_since IS NULL AND last_batch_id = $1`, [b.id]);
    expect(Number(present.rows[0].n)).toBe(keep.size);
  });

  it("con filtros distintos a la carga anterior no marca nada como ausente", async () => {
    const dir = makeImportDir();
    writeSynthetic(dir, "v1.txt", "ruc", 3000, 1);
    const a = await createBatchInternal({ fileName: "v1.txt" }, null);
    await runBatch(a.id);
    const b = await createBatchInternal({ fileName: "v1.txt", filters: { ubigeoPrefixes: ["15"] } }, null);
    await runBatch(b.id);
    expect(Number((await pool().query(`SELECT count(*) AS n FROM registry_companies WHERE missing_since IS NOT NULL`)).rows[0].n)).toBe(0);
  });

  it("una sola carga a la vez; una «en curso» sin latidos por 10 minutos se considera caída y se puede retomar", async () => {
    const dir = makeImportDir();
    writeSynthetic(dir, "a.txt", "ruc", 500, 1);
    writeSynthetic(dir, "b.txt", "ruc", 500, 2);
    const a = await createBatchInternal({ fileName: "a.txt" }, null);
    const b = await createBatchInternal({ fileName: "b.txt" }, null);
    await pool().query(`UPDATE registry_batches SET status = 'running', updated_at = now() WHERE id = $1`, [a.id]);
    await expect(runBatch(b.id)).rejects.toThrow(/otra carga/);
    await pool().query(`UPDATE registry_batches SET updated_at = now() - interval '11 minutes' WHERE id = $1`, [a.id]);
    expect((await runBatch(b.id)).status).toBe("completed");
    expect((await runBatch(a.id)).status).toBe("completed"); // la caída se retoma
    await expect(runBatch(a.id)).rejects.toThrow(/ya terminó/);
  });

  it("se puede cancelar una carga en curso: termina en el siguiente bloque y conserva lo cargado", async () => {
    const dir = makeImportDir();
    writeSynthetic(dir, "padron.txt", "ruc", 6000);
    const admin = await mkActor("admin");
    const b = await createBatchInternal({ fileName: "padron.txt" }, admin.id);
    let cancelled = false;
    const done = await runBatch(b.id, {
      chunkLines: 1000,
      onProgress: (p) => { if (!cancelled && p.read >= 2000) { cancelled = true; void cancelBatch(admin, b.id); } },
    });
    expect(done.status).toBe("cancelled");
    expect(Number(done.rows_read)).toBeLessThan(6000);
    expect(await counts()).toBeGreaterThan(0);
    await expect(cancelBatch(admin, b.id)).rejects.toThrow(/Solo se cancela/);
  });

  it("solo administrador y líder cargan archivos; el resto no", async () => {
    const dir = makeImportDir();
    writeSynthetic(dir, "padron.txt", "ruc", 100);
    for (const role of ["consultant", "salesperson", "read_only"] as const) {
      await expect(createBatch(await mkActor(role), { fileName: "padron.txt" })).rejects.toBeInstanceOf(ForbiddenError);
    }
    expect((await createBatch(await mkActor("sales_lead"), { fileName: "padron.txt" })).kind).toBe("ruc");
  });
});

describe("archivo de locales (establecimientos anexos)", () => {
  it("carga direcciones por RUC, sin personas naturales, y con «solo RUC conocidos» ignora los que no están en el padrón", async () => {
    const dir = makeImportDir();
    writeSynthetic(dir, "padron.txt", "ruc", 3000, 1);
    const p = await createBatchInternal({ fileName: "padron.txt" }, null);
    await runBatch(p.id);
    writeSynthetic(dir, "anexo.txt", "anexo", 3000, 1);
    const all = await createBatchInternal({ fileName: "anexo.txt" }, null);
    const done = await runBatch(all.id, { chunkLines: 500 });
    expect(done.status).toBe("completed");
    expect(Number(done.rows_loaded)).toBeGreaterThan(1000);
    expect((await pool().query(`SELECT count(*)::int AS n FROM registry_locations WHERE ruc NOT LIKE '20%'`)).rows[0].n).toBe(0);
    const before = Number((await pool().query("SELECT count(*) AS n FROM registry_locations")).rows[0].n);

    { const o = ownerPool(); await o.query("TRUNCATE registry_locations"); await o.end(); }
    const known = await createBatchInternal({ fileName: "anexo.txt", filters: { onlyKnownRucs: true } }, null);
    const d2 = await runBatch(known.id);
    const after = Number((await pool().query("SELECT count(*) AS n FROM registry_locations")).rows[0].n);
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before); // activas y habidas: el padrón filtrado no incluye todas
    expect(Number(d2.skipped.ya_cargado_o_sin_registro)).toBeGreaterThan(0);
    const orphans = await pool().query(`SELECT count(*)::int AS n FROM registry_locations l WHERE NOT EXISTS (SELECT 1 FROM registry_companies r WHERE r.ruc = l.ruc)`);
    expect(orphans.rows[0].n).toBe(0);
  });

  it("cargar dos veces el mismo archivo no duplica locales", async () => {
    const dir = makeImportDir();
    writeSynthetic(dir, "anexo.txt", "anexo", 2000, 3);
    const a = await createBatchInternal({ fileName: "anexo.txt" }, null);
    await runBatch(a.id);
    const n1 = Number((await pool().query("SELECT count(*) AS n FROM registry_locations")).rows[0].n);
    const b = await createBatchInternal({ fileName: "anexo.txt" }, null);
    await runBatch(b.id);
    expect(Number((await pool().query("SELECT count(*) AS n FROM registry_locations")).rows[0].n)).toBe(n1);
  });
});

describe("carpeta de importación", () => {
  it("solo acepta nombres simples dentro de la carpeta: sin rutas, sin escapes, sin enlaces que salgan", async () => {
    const dir = makeImportDir();
    writeFileSync(path.join(dir, "ok.txt"), "x");
    writeFileSync(path.join(dir, "malo.exe"), "x");
    const outside = path.join(dir, "..", "radar-secreto.txt");
    writeFileSync(outside, "secreto");
    symlinkSync(outside, path.join(dir, "enlace.txt"));
    mkdirSync(path.join(dir, "sub.txt"));
    expect(path.basename(await resolveImportFile("ok.txt"))).toBe("ok.txt");
    for (const bad of ["../radar-secreto.txt", "/etc/passwd", "a/b.txt", "..", ".oculto.txt", "malo.exe", "no-existe.txt", "enlace.txt", "sub.txt", "", "x\0.txt"]) {
      await expect(resolveImportFile(bad), bad).rejects.toBeInstanceOf(SourceFileError);
    }
  });
});

describe("reglas de rubro por palabras", () => {
  const rules = [
    { industryId: "salud", words: ["clinica", "hospital", "centro medico"] },
    { industryId: "inmo", words: ["inmobiliaria", "constructora"] },
  ];
  it("sugiere por palabras completas y no cuando hay empate o ninguna coincidencia", () => {
    expect(suggestIndustry("clinica san pablo", rules)).toBe("salud");
    expect(suggestIndustry("constructora e inmobiliaria andina", rules)).toBe("inmo");
    expect(suggestIndustry("centro medico y clinica norte", rules)).toBe("salud"); // 2 palabras vs 0
    expect(suggestIndustry("clinica inmobiliaria del sur", rules)).toBeNull(); // empate
    expect(suggestIndustry("subclinica norte", rules)).toBeNull(); // no es palabra completa
    expect(suggestIndustry("comercial sur", rules)).toBeNull();
    expect(suggestIndustry("", rules)).toBeNull();
    expect(suggestIndustry("clinica sur", [])).toBeNull();
  });
});
