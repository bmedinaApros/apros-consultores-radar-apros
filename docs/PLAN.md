# Radar APROS — Plan técnico (borrador para aprobación)

Estado: **borrador. No se ha implementado nada.** Fecha: 2026-11-06.

## 0. Inspección del entorno

| Elemento | Hallazgo |
|---|---|
| Entorno | Contenedor Linux en la nube, no tu Mac. No hay acceso a archivos locales de la Mac. |
| Directorio de trabajo | `/home/user` vacío, sin repositorio git. |
| GitHub | Una sola cuenta/repo visible: `fadebarber-app/fade` (privado). Por el nombre parece otro proyecto. **No lo conecté** (el permiso fue denegado) y no lo asumo como base de Radar. |
| Herramientas | Node 22.23, npm 10.9, Docker 29.9, PostgreSQL client 16.15, git 2.43, Chromium + Playwright preinstalados. |
| Versiones en npm (verificadas hoy) | next 16.4.5, typescript 7.0.2, pg-boss 12.38.1, playwright 1.65.0. Se fijan en `package.json` y lockfile al implementar, tras revisar que sigan mantenidas. |
| Hub / CRM | Sin documentación ni acceso. Se usa adaptador simulado (decisión D-05). |
| Metodología Digital Growth Advisor | No existe en el entorno. Se usará archivo de ejemplo en `docs/methodology/` y se te avisará. |
| Marca | Recibidos: manual (PDF), `design.md` y dos logotipos horizontales (color y blanco) en `assets/brand/`. **Falta el isotipo solo.** El manual tiene la errata del HEX del azul (se usa `#0054FC`). Roboto como fuente de cuerpo está inferida y pendiente de validar con Diseño. |
| Fuente Questrial | No incluida. Verificar licencia (SIL OFL en Google Fonts) y alojarla localmente. |

Nota sobre Docker: está instalado, pero si el daemon no corre en este contenedor, la base de desarrollo usará un PostgreSQL local; se confirma en fase 1.

## 0.1 Fuentes de información (qué consulta Radar y qué no)

| Fuente | Uso | Estado |
|---|---|---|
| Archivos CSV del equipo comercial | Origen principal de las empresas | En el plan |
| Alta manual | Empresas que el equipo encuentra por su cuenta | En el plan |
| **Sitio web público de cada empresa** | Único sitio externo que el analizador visita: pocas páginas, respetando `robots.txt`, con User-Agent identificable | En el plan |
| PageSpeed Insights API (Google) | Rendimiento de ese mismo sitio | En el plan, con clave y cuota |
| API de Anthropic | Redacta el diagnóstico solo con observaciones ya guardadas; no navega | En el plan |
| Google, LinkedIn y directorios que lo prohíban | Scraping | **Excluido** |
| Proveedores de datos de empresas (SUNAT/padrón RUC, Google Places API u otros) | Descubrir empresas | **No incluido.** Cada uno requiere revisar términos de uso, límites de almacenamiento y costo antes de decidir. |

## 1. Arquitectura

Monolito modular en un solo repositorio. Sin microservicios, sin Redis.

```
Next.js (App Router, TS estricto)
 ├─ UI (React Server Components + islas de cliente)
 ├─ Route handlers / server actions  → capa de servicios (reglas de negocio + autorización por objeto)
 ├─ Worker (proceso Node aparte, misma base de código) → pg-boss sobre PostgreSQL
 └─ PostgreSQL 16 (datos, cola, auditoría)
Adaptadores detrás de interfaces:
 CommercialSystemAdapter (local | simulado | CSV)   CompanySourceProvider (CSV | manual | futuros)
 AiProvider (Anthropic | simulado)   PageSpeedProvider (API | simulado)   Fetcher seguro (SSRF)
```

Módulos: `auth`, `rbac`, `audit`, `companies` (importación, dedupe, no contactar), `analyzer` (fetcher seguro, extractores, catálogo de señales), `scoring` (modelos versionados, calibración), `diagnostics` (IA, evidencia, flujo de aprobación, exportación PDF/PPTX), `sales` (embudo, actividades, tareas, visitas), `dashboard`, `handoff`, `budget`, `compliance`.

Reglas transversales:
- Toda regla de negocio y autorización vive en la capa de servicios, nunca solo en la UI.
- Feature flags por proveedor y módulo.
- Rubros, señales por rubro, modelos de scoring y plantillas son **datos** editables por el administrador, no código.
- Cada llamada externa pasa por presupuesto, caché y registro de costo.

### Stack y justificación
- Next.js + TypeScript estricto + PostgreSQL: lo pide el prompt y es mantenible por un equipo pequeño.
- Migraciones SQL versionadas (herramienta propuesta: `node-pg-migrate` o Drizzle Kit; ver pregunta Q3).
- Cola: pg-boss (persistente en PostgreSQL, reintentos, idempotencia por clave).
- Generación de PDF: renderizado HTML→PDF con Chromium (Playwright) para respetar la marca. PPTX: `pptxgenjs`. Ambos se revisan visualmente.
- Pruebas: Vitest (unitarias/integración), Playwright (E2E y capturas móvil/escritorio).
- Auth: Google OIDC (Auth.js o implementación mínima con `openid-client`; decisión final en fase 1).

## 2. Modelo de datos (resumen)

Todas las tablas con `id uuid`, `created_at`, `updated_at`; borrado lógico solo donde se justifique (personas, por derecho de eliminación se usa borrado real o anonimización).

- **Identidad:** `users`, `roles` (admin, líder, vendedor, consultor, lectura), `sessions`.
- **Catálogo:** `industries` (rubro, subrubro opcional), `signal_definitions` (código, tipo observado/inferido/manual, aplica a rubro), `industry_signals`, `scoring_models` + `scoring_model_versions` (pesos que suman 100, umbrales, descalificadores), `diagnostic_templates`.
- **Empresas:** `companies` (razón social, dominio, RUC opcional, ciudad, rubro, estado de clasificación, responsable, fuente, fecha), `company_sources`, `import_batches` + `import_rows` (deshacer por lote), `duplicate_candidates`, `do_not_contact` (empresa/dominio/correo), `contacts` (datos mínimos, con fuente y finalidad).
- **Análisis:** `analysis_runs`, `signal_observations` (campos exactos del prompt + `status`: observado / no verificado), `fetch_log` (URL, estado, motivo de bloqueo).
- **Scoring:** `scores` (modelo y versión, desglose, motivos, IDs de observaciones usadas, ajuste manual con motivo), `manual_signals`.
- **Diagnóstico:** `diagnostics` (estado `borrador|en_revision|aprobado|rechazado`, `stale`), `diagnostic_claims` (texto, IDs de observaciones, cifra y su origen), `diagnostic_events` (autor, cambios, aprobador), `ai_generations` (modelo, versión de prompt, tokens, costo).
- **Comercial:** `pipeline_stage_history`, `activities`, `tasks`, `outcomes` (motivo, ticket, margen, retainer), `visit_plans`.
- **Resultados:** `handoffs` (clave de idempotencia, estado, intentos), `baselines`, `cost_entries`, `budgets`.
- **Transversal:** `audit_log` (solo inserción; el rol de BD de la app no tiene UPDATE/DELETE), `jobs` (pg-boss), `feature_flags`, `consent_requests` (derechos ARCO).

Índices principales: dominio normalizado único parcial, `(owner, stage, score)`, `(company_id, signal_code, observed_at)`, `audit_log(entity, created_at)`. Consultas de bandeja con joins/lateral, sin N+1.

## 3. Modelo de amenazas (resumen; detalle en `docs/SECURITY.md`)

| Amenaza | Mitigación principal |
|---|---|
| SSRF desde el analizador | Fetcher propio: solo http/https y puertos 80/443; resolver DNS, rechazar rangos privados, loopback, link-local, metadatos de nube (IPv4/IPv6, incluidos IPv4 mapeados); conectar a la IP validada (anti-rebinding); revalidar en cada redirección; límites de tamaño, tiempo, redirecciones y tipo; sin ejecutar contenido; robots.txt, User-Agent identificable, límite por dominio. Navegador headless solo si es imprescindible, aislado sin red interna. |
| Inyección de prompts | Contenido web como dato delimitado; modelo sin herramientas, secretos ni red; salida con esquema validado; cada afirmación exige IDs de observaciones; sanitización y lista blanca de enlaces; pruebas con páginas hostiles. |
| Alucinación / hallazgos falsos | Señales determinísticas; distinción observado/inferido; "no se pudo verificar" nunca es negativo; validador rechaza cifras sin origen; aprobación humana obligatoria aplicada en servidor. |
| Acceso indebido (IDOR, escalada) | RBAC en servidor con verificación por objeto; pruebas por rol; auditoría. |
| Sesión / CSRF | Cookies HttpOnly, Secure, SameSite; expiración y revocación; tokens CSRF. |
| Inyección (SQL, CSV, XSS) | Consultas parametrizadas; escape de salida; CSP estricta; neutralización de fórmulas CSV; validación de archivos subidos. |
| Fuga de secretos / datos | Variables de entorno; escaneo de secretos en CI; logs sin datos personales; mínimo privilegio en BD; respaldos cifrados. |
| Abuso de costos | Presupuesto diario/mensual con pausa; rate limiting; caché; idempotencia. |
| Cadena de suministro | Lockfile, auditoría de dependencias que falla en alta/crítica, política documentada. |
| Uso comercial indebido de contactos | Lista de no contactar aplicada en servicio, exportación y borradores. |

## 4. Supuestos

1. Un solo tenant (APROS). Unos 3 vendedores y pocas decenas de usuarios en total; miles de empresas.
2. Despliegue en un solo servidor/contenedor con PostgreSQL gestionado o propio; el proveedor de hosting aún no está decidido (Q4).
3. Dominio de Google Workspace configurable por variable de entorno.
4. Datos de IA: solo se envían observaciones corporativas y texto público de la empresa; sin datos personales salvo necesidad demostrada.
5. El piloto de 30 diagnósticos se hace con los rubros que el equipo elija entre los de ejemplo.

## 5. Riesgos

| Riesgo | Impacto | Respuesta |
|---|---|---|
| Sitios que bloquean bots o usan desafíos antibots | Señales incompletas | Estado "no verificado"; nunca se interpreta como hallazgo negativo. |
| Metodología de Digital Growth Advisor no disponible | Scoring genérico al inicio | Archivo de ejemplo versionado; se reemplaza cuando la entregues. |
| Contrato Hub/CRM desconocido | Retrabajo de integración | Adaptador simulado + CSV; contrato real en fase 6. |
| Cumplimiento legal (Leyes 29733 y 28493) | Sanciones, daño reputacional | Controles técnicos y `COMPLIANCE.md` para revisión de abogado; no se afirma cumplimiento. |
| Calidad de diagnóstico IA | Daño a la marca | Evidencia obligatoria, revisión humana, versión de prompt auditable. |
| Términos de proveedores de datos | Uso prohibido | Revisar términos antes de cualquier `CompanySourceProvider`; sin scraping de Google/LinkedIn. |
| Alcance amplio (siete fases) | Retraso | Fase 4 prioriza el piloto; paradas de revisión por fase. |
| Calibración con pocas ventas cerradas | Pesos engañosos | Muestra mínima configurable y advertencia. |

## 6. Costos operativos estimados (detalle y supuestos en `docs/COSTS.md`)

Cifras orientativas, a validar con precios vigentes antes de contratar nada.

- **Fijos mensuales:** hosting de app + worker + PostgreSQL con respaldos: aprox. USD 40–120 según proveedor. Dominio/certificado: mínimo. Google Workspace ya existe.
- **Variables:** PageSpeed Insights API (gratuita con cuota); IA por diagnóstico: aprox. USD 0.05–0.50 según modelo y longitud (hipótesis a medir en el piloto). 30 diagnósticos del piloto: bajo USD 20.
- **Mantenimiento:** 4–8 h/mes estimadas (dependencias, ajustes de señales, soporte).
- Presupuesto diario y mensual configurable, con pausa automática.

## 7. Fases y entregables

Cada fase termina con pruebas ejecutadas, resumen y **detención para tu revisión**.

1. **Fundaciones:** repositorio, TS estricto, Docker Compose, migraciones, auth Google OIDC, RBAC, auditoría, tokens de diseño APROS, CI (lint, tipos, pruebas, auditoría, escaneo de secretos), `SECURITY.md` inicial.
2. **Base y análisis:** importación CSV, dedupe, no contactar, rubros editables, fetcher seguro con pruebas SSRF, extractores y catálogo de señales, PageSpeed.
3. **Priorización:** modelos por rubro, scoring explicable, ajustes manuales, bandeja y vista 360.
4. **Diagnóstico (apto para piloto de 30):** generación con esquema y evidencia, flujo de aprobación forzado en servidor, PDF y PPTX con marca, presupuesto de IA, pruebas de inyección de prompts.
5. **Trabajo comercial:** embudo, actividades, tareas, visitas, borradores con advertencias legales, reanálisis programado.
6. **Resultados e integración:** panel con fórmulas documentadas, calibración asistida, adaptadores y traspaso idempotente.
7. **Endurecimiento:** revisión de seguridad, rendimiento, accesibilidad, costos, restauración de respaldo probada, `RUNBOOK.md`, demo con datos ficticios.

## 8. Preguntas que bloquean (solo estas)

- **Q1.** ¿Dónde debo crear el repositorio de Radar? Propongo uno nuevo y vacío (p. ej. `apros-consultores/radar-apros`) bajo tu control. Hoy solo veo `fadebarber-app/fade`, que no parece relacionado.
- **Q2.** ¿Puedes entregar el material del Digital Growth Advisor y los archivos de marca (`assets/brand/`)? Si no, sigo con ejemplos y marcadores pendientes.
- **Q3.** ¿Algún stack del Hub que deba respetar? Si no, uso el propuesto (Next.js, PostgreSQL, pg-boss).
- **Q4.** ¿Dónde se alojará (proveedor/región)? Afecta Docker, respaldos y costos. Puedo avanzar sin esto hasta la fase 7.
- **Q5.** ¿Qué dominio(s) de Google Workspace se autorizan, y quién crea las credenciales OIDC?

Aprobación pedida: este plan, las decisiones de `DECISIONS.md` y la respuesta a Q1 (necesaria para iniciar la fase 1).
