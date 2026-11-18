"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ui = path.resolve(__dirname, "../ui");

class Element {
  constructor(name = "div") {
    this.name = name;
    this.attributes = {};
    this.children = [];
    this.listeners = {};
    this.style = {
      values: new Map(),
      setProperty(name, value) { this.values.set(name, String(value)); },
      removeProperty(name) { this.values.delete(name); },
      getPropertyValue(name) { return this.values.get(name) || ""; },
    };
    this.classList = {
      add: (...names) => this.setAttribute("class", [this.getAttribute("class"), ...names].filter(Boolean).join(" ")),
      toggle: () => {},
    };
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] ?? null; }
  removeAttribute(k) { delete this.attributes[k]; }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  querySelectorAll(selector) {
    const match = selector.match(/^(circle)?\[([\w-]+)(?:="([^"]+)")?\]$/);
    if (!match) throw Error("Unsupported test selector: " + selector);
    const result = [];
    function visit(node) {
      if ((!match[1] || node.name === match[1]) &&
          node.getAttribute(match[2]) !== null &&
          (match[3] === undefined || node.getAttribute(match[2]) === match[3])) result.push(node);
      node.children.forEach(visit);
    }
    visit(this);
    return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}

function makePanel(loadRenderer = true, loadLfo = false) {
  const panel = new Element();
  const program = new Element("select"); program.value = "0";
  const caption = new Element();
  const nodes = {"ti2-precision": panel, "program": program, "ti2-precision-edit": caption};
  const listeners = {};
  const document = {
    getElementById: id => nodes[id] ||= new Element(),
    createElementNS: (_ns, name) => new Element(name),
    createElement: name => new Element(name),
    querySelector: selector => panel.querySelector(selector),
  };
  const window = {
    addEventListener: (event, cb) => (listeners[event] ||= []).push(cb),
    dispatchEvent: event => (listeners[event.type] || []).forEach(cb => cb(event)),
  };
  const context = vm.createContext({document, window, console, Map, Set});
  for (const file of ["ti2-precision.js", ...(loadLfo ? ["ti2-dsp-lfo-v13.js"] : []),
                      ...(loadRenderer ? ["ti2-dsp-logo-v14.js"] : [])]) {
    vm.runInContext(fs.readFileSync(path.join(ui, file), "utf8"), context);
  }
  return {
    panel,
    logo: panel.querySelector('[data-ti2-dsp-logo="true"]'),
    lfo: i => panel.querySelector('[data-ti2-dsp-lfo="' + i + '"]'),
    emit: fb => window.dispatchEvent({type: "ti2-dsp-frontpanel", detail: fb}),
  };
}
const feedback = (level = 0.5) => ({
  source: "dsp-frontpanel", revision: 42, ageSeconds: 0.17,
  logoLedLevel: level, lfoLedLevels: [0, 0.5, 1],
  bpmLedLevel: 0, midiActivityMask: 0,
});
const fill = logo => logo.style.getPropertyValue("--ti2-dsp-logo-fill");
const opacity = logo => logo.style.getPropertyValue("--ti2-dsp-logo-opacity");

test("only the existing mixer emblem is tagged; approved coordinates and idle defaults stay fixed", () => {
  const {panel, logo} = makePanel(false);
  assert.ok(logo);
  assert.equal(logo.name, "text");
  assert.equal(logo.getAttribute("x"), "1057");
  assert.equal(logo.getAttribute("y"), "379");
  assert.equal(logo.getAttribute("class"), "mixer-emblem");
  assert.equal(logo.textContent, "✧");
  assert.equal(logo.getAttribute("data-state"), "unavailable");
  assert.equal(panel.querySelectorAll('circle[data-state="unavailable"]').length > 20, true);
  const css = fs.readFileSync(path.join(ui, "ti2-precision.css"), "utf8");
  assert.match(css, /fill:var\(--ti2-dsp-logo-fill,#7a9b9e\)/);
  assert.match(css, /opacity:var\(--ti2-dsp-logo-opacity,\.72\)/);
});

test("the PWM full-on and full-off endpoints illuminate only the real logo", () => {
  const {logo, emit} = makePanel();
  assert.equal(fill(logo), "");
  assert.equal(opacity(logo), "");
  emit(feedback(0));
  assert.equal(fill(logo), "#dbfaff");
  assert.equal(opacity(logo), "1");
  assert.equal(logo.getAttribute("data-state"), "dsp");
  emit(feedback(1));
  assert.equal(fill(logo), "#7a9b9e");
  assert.equal(opacity(logo), "0.72");
  assert.equal(logo.getAttribute("data-state"), "dsp");
});

test("finite out-of-range PWM data clamps to physical intensity endpoints", () => {
  const {logo, emit} = makePanel();
  emit(feedback(-2));
  assert.equal(fill(logo), "#dbfaff");
  emit(feedback(5));
  assert.equal(fill(logo), "#7a9b9e");
});

test("unknown, stale, nonfinite or unauthenticated data restores original idle appearance", () => {
  const {logo, emit} = makePanel();
  const bad = [null, {...feedback(), source:"local"}, {...feedback(), revision:0},
    {...feedback(), revision:1.5}, {...feedback(), ageSeconds:3},
    {...feedback(), ageSeconds:-0.1}, {...feedback(), logoLedLevel:NaN},
    {...feedback(), logoLedLevel:Infinity}, {...feedback(), logoLedLevel:undefined}];
  for(const fb of bad) {
    emit(feedback(0));
    emit(fb);
    assert.equal(fill(logo), "");
    assert.equal(opacity(logo), "");
    assert.equal(logo.getAttribute("data-state"), "unavailable");
  }
});

test("new logo feedback never changes LFO rendering or any other physical LED", () => {
  const {panel, logo, lfo, emit} = makePanel(true, true);
  const untouched = panel.querySelectorAll('circle[data-state="unavailable"]')
    .filter(node => ![1,2,3].includes(Number(node.getAttribute("data-ti2-dsp-lfo"))));
  const initial = untouched.map(x => [x.getAttribute("fill"), x.getAttribute("data-state")]);
  emit(feedback(0));
  assert.equal(lfo(1).getAttribute("fill"), "#ec4566");
  assert.equal(lfo(3).getAttribute("fill"), "#242e31");
  assert.equal(fill(logo), "#dbfaff");
  assert.deepEqual(untouched.map(x => [x.getAttribute("fill"),x.getAttribute("data-state")]), initial);
});

test("BPM is intentionally not animated: TI2 Gearmulator does not derive m_bpm", () => {
  const src = fs.readFileSync(path.join(ui, "ti2-dsp-logo-v14.js"), "utf8");
  assert.doesNotMatch(src, /fb\.bpmLedLevel|\['bpmLedLevel'\]/);
  assert.doesNotMatch(src, /fetch\(|type:\s*['"]cc/);
});
