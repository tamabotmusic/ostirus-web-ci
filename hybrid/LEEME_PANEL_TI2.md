# OsTIrus TI2 Desktop — panel v0.6

## Qué cambia
Esta es una **actualización visual** del frontal TI2 Desktop, con una distribución más próxima al hardware físico:
- 32 mandos rotatorios y 42 pulsadores representados;
- Matrix, Modulators, Oscillators, Mixer y Filters en la fila superior;
- Effects a la izquierda, LCD y teclas de edición en el centro y Envelopes a la derecha;
- biseles, marcas de giro, LEDs, chasis de metal y rotulación compacta.

Los mandos MIDI CC que sí están conectados editan parámetros del **motor nativo real**. Los botones de hardware sin función MIDI aparecen como elementos físicos **sin interacción**. Las posiciones iniciales de los mandos no están sincronizadas con el patch cargado. La reproducción es todavía **una versión experimental de referencia**, no una réplica exacta al píxel.

## Cómo instalar sin perder la versión que ya suena
1. Conserva **una copia completa** de tu carpeta `OsTIrus_Web_Nativo` que funciona.
2. Descarga desde GitHub Actions el artefacto `ostirus-ti2-panel-v06-sin-rom` y descomprímelo.
3. Descomprime el ZIP interior `OsTIrus_Panel_TI2_v06.zip`.
4. **Cierra OsTIrus** (el Terminal que mantiene el servidor local activo).
5. Ejecuta `INSTALAR_PANEL_TI2.command` y selecciona la carpeta **OsTIrus_Web_Nativo** que ya suena.
6. El instalador crea una carpeta `RESGUARDO_PANEL_...` con copia de `ui/` y `server.py` antes de reemplazarlos.
7. Abre de nuevo `ABRIR_OSTIRUS_WEB.command`, selecciona tu ROM privada local y recarga Chrome con **Cmd + Shift + R**.

**No se copia, altera ni sustituye** `bin/ostirus_native_host`, la ROM o los archivos de audio. No requiere compilación nueva.

## Recuperar el panel anterior
Cierra OsTIrus, entra en la carpeta `RESGUARDO_PANEL_...` creada por el instalador y copia `server.py` y `ui/` a la carpeta `OsTIrus_Web_Nativo`, sustituyendo las versiones nuevas. Después vuelve a abrir el archivo de arranque.

## Qué revisar
- Observa la fidelidad de distribución frente al hardware TI2 Desktop original.
- Comprueba que sigue sonando y que se puede cambiar de patch desde el selector auxiliar.
- Prueba **un mando conectado** (por ejemplo Filter Cutoff); los botones físicos representados aún no son clicables.
- Comprueba el nivel de salida PCM y que el contador de errores siga en cero.

## Seguridad, código y derechos
Se distribuye exclusivamente HTML, CSS, JavaScript, Python y documentación. **No contiene ROM**, firmware ni motor binario. El nuevo diseño es código original y evita reproducir imágenes completas o logotipos comerciales. El motor original Gearmulator se mantiene local y está sujeto a su licencia GPL.

Referencias: manual de inicio rápido Virus TI2 Desktop y documentación MIDI CC; proyecto independiente no afiliado con Access Music.

## Próximas etapas
Comparación milimétrica por grupos de controles, dibujo preciso de posiciones y leyendas, e integración MIDI de botones individuales cuando conozcamos su comportamiento real. Posibilidad futura de editor para Virus TI físico, **fuera del alcance de la v0.6**.
