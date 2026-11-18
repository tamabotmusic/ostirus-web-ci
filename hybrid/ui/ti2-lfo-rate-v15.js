"use strict";
/** TI2 v0.15: the physical LFO SELECT buttons put RATE in the chosen LFO's
 * context, per Access Virus TI manual / TI MIDI Controller Chart.
 *
 * CC 67 = LFO1 rate; CC 79 = LFO2 rate. LFO3's rate has NO verified direct
 * CC in the chart. Do not fall back to LFO1 when LFO3 is selected.
 *
 * Focus is LOCAL only. The three existing LFO LEDs remain driven exclusively
 * by actual DSP phases from v0.13; no simulated LEDs or firmware readback.
 */
(() => {
  const svg = document.querySelector('#ti2-precision .ti2-photo-svg');
  const knobs = window.OsTIrusTI2Knobs;
  const previous = window.OsTIrusTI2Context;
  if (!svg || !knobs || !previous) return;

  const ccForRate = Object.freeze({1: 67, 2: 79, 3: null});
  let focus = null; // Unknown until the user chooses a LFO; legacy RATE routes to LFO1.
  const selectors = [...svg.querySelectorAll('.ti2-button-group')];
  const caption = document.getElementById('ti2-precision-edit');

  window.OsTIrusTI2Context = Object.freeze({
    resolveCC(parameter) {
      if (parameter.label === 'RATE') return ccForRate[focus ?? 1];
      return previous.resolveCC(parameter);
    },
    getSelection() {
      return {...previous.getSelection(), lfo: focus};
    },
  });

  function updateFocus() {
    for (const [index, button] of buttons.entries()) {
      button.setAttribute('aria-pressed', String(focus === index + 1));
      button.setAttribute('aria-label', 'Seleccionar LFO ' + (index + 1) +
        (index === 2 ? '; RATE sin CC verificado' : '; RATE compartido'));
    }
    knobs.refresh(); // Preserves remembered LOCAL values by resolved CC.
  }

  function choose(index) {
    if (focus === index) {
      // Hardware: pressing SELECT again enters destination pages. We have no
      // firmware-backed page navigation yet; do not pretend to open a menu.
      if (caption) caption.textContent = 'LFO ' + index +
        ' · menú de destinos pendiente de implementación; sin lectura del firmware';
      return;
    }
    focus = index;
    updateFocus();
    if (caption) caption.textContent = 'LFO ' + index +
      (index === 3 ? ' seleccionado localmente · RATE bloqueado hasta verificar el protocolo' :
        ' seleccionado localmente · RATE envía CC ' + ccForRate[index]);
  }

  const buttons = [1, 2, 3].map(index => {
    const button = selectors.find(node => node.getAttribute('data-name') ===
      'LFO ' + index + ' SELECT');
    if (!button) throw new Error('Falta LFO ' + index + ' SELECT en el panel');
    button.classList.add('control-live');
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    button.setAttribute('data-action', 'lfo-focus-' + index);
    button.addEventListener('click', () => choose(index));
    button.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      choose(index);
    });
    return button;
  });

  updateFocus();
  window.OsTIrusLFOFocus = Object.freeze({ current: () => focus });
})();
