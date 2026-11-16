#!/usr/bin/env bash
set -euo pipefail
SNAPSHOT="${1:?Ruta al directorio gearmulator del archivo GPL}"
BUILD="${2:-build/mac-native}"
test -f "$SNAPSHOT/source/CMakeLists.txt"
cp native/ostirus_native_bridge.cpp "$SNAPSHOT/ostirus_native_bridge.cpp"
# El paquete GPL incluye un stub RmlUi INTERFACE, pero intenta PUBLIC en CMake.
# El objetivo OsTIrus es headless; ajustar el alcance sin eliminar dependencias.
python3 - "$SNAPSHOT/source/3rdparty/CMakeLists.txt" <<'PY'
from pathlib import Path
import sys
path=Path(sys.argv[1]); text=path.read_text()
old='target_include_directories(rmlui_core PUBLIC'
new='target_include_directories(rmlui_core INTERFACE'
if text.count(old)==1 and new not in text:
    path.write_text(text.replace(old,new,1))
elif new not in text:
    raise SystemExit('Configuración de RmlUi desconocida; abortando de forma segura')
PY
if ! grep -q 'Native OsTIrus hybrid bridge' "$SNAPSHOT/source/CMakeLists.txt"; then
  printf '\n# Native OsTIrus hybrid bridge\n' >> "$SNAPSHOT/source/CMakeLists.txt"
  cat native/native_bridge.cmake >> "$SNAPSHOT/source/CMakeLists.txt"
fi
cmake -S "$SNAPSHOT" -B "$BUILD" -G 'Unix Makefiles' \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_OSX_ARCHITECTURES=arm64 \
  -DCMAKE_OSX_DEPLOYMENT_TARGET=11.0 \
  -Dgearmulator_BUILD_JUCEPLUGIN=OFF -Dgearmulator_BUILD_JUCEPLUGIN_CLAP=OFF \
  -DASMJIT_NO_CUSTOM_FLAGS=ON
cmake --build "$BUILD" --target ostirus_native_bridge --parallel 4
file "$BUILD/source/ostirus_native_bridge"
