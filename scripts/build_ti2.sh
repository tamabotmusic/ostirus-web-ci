#!/usr/bin/env bash
# Solo ejecuta CMake. Emscripten debe estar activo. No se necesita una ROM.
set -euo pipefail
SOURCE="${1:?Uso: scripts/build_ti2.sh ruta/gearmulator [ruta-build]}"
BUILD="${2:-build/wasm}"
command -v emcmake >/dev/null || { echo "Falta emcmake (Emscripten 5.0.4)" >&2; exit 1; }
emcmake cmake -S "$SOURCE" -B "$BUILD" -G 'Unix Makefiles' \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_STANDARD=17 \
  -DASMJIT_NO_JIT=ON \
  -DASMJIT_NO_CUSTOM_FLAGS=ON \
  -Dgearmulator_BUILD_JUCEPLUGIN=OFF \
  -Dgearmulator_BUILD_JUCEPLUGIN_CLAP=OFF \
  -DSYNTHLIB_DEMO_MODE=OFF
cmake --build "$BUILD" --target ostirus_engine --parallel "${JOBS:-4}"
test -s "$BUILD/source/wasmApi/ostirus_engine.wasm"
test -s "$BUILD/source/wasmApi/ostirus_engine.js"
sha256sum "$BUILD/source/wasmApi/ostirus_engine.wasm"
echo "Compilación verificada (no implica que el firmware arranque ni que genere sonido)."
