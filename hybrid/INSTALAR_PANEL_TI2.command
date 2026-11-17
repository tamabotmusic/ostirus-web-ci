#!/bin/bash
# OsTIrus TI2 Desktop — instala SOLO la nueva interfaz, sin tocar motor ni ROM.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$DIR/files"
if [[ ! -f "$SRC/server.py" || ! -f "$SRC/ui/index.html" || ! -f "$SRC/ui/ti2-panel.js" ]]; then
  echo "Paquete incompleto: faltan archivos de la interfaz." >&2
  exit 1
fi
echo "OsTIrus — Panel TI2 Desktop (experimental)"
echo "Primero cierra el Terminal que está reproduciendo OsTIrus."
echo "El motor CoreAudio y el archivo ROM no se modificarán."
TARGET="$(osascript -e 'POSIX path of (choose folder with prompt "Selecciona la carpeta OsTIrus_Web_Nativo que YA FUNCIONA")')" || exit 0
if [[ ! -f "$TARGET/server.py" || ! -d "$TARGET/ui" || ! -f "$TARGET/bin/ostirus_native_host" ]]; then
  echo "Esta no es la carpeta OsTIrus_Web_Nativo válida. No se ha cambiado nada." >&2
  read -r -p "Pulsa Enter para cerrar... "
  exit 1
fi
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$TARGET/RESGUARDO_PANEL_$STAMP"
mkdir -p "$BACKUP"
cp "$TARGET/server.py" "$BACKUP/server.py"
cp -R "$TARGET/ui" "$BACKUP/ui"
cp "$SRC/server.py" "$TARGET/server.py"
cp "$SRC/ui/"* "$TARGET/ui/"
echo
echo "Panel instalado. Respaldo: $BACKUP"
echo "No se ha modificado bin/ostirus_native_host ni se ha tocado la ROM."
echo "Reabre ABRIR_OSTIRUS_WEB.command y refresca Chrome con Cmd+Shift+R."
read -r -p "Pulsa Enter para cerrar... "
