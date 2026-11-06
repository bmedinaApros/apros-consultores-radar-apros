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

## Límites conocidos de la fase 1

- **Limitador en memoria:** sirve para una sola instancia. Si se despliegan varias, hay que moverlo a PostgreSQL.
- **`X-Forwarded-For`:** el limitador lo usa sin validar. Es fiable solo detrás de un proxy propio que lo sobrescriba. Verificar en el despliegue.
- **Vulnerabilidades moderadas conocidas** (`glob`, `minimatch` vía `node-pg-migrate` y `typescript-eslint`): solo afectan herramientas de desarrollo y migraciones, no el tráfico de usuarios. La política de CI falla únicamente ante alta o crítica. Se revisa en cada actualización.
- **Cifrado en tránsito y respaldos cifrados:** dependen del servidor definitivo. Pendiente para la fase 8, con prueba de restauración.
- **Imagen Docker:** el `Dockerfile` está escrito pero **no se pudo construir ni probar** en el entorno de desarrollo de esta fase (sin demonio de Docker). Pendiente de probar en la Mac.

## Pendiente (fases siguientes)

- SSRF y contenido hostil del analizador web (fase 3), incluidos los proveedores de fuentes.
- Inyección de prompts y validación de salida del modelo (fase 5).
- Inyección de fórmulas en CSV y validación de archivos (fase 2).
- Rate limiting en importación, descubrimiento, análisis y generación con IA.
- Flujo de aprobación forzado en servidor para diagnósticos (fase 5).
- Auditoría de accesos de lectura, exportaciones y cambios de puntaje.
