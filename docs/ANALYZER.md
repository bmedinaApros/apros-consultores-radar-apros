# Analizador web de Radar APROS

Versión del analizador: **1.0.0** (`src/lib/analyzer/extract.ts`). Cada observación guarda la versión con la que se produjo.

## Qué hace

Dado el dominio de una empresa, lee un número limitado de páginas **públicas** de su sitio, extrae señales de forma determinística y las guarda como observaciones con evidencia. No ejecuta JavaScript, no abre un navegador y no inicia sesión en nada.

Flujo: `robots.txt` → portada → hasta N páginas internas del mismo sitio (por defecto 8, prioriza contacto, servicios, nosotros, cotización…) → `sitemap.xml` → muestra de enlaces internos para detectar rotos → PageSpeed (si hay clave). Se omite la empresa si no tiene sitio web, si está en la lista de no contactar o si es cliente activo.

## Reglas de veracidad

1. **Estados:** cada observación es `observed` (se encontró), `not_detected` (no apareció en el HTML recibido) o `unverifiable` (no se pudo leer). Un fallo de lectura, un bloqueo, un desafío antibots, un tiempo agotado, un destino bloqueado por seguridad o un error de red producen **siempre** `unverifiable`, nunca un hallazgo negativo.
2. **Observado vs inferido:** `kind = observed` es lo que se vio; `kind = inferred` es una conclusión razonable (por ejemplo, «hay llamados a la acción» o «tiene información de entidad»). Un píxel instalado significa «píxel detectado», no «invierte en publicidad».
3. **Ausencia en HTML estático:** una etiqueta que no aparece (GA4, píxel de Meta, Google Ads, Clarity, WhatsApp flotante, formularios) se registra como `not_detected` con confianza **baja** y la salvedad de que puede cargarse por JavaScript. Si el sitio tiene Google Tag Manager, la ausencia de otras etiquetas pasa a `unverifiable`, porque pueden estar dentro del contenedor.
4. **Certificado TLS:** un certificado inválido es un hecho observado (`valid: false` con el código de error), no una ausencia. La lectura del sitio queda `unverifiable`, porque no se ignoran errores de certificado.
5. **Enlaces rotos:** solo cuentan 404 y 410. Un 403, 429, 5xx o error de red en la muestra no cuenta como roto.
6. **Evidencia:** URL y un extracto de hasta 300 caracteres (la base impide más de 400), sin caracteres de control ni marcas de dirección bidireccional. El contenido de la página es **dato no confiable**: se guarda acotado y nunca se interpreta como instrucción.
7. **Historial:** las observaciones son de solo inserción (un trigger lo impide). Los cambios entre corridas se calculan ignorando las señales que pasaron a o desde `unverifiable`.

## Señales comunes (26)

| Categoría | Señales |
|---|---|
| SEO técnico | `seo.title`, `seo.meta_description`, `seo.h1`, `seo.canonical`, `seo.indexable`, `seo.robots_txt`, `seo.sitemap`, `seo.broken_links` |
| Datos estructurados | `sd.jsonld` (presencia, tipos, validez básica de JSON) |
| GEO | `geo.ai_crawlers` (reglas para GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot y otros; distingue regla explícita de heredada), `geo.entity_info` (inferido) |
| Medición y publicidad | `meas.ga4`, `meas.gtm`, `meas.meta_pixel`, `meas.google_ads`, `meas.clarity` |
| Conversión | `conv.form`, `conv.whatsapp`, `conv.phone`, `conv.cta`, `conv.booking_or_quote`, `conv.mobile_viewport` |
| Rendimiento | `perf.pagespeed` (API oficial; sin clave queda `unverifiable`) |
| Tecnología y actividad | `tech.cms`, `tech.tls`, `tech.last_content`, `tech.vendor_credit` |

## Señales por rubro

Se configuran en **Señales por rubro** (administrador), sin tocar código: nombre, hasta 20 palabras clave (texto simple, **no** expresiones regulares) y dónde buscar (texto visible o enlaces). Se evalúan solo para empresas de ese rubro; una señal que no aplica no se evalúa ni resta puntaje. Vienen cargadas como ejemplo para los siete rubros (cotización en inmobiliario, citas en salud, admisión en educación, etc.).

## Protecciones

Ver `docs/SECURITY.md`. Resumen: solo http/https y puertos 80/443; el DNS se resuelve una vez, se rechaza el nombre si **cualquier** respuesta es no pública y la conexión se fija a esa IP (anti-rebinding); se repite en cada redirección; límites de tamaño, tiempo, redirecciones y tipo de contenido; gzip con tope descomprimido; `robots.txt` respetado (RFC 9309: 4xx = permitido, 5xx o error = no se rastrea); User-Agent identificable; espaciado de 1 s por dominio; presupuesto de páginas por empresa.

## Ejecución

El análisis corre en segundo plano con pg-boss. La aplicación solo encola; `npm run worker` lo ejecuta (2 en paralelo, 2 reintentos con espera creciente, un análisis pendiente por empresa). Caché: si hay un análisis completado de la misma versión dentro de `ANALYSIS_CACHE_DAYS` (7), se reutiliza salvo que se fuerce.

## Límites conocidos

- **JavaScript:** los sitios que renderizan todo en el navegador (SPA) muestran poco HTML; sus señales saldrán `not_detected` con confianza baja o `unverifiable`. No se usa navegador sin interfaz en esta fase (decisión D-39).
- **PageSpeed:** el cliente de la API oficial está escrito pero **no se probó contra el servicio real** (falta clave). Las pruebas usan un proveedor simulado.
- **Sitios reales:** las pruebas no tocan sitios reales. El comportamiento frente a sitios en producción se verá en el piloto.
- **Idioma:** las palabras clave de CTA y de rubro están en español.
