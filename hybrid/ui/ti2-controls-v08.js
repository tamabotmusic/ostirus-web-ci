"use strict";
/** OsTIrus TI2 v0.8: functional overlay on the APPROVED v0.7 physical drawing.
 *  No changes to panel geometry, the native host, firmware, CC mappings or
 *  unsynchronized hardware LEDs. Program Change 0..127 is already supported.
 */
(() => {
  const svg = document.querySelector('#ti2-precision .ti2-photo-svg');
  const programs = window.OsTIrusProgram;
  const selector = document.getElementById('program');
  if (!svg || !programs || !selector) return;

  function bindProgramKey(name, delta, accessibleLabel) {
    const key = [...svg.querySelectorAll('.ti2-button-group')]
      .find(node => node.getAttribute('data-name') === name);
    if (!key) throw new Error('TI2 physical control missing: ' + name);
    key.classList.add('control-live');
    key.setAttribute('tabindex', '0');
    key.setAttribute('role', 'button');
    key.setAttribute('aria-label', accessibleLabel);
    key.setAttribute('data-action', delta > 0 ? 'program-next' : 'program-previous');
    const act = () => programs.step(delta);
    key.addEventListener('click', act);
    key.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      act();
    });
  }

  bindProgramKey('VALUE −', -1, 'Programa anterior del banco actual');
  bindProgramKey('VALUE +', 1, 'Programa siguiente del banco actual');

  // VALUE 3 / PROGRAM is a context-sensitive encoder on the real TI2.
  // The current web LCD only has the Program page: enable it there, never
  // pretend it is a fixed MIDI CC or that we read the active firmware patch.
  const knob = svg.querySelector('.ti2-knob[data-label="VALUE 3"]');
  if (!knob) throw new Error('TI2 physical VALUE 3 encoder missing');
  const needle = knob.querySelector('line:not(.ti2-dial-tick)');
  if (!needle) throw new Error('TI2 VALUE 3 pointer missing');
  knob.classList.remove('control-pending');
  knob.classList.add('control-live');
  knob.setAttribute('tabindex', '0');
  knob.setAttribute('role', 'slider');
  knob.setAttribute('aria-label', 'Programa del banco actual; sin lectura del firmware');
  knob.setAttribute('aria-valuemin', '1');
  knob.setAttribute('aria-valuemax', '128');
  knob.setAttribute('data-action', 'program-encoder');

  function refresh(updatePointer = true) {
    const current = programs.current();
    knob.setAttribute('aria-valuenow', String(current + 1));
    knob.setAttribute('aria-valuetext', 'Programa ' + (current + 1));
    // Preserve the approved v0.7 resting angle until the user selects a program.
    if (updatePointer) needle.setAttribute('transform', 'rotate(' + (-130 + current * 260 / 127) + ')');
  }
  selector.addEventListener('input', refresh);
  selector.addEventListener('change', refresh);
  refresh(false);

  // Dragging commits on release, so a single gesture never floods the DSP
  // with dozens of expensive patch loads.
  let gesture = null;
  knob.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    gesture = { id: event.pointerId, y: event.clientY };
    knob.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  knob.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const delta = Math.round((gesture.y - event.clientY) / 9);
    gesture = null;
    if (delta) programs.step(delta);
  });
  knob.addEventListener('pointercancel', () => { gesture = null; });
  knob.addEventListener('lostpointercapture', () => { gesture = null; });
  knob.addEventListener('wheel', event => {
    event.preventDefault();
    programs.step(event.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  knob.addEventListener('keydown', event => {
    let delta = 0;
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') delta = event.shiftKey ? 10 : 1;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') delta = event.shiftKey ? -10 : -1;
    else if (event.key === 'PageUp') delta = 10;
    else if (event.key === 'PageDown') delta = -10;
    else if (event.key === 'Home') delta = -127;
    else if (event.key === 'End') delta = 127;
    else return;
    event.preventDefault();
    programs.step(delta);
  });
})();
