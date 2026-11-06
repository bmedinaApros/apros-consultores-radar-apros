# Decisiones (opción conservadora por defecto)

| ID | Decisión | Motivo | Reversible |
|---|---|---|---|
| D-01 | Monolito modular Next.js + worker separado, PostgreSQL 16, pg-boss. Sin Redis ni microservicios. | Tecnología aburrida, equipo pequeño. | Sí |
| D-02 | Versiones a fijar tras revisión de mantenimiento: Next 16.x, TypeScript (estable vigente), pg-boss 12.x, Playwright 1.6x. Verificadas en npm el 2026-11-06. | Evitar versiones sin soporte. | Sí |
| D-03 | Repositorio nuevo y vacío para Radar; no se reutiliza `fadebarber-app/fade`. | No hay evidencia de relación. | Sí |
| D-04 | Autenticación solo con Google Workspace OIDC por dominio configurable; sin contraseñas propias. | Requisito de seguridad; SSO del Hub no verificable. | Sí |
| D-05 | Hub y CRM: `CommercialSystemAdapter` con implementaciones local, simulada y exportación CSV. Marcado como pendiente. | No hay contrato ni credenciales. | Sí |
| D-06 | Metodología Digital Growth Advisor recibida y guardada en `docs/methodology/`. Se adapta a prospectos nuevos en `radar-adaptation.md`. | La fuente es para reactivar clientes con historial; Radar trabaja con prospectos. | Sí |
| D-07 | Marca: se usan los logotipos horizontales recibidos (color y blanco), sin alterarlos. Falta el isotipo solo; mientras tanto no se usa. Azul `#0054FC`. Tipografías: Questrial (títulos) y Roboto (cuerpo, a validar con Diseño). | No redibujar la marca. | Sí |
| D-08 | PDF vía Chromium (Playwright) y PPTX vía `pptxgenjs`. | Fidelidad de marca y revisión visual. | Sí |
| D-09 | (Reemplazada por D-20.) |  |  |
| D-10 | Modo oscuro fuera del alcance inicial. | No retrasar lo esencial. | Sí |
| D-11 | Radar no envía mensajes ni se conecta a LinkedIn/WhatsApp; sin scanner público (sección 5.7). | Fuera de alcance. | No |
| D-12 | IA solo vía API de Anthropic con `ANTHROPIC_API_KEY` y modelo por variable de entorno; simulada en pruebas y CI. | Requisito del prompt. | Sí |
| D-13 | Trabajo en rama de trabajo, commits pequeños, sin force push ni cambios directos a `main`. | Instrucción del prompt. | — |
| D-14 | (Reemplazada por D-20.) |  |  |
| D-15 | Los tokens de diseño parten de `docs/brand/design.md`. Los neutros y colores semánticos de ese documento son derivados, no oficiales: se usan hasta que Diseño los confirme. | El manual no los define. | Sí |
| D-16 | Stack confirmado sin restricciones del Hub: Next.js, TypeScript estricto, PostgreSQL, pg-boss. | Sin preferencia del usuario; es la opción más mantenible y portable. | Sí |
| D-17 | Desarrollo local primero: todo corre en la Mac con Docker Compose. El `Dockerfile` de producción queda listo para que el jefe lo despliegue en el servidor de APROS con un dominio nuevo. Sin servicios en la nube hasta nueva aprobación. | Instrucción del usuario. | Sí |
| D-18 | Inicio de sesión: Google OIDC con dominio `apros.pe` configurable. Para desarrollo local, un inicio de sesión de desarrollo que solo funciona con `NODE_ENV=development`, desactivado y probado como inaccesible en producción. | Permite avanzar sin credenciales de Google. | Sí |
| D-19 | Mientras viva en la Mac, solo datos ficticios de demostración. Ningún dato real de prospectos hasta que el jefe apruebe el despliegue. | Reduce riesgo de privacidad (Ley 29733). | Sí |
| D-20 | El descubrimiento semanal es el propósito central. Fuentes detrás de `CompanySourceProvider`, desactivadas por defecto; solo se activan con un documento de términos aprobado en `docs/sources/`. Inicial: CSV, alta manual y fuentes gratuitas aprobadas. Google Places queda desactivado hasta aprobar un tope mensual. | El usuario quiere que Radar inspeccione fuentes y entregue una lista semanal; los términos de uso pueden prohibir ciertos usos. | Sí |
| D-21 | Alcance inicial: Lima (configurable) y los siete rubros de ejemplo. | El usuario no definió rubros ni ciudades. | Sí |
| D-22 | Lista semanal de 30 empresas, configurable; si no hay suficientes de calidad, la lista es más corta y lo indica. | Equipo de 3 vendedores. | Sí |
| D-23 | La IA solo redacta explicaciones con observaciones guardadas; nunca decide que una señal existe ni confirma rubro. El encaje con un servicio APROS se muestra como hipótesis a validar. | Principio de credibilidad. | Sí |
| D-24 | La lista semanal es un snapshot inmutable; una empresa no reaparece salvo que una señal relevante cambie. | Reproducibilidad y no repetir listas. | Sí |
| D-25 | Fase 4 entrega la primera lista semanal usable; el piloto de 30 diagnósticos pasa a la fase 5. | La lista semanal es el valor principal. | Sí |
| D-26 | Catálogo de servicios APROS: ejemplo editable hasta que el usuario entregue el real. | No inventar la oferta de APROS. | Sí |
| D-27 | TypeScript fijado en 5.9.x (no 7.x). | `typescript-eslint` aún no soporta TypeScript 6.1 o superior; usar 7.x rompería el lint. Se revisará al actualizar. | Sí |
| D-28 | Sesiones propias en PostgreSQL (token aleatorio con hash SHA-256) en lugar de una biblioteca de autenticación. | Permite revocación inmediata y menos dependencias; solo hay un proveedor (Google). | Sí |
| D-29 | Auditoría con cadena de hashes y triggers de solo inserción. | Detecta manipulación aun si alguien con acceso a la base la intenta. | Sí |
| D-30 | Docker Compose levanta solo PostgreSQL; la aplicación corre con `npm run dev` en la Mac. | Más simple y rápido de depurar; el `Dockerfile` queda para producción. | Sí |
| D-31 | Fase 2 implementa el marco de fuentes y CSV/manual; no implementa proveedores reales (SUNAT, SEACE, SMV, Google Places). Solo existe la fuente simulada. | Cada fuente real exige revisar sus términos antes de escribir código. | Sí |
| D-32 | Un duplicado exacto (RUC o dominio) nunca se crea; uno parecido por nombre lo decide una persona. Nombres que difieren en un número no se consideran duplicados. | Evitar tanto duplicados como falsos positivos («Sucursal 1» y «Sucursal 2»). | Sí |
| D-33 | Deshacer un lote elimina lo creado que sigue en «Detectada»; lo que ya avanzó se conserva y los datos fusionados en empresas existentes no se revierten. | Evita perder trabajo comercial. | Sí |
| D-34 | Un sitio web de red social o correo gratuito se descarta como dominio de la empresa. | El analizador solo debe visitar el sitio propio; esto evita apuntar a LinkedIn o Google. | Sí |
| D-35 | El rubro lo confirma una persona; el sistema solo lo deja «por clasificar» si falta o es dudoso. | Principio de credibilidad. | Sí |
| D-36 | Los duplicados por nombre se comparan en memoria (índice cargado una vez por lote). | Adecuado para miles de empresas; si crece a cientos de miles, se pasa a índice en base. | Sí |
| D-37 | El analizador usa un descargador propio (`http`/`https` de Node) con DNS fijado a la IP validada, en lugar de `fetch` o una biblioteca de scraping. | Permite validar cada salto y evitar el DNS rebinding, algo que `fetch` no deja controlar. | Sí |
| D-38 | Estados de observación: observado, no detectado y no verificable. La ausencia en HTML estático es «no detectada» con confianza baja; si hay Tag Manager, pasa a «no verificable». | Cumple «un fallo de lectura nunca es un hallazgo negativo» sin afirmar lo que no se puede ver. | Sí |
| D-39 | Sin navegador sin interfaz en la fase 3. | Reduce la superficie de ataque; los sitios con renderizado en el cliente quedan con confianza baja o «no verificable». Se reevalúa con datos del piloto. | Sí |
| D-40 | Señales por rubro con palabras clave de texto simple (no expresiones regulares), editables por el administrador. | Evita ReDoS y permite configurar sin código. | Sí |
| D-41 | Cola con pg-boss en su propio esquema `pgboss`, creado por la migración; la aplicación recibe permisos solo sobre ese esquema. | Mínimos privilegios; sin Redis. | Sí |
| D-42 | Caché de análisis por empresa, versión del analizador y vigencia (7 días, configurable); se puede forzar uno nuevo. | Controla costo y carga sobre sitios ajenos. | Sí |
| D-43 | Cliente de PageSpeed escrito pero desactivado sin clave de API; se prueba con un proveedor simulado. | No hay clave ni acceso al servicio real en el entorno de desarrollo. | Sí |
