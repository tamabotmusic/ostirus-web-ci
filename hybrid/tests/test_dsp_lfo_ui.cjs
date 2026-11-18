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
    this.style = {};
    this.dataset = {};
    this.classList = {
      add: (...names) => this.setAttribute("class", [this.getAttribute("class"), ...names].filter(Boolean).join(" ")),
      toggle: () => {},
    };
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key] ?? null; }
  removeAttribute(key) { delete this.attributes[key]; }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  querySelectorAll(selector) {
    const match = selector.match(/^(circle)?\[([\w-]+)(?:="([^"]+)")?\]$/);
    if (!match) throw Error(`Unsupported fixture selector: ${selector}`);
    const found = [];
    const visit = (node) => {
      if ((!match[1] || node.name === match[1]) &&
          node.getAttribute(match[2]) !== null &&
          (match[3] === undefined || node.getAttribute(match[2]) === match[3])) found.push(node);
      node.children.forEach(visit);
    };
    visit(this);
    return found;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}

function loadPanel({withRenderer = true, withApp = false} = {}) {
  const panel = new Element();
  const program = new Element("select");
  program.value = "0";
  const caption = new Element();
  const ids = {"ti2-precision": panel, program, "ti2-precision-edit": caption};
  const listeners = {};
  const pendingStatus = [];
  const intervals = [];
  const document = {
    getElementById: (id) => ids[id] ||= new Element(),
    createElement: name => new Element(name),
    createElementNS: (_ns, name) => new Element(name),
    querySelector: (selector) => panel.querySelector(selector),
    addEventListener: () => {},
  };
  const window = {
    addEventListener: (name, callback) => (listeners[name] ||= []).push(callback),
    dispatchEvent: event => (listeners[event.type] || []).forEach(callback => callback(event)),
  };
  const context = vm.createContext({
    window, document, console, Map, Set,
    fetch: url => new Promise((resolve, reject) => pendingStatus.push({url, resolve, reject})),
    setInterval: (fn, delay) => intervals.push({fn, delay}),
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
  });
  vm.runInContext(fs.readFileSync(path.join(ui, "ti2-precision.js"), "utf8"), context);
  if (withRenderer) {
    vm.runInContext(fs.readFileSync(path.join(ui, "ti2-dsp-lfo-v13.js"), "utf8"), context);
  }
  if (withApp) {
    vm.runInContext(fs.readFileSync(path.join(ui, "app.js"), "utf8"), context);
  }
  return {
    panel,
    caption,
    find: (i) => panel.querySelector(`[data-ti2-dsp-lfo="${i}"]`),
    emit: (detail) => (listeners["ti2-dsp-frontpanel"] || []).forEach(callback => callback({detail})),
    pendingStatus,
    intervals,
    poll: () => vm.runInContext("updateStatus()", context),
  };
}

function feedback(phases = [0, 0.96875, 1]) {
  return {source: "dsp-frontpanel", revision: 23, lfoLedLevels: phases,
    bpmLedLevel: 0.2, logoLedLevel: 0.8, midiActivityMask: 3, ageSeconds: 0.12};
}

test("the three existing physical LFO circles are addressable, without changing positions", () => {
  const {find} = loadPanel({withRenderer: false});
  for (const [index, x] of [[1, 310], [2, 352], [3, 400]]) {
    const led = find(index);
    assert.ok(led, `LFO ${index} LED missing`);
    assert.equal(led.getAttribute("cx"), String(x));
    assert.equal(led.getAttribute("cy"), "125");
    assert.equal(led.getAttribute("r"), "3.4");
    assert.equal(led.getAttribute("data-state"), "unavailable");
  }
});

test("the panel caption distinguishes live LFO feedback from unavailable firmware LEDs", () => {
  const {caption} = loadPanel();
  assert.match(caption.textContent, /LFO 1–3/);
  assert.match(caption.textContent, /DEMÁS LED SIN LECTURA/);
});

test("real DSP phase uses Gearmulator brightness curve, including 0 and 1 endpoints", () => {
  const {find, emit} = loadPanel();
  emit(feedback());
  assert.equal(find(1).getAttribute("fill"), "#ec4566");
  assert.equal(find(2).getAttribute("fill"), "#883a4c");
  assert.equal(find(3).getAttribute("fill"), "#242e31");
  assert.equal(find(1).getAttribute("data-state"), "dsp");
});

test("missing, stale, and non-DSP feedback extinguish previously active LFOs", () => {
  const {find, emit} = loadPanel();
  for (const invalid of [null, {...feedback(), source: "local"},
    {...feedback(), ageSeconds: 3}, {...feedback(), lfoLedLevels: [0, 0]},
    {...feedback(), lfoLedLevels: [0, NaN, 1]}, {...feedback(), revision: 0}]) {
    emit(feedback([0, 0, 0]));
    emit(invalid);
    for (const i of [1, 2, 3]) {
      assert.equal(find(i).getAttribute("fill"), "#242e31");
      assert.equal(find(i).getAttribute("data-state"), "unavailable");
    }
  }
});

test("DSP activity never changes the other existing panel LEDs", () => {
  const {panel, find, emit} = loadPanel();
  const nonLfo = panel.querySelectorAll('circle[data-state="unavailable"]').filter(
    led => ![1, 2, 3].includes(Number(led.getAttribute("data-ti2-dsp-lfo")))
  );
  const before = nonLfo.map(led => [led.getAttribute("fill"), led.getAttribute("data-state")]);
  assert.ok(nonLfo.length > 10);
  emit(feedback([0, 0.5, 1]));
  assert.ok(find(1));
  assert.deepEqual(nonLfo.map(led => [led.getAttribute("fill"), led.getAttribute("data-state")]), before);
});

test("status polling delivers real DSP feedback frequently without overlapping requests", async () => {
  const {find, pendingStatus, intervals, poll} = loadPanel({withApp: true});
  assert.equal(pendingStatus.length, 1, "startup should start one request");
  assert.equal(pendingStatus[0].url, "/api/status");
  assert.equal(intervals[0].delay, 125);
  const inFlight = poll();
  assert.equal(pendingStatus.length, 1, "another tick cannot start an overlapping request");
  pendingStatus[0].resolve({ok: true, json: async () => ({nativeRunning: true, nativeReady: true,
    blocks: 1, peak: 0.2, healthAgeSeconds: 0.1, dspFrontpanel: feedback()})});
  await inFlight;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(find(1).getAttribute("fill"), "#ec4566");
  assert.equal(find(2).getAttribute("fill"), "#883a4c");
});

test("a failed status fetch clears previously lit LFOs", async () => {
  const {find, pendingStatus, poll} = loadPanel({withApp: true});
  pendingStatus[0].resolve({ok: true, json: async () => ({nativeRunning: true, nativeReady: true,
    dspFrontpanel: feedback([0, 0, 0])})});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(find(1).getAttribute("fill"), "#ec4566");
  const fetching = poll();
  assert.equal(pendingStatus.length, 2);
  pendingStatus[1].reject(Error("disconnected"));
  await fetching;
  assert.equal(find(1).getAttribute("fill"), "#242e31");
  assert.equal(find(1).getAttribute("data-state"), "unavailable");
});
