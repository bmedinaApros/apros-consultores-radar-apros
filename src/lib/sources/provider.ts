import type { RawCompany } from "../companies/ingest";

/**
 * Contrato de toda fuente de empresas. Un proveedor externo solo puede activarse si su documento de términos
 * (`termsDoc`) existe en el repositorio y un administrador lo aprobó. Ningún proveedor hace scraping de Google,
 * LinkedIn ni de sitios cuyos términos lo prohíban.
 */
export interface CompanySourceProvider {
  code: string;
  name: string;
  /** Documento con la revisión de términos de uso (obligatorio para proveedores externos). */
  termsDoc: string;
  /** Máximo de empresas por ejecución. */
  maxPerRun: number;
  discover(): Promise<RawCompany[]>;
}

export interface PlannedProvider {
  code: string;
  name: string;
  termsDoc: string;
  note: string;
}

/** Empresas ficticias para demostración y pruebas. Los dominios son subdominios de example.com (no resuelven). */
export const simulatedProvider: CompanySourceProvider = {
  code: "simulado",
  name: "Fuente simulada (datos ficticios)",
  termsDoc: "docs/sources/simulado.md",
  maxPerRun: 50,
  async discover() {
    return [
      { legal_name: "Inmobiliaria Demo Uno S.A.C. (ficticia)", website: "inmobiliaria-demo-uno.example.com", industry: "Inmobiliario", city: "Lima" },
      { legal_name: "Clínica Demo Salud S.A. (ficticia)", website: "clinica-demo-salud.example.com", industry: "Salud", city: "Lima" },
      { legal_name: "Instituto Demo Educa S.A.C. (ficticia)", website: "instituto-demo-educa.example.com", industry: "Educación", city: "Lima" },
      { legal_name: "Retail Demo Moda S.A.C. (ficticia)", website: "retail-demo-moda.example.com", industry: "Retail", city: "Lima" },
      { legal_name: "Industrias Demo Metal S.A. (ficticia)", website: "industrias-demo-metal.example.com", industry: "Industria", city: "Callao" },
      { legal_name: "Consultores Demo Legal S.A.C. (ficticia)", website: "consultores-demo-legal.example.com", industry: "Servicios profesionales", city: "Lima" },
      { legal_name: "Distribuidora Demo Consumo S.A.C. (ficticia)", website: "distribuidora-demo.example.com", industry: "Consumo masivo", city: "Lima" },
      { legal_name: "Empresa Demo Sin Rubro S.A.C. (ficticia)", website: "empresa-demo-sin-rubro.example.com", industry: "", city: "Arequipa" },
    ];
  },
};

/** Fuentes previstas. NO están implementadas: cada una requiere revisar sus términos antes de escribir código. */
export const PLANNED_PROVIDERS: PlannedProvider[] = [
  { code: "sunat_padron", name: "Padrón de RUC de SUNAT", termsDoc: "docs/sources/sunat_padron.md", note: "Datos públicos; revisar condiciones de uso y que probablemente no trae sitio web." },
  { code: "seace", name: "SEACE / OSCE (compras públicas)", termsDoc: "docs/sources/seace.md", note: "Empresas que venden al Estado; revisar términos." },
  { code: "smv", name: "SMV / Bolsa de Valores de Lima", termsDoc: "docs/sources/smv.md", note: "Empresas medianas y grandes; revisar términos." },
  { code: "google_places", name: "Google Places API (de pago)", termsDoc: "docs/sources/google_places.md", note: "Requiere clave, tope mensual y revisar límites de almacenamiento." },
];

export const IMPLEMENTED_PROVIDERS: CompanySourceProvider[] = [simulatedProvider];
