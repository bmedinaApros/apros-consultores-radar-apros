# Radar APROS — Plan técnico v2 (borrador para aprobación)

Estado: **borrador. No se ha implementado nada.** Fecha: 2026-11-06.
Cambio principal respecto a v1: **el descubrimiento semanal de empresas es el propósito central de Radar**, no un módulo opcional.

## 0. Propósito

Cada semana, Radar entrega una **lista priorizada de empresas peruanas a las que APROS podría ofrecer sus servicios**, con la evidencia de por qué cada una y qué servicio encaja. Un consultor revisa la lista antes de que un vendedor la use.

Flujo central:

```
Fuentes autorizadas → Descubrimiento → Normalizar y deduplicar → Excluir (clientes activos, no contactar)
   → Analizar sitio público (señales con evidencia) → Puntuar por rubro → Emparejar con servicios APROS
   → Lista semanal (snapshot inmutable) → Revisión humana → Diagnóstico (solo las elegidas) → Trabajo comercial → Resultados
```

Principio rector: calidad del ingreso y credibilidad. Un hallazgo falso daña la marca más que un lead extra. Por eso las conclusiones son **determinísticas y con evidencia**; la IA solo redacta, nunca decide que una señal existe.

## 1. Inspección del entorno

| Elemento | Hallazgo |
|---|---|
| Entorno | Contenedor Linux en la nube, no la Mac del usuario. Se construye en el repo; el usuario hace `git pull` y corre en su Mac. |
| Repo | `bmedinaApros/apros-consultores-radar-apros` conectado, privado. |
| Herramientas | Node 22, npm 10, Docker 29, PostgreSQL client 16, git, Chromium + Playwright. |
| Versiones npm verificadas el 2026-11-06 | next 16.4.5, typescript 7.0.2, pg-boss 12.38.1, playwright 1.65.0. Se fijan con lockfile tras revisar mantenimiento. |
| Metodología | Recibida (`docs/methodology/`). Pensada para clientes existentes; adaptación en `radar-adaptation.md`. |
| Marca | Manual, `design.md` y logotipos horizontales recibidos. **Falta el isotipo solo.** Roboto (cuerpo) por validar con Diseño. |
| Hub / CRM | Sin documentación. Adaptador simulado. |
| Hosting | Local en la Mac hasta que el jefe apruebe; luego servidor propio con dominio nuevo. |

## 2. Fuentes de información

Toda fuente va detrás de `CompanySourceProvider`, **desactivada por defecto**. Antes de activar una, se revisan sus términos (uso, almacenamiento, límites, costo) y se documenta en `docs/sources/<fuente>.md`. Sin ese documento aprobado, el proveedor no puede activarse.

| Fuente | Aporta | Costo | Estado inicial |
|---|---|---|---|
| CSV del equipo y alta manual | Empresas conocidas | Gratis | Activa |
| Padrón de RUC de SUNAT | Razón social, actividad, ubicación | Gratis | Candidata (revisar términos; probablemente sin sitio web) |
| SEACE / OSCE (compras públicas) | Empresas que venden al Estado | Gratis | Candidata |
| SMV / Bolsa de Valores de Lima | Empresas medianas y grandes | Gratis | Candidata |
| Google Places API | Empresas por rubro y ciudad, con sitio web | De pago, con tope mensual | Candidata (revisar límites de almacenamiento) |
| Directorios y cámaras | Listados por rubro | Variable | Solo si sus términos lo permiten |
| Sitio web público de cada empresa | Señales (analizador) | Gratis | Activa |
| PageSpeed Insights API | Rendimiento | Gratis con cuota | Activa con clave |
| API de Anthropic | Redactar explicaciones y diagnósticos con observaciones ya guardadas | Por uso, con tope | Activa con tope |

Excluido: scraping de Google, LinkedIn y directorios que lo prohíban; enriquecimiento de contactos personales con fuentes dudosas.

Límite que hay que tener presente: ninguna fuente dice "esta empresa necesita APROS". Esa conclusión sale de las señales del sitio y del modelo de puntaje del rubro, y es una **sugerencia** que un consultor valida.

## 3. Arquitectura

Monolito modular, un solo repositorio, sin Redis ni microservicios.

```
Next.js (App Router, TS estricto)  ── UI, route handlers, server actions → capa de servicios (reglas + autorización por objeto)
Worker Node (misma base de código) ── pg-boss sobre PostgreSQL: cron semanal, descubrimiento, análisis, puntaje, lista, diagnósticos
PostgreSQL 16                       ── datos, cola, auditoría
Interfaces: CompanySourceProvider, CommercialSystemAdapter, AiProvider, PageSpeedProvider, SafeFetcher
```

Módulos: `auth`, `rbac`, `audit`, `discovery` (proveedores, orquestación semanal, novedad), `companies` (normalización, dedupe, no contactar), `analyzer`, `scoring`, `offers` (catálogo de servicios APROS y su relación con señales), `weekly` (lista semanal), `diagnostics`, `sales`, `dashboard`, `handoff`, `budget`, `compliance`.

### Pipeline semanal (núcleo)
- Disparo: cron de pg-boss, lunes 06:00 `America/Lima` (configurable), o ejecución manual por un administrador.
- Cada etapa es un trabajo idempotente con reintentos, tiempo máximo y cola de errores. Si una fuente falla, las demás siguen y la lista indica la cobertura real.
- **Novedad:** una empresa ya listada no reaparece salvo que una señal relevante cambie. Evita repetir la misma lista.
- **Presupuesto semanal:** límite de consultas a APIs de pago, páginas analizadas e IA. Al agotarse, la ejecución se pausa, conserva lo hecho y lo informa en la lista ("cobertura parcial").
- **Capacidad:** tamaño de la lista configurable (por defecto 30). Se priorizan las de mayor puntaje que ya pasaron revisión de datos.
- **Lista inmutable:** cada semana se guarda un snapshot con versión de modelo, señales y fuentes usadas, para poder explicarla y reproducirla.
- **Calidad de cobertura visible:** % de empresas analizadas, % "no se pudo verificar", salud de cada fuente.

### Catálogo de servicios y emparejamiento
- `service_offers`: servicios que vende APROS (por ejemplo web corporativa, SEO, CRO, analítica, automatización), editables por un administrador.
- Reglas editables relacionan señales con servicios ("sin medición detectada" → analítica). El resultado se muestra como **hipótesis de encaje a validar**, nunca como hecho.
- La IA puede redactar el "por qué ahora" usando solo observaciones guardadas; cada frase cita sus IDs.

## 4. Modelo de datos (resumen)

- **Identidad:** `users`, `roles`, `sessions`.
- **Catálogo:** `industries`, `signal_definitions`, `industry_signals`, `scoring_models` y versiones (pesos que suman 100), `diagnostic_templates`, `service_offers`, `signal_service_rules`.
- **Descubrimiento:** `source_providers` (estado, flag, documento de términos aprobado), `discovery_runs`, `discovery_candidates` (origen, fecha, estado de revisión), `source_usage` (consultas y costo).
- **Empresas:** `companies`, `company_sources`, `import_batches`/`import_rows`, `duplicate_candidates`, `do_not_contact`, `contacts` (mínimos, con fuente y finalidad).
- **Análisis:** `analysis_runs`, `signal_observations` (campos exactos del prompt + estado observado / no verificado), `fetch_log`.
- **Puntaje:** `scores` (modelo y versión, desglose, motivos, IDs de observaciones, ajuste manual con motivo), `manual_signals`.
- **Lista semanal:** `weekly_lists` (semana, cobertura, presupuesto usado), `weekly_list_items` (posición, puntaje, servicios sugeridos, motivos, estado: nueva / vista / asignada / descartada).
- **Diagnóstico:** `diagnostics`, `diagnostic_claims`, `diagnostic_events`, `ai_generations`.
- **Comercial:** `pipeline_stage_history`, `activities`, `tasks`, `outcomes`, `visit_plans`.
- **Resultados:** `handoffs`, `baselines`, `cost_entries`, `budgets`.
- **Transversal:** `audit_log` (solo inserción), `feature_flags`, `consent_requests`.

Índices principales: dominio normalizado único parcial, `(weekly_list_id, rank)`, `(owner, stage, score)`, `(company_id, signal_code, observed_at)`, `audit_log(entity, created_at)`. Sin N+1.

## 5. Modelo de amenazas (resumen; detalle en `docs/SECURITY.md`)

| Amenaza | Mitigación |
|---|---|
| SSRF desde el analizador | Solo http/https y puertos autorizados; DNS validado y revalidado en cada redirección; bloqueo de rangos privados, loopback, link-local y metadatos de nube (IPv4/IPv6); conexión a la IP validada (anti-rebinding); límites de tamaño, tiempo, redirecciones y tipo; robots.txt, User-Agent identificable y límite por dominio. |
| Descubrimiento a escala | Cuotas por fuente y por dominio, respeto de términos, registro de uso y costo. |
| Inyección de prompts | Contenido web como dato delimitado; modelo sin herramientas, secretos ni red; salida con esquema validado; afirmaciones con IDs de observaciones; lista blanca de enlaces; pruebas con páginas hostiles. |
| Hallazgos falsos | Señales determinísticas; observado vs inferido; "no se pudo verificar" nunca es negativo; encaje con servicio marcado como hipótesis. |
| Acceso indebido | RBAC en servidor y por objeto; auditoría. |
| Sesión / CSRF / inyecciones | Cookies seguras, CSRF, consultas parametrizadas, CSP estricta, neutralización de fórmulas CSV. |
| Secretos y datos | Variables de entorno, escaneo en CI, logs sin datos personales, mínimo privilegio, respaldos cifrados. |
| Abuso de costos | Presupuestos diario, semanal y mensual con pausa; caché; idempotencia. |
| Uso comercial indebido | No contactar aplicado en servicio, exportación y borradores. |
| Cadena de suministro | Lockfile y auditoría que falla en alta o crítica. |

## 6. Supuestos

1. Un solo tenant (APROS); unos 3 vendedores y consultores; miles de empresas.
2. Local en la Mac con Docker Compose hasta aprobación del jefe; solo datos ficticios hasta entonces (D-19).
3. Por defecto, solo fuentes gratuitas; Google Places queda desactivado hasta que se apruebe con un tope (D-20).
4. Alcance geográfico inicial Lima (configurable) y los siete rubros de ejemplo (D-21).
5. Lista semanal de 30 empresas, configurable (D-22).
6. Datos de IA: solo observaciones corporativas; sin datos personales.

## 7. Riesgos

| Riesgo | Respuesta |
|---|---|
| Las fuentes gratuitas no traen sitio web ni rubro útil | El analizador solo corre sobre empresas con dominio conocido; las demás quedan "por clasificar" o "sin sitio". Se mide la cobertura y se reevalúan fuentes de pago. |
| Términos de uso de una fuente | Sin documento de términos aprobado, no se activa. |
| Listas de baja calidad | Umbral mínimo de puntaje y de cobertura de datos; si no hay suficientes, la lista es más corta y lo dice. |
| Sitios con antibots | "No se pudo verificar"; nunca se interpreta como negativo. |
| Conclusiones de IA erróneas | IA solo redacta; evidencia obligatoria; revisión humana. |
| Metodología pensada para clientes existentes | Adaptación documentada y pendiente de validar. |
| Cumplimiento legal (Leyes 29733 y 28493) | Controles técnicos y `COMPLIANCE.md` para revisión de abogado; no se afirma cumplimiento. |
| Calibración con pocas ventas | Muestra mínima configurable y advertencia. |

## 8. Costos operativos (detalle en `docs/COSTS.md`)

Orientativos, a validar con precios vigentes.
- **Fijos:** en local, USD 0. En servidor propio, lo define el jefe; app + worker + PostgreSQL con respaldos.
- **Variables:** fuentes gratuitas USD 0; Google Places solo si se aprueba, con tope mensual; PageSpeed gratis con cuota; IA aprox. USD 0.05–0.50 por diagnóstico (hipótesis a medir).
- **Por lista semanal:** costo mostrado en la propia lista y en el panel.
- **Mantenimiento:** 4–8 h/mes estimadas, más revisión de fuentes cuando cambien sus términos.

## 9. Fases

Cada fase termina con pruebas ejecutadas, resumen y **detención para tu revisión**.

1. **Fundaciones:** repo, TS estricto, Docker Compose, migraciones, auth (Google OIDC + acceso de desarrollo), RBAC, auditoría, tokens de marca, CI, `SECURITY.md` inicial.
2. **Empresas y descubrimiento:** `CompanySourceProvider`, CSV y alta manual, proveedores gratuitos aprobados tras revisar términos, normalización, deduplicación, no contactar, rubros editables.
3. **Analizador:** fetcher seguro con pruebas SSRF, extractores, catálogo de señales por rubro, PageSpeed, historial de observaciones.
4. **Puntaje y lista semanal (primer valor usable):** modelos por rubro, explicación, catálogo de servicios y emparejamiento, pipeline semanal con presupuesto, lista inmutable, pantalla de revisión y bandeja.
5. **Diagnóstico (piloto de 30):** generación con evidencia, aprobación forzada en servidor, PDF y PPTX con marca, presupuesto de IA, pruebas de inyección.
6. **Trabajo comercial:** embudo, actividades, tareas, visitas, borradores con advertencias legales, reanálisis programado.
7. **Resultados e integración:** panel con fórmulas, calibración asistida, adaptadores y traspaso.
8. **Endurecimiento:** seguridad, rendimiento, accesibilidad, costos, restauración de respaldo, `RUNBOOK.md`, demo.

## 10. Preguntas que siguen abiertas

- **Q1.** ¿Apruebas este plan y las decisiones de `DECISIONS.md`?
- **Q2.** ¿`apros.pe` es el dominio de Google Workspace? (Se usa por defecto, configurable.)
- **Q3.** ¿Alguien puede validar con quien mantiene el Digital Growth Advisor si hay criterios de scoring adicionales?
- **Q4.** ¿Cuál es el catálogo de servicios de APROS que Radar debe proponer? Sin él se carga un ejemplo editable.

Resueltas: stack libre (D-16); hosting local primero (D-17); repositorio creado.
