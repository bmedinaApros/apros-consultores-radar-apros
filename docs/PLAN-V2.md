# Plan v2: fuentes gratuitas, base amplia y nuevo menú

Estado: **propuesta, pendiente de aprobación. No se implementa nada hasta que se apruebe.**
Fecha: 2026-11-07. Base: ramas `feat/fase-1…5` (PR #1 a #6, aún en borrador) y `feat/fase-6-descubrimiento` (solo documenta el rechazo de Google Places).

Se mantiene todo lo definido en el prompt original (seguridad, revisión humana, evidencia trazable, multirrubro, marca APROS, datos ficticios hasta la aprobación de tu jefe) salvo lo que este plan modifica. Las modificaciones están en la sección 9.

---

## 0. Resumen y lo que necesito de ti

**Lo esencial del diseño.** El padrón vive en una tabla propia (`registry_companies`), separada de `companies`. `companies` sigue siendo el conjunto de trabajo: empresas que alguien promovió porque pasan filtros y tienen web. Así el volumen está en la base, pero solo entra al embudo lo filtrado, y la lista semanal, el análisis y los vendedores nunca ven el padrón completo (sección 2).

**Hallazgo sobre las fuentes.** Desde este entorno de desarrollo **no pude abrir ninguna de las fuentes** (SUNAT, datosabiertos, OECE, OSM/Overpass, Get on Board, directorios, portales de empleo, Meta, Indecopi, PageSpeed). Por eso **ninguna revisión de términos está hecha** y la sección 3 lo dice fuente por fuente. Según tu regla, mientras no se verifique, ningún conector se automatiza: arranca como importación desde archivo o captura asistida. El código es el mismo; lo único que cambia es quién dispara la descarga.

**Decisiones que necesito (detalle en la sección 10):**
1. ¿Cómo se verifican los términos? Tú los abres y me pegas el texto, o me permites leer una lista corta de dominios.
2. ¿Se levanta la regla "solo datos ficticios" para datos públicos oficiales (padrón SUNAT, SEACE) en tu Mac?
3. Base de las ramas v2: ¿mergeamos primero #1 a #6 o apilamos?
4. Pantallas de **Vender** y **Resultados** (Embudo, Actividades, Panel): hoy no existen. ¿Se construyen dentro de v2 o después?
5. Permisos que hoy tiene `sales_lead` y chocan con "Configuración solo para administradores" (No contactar, Auditoría).
6. Clave de PageSpeed (la debes crear tú, gratuita).

---

## 1. Revisión del proyecto actual

**Qué existe y se reutiliza tal cual**

| Pieza | Estado | Uso en v2 |
|---|---|---|
| Analizador propio (SafeFetcher con anti-SSRF, robots RFC 9309, caché, límites por dominio, 26 señales comunes + por rubro) | Terminado y probado | Auditoría web (3.3 #13) y página de contacto (3.4) |
| `signal_observations` (observado / no detectado / no verificable, evidencia, fecha, confianza) | Terminado | Todas las señales nuevas son observaciones |
| Scoring determinístico versionado e inmutable, `asOf` reproducible | Terminado | Fase 6 de v2: nuevas señales, vigencia, pesos por rubro (nueva versión de modelo, nunca editar la vieja) |
| Cola pg-boss + worker | Terminado | Importación del padrón, OSM, SEACE, Get on Board |
| Dedupe por RUC, dominio y nombre, con revisión humana (`duplicate_candidates`) | Terminado, **pero en memoria** | Se rehace en SQL (ver riesgo R1) |
| Lista de no contactar, clientes activos | Terminado | Se aplica también al padrón |
| RBAC con 5 roles, auditoría con cadena de hash, CSRF | Terminado | Nuevos permisos |
| Diagnóstico con IA + PDF/PPTX, presupuesto, validador de afirmaciones | Terminado (fase 5) | Se agrega proveedor sin IA (sección 6) |
| `source_providers` con términos aprobados y activación | Terminado | Se extiende con versión del conector y política por defecto |
| Marca APROS, accesibilidad AA | Terminado | Menú nuevo |

**Qué choca con el volumen del padrón (hay que cambiarlo)**

- `CompanyIndex.load` carga **todas** las empresas en memoria para deduplicar. Con millones de filas no sirve.
- `companies` tiene índice único por RUC y por dominio y un `CHECK` de rubro al clasificar: correcto para el conjunto de trabajo, no para 10+ millones de filas sin rubro.
- La lista de empresas (`/companies`) y la bandeja ya paginan, pero no tienen búsqueda por texto indexada.
- El pipeline semanal toma como candidatos las empresas con dominio sin análisis reciente. Con una base grande necesita un tope por ejecución y solo debe ver empresas promovidas.

**Qué no existe todavía** (el menú nuevo lo nombra): Embudo, Actividades y visitas, Panel de indicadores, Mis leads como vista propia, Oportunidades públicas, Buscar empresas, vista de Auditorías web. Eran las fases 6 y 7 del plan original.

---

## 2. Arquitectura

### 2.1 Embudo

```
Padrón SUNAT (+CIIU, ubigeo) ──► registry_companies  (millones; solo lectura para el equipo)
OSM / directorios / CSV ───────► company_candidates   (empresas con web o canal, aún sin RUC confirmado)
                                          │  filtros: estado, tipo, CIIU→rubro, zona
                                          ▼
                       «Buscar empresas»: vista previa con conteo, tope por acción
                                          │  promover (revisión humana de dudosos)
                                          ▼
                companies (conjunto de trabajo) ──► análisis web ──► scoring ──► lista semanal ──► revisión humana ──► vendedor
```

Regla de producto: **estar en el padrón no hace a una empresa un lead.** Un vendedor no ve el padrón; ve solo lo aprobado, como hoy (D-50). Promover requiere permiso y el sistema muestra siempre el conteo antes de ejecutar.

### 2.2 Decisiones de arquitectura

| ID propuesto | Decisión | Motivo |
|---|---|---|
| V2-01 | Padrón en `registry_companies`, separado de `companies`. Promoción explícita. | Rendimiento y evitar empujar contactos por estar en la base. |
| V2-02 | Importación por streaming con `COPY` a una tabla temporal y `INSERT … ON CONFLICT` por lotes, en un job con checkpoint reanudable. | No bloquear la app, soportar fallos, memoria constante. |
| V2-03 | Por defecto solo se carga lo que pasa el filtro de importación (ACTIVO, HABIDO, RUC que empieza con 20). El archivo original no se conserva. | Menos disco y menos datos personales. El filtro es configurable. |
| V2-04 | Búsqueda de nombres con `pg_trgm` (extensión de PostgreSQL, gratuita) e índices por `ruc`, `ubigeo`, `estado`, CIIU. Paginación por keyset. | Respuestas en tiempos razonables sin cargar el padrón. |
| V2-05 | Deduplicación en SQL: RUC exacto (autoritativo), dominio exacto, nombre normalizado exacto y similitud por trigramas, dirección normalizada. Lo dudoso va a `duplicate_candidates`. | Reemplaza el índice en memoria. |
| V2-06 | Cada conector declara `code`, `version`, `defaultPolicy` (`automatic` / `assisted` / `disabled`) y se activa solo si tiene documento de términos aprobado. Un fallo no afecta a otros (cada uno en su propio job). | Tu regla de la sección 2 del pedido. |
| V2-07 | Toda fila externa guarda `source_code`, `source_url`, `fetched_at`, `connector_version`. | Evidencia trazable. |
| V2-08 | Señales de intención son observaciones con `valid_until` y peso decreciente al puntuar (vida media por tipo de señal). | Una oferta laboral vieja pesa menos. |
| V2-09 | Contactos en tabla propia con fuente, fecha, borrado lógico y corrección; solo canales corporativos. | Ley 29733. |
| V2-10 | Preferencia de menú en `users.ui_prefs jsonb`. | Persiste entre sesiones y dispositivos. |

---

## 3. Estado legal de cada fuente

**Cómo leer esta tabla.** "Verificación" dice si leí el texto oficial. **Hoy es "No" para todas**: los hosts no son accesibles desde el entorno de desarrollo (probado el 2026-11-07; resultado de conexión fallida en todos; `github.com` devolvió 403 del proxy). La columna "Afirmado en la solicitud" recoge lo que el pedido indica; **no lo tomo como verificado**. "Decisión provisional" aplica tu regla: sin verificar, nada se automatiza.

Cada fuente tendrá su `docs/sources/<fuente>.md` con la plantilla ya existente en `docs/sources/README.md` (URL, licencia, robots, campos, frecuencia, decisión), **escrito en la fase donde se construye, después de verificar** y con fecha. No creo documentos vacíos ahora para no dar una apariencia de revisión que no existe.

| # | Fuente | Acceso previsto | Verificación | Afirmado en la solicitud | Riesgos a revisar | Decisión provisional |
|---|---|---|---|---|---|---|
| 1 | SUNAT, Padrón reducido del RUC | Descarga oficial | **No** | Descarga oficial con RUC, razón social, estado, condición, ubigeo, domicilio | Condiciones de uso del archivo; incluye **personas naturales** (datos personales: domicilio) → excluidas por defecto; confirmar formato, codificación y tamaño reales | **Asistido**: el archivo lo descargas tú y Radar lo importa. Pasa a automático si verifico los términos |
| 2 | datosabiertos.gob.pe, padrón con CIIU | Descarga oficial | **No** | Cruce por RUC para actividad económica; algunos CSV vienen comprimidos | Licencia del recurso, vigencia de la actualización, nombre exacto del conjunto | Igual que la 1 |
| 3 | OpenStreetMap, Overpass API | API pública | **No** | Negocios con web, teléfono y ubicación; ODbL con atribución | Política de uso de Overpass (frecuencia, tamaño de consulta); ODbL (atribución y condiciones de compartir una base derivada si se distribuye); cobertura parcial | **Automático con límites estrictos** solo tras verificar; mientras tanto, importación de un extracto |
| 4 | Páginas Amarillas Perú | Por definir | **No** | Si prohíben extracción, captura asistida | Términos y `robots.txt` | **Asistido, desactivado por defecto** |
| 5 | CCL, cámara de Arequipa, ASEI, SNI | Por definir | **No** | Preferir importación o captura asistida | Términos de cada directorio; datos de personas | **Asistido / CSV, desactivado por defecto** |
| 6 | Urbania, Nexo Inmobiliario | Por definir | **No** | Identificar inmobiliarias y proyectos activos | Términos de portales (suelen limitar extracción automatizada) | **Asistido, desactivado por defecto** |
| 7 | SEACE / OECE (OCDS) | API y descargas oficiales | **No** | OCDS, licencia CC BY 4.0 | Confirmar licencia, nombre y límites de la API; atribución; datos personales dentro de contratos (guardar solo entidad, convocatoria y montos) | **Automático** solo tras verificar |
| 8a | Get on Board | API pública oficial | **No** | API pública oficial | Términos de la API, límites, uso comercial de los datos | **Automático** solo tras verificar |
| 8b | Computrabajo, Bumeran, Laborum | Revisar términos | **No** | Si prohíben automatizar, captura asistida | Términos y `robots.txt`; nunca datos de candidatos | **Asistido, desactivado por defecto** |
| 9 | Indecopi, búsqueda de marcas | Consulta asistida | **No** | Por empresa, sin consultas masivas | Términos; captchas (no se eluden) | **Asistido**: botón que abre la consulta y el vendedor registra el resultado |
| 10 | Meta Ad Library | Enlace manual | **No** | La API oficial no cubre anuncios comerciales fuera de la UE | Confirmar la limitación; no hacer scraping | **Solo enlace manual** y marcado del resultado por el vendedor. La señal automática es el píxel detectado en la web |
| 11 | PageSpeed Insights API | API oficial con clave | **No** | Gratuita con clave y cuota diaria | Confirmar que no exige facturación, cuota real, términos | **Automático con clave y caché**; la clave la creas tú. Ya existe un cliente (`pagespeed.ts`) |
| 12 | webappanalyzer | Firmas de tecnologías | **No** (GitHub devolvió 403) | Fork abierto de Wappalyzer, GPL-3.0 | **Licencia GPL-3.0** de código y firmas; si Radar solo se usa dentro de APROS no se distribuye, pero si se vende o entrega sí aplicaría. Esto es una pregunta legal, no una conclusión mía | Proceso o módulo aislado, firmas descargadas aparte (no copiadas al repositorio), `docs/LICENSES.md`. Alternativa sin riesgo: un detector propio ya parcialmente hecho (26 señales) ampliado con firmas propias |
| 13 | Revisión propia | Analizador existente | Sí (código propio) | SSL, responsive, formularios, WhatsApp, teléfono, píxel de Meta, GA4, GTM, datos estructurados, robots, sitemap, rastreadores de IA | Falta solo "prueba en ancho móvil" real (hoy se detecta `viewport`) | **Automático** (ya existe, se amplía) |
| 14 | Página de contacto de cada empresa | Rastreo del propio sitio | Sí en lo técnico (robots y límites ya implementados) | Correos corporativos, teléfonos, WhatsApp, formulario, redes | Ley 29733 (ver 3.5) | **Automático** con las reglas de contacto |
| — | Google Places | API de pago | **Sí** (2026-11-07) | — | Los términos prohíben guardar nombres y direcciones | **Descartada** (D-60) |

### 3.5 Reglas de contacto (Ley 29733)

Solo canales corporativos o genéricos (`contacto@`, `ventas@`, formulario, WhatsApp de la empresa). Nada de inferir ni construir correos personales. Cada dato guarda fuente y fecha y se puede corregir o eliminar; la lista de no contactar se aplica a todo. No soy abogado: la lectura de la ley y el aviso de privacidad los debe validar quien corresponda en APROS antes de usar datos reales.

---

## 4. Modelo de datos y migraciones

Numeración continua desde `1730000005000`. Todas aditivas (sin borrar ni reescribir datos existentes), con `grant` mínimo a `radar_app`.

| Migración | Contenido |
|---|---|
| `…5000_ui_prefs` | `users.ui_prefs jsonb NOT NULL DEFAULT '{}'` |
| `…6000_registry` | `CREATE EXTENSION pg_trgm`; `ubigeo (code, department, province, district)`; `ciiu_codes (code, description)`; `ciiu_industry_map (ciiu_prefix, industry_id, priority, active)` editable; `registry_companies (ruc PK, legal_name, normalized_name, estado, condicion, ubigeo, address, ciiu text[], is_legal_entity, source_batch_id, source_version, first_seen_at, last_seen_at, missing_since)`; índices por ubigeo/estado, GIN trigram de `normalized_name`, GIN de `ciiu`; `registry_import_runs (id, source_code, file_sha256, status, rows_read, rows_loaded, rows_skipped, last_line, started_at, finished_at, error)` con checkpoint para reanudar |
| `…7000_candidates_contacts` | `company_candidates` (empresas de OSM y directorios: nombre, web declarada, teléfono, dirección, coordenadas, `source_code`, `source_url`, `fetched_at`, `connector_version`, estado de revisión); `company_contacts (company_id, kind, value, source_url, fetched_at, collected_by, corrected_by, deleted_at)`; `company_web_validations` |
| `…8000_connectors` | `source_providers` + `connector_version`, `default_policy`, `last_run_at`, `last_error`; `source_usage` (consultas por fuente y día) |
| `…9000_intent` | `public_tenders (ocid unique, entity_name, entity_ruc, title, description_excerpt, amount, currency, published_at, deadline_at, status, url, matched_keywords, source_version, fetched_at)`; `tender_keywords`; `job_postings (company_id/ruc/name, title, posted_at, url, source_code)`; `internal_alerts (user/role, kind, ref, created_at, read_at)`; `signal_observations.valid_until` (o equivalente en la definición de señal) |
| `…10000_scoring_v2` | Solo datos: nueva versión de los modelos con las señales de intención, vida media por señal y pesos por rubro (los modelos viejos no se tocan) |

**Espacio en disco del padrón (estimación, sin medir).** No conozco el tamaño real del archivo ni su número de filas; mi supuesto es del orden de decenas de millones de filas en bruto. Con ~550 a 600 bytes por fila entre tabla e índices:

- Cargar **todo** (10 a 20 millones de filas): unos 6 a 12 GB.
- Cargar **solo lo que pasa el filtro** (activo, habido, RUC 20), mucho menos (supuesto de 1 a 2 millones de filas): del orden de 1 GB.
- Los respaldos duplican lo anterior. **Se mide con el archivo real en tu Mac** durante la importación y se reporta antes de decidir el servidor.

---

## 5. Importación del padrón: diseño

1. El archivo (o la descarga oficial, una vez verificada) se lee como flujo; si viene comprimido se detecta por firma del archivo, no por extensión (el pedido avisa que algunos "CSV" vienen comprimidos).
2. Se detecta la codificación y las columnas por cabecera; si no coincide con el formato esperado, se rechaza con un mensaje claro (nunca se adivina).
3. Cada N filas se confirma un lote y se actualiza `last_line`; si el proceso muere, **se reanuda** desde el último lote.
4. Es incremental: se actualiza por RUC; lo que ya no aparece queda con `missing_since`, no se borra.
5. Filtros de importación configurables: estado, condición, tipo de persona (naturales desactivadas por defecto), CIIU asociados a rubros activos, ubigeo.
6. Cruce con CIIU (fuente 2) por RUC: otro job independiente que rellena `ciiu`.
7. Progreso visible en **Fuentes e importaciones**; corre en el worker, la aplicación nunca espera.
8. Para pruebas, un **generador de archivos sintéticos** con el mismo formato (sin datos reales) permite probar un millón o más de filas y medir tiempos y memoria.

---

## 6. Diagnóstico sin IA (costo cero)

Ya existe un proveedor `simulated` basado en reglas que pasa el mismo validador. Se **promueve** a proveedor de producción `rules`:

- Genera el diagnóstico con la misma estructura (1–3 oportunidades, hecho/inferencia/hipótesis, evidencia citada) a partir de las señales y de plantillas por rubro editables.
- Pasa por el mismo validador, el mismo flujo de revisión humana y los mismos PDF/PPTX. La diferencia es que no se llama a ningún modelo.
- `AI_PROVIDER=rules` pasa a ser el valor por defecto; `anthropic` queda opcional con presupuesto; `simulated` se elimina o queda solo para pruebas.
- Los textos dejan de decir "demostración": dicen "generado con plantillas y reglas".
- Límite honesto: será más genérico que el de un modelo. Se mejora con las plantillas por rubro.

---

## 7. Menú nuevo

### 7.1 Estructura (cinco grupos + Configuración)

| Grupo | Pantallas | Estado |
|---|---|---|
| **Inicio** | Resumen del día, tareas pendientes, alertas, leads nuevos priorizados | Existe `/` (se amplía) |
| **Prospectar** | Buscar empresas (nueva); Empresas; Importar CSV; Duplicados; Fuentes e importaciones (nueva); Oportunidades públicas (fase 4); Lista semanal (revisión) | Parcial |
| **Analizar** | Auditorías web (vista nueva sobre los análisis que hoy están dentro de la ficha); Diagnósticos | Parcial |
| **Vender** | Mis leads (hoy **Bandeja**); Embudo; Actividades y visitas | Solo Bandeja existe |
| **Resultados** | Panel de indicadores | No existe |
| **Configuración** (abajo, aparte) | Rubros y CIIU; Scoring (modelos y señales por rubro); Servicios de APROS; Ejecución semanal; IA y presupuesto; Fuentes (activar, términos); Usuarios y roles; No contactar; Clientes activos; Auditoría | Existe casi todo |

**Cómo queda cada pantalla actual:**

| Pantalla actual | Dónde queda |
|---|---|
| Inicio | Inicio |
| Lista semanal | Prospectar |
| Bandeja | Vender → Mis leads |
| Diagnósticos | Analizar |
| Empresas, Importar CSV, Duplicados | Prospectar |
| No contactar, Clientes activos | Configuración (y ver 10.5) |
| Rubros, Señales por rubro | Configuración → Rubros y CIIU / Scoring |
| Modelos de puntaje | Configuración → Scoring |
| Servicios de APROS, Ejecución semanal, IA y presupuesto | Configuración |
| Fuentes | Configuración (activar y términos) + Prospectar → Fuentes e importaciones (operación) |
| Usuarios, Auditoría | Configuración (y ver 10.5) |

**Regla anti-enlaces muertos:** una pantalla que aún no existe (Embudo, Actividades, Panel) **no aparece** en el menú hasta construirse. Hoy Vender y Resultados quedarían vacíos; eso se resuelve con la decisión 10.4.

### 7.2 Comportamiento

- **Menú lateral colapsable:** expandido con ícono y texto; colapsado solo íconos. Botón visible y atajo de teclado `Ctrl/⌘ + B`, desactivado mientras el foco esté en un campo editable.
- **Preferencia por usuario** en `users.ui_prefs`, leída en el servidor para evitar parpadeo; se guarda con una acción de servidor (con la protección CSRF existente).
- **Colapsado:** tooltip con el nombre y panel flotante con subopciones al pasar o hacer clic; se cierra con Esc o al salir.
- **Expandido:** acordeón, un solo grupo abierto a la vez. Grupo y página activos resaltados en ambos modos (`aria-current="page"` y borde, no solo color).
- **Roles:** cada rol ve solo lo que puede usar; un grupo sin entradas permitidas no se muestra. Configuración solo para administradores (con la salvedad 10.5).
- **Móvil:** botón de hamburguesa que abre un panel (diálogo con foco atrapado y Esc).
- **Íconos:** un solo set de SVG en línea con trazo y tamaño uniformes (propongo `lucide-react`, licencia ISC; si prefieres cero dependencias, SVG propios). Cada ícono tiene etiqueta accesible o tooltip.
- **Accesibilidad:** teclado completo, `aria-expanded`, foco visible, lectores de pantalla; se verifica con axe y prueba manual a 1280 y 390 px.
- **Búsqueda global en el encabezado** (atajo `/`): RUC (11 dígitos, exacto), razón social (trigramas) o dominio. Mínimo 3 caracteres, máximo 8 resultados, limitada por tasa, respeta permisos y marca las empresas en no contactar. Un vendedor solo encuentra lo que ya puede ver.

---

## 8. Riesgos

| ID | Riesgo | Mitigación |
|---|---|---|
| R1 | Índice de duplicados en memoria no escala | Rehacer en SQL (V2-05) antes de importar |
| R2 | Importación larga o interrumpida | Checkpoint reanudable, prueba con archivo sintético de ≥1 millón de filas |
| R3 | Formato real del padrón distinto de lo supuesto (columnas, codificación) | Detección por cabecera y rechazo claro; primera importación con tu archivo real supervisada |
| R4 | Datos personales (personas naturales, domicilios; contactos en SEACE) | Naturales excluidas por defecto; guardar solo lo necesario; borrado y corrección; revisión de Ley 29733 por quien corresponda |
| R5 | Términos de fuentes que prohíban la automatización o la reutilización | Regla de la sección 3: sin verificar, asistido; desactivado por defecto |
| R6 | Bloqueos, captchas, límites | Detenerse y registrar; nunca eludir; límites por dominio y caché |
| R7 | Licencias (ODbL de OSM, CC BY de SEACE, GPL-3.0 de webappanalyzer) | Atribución visible, `docs/LICENSES.md`, aislamiento del módulo GPL, consulta legal si habrá distribución |
| R8 | Sobrecontacto por tener una base enorme | Promoción explícita con conteo y tope; vendedores solo ven lo aprobado; lista de no contactar en todas las pantallas |
| R9 | Scoring con señales nuevas sin datos reales para calibrar | Modelo nuevo versionado, marcado "sin calibrar"; calibración en la fase 7 original con casos reales |
| R10 | Cuota gratuita de PageSpeed insuficiente | Caché, tope diario propio, reintento con espera; la clave la creas tú |
| R11 | Costos fuera de la Mac (servidor, disco, respaldos) | Se miden con datos reales y se reportan antes de desplegar |
| R12 | Mi verificación legal no es asesoría jurídica | Cada `docs/sources/*.md` deja una sección "Pendiente de revisión legal" |

---

## 9. Qué modifica este plan respecto del prompt original y las decisiones previas

| Antes | Ahora |
|---|---|
| D-09: sin proveedor de empresas al inicio, solo CSV y alta manual | Se agregan fuentes oficiales y abiertas, cada una tras verificar sus términos |
| D-19: solo datos ficticios hasta que apruebe tu jefe | Pendiente de tu decisión 10.2 para datos públicos oficiales |
| Fase 6 original (trabajo comercial) y 7 (resultados) | Se renombran las fases de v2 como **V2-1 a V2-6** para no chocar; las pantallas de Vender y Resultados se ubican según 10.4 |
| Google Places como fuente recomendada | Descartada (D-60) |
| Diagnóstico con IA como camino principal | Diagnóstico con reglas por defecto; IA opcional |

---

## 10. Decisiones que necesito

1. **Verificación de términos.** Opción A: abres cada página oficial y me pegas el texto de términos y de `robots.txt`. Opción B: me permites leer estos dominios en el entorno (te aparecerá una aprobación): `sunat.gob.pe`, `datosabiertos.gob.pe`, `oece.gob.pe` (y su portal de contrataciones abiertas), `overpass-api.de`, `wiki.openstreetmap.org`, `operations.osmfoundation.org`, `openstreetmap.org`, `getonboard.com`, `paginasamarillas.com.pe`, `ccl.org.pe`, `urbania.pe`, `computrabajo.com.pe`, `bumeran.com.pe`, `laborum.pe`, `developers.google.com`, `github.com` y `raw.githubusercontent.com` (para la licencia de webappanalyzer). Aun con B, las descargas grandes ocurren en tu Mac; yo solo leería políticas.
2. **Datos reales oficiales.** ¿Se permite cargar en tu Mac el padrón de SUNAT y las convocatorias de SEACE (datos públicos oficiales) mientras tu jefe no apruebe el proyecto? Recomiendo sí, solo en tu equipo y sin compartir; hasta que respondas, todo se prueba con archivos sintéticos.
3. **Ramas.** Recomiendo mergear #1 a #6 (en orden) y partir `feat/v2-*` de `main`. Si prefieres no esperar, apilo sobre `feat/fase-5-diagnostico`.
4. **Vender y Resultados.** Recomiendo construir Embudo, Actividades y Panel **después** de V2-4, en una fase propia, y mientras tanto mostrar solo Mis leads. Alternativa: incluirlos en v2 (más largo).
5. **Permisos.** Hoy `sales_lead` gestiona No contactar y lee Auditoría. Recomiendo que mantenga esas dos entradas visibles fuera de Configuración (en Prospectar y Resultados) y que Configuración siga siendo solo de administradores.
6. **Permisos de búsqueda en el padrón.** Propuesta: ver el padrón (`registry.read`) para administrador, líder de ventas y consultor; **promover** a empresas de trabajo (`registry.promote`) para administrador y líder de ventas; el vendedor no ve el padrón.
7. **Clave de PageSpeed** y, si aplica, correo de contacto para el User-Agent de Overpass (lo piden sus políticas): los pones tú en `.env`, nunca en el repositorio.

---

## 11. Orden de implementación

Una rama `feat/v2-<tema>` y un PR en borrador por fase; me detengo al final de cada una para tu revisión con el mismo informe de siempre (qué funciona, cómo probarlo, pruebas reales, decisiones, riesgos, qué necesito).

| Fase | Rama | Contenido | Depende de | Se puede probar sin datos reales |
|---|---|---|---|---|
| **V2-1** | `feat/v2-menu` | Menú, colapsado, móvil, preferencia por usuario, búsqueda global sobre `companies` | — | Sí |
| **V2-2** | `feat/v2-base-oficial` | Dedupe en SQL, padrón, CIIU, ubigeo, tabla CIIU→rubro editable, filtros, importación reanudable, Buscar empresas con promoción, Fuentes e importaciones | V2-1, decisión 2 para datos reales | Sí, con archivo sintético |
| **V2-3** | `feat/v2-enriquecimiento` | OSM, página de contacto, auditoría web ampliada, PageSpeed, módulo de firmas de tecnologías, diagnóstico `rules` | V2-2; términos de OSM; clave de PageSpeed | Parcial (respuestas simuladas) |
| **V2-4** | `feat/v2-senales` | SEACE/OECE con Oportunidades públicas y alertas, Get on Board, Indecopi asistido, enlace de Meta | Términos de cada una | Parcial (fixtures) |
| **V2-5** | `feat/v2-directorios` | Solo directorios y portales cuya revisión legal apruebes: automáticos o asistidos | Tu aprobación por fuente | Parcial |
| **V2-6** | `feat/v2-scoring` | Nuevas señales, vigencia, pesos por rubro, nueva versión de modelos | V2-3 y V2-4 | Sí |

**Criterios de aceptación** (los de tu documento): se verifican uno por uno en el informe de cada fase; los que dependen de datos reales (padrón completo, convocatorias reales de SEACE) quedan marcados como "pendientes de verificar en tu Mac" hasta que corran allí.

**Qué se hace antes de empezar V2-1:** nada de código; solo tus respuestas a la sección 10.
