# OsTIrus v0.14 — emblema luminoso del TI2 sincronizado con el DSP

**Estado: experimental.** Punto de recuperación: v0.09. La v0.13 quedó validada por el usuario en Mac para los LED LFO 1, 2 y 3 el 18/11/2026. La v0.14 requiere su propia prueba real.

## Cambio verificable

Gearmulator incluye el valor `FrontpanelState.m_logo` en la misma lectura de DSP ya expuesta como `/api/status.dspFrontpanel.logoLedLevel` en la v0.12. Para la familia Virus TI distinta de Snow, Gearmulator deriva el valor del temporizador del segundo DSP y lo normaliza con los límites 0.963654..1. Es una señal PWM **inversa**: cuanto más cercano a 0, mayor luminosidad.

En la v0.14, esa señal modula **solamente el emblema luminoso ya dibujado en la banda vertical MIXER**, en las coordenadas aprobadas (x=1057, y=379). No se crea un LED nuevo ni se cambia su forma, texto, posición, color de reposo o estructura de la interfaz. Se usa la curva de brillo `(1 - level)^0.2` aplicada a los tres indicadores LFO de la v0.13, respetando la inversión PWM.

El emblema conserva el mismo color y opacidad de reposo si el servidor no entrega datos, la lectura ha caducado, carece de procedencia `dsp-frontpanel`, el número de revisión no es válido o el nivel no es finito.

**Fuente de implementación:** Gearmulator, `source/axel/virusLib/device.cpp` (`m_frontpanelStateDSP.m_logo`, lectura de temporizador) y `source/axel/virusLib/frontpanelState.cpp` (serialización). El valor es luminosidad PWM, **no nivel de audio, valor de patch ni lectura de parámetros**.

## Exclusiones deliberadas por paridad hardware

- **No animar BPM.** En Gearmulator, `m_bpm` se calcula explícitamente para Snow, pero no para la rama TI/TI2 no Snow; en las capturas reales del usuario el campo vale 0. Animarlo como si fuese el tempo del hardware sería engañoso.
- No encender LEDs de filtro, ARP, efectos, matriz ni modo Single/Multi: no existe readback confirmado de esos estados.
- No modificar el motor nativo, el parser, el protocolo MIDI ni la ROM.
- No interpretar el nivel del emblema como detección del tempo. El logo puede tener brillo continuo o pulsos dependiendo del programa y la configuración interna.

## Test de aceptación en Mac

1. Abrir la v0.14 **en carpeta separada** de la v0.13/v0.09, usando firmware local.
2. Confirmar que los LED LFO 1, 2, 3 siguen variando y que el sonido/MIDI funciona.
3. Mirar el emblema `✧` de la banda MIXER durante varios segundos. Comprobar si su brillo **cambia** con el tiempo; no deducir una velocidad de parpadeo antes de probar.
4. Comprobar `/api/status`: `dspFrontpanel.logoLedLevel` se recibe fresco y `audioErrors=0`.
5. Si falla la comunicación o se detiene el motor, el emblema debe volver al color neutro. No hace falta simularlo cortando deliberadamente CoreAudio durante la primera prueba.
6. Comunicar si el brillo del emblema varía, permanece fijo o se ve demasiado intenso. Una captura estática solo verifica presencia, no animación.

**Condición de aprobación:** pruebas automatizadas + resultado auditivo/visual en Mac. La v0.14 no se considera equivalente a todo el hardware TI2; solo añade un indicador DSP verificable.

## Distribución experimental

El build Apple Silicon se genera en GitHub Actions mediante el flujo `OsTIrus Native macOS (sin firmware)`. El archivo ZIP incluye el servidor, todos los scripts del frontal y un ejecutable nativo reconstruido sin ROM. Instalarlo solo en una carpeta separada, nunca encima de la v0.09 o la v0.13 confirmada.
