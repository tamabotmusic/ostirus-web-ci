"use strict";
/** TI2 v0.13: only physical LFO 1–3 LEDs receive genuine DSP phase feedback.
 * Gearmulator's Virus JUCE plugin: brightness = pow(1 - clamp(phase, 0, 1), 0.2).
 * All other indicators retain their unavailable/local-focus semantics.
 */
(() => {
  const leds = [1, 2, 3].map(i => document.querySelector('[data-ti2-dsp-lfo="' + i + '"]'));
  if (leds.some(led => !led)) return;

  const status = document.getElementById('ti2-lfo-feedback');
  const dark = [0x24, 0x2e, 0x31];
  const lit = [0xec, 0x45, 0x66];
  const neutral = () => leds.forEach(led => {
    led.setAttribute('fill', '#242e31');
    led.setAttribute('data-state', 'unavailable');
  });
  const color = phase => {
    const v = Math.max(0, Math.min(1, phase));
    const brightness = Math.pow(1 - v, 0.2);
    return '#' + dark.map((channel, i) =>
      Math.round(channel + (lit[i] - channel) * brightness).toString(16).padStart(2, '0')
    ).join('');
  };

  window.addEventListener('ti2-dsp-frontpanel', event => {
    const feedback = event.detail;
    if (!feedback || feedback.source !== 'dsp-frontpanel' ||
        !Number.isSafeInteger(feedback.revision) || feedback.revision < 1 ||
        !Number.isFinite(feedback.ageSeconds) || feedback.ageSeconds < 0 ||
        feedback.ageSeconds >= 3 || !Array.isArray(feedback.lfoLedLevels) ||
        feedback.lfoLedLevels.length !== 3 ||
        !feedback.lfoLedLevels.every(Number.isFinite)) {
      neutral();
      if (status) status.textContent = 'LED LFO · sin datos recientes del motor';
      return;
    }
    if (status) status.textContent = 'LED LFO · recibiendo fases del motor';
    leds.forEach((led, i) => {
      led.setAttribute('fill', color(feedback.lfoLedLevels[i]));
      led.setAttribute('data-state', 'dsp');
    });
  });
})();
