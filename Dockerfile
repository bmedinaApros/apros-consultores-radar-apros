# Imagen de producción de Radar APROS (multi-etapa, usuario sin privilegios).
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 radar && adduser --system --uid 1001 --ingroup radar radar
COPY --from=build --chown=radar:radar /app/.next/standalone ./
COPY --from=build --chown=radar:radar /app/.next/static ./.next/static
COPY --from=build --chown=radar:radar /app/public ./public
# Migraciones: se ejecutan con `node scripts/migrate.mjs up` usando MIGRATE_DATABASE_URL.
COPY --from=build --chown=radar:radar /app/migrations ./migrations
COPY --from=build --chown=radar:radar /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=build --chown=radar:radar /app/node_modules/node-pg-migrate ./node_modules/node-pg-migrate
USER radar
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

# Worker de trabajos en segundo plano (análisis web). Construir con: docker build --target worker .
FROM build AS worker
ENV NODE_ENV=production
USER node
CMD ["npx", "tsx", "scripts/worker.ts"]
