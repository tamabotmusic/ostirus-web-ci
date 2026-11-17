# Contrato de equivalencia con el hardware Access Virus TI2 Desktop

**Estado: objetivo obligatorio de producto.** El usuario confirmó el funcionamiento de la v0.9 en su Mac el 17-11-2026 y exige que la versión final se comporte igual que el hardware. No confundir una UI que envía CC con una emulación fiel del panel.

## Fuentes y precedencia

1. **Access Virus TI2 Series Quickstart** del fabricante (manuales oficiales: https://www.virus.info/support/manuals): fuente primaria de nombres, secuencias de botones, funciones SHIFT, menús y flujo del panel TI2.
2. **Foto frontal negra del TI2 Desktop del usuario**: autoridad para geometría, textos y disposición de teclas. No incluir la foto en GitHub.
3. **Access Virus TI User Manual (2006)** aportado por el usuario: documentación de detalle de parámetros, pero pertenece a una generación anterior (TI1); confirmar diferencias con TI2 antes de implementar.
4. **Tabla oficial MIDI Controller Chart del TI**: CC y rango exactos. Un CC no implica lectura del estado del DSP.
5. **Prueba con Gearmulator/OsTIrus nativo en el Mac del usuario**: autoridad para confirmar si el protocolo llega y modifica el sonido esperado. No inventar confirmaciones de firmware.

## Reglas de aceptación

- **Paridad de gestos:** una tecla hace lo mismo que en el hardware según modo, página, foco, SHIFT y simultaneidad; si no se puede implementar, permanece inactiva con una explicación. No usar un CC genérico como sustituto de una función de panel.
- **Paridad de sonido:** verificar auditivamente en el DSP real que los cambios producen el efecto correcto. Pasar pruebas de navegador no basta.
- **Paridad de estado:** LCD, LEDs, nombres de patch y posiciones de parámetros deben reflejar estados **leídos o confirmados**. El estado local se etiqueta como tal. No inferir el patch cargado a partir de una selección de la web.
- **Paridad de memoria:** cambios de programa, bancos, Single/Multi/Sequencer, edición, Undo/Store y recuperación de patch requieren protocolo verificado; no simular.
- **Integridad:** preservar la ROM privada, el motor CoreAudio estable y la geometría v0.7; cada actualización tiene copia de seguridad, pruebas de regresión y vuelta atrás.
- **No equiparar atajos web con hardware:** Shift+clic para seleccionar ambos filtros es un atajo web para la pulsación simultánea de dos teclas físicas; no representa una nueva función SHIFT del Virus.

## Matriz de comportamiento — 17 noviembre 2026

| Elemento | Comportamiento hardware | Implementación | Qué falta para equivalencia |
|---|---|---|---|
| Audio TI2 | DSP nativo con ROM local | Confirmado por el usuario v0.9 | Pruebas de regresión al añadir protocolo |
| VALUE ± sin menú | Programa anterior/siguiente en banco | v0.8, confirmado v0.9 | Cambio de significado cuando se abra un menú |
| VALUE 3 / PROGRAM | VALUE 3 cambia el parámetro de LCD; **SHIFT + VALUE 3** cambia programa | **v0.10 corrige** el acceso sin SHIFT de v0.8/0.9 | Parámetros reales del LCD, navegación de menús |
| SHIFT | Modificador momentáneo de funciones secundarias | v0.10: mantener pulsado o click de un gesto para ratón | SHIFT de todos los controles secundarios |
| OSC SELECT | Foco OSC1/2/3 para encoders compartidos | v0.9: foco local | Leer foco y modos reales del DSP |
| OSC1/OSC2 WAVE/SEMITONE | CC según oscilador seleccionado | v0.9: CC de chart | Confirmación de parámetros/valores reales |
| WAVE SELECT/PW | Depende de SHAPE/modo de oscilador | v0.9 solo Wave Select, no PW | Estado de SHAPE y modo; cambio dinámico CC 19/18, 24/23 según corresponda |
| OSC3 | Parámetros especiales, no equivalencia CC simple | v0.9: selección local, encoders sin CC verificado bloqueados | Mensajes nativos de parámetros o SysEx verificado |
| FILTER SELECT 1/2 | Foco filtro 1, 2 o ambos | v0.9: foco local y atajo para ambos | Leer foco del firmware, selección simultánea auténtica |
| RESONANCE / ENV AMOUNT | Dependen del foco de filtro | v0.9: CC 42/43, 44/45 | Estado del DSP y confirmación auditiva por patch |
| CUTOFF 1/2 | Dependen de Cutoff Link | v0.9: CC 40/41 | Leer Cutoff Link, evitar estado de interfaz falso |
| Envolventes | Filter ADSR y Amplifier ADSR | v0.9: CC 54/55/56/58 y 59/60/61/63 | Readback y funciones secundarias Sustain Slope/Tempo |
| LFO 1/2/3 SELECT y RATE | RATE actúa sobre LFO seleccionado | Solo visual | Selección y CC/parametría verificados por LFO |
| ARP ON / HOLD | ARP ON alterna; SHIFT+ARP ON activa Hold | Solo visual | Mensaje nativo y estado real de ARP |
| OSC3 ON, SYNC, MONO | Cambios dependientes del modo | Solo visual | Mensajes nativos + estados |
| FILTER MODE 1/2 | Cambia tipo de filtro | Solo visual | Lectura de modo y envío verificado |
| FX SELECT / EDIT | Selección de efectos y menús por sección | Solo visual | Contexto de cada efecto y páginas |
| MATRIX | Slots y rutas de modulación | Solo visual | Menús y protocolo de modulación |
| LCD | Patch, banco, nombres, menú y soft-knobs | Programa local simplificado | Readback real y renderer contextual |
| LEDs | Reflejan el firmware y selección física | v0.9: solo selección **local** OSC/FILT | Feedback bidireccional desde motor |
| BANK ± / SHIFT+VALUE 2 | Selección de banco | Solo visual | Verificar Bank Select con Gearmulator y mapear RAM/ROM |
| SINGLE / MULTI / SEQ | Modo de operación, partes | Solo visual | Host multitimbral y estado de partes |
| STORE / UNDO / REDO | Gestión de patch/edición | Solo visual | Lectura/escritura de estado nativo, sin pérdida |
| TRANSPOSE / STANDBY | Octavas y apagado con ambas teclas | Solo visual | Estado de transposición y standby seguro |

## Orden técnico recomendado

**Fase 1 (v0.10):** corregir una discrepancia probada de la v0.8/0.9: el encoder VALUE 3 sin SHIFT no debe cambiar programa en pantalla principal. Añadir SHIFT físico, teclado y accesibilidad de un gesto. Mantener audio, programas VALUE ±, OSC/FILTER y MIDI de la v0.9.

**Fase 2:** explorar sin distribuir el canal bidireccional Gearmulator/virusLib (MIDI out, SysEx, estado de patch, modos y bancos). Diseñar API de estado con **provenance** (`firmware`, `local`, `unknown`), marcas de tiempo y reset por Program Change. No mostrar valores de firmware hasta tener respuesta comprobable.

**Fase 3:** implementar controles dependientes del modo (WAVE SELECT/PW, LFO, filtros, FX, ARP), menús y LCD en función de estado confirmado. Pruebas de comportamiento con presets que exhiban diferencias.

**Fase 4:** paridad completa Single/Multi/Sequencer, banco, edición/STORE/UNDO, indicadores y navegación. Matriz de pruebas frente a manual y equipo original, más comparación visual contra foto.

## Estado de aprobación

La v0.9 es **punto de recuperación confirmado**. La v0.10 no se considera aprobada por el usuario hasta probarla en su Mac. El producto final no se considerará equivalente al hardware mientras haya controles o estados simulados.
