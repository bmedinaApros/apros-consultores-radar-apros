# Fuente: Plataforma Nacional de Datos Abiertos (datosabiertos.gob.pe)

1. **URL oficial:** https://www.datosabiertos.gob.pe/ (portal DKAN). Acceso: descarga por conjunto de datos.
2. **Revisión:** 2026-11-07, Claude. **No es revisión legal.**
3. **Licencia:** se muestra **por conjunto de datos**. Ejemplo leído: «Padrón de Emisores de Comprobantes de Pago Electrónicos (CPE)» de SUNAT, licencia *Open Data Commons Attribution License* (exige atribución). Cada recurso que se use se documenta con su propia licencia.
4. **robots.txt:** `Crawl-delay: 10`; solo bloquea directorios técnicos (`/includes/`, `/misc/`, `/modules/`, `/profiles/`, `/scripts/`, `/themes/`) y `/admin/`, entre otros. Las páginas de conjuntos no están bloqueadas. Radar respetará el retardo de 10 s.
5. **Hallazgo importante:** **no encontré un conjunto «padrón de RUC con CIIU».** La búsqueda «ciiu» devolvió conjuntos de PRODUCE (agroindustrias, cooperativas, MIPYME, etc.) y la de «padron ruc sunat» devolvió padrones de SUNAT de otro tipo: emisores de CPE, contribuyentes del SEE y agentes de retención/percepción. **No he comprobado si alguno trae CIIU**, ni si existe el conjunto que menciona la solicitud. La ruta `/api/3/action/package_search` respondió 404.
6. **Observación:** las primeras peticiones con el User-Agent por defecto de `curl` recibieron un bloqueo (418); con un User-Agent identificable respondió con normalidad. Radar siempre se identifica.
7. **Decisión:** **no se construye el cruce por CIIU** hasta confirmar qué recurso existe. Pendiente: que me indiques el enlace del conjunto, o que revisemos juntos los padrones de SUNAT listados para ver sus columnas.
8. **Pendiente de revisión legal:** atribución exigida por la licencia de cada recurso.
