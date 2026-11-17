# OsTIrus TI2 Desktop — prueba funcional v0.8 (sin ROM)

## Qué cambia
Se conserva el frontal v0.7 aprobado: **32 mandos, 43 teclas físicas visibles**, posición, acabados y rótulos. Esta versión solo incorpora la primera capa funcional:

- **VALUE − y VALUE +**, a la derecha de la pantalla, cambian el programa anterior/siguiente.
- **VALUE 3 / PROGRAM** permite cambiar de programa con rueda, arrastre vertical (aplicación al soltar) o teclado. La rotación visual solo se sincroniza después de que el usuario cambie el programa, para preservar la apariencia de reposo de v0.7.
- El selector auxiliar de programas y el LCD reflejan el mismo número (001–128) y se envía un único Program Change por acción. El motor recibe el programa MIDI 0–127.
- Los otros botones físicos siguen **sin función**. No se han inventado CC ni SysEx; los LED no simulan un estado leído del firmware.
- No se ha modificado el motor nativo, la reproducción CoreAudio, ni el protocolo del servidor: solo se ha autorizado el nuevo archivo JavaScript local.

**Limitación:** la pantalla refleja el programa seleccionado por esta interfaz, no una lectura del patch real del DSP. El programa se cambia dentro del banco/parte que ya esté seleccionado; no se implementa navegación por bancos ni partes.

## Instalación reversible en Mac
1. Conserva una copia completa de la carpeta **OsTIrus_Web_Nativo** que ya funciona.
2. Descarga el artefacto experimental **ostirus-ti2-v08-ui-only-no-rom** desde GitHub Actions de la rama `feature/ti2-controls-v08`.
3. Descomprime el ZIP exterior y, si existe, el ZIP interior. Debe aparecer `OsTIrus_TI2_Controles_v08` con `files/` y `INSTALAR_CONTROLES_TI2_V08.command`.
4. Cierra OsTIrus y su Terminal.
5. Abre `INSTALAR_CONTROLES_TI2_V08.command` y elige la carpeta **OsTIrus_Web_Nativo** que ya reproduce audio.
6. Se guardará una copia de `server.py` y `ui/` en `RESGUARDO_PANEL_v08_FECHA`. No se toca `bin/ostirus_native_host` ni se copia el firmware.
7. Abre tu `ABRIR_OSTIRUS_WEB.command` habitual, elige tu firmware privado local y recarga la web con **Cmd+Shift+R**.

Si macOS impide abrir el `.command` por ser un script descargado, comprueba su contenido y origen antes de autorizarlo. No es necesario instalar software externo.

## Comprobaciones en el Mac
- Con el sintetizador sonando, pulsa VALUE + una vez: el LCD debe pasar de PROGRAM 001 a PROGRAM 002 (si el selector auxiliar estaba en 001), y debe escucharse el nuevo programa cuando corresponda.
- Pulsa VALUE −: el LCD y el selector deben volver al número anterior.
- Gira VALUE 3 con la rueda del ratón; prueba también las flechas del teclado después de enfocar el mando.
- Cambia un programa desde el selector auxiliar y comprueba que LCD y VALUE 3 se actualizan.
- Comprueba que el audio sigue sonando, que aumentan los bloques y que el contador de errores no crece.

## Volver a la instalación anterior
1. Cierra OsTIrus.
2. En `OsTIrus_Web_Nativo/RESGUARDO_PANEL_v08_FECHA` localiza `server.py` y `ui/`.
3. Copia `server.py` al directorio principal de `OsTIrus_Web_Nativo`, sustituyendo el nuevo.
4. Sustituye la carpeta `ui` completa por la carpeta `ui` del respaldo (no la mezcles con la nueva).
5. Reabre OsTIrus.

## Seguridad y alcance
No incluye ROM, muestras, plugins de terceros ni binario del motor. El servidor sigue escuchando solo en `127.0.0.1`, con protección de origen y validación MIDI. Los controles no conectados permanecen inactivos hasta que se verifique su comportamiento contra la documentación oficial TI2 y el motor.

Estado: **preview funcional para prueba local**, no una versión final del editor.
