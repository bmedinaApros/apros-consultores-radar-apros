# Conector de Radar APROS para Claude (MCP, solo lectura)

Permite que Claude (la conversación «APROS – Comité IA» en la app de escritorio) consulte Radar APROS: buscar empresas en el padrón SUNAT, ver la base de trabajo, las señales detectadas en los sitios y los diagnósticos. **Es de consulta, con dos escrituras acotadas: `proponer_sitio_web` y `ejecutar_semana`.**

## Herramientas
| Herramienta | Qué hace |
|---|---|
| `estado_radar` | Tamaño del padrón, empresas en la base, diagnósticos por estado |
| `buscar_padron` | Búsqueda en lenguaje natural («clínicas en Arequipa») o por RUC, hasta 50 resultados |
| `ver_empresa_padron` | Ficha de una empresa del padrón por RUC |
| `buscar_empresas_base` | Búsqueda en la base de trabajo (texto, sin web, ciudad) |
| `ver_empresa` | Ficha + señales del sitio + estado del diagnóstico |
| `ver_diagnostico` | Contenido del diagnóstico; indica si es borrador o está aprobado |
| `ver_lista_semanal` | La lista semanal de empresas priorizadas (puntaje, servicios sugeridos, motivos, estado de revisión). Por defecto la última, hasta 50 |
| `estado_semana` | Cómo van las últimas corridas, cuántas hay en cola y cómo está programada |
| `ejecutar_semana` | **Escribe (acotado):** deja una corrida en cola ahora. La ejecuta el worker; no espera ni contacta a nadie |
| `ver_sitios_por_confirmar` | Sitios web que Radar encontró y esperan confirmación humana, con motivo de la coincidencia y un resumen de la búsqueda automática |
| `proponer_sitio_web` | **Única que escribe.** Propone el sitio de una empresa sin web. Radar lo valida (responde, permite lectura, muestra el nombre o RUC); con el RUC en la portada se asigna, si no queda pendiente de confirmación humana |

## Qué NO expone
Usuarios, correos, contraseñas, sesiones ni la lista de «no contactar» (solo indica si una empresa está bloqueada). Las herramientas de consulta declaran `readOnlyHint`; `proponer_sitio_web` declara que escribe y solo puede crear una sugerencia de sitio web, nunca editar, aprobar ni borrar. Los textos que vienen de sitios web se entregan con un aviso de que son datos de terceros, no instrucciones.

## Instalación en la Mac (Claude Desktop)
1. Docker con la base arriba: `docker compose up -d db`. El conector usa la misma base que la app (`.env`).
2. En la carpeta del proyecto: `npm run mcp:config` imprime el bloque con las rutas de tu equipo.
3. Abre Claude Desktop → Ajustes → Desarrollador → «Editar configuración» (`claude_desktop_config.json`) y pega el bloque dentro del archivo (si ya hay `mcpServers`, agrega solo la entrada `radar-apros`).
4. Cierra Claude Desktop por completo (Cmd+Q) y ábrelo de nuevo. En la conversación debe aparecer el conector con sus 6 herramientas.
5. Prueba: «¿Cuántas empresas hay en el padrón?», «Muéstrame la lista de esta semana» o «Corre la lista semanal ahora» (requiere el worker activo).

## Al pasar a un servidor
La lógica (`src/lib/mcp/`) no cambia. Se agrega una puerta web (HTTPS + autenticación + segundo factor) y se registra como conector remoto; la local queda de respaldo.
