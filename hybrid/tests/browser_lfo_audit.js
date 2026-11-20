"use strict";

(async () => {
  const result = document.createElement("output");
  result.id = "lfo-audit";
  document.body.append(result);

  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  const clickAt = (element, x, y) => {
    const hit = document.elementFromPoint(x, y);
    assert(element.contains(hit), "El control LFO está tapado");
    hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  };
  const waitFor = async (check, message) => {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (await check()) return;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(message);
  };

  try {
    const svg = document.querySelector(".ti2-photo-svg");
    const rate = svg.querySelector('[data-label="RATE"]');
    const indicator = svg.querySelector('[data-ti2-lfo-selector="2"]');
    const led = indicator.querySelector("circle");
    const lfo1 = svg.querySelector('[data-name="LFO 1 SELECT"]');
    const lfo2 = svg.querySelector('[data-name="LFO 2 SELECT"]');

    await waitFor(() => led.dataset.state === "dsp", "El LED no recibe fases por HTTP");
    assert(getComputedStyle(led).fill !== "rgb(36, 46, 49)", "El LED con fase cero está apagado");
    const dot = led.getBoundingClientRect();
    clickAt(indicator, dot.x + dot.width / 2, dot.y + dot.height / 2);
    assert(lfo2.getAttribute("aria-pressed") === "true", "LFO 2 no queda seleccionado");
    assert(getComputedStyle(led).strokeWidth === "1.5px", "Falta el contorno de selección");
    assert(rate.dataset.cc === "79", "RATE no apunta a LFO 2");
    rate.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, cancelable: true }));
    await waitFor(async () => (await (await fetch("/audit/midi")).json()).includes("CC 79 65"),
      "El servidor no recibió RATE para LFO 2");

    const cap = lfo1.querySelector("rect").getBoundingClientRect();
    clickAt(lfo1, cap.x + cap.width / 2, cap.y + cap.height / 2);
    assert(rate.dataset.cc === "67" && lfo2.getAttribute("aria-pressed") === "false",
      "El botón SELECT no vuelve a LFO 1");
    await fetch("/audit/end-feedback");
    await waitFor(() => led.dataset.state === "unavailable", "El LED conserva una fase caducada");
    assert(getComputedStyle(led).fill === "rgb(36, 46, 49)", "El LED queda iluminado sin datos");
    result.textContent = "PASS";
  } catch (error) {
    result.textContent = error.message;
  }
})();
