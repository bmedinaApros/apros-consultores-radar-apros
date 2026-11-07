# Fuente: OpenStreetMap, Overpass API

1. **URL oficial:** https://www.openstreetmap.org/copyright (licencia) y https://wiki.openstreetmap.org/wiki/Overpass_API (instancias y política de uso). Acceso: API pública (`https://overpass-api.de/api/interpreter`, operada por FOSSGIS según el wiki).
2. **Revisión:** 2026-11-07, Claude. **No es revisión legal.** `overpass-api.de` no respondió desde el entorno de desarrollo, así que la API no se probó.
3. **Licencia:** Open Data Commons Open Database License (ODbL). Texto leído: se puede copiar, distribuir y adaptar «as long as you credit OpenStreetMap and its contributors»; si se altera o se construye sobre los datos, el resultado solo se puede **distribuir** bajo la misma licencia. Hay que mostrar la atribución. Uso interno de APROS: no es distribución; si Radar se entrega o vende, hay que revisar la obligación de compartir la base derivada.
4. **Política de uso de la instancia principal (wiki):** menos de 10 000 consultas y 1 GB por día se considera sin molestar a otros, y para uso **regular** hay que dividir esos números por 100 (menos de 100 consultas y ~10 MB al día). Piden identificarse con un `User-Agent` y avisar de usos a gran escala. Radar usará: una consulta a la vez, un máximo configurable muy por debajo de esos límites, `User-Agent` identificable con correo de contacto (lo pones tú en `.env`), caché y reintento con espera.
5. **robots.txt:** no aplica a la API.
6. **Campos:** nombre, sitio web, teléfono, dirección y coordenadas, solo cuando el mapa los trae. Cobertura parcial en Perú. Teléfonos y correos de OSM pueden ser de personas: se guardan solo si el negocio los publica como contacto de la empresa.
7. **Decisión:** **automático con límites**, desactivado hasta que me confirmes el correo de contacto y se pruebe la API desde tu Mac.
8. **Pendiente de revisión legal:** ODbL si Radar se distribuye.
