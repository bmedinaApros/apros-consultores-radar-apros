# Proyecto: Radar APROS (v2)

Actúa como tech lead senior full-stack, especialista en seguridad de aplicaciones y en producto B2B. Vas a diseñar y construir **Radar APROS**, una aplicación web interna de APROS Consultores Digitales (Perú).

Trabaja en español: interfaz, documentación y reportes. El código y sus identificadores van en inglés. Usa `es-PE`, `America/Lima` y soles (PEN), con USD opcional.

> Cambios respecto a v1: el **descubrimiento semanal de empresas** es el propósito central del sistema (no un módulo opcional); se añade la lista semanal, el catálogo de servicios APROS y las reglas para fuentes de datos. La v1 se conserva en `docs/prompt/prompt-v1-original.md`.

## 1. Objetivo de negocio

Radar APROS **encuentra por sí mismo, cada semana, empresas peruanas a las que APROS podría ofrecer sus servicios**. Inspecciona fuentes autorizadas, analiza el sitio público de cada empresa, las prioriza con evidencia, sugiere qué servicio de APROS encaja y entrega una **lista semanal** que un consultor revisa antes de que un vendedor la use. Para las elegidas, prepara un diagnóstico.

- **Problema:** cerca del 75 % del negocio viene de clientes existentes; APROS necesita más clientes nuevos de calidad.
- **Usuarios:** un equipo comercial pequeño (hoy, 3 personas que venden), más consultores y gerencia.
- **Rubros:** multirrubro desde el inicio, sin sector predeterminado. Un administrador crea y edita rubros desde la interfaz, sin cambiar código. Carga como ejemplos editables: inmobiliario, consumo masivo, salud, educación, retail, servicios profesionales e industria. Alcance geográfico inicial: Lima, configurable.
- **Medida de éxito:** reuniones calificadas, cierres, margen proyectado y porcentaje de cuentas con retainer. Medir también la **utilidad de la lista semanal**: porcentaje de empresas de la lista que el equipo considera relevantes. El volumen no es la meta.

Principio rector: priorizar calidad del ingreso y credibilidad frente al prospecto. Un hallazgo falso daña la marca más de lo que ayuda un lead adicional.

Límite que debes respetar y comunicar: ninguna fuente de datos afirma que una empresa necesita APROS. Esa conclusión sale de las señales observables del sitio y del modelo de puntaje del rubro, y es una **sugerencia** que un consultor valida.

## 2. Forma de trabajo

### Antes de escribir código
1. Inspecciona el repositorio y el entorno. No asumas nada que puedas verificar.
2. Mantén `docs/PLAN.md` y `docs/DECISIONS.md`. Haz solo las preguntas que bloqueen de verdad; para lo demás elige la opción conservadora y regístrala.
3. **Espera mi aprobación del plan antes de implementar.**

### Durante la construcción
- Avanza por las fases de la sección 13. Al terminar cada una, ejecuta pruebas, resume lo hecho y **detente para mi revisión**.
- Commits pequeños y descriptivos en una rama de trabajo. Nunca force push ni trabajo directo en `main`.
- No despliegues a producción, no ejecutes migraciones destructivas ni contrates servicios sin mi aprobación expresa.
- No marques algo como terminado sin haberlo probado. Si una prueba falla o algo queda pendiente, dilo.
- No inventes credenciales, endpoints ni contratos del Hub o del CRM. Si faltan, crea una interfaz con un adaptador simulado y márcalo como pendiente.
- Mientras el sistema viva en la Mac del usuario, usa **solo datos ficticios**. Ningún dato real de prospectos hasta que se apruebe el despliegue.

## 3. Contexto y sistemas existentes

- **Apros HUB** (`https://hub.apros.pe`): plataforma interna hecha por el jefe directo. Requiere sesión; no hay documentación. Radar podría alojarse como módulo o integrarse después.
- **CRM:** existe uno para leads calificados, administrado por otra persona. No está decidido dónde se registrará el avance comercial.
- **Digital Growth Advisor:** chat especializado, no una API; Radar no puede invocarlo. Su metodología está en `docs/methodology/`, adaptada a prospectos en `radar-adaptation.md`.
- **Google Workspace:** suite estándar de APROS. Dominio por defecto: `apros.pe`, configurable.
- **Despliegue:** local en la Mac con Docker Compose hasta que el jefe apruebe; después, servidor propio con dominio nuevo.

Requisitos:
- Toda integración externa va detrás de una interfaz (`CommercialSystemAdapter`), con implementación local y simulada.
- Radar funciona de forma independiente aunque el Hub y el CRM no estén disponibles.
- Los prospectos permanecen separados de la cartera de clientes activos.

## 4. Stack

Sin restricciones del Hub. Usa tecnología aburrida y mantenible: TypeScript estricto, Next.js y PostgreSQL con migraciones versionadas; cola persistente sobre PostgreSQL (pg-boss) con tareas programadas; Docker Compose para desarrollo y `Dockerfile` listo para producción. Sin Redis, microservicios ni orquestadores de agentes sin necesidad demostrada.

IA mediante la API de Anthropic con `ANTHROPIC_API_KEY` y modelo configurable. **No uses credenciales de suscripciones Pro/Max ni Claude Code como backend.** Verifica que las versiones estén vigentes y mantenidas antes de fijarlas.

## 5. Funcionalidad

### 5.1 Descubrimiento semanal (núcleo)

Flujo: **fuentes → descubrimiento → normalización y deduplicación → exclusiones → análisis del sitio → puntaje → emparejamiento con servicios → lista semanal → revisión humana → diagnóstico → trabajo comercial.**

- Una tarea programada (por defecto lunes 06:00 `America/Lima`, configurable) y una ejecución manual para administradores.
- Cada etapa es un trabajo idempotente, con reintentos, tiempo máximo, cola de errores y estado visible. Si una fuente falla, las demás siguen y la lista indica su cobertura real.
- **Fuentes** detrás de `CompanySourceProvider`, desactivadas por defecto. Un proveedor solo se activa si existe `docs/sources/<fuente>.md` con la revisión de sus términos (uso, almacenamiento, límites, costo) y mi aprobación. Candidatas a evaluar: padrón de RUC de SUNAT, SEACE/OSCE, SMV/Bolsa de Valores de Lima, Google Places API (de pago, con tope), directorios y cámaras que lo permitan. Siempre disponibles: CSV y alta manual.
- No hagas scraping de Google, LinkedIn ni de directorios cuyos términos lo prohíban. No enriquezcas contactos personales con fuentes dudosas.
- **Novedad:** una empresa ya listada no reaparece salvo que una señal relevante cambie.
- **Presupuesto semanal** de consultas a APIs de pago, páginas analizadas e IA. Al agotarse, pausa, conserva lo hecho e informa "cobertura parcial".
- **Tamaño de la lista:** 30 empresas por defecto, configurable. Si no hay suficientes de calidad, la lista es más corta y lo dice. Define un umbral mínimo de puntaje y de cobertura de datos.
- **Lista inmutable:** cada semana se guarda un snapshot con versión de modelo, señales y fuentes, para explicarla y reproducirla.
- **Calidad visible:** porcentaje analizado, porcentaje "no se pudo verificar", salud y costo por fuente.

### 5.2 Base de empresas
- Importación CSV con vista previa, validación por fila, informe de errores y deshacer por lote. Alta y edición manual.
- Normalización y deduplicación por dominio, razón social y RUC opcional; las coincidencias dudosas se resuelven con revisión humana.
- Cada registro guarda fuente, fecha, rubro, subrubro opcional, ciudad, responsable y estado.
- Si el rubro no viene o es dudoso, queda “por clasificar”. La IA puede sugerirlo, no confirmarlo.
- Lista de **no contactar** por empresa, dominio o correo, aplicada en todo el sistema. Exclusión automática de clientes activos cuando esa lista esté disponible.
- Una empresa sin sitio web conocido queda “sin sitio” y no se analiza; no se interpreta como oportunidad.

### 5.3 Analizador web
Analiza solo páginas públicas, con presupuesto limitado de páginas por dominio. Detecta:
- **SEO técnico:** title, meta description, encabezados, canonical, indexabilidad, sitemap, `robots.txt`, enlaces rotos en la muestra.
- **Datos estructurados:** presencia, tipos y validez básica.
- **GEO:** reglas para rastreadores de IA en `robots.txt`, claridad de la información y datos estructurados útiles.
- **Medición y publicidad:** GA4, GTM, Meta Pixel, Google Ads, Clarity.
- **Conversión:** formularios, WhatsApp, teléfono, CTAs, reserva o cotización, acceso desde móvil.
- **Señales por rubro:** catálogo configurable por rubro. Una señal que no aplica a un rubro no resta puntaje.
- **Rendimiento:** PageSpeed Insights API con clave y resultado guardado.
- **Tecnología y actividad:** CMS o plataforma, TLS, fecha de último contenido, crédito visible de un proveedor.

Cada señal es una observación: `company_id, signal_code, value, confidence, evidence_url, evidence_excerpt, observed_at, analysis_run_id, analyzer_version`.

Reglas de veracidad:
- Señales determinísticas siempre que sea posible. La IA no decide si una etiqueta existe.
- Diferencia **observado** de **inferido**. Un píxel instalado significa “píxel detectado”, no “está invirtiendo en publicidad”.
- Un fallo de lectura, un bloqueo o un desafío antibots produce “no se pudo verificar”, nunca un hallazgo negativo.
- Conserva el historial de observaciones para detectar cambios.

### 5.4 Puntaje y emparejamiento con servicios
- Un modelo general por defecto y modelos por rubro, versionados, con validación de que los pesos sumen 100.
- Cada rubro define ICP, señales de urgencia, criterios de capacidad de pago y potencial de retainer.
- Muestra qué modelo se usó. Los puntajes solo se comparan directamente si usan el mismo modelo; si no, la interfaz lo advierte.
- Pesos iniciales editables: encaje con ICP y vertical 30, señal de urgencia 25, capacidad de pago 25, potencial de retainer 10, acceso al decisor 10. Umbrales: 70 o más pasa a ventas, 50–69 nurturing, menos de 50 se descarta.
- Descalificadores duros y ajuste manual con motivo obligatorio y auditoría.
- Cada puntaje guarda versión del modelo, desglose, motivos y señales usadas; debe poder explicarse y reproducirse.
- Los criterios no observables en la web se capturan manualmente y se etiquetan como tales.
- **Catálogo de servicios APROS** (`service_offers`), editable por un administrador, con reglas que relacionan señales con servicios. El resultado se muestra como **hipótesis de encaje a validar**, nunca como hecho. Usa un catálogo de ejemplo hasta que yo entregue el real.
- Calibración asistida: compara ganadas y perdidas por señal y **sugiere** cambios; solo un administrador los aplica, con muestra mínima configurable y aviso de muestra pequeña.

### 5.5 Diagnóstico asistido por IA
- Una página (PDF) y una presentación (PPTX) para las empresas elegidas de la lista.
- Salida estructurada con esquema validado. Cada afirmación referencia IDs de observaciones. Rechaza o marca afirmaciones sin evidencia y cifras que no provengan de ella.
- Usa la metodología adaptada: cada oportunidad sigue observación → oportunidad → impacto → solución → entregable → modelo comercial → KPI, distinguiendo hecho, inferencia e hipótesis, con lenguaje consultivo (sin “la web está mal”).
- Adapta lenguaje y ejemplos al rubro mediante plantillas configurables; sin plantilla, usa una general sin inventar datos sectoriales.
- No regala la implementación, no promete resultados ni usa cifras de mercado sin fuente.
- Flujo obligatorio: `borrador → en revisión → aprobado | rechazado`, con evidencia junto al texto y registro de autor, cambios y aprobador. El servidor impide exportar o usar como definitivo un diagnóstico sin aprobación. Si cambia la evidencia, queda “desactualizado”.
- Registra modelo, versión de prompt, tokens y costo estimado.

### 5.6 Trabajo comercial
- Bandeja priorizada por vendedor, filtros por rubro, ciudad, puntaje, señal, servicio sugerido y estado; la lista semanal es su punto de entrada.
- Vista 360 de la empresa con datos, señales, historial, puntaje, diagnóstico, contactos, actividades y próxima acción.
- Embudo: `Detectada → Analizada → Priorizada → Diagnóstico aprobado → Contactada → Reunión → Propuesta → Ganada | Perdida | Nurturing | Descartada`.
- Actividades manuales (visita, llamada, correo, LinkedIn, referido), tareas y recordatorios. Motivo obligatorio al perder o descartar; en ganadas, ticket, margen proyectado y retainer.
- Planificación de visitas por zona, exportable, sin proveedor de mapas.
- Borradores de mensajes para copiar y enviar manualmente, con advertencias de cumplimiento. **Radar no envía mensajes.**
- Reanálisis programado de leads activos, con aviso interno si cambia una señal relevante.

### 5.7 Traspaso y panel de resultados
- Traspaso idempotente al sistema comercial, con reintentos y estado visible. Sin contrato, usa exportación CSV y el adaptador simulado.
- Panel por periodo, rubro, señal, fuente y vendedor: conversión y tiempo por etapa; reuniones, propuestas y cierres; ticket, margen y % con retainer; rendimiento por señal y por banda de puntaje; **utilidad de la lista semanal y rendimiento por fuente**; tiempo y costo por diagnóstico y por lead trabajado.
- Línea base manual y CAC cuando existan costos. Cada métrica documenta su fórmula. Sin datos suficientes, “sin datos suficientes”.

### 5.8 Fuera de alcance
No implementes, aunque parezca fácil: envío masivo o automático de correos; automatización de LinkedIn o WhatsApp; scanner público o formulario abierto; respuestas automáticas a prospectos; multiempresa o facturación SaaS; scraping de fuentes cuyos términos lo prohíban.

## 6. Seguridad

Sigue OWASP ASVS (nivel 2 como referencia) y OWASP Top 10, incluidos los riesgos de aplicaciones con LLM. Entrega `docs/SECURITY.md` con el modelo de amenazas y mitigaciones.

- **Autenticación y autorización:** Google Workspace (OIDC) restringido a dominios configurables, sin contraseñas propias. Para desarrollo local, un acceso de desarrollo que solo funciona con `NODE_ENV=development` y que una prueba verifica inaccesible en producción. Roles en servidor: administrador, líder comercial, vendedor, consultor, lectura; permisos por objeto en cada endpoint. Cookies `HttpOnly`, `Secure`, `SameSite`, expiración, revocación y CSRF.
- **SSRF y contenido hostil (crítico):** solo HTTP/HTTPS y puertos autorizados; validar DNS y cada redirección; bloquear rangos privados, loopback, link-local y metadatos de nube en IPv4 e IPv6; conectarse a la IP validada (anti-rebinding); límites de tamaño, tiempo, redirecciones y tipo; no ejecutar contenido; navegador sin interfaz solo si hace falta, aislado y sin red interna; respetar `robots.txt`, User-Agent identificable y límite por dominio. Aplica los mismos controles a todos los proveedores de fuentes.
- **Inyección de prompts:** todo contenido web es dato no confiable; el modelo no recibe herramientas, secretos ni red; valida y sanitiza la salida; bloquea enlaces o dominios no autorizados; incluye pruebas con páginas maliciosas.
- **Aplicación e infraestructura:** validación en servidor, consultas parametrizadas, protección contra inyección de fórmulas en CSV, validación de archivos, encabezados de seguridad con CSP estricta, rate limiting en login, importación, análisis, descubrimiento y generación con IA; secretos solo en entorno o gestor, `.env.example` sin valores reales y escaneo de secretos en CI; auditoría inalterable desde la aplicación; logs estructurados sin datos personales; respaldos cifrados con prueba de restauración; auditoría de dependencias y CI que falle ante vulnerabilidades altas o críticas.

## 7. Datos y cumplimiento en Perú

Implementa controles técnicos y prepara `docs/COMPLIANCE.md` para revisión legal. No afirmes que el sistema cumple la ley.
- **Ley 29733 y reglamento:** minimiza datos personales, registra fuente y finalidad, define retención y permite consultar, corregir, exportar y eliminar datos de una persona. Prioriza datos corporativos publicados por la propia empresa. El descubrimiento trabaja con empresas, no con personas.
- **Ley 28493 y reglamento:** si un vendedor prepara un correo comercial no solicitado, muestra los requisitos (“PUBLICIDAD” al inicio del asunto, identificación del remitente con domicilio y correo, mecanismo de baja y su atención en el plazo legal), configurables por asesoría legal.
- **Código de Protección al Consumidor:** señala para revisión legal si se requiere consentimiento previo.
- Bloquea el uso comercial de contactos en la lista de no contactar.
- Documenta qué datos van al proveedor de IA y evita enviar datos personales si no son necesarios.
- Documenta por fuente qué datos se almacenan y por cuánto tiempo, según sus términos.

## 8. Viabilidad y costos
- Límites configurables de presupuesto diario, semanal y mensual para IA y APIs; al llegar al límite, el sistema se pausa con aviso claro y conserva el trabajo.
- Ejecuta primero las señales gratuitas y usa IA solo donde aporta criterio. Caché por URL, versión y vigencia.
- Muestra costo acumulado, por lista semanal y por diagnóstico.
- Si falla un proveedor, el resto sigue funcionando. Feature flags para proveedores y módulos no listos.
- Dimensiona para un equipo pequeño y miles de empresas; previene N+1 e indexa las consultas principales.
- `docs/COSTS.md` con supuestos explícitos: costos fijos, por lista semanal, por diagnóstico y horas de mantenimiento.

## 9. Diseño e identidad APROS

Usa `docs/brand/design.md` y `docs/brand/manual-de-marca.pdf` como fuentes de verdad. La interfaz debe parecer un producto propio de APROS, sobria y profesional.

- **Paleta:** Navy `#070926`, Índigo `#232391`, Azul `#0054FC`, Cian `#00CEFF`, Teal/Mint `#15F2C6`, Blanco. El manual lista el azul con un HEX incorrecto; usa `#0054FC`. Los neutros y colores semánticos de `design.md` son derivados, no oficiales.
- **Tipografía:** Questrial para títulos y Roboto para cuerpo y datos (Roboto pendiente de validar con Diseño). Alójalas localmente verificando licencia.
- **Marca:** usa los logotipos de `assets/brand/` sin alterarlos ni recomponer el wordmark. Falta el isotipo solo: déjalo pendiente.
- Cian y teal nunca como texto sobre blanco; el gradiente ocupa 10 % o menos de la superficie; los estados no dependen solo del color.
- Tokens en un solo lugar y componentes reutilizables; modo claro primero, oscuro solo si no retrasa lo esencial.
- Prioriza tablas densas, lectura rápida de la lista semanal y estados vacíos, de carga y de error. Cada puntaje muestra “por qué”. Responsive para consultar una ficha desde el móvil.
- WCAG 2.2 AA, teclado, foco visible y etiquetas correctas.
- El PDF y el PPTX usan la misma marca y se revisan visualmente. Valida pantallas en navegador a anchos móvil y escritorio.

## 10. Calidad y pruebas
- Unitarias de puntaje, normalización, deduplicación, extracción de señales y emparejamiento de servicios, con fixtures HTML locales.
- Integración de permisos, importación, descubrimiento semanal (con proveedores simulados), novedad, lista inmutable, aprobación, traspaso y trabajos.
- Seguridad: SSRF y redirecciones, inyección de prompts, CSV, autorización por objeto, CSRF y acceso de desarrollo inaccesible en producción.
- E2E: descubrir → analizar → puntuar → lista semanal → generar → aprobar → exportar → registrar resultado.
- Las pruebas no dependen de sitios reales ni de claves; los proveedores externos se simulan.
- Lint, tipos, pruebas y auditoría de dependencias corren en CI. Datos ficticios de demo claramente marcados.

## 11. Observabilidad y operación
Registro estructurado con identificador de correlación, endpoint de salud, métricas de trabajos, errores y costos. `docs/RUNBOOK.md` (instalación, variables, migraciones, respaldo y restauración, rotación de secretos, incidentes, reversión, activación de una fuente) y `README.md` para que otro desarrollador levante el proyecto en Mac con Docker.

## 12. Criterios de aceptación
1. Un usuario autorizado importa un CSV y resuelve duplicados.
2. La ejecución semanal, con proveedores simulados, produce una lista de hasta N empresas, con puntaje, motivos, servicios sugeridos y cobertura, y la guarda como snapshot inmutable.
3. Una empresa ya listada no reaparece salvo que una señal relevante cambie.
4. Una fuente sin documento de términos aprobado no puede activarse.
5. Un análisis produce señales con evidencia; los fallos aparecen como “no verificado”.
6. El puntaje muestra desglose, motivos y versión del modelo. Un administrador crea un rubro nuevo con señales, modelo y plantilla sin tocar código, y el recorrido funciona con al menos tres rubros.
7. Una afirmación del diagnóstico sin evidencia es bloqueada o marcada; ningún diagnóstico se exporta como final sin aprobación, ni llamando directamente a la API.
8. Un vendedor no accede a datos o acciones que su rol no permite.
9. Las pruebas de SSRF e inyección de prompts pasan, incluidas las de los proveedores de fuentes.
10. Una empresa en no contactar queda bloqueada para uso comercial.
11. El presupuesto, al agotarse, pausa la ejecución sin perder trabajo y la lista indica cobertura parcial.
12. El panel coincide con los datos de prueba y documenta sus fórmulas.
13. El traspaso repetido no genera duplicados.
14. La interfaz y los exportables respetan la marca APROS y pasan una revisión de accesibilidad.
15. CI en verde y restauración de un respaldo probada.
16. Ninguna función de la sección 5.8 existe en el sistema.

## 13. Fases
1. **Fundaciones:** plan aprobado, proyecto, Docker Compose, autenticación, roles, auditoría, sistema de diseño y CI.
2. **Empresas y descubrimiento:** `CompanySourceProvider`, CSV y alta manual, proveedores gratuitos aprobados, normalización, deduplicación, no contactar, rubros editables.
3. **Analizador:** fetcher seguro, extractores, señales por rubro, PageSpeed, historial.
4. **Puntaje y lista semanal:** modelos por rubro, explicación, catálogo de servicios, pipeline semanal con presupuesto, lista inmutable, pantalla de revisión y bandeja. **Primer valor usable.**
5. **Diagnóstico:** generación, evidencia, aprobación y exportación a PDF y PPTX. Debe permitir un piloto real de 30 diagnósticos con los rubros que el equipo elija.
6. **Trabajo comercial:** embudo, actividades, tareas, visitas y reanálisis.
7. **Resultados e integración:** panel, calibración asistida, adaptadores y traspaso.
8. **Endurecimiento:** seguridad, rendimiento, accesibilidad, costos, documentación y demo.

Al terminar cada fase, entrega: qué quedó funcionando y cómo probarlo; resultado real de las pruebas; decisiones tomadas; riesgos y pendientes; lo que necesitas de mí para continuar.

**Empieza por la inspección del entorno y la actualización de `docs/PLAN.md`. No implementes hasta que yo apruebe el plan.**
