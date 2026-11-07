# Seguridad — Radar APROS

Referencia: OWASP ASVS nivel 2 y OWASP Top 10, incluidos los riesgos de aplicaciones con LLM. Este documento crece con cada fase. **Estado: fase 1.** Lo que figura como "pendiente" aún no existe.

## Implementado en la fase 1

| Control | Cómo | Prueba |
|---|---|---|
| Sin contraseñas propias | Solo Google OIDC con PKCE, `state` y `nonce`; el estado viaja en una cookie firmada de 10 minutos | `security-utils.test.ts` (firma y manipulación) |
| Dominios autorizados | `AUTH_ALLOWED_DOMAINS`; se exige correo verificado; la sugerencia `hd` de Google no se usa como control | `users.test.ts` (dominios, subdominios, sufijos engañosos) |
| Primer ingreso con mínimo privilegio | Los usuarios nuevos quedan en "Lectura"; solo `INITIAL_ADMIN_EMAILS` nace administrador | `users.test.ts` |
| Roles en el servidor | Cinco roles y matriz de permisos en `src/lib/rbac.ts`; cada página y acción vuelve a comprobar | `rbac.test.ts`; verificación en navegador del rol vendedor |
| Autorización por objeto | `canModifyOwned`: un vendedor solo modifica lo propio o lo sin dueño | `rbac.test.ts` |
| Sesiones | Token aleatorio de 256 bits; en base solo su hash SHA-256; cookie `HttpOnly`, `SameSite=Lax`, `Secure` y prefijo `__Host-` en producción; vencimiento absoluto de 12 h e inactividad de 2 h; revocación | `users.test.ts` |
| Revocación | Cambiar rol o desactivar a un usuario cierra sus sesiones | `users.test.ts` |
| Protección del último administrador | La transacción bloquea las filas de administradores | `users.test.ts` |
| CSRF | `SameSite=Lax`, verificación de `Origin`/`Sec-Fetch-Site` en rutas que cambian estado, token por sesión en el cierre de sesión; las acciones de servidor de Next verifican el origen | `security-utils.test.ts`; `curl` con origen ajeno devuelve 403 |
| Acceso de desarrollo | Solo con `NODE_ENV=development` y `DEV_LOGIN_ENABLED=true`; la configuración se niega a arrancar en producción si está activo; la ruta responde 404 fuera de desarrollo | `env.test.ts` |
| Limitación de tasa | Inicio de sesión: 10 intentos por 15 min y cliente | `security-utils.test.ts` |
| Auditoría inalterable | Tabla de solo inserción: el rol de la aplicación no tiene `UPDATE`/`DELETE`/`TRUNCATE`; triggers bloquean incluso al propietario; cadena de hashes SHA-256 que detecta ediciones y borrados | `audit.test.ts` |
| Mínimos privilegios en base | La aplicación usa `radar_app` (sin DDL); las migraciones usan `radar_owner` | `migrations/` |
| Encabezados | CSP estricta con nonce por petición (sin `unsafe-inline` en producción), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` | Verificado con `curl` |
| Logs | JSON estructurado; se redactan claves como correo, token, secreto, cookie | `src/lib/logger.ts` |
| Secretos | Solo variables de entorno; `.env` ignorado por git; `.env.example` sin valores reales; escaneo con gitleaks en CI | CI |
| Dependencias | `package-lock.json`; `npm audit --audit-level=high` en CI y Dependabot semanal | CI |

## Añadido en la fase 2

| Control | Cómo | Prueba |
|---|---|---|
| Subida de archivos | Solo `.csv`, UTF-8 válido, sin bytes nulos, máximo 5 MB, 5000 filas, 30 columnas, 500 caracteres por celda; la ruta verifica origen, sesión, permiso y tasa (20 por hora) | `csv.test.ts`; `curl`: 401 sin sesión, 403 con origen ajeno |
| Inyección de fórmulas | Todo CSV exportado (informe de errores) neutraliza celdas que empiezan con `=`, `+`, `-`, `@`, tab o retorno | `csv.test.ts`, `import.test.ts` |
| Dominios seguros para el analizador | Se rechazan IPs (v4/v6), nombres internos o reservados, redes sociales y correos gratuitos; así el analizador nunca recibe una IP ni LinkedIn/Google como objetivo | `normalize.test.ts` |
| No contactar | Se aplica al importar, descubrir, crear, editar y al confirmar un lote (se vuelve a comprobar); no se puede esquivar cambiando el dominio | `import.test.ts`, `companies.test.ts` |
| Clientes activos | Se excluyen por RUC, dominio o nombre | `import.test.ts` |
| Autorización por objeto | Un vendedor solo edita lo propio o lo libre y no reasigna a terceros; consultor y lectura no escriben | `companies.test.ts`; verificado en navegador |
| Fuentes | Desactivadas por defecto; la base impide activarlas sin términos aprobados; las no implementadas no se pueden activar | `companies.test.ts` |
| Mínimos privilegios | `radar_app` solo tiene los permisos de las tablas nuevas que necesita | `migrations/` |
| Auditoría | Altas, ediciones, importaciones, decisiones, deshacer, lista de no contactar, rubros, fuentes y descubrimiento quedan registrados | `import.test.ts` |

## Añadido en la fase 3: analizador web (SSRF y contenido hostil)

Código en `src/lib/analyzer/net-guard.ts` y `safe-fetch.ts`. Todo lo que el analizador contacta pasa por estas capas:

| Control | Cómo | Prueba |
|---|---|---|
| Esquema y puerto | Solo `http`/`https`; puertos 80 y 443 (configurable); sin credenciales en la URL; URL de hasta 2048 caracteres | `net-guard.test.ts` (118 casos) |
| Direcciones no públicas | Se bloquean 0/8, 10/8, 100.64/10, 127/8, 169.254/16 (metadatos de nube), 172.16/12, 192.0.0/24, 192.0.2/24, 192.168/16, 198.18/15, documentación, multidifusión y 240/4; IPv6: `::`, `::1`, IPv4 mapeada/compatible (se evalúa la IPv4 incrustada), NAT64, 6to4, Teredo, ULA (incluye `fd00:ec2::254`), enlace local, multidifusión y todo lo que no sea unicast global | `net-guard.test.ts` |
| Formas ofuscadas | `2130706433`, `0x7f.1`, `127.1`, `0177.0.0.1`, `[::ffff:7f00:1]` se normalizan antes de evaluar; `localhost`, `.local`, `.internal`, `metadata.google.internal` y nombres sin extensión se rechazan | `net-guard.test.ts` |
| DNS | Se rechaza el nombre si **cualquiera** de sus respuestas es no pública (respuesta mixta). Plazo de 5 s | `net-guard.test.ts` |
| DNS rebinding | El nombre se resuelve **una sola vez** y la conexión se fija a esa IP validada (`lookup` fijo, SNI y `Host` con el nombre original). No hay segunda resolución | `safe-fetch.test.ts`: un resolvedor que cambia de respuesta nunca logra conectar a la IP privada |
| Redirecciones | Cada salto vuelve a pasar por validación de URL y de DNS; máximo 5; se bloquea la degradación https→http y los destinos `file:`, internos o con puerto no permitido | `safe-fetch.test.ts` (6 destinos hostiles + bucle) |
| Tamaño | Tope de 1,5 MB por respuesta; rechazo si declara un tamaño exorbitante; gzip con tope sobre bytes comprimidos y descomprimidos (bomba de 80 MB cortada) | `safe-fetch.test.ts` |
| Tiempo | Plazo total por petición, incluidas redirecciones; corta a servidores que gotean datos (slow-loris) o que no responden | `safe-fetch.test.ts` |
| Tipo de contenido | Solo HTML, XHTML, texto y XML en respuestas exitosas; se rechazan PDF, imágenes y codificaciones no anunciadas | `safe-fetch.test.ts` |
| TLS | Se verifica el certificado; un error nunca se ignora y se informa como hecho observado | `safe-fetch.test.ts`, `analyzer-e2e.test.ts` |
| Cortesía | `robots.txt` respetado (RFC 9309), User-Agent identificable (`CRAWLER_USER_AGENT`), 1 s entre peticiones al mismo dominio, presupuesto de páginas por empresa | `analyzer.test.ts`, `safe-fetch.test.ts` |
| Contenido hostil | El HTML se analiza como datos con un parser estático (cheerio): no se ejecuta JavaScript. Los enlaces a `file:`, `javascript:`, loopback o metadatos que traiga la página no se visitan. Las evidencias se acotan y se limpian de caracteres de control | `analyzer.test.ts` («contenido hostil») |
| Observaciones inmutables | Un trigger impide modificar observaciones; la base impide evidencias de más de 400 caracteres | `analyzer.test.ts` |
| Cola de trabajos | pg-boss en el esquema `pgboss`; la aplicación no necesita permiso de creación en la base ni puede crear tablas fuera de ese esquema | `queue.test.ts` |
| Dominios del analizador | Se rechazan IPs, redes sociales y correos gratuitos ya al registrar la empresa (fase 2), así que LinkedIn y Google nunca son objetivo | `normalize.test.ts` |

Las pruebas de SSRF usan servidores locales con direcciones públicas simuladas (`testRoute`) y un certificado propio (`testCa`). Esos dos mecanismos solo existen como parámetros del código de prueba: no se leen del entorno ni de la configuración.

**Verificación por mutación:** al desactivar a propósito (1) la revalidación en redirecciones y (2) el tope de bytes, fallaron 7 y 2 pruebas respectivamente, así que las pruebas detectan esos defectos.

**No probado todavía:** la degradación https→http en una redirección real (el código la bloquea; falta una prueba con dos servidores TLS); el cliente real de PageSpeed; el comportamiento frente a sitios reales; aislamiento de red del proceso worker (hoy depende del servidor donde se despliegue: conviene que el worker no tenga ruta a la red interna aunque el código ya la bloquee).

## Añadido en la fase 4: puntaje, lista semanal y revisión

| Control | Cómo | Prueba |
|---|---|---|
| Condiciones sin código ejecutable | Las reglas de puntaje, los descalificadores y las reglas de servicios son datos validados con un esquema (señal, estado, campo, operador, valor); no hay `eval` ni expresiones regulares del administrador | `scoring-engine.test.ts` |
| Modelos validados e inmutables | Los pesos deben sumar 100, umbrales coherentes, identificadores únicos; una versión no se modifica (trigger) | `scoring-service.test.ts` |
| Puntajes, observaciones, criterios y ajustes de solo inserción | Triggers; la aplicación ni siquiera tiene permiso de `UPDATE` sobre `scores` | `scoring-service.test.ts` |
| Lista semanal inmutable | Trigger que solo permite cambiar revisión y asignación | `weekly.test.ts` |
| Revisión humana forzada en el servidor | Un vendedor no ve nada pendiente ni rechazado, en la lista ni en la bandeja, aunque pida otra URL; la aprobación se vuelve a comprobar contra no contactar | `weekly.test.ts` (y mutación que lo rompe) |
| Permisos | `weekly.review` (administrador, líder, consultor); `weekly.run`, `scoring.adjust`, `catalog.manage` por rol; un vendedor solo analiza y edita lo propio o lo libre | `rbac.test.ts`, `weekly.test.ts`, `scoring-service.test.ts` |
| Ajustes con motivo | Obligatorio, acotado a ±50, auditado | `scoring-service.test.ts` |
| Una ejecución a la vez | Se rechaza una segunda; cola con deduplicación | `weekly.test.ts`, `queue.test.ts` |
| Presupuesto | Tope de sitios por ejecución; al agotarse se marca cobertura parcial y se conserva lo hecho | `weekly.test.ts` |
| Mínimos privilegios | `radar_app` solo tiene los permisos que necesita en cada tabla nueva | `migrations/` |
| Errores esperados | Los errores de validación se muestran como mensaje, no como error 500 | verificado en el navegador |

## Límites conocidos de la fase 1

- **Limitador en memoria:** sirve para una sola instancia. Si se despliegan varias, hay que moverlo a PostgreSQL.
- **`X-Forwarded-For`:** el limitador lo usa sin validar. Es fiable solo detrás de un proxy propio que lo sobrescriba. Verificar en el despliegue.
- **Vulnerabilidades moderadas conocidas** (`glob`, `minimatch` vía `node-pg-migrate` y `typescript-eslint`): solo afectan herramientas de desarrollo y migraciones, no el tráfico de usuarios. La política de CI falla únicamente ante alta o crítica. Se revisa en cada actualización.
- **Cifrado en tránsito y respaldos cifrados:** dependen del servidor definitivo. Pendiente para la fase 8, con prueba de restauración.
- **Imagen Docker:** el `Dockerfile` está escrito pero **no se pudo construir ni probar** en el entorno de desarrollo de esta fase (sin demonio de Docker). Pendiente de probar en la Mac.

## Pendiente (fases siguientes)

- Aplicar la misma protección SSRF a los proveedores de fuentes externos cuando existan.
- Inyección de prompts y validación de salida del modelo (fase 5).
- Rate limiting en importación, descubrimiento, análisis y generación con IA.
- Flujo de aprobación forzado en servidor para diagnósticos (fase 5).
- Auditoría de accesos de lectura, exportaciones y cambios de puntaje.
