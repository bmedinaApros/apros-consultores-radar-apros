# Radar APROS

Aplicación web interna de APROS Consultores Digitales. Su propósito: **entregar cada semana una lista priorizada de empresas peruanas a las que APROS podría ofrecer sus servicios**, con la evidencia de cada hallazgo y la revisión de un consultor antes de que un vendedor la use.

Estado: **fase 4 de 8 (Puntaje y lista semanal)**. Incluye acceso con Google Workspace, roles, auditoría, importación CSV con deduplicación, lista de no contactar, clientes activos, rubros editables y el marco de fuentes. Analiza el sitio público de cada empresa y guarda señales con evidencia (ver `docs/ANALYZER.md`). Puntúa con modelos por rubro, sugiere servicios de APROS y arma cada semana una lista que una persona revisa (ver `docs/SCORING.md`). El diagnóstico llega en la fase 5. Ver `docs/PLAN.md`.

## Requisitos (Mac)

- Node 22 o superior
- Docker Desktop (solo para la base de datos) o un PostgreSQL 16 propio
- git

## Primer arranque

```bash
git clone https://github.com/bmedinaApros/apros-consultores-radar-apros.git
cd apros-consultores-radar-apros
git checkout feat/fase-1-fundaciones
npm ci
cp .env.example .env
```

Edita `.env` y reemplaza `SESSION_SECRET` por un valor aleatorio:

```bash
openssl rand -base64 48
```

Levanta la base de datos, aplica las migraciones y carga los usuarios ficticios:

```bash
docker compose up -d db
set -a && . ./.env && set +a
npm run db:migrate
npm run db:seed
```

Arranca la aplicación:

```bash
npm run dev
```

Abre http://localhost:3000. En local verás un **acceso de desarrollo** con cinco usuarios ficticios, uno por rol. Ese acceso no existe en producción (ver `docs/SECURITY.md`).

## Probar la importación

Con la aplicación corriendo y el acceso de desarrollo como administrador, ve a **Importar CSV** y sube `docs/ejemplos/empresas-demo.csv` (datos ficticios). Verás filas válidas, errores, un duplicado exacto y un posible duplicado que debes resolver antes de confirmar. Después puedes **Deshacer este lote**.

En **Fuentes** puedes aprobar los términos de la fuente simulada, activarla y ejecutar un descubrimiento de prueba.

## Probar el analizador

El análisis se ejecuta en segundo plano. En una terminal aparte, con la aplicación y la base de datos corriendo:

```bash
npm run worker
```

Luego abre una empresa con sitio web, pulsa **Analizar ahora** y recarga la ficha. Con las empresas ficticias (dominios `*.example.com`, que no existen) todas las señales saldrán **«No se pudo verificar»**: es el comportamiento correcto. Para ver señales reales, edita una empresa y pon el sitio de una empresa que tú elijas; el analizador solo lee páginas públicas, respeta `robots.txt` y se identifica como `RadarAPROS`.

En **Señales por rubro** (administrador) puedes agregar palabras clave propias de un rubro sin tocar código.

## Probar la lista semanal

Con `npm run dev` y `npm run worker` corriendo, entra como administrador:

1. Importa empresas con sitio web (**Importar CSV**) o activa la fuente simulada en **Fuentes**.
2. Ve a **Lista semanal** y pulsa **Ejecutar ahora**. El worker descubre, analiza (con presupuesto), puntúa y guarda la lista. También corre solo, por defecto los lunes a las 06:00 (hora de Lima).
3. Revisa cada empresa: **por qué** está, qué **servicios** podrían encajar (hipótesis) y aprueba, asigna a un vendedor o rechaza con motivo.
4. Entra como vendedor: solo ve lo aprobado que es suyo o está libre, en la lista y en la **Bandeja**.

En la ficha de cada empresa están el desglose del puntaje, los criterios manuales y el ajuste con motivo. **Los modelos y servicios cargados son un ejemplo**: edítalos en **Modelos de puntaje** y **Servicios de APROS**. Con los dominios ficticios (`*.example.com`) el análisis sale «no se pudo verificar» y no hay lista: usa sitios reales que tú elijas para ver resultados.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript estricto |
| `npm test` | Pruebas (necesitan PostgreSQL; ver abajo) |
| `npm run build` | Compilación de producción |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:seed` | Crea usuarios ficticios de desarrollo |
| `npm run worker` | Procesa los análisis en segundo plano (cola pg-boss) |
| `npm run audit:deps` | Falla ante vulnerabilidades altas o críticas |

Las pruebas usan la base `radar_test`. Con `docker compose up -d db` ya existe, con los roles `radar_owner` y `radar_app` de desarrollo. La base de pruebas se recrea en cada ejecución.

## Acceso con Google (cuando haya servidor)

1. Alguien con acceso administrador al Google Workspace de APROS crea un cliente OAuth en Google Cloud Console (tipo "Aplicación web").
2. URI de redirección autorizada: `https://<dominio-de-radar>/api/auth/google/callback`.
3. Define `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, `AUTH_ALLOWED_DOMAINS` e `INITIAL_ADMIN_EMAILS` en el entorno del servidor.
4. Deja `DEV_LOGIN_ENABLED=false` y `NODE_ENV=production`. La aplicación no arranca en producción con el acceso de desarrollo activo.

## Estructura

```
src/app          Páginas y rutas (Next.js App Router)
src/lib          Reglas de negocio: roles, sesiones, auditoría, usuarios
migrations       Migraciones SQL versionadas
tests            Pruebas (Vitest, contra PostgreSQL real)
docs             Plan, decisiones, metodología, marca y seguridad
assets/brand     Logotipos oficiales (no modificar)
```

## Marca

Los tokens de diseño están en `src/app/globals.css` y derivan de `docs/brand/design.md`. Falta el isotipo solo; no se usa hasta recibirlo. Las fuentes (Questrial y Roboto) se sirven localmente desde `@fontsource` (licencias SIL OFL y Apache 2.0).
