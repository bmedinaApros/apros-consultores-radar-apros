# Proyecto: Radar APROS

Actúa como tech lead senior full-stack, especialista en seguridad de aplicaciones y en producto B2B. Vas a diseñar y construir **Radar APROS**, una aplicación web interna de APROS Consultores Digitales (Perú).

Trabaja en español: interfaz, documentación y reportes. El código y sus identificadores van en inglés. Usa `es-PE`, `America/Lima` y soles (PEN), con USD opcional.

## 1. Objetivo de negocio

Radar APROS detecta empresas con una oportunidad comercial real, las prioriza con evidencia y prepara un diagnóstico que un consultor revisa antes de que un vendedor lo use.

- **Problema:** cerca del 75 % del negocio viene de clientes existentes; APROS necesita más clientes nuevos de calidad.
- **Usuarios:** un equipo comercial pequeño (hoy, 3 personas que venden), más consultores y gerencia.
- **Rubros:** el sistema es multirrubro desde el inicio, sin un sector predeterminado ni lógica exclusiva de uno. Un administrador crea y edita rubros desde la interfaz, sin cambiar código. Carga como ejemplos editables: inmobiliario, consumo masivo, salud, educación, retail, servicios profesionales e industria.
- **Medida de éxito:** reuniones calificadas, cierres, margen proyectado y porcentaje de cuentas con retainer. El volumen de leads no es la meta.

Principio rector: priorizar calidad del ingreso y credibilidad frente al prospecto. Un hallazgo falso daña la marca más de lo que ayuda un lead adicional.

## 2. Forma de trabajo

### Antes de escribir código

1. Inspecciona el repositorio y el entorno. No asumas nada que puedas verificar.
2. Entrega `docs/PLAN.md` con: arquitectura, modelo de datos, modelo de amenazas, supuestos, riesgos, costos operativos estimados y fases.
3. Haz solo las preguntas que bloqueen de verdad. Para lo demás, elige la opción conservadora y regístrala en `docs/DECISIONS.md`.
4. **Espera mi aprobación del plan antes de implementar.**

### Durante la construcción

- Avanza por las fases de la sección 13. Al terminar cada una, ejecuta pruebas, resume lo hecho y **detente para mi revisión**.
- Haz commits pequeños y descriptivos, en una rama de trabajo. Nunca hagas force push ni trabajes directo en `main`.
- No despliegues a producción, no ejecutes migraciones destructivas ni contrates servicios sin mi aprobación expresa.
- No marques algo como terminado sin haberlo probado. Si una prueba falla o algo queda pendiente, dilo con claridad.
- No inventes credenciales, endpoints ni contratos del Hub o del CRM. Si faltan, crea una interfaz con un adaptador simulado y márcalo como pendiente.

## 3. Contexto y sistemas existentes

- **Apros HUB** (`https://hub.apros.pe`): plataforma interna hecha por el jefe directo. Requiere sesión, no tengo su documentación a la mano y `/empresas` muestra la cartera activa. Radar podría alojarse como módulo o integrarse después.
- **CRM:** existe un CRM para leads calificados, administrado por otra persona. No está decidido si el avance comercial se registrará en el Hub o en el CRM.
- **Digital Growth Advisor:** es un chat especializado, no una API. Radar **no puede invocarlo**. Sus criterios se incorporan como metodología versionada en `docs/methodology/`. Si ese material no está, usa un archivo de ejemplo y avísame.
- **Google Workspace:** es la suite estándar de APROS.

Requisitos que derivan de esto:

- Toda integración externa va detrás de una interfaz (`CommercialSystemAdapter`), con implementación local y simulada. El sistema de registro comercial se elige por configuración.
- Radar debe funcionar de forma independiente aunque el Hub y el CRM no estén disponibles.
- Los prospectos permanecen separados de la cartera de clientes activos.

## 4. Stack

Si el repositorio o el Hub ya definen un stack, síguelo y justifícalo. Si no, usa tecnología aburrida y mantenible:

- TypeScript en modo estricto, Next.js y PostgreSQL con migraciones versionadas.
- Trabajos en segundo plano con una cola persistente sobre PostgreSQL (por ejemplo, pg-boss). No agregues Redis, microservicios ni orquestadores de agentes sin una necesidad demostrada.
- Docker Compose para desarrollo y un `Dockerfile` listo para producción.
- IA mediante la API de Anthropic, con `ANTHROPIC_API_KEY` y modelo configurable por variable de entorno. **No uses credenciales de suscripciones Pro/Max ni Claude Code como backend.**

Verifica que las versiones estén vigentes y mantenidas antes de fijarlas.

## 5. Funcionalidad

### 5.1 Base de empresas

- Importación CSV con vista previa, validación por fila, informe de errores y deshacer por lote.
- Alta y edición manual. Conector opcional de fuentes autorizadas detrás de una interfaz (`CompanySourceProvider`).
- Antes de implementar un proveedor, revisa sus términos, especialmente límites de almacenamiento y uso. Documenta el resultado. No hagas scraping de Google, LinkedIn ni directorios cuyos términos lo prohíban.
- Normalización y deduplicación por dominio, razón social y RUC opcional. Las posibles coincidencias se resuelven con revisión humana.
- Cada registro guarda fuente, fecha, rubro, subrubro opcional, ciudad, responsable y estado.
- Si el rubro no viene en la importación o es dudoso, el registro queda “por clasificar” para revisión humana. La IA puede sugerirlo, pero no confirmarlo.
- Lista de **no contactar** por empresa, dominio o correo, aplicada en todo el sistema. Exclusión automática de clientes activos cuando esa lista esté disponible.

### 5.2 Analizador web

Analiza solo páginas públicas, con un presupuesto limitado de páginas por dominio. Detecta:

- **SEO técnico:** title, meta description, encabezados, canonical, indexabilidad, sitemap, `robots.txt` y enlaces rotos en la muestra.
- **Datos estructurados:** presencia, tipos y validez básica.
- **GEO:** reglas para rastreadores de IA en `robots.txt`, claridad de la información y datos estructurados útiles.
- **Medición y publicidad:** GA4, GTM, Meta Pixel, Google Ads y Clarity.
- **Conversión:** formularios, WhatsApp, teléfono, llamadas a la acción, reserva o cotización, y acceso desde móvil.
- **Señales por rubro:** además de las señales comunes, cada rubro puede activar señales propias desde un catálogo configurable (por ejemplo, cotización en inmobiliario, citas en salud o admisión en educación). Una señal que no aplica a un rubro no resta puntaje.
- **Rendimiento:** PageSpeed Insights API con clave y resultado guardado.
- **Tecnología y actividad:** CMS o plataforma, certificado TLS, fecha de último contenido cuando exista y crédito visible de un proveedor.

Cada señal se guarda como una observación:

`company_id, signal_code, value, confidence, evidence_url, evidence_excerpt, observed_at, analysis_run_id, analyzer_version`

Reglas de veracidad:

- Las señales son determinísticas siempre que sea posible. La IA no decide si una etiqueta existe.
- Diferencia entre **observado** e **inferido**. Un píxel instalado significa “píxel detectado”, no “está invirtiendo en publicidad”.
- Un fallo de lectura, un bloqueo o una página con desafío antibots produce “no se pudo verificar”, nunca un hallazgo negativo.
- Conserva el historial de observaciones para detectar cambios en el tiempo.

### 5.3 Ficha de señales y scoring

- Un modelo general se aplica por defecto, y cada rubro puede tener su propio modelo, versionado, con validación de que los pesos sumen 100.
- Cada rubro define su ICP, sus señales de urgencia, sus criterios de capacidad de pago y su potencial de retainer.
- Muestra qué modelo se usó. Los puntajes de distintos rubros solo se comparan directamente si usan el mismo modelo; si no, la interfaz lo advierte.
- Pesos iniciales, editables:
  - Encaje con ICP y vertical: 30
  - Señal de urgencia: 25
  - Capacidad de pago: 25
  - Potencial de retainer: 10
  - Acceso al decisor: 10
- Umbrales iniciales: 70 o más pasa a ventas, de 50 a 69 entra a nurturing, menos de 50 se descarta.
- Permite descalificadores duros y ajuste manual con motivo obligatorio y registro en auditoría.
- Cada puntaje guarda la versión del modelo, el desglose, los motivos y las señales usadas. Un puntaje se debe poder explicar y reproducir.
- Los criterios que no se puedan observar en la web se capturan manualmente y se etiquetan como tales. No los inventes.
- Calibración asistida: compara resultados ganados y perdidos por señal, y **sugiere** cambios de pesos. Solo un administrador los aplica, y solo se muestran con una muestra mínima configurable y una advertencia de muestra pequeña.

### 5.4 Diagnóstico asistido por IA

- Genera una versión de una página (PDF) y una presentación (PPTX) para los leads priorizados.
- Usa salida estructurada con esquema validado. Cada afirmación referencia los IDs de sus observaciones. Rechaza o marca cualquier afirmación sin evidencia, y cualquier cifra que no provenga de ella.
- Adapta lenguaje, ejemplos e impacto al rubro mediante plantillas configurables. Si un rubro no tiene plantilla, usa una general y no inventes datos sectoriales.
- Explica impacto de negocio y prioridades, pero no regala la implementación. No promete resultados ni usa cifras de mercado sin fuente.
- Flujo obligatorio: `borrador → en revisión → aprobado | rechazado`. Muestra evidencia junto al texto y registra autor, cambios y aprobador.
- El servidor impide exportar o usar un diagnóstico como definitivo sin aprobación. Si cambia la evidencia, el diagnóstico queda marcado como desactualizado.
- La plantilla usa la marca APROS y un tono consultivo: directo, específico y sin alarmismo.
- Registra modelo, versión de prompt, tokens y costo estimado por generación.

### 5.5 Trabajo comercial

- Bandeja priorizada por vendedor con filtros por rubro, ciudad, puntaje, señal y estado.
- Vista 360 de la empresa: datos, señales, historial, puntaje, diagnóstico, contactos, actividades y próxima acción.
- Embudo: `Detectada → Analizada → Priorizada → Diagnóstico aprobado → Contactada → Reunión → Propuesta → Ganada | Perdida | Nurturing | Descartada`.
- Registro manual de actividades (visita, llamada, correo, LinkedIn y referido), tareas y recordatorios.
- Motivo obligatorio al perder o descartar. En cuentas ganadas: ticket, margen proyectado y retainer.
- Planificación de visitas: lista por zona, exportable, sin depender de un proveedor de mapas.
- Borradores de mensajes para copiar y enviar manualmente, con advertencias de cumplimiento. **Radar no envía mensajes.**
- Reanálisis programado de leads activos, con aviso interno cuando cambia una señal relevante.

### 5.6 Traspaso y panel de resultados

- Traspaso idempotente al sistema comercial, con reintentos y estado visible, sin doble digitación. Mientras no exista contrato, usa exportación CSV y el adaptador simulado.
- Panel por periodo, rubro, señal y vendedor:
  - Conversión por etapa y tiempo por etapa
  - Reuniones calificadas, propuestas y cierres
  - Ticket promedio, margen proyectado y porcentaje con retainer
  - Rendimiento por señal y por banda de puntaje
  - Tiempo y costo por diagnóstico, y costo por lead trabajado
- Comparación con una línea base cargada manualmente, y CAC cuando existan los costos. Cada métrica documenta su fórmula. Sin datos suficientes, se muestra “sin datos suficientes”, no un valor engañoso.

### 5.7 Fuera de alcance

No implementes, aunque parezca fácil:

- Envío masivo o automático de correos
- Automatización de LinkedIn o WhatsApp
- Scanner público o formulario abierto
- Respuestas automáticas a prospectos
- Multiempresa o facturación SaaS

## 6. Seguridad

Sigue OWASP ASVS (nivel 2 como referencia) y OWASP Top 10, incluidos los riesgos de aplicaciones con LLM. Entrega `docs/SECURITY.md` con el modelo de amenazas y cómo se mitiga cada riesgo.

### Autenticación y autorización

- Inicio de sesión con Google Workspace (OIDC), restringido a dominios configurados, salvo que el Hub ofrezca un SSO verificable. No almacenes contraseñas propias.
- Roles aplicados en el servidor: administrador, líder comercial, vendedor, consultor y lectura. Valida permisos por objeto en cada endpoint y acción.
- Sesiones seguras: cookies `HttpOnly`, `Secure` y `SameSite`, expiración, revocación y protección CSRF.

### SSRF y contenido hostil (crítico)

El analizador visita URLs que no controlamos. Debe:

- Aceptar solo HTTP y HTTPS, y puertos autorizados.
- Validar DNS y **cada redirección**, y bloquear rangos privados, loopback, link-local y metadatos de nube, en IPv4 e IPv6. Conectarse a la IP validada para evitar DNS rebinding.
- Aplicar límites de tamaño, tiempo, redirecciones y tipo de contenido. No ejecutar contenido descargado.
- Si hace falta un navegador sin interfaz, ejecutarlo aislado, sin credenciales y sin acceso a la red interna.
- Respetar `robots.txt`, usar un User-Agent identificable, y limitar la frecuencia por dominio.

### Inyección de prompts

- Todo contenido web es **dato no confiable**, nunca instrucciones. Sepáralo claramente en el prompt.
- El modelo no recibe herramientas, secretos ni acceso a la red.
- Valida la salida contra esquema. Trátala como no confiable: sanitízala antes de renderizarla o exportarla, y bloquea enlaces o dominios no autorizados.
- Incluye pruebas con páginas que contengan instrucciones maliciosas.

### Aplicación e infraestructura

- Validación de entradas en el servidor, consultas parametrizadas y escape de salida.
- Protección contra inyección de fórmulas en CSV y validación de archivos subidos.
- Encabezados de seguridad, incluida una CSP estricta, y rate limiting en login, importación, análisis y generación con IA.
- Secretos solo en variables de entorno o en un gestor. Incluye `.env.example` sin valores reales y escaneo de secretos en CI.
- Registro de auditoría inalterable desde la aplicación para accesos, cambios de puntaje, aprobaciones, exportaciones y administración.
- Logs estructurados sin datos personales, tokens ni contenido sensible.
- Cifrado en tránsito, base con mínimos privilegios, respaldos cifrados y una prueba documentada de restauración.
- Auditoría de dependencias, lockfile y CI que falle ante vulnerabilidades altas o críticas, según una política documentada.

## 7. Datos y cumplimiento en Perú

Implementa controles técnicos y prepara `docs/COMPLIANCE.md` para revisión legal. No afirmes que el sistema cumple la ley; eso lo debe validar un abogado.

- **Ley 29733 y su reglamento:** minimiza datos personales, registra fuente y finalidad, define retención y permite consultar, corregir, exportar y eliminar datos de una persona. Prioriza datos corporativos publicados por la propia empresa. No enriquezcas contactos personales con fuentes dudosas.
- **Ley 28493 y su reglamento:** si un vendedor prepara un correo comercial no solicitado, muestra los requisitos a revisar: “PUBLICIDAD” al inicio del asunto, identificación del remitente con domicilio y correo, mecanismo de baja, y su atención dentro del plazo legal. Los requisitos deben ser configurables para que asesoría legal pueda ajustarlos.
- **Código de Protección al Consumidor:** deja señalado para revisión legal si se requiere consentimiento previo según el caso.
- Bloquea el uso comercial de contactos en la lista de no contactar.
- Documenta qué datos se envían al proveedor de IA y evita enviar datos personales si no son necesarios.

## 8. Viabilidad y costos

- Fija límites configurables de presupuesto diario y mensual para IA y APIs. Al llegar al límite, el sistema se pausa con un aviso claro y conserva el trabajo.
- Ejecuta primero las señales gratuitas y usa IA solo donde aporta criterio. Usa caché por URL, versión y vigencia.
- Muestra el costo acumulado y por diagnóstico en el panel.
- Trabajos idempotentes, con reintentos, tiempo máximo, cola de errores y estado visible.
- Si falla un proveedor, el resto del sistema sigue funcionando.
- Dimensiona para un equipo pequeño y miles de empresas. Evita optimizaciones prematuras, pero previene consultas N+1 y agrega índices para las consultas principales.
- Entrega en `docs/COSTS.md` una estimación con supuestos explícitos, separando costos fijos, costos por diagnóstico y horas de mantenimiento.
- Agrega feature flags para proveedores externos y módulos que no estén listos.

## 9. Diseño e identidad APROS

La interfaz debe parecer un producto propio de APROS, sobria y profesional, sin apariencia de plantilla genérica.

**Paleta oficial:**

| Token | HEX | Uso sugerido |
|---|---|---|
| Navy | `#070926` | Texto principal, navegación y fondos oscuros |
| Indigo | `#232391` | Identidad y estados seleccionados |
| Blue | `#0054FC` | Acciones principales |
| Cyan | `#00CEFF` | Acentos y datos |
| Mint | `#15F2C6` | Acentos y gradiente del isotipo |
| Blanco | `#FFFFFF` | Fondos y texto sobre oscuro |

- **Nota:** el manual lista el azul con un HEX incorrecto; su RGB `0, 84, 252` corresponde a `#0054FC`. Usa este último.
- **Tipografía:** Questrial para títulos, con una sans legible para datos si Questrial no cubre bien las tablas. Inclúyela localmente con licencia verificada.
- **Marca:** usa el logotipo y el isotipo de `assets/brand/`. Si faltan, déjalo pendiente. No los redibujes ni los alteres.
- **Tono:** frases cortas, directas y específicas, con autoridad y optimismo.
- **Color con significado:** el gradiente y el mint se usan con moderación. Verifica contraste, porque el cyan y el mint no sirven como texto sobre blanco. Los estados nunca dependen solo del color.
- **Sistema de diseño:** define tokens en un solo lugar, con componentes reutilizables y modo claro. Agrega modo oscuro solo si no retrasa lo esencial.
- **Experiencia:** prioriza la densidad útil de las tablas, la lectura rápida de la bandeja y los estados vacíos, de carga y de error. Cada puntaje muestra “por qué”. Debe ser responsive para consultar una ficha desde el móvil durante una visita.
- **Accesibilidad:** WCAG 2.2 AA, teclado, foco visible y etiquetas correctas.
- **Exportables:** el PDF y el PPTX usan la misma marca, y se revisan visualmente.

Si hay herramientas de diseño o skills disponibles en este entorno, úsalas. Valida las pantallas en navegador a anchos móvil y escritorio.

## 10. Calidad y pruebas

- Pruebas unitarias del scoring, normalización, deduplicación y extracción de señales, con fixtures HTML locales.
- Pruebas de integración de permisos, importación, flujo de aprobación, traspaso y trabajos.
- Pruebas de seguridad de SSRF, redirecciones, inyección de prompts, CSV, autorización por objeto y CSRF.
- Pruebas E2E del recorrido: importar → analizar → puntuar → generar → aprobar → exportar → registrar resultado.
- Las pruebas no dependen de sitios reales ni de claves. Los proveedores externos se simulan.
- Lint, verificación de tipos, pruebas y auditoría de dependencias corren en CI.
- Añade datos ficticios claramente marcados para la demo. No uses datos reales de clientes.

## 11. Observabilidad y operación

- Registro estructurado con identificador de correlación, endpoint de salud, y métricas de trabajos, errores y costos.
- `docs/RUNBOOK.md`: instalación, variables, migraciones, respaldo y restauración, rotación de secretos, atención de incidentes y reversión.
- `README.md` que permita a otro desarrollador levantar el proyecto.

## 12. Criterios de aceptación

El proyecto está listo cuando se pueda demostrar lo siguiente:

1. Un usuario autorizado importa un CSV y resuelve duplicados.
2. Un análisis produce señales con evidencia, y los fallos aparecen como “no verificado”.
3. El puntaje muestra su desglose, motivos y versión del modelo. Un administrador crea un rubro nuevo con sus señales, modelo y plantilla sin tocar código, y el recorrido completo funciona con al menos tres rubros distintos.
4. Una afirmación del diagnóstico sin evidencia es bloqueada o marcada.
5. Ningún diagnóstico se exporta como final sin aprobación, ni siquiera llamando directamente a la API.
6. Un vendedor no accede a datos o acciones que su rol no permite.
7. Las pruebas de SSRF e inyección de prompts pasan.
8. Una empresa en la lista de no contactar queda bloqueada para uso comercial.
9. El presupuesto de IA, al agotarse, detiene las generaciones sin perder trabajo.
10. El panel coincide con los datos de prueba y documenta sus fórmulas.
11. El traspaso repetido no genera duplicados.
12. La interfaz y los exportables respetan la marca APROS y pasan una revisión de accesibilidad.
13. CI está en verde y la restauración de un respaldo fue probada.
14. Ninguna función de la sección 5.7 existe en el sistema.

## 13. Fases

1. **Fundaciones:** plan aprobado, proyecto, autenticación, roles, auditoría, sistema de diseño y CI.
2. **Base y análisis:** importación, deduplicación, analizador seguro y señales.
3. **Priorización:** ficha, scoring, explicación y bandeja.
4. **Diagnóstico:** generación, evidencia, aprobación y exportación a PDF y PPTX.
5. **Trabajo comercial:** embudo, actividades, tareas, visitas y reanálisis.
6. **Resultados e integración:** panel, calibración asistida, adaptadores y traspaso.
7. **Endurecimiento:** revisión de seguridad, rendimiento, accesibilidad, costos, documentación y demo.

Prioriza que la fase 4 pueda usarse en un piloto real de 30 diagnósticos, con los rubros que el equipo elija, sin esperar a las fases siguientes.

Al terminar cada fase, entrégame:

- Qué quedó funcionando y cómo probarlo
- Resultado real de las pruebas
- Decisiones tomadas
- Riesgos y pendientes
- Lo que necesitas de mí para continuar

**Empieza ahora por la inspección del entorno y `docs/PLAN.md`. No implementes hasta que yo apruebe el plan.**
