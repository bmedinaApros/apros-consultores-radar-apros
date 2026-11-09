import { describe, expect, it } from "vitest";
import { parseQuickQuery } from "@/lib/registry/quick";

const D = [
  ["15", "Lima"], ["04", "Arequipa"], ["08", "Cusco"], ["02", "Áncash"], ["13", "La Libertad"], ["17", "Madre de Dios"], ["22", "San Martín"], ["07", "Callao"],
].map(([code, department]) => ({ code: code!, department: department! }));

describe("búsqueda en una sola caja", () => {
  it("entiende «actividad + departamento» al final o al principio, con tildes y plurales", () => {
    expect(parseQuickQuery("inmobiliarias en Lima", D)).toMatchObject({ q: "inmobiliaria", ubigeo: "15" });
    expect(parseQuickQuery("clínicas Arequipa", D)).toMatchObject({ q: "clinica", ubigeo: "04" });
    expect(parseQuickQuery("Madre de Dios hoteles", D)).toMatchObject({ q: "hotel", ubigeo: "17" });
    expect(parseQuickQuery("constructoras la libertad", D)).toMatchObject({ q: "constructora", ubigeo: "13" });
    expect(parseQuickQuery("empresas de transportes en ancash", D)).toMatchObject({ q: "transport", ubigeo: "02" });
    expect(parseQuickQuery("consultores", D).q).toBe("consultor");
  });

  it("quita el relleno de una frase pedida a una persona o a una IA", () => {
    const r = parseQuickQuery("Busca empresas de salud en Cusco", D);
    expect(r).toMatchObject({ q: "salud", ubigeo: "08" });
    expect(r.understood).toEqual(["el nombre contiene «salud»", "departamento Cusco"]);
  });

  it("un RUC (o su inicio) se busca por RUC", () => {
    expect(parseQuickQuery("20100193117", D)).toMatchObject({ q: "20100193117", understood: ["RUC 20100193117"] });
    expect(parseQuickQuery(" 2010 ", D)).toMatchObject({ q: "2010", understood: ["RUC que empieza con 2010"] });
    expect(parseQuickQuery("12", D).q).toBeUndefined(); // muy corto: no es un RUC ni un nombre útil
  });

  it("solo un departamento lista el departamento; un nombre con una palabra de departamento en medio no se parte", () => {
    expect(parseQuickQuery("lima", D)).toMatchObject({ q: undefined, ubigeo: "15" });
    expect(parseQuickQuery("gas lima norte", D)).toMatchObject({ q: "gas lima norte", ubigeo: undefined });
  });

  it("vacío o solo relleno no filtra nada; los símbolos no rompen", () => {
    expect(parseQuickQuery("", D)).toEqual({ understood: [] });
    expect(parseQuickQuery("   ", D)).toEqual({ understood: [] });
    expect(parseQuickQuery("busca las empresas en", D).q).toBeUndefined();
    expect(parseQuickQuery("%%%'; DROP--", D).q).toBe("drop");
  });
});
