# Herramienta: webappanalyzer (firmas de tecnologías)

1. **URL oficial:** https://github.com/enthec/webappanalyzer (se leyeron `LICENSE` y `README` desde `raw.githubusercontent.com`; la página de GitHub respondió 403 del proxy).
2. **Revisión:** 2026-11-07, Claude. **No es revisión legal.**
3. **Licencia confirmada:** `LICENSE` es la **GNU General Public License, versión 3** (29 de junio de 2007). El `README` declara el proyecto como continuación de Wappalyzer, que pasó a ser privado en agosto de 2023, con insignia de licencia GPL-3.0. No leí una licencia distinta para los archivos de firmas.
4. **Consecuencia práctica (no es opinión legal):** la GPL-3.0 impone condiciones al **distribuir** el código o sus derivados. Mientras Radar se use solo dentro de APROS no se distribuye; si en el futuro se vende o se entrega a terceros, aplicaría. Por eso: módulo aislado, firmas descargadas aparte (no copiadas al repositorio) y registro en `docs/LICENSES.md`.
5. **Alternativa sin esa duda:** ampliar el detector propio (ya detecta GA4, GTM, píxel de Meta, WhatsApp, etc.) con firmas escritas por nosotros.
6. **Decisión:** **pendiente de tu elección** entre aislar el módulo GPL o ampliar el detector propio. No se integra nada hasta decidir.
7. **Pendiente de revisión legal:** alcance de la GPL-3.0 sobre las firmas si Radar se distribuye.
