#!/bin/bash
# OsTIrus Web Nativo — ejecución local, sin Internet y sin subir firmware
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
HOST="$ROOT/bin/ostirus_native_host"
SERVER="$ROOT/server.py"

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: se necesita Python 3 para ejecutar el servidor local."
  read -r -p "Pulsa Enter para cerrar..."
  exit 1
fi
if [ ! -f "$HOST" ]; then
  echo "ERROR: no se encuentra el motor nativo. Usa el ZIP completo de GitHub Actions."
  read -r -p "Pulsa Enter para cerrar..."
  exit 1
fi
if [ ! -f "$SERVER" ]; then
  echo "ERROR: faltan los archivos del panel OsTIrus Web."
  read -r -p "Pulsa Enter para cerrar..."
  exit 1
fi
chmod +x "$HOST"
echo "OsTIrus Web — Motor nativo TI2 / CoreAudio"
echo "Selecciona TU archivo local de firmware Virus TI. No será enviado a ningún servidor."
if ! ROM="$(osascript -e 'POSIX path of (choose file with prompt "Selecciona tu firmware Access Virus TI.bin")')"; then
  echo "Selección cancelada. No se ha iniciado el motor."
  exit 0
fi
if [ ! -f "$ROM" ]; then
  echo "ERROR: el firmware seleccionado no existe."
  exit 1
fi

cd "$ROOT"
echo "Iniciando motor local en http://127.0.0.1:8088/"
python3 "$SERVER" --engine "$HOST" --rom "$ROM" --port 8088 &
PID=$!
cleanup() {
  kill "$PID" 2>/dev/null || true
  wait "$PID" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 0' INT TERM
sleep 2
if ! kill -0 "$PID" 2>/dev/null; then
  echo "ERROR: el servidor no ha arrancado. Revisa los mensajes anteriores."
  read -r -p "Pulsa Enter para cerrar..."
  exit 1
fi
open "http://127.0.0.1:8088/"
echo "La web está abierta. Mantén este Terminal activo y pulsa Ctrl+C para cerrar OsTIrus."
wait "$PID" || true
