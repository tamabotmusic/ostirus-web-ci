#!/bin/bash
# OsTIrus TI2 v0.9 — UI-only patch. The original native engine and ROM are never copied.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$DIR/files"
REQUIRED=(
  "server.py"
  "ui/index.html"
  "ui/app.js"
  "ui/style.css"
  "ui/ti2-precision.js"
  "ui/ti2-precision.css"
  "ui/ti2-controls-v09.js"
)
for file in "${REQUIRED[@]}"; do
  if [[ ! -f "$SRC/$file" ]]; then
    echo "ERROR: Paquete incompleto: falta $file. Descomprime todo el ZIP." >&2
    read -r -p "Pulsa Enter para cerrar... " || true
    exit 1
  fi
done
echo "OsTIrus TI2 v0.9 — controles físicos OSC / FILTER / VALUE"
echo "Cierra antes el Terminal que mantiene OsTIrus en ejecución."
echo "Esta actualización solo reemplaza archivos de interfaz y el servidor local."
echo "El motor bin/ostirus_native_host y el firmware privado no se tocan."
TARGET="$(osascript -e 'POSIX path of (choose folder with prompt "Selecciona tu carpeta OsTIrus_Web_Nativo que ya funciona")')" || exit 0
if [[ ! -f "$TARGET/server.py" || ! -d "$TARGET/ui" || ! -f "$TARGET/bin/ostirus_native_host" ]]; then
  echo "ERROR: la carpeta elegida no parece ser una instalación nativa de OsTIrus." >&2
  read -r -p "Pulsa Enter para cerrar... " || true
  exit 1
fi
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$TARGET/RESGUARDO_PANEL_v09_$STAMP"
mkdir -p "$BACKUP"
cp -p "$TARGET/server.py" "$BACKUP/server.py"
cp -R "$TARGET/ui" "$BACKUP/ui"
COMPLETED=0
rollback() {
  if [[ "$COMPLETED" -eq 0 ]]; then
    echo "Instalación interrumpida: restaurando archivos anteriores..." >&2
    cp -p "$BACKUP/server.py" "$TARGET/server.py" || true
    cp -R "$BACKUP/ui/." "$TARGET/ui/" || true
  fi
}
trap rollback ERR
cp -p "$SRC/server.py" "$TARGET/server.py"
cp -R "$SRC/ui/." "$TARGET/ui/"
COMPLETED=1
trap - ERR
echo
echo "Interfaz v0.9 instalada. Copia de seguridad: $BACKUP"
echo "No se ha modificado el ejecutable nativo ni ningún firmware."
echo "Abre de nuevo ABRIR_OSTIRUS_WEB.command y recarga el navegador (Cmd+Shift+R)."
echo "Para volver atrás: cierra OsTIrus y restaura server.py y la carpeta ui desde el RESGUARDO_PANEL_v09."
read -r -p "Pulsa Enter para cerrar... " || true
