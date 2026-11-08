# Registro de verificación de fuentes (2026-11-07)

Quién: Claude (asistente), leyendo desde el entorno de desarrollo con User-Agent `RadarAPROS-research/1.0 (lectura de politicas)`, una petición por página, respetando `Crawl-delay`. **No es una revisión legal.** Ningún bloqueo se eludió: donde el servidor rechazó el acceso se detuvo la lectura y se anotó.

Alcance: se leyeron políticas y `robots.txt`. **No se descargó ningún dato de las fuentes.** Un `robots.txt` que no prohíbe una ruta no equivale a permiso de los términos de uso.

| Fuente | Qué se pudo leer | Qué no | Resultado |
|---|---|---|---|
| SUNAT, padrón reducido | Página oficial de descarga (`/descargaPRR/mrc137_padron_reducido.html`): dos archivos (RUC y Local Anexo), «Actualizado al 07/11/2026»; `robots.txt` responde 404 (sin reglas publicadas) | Términos de uso: la página no los incluye. Columnas y tamaño: el archivo está en `www2.sunat.gob.pe`, host no habilitado, y no se descargó | Ver `sunat_padron.md` |
| datosabiertos.gob.pe | `robots.txt` (`Crawl-delay: 10`; solo bloquea directorios técnicos y `/admin/`), página principal, búsquedas y la ficha de un conjunto (licencia visible por conjunto) | Un conjunto «RUC + CIIU»: **no lo encontré** | Ver `datosabiertos.md` |
| OpenStreetMap / Overpass | `openstreetmap.org/copyright` (ODbL, atribución) y la tabla de instancias del wiki de Overpass con su política de uso | `overpass-api.de` no respondió desde el entorno (no se probó la API) | Ver `osm_overpass.md` |
| PageSpeed Insights | Guía «get-started»: se puede usar con o sin clave; la clave se recomienda para consultas frecuentes | Cuota diaria exacta: no aparece en las páginas leídas | Ver `pagespeed.md` |
| webappanalyzer | `LICENSE` (GNU GPL v3, 29 de junio de 2007) y `README` (continuación de Wappalyzer, que pasó a ser privado en agosto de 2023) | Licencia específica de los archivos de firmas, si fuera distinta | Ver `webappanalyzer.md` |
| Páginas Amarillas Perú | `robots.txt`: solo `Disallow: /trafico/*` | Términos de uso (están en un dominio del proveedor no habilitado) | Términos sin leer → **asistido** |
| Urbania | `robots.txt` (bloquea `Scrapy`, `wget`, `HTTrack` y similares; para el resto, rutas `*-api/`, `?sort=` y paginación profunda). La página principal respondió **403** al acceso automatizado | Términos de uso | 403 sin eludir; términos sin leer → **asistido** |
| Bumeran | `robots.txt` (bloquea filtros y búsquedas concretas; publica sitemaps de avisos y empresas) | Términos de uso | Términos sin leer → **asistido** |
| Laborum | `robots.txt` (solo bloquea áreas de cuenta y administración; publica sitemap) | Términos de uso | Términos sin leer → **asistido** |
| Computrabajo, Get on Board, CCL | — (sin respuesta desde el entorno) | Todo | Sin leer → **asistido / desactivado** |
| SEACE / OECE | — (`contratacionesabiertas.oece.gob.pe` respondió **403**; `www.oece.gob.pe` sin respuesta) | Todo, incluida la licencia CC BY 4.0 que menciona la solicitud | 403 sin eludir; sin leer → **no se automatiza todavía** |
| Indecopi, Meta Ad Library, Nexo, ASEI, SNI, CCL Arequipa | No leídas (fuera de la lista habilitada) | Todo | Captura asistida o enlace manual, como indica el plan |

Para las fuentes sin respuesta: puedes abrir la página en tu navegador y pegarme el texto de términos y de `robots.txt`; con eso se completa su documento.
