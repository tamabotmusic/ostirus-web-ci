# OsTIrus — Panel TI2 Desktop v0.5 (primera maqueta funcional)

El objetivo es parecerse al **frontal físico del Virus TI2 Desktop**, no al antiguo plug-in Virus Control. Se utilizan fotografías del hardware y su disposición de secciones como referencia, recreando los mandos con CSS y JavaScript originales, sin integrar fotografías ni logotipos del fabricante.

## Distribución

- **Arriba:** volumen y arpegiador, matrix/modulators, osciladores 1/2, mixer, filtros 1/2.
- **Abajo:** efectos, LCD y navegación central, performance, envolventes de filtro y amplificador.
- **Debajo del chasis:** diagnóstico CoreAudio y teclado virtual auxiliar (el auténtico Desktop no tiene teclado).

Se han conectado **45 mandos** mediante Control Change del Virus TI. Fuente de referencia: https://midi.guide/d/access/virus-ti/ . Atribución CC BY-SA 4.0 para la tabla de referencia original. Los parámetros se envían al motor TI2 nativo que ya funciona en Mac.

## Funcionamiento y límites

- Arrastra un knob en vertical, usa rueda, flechas o Home/End. Doble clic: vuelve a la posición visual inicial.
- Los botones PREV / NEXT envían **Program Change** reutilizando el selector original y el mismo backend local.
- Las luces de matriz y arp que aún no estén conectadas son **únicamente indicadores visuales**: no se muestran como botones activos.
- Los valores iniciales visibles no se leen de la ROM ni del patch. Solo después de mover un mando se conoce el valor enviado por esa sesión. El LCD lo advierte. No se afirma que la posición física refleje el sonido actual antes de editarlo.
- Este panel es la **primera reproducción funcional del chasis**, no la versión final pixel a pixel: faltan elementos de navegación avanzados, botones con funciones multiplexadas, resolución de valores reales al cambiar patch y la edición de FX más profunda.

## Instalar sin recompilar (versión de prueba)

1. **Conserva una copia del OsTIrus Web Nativo que ya suena.**
2. Descarga de GitHub Actions el artefacto `ostirus-ti2-panel-preview`.
3. Descomprime el paquete interior `OsTIrus_Panel_TI2_Preview.zip`.
4. Cierra el OsTIrus anterior, ejecuta `INSTALAR_PANEL_TI2.command` y selecciona la carpeta de la versión que ya suena.
5. El instalador copia solo interfaz y servidor, dejando respaldo. **No modifica el motor nativo, CoreAudio ni la ROM**.
6. Reabre `ABRIR_OSTIRUS_WEB.command` y recarga Chrome con Cmd+Shift+R.

En caso de cualquier problema, para volver a la versión anterior sustituye `server.py` y la carpeta `ui/` por las que guardó el instalador en `RESGUARDO_PANEL_...`.

## Siguiente revisión

Comparación visual sistemática de la distribución, dimensiones, tipografía y posición de cada controlador frente a una fotografía frontal del hardware real. Después, sincronización bidireccional de parámetros (requiere decodificar estados del emulador). No subir ROM ni datos propietarios.
