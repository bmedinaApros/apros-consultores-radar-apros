# APROS — Design System (`design.md`)

> Fuente única de verdad para piezas, decks, sitios, landings y documentos de APROS.
> Construido a partir de: **Manual de Identidad de Marca (Apros Global)**, **logos oficiales** (isotipo y logotipo horizontal) y **apros.pe** (revisado el 22-oct-2026).
>
> Versión: 1.0 · Owner: PM / Marketing APROS · Estado: **Borrador para validación** (ver §12 Pendientes)

---

## 1. Esencia de marca

| Elemento | Definición |
|---|---|
| **Propósito** | Impulsamos el crecimiento con soluciones digitales que hacen la vida más simple, generando confianza e impacto real para las personas y las marcas. |
| **Visión** | Ser la empresa líder en soluciones digitales que combinan diseño, tecnología e impacto real. |
| **Misión** | Desarrollar soluciones digitales robustas, atractivas y orientadas a resultados, combinando diseño, tecnología y acompañamiento estratégico. |
| **Promesa (web)** | "Hacemos tu presencia digital memorable y relevante." |
| **Arquetipos** | 50% **Sabio** (autoridad, estrategia, conocimiento) · 50% **Creador** (innovación, creatividad, autenticidad) |
| **Valores** | Confianza · Empatía · Colaboración · Compromiso · Resolutividad |
| **Persona de marca** | "Amilio", 28 años, Ing. de Sistemas con Máster en Marketing Digital: técnico, amable, responsable, le gusta enseñar y está al día en tendencias. |
| **Credenciales** | Desde 2011 · +200 clientes · +7,856 optimizaciones web · ISO 9001 (Go Web Studios S.A.C.) |

**Regla de diseño derivada:** todo lo que hagamos debe verse *técnico y confiable* (Sabio) y a la vez *moderno y vivo* (Creador). Navy profundo = autoridad; gradiente cian→teal = innovación.

---

## 2. Logotipo

### 2.1 Versiones oficiales

| Versión | Uso |
|---|---|
| **Logotipo horizontal** (isotipo + wordmark "APROS") | Uso principal: headers, portadas de decks, firmas, documentos. |
| **Isotipo** (triángulo + check) | Favicon, avatar de redes, marcas de agua, espacios cuadrados o reducidos. |
| **Check solo** (sin triángulo) | Recurso gráfico secundario: viñetas, iconos de "completado", loaders. No reemplaza al logo. |

### 2.2 Anatomía del isotipo
- **Triángulo** índigo `#232391` (en fondo claro) o blanco (en fondo navy): representa dirección/avance ("A" de APROS).
- **Check** en dos trazos redondeados:
  - Trazo corto: gradiente azul `#0054FC` → cian `#00CEFF`.
  - Trazo largo: gradiente cian `#00CEFF` → teal `#15F2C6`.
- Significado (manual): **efectividad en los procesos y búsqueda por satisfacer al cliente.**

### 2.3 Variantes por fondo

| Fondo | Triángulo | Wordmark | Check |
|---|---|---|---|
| Claro / blanco | `#232391` | `#070926` | Gradiente (siempre) |
| Navy `#070926` | `#FFFFFF` | `#FFFFFF` | Gradiente (siempre) |
| Gradiente teal/blanco (contraportada) | `#232391` | `#070926` | Gradiente |

### 2.4 Reglas de uso
- **Área de protección:** mínimo la altura de la letra "A" del wordmark alrededor del logo.
- **Tamaño mínimo:** logotipo horizontal 120 px de ancho (digital) / 30 mm (impreso). Isotipo 24 px.
- **No:** cambiar colores del check, aplicar el check en un solo color plano, rotar, deformar, añadir sombras/contornos, colocar sobre fotos sin overlay, separar el wordmark con un espaciado distinto al original, recrear el wordmark con otra tipografía.
- El wordmark tiene **tracking muy abierto**; nunca se compone con texto vivo: siempre usar el archivo.

---

## 3. Color

### 3.1 Paleta oficial

| Token | Nombre | HEX | RGB | CMYK | Rol |
|---|---|---|---|---|---|
| `--apros-navy` | Navy Profundo | `#070926` | 7, 9, 38 | 100, 93, 49, 73 | Fondo principal oscuro, texto principal en fondo claro |
| `--apros-indigo` | Índigo | `#232391` | 35, 35, 145 | 100, 93, 6, 1 | Triángulo del isotipo, acentos institucionales, hover oscuro |
| `--apros-blue` | Azul Eléctrico | `#0054FC` | 0, 84, 252 | 88, 66, 0, 0 | CTA primario, links, elementos interactivos |
| `--apros-cyan` | Cian | `#00CEFF` | 0, 206, 255 | 65, 0, 0, 0 | Acento, gradientes, highlights, íconos |
| `--apros-teal` | Teal | `#15F2C6` | 21, 242, 198 | 60, 0, 39, 0 | Acento de éxito/innovación, final de gradientes |
| `--apros-white` | Blanco | `#FFFFFF` | 255, 255, 255 | 0, 0, 0, 0 | Fondos claros, texto sobre navy |

> ⚠️ **Errata detectada en el manual (pág. 03):** el azul RGB 0, 84, 252 figura con HEX `#070926` (duplicado del navy). El HEX correcto es **`#0054FC`**. Recomendación: corregir la fuente del manual para evitar errores en producción.

### 3.2 Neutros de soporte (derivados, no oficiales)
Necesarios para UI, tablas y documentos. Derivados del navy para mantener temperatura de color.

| Token | HEX | Uso |
|---|---|---|
| `--apros-gray-900` | `#1A1D3A` | Superficies elevadas sobre navy (cards) |
| `--apros-gray-600` | `#5B5F7A` | Texto secundario en fondo claro |
| `--apros-gray-400` | `#A3A6BD` | Texto secundario sobre navy (como en el manual) |
| `--apros-gray-200` | `#E3E5EF` | Bordes, divisores |
| `--apros-gray-50`  | `#F5F7FC` | Fondos alternos de sección |

### 3.3 Colores semánticos (UI / reportes)

| Estado | HEX | Nota |
|---|---|---|
| Éxito | `#15F2C6` (sobre navy) / `#0FA889` (sobre blanco, por contraste) | |
| Info | `#0054FC` | |
| Alerta | `#FFB020` | No oficial, solo para estados |
| Error | `#E5484D` | No oficial, solo para estados |

### 3.4 Gradientes oficiales

```css
/* Check / acento principal */
--apros-gradient-check: linear-gradient(135deg, #0054FC 0%, #00CEFF 50%, #15F2C6 100%);

/* Trazo largo del check */
--apros-gradient-accent: linear-gradient(45deg, #00CEFF 0%, #15F2C6 100%);

/* Atmósfera (fondos tipo manual: blur azul/teal) */
--apros-glow-blue: radial-gradient(circle, rgba(0,84,252,.55) 0%, rgba(0,84,252,0) 70%);
--apros-glow-teal: radial-gradient(circle, rgba(21,242,198,.55) 0%, rgba(21,242,198,0) 70%);

/* Contraportada clara */
--apros-gradient-soft: linear-gradient(120deg, #FFFFFF 35%, #15F2C6 100%);
```

### 3.5 Proporción de uso (regla 60 / 30 / 10)
- **60%** Navy `#070926` o Blanco (fondo base según pieza).
- **30%** Neutros + Índigo (estructura, textos, superficies).
- **10%** Azul / Cian / Teal (CTAs, acentos, gradientes). **El gradiente es especia, no plato principal.**

### 3.6 Contraste (WCAG)
| Combinación | Ratio aprox. | Uso permitido |
|---|---|---|
| Blanco sobre `#070926` | ~19:1 | ✅ Todo |
| `#070926` sobre Blanco | ~19:1 | ✅ Todo |
| Blanco sobre `#0054FC` | ~5.6:1 | ✅ Botones y texto normal |
| Blanco sobre `#232391` | ~12:1 | ✅ Todo |
| `#070926` sobre `#15F2C6` | ~14:1 | ✅ Todo |
| `#00CEFF` / `#15F2C6` sobre Blanco | < 2:1 | ❌ Nunca como texto sobre blanco |
| `#00CEFF` / `#15F2C6` sobre `#070926` | > 11:1 | ✅ Texto destacado, KPIs |

---

## 4. Tipografía

| Rol | Familia | Pesos | Fuente | Estado |
|---|---|---|---|---|
| **Titulares / Display** | **Questrial** | 400 | Google Fonts | ✅ Confirmada como fuente de títulos APROS |
| **Cuerpo / UI / Datos** | **Roboto** | 300, 400, 500, 700 | Google Fonts | ⚠️ Inferida del manual (aspecto visual); validar con Diseño |
| **Wordmark** | Logotipo (archivo) | — | — | No componer con texto vivo |

```css
@import url('https://fonts.googleapis.com/css2?family=Questrial&family=Roboto:wght@300;400;500;700&display=swap');

--apros-font-display: 'Questrial', 'Roboto', system-ui, sans-serif;
--apros-font-body: 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif;
```

> Questrial solo tiene peso 400: la jerarquía se construye con **tamaño, color y espacio**, no con negritas. Para énfasis fuerte en títulos usar Roboto 700 en palabras puntuales o color cian/teal.

### 4.1 Escala tipográfica (web, base 16 px, ratio ~1.25)

| Token | Desktop | Mobile | Familia | Line-height | Uso |
|---|---|---|---|---|---|
| `display` | 64 px | 40 px | Questrial | 1.05 | Hero ("Somos APROS") |
| `h1` | 48 px | 34 px | Questrial | 1.1 | Título de página |
| `h2` | 36 px | 28 px | Questrial | 1.2 | Título de sección |
| `h3` | 24 px | 20 px | Questrial | 1.3 | Cards, subsecciones |
| `h4` | 18 px | 17 px | Roboto 500 | 1.4 | Labels de bloque |
| `body-lg` | 18 px | 17 px | Roboto 400 | 1.6 | Intro, lead |
| `body` | 16 px | 16 px | Roboto 400 | 1.6 | Texto general |
| `small` | 14 px | 14 px | Roboto 400 | 1.5 | Notas, legales |
| `overline` | 12 px | 12 px | Roboto 500, MAYÚSCULAS, tracking +0.12em | 1.4 | Eyebrows, tags |
| `kpi` | 56 px | 40 px | Questrial | 1 | Cifras (2011 · +7856 · 100%) |

### 4.2 Escala para decks (16:9, 13.33 × 7.5 in)
| Rol | Tamaño |
|---|---|
| Título de portada | 40–48 pt Questrial |
| Título de slide | 28–32 pt Questrial |
| Subtítulo / lead | 16–18 pt Roboto Light |
| Cuerpo | 12–14 pt Roboto |
| Footer ("Identidad de marca" + nº página, estilo manual) | 10–11 pt Roboto |

---

## 5. Layout y espaciado

### 5.1 Grid
- **Web:** contenedor máx. 1200 px, 12 columnas, gutter 24 px, márgenes laterales 24 px (desktop) / 16 px (mobile).
- **Decks / documentos (estilo manual):** margen generoso (~7% del ancho), título de sección en columna izquierda + separador vertical fino + contenido a la derecha; línea horizontal fina sobre el footer con nombre de sección a la izquierda y número de página en bold a la derecha.

### 5.2 Escala de espaciado (base 4 px)
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`

| Token | Valor | Uso típico |
|---|---|---|
| `--space-xs` | 8 px | Ícono–texto |
| `--space-sm` | 16 px | Interno de componentes |
| `--space-md` | 24 px | Padding de cards |
| `--space-lg` | 48 px | Entre bloques |
| `--space-xl` | 96 px | Entre secciones (desktop) |

### 5.3 Radios y sombras
```css
--radius-sm: 8px;    /* inputs, tags */
--radius-md: 16px;   /* cards */
--radius-lg: 24px;   /* contenedores destacados, imágenes */
--radius-pill: 999px;/* botones, chips (eco de los trazos redondeados del check) */

--shadow-card: 0 8px 24px rgba(7, 9, 38, .08);
--shadow-glow: 0 0 32px rgba(0, 206, 255, .35);  /* solo hover de CTA en fondo navy */
```

---

## 6. Elementos gráficos

- **Glows difusos:** formas triangulares desenfocadas en azul o teal (como en págs. 05 y 12 del manual), ubicadas en esquinas, nunca detrás de texto largo.
- **Triángulo:** forma madre del isotipo; puede usarse como máscara de imagen o recurso decorativo a baja opacidad (5–10%).
- **Check:** recurso para listas de beneficios, estados completados y confirmaciones.
- **Marquee:** banda en movimiento con el claim "HACEMOS TU PRESENCIA DIGITAL MEMORABLE Y RELEVANTE •" (patrón vigente en apros.pe).
- **Iconografía:** línea (outline) de trazo 1.5–2 px, esquinas redondeadas, monocromo en cian sobre navy o en navy/azul sobre blanco. Sin íconos rellenos multicolor.
- **Fotografía / mockups:** pantallas de proyectos reales (casos de éxito) sobre fondos limpios; personas trabajando con tecnología, luz natural, sin stock genérico de "apretón de manos".

---

## 7. Componentes (referencia apros.pe)

### 7.1 Botones
| Tipo | Fondo | Texto | Borde | Hover |
|---|---|---|---|---|
| **Primario** | `#0054FC` | Blanco, Roboto 500 | — | `#232391` o gradiente check + `shadow-glow` |
| **Secundario** | Transparente | `#070926` / Blanco en navy | 1.5 px mismo color del texto | Fondo `#00CEFF` 10% |
| **Ghost / link** | — | `#0054FC` | — | Subrayado + flecha → |

Altura 48 px (44 mobile), padding horizontal 24–32 px, `radius-pill`.
**Copy de CTAs vigente:** "Conócenos más", "Saber más", "Ver artículos", "Ver experimentos", "Ver caso de éxito", "Ver más proyectos", "Contáctanos", "Necesito una auditoría", "Suscribirse".

### 7.2 Cards
- **Card de servicio/desafío:** pregunta en primera persona del cliente como título ("Siento que mi página web no genera resultados") + descripción + CTA en primera persona ("Necesito una auditoría"). Patrón clave de conversión del sitio.
- **Card de navegación** (Nosotros, Gestión de calidad, Novedades, Apros Lab): imagen superior `radius-lg`, H3, texto corto, link.
- **Card de caso de éxito:** número grande (01, 02, 03) + nombre del proyecto + 1–2 líneas de contexto + "Ver caso de éxito" + mockup.
- **Card de testimonio:** marca cliente (H3), cita, nombre + cargo, etiqueta "Lo que dicen nuestros clientes".

### 7.3 KPI / cifras
Número en Questrial `kpi`, color cian o teal sobre navy (azul sobre blanco), label en `overline` debajo.
Ej.: **2011** Innovando desde · **+7856** Optimizaciones web exitosas · **100%** Dedicación en cada entrega.

### 7.4 Formularios
- Inputs con `radius-sm`, borde `gray-200`, foco `#0054FC` 2 px.
- Placeholders tipo "Ingrese su nombre".
- Selector de país con bandera (+51 por defecto).
- Checkbox obligatorio de política de privacidad.
- Flujo en dos pasos: diagnóstico del problema (opciones) → "Conversemos en una reunión".

### 7.5 Header y footer
- **Header:** logo horizontal a la izquierda, "Servicios", "Productos" (→ apros.global), selector de idioma ES/EN, CTA "Contáctanos".
- **Footer:** fondo navy, logo blanco, redes (LinkedIn, Instagram @apros_global, Facebook), mapa de sitio, sello ISO 9001, Política de privacidad, Libro de Reclamaciones (obligatorio en Perú), "Powered by Apros Global".
- **Botón flotante WhatsApp** "Chatea con un consultor".

---

## 8. Voz y tono

**Tono:** Innovador y visionario + Inspirador y motivador, con la autoridad del Sabio.

**Directrices (manual):**
1. Frases cortas y directas.
2. Específico en descripciones y beneficios.
3. Lenguaje de optimismo y posibilidades.
4. Consistencia en todas las plataformas.

**Reglas operativas adicionales:**
- Hablar de **resultados y activos digitales**, no de "hacer webs".
- Usar la voz del cliente para nombrar el problema ("Siento que…", "Necesito…") y la voz de APROS para la solución ("Analizamos…", "Desarrollamos…").
- Tutear al cliente en web/redes; usar "usted" solo en documentos formales/contratos si el cliente lo requiere.
- Respaldar con prueba: cifras, ISO 9001, casos y testimonios.

| ✅ Sí | ❌ No |
|---|---|
| "Transformamos objetivos en soluciones digitales." | "Somos los mejores del mercado." |
| "Mejoramos rendimiento, seguridad y estabilidad de tu web." | "Hacemos de todo para tu web." |
| "Identificamos oportunidades en SEO, UX y performance." | Tecnicismos sin beneficio ("migramos el stack a PHP 8.3"). |

---

## 9. Aplicaciones

### 9.1 Decks comerciales / diagnósticos
- Portada navy con logo blanco y glow azul/teal en esquina.
- Slides de contenido alternando navy (impacto) y blanco (lectura densa).
- Estructura narrativa: hook diagnóstico → hallazgos → impacto → propuesta → niveles de servicio → CTA.
- Contraportada: gradiente blanco→teal con logo color centrado (como pág. final del manual).

### 9.2 Documentos (propuestas CS-XXXX, informes, manuales)
- Encabezado con logo horizontal color; footer con línea fina, nombre del documento y nº de página en bold.
- Títulos Questrial navy, cuerpo Roboto 11 pt, tablas con encabezado navy y filas alternas `gray-50`.

### 9.3 Excel / Gantt
- Encabezados navy `#070926` con texto blanco.
- Filas de categoría en gris `gray-200`.
- Barras: **azul `#0054FC` = APROS**, **naranja = cliente/externo**, **rojo = hitos** (estándar Gantt APROS).

### 9.4 Redes sociales
- Fondo navy con glows; titulares Questrial blancos; dato destacado en cian/teal.
- Isotipo como avatar; logotipo horizontal solo en piezas de cierre.

---

## 10. Design tokens (CSS listo para usar)

```css
:root {
  /* Marca */
  --apros-navy:   #070926;
  --apros-indigo: #232391;
  --apros-blue:   #0054FC;
  --apros-cyan:   #00CEFF;
  --apros-teal:   #15F2C6;
  --apros-white:  #FFFFFF;

  /* Neutros */
  --apros-gray-900: #1A1D3A;
  --apros-gray-600: #5B5F7A;
  --apros-gray-400: #A3A6BD;
  --apros-gray-200: #E3E5EF;
  --apros-gray-50:  #F5F7FC;

  /* Gradientes */
  --apros-gradient-check:  linear-gradient(135deg, #0054FC 0%, #00CEFF 50%, #15F2C6 100%);
  --apros-gradient-accent: linear-gradient(45deg, #00CEFF 0%, #15F2C6 100%);

  /* Tipografía */
  --apros-font-display: 'Questrial', 'Roboto', system-ui, sans-serif;
  --apros-font-body:    'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif;

  /* Radios */
  --radius-sm: 8px; --radius-md: 16px; --radius-lg: 24px; --radius-pill: 999px;

  /* Espaciado */
  --space-xs: 8px; --space-sm: 16px; --space-md: 24px; --space-lg: 48px; --space-xl: 96px;

  /* Semánticos */
  --color-bg: var(--apros-white);
  --color-text: var(--apros-navy);
  --color-text-muted: var(--apros-gray-600);
  --color-primary: var(--apros-blue);
  --color-accent: var(--apros-cyan);
}

[data-theme="dark"] {
  --color-bg: var(--apros-navy);
  --color-text: var(--apros-white);
  --color-text-muted: var(--apros-gray-400);
  --color-accent: var(--apros-teal);
}
```

```json
{
  "color": {
    "navy": "#070926", "indigo": "#232391", "blue": "#0054FC",
    "cyan": "#00CEFF", "teal": "#15F2C6", "white": "#FFFFFF"
  },
  "font": { "display": "Questrial", "body": "Roboto" },
  "radius": { "sm": 8, "md": 16, "lg": 24, "pill": 999 }
}
```

---

## 11. Checklist de QA de marca (antes de entregar cualquier pieza)

- [ ] Logo oficial (archivo, no recreado), versión correcta según fondo y con área de protección.
- [ ] Check del logo siempre en gradiente.
- [ ] Solo colores de la paleta oficial (+ neutros/semánticos de este documento).
- [ ] Azul en `#0054FC` (no el HEX erróneo del manual).
- [ ] Cian/teal nunca como texto sobre blanco.
- [ ] Questrial en títulos, Roboto en cuerpo.
- [ ] Gradiente ≤ 10% de la superficie.
- [ ] Copy: frases cortas, beneficio concreto, CTA claro.
- [ ] Contraste AA verificado en textos y botones.
- [ ] Footer con numeración (decks/documentos) y datos de contacto vigentes.

---

## 12. Pendientes de validación (riesgos de consistencia)

| # | Tema | Impacto | Acción sugerida |
|---|---|---|---|
| 1 | Errata HEX del azul en el manual (pág. 03) | Alto: piezas con azul incorrecto | Corregir manual a `#0054FC` |
| 2 | Tipografía de cuerpo (Roboto) no declarada explícitamente en el manual | Medio | Confirmar con Diseño y agregar sección tipográfica al manual |
| 3 | Párrafo de "Nuestra historia" duplicado en el manual (pág. 04) | Bajo (imagen de marca) | Corregir en próxima versión |
| 4 | Typo "neustra" en pág. 02 del manual | Bajo | Corregir |
| 5 | Inconsistencia de trayectoria: "más de 10 años" (manual) vs. "desde 2011" / "+15 años" (web) | Medio (credibilidad comercial) | Unificar un solo claim |
| 6 | Neutros y semánticos no existen en el manual | Medio | Aprobar los propuestos aquí o definir oficiales |
| 7 | Año del footer web "© 2025" | Bajo | Actualizar a dinámico |

---

*APROS · Hacemos tu presencia digital memorable y relevante.*
