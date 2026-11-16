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
