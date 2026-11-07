# Fuentes de empresas: revisión de términos

Ninguna fuente externa se activa sin tres cosas: (1) un documento aquí con la revisión de sus términos, (2) su implementación detrás de `CompanySourceProvider`, (3) la aprobación de un administrador en **Fuentes**, que queda en la auditoría. La base de datos impide activar una fuente sin términos aprobados.

## Estado

| Fuente | Implementada | Documento de términos | Estado |
|---|---|---|---|
| CSV y alta manual | Sí | No aplica (datos que carga el equipo) | Siempre disponible |
| Simulada (datos ficticios) | Sí | `simulado.md` | Solo desarrollo y pruebas |
| Padrón de RUC de SUNAT | No | Pendiente | Sin revisar |
| SEACE / OSCE | No | Pendiente | Sin revisar |
| SMV / Bolsa de Valores de Lima | No | Pendiente | Sin revisar |
| Google Places API | No | `google_places.md` | **Rechazada** (2026-11-07): los términos prohíben guardar nombres y direcciones |

No se afirma nada sobre los términos de las fuentes pendientes hasta revisarlos en su fuente oficial.

## Plantilla de revisión (copiar a `docs/sources/<codigo>.md`)

1. **Fuente y URL oficial de los términos:**
2. **Fecha de la revisión y quién la hizo:**
3. **¿Permite uso comercial B2B de los datos?**
4. **¿Permite almacenar los datos? ¿Por cuánto tiempo? ¿Qué campos?**
5. **Límites de uso (cuota, frecuencia) y costo:**
6. **¿Contiene datos personales? Qué se guarda y con qué finalidad:**
7. **¿Exige atribución o prohíbe combinar con otras fuentes?**
8. **Decisión:** aprobada / rechazada / aprobada con límites (detallar)
9. **Pendiente para revisión legal:**

Reglas fijas: no se hace scraping de Google ni de LinkedIn, ni de sitios cuyos términos lo prohíban. El descubrimiento trabaja con empresas, no con personas.
