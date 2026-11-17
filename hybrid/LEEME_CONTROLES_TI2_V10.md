# OsTIrus TI2 Desktop — v0.10: SHIFT como el hardware

**Versión experimental.** La v0.9 sigue siendo la última versión confirmada por el usuario. Esta actualización corrige un comportamiento que funcionaba en v0.9, pero **no era fiel al TI2 físico**.

## Cambio principal

En el Access Virus TI2, el encoder **VALUE 3** ajusta el parámetro situado encima en el LCD. La leyenda roja **PROGRAM** se activa con **SHIFT + VALUE 3**. En la v0.9, VALUE 3 cambiaba programas sin SHIFT; ahora se requiere SHIFT. Como todavía no existe navegación de menús real, VALUE 3 sin SHIFT no cambia el programa ni inventa valores de parámetros.

Cómo usarlo en la web:
- **Teclado del Mac:** mantén la tecla **Shift** y gira VALUE 3 con rueda/arrastre, o usa Shift+flechas cuando el encoder tenga el foco.
- **Botón SHIFT del panel:** mantén pulsado el botón mientras giras el encoder (pantalla táctil o ratón y teclado combinados).
- **Ratón solamente:** haz clic una vez en el botón SHIFT para preparar **un único gesto**; gira VALUE 3. SHIFT se desactiva automáticamente. Un segundo clic en SHIFT cancela la preparación. Este atajo de un solo gesto es una adaptación de interfaz, no un modo nuevo del firmware.
- **VALUE − y VALUE +** continúan cambiando de programa sin SHIFT, como en el TI2 cuando no hay un menú abierto.
- **OSC SELECT, FILTER SELECT, RESONANCE, ENV AMOUNT y envolventes** conservan el comportamiento de la v0.9. No se añaden CC no verificados.

## Por qué no activar todavía todos los botones

El hardware tiene modos, páginas, selección de bancos, LFO, FX, ARP y estado de programa. Un simple envío MIDI CC sin conocer el estado puede alterar el parámetro equivocado. Los LEDs actuales de OSC/FILTER representan **solo la selección local**; el motor nativo todavía no devuelve los valores reales de un patch. No se presentará esa simulación como paridad completa.

El inventario de funciones y las pruebas necesarias están en `reference/TI2_HARDWARE_PARITY_CONTRACT.md` de esta rama.

## Instalación de prueba (sin tocar la v0.9 original)

1. Cierra OsTIrus y conserva una copia de tu instalación v0.9 que ya funciona.
2. Descomprime el ZIP `OsTIrus_TI2_Controles_v10.zip`.
3. Ejecuta `INSTALAR_CONTROLES_TI2_V10.command` y selecciona la carpeta `OsTIrus_Web_Nativo`.
4. El instalador guarda `server.py` y `ui/` en `RESGUARDO_PANEL_v10_FECHA` y sustituye solo esos archivos.
5. Reabre `ABRIR_OSTIRUS_WEB.command` y recarga el navegador con **Cmd+Shift+R**.

**Para volver a v0.9:** cierra OsTIrus, restaura `server.py` y `ui/` desde el respaldo `RESGUARDO_PANEL_v10_FECHA`. No se modifica `bin/ostirus_native_host` ni la ROM.

## Comprobación breve

1. Gira VALUE 3 sin SHIFT. **No debe cambiar de programa.**
2. Haz clic en SHIFT y gira VALUE 3. **Debe cambiar de programa una vez**; el siguiente gesto sin SHIFT no debe hacerlo.
3. Mantén Shift en el teclado del Mac y gira VALUE 3. **Debe cambiar de programa.**
4. Prueba VALUE − y VALUE +. Deben seguir cambiando programas.
5. Prueba OSC 1/2 y FILTER 1/2 y escucha el sonido: deben conservar el funcionamiento de la v0.9.

Las pruebas automatizadas no sustituyen la validación con el DSP real en tu Mac.
