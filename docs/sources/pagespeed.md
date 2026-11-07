# Fuente: PageSpeed Insights API

1. **URL oficial:** https://developers.google.com/speed/docs/insights/v5/get-started. Acceso: API oficial.
2. **Revisión:** 2026-11-07, Claude. **No es revisión legal.**
3. **Leído:** la API «can be used with or without an API key, although a key is recommended for frequent, automated queries». La clave se añade con `key=` a la URL.
4. **No leído:** cuota diaria exacta y condiciones de facturación. **No verificado.** Las páginas que leí no las muestran.
5. **robots.txt:** no aplica a la API.
6. **Datos personales:** ninguno; se consulta la URL pública de la empresa.
7. **Decisión:** **automático, con tope propio.** Mientras no haya clave se usa sin ella con un tope diario bajo (la guía no promete una cuota sin clave); con clave, el tope lo defines tú. Siempre con caché y reintento con espera. Ya existe el cliente (`src/lib/analyzer/pagespeed.ts`).
8. **Pendiente:** confirmar la cuota con la consola de Google Cloud cuando se cree una clave.
