"use strict";
/** TI2 v0.14: animate ONLY the existing mixer/logo emblem using Gearmulator's
 * DSP-derived FrontpanelState.m_logo. Hardware LED PWM is active-low.
 * No new panel geometry, fake BPM LED, patch readback, or MIDI messages.
 */
(() => {
  const logo = document.querySelector('[data-ti2-dsp-logo="true"]');
  if (!logo) return;

  const base = [0x7a, 0x9b, 0x9e];
  const illuminated = [0xdb, 0xfa, 0xff];

  const reset = () => {
    logo.style.removeProperty('--ti2-dsp-logo-fill');
    logo.style.removeProperty('--ti2-dsp-logo-opacity');
    logo.setAttribute('data-state', 'unavailable');
  };

  const render = raw => {
    // Gearmulator's FrontpanelState uses normalized inverse-PWM intensity.
    // The same curve is already validated against the three physical LFO LEDs.
    const level = Math.max(0, Math.min(1, raw));
    const brightness = Math.pow(1 - level, 0.2);
    const rgb = base.map((value, i) =>
      Math.round(value + (illuminated[i] - value) * brightness)
        .toString(16).padStart(2, '0')
    ).join('');
    logo.style.setProperty('--ti2-dsp-logo-fill', '#' + rgb);
    logo.style.setProperty('--ti2-dsp-logo-opacity', String(0.72 + 0.28 * brightness));
    logo.setAttribute('data-state', 'dsp');
  };

  window.addEventListener('ti2-dsp-frontpanel', event => {
    const fb = event.detail;
    if (!fb || fb.source !== 'dsp-frontpanel' ||
        !Number.isSafeInteger(fb.revision) || fb.revision < 1 ||
        !Number.isFinite(fb.ageSeconds) || fb.ageSeconds < 0 ||
        fb.ageSeconds >= 3 || !Number.isFinite(fb.logoLedLevel)) {
      reset();
      return;
    }
    render(fb.logoLedLevel);
  });
})();
