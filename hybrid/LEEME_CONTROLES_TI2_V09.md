# OsTIrus TI2 Desktop — v0.9 OSC/FILTER/ENVELOPES (preview funcional)

**Base estable:** v0.8 aprobada por el usuario en Mac, con audio CoreAudio y cambios de programa. Esta rama NO reemplaza la estable ni distribuye firmware.

## Qué se activa sin modificar el diseño v0.7

- **OSC SELECT**: pulsar una vez selecciona localmente OSC 1, dos veces OSC 2, tres veces OSC 3, y vuelve a OSC 1. Los tres LEDs de selección reflejan **únicamente la selección hecha en la web**, no la configuración del firmware.
- **OSC 1/2, mandos compartidos**: WAVE (CC 17/22), WAVE SELECT (CC 19/24), SEMITONE (CC 20/25). DETUNE 2/3 se envía como CC 26 cuando se selecciona OSC 2.
- **OSC 3**: se puede seleccionar y ver su LED local, pero los mandos compartidos no envían CC al no existir mapeo directo equivalente en la tabla estándar consultada. Evita que al seleccionar OSC 3 se modifique OSC 1 por error. FM AMOUNT conserva CC 27 (parámetro OSC 2 FM).
- **FILTER SELECT**: pulsar el botón derecho o izquierdo para elegir filtro 1 o 2; **Mayúsculas (Shift) + clic** sobre el otro botón para seleccionar ambos (equivalente a pulsar simultáneamente los dos botones físicos).
- **RESONANCE y ENV AMOUNT**: en FILT 1 envían CC 42 y 44; en FILT 2 envían CC 43 y 45; con ambos seleccionados, envían ambos CC correspondientes.
- **CUTOFF, CUTOFF 2 y FILTER BALANCE**: conservan CC 40, 41 y 48. El resultado de CUTOFF 2 depende del estado interno de Cutoff Link del programa, que la web no puede leer.
- **Envolvente de filtro**: ATTACK 54, DECAY 55, SUSTAIN 56, RELEASE 58. **Envolvente de amplitud**: ATTACK 59, DECAY 60, SUSTAIN 61, RELEASE 63. Son los CC de la tabla de Virus TI.
- **VALUE −/+, VALUE 3, selector de programa y LCD**: siguen funcionando como en v0.8.
- **LEDs**: solo se iluminan los cinco LEDs de foco OSC/FILTER cuando los seleccionas en la web. Los LEDs de modo de filtro, LFO y otros parámetros **no afirman un estado del DSP**.

## Limitaciones deliberadas

1. Los valores de los knobs son valores enviados/recibidos **en esta sesión**, no lectura del patch interno. Después de cambiar programa se invalida la caché y se muestra una posición neutra ilustrativa.
2. El mando físico **WAVE SELECT/PW** envía Wave Select CC 19/24; no deduce si el firmware lo está usando como Pulsewidth (CC 18/23). Eso requiere conocer el modo de oscilador, aún no expuesto por el motor.
3. No se implementan SysEx, NRPN, menús de EDIT, bancos, modos de filtro, sincronía de LED con firmware ni edición real de OSC 3. Esos controles siguen visuales.
4. La v0.9 no altera la geometría, silkscreen, texturas ni 32 mandos / 43 teclas del frontal v0.7.

**Fuentes técnicas:** Access Virus TI2 Quickstart, apartados *Oscillator Section* y *Filter Section*, y *Access Virus TI MIDI Controller Chart*. Manual TI 2006 aportado por el usuario, apartado *Filters / Select*, para selección simultánea de ambos filtros. El mapeo CC coincide con el chart, pero el comportamiento del motor debe confirmarse en el Mac real.

## Instalar en macOS sin tocar audio ni firmware

1. Conserva tu carpeta `OsTIrus_Web_Nativo` actual que ya funciona con v0.8.
2. Descarga el artefacto `ostirus-ti2-v09-ui-only-no-rom` desde GitHub Actions, descomprime los ZIP y localiza `OsTIrus_TI2_Controles_v09`.
3. Cierra el Terminal de OsTIrus.
4. Abre `INSTALAR_CONTROLES_TI2_V09.command` y selecciona la carpeta `OsTIrus_Web_Nativo`.
5. El instalador guarda `server.py` y `ui/` en `RESGUARDO_PANEL_v09_FECHA`, y reemplaza solo esos archivos. **No copia ni cambia `bin/ostirus_native_host` ni la ROM privada**.
6. Reabre el mismo lanzador de siempre y recarga el navegador con **Cmd+Shift+R**.

## Prueba recomendada en tu Mac

1. Escoge un programa que conozcas. Comprueba que VALUE + y VALUE − siguen cambiando el sonido.
2. Pulsa OSC SELECT hasta OSC 1; gira WAVE. Luego selecciona OSC 2 y gira WAVE: debería actuar sobre otro oscilador. Comprueba que el LED rojo cambia de OSC 1 a OSC 2.
3. Selecciona OSC 3 y gira WAVE: **no debería modificar OSC 1 ni enviar un CC inventado**.
4. Pulsa FILTER SELECT izquierdo; gira RESONANCE. Pulsa derecho; gira RESONANCE. Prueba **Shift+clic izquierdo** para controlar ambos.
5. Prueba ATTACK/DECAY/SUSTAIN/RELEASE de cada envolvente. Escucha los cambios con notas sostenidas.
6. Comprueba que el audio sigue activo y el contador de errores no aumenta.

Si el sonido no responde como esperas en un programa, indica el número de programa, el mando y qué ocurre. No des por buena una función solo porque se ilumine un LED.

## Volver a v0.8

Cierra OsTIrus y restaura **toda** la carpeta `ui` y `server.py` desde `RESGUARDO_PANEL_v09_FECHA`, sustituyendo las versiones nuevas. Después reabre el lanzador. No hace falta reinstalar el motor.

**Estado:** preview experimental funcional; pruebas de navegador y de código sin ROM. Pendiente validación auditiva con el DSP real en Mac.
