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
- La descarga (`/api/diagnostics/[id]/export?format=pdf|pptx`) comprueba en cada llamada: sesión, permiso, visibilidad, aprobado, versión aprobada = vigente, sin marcas, evidencia al día. Cada descarga se audita con hash.
- Empresas en no contactar o clientes activos: no se generan ni se aprueban.

## Entregables
PDF de una página A4 (Questrial/Roboto, logo APROS; si el texto no cabe se reduce hasta 70 % y, si aún no cabe, se rechaza) y PPTX (portada, observaciones, una lámina por oportunidad, propuesta/siguiente paso, cierre) desde los mismos datos. Los PPTX usan Questrial/Roboto: si el equipo que lo abre no las tiene, PowerPoint sustituye la fuente.

## Piloto de 30
En una lista semanal, «Generar diagnósticos de las aprobadas» encola hasta 30 empresas aprobadas sin diagnóstico; se generan de una en una respetando el presupuesto diario.

## Modos de IA
`AI_PROVIDER=disabled` (por defecto), `simulated` (texto de demostración con reglas; prohibido en producción) o `anthropic` (requiere `ANTHROPIC_API_KEY`; `ANTHROPIC_MODEL`, por defecto `claude-opus-5-5`). Ver `docs/AI-DATA.md`.

## Límites conocidos
La integración real con Anthropic se probó solo con un cliente simulado de la API (sin clave); el primer uso real debe revisarse a mano. Prompts y plantillas no están calibrados con casos reales. Los costos son estimaciones con precios de lista.
