"use strict";

(async () => {
  let result = "PASS";

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
    const lcd = svg.querySelector(".lcd-title");
    const rate = svg.querySelector('[data-label="RATE"]');
    const indicator = svg.querySelector('[data-ti2-lfo-selector="2"]');
    const led = indicator.querySelector("circle");
    const lfo1 = svg.querySelector('[data-name="LFO 1 SELECT"]');
    const lfo2 = svg.querySelector('[data-name="LFO 2 SELECT"]');

    await waitFor(() => led.dataset.state === "dsp", "El LED no recibe fases por HTTP");
    assert(getComputedStyle(led).fill !== "rgb(36, 46, 49)", "El LED con fase cero está apagado");
    assert(lcd.textContent === "Test Patch", "El LCD no muestra el preset activo");
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
    const lfo3 = svg.querySelector('[data-name="LFO 3 SELECT"]');
    const lfo3Cap = lfo3.querySelector("rect").getBoundingClientRect();
    clickAt(lfo3, lfo3Cap.x + lfo3Cap.width / 2, lfo3Cap.y + lfo3Cap.height / 2);
    assert(lfo3.getAttribute("aria-pressed") === "true" && !rate.hasAttribute("data-cc"),
      "LFO 3 no usa su parámetro nativo");
    rate.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, cancelable: true }));
    await waitFor(async () => (await (await fetch("/audit/midi")).json()).includes("LFO3_RATE 65"),
      "El servidor no recibió RATE para LFO 3");
    await fetch("/audit/end-feedback");
    await waitFor(() => led.dataset.state === "unavailable", "El LED conserva una fase caducada");
    assert(lcd.textContent.startsWith("PROGRAM "), "El LCD conserva un nombre caducado");
    assert(getComputedStyle(led).fill === "rgb(36, 46, 49)", "El LED queda iluminado sin datos");
  } catch (error) {
    result = error.message;
  }
  await fetch("/audit/result", { method: "POST", body: result });
})();
