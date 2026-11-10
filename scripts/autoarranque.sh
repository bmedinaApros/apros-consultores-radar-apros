#!/usr/bin/env bash
# Arranque automático de Radar APROS al iniciar sesión en la Mac (macOS, LaunchAgent).
#   bash scripts/autoarranque.sh instalar   → desde el próximo inicio de sesión se levanta solo
#   bash scripts/autoarranque.sh quitar     → vuelve al arranque manual
#   bash scripts/autoarranque.sh estado
set -eu
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
LABEL="pe.apros.radar"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/radar-apros.log"
UID_="$(id -u)"

[ "$(uname)" = "Darwin" ] || { echo "Este arranque automático es solo para macOS."; exit 1; }
NODE_DIR="$(dirname "$(command -v node)")"

case "${1:-}" in
  instalar)
    mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
    cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$ROOT/scripts/iniciar.sh</string></array>
  <key>WorkingDirectory</key><string>$ROOT</string>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>$NODE_DIR:/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><false/>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLIST
    launchctl bootout "gui/$UID_/$LABEL" 2>/dev/null || true
    launchctl bootstrap "gui/$UID_" "$PLIST"
    echo "Listo. Radar APROS se levantará solo cada vez que inicies sesión en esta Mac."
    echo "Registro: $LOG   (para verlo: tail -f \"$LOG\")"
    echo "Recuerda: Docker Desktop se abre solo, y la Mac debe estar encendida con tu sesión iniciada."
    ;;
  quitar)
    launchctl bootout "gui/$UID_/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "Arranque automático desactivado."
    ;;
  estado)
    if [ -f "$PLIST" ]; then echo "Instalado: $PLIST"; launchctl print "gui/$UID_/$LABEL" 2>/dev/null | grep -E "state|last exit" || true; else echo "No está instalado."; fi
    ;;
  *) echo "Uso: bash scripts/autoarranque.sh instalar | quitar | estado"; exit 2 ;;
esac
