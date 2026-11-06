# Puntaje, lista semanal y revisión

> **Aviso importante:** los modelos de puntaje que vienen cargados (pesos, reglas y puntos) son una **hipótesis inicial de ejemplo**. No están calibrados con resultados de ventas de APROS. La calibración asistida con ganadas y perdidas llega en la fase 7. Hasta entonces, el puntaje ordena, no predice.

## Cómo se calcula

Función pura y determinística (`src/lib/scoring/engine.ts`): mismas entradas y mismo modelo dan el mismo resultado.

1. **Cinco dimensiones**, con los pesos iniciales del prompt: encaje con ICP y vertical 30, señal de urgencia 25, capacidad de pago 25, potencial de retainer 10, acceso al decisor 10. Deben sumar 100; el sistema no deja guardar un modelo que no lo cumpla.
2. Cada dimensión tiene **reglas**: una condición sobre una señal («no se detecta GA4», «rendimiento móvil menor que 50») y unos puntos.
3. Los puntos de una regla se **ponderan por la confianza** de la observación: alta ×1, media ×0,75, baja ×0,5. Una ausencia en HTML estático no es una certeza.
4. La puntuación de una dimensión se acota a 100 y aporta `peso × puntuación / 100` al total.
5. **Umbrales** (configurables por modelo): 70 o más pasa a ventas, de 50 a 69 nurturing, menos de 50 se descarta.
6. **Descalificadores duros:** si se cumple uno (por ejemplo, el sitio muestra a APROS como proveedor, o una persona marcó «no es candidato»), la banda es «descartar» aunque el puntaje sea alto.
7. **Ajuste manual** de −50 a +50 puntos, con **motivo obligatorio** y registro en la auditoría. Un ajuste de 0 lo retira.

## Qué no hace

- Una señal **«no se pudo verificar» ni suma ni resta**: no cumple ninguna condición. Solo baja la cobertura de datos.
- Una señal que **no aplica al rubro** (por ejemplo, «reserva de citas» en una empresa inmobiliaria) no existe para esa empresa: ni resta ni cuenta en la cobertura.
- Los criterios que **no se pueden observar en la web** (tamaño de la empresa, si se conoce al decisor, interés en un servicio recurrente) los captura una persona, quedan **etiquetados como manuales** y, mientras falten, no suman puntos. El puntaje muestra cuáles faltan.
- Lo «inferido» (por ejemplo, que un píxel de Meta sea un indicio de inversión en publicidad) se etiqueta como inferido en el desglose.

## Explicable y reproducible

Cada puntaje guardado incluye la versión del modelo, el desglose por dimensión y regla (con puntos, factor de confianza, origen y evidencia), los motivos, los identificadores de las observaciones usadas, los criterios manuales y el ajuste vigentes, y la fecha de referencia. La ficha de la empresa **recalcula** el puntaje con esas entradas congeladas y verifica que coincida exactamente.

Los puntajes y las versiones de modelo son **inmutables** (triggers en la base). Cambiar un modelo crea una versión nueva; los puntajes viejos siguen reproduciéndose con la versión con la que se calcularon. No se guarda un puntaje nuevo si nada cambió (mismo modelo, observaciones, criterios y ajuste).

## Un modelo por rubro

Hay un **modelo general** y, como ejemplo, un modelo por cada rubro cargado (el general más reglas con las señales propias del rubro). Un rubro nuevo usa el general hasta que el administrador cree el suyo en **Modelos de puntaje** (JSON validado). La interfaz muestra qué modelo y versión usó cada puntaje y **advierte que solo son comparables directamente los puntajes del mismo modelo**.

## Servicios sugeridos

El catálogo de **Servicios de APROS** es un ejemplo editable. Cada servicio tiene reglas «señal + estado → motivo». Las sugerencias son siempre **hipótesis de encaje a validar con el prospecto**, nunca hechos, y muestran el motivo.

## Ejecución semanal

Programada (por defecto lunes 06:00, hora de Lima) o manual. Una a la vez. Cada etapa es idempotente:

1. **Descubrimiento** con las fuentes activas (cada una falla por separado).
2. **Análisis** de empresas con sitio, sin bloqueo y sin análisis vigente, con **presupuesto** de sitios por ejecución. Primero las nunca analizadas.
3. **Puntaje** de toda empresa con análisis completado.
4. **Lista:** se excluyen las descalificadas, las de datos insuficientes (cobertura mínima configurable), las que el modelo descarta, las que no llegan al puntaje mínimo adicional, las de no contactar y clientes activos. Se ordena por banda y puntaje y se corta al tamaño de la lista (30 por defecto).
5. **Novedad:** una empresa ya listada **no reaparece** salvo que cambie una señal relevante del sitio (medición, conversión, SEO básico, TLS, CMS, rendimiento, datos estructurados). Reaparece con la razón visible. Un ajuste o criterio manual **no** la hace reaparecer.
6. **Snapshot inmutable:** cada lista guarda el puntaje, la banda, el modelo, la cobertura, los servicios y los motivos de ese momento. Solo cambian los campos de revisión y asignación.

Si se agota el presupuesto, se conserva todo lo hecho y la lista queda marcada **«cobertura parcial»** con la razón. La siguiente ejecución continúa donde quedó.

## Revisión humana antes del uso comercial

Cada elemento de la lista nace «pendiente de revisión». Quien tiene permiso (administrador, líder comercial, consultor) lo **aprueba** (y asigna a un vendedor o líder) o lo **rechaza con motivo**. Un **vendedor solo ve** lo aprobado que es suyo o no tiene responsable, tanto en la lista como en la bandeja. No se puede aprobar una empresa que pasó después a la lista de no contactar.

## Límites conocidos

- Puntos, pesos y umbrales son de ejemplo (ver el aviso al inicio).
- La capacidad de pago y el acceso al decisor se estiman con indicios de la web (tamaño del sitemap, etiquetas de publicidad, canales de contacto). Son débiles; los criterios manuales los corrigen.
- Un sitio renderizado en el navegador (SPA) da poca evidencia: sus ausencias tienen confianza baja y la cobertura lo refleja.
- El tamaño de la lista y los presupuestos son configurables, pero sus valores por defecto no se han validado con el uso real.
- Si el descubrimiento solo trae empresas sin sitio web, no hay nada que analizar: la lista saldrá vacía y lo dirá (cobertura 0 %).
