# Diagnósticos (fase 5)

Un diagnóstico por empresa: 1–3 oportunidades con la cadena **Observación → Oportunidad → Impacto → Propuesta → Entregable → Modelo comercial → KPI**, siempre etiquetadas **hecho / inferencia / hipótesis a validar**.

## Flujo
`generar (IA) → borrador → enviar a revisión → aprobar | rechazar (con motivo)`. Editar crea una versión nueva, retira la aprobación y vuelve a validar. Versiones, eventos y llamadas a la IA no se pueden modificar ni borrar (triggers en la base).

| Acción | Roles |
|---|---|
| Generar, editar, enviar a revisión | admin, sales_lead, consultant |
| Aprobar / rechazar | admin, consultant |
| Descargar PDF/PPTX | los anteriores y salesperson (solo aprobados de sus empresas o sin responsable) |
| Plantillas y presupuesto | admin |

## Reglas que el servidor impone (no solo la pantalla)
- Una afirmación sin evidencia citada, que afirma algo a partir de una ausencia, con cifras sin respaldo, con lenguaje crítico/prometedor o con enlaces ajenos queda **marcada**; con marcas bloqueantes no se envía a revisión ni se aprueba.
- Un sitio ilegible (sin ≥3 señales verificables) **no genera** diagnóstico: fallar al leer no es un hallazgo.
- **Desactualizado:** si el siguiente análisis cambia una señal citada, el diagnóstico no se aprueba ni se descarga hasta regenerarlo.
- La descarga (`/api/diagnostics/[id]/export?format=informe|pdf|pptx`) comprueba en cada llamada: sesión, permiso, visibilidad, aprobado, versión aprobada = vigente, sin marcas, evidencia al día. Cada descarga se audita con hash.
- Empresas en no contactar o clientes activos: no se generan ni se aprueban.

## Entregables
**Informe (PDF, varias páginas A4, `format=informe`)**: portada con marca, resumen ejecutivo, contexto y alcance, una página por oportunidad (observación → oportunidad → impacto → propuesta → entregable → KPI) con su evidencia, anexo con todas las señales revisadas (con la salvedad «no detectado ≠ no existe»), metodología y notas; encabezado/pie con «X de N». Mismas reglas de acceso que el resto de exportaciones.

Resumen en PDF de una página A4 (Questrial/Roboto, logo APROS; si el texto no cabe se reduce hasta 70 % y, si aún no cabe, se rechaza) y PPTX (portada, observaciones, una lámina por oportunidad, propuesta/siguiente paso, cierre) desde los mismos datos. Los PPTX usan Questrial/Roboto: si el equipo que lo abre no las tiene, PowerPoint sustituye la fuente.

## Piloto de 30
En una lista semanal, «Generar diagnósticos de las aprobadas» encola hasta 30 empresas aprobadas sin diagnóstico; se generan de una en una respetando el presupuesto diario.

## Modos de IA
`AI_PROVIDER=rules` (por defecto): **plantillas y reglas, sin IA y sin costo**; el texto sale de las señales observadas, se adapta al rubro, prioriza hasta 3 oportunidades (máximo 2 del mismo servicio), solo menciona servicios del catálogo vigente y es determinístico (misma evidencia, mismo texto). Pasa por el mismo validador y por la misma revisión humana que el de IA. `anthropic` (opcional; requiere `ANTHROPIC_API_KEY`; `ANTHROPIC_MODEL`, por defecto `claude-opus-5-5`) redacta con IA y tiene topes de gasto. `disabled` y `simulated` son valores antiguos y equivalen a `rules`. Para pausar la generación, desmarca «Permitir generar diagnósticos» en Configuración → Diagnósticos: reglas e IA.

## Límites conocidos
La integración real con Anthropic se probó solo con un cliente simulado de la API (sin clave); el primer uso real debe revisarse a mano. Prompts y plantillas no están calibrados con casos reales. Los costos son estimaciones con precios de lista.

## Reglas del diagnóstico sin IA (V2-3a)
Cada regla produce una oportunidad candidata con un peso; gana lo más importante: conexión segura (95), móvil (90), velocidad en móvil (70–85), caminos de contacto (62–82), medición (60), atención por WhatsApp (50–65 según rubro), herramienta del rubro (55), mantenimiento de enlaces (52), base de SEO técnico (40–72), contenido al día (45), visibilidad en asistentes de IA (38), información de la empresa legible por máquinas (36) y medición de campañas en redes (30, como hipótesis). Sin ninguna brecha, propone validar prioridades con la empresa (hipótesis). El vocabulario de cada rubro está en `src/lib/diagnostics/rules.ts`; un rubro desconocido usa un texto neutro. Es menos específico que un texto con IA: se mejora agregando reglas y vocabulario.
