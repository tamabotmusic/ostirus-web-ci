"use strict";
/* OsTIrus TI2 Desktop hardware panel.
 * Verified Virus TI controller numbers: https://midi.guide/d/access/virus-ti/
 * Outbound-only MIDI: knob positions are NOT read from the current patch.
 */
(() => {
  const groups = {
    "ti2-master": [
      ["PATCH VOLUME",91,127,98],
    ],
    "ti2-lfo": [
      ["LFO 1 RATE",67,127,64],["LFO 1 SHAPE",68,67,0],
      ["LFO 2 RATE",79,127,64],["LFO 2 SHAPE",80,67,0],
    ],
    "ti2-osc1": [
      ["SHAPE",17,127,64],["PULSE WIDTH",18,127,64],
      ["WAVE SELECT",19,99,0],["SEMITONE",20,127,64],
    ],
    "ti2-osc2": [
      ["SHAPE",22,127,64],["WAVE SELECT",24,127,0],
      ["DETUNE",26,127,64],["FM AMOUNT",27,127,0],
    ],
    "ti2-mixer": [
      ["OSC BALANCE",33,127,64],["SUB OSC",34,127,64],
      ["NOISE VOL",37,127,0],["OSC VOLUME",36,127,100],
    ],
    "ti2-filter1": [
      ["CUTOFF 1",40,127,100],["RESONANCE 1",42,127,10],
      ["ENV AMT 1",44,127,64],["MODE 1",51,7,0],
    ],
    "ti2-filter2": [
      ["CUTOFF 2",41,127,100],["RESONANCE 2",43,127,10],
      ["ENV AMT 2",45,127,64],["BALANCE",48,127,64],
    ],
    "ti2-fx": [
      ["DELAY TIME",114,127,64],["DELAY FB",115,127,64],
      ["REVERB TIME",116,127,64],["FX SEND",113,127,64],
      ["CHORUS MIX",104,127,64],["CHORUS RATE",106,127,64],
      ["CHORUS DEPTH",107,127,64],["DELAY COLOR",119,127,64],
    ],
    "ti2-performance": [
      ["GLIDE TIME",5,127,0],["PANORAMA",10,127,64],
      ["TRANSPOSE",93,127,64],["UNISON DET",98,127,64],
    ],
    "ti2-filter-env": [
      ["ATTACK",54,127,0],["DECAY",55,127,64],
      ["SUSTAIN",56,127,100],["RELEASE",58,127,50],
    ],
    "ti2-amp-env": [
      ["ATTACK",59,127,0],["DECAY",60,127,64],
      ["SUSTAIN",61,127,100],["RELEASE",63,127,50],
    ],
  };

  const lcd = {
    patch: document.getElementById("ti2-lcd-patch"),
    param: document.getElementById("ti2-lcd-param"),
    value: document.getElementById("ti2-lcd-value"),
  };

  const specRecords = Object.values(groups).flat();
  const ccMap = new Map();
  for (const spec of specRecords) {
    if (ccMap.has(spec[1])) throw new Error("Control CC duplicado: " + spec[1]);
    ccMap.set(spec[1], spec);
  }

  function patchLabel() {
    const selector = document.getElementById("program");
    const index = Number(selector.value);
    lcd.patch.textContent = "SINGLE " + String(index + 1).padStart(3, "0") + " · PROGRAM " + (index + 1);
    lcd.param.textContent = "PATCH SELECCIONADO";
    lcd.value.textContent = "VALORES ORIGINALES NO LEÍDOS";
    // MIDI program change is sent by the existing working OsTIrus app.js.
  }

  async function midiCC(cc, value) {
    const response = await fetch("/api/midi", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({type: "cc", controller: cc, value}),
      cache: "no-store"
    });
    if (!response.ok) throw new Error("No se pudo enviar MIDI CC " + cc);
  }

  function createKnob(spec) {
    const [label, cc, max, initial] = spec;
    const wrapper = document.createElement("div");
    wrapper.className = "ti2-control";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ti2-knob";
    button.setAttribute("role", "slider");
    button.setAttribute("aria-label", label + " (CC " + cc + ")");
    button.setAttribute("aria-valuemin", "0");
    button.setAttribute("aria-valuemax", String(max));
    button.setAttribute("aria-valuenow", String(initial));
    button.title = label + " · MIDI CC " + cc + " · no sincronizado con patch";
    const disc = document.createElement("span");
    disc.className = "ti2-knob-disc";
    button.appendChild(disc);

    const labelElement = document.createElement("span");
    labelElement.className = "ti2-control-label";
    labelElement.textContent = label;
    const valueElement = document.createElement("span");
    valueElement.className = "ti2-control-value";
    valueElement.textContent = "CC " + cc;
    wrapper.append(button, labelElement, valueElement);

    let value = initial;
    let committed = false;
    let drag = null;
    let scheduled = null;

    function render() {
      const angle = -135 + (value / max) * 270;
      disc.style.setProperty("--dial-angle", angle + "deg");
      button.setAttribute("aria-valuenow", String(value));
      valueElement.textContent = committed ? String(value) : "CC " + cc;
    }

    function send() {
      if (scheduled !== null) return;
      scheduled = requestAnimationFrame(() => {
        scheduled = null;
        midiCC(cc, value).catch(() => {
          lcd.param.textContent = "CONEXIÓN MIDI FALLIDA";
          lcd.value.textContent = "CC " + cc + " · REVISA MOTOR";
        });
      });
    }

    function setValue(newValue) {
      const rounded = Math.min(max, Math.max(0, Math.round(newValue)));
      if (rounded === value && committed) return;
      value = rounded;
      committed = true;
      render();
      lcd.param.textContent = label;
      lcd.value.textContent = "CC " + cc + "  /  " + value + "  (0–" + max + ")";
      send();
    }

    button.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      drag = {pointerId: event.pointerId, y: event.clientY, value};
      button.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    button.addEventListener("pointermove", event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      setValue(drag.value + (drag.y - event.clientY) * (max / 100));
    });
    button.addEventListener("pointerup", event => {
      if (drag && drag.pointerId === event.pointerId) drag = null;
    });
    button.addEventListener("pointercancel", () => { drag = null; });
    button.addEventListener("lostpointercapture", () => { drag = null; });
    button.addEventListener("wheel", event => {
      event.preventDefault();
      setValue(value + (event.deltaY < 0 ? 1 : -1) * Math.max(1, Math.round(max / 64)));
    }, {passive: false});
    button.addEventListener("keydown", event => {
      const step = event.shiftKey ? Math.max(4, Math.round(max / 16)) : 1;
      if (["ArrowUp", "ArrowRight"].includes(event.key)) setValue(value + step);
      else if (["ArrowDown", "ArrowLeft"].includes(event.key)) setValue(value - step);
      else if (event.key === "Home") setValue(0);
      else if (event.key === "End") setValue(max);
      else return;
      event.preventDefault();
    });
    button.addEventListener("dblclick", () => setValue(initial));
    render();
    return wrapper;
  }

  for (const [regionId, specs] of Object.entries(groups)) {
    const mount = document.getElementById(regionId);
    if (!mount) throw new Error("Falta la región TI2 " + regionId);
    mount.replaceChildren(...specs.map(createKnob));
  }

  const program = document.getElementById("program");
  program.addEventListener("change", patchLabel);
  function stepProgram(delta) {
    program.value = String((Number(program.value) + delta + 128) % 128);
    program.dispatchEvent(new Event("change", {bubbles: true}));
  }
  document.getElementById("ti2-prev-patch").addEventListener("click", () => stepProgram(-1));
  document.getElementById("ti2-next-patch").addEventListener("click", () => stepProgram(1));
  patchLabel();
})();
