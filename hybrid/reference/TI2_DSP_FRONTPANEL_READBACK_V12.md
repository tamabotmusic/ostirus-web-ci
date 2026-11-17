# OsTIrus TI2 — v0.12: lectura REAL de indicadores DSP, sin simular estado

**Rama experimental; no distribuir como sustituto de la v0.9 aprobada.**

## Qué datos entrega Gearmulator realmente

El snapshot público de Gearmulator emite un paquete `FrontpanelState` al procesar cada bloque. Este paquete representa **actividad MIDI por parte**, tres señales normalizadas de indicador LFO, indicador de BPM y logo. **No contiene** nombre de patch, banco, foco OSC/FILTER, páginas LCD ni todos los LEDs del hardware.

La v0.12 captura solo ese paquete mediante `virusLib::FrontpanelState::fromMidiEvent`, que comprueba la firma y la longitud del SysEx antes de decodificar. La captura ocurre **dentro del callback de audio**, inmediatamente después de `process`, y publica exclusivamente valores escalares a variables atómicas. No se guarda ni expone el SysEx.

## Protocolo local

El host ya admite `PING` desde `server.py`. En v0.12 añade una línea opcional a stderr si el motor ha emitido un paquete válido:

```text
[OSTIRUS_FRONT] revision=23 lfo1=0.2 lfo2=0.4 lfo3=0.8 bpm=0.3 logo=0.9 activity=3
```

El servidor valida una expresión regular de formato cerrado, rechaza valores no finitos, impide revisiones antiguas y devuelve únicamente en `GET /api/status`:

```json
{
  "dspFrontpanel": {
    "source": "dsp-frontpanel",
    "revision": 23,
    "lfoLedLevels": [0.2, 0.4, 0.8],
    "bpmLedLevel": 0.3,
    "logoLedLevel": 0.9,
    "midiActivityMask": 3,
    "ageSeconds": 0.5
  }
}
```

**Los valores de arriba son un ejemplo de protocolo para tests, NO una lectura real de la ROM del usuario.** El campo es `null` cuando el motor no lo ha proporcionado, se ha detenido o la lectura tiene más de tres segundos. Los datos proceden del motor DSP, no de un readback completo de firmware.

## Precauciones técnicas

- **Sin cambio de GUI:** todavía no encender LEDs ni mover knobs basándose en estos valores. Antes hay que confirmar que el `FrontpanelState` del snapshot fijado corresponde al LED LFO del TI2 real, y no interpretar una fase de PWM como posición de parámetro.
- **Sin `getState()` concurrente:** no se llama a la función que puede leer edit buffers mientras el DSP los modifica.
- **Sin trabajo de HTTP en audio:** callback solo valida el evento y escribe atomics; el hilo stdin envía una respuesta de texto cuando recibe el PING periódico.
- **Sin SysEx ni ROM en HTTP:** el navegador recibe solo seis números y una máscara de actividad, nunca el paquete original.
- **Límites:** la revisión es monotónica durante una ejecución. Los valores atómicos se leen independientemente y no constituyen una instantánea perfectamente sincronizada, lo cual es aceptable para **telemetría visual**, no para guardar patches.
- **Compilación y test:** el CI compila el host con el tarball fijado y ejecuta pruebas HTTP sin ROM. Una compilación verde NO demuestra equivalencia sonora ni comportamiento de los LEDs del hardware.

## Prueba posterior en Mac

Solo después de que la compilación y pruebas automáticas pasen, preparar un paquete separado para Mac. Con la ROM del usuario, comprobar que `dspFrontpanel` aparece con `source=dsp-frontpanel`, que la revisión crece, que LFO1/2/3 varían con presets apropiados y que el audio/Program Change se mantiene. Verificar errores CoreAudio y consumo de memoria en sesiones largas.

**Punto de recuperación:** instalación v0.9 del usuario. No sobrescribir hasta validación expresa.
