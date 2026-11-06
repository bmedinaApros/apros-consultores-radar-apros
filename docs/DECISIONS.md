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
