# Fuente: SUNAT, Padrón reducido del RUC

1. **URL oficial:** https://www.sunat.gob.pe/descargaPRR/mrc137_padron_reducido.html. Enlaza `padron_reducido_ruc.zip` (alojado en `http://www2.sunat.gob.pe/padron_reducido_ruc.zip`, nótese `http`) y `padron_reducido_local_anexo.zip`.
2. **Revisión:** 2026-11-07, Claude. **No es revisión legal.** Tipo de acceso: descarga de archivo.
3. **Licencia y términos:** la página no muestra licencia ni términos de uso. **No verificado.** Pendiente: confirmar con SUNAT o con Legal la condición de reutilización.
4. **robots.txt:** `https://www.sunat.gob.pe/robots.txt` responde 404 (no hay reglas publicadas). No es una autorización.
5. **Campos — archivo de locales anexos (VERIFICADO con el archivo real, 2026-11-08):**
   - Texto separado por `|`, codificación ISO-8859-1/Windows-1252, 13 campos por fila (el último vacío por un `|` final), cabecera con espacio inicial.
   - Columnas: `RUC | UBIGEO | TIPO DE VÍA | NOMBRE DE VÍA | CÓDIGO DE ZONA | TIPO DE ZONA | NÚMERO | KILÓMETRO | INTERIOR | LOTE | DEPARTAMENTO | MANZANA`. «DEPARTAMENTO» es el departamento de un edificio (dpto.), no la región.
   - «-» y «----» significan sin dato. 778 789 filas (50 MB descomprimido, 14 MB en zip). Ordenado por RUC: primero los que empiezan con 10 (personas naturales, 181 247 filas), luego los 20 (597 533).
   - **No trae razón social, estado ni condición.** El ubigeo tiene 6 dígitos (140 filas con 5: se les completa el cero inicial; 1 con un solo dígito se descarta).
   - 9 filas finales están mal formadas (el RUC es texto como `laredo07159`, `of175308917`): se cuentan como inválidas y no detienen la carga.
6. **Campos — archivo principal de RUC (NO verificado):** se espera razón social, estado del contribuyente, condición de domicilio, ubigeo y dirección. El importador lee por **cabecera** y rechaza con un mensaje claro lo que no coincida. Para comprobarlo sin cargar nada: `npm run registry:import -- --file padron_reducido_ruc.zip --check`. En Drive hay un archivo de 395 MB (zip) y uno de 1,58 GB (txt); ninguno se puede leer desde la sesión de desarrollo (la herramienta de Drive devuelve el contenido dentro de la conversación).
7. **Datos personales:** el padrón incluye personas naturales con negocio (domicilio fiscal). **No se guardan**: el filtro por defecto carga solo RUC 20. En la prueba con el archivo real se excluyeron 181 247 filas de personas naturales.
8. **Frecuencia:** la página indica «Actualizado al 07/11/2026»; la periodicidad no está declarada.
9. **Medidas con el archivo real de locales (2026-11-08):** 778 789 filas leídas en 13,6 s (≈57 000 filas/s), memoria máxima 188 MB, 592 560 locales guardados (296 080 RUC) y 140 MB en disco con índices (≈240 bytes por fila).
10. **Decisión:** **asistido.** Tú descargas el archivo, lo copias a `data/import/` y Radar lo carga (con datos reales, por tu decisión del 2026-11-07). La descarga automática queda desactivada hasta resolver el punto 3.
11. **Pendiente de revisión legal:** condiciones de reutilización y tratamiento de datos de personas naturales (Ley 29733).
