# TI2 DSP LFO Indicators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Illuminate only the three existing TI2 LFO indicators from real Gearmulator DSP phase feedback.

**Architecture:** Native `PING` refreshes the existing `dspFrontpanel` JSON status; `app.js` forwards it as an event. A small `ti2-dsp-lfo-v13.js` owns phase-to-light conversion, stale handling, and changes to three explicitly tagged SVG circles.

**Tech Stack:** Python standard-library HTTP server, vanilla JavaScript/SVG/CSS, Node built-in test runner, Python unittest.

**Spec:** `docs/superpowers/specs/2026-11-18-ti2-dsp-lfo-indicators-design.md`

## Global Constraints

- Preserve the approved v0.7 SVG geometry and existing local-focus LED logic.
- Touch no native DSP/audio code or firmware material.
- Never merge to the stable branch; use a draft PR based on v0.12.
- All new tests must fail for the expected reason before product implementation.

## Review Focus

- Phase `1` produces a dark LED, not a bright LED — test explicit endpoints.
- An invalid or partial feedback frame cannot produce false lights — test wrong source, NaN, short arrays.
- Stale feedback and a lost HTTP connection clear previously illuminated lights — test both transitions.
- A valid frame never recolors OSC/FILTER or other indicators — test unrelated element.
- Fast HTTP requests do not pile up when a response is slow — test concurrent request guard.

---

### Task 1: Actual DSP LFO LED rendering

**Files:**
- Create: `hybrid/ui/ti2-dsp-lfo-v13.js`
- Create: `hybrid/tests/test_dsp_lfo_ui.cjs`
- Modify: `hybrid/ui/ti2-precision.js`, `hybrid/ui/index.html`

**Interfaces:**
- Consumes: `CustomEvent("ti2-dsp-frontpanel", {detail: dspFrontpanel | null})`.
- Produces: `data-ti2-dsp-lfo="1"|"2"|"3"` on the corresponding SVG circles; `fill` transitions based on the upstream phase mapping.

- [ ] Write Node behavior tests for endpoints, interpolation, invalid/stale/null data, and isolation from non-LFO LEDs.
- [ ] Run `node --test hybrid/tests/test_dsp_lfo_ui.cjs` and observe feature-specific failures.
- [ ] Tag only the existing LFO circles and implement the event-driven renderer; include it after the current panel scripts.
- [ ] Re-run Node tests and confirm green.
- [ ] Commit the verified task.

### Task 2: Live status cadence and delivery

**Files:**
- Modify: `hybrid/ui/app.js`, `hybrid/server.py`, `hybrid/tests/test_hybrid.py`, `hybrid/tests/test_dsp_lfo_ui.cjs`.

**Interfaces:**
- Consumes: existing local `/api/status` JSON.
- Produces: frequent nonoverlapping browser requests; `ti2-dsp-frontpanel` events including null on errors; native PING every ~100 ms; HTTP access to the new script.

- [ ] Write failing tests for real event delivery, HTTP asset serving, and native polling cadence.
- [ ] Run targeted Node/Python tests and observe feature-specific failures.
- [ ] Implement the smallest status event, request guard, route, and cadence changes.
- [ ] Run targeted tests and the full Python and Node suites; check JS syntax and diff whitespace.
- [ ] Commit and prepare isolated draft PR based on v0.12.
