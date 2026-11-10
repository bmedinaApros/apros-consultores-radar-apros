import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { verSitiosPorConfirmar, ejecutarSemana, estadoSemana, proponerSitioWeb, verListaSemanal } from "./tools";
import { buscarEmpresasBase, buscarPadron, estadoPadron, verDiagnostico, verEmpresa, verEmpresaPadron } from "./tools";

const text = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const notFound = (what: string) => ({ content: [{ type: "text" as const, text: `${what} no encontrada.` }], isError: true });
const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

/** Conector de Radar APROS: consulta de solo lectura, más una única escritura acotada (proponer el sitio web de una empresa, que se valida). */
export function createRadarServer(): McpServer {
  const s = new McpServer({ name: "radar-apros", version: "0.1.0" });
  s.registerTool("estado_radar", { description: "Resumen de qué hay en Radar APROS: tamaño del padrón SUNAT, empresas en la base de trabajo y diagnósticos por estado.", annotations: RO }, async () => text(await estadoPadron()));
  s.registerTool("buscar_padron", {
    description: "Busca empresas en el padrón SUNAT (lenguaje natural, p. ej. «clínicas en Arequipa» o un RUC de 11 dígitos). Devuelve hasta 50 resultados con RUC, razón social, departamento y rubro sugerido.",
    inputSchema: { consulta: z.string().min(2).max(200), limite: z.number().int().min(1).max(50).optional(), incluir_ya_en_base: z.boolean().optional() }, annotations: RO,
  }, async (a) => text(await buscarPadron(a.consulta, a.limite, a.incluir_ya_en_base)));
  s.registerTool("ver_empresa_padron", { description: "Ficha de una empresa del padrón SUNAT por RUC (11 dígitos).", inputSchema: { ruc: z.string().regex(/^\d{11}$/) }, annotations: RO },
    async (a) => { const r = await verEmpresaPadron(a.ruc); return r ? text(r) : notFound("Empresa del padrón"); });
  s.registerTool("buscar_empresas_base", {
    description: "Busca en la base de trabajo de APROS (empresas ya promovidas). Filtros opcionales: texto, solo sin sitio web, ciudad. 25 por página.",
    inputSchema: { texto: z.string().max(200).optional(), sin_web: z.boolean().optional(), ciudad: z.string().max(80).optional(), pagina: z.number().int().min(1).max(400).optional() }, annotations: RO,
  }, async (a) => text(await buscarEmpresasBase({ q: a.texto, sinWeb: a.sin_web, ciudad: a.ciudad, pagina: a.pagina })));
  s.registerTool("ver_empresa", { description: "Ficha de una empresa de la base de trabajo con las señales detectadas en su sitio web y el estado de su diagnóstico.", inputSchema: { id: z.string().uuid() }, annotations: RO },
    async (a) => { const r = await verEmpresa(a.id); return r ? text(r) : notFound("Empresa"); });
  s.registerTool("ver_diagnostico", { description: "Diagnóstico de oportunidades digitales de una empresa (contenido, estado y si está aprobado). Un borrador no aprobado debe presentarse como borrador.", inputSchema: { empresa_id: z.string().uuid() }, annotations: RO },
    async (a) => { const r = await verDiagnostico(a.empresa_id); return r ? text(r) : notFound("Diagnóstico"); });
  s.registerTool("proponer_sitio_web", {
    description: "Propone el sitio web de una empresa de la base que no lo tiene (por ejemplo, tras buscarlo en internet). Radar lo comprueba: debe responder, permitir su lectura y mostrar el nombre o el RUC de la empresa. Si aparece el RUC se asigna; si no, queda pendiente de confirmación humana. No modifica nada más.",
    inputSchema: { empresa_id: z.string().uuid(), url: z.string().min(4).max(300) },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async (a) => text(await proponerSitioWeb(a.empresa_id, a.url)));
  s.registerTool("ver_sitios_por_confirmar", {
    description: "Sitios web que Radar encontró para empresas sin web y que esperan confirmación humana: empresa, RUC, sitio sugerido, nivel y motivo de la coincidencia, título de la página y origen, más un resumen de la búsqueda automática (intentadas, asignadas, por confirmar, sin sitio).",
    inputSchema: { limite: z.number().int().min(1).max(100).optional() }, annotations: RO,
  }, async (a) => text(await verSitiosPorConfirmar(a.limite)));
  s.registerTool("ver_lista_semanal", {
    description: "La lista semanal de empresas priorizadas para contactar (la más reciente por defecto): puntaje, prioridad, sitio, rubro, servicios sugeridos y motivos. Las «pendientes» aún no las aprobó una persona del equipo.",
    inputSchema: { lista_id: z.string().uuid().optional(), revision: z.enum(["pendientes", "aprobadas", "todas"]).optional(), limite: z.number().int().min(1).max(50).optional() }, annotations: RO,
  }, async (a) => { const r = await verListaSemanal({ listaId: a.lista_id, revision: a.revision, limite: a.limite }); return r ? text(r) : notFound("Lista semanal"); });
  s.registerTool("estado_semana", {
    description: "Estado de las últimas corridas de la lista semanal (en curso, terminada, con error), cuántas hay en cola y cómo está programada.", annotations: RO,
  }, async () => text(await estadoSemana()));
  s.registerTool("ejecutar_semana", {
    description: "Deja en cola una corrida de la lista semanal ahora (buscar sitios web, analizar, puntuar y armar la lista). No espera: la ejecuta el worker de Radar y tarda varios minutos; consulta después estado_semana y ver_lista_semanal. No contacta a nadie.",
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async () => text(await ejecutarSemana()));
  return s;
}
