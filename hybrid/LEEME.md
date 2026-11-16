# OsTIrus Web Nativo — prueba de integración para macOS

**Estado experimental.** El motor nativo TI2 compila en GitHub Actions, pero no se ha confirmado su salida de audio en el Mac del usuario. No se distribuye firmware.

## Qué incluye el paquete

- `bin/ostirus_native_host`: motor original Gearmulator compilado para macOS / Apple Silicon, sin ROM.
- `server.py`: servidor Python estándar que acepta MIDI solo en `127.0.0.1`.
- `ui/`: panel del navegador: notas, programas, MIDI externo, actividad del motor y nivel PCM.
- `ABRIR_OSTIRUS_WEB.command`: selecciona el firmware local con un diálogo de Finder y abre el panel.

## Cómo arrancar en el Mac

1. Descomprime el archivo **interior** `OsTIrus_Web_Nativo.zip` que aparece en los artefactos de GitHub Actions.
2. En Finder, abre `OsTIrus_Web_Nativo/ABRIR_OSTIRUS_WEB.command`.
3. Selecciona tu propio archivo `Access Virus TI.bin` en el diálogo. **No lo copies dentro del paquete ni a GitHub.**
4. Se abrirá `http://127.0.0.1:8088/`. El sonido lo reproduce CoreAudio; el navegador solo manda MIDI.
5. Si no hay señal, comprueba el contador de bloques, la respuesta de telemetría y el indicador dBFS antes de cambiar programas.
6. Para cerrar, detén el Terminal que abrió OsTIrus.

El ejecutable es experimental y puede carecer de firma/notarización de Apple. macOS puede pedir autorización para abrirlo. Revisa el origen antes de aprobar cualquier programa.

**Privacidad:** el firmware nunca se publica, se envía ni se copia desde la interfaz web; solo lo lee en disco el motor local. No hay servicios externos ni bibliotecas CDN. El servidor solo escucha `127.0.0.1` y restringe los mensajes MIDI a valores numéricos válidos. Si tienes ya un servicio en el puerto 8088, ciérralo antes.

**Límite importante:** que aparezca «CoreAudio activo» no prueba que el firmware haya arrancado. Solo un pico PCM medido distinto de cero confirma que la salida del motor contiene sonido, y la escucha en el Mac confirmará que llega a los altavoces.

## Licencias

Código del emulador derivado de Gearmulator: GPL-3.0, bajo las licencias del proyecto original. Código fuente editable del host incluido en este repositorio público. Proyecto independiente sin afiliación con Access Music.
