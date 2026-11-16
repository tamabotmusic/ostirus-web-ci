#!/usr/bin/env node
'use strict';
// Headless smoke test of the compiled GPL WASM engine.
// CI mode never reads a firmware. Optional --rom runs locally in a guarded Worker.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const { performance } = require('node:perf_hooks');

async function engineProbe({ engineDir, romPath }) {
  global.self = { location: { href: pathToFileURL(__filename).href } };
  const create = require(path.join(engineDir, 'ostirus_engine.js'));
  const wasmBinary = fs.readFileSync(path.join(engineDir, 'ostirus_engine.wasm'));
  const mod = await create({ wasmBinary, print: () => {}, printErr: () => {} });
  parentPort.postMessage({ stage: 'wasm-instantiated' });
  const inst = mod._gmr_create(1, 44100);
  if (!inst) throw new Error('gmr_create returned 0');
  parentPort.postMessage({ stage: 'instance-created' });
  const unloaded = mod._gmr_process(inst, 0, 0, 128, 0, 0, 0, 0, 0);
  if (unloaded !== -1) throw new Error('gmr_process without ROM did not return -1');
  parentPort.postMessage({ stage: 'unloaded-state-verified' });
  if (!romPath) {
    mod._gmr_destroy(inst);
    return { ok: true, mode: 'ci-no-rom', unloadedResult: unloaded };
  }
  const data = fs.readFileSync(romPath);
  const romPtr = mod._malloc(data.byteLength);
  if (!romPtr) throw new Error('ROM allocation failed');
  mod.HEAPU8.set(data, romPtr);
  parentPort.postMessage({ stage: 'rom-load-start' });
  const start = performance.now();
  const code = mod._gmr_load_rom(inst, romPtr, data.length);
  const romLoadMs = Math.round(performance.now() - start);
  mod._free(romPtr);
  parentPort.postMessage({ stage: 'rom-load-finished', code, romLoadMs });
  if (code !== 0) return { ok: false, mode: 'local-rom', stage: 'rom-load-finished', code, romLoadMs };
  const frames = 128;
  const audioPtr = mod._malloc(frames * 2 * 4);
  const midiPtr = mod._malloc(3);
  const midiOutSizePtr = mod._malloc(4);
  if (!audioPtr || !midiPtr || !midiOutSizePtr) throw new Error('Audio/MIDI allocation failed');
  mod.HEAPU8.set(Uint8Array.of(0x90, 60, 100), midiPtr);
  const pStart = performance.now();
  const processResult = mod._gmr_process(inst, 0, audioPtr, frames, midiPtr, 3, 0, 0, midiOutSizePtr);
  const processMs = Math.round(performance.now() - pStart);
  const audio = mod.HEAPF32.subarray(audioPtr / 4, audioPtr / 4 + frames * 2);
  let peak = 0;
  for (const sample of audio) {
    if (!Number.isFinite(sample)) throw new Error('Nonfinite PCM sample');
    peak = Math.max(peak, Math.abs(sample));
  }
  mod._free(audioPtr);
  mod._free(midiPtr);
  mod._free(midiOutSizePtr);
  mod._gmr_destroy(inst);
  return { ok: processResult === 0, mode: 'local-rom', processResult, romLoadMs, processMs, firstBlockPeak: peak };
}

if (!isMainThread) {
  engineProbe(workerData).then(
    (result) => parentPort.postMessage({ type: 'complete', ...result }),
    (error) => parentPort.postMessage({ type: 'failure', message: String(error.message || error) })
  );
} else {
  const args = process.argv.slice(2);
  function option(name, fallback = null) {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : fallback;
  }
  const engineDir = path.resolve(option('--engine-dir', process.cwd()));
  const romPath = option('--rom');
  const timeoutMs = Math.min(120000, Math.max(1000, Number(option('--timeout-ms', romPath ? '15000' : '5000'))));
  const worker = new Worker(__filename, { workerData: { engineDir, romPath } });
  let lastStage = 'started';
  let settled = false;
  const start = performance.now();
  function finish(result, exitCode) {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    console.log(JSON.stringify({ ...result, elapsedMs: Math.round(performance.now() - start) }));
    process.exitCode = exitCode;
    worker.terminate().catch(() => {});
  }
  const timer = setTimeout(() => finish({ ok: false, reason: 'timeout', lastStage, mode: romPath ? 'local-rom' : 'ci-no-rom' }, 1), timeoutMs);
  worker.on('message', (message) => {
    if (message.type === 'complete') finish(message, message.ok ? 0 : 1);
    else if (message.type === 'failure') finish({ ok: false, error: message.message, lastStage }, 1);
    else if (message.stage) lastStage = message.stage;
  });
  worker.on('error', (error) => finish({ ok: false, error: String(error), lastStage }, 1));
  worker.on('exit', (code) => { if (!settled) finish({ ok: false, reason: 'worker-exit', code, lastStage }, 1); });
}
