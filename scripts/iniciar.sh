#!/usr/bin/env bash
# Levanta todo Radar APROS con un solo comando: base de datos, worker (lista de los lunes), versión personal (puerto 3000)
# y versión compartida para tus compañeros (puerto 3001). Se detiene todo con Ctrl + C.
set -u
cd "$(dirname "$0")/.."

if [ "${SKIP_DOCKER:-}" != "1" ]; then
  if ! docker info >/dev/null 2>&1; then echo "Docker no está abierto. Ábrelo (Docker Desktop) y vuelve a ejecutar este comando."; exit 1; fi
  docker compose up -d db >/dev/null
  echo "Base de datos lista."
fi

# El modo personal entra sin clave: solo se permite si lo activaste en .env
grep -q '^LOCAL_MODE=true' .env 2>/dev/null || echo "Aviso: agrega LOCAL_MODE=true a tu .env para entrar sin clave en tu Mac (si no, usarás tu correo y clave)."

IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')"
PIDS=()
run() { # run <etiqueta> <comando...>
  local tag="$1"; shift
  ( "$@" 2>&1 | sed -u "s/^/[$tag] /" ) &
  PIDS+=($!)
}
cleanup() { echo; echo "Deteniendo Radar APROS..."; pkill -P $$ 2>/dev/null; for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null; done; pkill -f "next dev" 2>/dev/null; pkill -f "scripts/worker.ts" 2>/dev/null; exit 0; }
trap cleanup INT TERM

run worker npm run --silent worker
run personal npm run --silent dev
run compartida npm run --silent share

# Evita que la Mac se duerma mientras esto corre (la corrida del lunes y tus compañeros lo necesitan)
command -v caffeinate >/dev/null && { caffeinate -dims -w $$ & }

sleep 6
cat <<MSG

==============================================================
 Radar APROS está en marcha
   Tú (sin clave):        http://localhost:3000
   Tus compañeros (clave): http://${IP:-TU-IP}:3001
 Detener todo: Ctrl + C   |   La lista semanal corre los lunes 8:30
==============================================================
MSG
wait
