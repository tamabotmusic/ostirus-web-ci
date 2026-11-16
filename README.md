# OsTIrus Web — CI de compilación pública (sin ROM)

Repositorio público que contiene **únicamente infraestructura y pruebas** para reconstruir el motor libre de Gearmulator / OsTIrus Web TI2. El desarrollo y las sesiones con firmware permanecen fuera de este repositorio.

## Qué contiene

- `scripts/fetch_ucor_source.py`: descarga el paquete de código fuente GPL publicado por μcor y **verifica SHA-256**.
- `scripts/prepare_ti2.py`: cambia la configuración a `DeviceModel::TI2` y aplica la corrección de arranque incluida en el archivo fuente.
- `scripts/build_ti2.sh`: construye `ostirus_engine.{js,wasm}` con Emscripten 5.0.4.
- `tests/test_source_pipeline.py`: pruebas sin ROM.
- `.github/workflows/ci.yml`: pruebas automáticas y compilación experimental ejecutada bajo demanda.

## Estado

**No hay sonido real confirmado ni emulación funcional validada**. La compilación exitosa de WebAssembly **no confirma** que el firmware arranque, que el DSP termine sus bloques o que el sintetizador emita audio. El diagnóstico local anterior registra entrada a `gmr_process` sin respuesta.

## Seguridad

**NO SUBIR NUNCA** ROM, firmware, `.bin`, sysex, presets privados, datos personales ni material propietario. No introducir secretos de GitHub Actions que contengan ROM. Los usuarios deben aportar su firmware legítimo de manera local, y este repositorio no lo solicita.

Código del emulador: [dsp56300/Gearmulator](https://github.com/dsp56300/gearmulator). Paquete fuente GPL y licencia: [μcor](https://ucor.net/licenses.html). Las obras derivadas del motor se rigen por GPL-3.0 y las demás licencias de los componentes. No hay afiliación con Access Music.

## Primera compilación de prueba

La ejecución de compilación se inicia deliberadamente mediante un mensaje de commit que contenga `[build-wasm]` o el control `Run workflow` de GitHub. Esta compilación **no ejecuta una ROM** ni prueba la generación de sonido; solo verifica que el motor original modificado puede compilarse con Emscripten.

## Fase experimental: tiempo de respuesta DSP

El script `scripts/patch_wasm_runtime.py` aplica guardas transaccionales y repetibles sobre las fuentes GPL de μcor. Para el TI2, limita a 8192 pares de instrucciones DSP por bloque, evita leer colas de salida vacías, previene desbordamientos de entrada en el modo sin hilos y conserva los eventos MIDI de la API hasta el siguiente procesamiento.

**Es una prueba de aislamiento del bloqueo, no una garantía de sonido.** Aún falta una prueba privada de audio real con ROM aportada localmente y un análisis del coste por bloque; la API pública de compilación no contiene la ROM.

## Diagnóstico 16-11-2026 (firmware privado, NO publicado)

El motor con guardas y colas nuevas compila y se instancia en Node.js. La prueba local con firmware aportado privadamente por el usuario **no recibió respuesta de `gmr_load_rom` dentro de 55 segundos**. Por ello no se ejecutó aún ningún bloque de audio real. Esto puede ser un arranque excepcionalmente lento o un bloqueo: necesita instrumentación para distinguirlos. No se adjunta firmware ni su contenido.

Se añade `scripts/smoke_wasm_node.cjs` a la CI: crea una instancia y verifica que `gmr_process` sin ROM responde `-1`. Su opción `--rom` es solo local, utiliza un Worker con plazo limitado y no imprime ni envía el firmware. **No usar `--rom` en Actions.**

## Nuevo motor híbrido para macOS Apple Silicon

Se ha validado el núcleo TI2 nativo en Linux con una ROM disponible **exclusivamente en un entorno privado**: 153600 frames a 44100 Hz, pico estéreo 0.654, RMS 0.079 y más de 242000 muestras activas; procesó 3.48 segundos de señal en 2.25 segundos de DSP, antes de salida a un dispositivo físico.

Se ha añadido `native/ostirus_native_bridge.cpp` con entrada MIDI por stdin, salida de audio mediante PortAudio/CoreAudio y prueba `--probe` sin tarjeta de sonido. El binario macOS arm64 se construye en CI **sin ROM**. **La reproducción en macOS todavía debe verificarse**: compilar no equivale a ejecutar con un dispositivo real.
