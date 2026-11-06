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
| D-09 | Sin proveedor de datos de empresas al inicio: solo CSV y alta manual. Cualquier `CompanySourceProvider` exige revisión previa de términos. | Evitar usos prohibidos. | Sí |
| D-10 | Modo oscuro fuera del alcance inicial. | No retrasar lo esencial. | Sí |
| D-11 | Radar no envía mensajes ni se conecta a LinkedIn/WhatsApp; sin scanner público (sección 5.7). | Fuera de alcance. | No |
| D-12 | IA solo vía API de Anthropic con `ANTHROPIC_API_KEY` y modelo por variable de entorno; simulada en pruebas y CI. | Requisito del prompt. | Sí |
| D-13 | Trabajo en rama de trabajo, commits pequeños, sin force push ni cambios directos a `main`. | Instrucción del prompt. | — |
| D-14 | Las empresas entran por CSV y alta manual; el analizador solo visita el sitio público de cada empresa. | Evitar problemas de términos de uso y de datos personales. | Sí |
| D-15 | Los tokens de diseño parten de `docs/brand/design.md`. Los neutros y colores semánticos de ese documento son derivados, no oficiales: se usan hasta que Diseño los confirme. | El manual no los define. | Sí |
