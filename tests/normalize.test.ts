import { describe, expect, it } from "vitest";
import { duplicateScore, isValidRuc, nameSimilarity, normalizeDomain, normalizeName, normalizeRuc } from "@/lib/companies/normalize";

describe("normalizeName", () => {
  it("quita tildes, signos y forma societaria", () => {
    expect(normalizeName("Inversiones Pérez S.A.C.")).toBe("inversiones perez");
    expect(normalizeName("INVERSIONES PEREZ SAC")).toBe("inversiones perez");
    expect(normalizeName("Inversiones Perez Sociedad Anonima Cerrada")).toBe("inversiones perez");
    expect(normalizeName("Díaz & Hijos E.I.R.L.")).toBe("diaz y hijos");
  });
  it("no deja el nombre vacío", () => {
    expect(normalizeName("S.A.C.")).not.toBe("");
  });
});

describe("normalizeDomain", () => {
  const ok = (s: string) => {
    const r = normalizeDomain(s);
    return r.ok ? r.domain : `ERROR:${r.error}`;
  };
  it("acepta URLs y dominios", () => {
    expect(ok("https://www.Ejemplo.com.pe/contacto?x=1")).toBe("ejemplo.com.pe");
    expect(ok("ejemplo.pe")).toBe("ejemplo.pe");
    expect(ok("http://ejemplo.pe:8080/")).toBe("ejemplo.pe");
    expect(ok("  WWW.EJEMPLO.PE.  ")).toBe("ejemplo.pe");
  });
  it("convierte dominios con tildes a punycode", () => {
    expect(ok("https://camión.pe")).toBe("xn--camin-3ta.pe");
  });
  it("rechaza IPs, nombres internos y reservados", () => {
    for (const s of ["http://127.0.0.1", "10.0.0.5", "[::1]", "http://[2001:db8::1]/", "localhost", "servidor.internal", "intranet.local", "http://169.254.169.254/latest", "algo"]) {
      expect(ok(s)).toMatch(/^ERROR:/);
    }
  });
  it("rechaza redes sociales y correos gratuitos (el analizador solo visita sitios propios)", () => {
    for (const s of ["https://www.linkedin.com/company/x", "facebook.com/x", "https://google.com", "gmail.com", "mi.empresa.wixsite.com"]) {
      expect(ok(s)).toMatch(/^ERROR:/);
    }
  });
  it("rechaza texto que no es dominio", () => {
    for (const s of ["", "no es un dominio", "http://", "a..b.com", "-malo.com", "javascript:alert(1)"]) {
      expect(ok(s)).toMatch(/^ERROR:/);
    }
  });
});

describe("RUC", () => {
  it("valida el dígito verificador", () => {
    expect(isValidRuc("20100070970")).toBe(true); // Supermercados Peruanos
    expect(isValidRuc("20100070971")).toBe(false);
    expect(isValidRuc("30100070970")).toBe(false); // prefijo inexistente
    expect(isValidRuc("2010007097")).toBe(false);
    expect(isValidRuc("abc")).toBe(false);
  });
  it("normaliza separadores", () => {
    expect(normalizeRuc("20 100070970")).toEqual({ ok: true, ruc: "20100070970" });
    expect(normalizeRuc("123").ok).toBe(false);
  });
});

describe("nameSimilarity", () => {
  it("1 para iguales y alto para variaciones pequeñas", () => {
    expect(nameSimilarity("inversiones perez", "inversiones perez")).toBe(1);
    expect(nameSimilarity("inversiones perez", "inversiones peres")).toBeGreaterThan(0.85);
  });
  it("bajo para nombres distintos", () => {
    expect(nameSimilarity("inversiones perez", "constructora andina")).toBeLessThan(0.4);
    expect(nameSimilarity("", "x")).toBe(0);
  });
});

describe("duplicateScore", () => {
  it("nombres que solo difieren en un número no son duplicados", () => {
    expect(duplicateScore("empresa 1", "empresa 2")).toBe(0);
    expect(duplicateScore("sucursal 10", "sucursal 11")).toBe(0);
    expect(duplicateScore("empresa 1", "empresa 1")).toBe(1);
  });
  it("una errata sí cuenta como parecido; nombres distintos de la misma familia, no", () => {
    expect(duplicateScore("inversiones perez", "inversiones peres")).toBeGreaterThanOrEqual(0.85);
    expect(duplicateScore("clinica san pablo", "clinica san felipe")).toBeLessThan(0.85);
  });
});
