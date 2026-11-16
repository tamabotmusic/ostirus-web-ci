#!/usr/bin/env bash
set -euo pipefail
SNAPSHOT="${1:?Ruta al directorio gearmulator del archivo GPL}"
BUILD="${2:-build/mac-native}"
test -f "$SNAPSHOT/source/CMakeLists.txt"
cp native/ostirus_native_bridge.cpp "$SNAPSHOT/ostirus_native_bridge.cpp"
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
