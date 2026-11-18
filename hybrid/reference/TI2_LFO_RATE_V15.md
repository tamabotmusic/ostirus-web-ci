# OsTIrus TI2 v0.15 — Selección LFO y RATE contextual

**Base:** v0.13 validada por el usuario. Se ha excluido **por completo** la iluminación ornamental del logotipo de la rama v0.14, descartada tras su prueba. No hay cambios en el motor nativo, la ROM ni la geometría del panel v0.7.

## Comportamiento implementado

| Control físico | Función confirmada | Implementación v0.15 |
|---|---|---|
| LFO 1 SELECT | Selecciona LFO 1; RATE afecta al LFO 1 | RATE envía CC **67** |
| LFO 2 SELECT | Selecciona LFO 2; RATE afecta al LFO 2 | RATE envía CC **79** |
| LFO 3 SELECT | Selecciona LFO 3; RATE afecta al LFO 3 | RATE **deshabilitado** al faltar CC directo verificado |
| Repetir LFO SELECT | El hardware abre páginas de destinos | Muestra aviso de pendiente; **no simula** la página |
| LFO 1, 2, 3 LED | Modulación/indicador de hardware | Conserva la animación por **fases DSP reales de la v0.13**, sin cambios de cálculo |
| Oscillators / Filters | Enrutamiento CC local | Conserva todos los controles de la v0.13 |

La selección visible es una indicación local en el texto bajo el panel y mediante accesibilidad del botón. Los tres LED LFO **no** representan el LFO seleccionado: siguen usando únicamente los paquetes DSP reales.

El arranque conserva el RATE LFO 1 de la v0.13 hasta que el usuario selecciona un LFO. Esto **no implica** que el firmware tenga LFO 1 seleccionado: todavía no existe readback del foco del hardware.

## Referencias técnicas

- Manual del usuario **Virus TI** (2006), sección *The Modulators Section*, describe los tres SELECT y su relación con el knob RATE; también señala que pulsaciones sucesivas sobre el LFO seleccionado abren páginas de destinos.
- **Access Virus TI MIDI Controller Chart**: LFO 1 Rate CC 67, LFO 2 Rate CC 79; no contiene un CC simple documentado para LFO 3 Rate.
- Documentación TI2 Quickstart: mismo comportamiento general de foco LFO; debe verificarse en la prueba de Mac.

## Por qué no corregimos a ciegas los LED 1 y 2

El usuario indicó que la v0.13 hacía funcionar los tres LED, pero al probar la v0.14 solo apreciaba el LFO 3. **La rama v0.14 no cambió el código de los LED LFO.** Gearmulator envía fases que pueden estar cerca de 1 (estado oscuro del LED) o variar a distintas velocidades según programa. No hay evidencia suficiente de una regresión del renderizador y no se altera la función `pow(1 - phase, 0.2)` validada.

Para diagnosticarlo, comprobar el mismo programa en v0.13 y v0.15 y mirar si `lfoLedLevels[0]` y `[1]` varían en `/api/status` con el tiempo. Solo cambiaremos la animación después de identificar una discrepancia verificable.

## Prueba en Mac

1. Mantener las instalaciones v0.09 y v0.13 como copias recuperables. Abrir v0.15 desde su propia carpeta.
2. Seleccionar LFO 1, girar RATE y comprobar el efecto musical con un patch adecuado.
3. Seleccionar LFO 2, girar RATE y comprobar que afecta a otro LFO.
4. Seleccionar LFO 3: el knob RATE debe bloquearse y **no** enviar un CC inventado.
5. Confirmar que OSC, FILTER, VALUE, SHIFT, audio y LED DSP LFO 1–3 se comportan como en v0.13.

**Límite explícito:** no se ha implementado la lectura del estado interno, los destinos, las páginas LCD ni RATE de LFO 3. Esta versión no es todavía equivalente por completo al Virus TI2 Desktop.

## Distribución para la prueba

El paquete macOS se compila desde esta rama con el mismo host nativo y las dependencias locales del frontal. Se distribuye **sin firmware** y debe extraerse en una carpeta separada. La compilación no demuestra todavía equivalencia sonora; requiere validación auditiva en el Mac del usuario.
