# Revisión de términos: Google Places API

1. **Fuente y URL oficial:** Términos de Google Maps Platform (https://cloud.google.com/maps-platform/terms/, sección 3.2.3) y Términos específicos del servicio (https://cloud.google.com/maps-platform/terms/maps-service-terms, sección 14 «Places API (Legacy and New)»).
2. **Fecha y quién:** 2026-11-07, Claude (asistente) leyendo el texto publicado. Versiones vigentes según las páginas: términos generales «Last modified August 26, 2026»; términos específicos «Last modified October 28, 2026». **No es una revisión legal.**
3. **¿Uso comercial B2B?** El texto leído no lo trata como tal; ver puntos 4 y 7.
4. **¿Se pueden almacenar los datos?** **No**, salvo latitud y longitud por hasta 30 días.
   - Sección 14.3: «Customer may temporarily cache latitude and longitude values from the Places API for up to 30 consecutive calendar days, after which Customer must delete the cached latitude and longitude values.»
   - Sección 3.2.3(a) «No Scraping»: no se puede «(i) pre-fetch, index, store, reshare, or rehost Google Maps Content outside the services; (ii) bulk download … places information; (iii) copy and save business names, addresses, or user reviews».
   - Sección 3.2.3(b): «Customer will not cache Google Maps Content except as expressly permitted under the Maps Service Specific Terms.»
5. **Límites y costo:** no se pudo leer la página de precios desde este entorno (`developers.google.com` no es accesible). Sin verificar.
6. **Datos personales:** no evaluado.
7. **Otras restricciones relevantes:** 3.2.3(d)(iii) prohíbe usar los servicios «in a listings or directory service or to create or augment an advertising product»; 3.2.3(c)(vii), usar el contenido para entrenar o afinar modelos de IA.
8. **Decisión: RECHAZADA** como fuente para construir y guardar una lista de empresas. Radar guarda nombre, sitio web y análisis de cada empresa, y eso es lo que el texto prohíbe guardar. No se implementa el conector.
9. **Pendiente de revisión legal:** si algún uso transitorio (consultar sin guardar nada) sería aceptable. Radar no lo necesita: su propósito es conservar la lista.

Corrige la recomendación hecha en el chat el 2026-11-07, que proponía Google Places antes de leer estos términos.
