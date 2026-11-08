# Plan v2: fuentes gratuitas, base amplia y nuevo menú

Estado: **v2.1 revisada con tus respuestas del 2026-11-07. Pendiente de tu aprobación; no se implementa nada hasta entonces.**
Fecha: 2026-11-07. Base: `main`, que ya integra las fases 1 a 5 (PR #1 a #6 mergeados, CI en verde).

Se mantiene todo lo definido en el prompt original (seguridad, revisión humana, evidencia trazable, multirrubro, marca APROS, datos ficticios hasta la aprobación de tu jefe) salvo lo que este plan modifica. Las modificaciones están en la sección 9.

---

## 0. Tus respuestas y lo que cambia

| # | Tu respuesta | Efecto en el plan |
|---|---|---|
| 1 | Puedo leer la lista corta de dominios | Hecho el 2026-11-07: ver `docs/sources/verificacion-2026-11-07.md` y la sección 3 |
| 2 | Sí se cargan datos reales | Se levanta D-19 para datos públicos oficiales en tu Mac. Sigue sin haber datos personales de contacto de personas naturales |
| 3 | Mergear #1 a #6 y partir de `main` | Hecho: los seis PR están en `main` y su CI está en verde. Las fases v2 parten de `main` |
| 4 | Sin embudo ni proceso de ventas: la herramienta es solo para obtener información | Se eliminan Vender y Resultados (Embudo, Actividades, Panel). Las antiguas fases 6 (trabajo comercial) y 7 (resultados) quedan **canceladas** |
| 5 | Acceso con usuario y contraseña, sin depender de Google | Nuevo componente de **acceso con clave** (sección 7.3). Reemplaza la decisión D-04 |
| 6 | Todos pueden ver y promover empresas | Los permisos del padrón se abren a todos los roles con acceso (ver 10.5) |
| 7 | No hace falta conectar PageSpeed ahora | Se usa sin clave con un tope diario bajo; la clave queda opcional |

**Lo que no pude verificar** (sección 3): SEACE/OECE (respondió 403), Computrabajo, Get on Board, CCL, `overpass-api.de` y los términos de todos los directorios y portales. Tampoco encontré en datosabiertos el conjunto «RUC con CIIU» que menciona el pedido. Eso está resuelto como preguntas en la sección 10.

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

**Qué no existe todavía** (el menú nuevo lo nombra): Buscar empresas, Fuentes e importaciones, Oportunidades públicas y la vista de Auditorías web. El embudo, las actividades y el panel de indicadores **no se construirán**: la herramienta es solo para obtener información.

---

## 2. Arquitectura

### 2.1 Flujo de datos

```
Padrón SUNAT (+CIIU, ubigeo) ──► registry_companies  (millones; solo lectura para el equipo)
OSM / directorios / CSV ───────► company_candidates   (empresas con web o canal, aún sin RUC confirmado)
                                          │  filtros: estado, tipo, CIIU→rubro, zona
                                          ▼
                       «Buscar empresas»: vista previa con conteo, tope por acción
                                          │  promover (revisión humana de dudosos)
                                          ▼
                companies (conjunto de trabajo) ──► análisis web ──► scoring ──► lista semanal ──► revisión humana ──► información lista para quien la consulte
```

Regla de producto: **estar en el padrón no hace a una empresa una candidata.** Promover muestra siempre el conteo antes de ejecutar y tiene tope por acción; todos los roles con acceso pueden ver y promover (respuesta 6). La lista semanal conserva su revisión humana; si se mantiene o no la restricción D-50 está en 10.5.

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

**Cómo leer esta tabla.** Verificación del 2026-11-07, hecha por mí desde el entorno de desarrollo, con User-Agent identificable y sin eludir bloqueos. **No es una revisión legal.** Se leyeron políticas y `robots.txt`; **no se descargó ningún dato**. Cada fuente verificada tiene su `docs/sources/<fuente>.md`; el detalle de lo leído y lo no leído está en `docs/sources/verificacion-2026-11-07.md`.

| # | Fuente | Qué verifiqué | Qué falta | Decisión |
|---|---|---|---|---|
| 1 | SUNAT, padrón reducido | Página oficial de descarga con dos archivos y fecha de actualización (07/11/2026); `robots.txt` 404 | Términos de uso (la página no los trae); columnas y tamaño del archivo (no descargado) | **Asistido**: tú descargas, Radar importa |
| 2 | datosabiertos.gob.pe | `robots.txt` (`Crawl-delay: 10`), licencia por conjunto (ejemplo: ODC Attribution) | **No encontré un conjunto «RUC + CIIU»**; no sé si algún padrón de SUNAT trae CIIU | **Sin construir** hasta resolver 10.1 |
| 3 | OpenStreetMap, Overpass | ODbL con atribución; política de uso: ~100 consultas y ~10 MB al día en uso regular | API no probada (host sin respuesta); correo de contacto para el User-Agent | **Automático con límites**, desactivado hasta probar en tu Mac |
| 4 | Páginas Amarillas Perú | `robots.txt`: solo `Disallow: /trafico/*` | Términos de uso | **Asistido**, desactivado |
| 5 | CCL, Arequipa, ASEI, SNI | Nada (CCL sin respuesta; los demás fuera de lista) | Todo | **Asistido / CSV**, desactivado |
| 6 | Urbania, Nexo | Urbania: `robots.txt` bloquea rastreadores genéricos y rutas de API; portada respondió 403 al acceso automatizado | Términos | **Asistido**, desactivado |
| 7 | SEACE / OECE | Nada: `contratacionesabiertas.oece.gob.pe` respondió 403, `www.oece.gob.pe` sin respuesta | Todo, incluida la licencia CC BY 4.0 que menciona el pedido | **No automatizar todavía**; importación de archivo descargado por ti |
| 8a | Get on Board | Nada (sin respuesta) | Todo | **Asistido** hasta leer su API y términos |
| 8b | Computrabajo, Bumeran, Laborum | Bumeran y Laborum: `robots.txt` (bloquean rutas concretas, no todo el sitio); Computrabajo sin respuesta | Términos de los tres | **Asistido**, desactivado |
| 9 | Indecopi | No leído | Todo | **Asistido** por empresa |
| 10 | Meta Ad Library | No leído | Confirmar la limitación de la API | **Solo enlace manual** |
| 11 | PageSpeed Insights | Se puede usar con o sin clave; la clave se recomienda para uso automatizado | Cuota diaria exacta | **Automático**, sin clave, con tope propio bajo |
| 12 | webappanalyzer | `LICENSE` = GNU GPL v3 (confirmado); proyecto continuación de Wappalyzer | Licencia específica de las firmas; tu decisión (10.6) | **Pendiente de elección**: aislar el módulo o ampliar el detector propio |
| 13 | Revisión propia | Código propio (existe) | «Prueba en ancho móvil» real | **Automático** |
| 14 | Página de contacto de cada empresa | Código propio (robots y límites ya implementados) | Revisión de Ley 29733 por quien corresponda | **Automático** con reglas de contacto |
| — | Google Places | Términos leídos | — | **Descartada** (D-60) |

### 3.5 Reglas de contacto (Ley 29733)

Solo canales corporativos o genéricos (`contacto@`, `ventas@`, formulario, WhatsApp de la empresa). Nada de inferir ni construir correos personales. Cada dato guarda fuente y fecha y se puede corregir o eliminar; la lista de no contactar se aplica a todo. No soy abogado: la lectura de la ley y el aviso de privacidad los debe validar quien corresponda en APROS antes de usar datos reales.

---

## 4. Modelo de datos y migraciones

Numeración continua desde `1730000005000`. Todas aditivas (sin borrar ni reescribir datos existentes), con `grant` mínimo a `radar_app`.

| Migración | Contenido |
|---|---|
| `…5000_ui_prefs` | `users.ui_prefs jsonb NOT NULL DEFAULT '{}'` |
| `…5500_password_auth` | `users.password_hash`, `password_set_at`, `must_change_password`, `failed_attempts`, `locked_until` (ver 7.3) |
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

## 7. Menú nuevo y acceso

### 7.1 Estructura (tres grupos + Configuración)

Sin proceso de ventas (respuesta 4), el menú queda más corto que en la v2.

| Grupo | Pantallas | Estado |
|---|---|---|
| **Inicio** | Resumen: actividad reciente, importaciones en curso, alertas (por ejemplo, nuevas convocatorias públicas) y empresas nuevas priorizadas | Existe `/` (se amplía) |
| **Prospectar** | Buscar empresas (padrón y base); Empresas; Lista semanal; Bandeja de revisión; Importar CSV; Duplicados; Fuentes e importaciones; Oportunidades públicas (V2-4) | Parcial |
| **Analizar** | Auditorías web (vista nueva sobre los análisis que hoy están dentro de la ficha); Diagnósticos | Parcial |
| **Configuración** (abajo, aparte) | Rubros y CIIU; Scoring (modelos y señales); Servicios de APROS; Ejecución semanal; IA y presupuesto; Fuentes (activar, términos); Usuarios y accesos; No contactar; Clientes activos; Auditoría | Existe casi todo |

Vender y Resultados **no se construyen**. Se retira también cualquier referencia a embudo en pantallas y textos.

| Pantalla actual | Dónde queda |
|---|---|
| Inicio | Inicio |
| Lista semanal, Bandeja | Prospectar |
| Diagnósticos | Analizar |
| Empresas, Importar CSV, Duplicados | Prospectar |
| Rubros, Señales por rubro, Modelos de puntaje | Configuración (Rubros y CIIU, Scoring) |
| Servicios de APROS, Ejecución semanal, IA y presupuesto | Configuración |
| Fuentes | Configuración (activar y términos) y Prospectar (operación de importaciones) |
| No contactar, Clientes activos, Usuarios, Auditoría | Configuración |

Una pantalla que no existe no aparece en el menú.

### 7.2 Comportamiento (sin cambios respecto a la v2)

Colapsable con botón y atajo `Ctrl/⌘ + B` (no activo al escribir en un campo); preferencia por usuario en `users.ui_prefs`, leída en el servidor; tooltip y panel flotante con subopciones al colapsar; acordeón de un solo grupo abierto; grupo y página activos resaltados con `aria-current` y borde (no solo color); móvil con hamburguesa y panel con foco atrapado; un solo set de íconos SVG consistente (propongo `lucide-react`, licencia ISC); teclado completo, `aria-expanded`, foco visible, verificación con axe a 1280 y 390 px. Cada rol ve solo lo que puede usar; **Configuración** se muestra a quien tenga permisos de administración.

**Búsqueda global** en el encabezado (atajo `/`): RUC (11 dígitos, exacto), razón social (trigramas) o dominio; mínimo 3 caracteres, máximo 8 resultados, limitada por tasa; marca las empresas en no contactar.

### 7.3 Acceso con usuario y contraseña (reemplaza D-04)

Hoy el único acceso real es Google (más un acceso de desarrollo que solo existe en tu Mac). Se agrega acceso con clave propia:

- **Contraseñas:** se guardan con `scrypt` (incluido en Node, sin dependencias nuevas), sal única por usuario y parámetros guardados junto al hash; comparación en tiempo constante. Nunca se registran ni se muestran.
- **Política:** mínimo 12 caracteres, no igual al correo ni en una lista corta de claves comunes; sin rotación forzada.
- **Altas:** el administrador crea el usuario con una clave temporal que se muestra una sola vez y que obliga a cambiarla al primer ingreso; también puede restablecerla o desactivar la cuenta. No existen claves por defecto. El primer administrador se crea con un comando local (`npm run user:create`) que pide la clave por consola.
- **Defensa contra adivinación:** límite por IP (el limitador existente), bloqueo temporal de la cuenta tras 5 intentos fallidos (15 minutos), mensajes de error iguales para usuario inexistente y clave incorrecta, y trabajo de hash simulado para usuarios inexistentes (evita distinguirlos por tiempo).
- **Sesiones:** las actuales (token en base de datos con hash, cookie `__Host-` en producción). Al cambiar la clave se cierran las demás sesiones del usuario.
- **Auditoría:** cada ingreso, fallo, cambio y restablecimiento de clave queda en el registro con hash encadenado (sin la clave).
- **Google:** el código existente queda disponible pero **desactivado por defecto** y opcional.
- **Lo que no cubre:** sin segundo factor. Si Radar se publica en internet, recomiendo agregar TOTP después; con la herramienta solo en red interna el riesgo es menor. Y exige HTTPS en el servidor.
- **Migración:** `users` gana `password_hash`, `password_set_at`, `must_change_password`, `failed_attempts`, `locked_until`.
- **Pruebas:** hash y verificación, política, bloqueo, sin enumeración de usuarios, cierre de sesiones al cambiar clave, permisos del administrador, CSRF.

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
| R8 | Sobrecontacto por tener una base enorme | Promoción explícita con conteo y tope; revisión humana de la lista semanal; lista de no contactar en todas las pantallas |
| R9 | Scoring con señales nuevas sin datos reales para calibrar | Modelo nuevo versionado, marcado "sin calibrar"; calibración en la fase 7 original con casos reales |
| R10 | Cuota gratuita de PageSpeed insuficiente | Caché, tope diario propio, reintento con espera; la clave la creas tú |
| R11 | Costos fuera de la Mac (servidor, disco, respaldos) | Se miden con datos reales y se reportan antes de desplegar |
| R12 | Mi verificación legal no es asesoría jurídica | Cada `docs/sources/*.md` deja una sección "Pendiente de revisión legal" |
| R13 | El acceso con clave propia amplía la superficie de ataque (fuerza bruta, relleno de credenciales) | Bloqueo por cuenta e IP, política de claves, auditoría, HTTPS obligatorio; TOTP recomendado antes de publicar en internet |
| R14 | Varias fuentes oficiales bloquean o no responden al acceso automatizado | No se elude; importación de archivo descargado por ti |

---

## 9. Qué modifica este plan respecto del prompt original y las decisiones previas

| Antes | Ahora |
|---|---|
| D-04: acceso solo con Google Workspace, sin contraseñas propias | Acceso con clave propia (7.3); Google opcional y desactivado |
| D-09: sin proveedor de empresas, solo CSV y alta manual | Fuentes oficiales y abiertas, cada una tras verificar sus términos |
| D-19: solo datos ficticios hasta que apruebe tu jefe | Datos reales oficiales permitidos en tu Mac (respuesta 2) |
| D-50: el vendedor solo ve lo aprobado | Pendiente de 10.5 |
| Fases 6 (trabajo comercial) y 7 (resultados, integración, calibración) | **Canceladas** (respuesta 4). La calibración del scoring queda para cuando haya datos reales |
| Google Places como fuente | Descartada (D-60) |
| Diagnóstico con IA por defecto | Diagnóstico con reglas por defecto; IA opcional |

## 10. Lo que sigue pendiente

1. **CIIU.** En datosabiertos no encontré un conjunto «RUC con CIIU». ¿Tienes el enlace? Si no existe, el rubro se asigna con reglas por palabras de la razón social y la web, con confirmación humana, y la tabla CIIU→rubro queda para cuando haya una fuente.
2. **Columnas del padrón reducido.** El archivo está en `www2.sunat.gob.pe`, que no tengo habilitado. Puedes (a) permitirme ese host para leer solo los primeros kilobytes y confirmar las columnas, o (b) correr en tu Mac un comando que te daré para ver la cabecera y pegarme el resultado.
3. **Fuentes sin respuesta** (Computrabajo, Get on Board, CCL, SEACE/OECE, Overpass, dominio de términos de Páginas Amarillas, `laborum.pe` sin `www`): varias están habilitadas pero no respondieron desde el entorno, y SEACE respondió 403 (no se elude). O pegas tú los textos de términos desde el navegador, o las dejamos en modo asistido.
4. **Correo de contacto** para el User-Agent de Overpass (en `.env` de tu Mac). No hace falta hasta activar OSM.
5. **Permisos.** Propuesta: todos los roles con acceso ven y promueven empresas; `read_only` conserva solo lectura. Y la regla D-50 («el vendedor solo ve lo aprobado de la lista semanal»): ¿se mantiene o se retira, ya que ahora todos ven el padrón?
6. **webappanalyzer.** ¿Aislamos el módulo GPL-3.0 (con `docs/LICENSES.md`) o ampliamos el detector propio? Recomiendo el detector propio: sin duda de licencia y sin dependencia.
7. **Aprobación de esta v2.1** (incluye el acceso con clave y la cancelación de Vender/Resultados) para empezar **V2-1**.

## 11. Orden de implementación

Una rama `feat/v2-<tema>` desde `main` y un PR en borrador por fase. Al final de cada fase me detengo con el informe de siempre.

| Fase | Rama | Contenido | Depende de | Probable sin datos reales |
|---|---|---|---|---|
| **V2-1** | `feat/v2-menu-acceso` | Menú nuevo, colapsado, móvil, preferencia por usuario, búsqueda global sobre `companies`, **acceso con usuario y contraseña** | Aprobación | Sí |
| **V2-2** | `feat/v2-base-oficial` | Dedupe en SQL, padrón, importación reanudable y filtros, rubro por reglas (o CIIU si 10.1 lo resuelve), Buscar empresas con promoción, Fuentes e importaciones | V2-1, 10.2 | Sí, con archivo sintético; el archivo real en tu Mac |
| **V2-3** | `feat/v2-enriquecimiento` | OSM, página de contacto, auditoría web ampliada, PageSpeed, detector de tecnologías (según 10.6), diagnóstico `rules` | V2-2; 10.4 | Parcial |
| **V2-4** | `feat/v2-senales` | Oportunidades públicas (SEACE/OECE, según 10.3), Get on Board, Indecopi asistido, enlace de Meta | Términos de cada una | Parcial |
| **V2-5** | `feat/v2-directorios` | Solo directorios y portales cuya revisión apruebes: asistidos o automáticos | Tu aprobación por fuente | Parcial |
| **V2-6** | `feat/v2-scoring` | Nuevas señales, vigencia, pesos por rubro, nueva versión de modelos | V2-3 y V2-4 | Sí |

Los criterios de aceptación de tu documento se verifican en el informe de cada fase; los que dependen de datos reales (padrón completo, convocatorias reales de SEACE) quedan marcados como pendientes de verificar en tu Mac.
