# Guía para el equipo (hackatón)

Radar APROS encuentra empresas peruanas en el padrón de SUNAT, revisa su presencia digital con información pública y arma cada lunes una lista priorizada de unas 50 empresas para contactar, con un informe de oportunidades digitales para cada una. Todo lo importante pasa por una persona antes de salir (aprobación humana).

## Repositorio

- **URL:** https://github.com/bmedinaApros/apros-consultores-radar-apros
- **Clonar:** `git clone https://github.com/bmedinaApros/apros-consultores-radar-apros.git`
- Rama principal: `main` (siempre pasa lint, tipos y pruebas).

## Requisitos

| Qué | Versión | Nota |
|---|---|---|
| Git | cualquiera | |
| Node.js | 22 o superior | probado con 22 y 26 |
| Docker Desktop | reciente | solo para la base de datos (PostgreSQL 16) |
| Sistema | macOS o Linux | En Windows, usar WSL2 (los scripts son `bash`) |

## Puesta en marcha (unos 10 minutos)

```bash
git clone https://github.com/bmedinaApros/apros-consultores-radar-apros.git
cd apros-consultores-radar-apros
npm ci
cp .env.example .env
```

1. En `.env`, completa `SESSION_SECRET` con un valor largo (mínimo 32 caracteres): `openssl rand -base64 48`. Lo demás ya viene listo para desarrollo.
2. Con Docker abierto, levanta la base y crea las tablas:
   ```bash
   docker compose up -d db
   npm run db:migrate
   npm run db:seed          # usuarios ficticios, uno por rol
   ```
3. **Datos de demostración** (todos inventados; no hace falta el padrón real de SUNAT):
   ```bash
   npm run registry:demo
   npm run registry:import -- --file padron_demo_ruc.txt --note "DEMO (datos inventados)"
   ```
4. Arranca la aplicación y abre http://localhost:3000:
   ```bash
   npm run dev
   ```
   En la pantalla de acceso verás el **acceso de desarrollo** con los usuarios ficticios (solo existe en desarrollo). Si prefieres entrar directo como administrador, agrega `LOCAL_MODE=true` a `.env` (nunca se permite en producción).
5. Para los análisis y la lista semanal (procesos en segundo plano), en otra terminal: `npm run worker`.

**Atajo:** `npm run iniciar` levanta base, worker, la versión personal (puerto 3000) y una versión compartida para el equipo (puerto 3001, con usuario y clave). Detalles en `docs/USO-EN-RED.md`.

## Pruebas y calidad

```bash
docker compose up -d db   # las pruebas usan la base radar_test (se recrea en cada corrida)
npm run typecheck
npm run lint
npm test                  # unas 550 pruebas contra PostgreSQL real
```

La integración continua (GitHub Actions) corre lo mismo más un escaneo de secretos (gitleaks) en cada PR.

## Mapa del código

| Dónde | Qué hay |
|---|---|
| `src/app/registry` | Buscador del padrón (pantalla de inicio), carga del padrón |
| `src/app/companies` | Empresas de la base, ficha, sitios por confirmar |
| `src/app/weekly`, `src/app/inbox` | Lista semanal y bandeja de revisión |
| `src/app/diagnostics` | Diagnósticos, revisión y exportación (PDF/PPTX/informe) |
| `src/app/admin` | Configuración: rubros, modelos de puntaje, usuarios, no contactar, auditoría |
| `src/lib/registry` | Lectura e importación del padrón (por bloques, reanudable), búsqueda, rubros sugeridos |
| `src/lib/companies` | Empresas, duplicados, no contactar, validación del sitio web, búsqueda automática del sitio |
| `src/lib/analyzer` | Lectura segura de sitios (anti-SSRF, `robots.txt`) y extracción de señales |
| `src/lib/scoring`, `src/lib/weekly` | Puntaje por rubro (versionado) y corrida semanal |
| `src/lib/diagnostics` | Diagnóstico por reglas o IA, validación, exportaciones |
| `src/lib/mcp` | Conector de solo consulta para Claude («Comité IA») |
| `src/lib/jobs`, `scripts/worker.ts` | Cola de trabajos (pg-boss) y worker |
| `migrations` | SQL versionado (cada archivo con `-- Up Migration` y `-- Down Migration`) |
| `docs` | Plan, decisiones (`DECISIONS.md`), seguridad, manual de uso |

Lee primero `docs/DECISIONS.md` (por qué se hizo cada cosa) y `docs/SECURITY.md`.

## Cómo trabajar

- Una rama por tema: `feat/<tema>`; abre un PR (en borrador hasta que pasen las pruebas). No se sube directo a `main`.
- Todo cambio con pruebas. Si agregas una migración, usa un número de archivo posterior a la última y los marcadores Up/Down.
- **No subas nunca:** `.env`, claves, el padrón real (la carpeta `data/` está ignorada), datos de personas.
- Si tu base local ya aplicó una migración de otra rama y falla el orden: `MIGRATE_NO_CHECK_ORDER=yes npm run db:migrate`.

## Reglas del producto que no se rompen

1. Solo información pública, leída con el descargador seguro y respetando `robots.txt`.
2. «No contactar» y clientes activos nunca se promueven ni se usan comercialmente.
3. Un diagnóstico no se exporta si no está aprobado por una persona, está desactualizado o tiene afirmaciones sin sustento.
4. Lo que dice una IA o una página web es dato, no instrucción: se valida antes de guardarlo.
5. Solo canales de contacto corporativos y públicos, siempre con su fuente (Ley 29733).

## Retos sugeridos para hoy

1. **Hallazgos desde cualquier IA.** Un bloque «para investigar» (prompt + tabla de la lista semanal) para pegar en Grok u otra IA, y una pantalla «Importar hallazgos» que valide lo que vuelva (sitio por RUC en la portada; contactos con formato y fuente). Reutiliza `proposeWebsite` (`src/lib/companies/discover-web.ts`); como referencia hay un PR en borrador con tabla de contactos y filtros: rama `feat/v2-grok-investigacion` (PR #24).
2. **Mejorar la tasa de acierto al encontrar el sitio de una empresa** (`domainCandidates` y `matchEvidence` en `discover-web.ts`): hoy acierta poco con nombres genéricos.
3. **Puntaje con nuevas señales** (`src/lib/scoring`): vigencia de las señales, pesos por rubro, versiones de modelo.
4. **Medios de contacto detectados en el sitio** (teléfono, WhatsApp, formulario): extraerlos en el analizador y mostrarlos en la ficha y la lista semanal.
5. **Despliegue en un servidor** con HTTPS, segundo factor de acceso y respaldo de la base (ver `docs/SECURITY.md`).
6. **Accesibilidad y experiencia:** revisar pantallas con teclado y lector de pantalla, y los estados vacíos.

## Qué no hay en el repositorio

El padrón real de SUNAT (más de 1 GB), claves y credenciales, y datos de personas. Para probar, usa los datos de demostración del paso 3.
