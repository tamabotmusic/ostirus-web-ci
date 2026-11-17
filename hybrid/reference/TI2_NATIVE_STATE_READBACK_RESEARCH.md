# TI2: viabilidad real de lectura de estado del motor Gearmulator (investigación v0.10)

**Objetivo:** que LCD, LEDs y encoders se basen en el estado del sintetizador y no solo en el último CC enviado. **Este documento no activa un protocolo nuevo ni altera el motor v0.9.**

## Inspección de fuentes (17-11-2026)

Se inspeccionó tanto el Gearmulator público `dsp56300/gearmulator` como **el tarball exacto fijado en nuestro build**: `ucor-gearmulator-src-2026-10-07.tar.xz`. En el snapshot fijado, el código está en `source/virusLib/`; en upstream moderno, `source/axel/virusLib/`.

**Hallazgos confirmados en el código fuente:**

1. `virusLib::Device::getState(std::vector<uint8_t>&, synthLib::StateType)` está disponible (en el snapshot fijado condicionado por `#if !SYNTHLIB_DEMO_MODE`; el build usa `-DSYNTHLIB_DEMO_MODE=OFF`).
2. `Microcontroller::getState()` solicita internamente `REQUEST_ARRANGEMENT`, que genera dumps SysEx de los **edit buffers**: Single actual, Multi y partes. `StateTypeGlobal` añade bancos y ajustes globales; no usarlo para polling continuo.
3. `Microcontroller::sendSysex()` reconoce `REQUEST_CONTROLLER_DUMP` para una parte, generando CC de página A y poly pressure de página B desde el buffer actual. Es una vía para obtener **valores reales de parámetros**, sujeto a validación de modo y versión.
4. `Device::process()` añade un evento `FrontpanelState` a MIDI out **cada bloque**. Ese evento contiene actividad MIDI por parte, fases de los tres LFO y BPM/logo, **NO** nombres de patch, selección OSC/FILTER ni todos los LED del panel.
5. El host nativo actual declara `state.midiOut` como vector persistente y llama `process(..., state.midiOut)` sin vaciarlo. Como el motor añade al menos un evento por bloque, **puede crecer indefinidamente** en sesiones largas. Prioridad de corrección independiente en una futura compilación nativa, con pruebas de estabilidad y sin mezclarla con cambios de interfaz.

## Precaución de concurrencia específica del snapshot

La versión fijada de `Microcontroller::getState()` **no toma explícitamente `m_mutex`** en su implementación. En el upstream moderno sí se ve un bloqueo de `m_mutex` al inicio. **No se debe invocar `getState` desde el hilo HTTP ni a alta frecuencia en el motor fijado sin auditar sincronización**, porque el DSP y el hilo de audio modifican los buffers.

## Plan de implementación sin simular firmware

1. Corregir el crecimiento de `midiOut` en el host nativo: vaciar después de procesar cada bloque, separando eventos útiles para un buzón de tamaño limitado; no escribir en stderr/HTTP desde el callback de CoreAudio.
2. Implementar en una rama **nativa experimental independiente** una solicitud de estado de baja frecuencia y con bloqueo seguro. Considerar `REQUEST_CONTROLLER_DUMP` y `REQUEST_ARRANGEMENT` según su semántica real y la concurrencia de la versión fijada.
3. Parsear los dumps en el proceso local y devolver por `/api/state` **solo campos necesarios** (p. ej. nombre de patch, valores CC/params, modo y procedencia). Nunca exponer el SysEx completo, bytes de firmware ni rutas de la ROM al navegador.
4. Añadir `source: firmware|local|unknown`, `revision` y `timestamp`. El navegador debe distinguir valores confirmados del DSP frente a valores que él mismo acaba de mandar.
5. Invalidar cachés al cambiar programa, banco o modo; esperar readback nuevo antes de mostrar LED/valores reales. Los modos desconocidos dejan los encoders contextuales sin CC o con aviso.
6. Probar con ROM **solo local** y verificar memoria, callbackErrors, picos PCM, latencia de cambios de programa y exactitud de datos. Compilaciones CI sin ROM comprueban sintaxis/compilación, no audio real.

## No confundir

- `FrontpanelState` del emulador **no es una representación completa del panel físico**.
- `getState` es una vía de acceso a los buffers, no garantía de que la LCD o el LED real tengan esa misma selección en ese instante.
- El acceso a CC por MIDI no implementa automáticamente funciones SHIFT, navegación de menús, bancos, arpegiador o almacenamiento.
- La v0.10 **solo** corrige la semántica SHIFT + VALUE 3; el audio confirmado v0.9 permanece intacto.
