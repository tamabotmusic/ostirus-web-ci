# OsTIrus TI2 — experimento nativo v0.11: salida MIDI acotada

**No instalar todavía.** Rama experimental separada de la v0.9 confirmada por el usuario. No modifica ni reemplaza su instalación.

## Problema encontrado en Gearmulator

El motor `virusLib::Device::process` puede añadir eventos `FrontpanelState` a la lista de salida MIDI **cada bloque de audio**. El host nativo anterior pasaba el mismo `state.midiOut` persistente a `process` sin vaciarlo. En un directo largo, esto puede acumular eventos de forma indefinida y aumentar el consumo de memoria.

## Cambio mínimo

Dentro de `renderBlock`, en el **mismo hilo de audio** y justo antes de `process`, se ejecuta `state.midiOut.clear()`. Se conserva la capacidad reservada del vector, no se cambia el MIDI entrante ni se altera la síntesis. El host web actual **no utiliza** los eventos de salida, por lo que descartarlos antes del siguiente bloque mantiene el comportamiento funcional existente.

No se añade ninguna lectura de estado del DSP ni tráfico de red desde el callback. No se introducen `mutex` ni asignaciones adicionales en el camino de audio.

## Validación

- Pruebas estáticas verifican que `clear()` se ejecuta inmediatamente antes de `process()`, exactamente una vez, en el hilo de audio.
- Compilación nativa Apple Silicon sin ROM mediante CI.
- Pendiente: prueba de memoria en ejecución prolongada y escucha en Mac real antes de proponer actualizar el binario de la v0.9.
- Esta corrección **no** habilita por sí sola LEDs, LCD ni estado bidireccional. Esa fase necesita diseñar un buzón acotado de salida MIDI y sincronización segura.

**Objetivo:** asegurar que la futura implementación de feedback de hardware no herede un problema de memoria del host actual.
