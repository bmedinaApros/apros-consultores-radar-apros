# Datos que Radar envía al proveedor de IA

Aplica solo cuando `AI_PROVIDER=anthropic` (opcional). Con `rules` (el valor por defecto: plantillas y reglas, sin IA) no sale nada de la máquina.

## Qué se envía (por diagnóstico)
- **Instrucciones fijas** (`diagnostico-v1`): reglas de evidencia y lenguaje, más la guía del rubro (editable por un administrador).
- **Empresa:** nombre comercial, dominio y rubro.
- **Observaciones del analizador** (ya guardadas en Radar): nombre de la señal, estado (detectada / no detectada), confianza, valores compactos y un extracto corto del HTML público cuando existe. Todo texto que viene del sitio se limpia (sin `<`, `>` ni caracteres de control), se acota y se marca como **dato no confiable**.
- **Nombres de los servicios de APROS** (catálogo) y los nombres de señales que no se pudieron verificar (sin su contenido).

## Qué NO se envía
Correos, teléfonos o nombres de personas de contacto, notas internas, puntajes, ajustes manuales, razones de rechazo, listas de no contactar, clientes, credenciales, datos de otros usuarios, ni ninguna cabecera de sesión.

## Controles
- Sin herramientas, sin navegación y sin ejecución de código en la llamada: el modelo solo devuelve JSON con esquema fijo.
- La salida se trata como no confiable: se valida contra el esquema, se limpia y se marcan afirmaciones sin evidencia, números sin respaldo, lenguaje prohibido, promesas, enlaces ajenos, datos personales y eco de instrucciones.
- Cada llamada queda en `ai_generations` (proveedor, modelo, versión del prompt, tokens, costo estimado, estado) sin modificar.
- Topes diario y mensual en USD; el peor caso se comprueba **antes** de llamar.
- Solo API de Anthropic con `ANTHROPIC_API_KEY`. Nunca credenciales de Claude Pro/Max ni de Claude Code.

## Pendiente antes de producción
Confirmar con la empresa las condiciones de retención/uso de datos de la cuenta de API y, si corresponde, informarlo en la política de privacidad. Con datos reales solo se envía contenido público de sitios web de empresas.

## Investigación con Grok (xAI) — sitio web y contactos públicos
Opcional. Se activa con `XAI_API_KEY` en `.env` (clave de la API de xAI, pago por uso; no sirve la suscripción de la app). Sin clave, Radar solo adivina dominios.

- **Qué se envía a xAI:** razón social, RUC y ciudad de la empresa (datos públicos del padrón de SUNAT) y la orden de buscar su sitio y sus contactos públicos. Nada de usuarios, correos de APROS, claves, diagnósticos ni notas internas.
- **Qué se recibe:** un JSON con el sitio y una lista de contactos, cada uno con la URL donde se vio. Se valida con un esquema; lo que no cumple se descarta.
- **Qué hace Radar con eso:** el sitio se comprueba con el descargador seguro (responde, `robots.txt`, nombre o RUC en la portada) y solo se asigna solo si aparece el RUC; los contactos pasan un filtro de formato y quedan «sin verificar», salvo los que Radar ve en el sitio propio de la empresa («verificado en su sitio»).
- **Solo canales corporativos y públicos.** No se buscan datos de personas (Ley 29733). Las empresas en «No contactar» y los clientes activos no se consultan.
- **Costo:** tokens del modelo (`XAI_MODEL`, por defecto `grok-4.3`) más 5 USD por cada 1.000 búsquedas web. Cada consulta guarda su costo estimado en `company_research`. Topes por corrida: `RESEARCH_PER_RUN` (empresas) y `RESEARCH_MAX_USD_PER_RUN` (gasto estimado).
- **Qué sale de Radar:** las consultas las hace el worker (`npm run worker`) hacia `api.x.ai`. La clave no se guarda en la base ni se escribe en los registros.

