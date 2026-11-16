"use strict";

// Browser UI only sends MIDI to 127.0.0.1. No ROM, audio processing,
// network dependency, localStorage or external CDNs are used.
const el = (id) => document.getElementById(id);
const heldNotes = new Set();
const whiteSemitones = new Set([0, 2, 4, 5, 7, 9, 11]);
const typingKeys = "awsedftgyhuj";
let lastStatus = null;

async function sendMidi(message) {
  const response = await fetch("/api/midi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("El motor no ha aceptado el mensaje MIDI");
  return response.json();
}

function showMidiError(message) {
  el("midiInfo").textContent = message;
}

function noteOn(note, velocity = 100) {
  if (!Number.isInteger(note) || note < 0 || note > 127 || heldNotes.has(note)) return;
  heldNotes.add(note);
  const key = document.querySelector('[data-note="' + note + '"]');
  if (key) key.classList.add("active");
  sendMidi({ type: "note_on", note, velocity }).catch(() => showMidiError("Sin comunicación con el motor nativo"));
}

function noteOff(note) {
  if (!heldNotes.delete(note)) return;
  const key = document.querySelector('[data-note="' + note + '"]');
  if (key) key.classList.remove("active");
  sendMidi({ type: "note_off", note }).catch(() => showMidiError("Sin comunicación con el motor nativo"));
}

function releaseAll() {
  for (const note of [...heldNotes]) noteOff(note);
  sendMidi({ type: "panic" }).catch(() => {});
}

function buildKeys() {
  const keyboard = el("keyboard");
  let whites = 0;
  for (let note = 48; note <= 72; note++) {
    const semitone = note % 12;
    const white = whiteSemitones.has(semitone);
    const key = document.createElement("button");
    key.type = "button";
    key.className = white ? "key white" : "key black";
    key.dataset.note = String(note);
    key.setAttribute("aria-label", "Nota MIDI " + note);
    if (white) {
      key.style.order = String(whites);
      if (semitone === 0) key.textContent = "C" + (Math.floor(note / 12) - 1);
      whites++;
    } else {
      key.style.left = (whites * 54 - 17) + "px";
    }
    key.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      key.setPointerCapture(ev.pointerId);
      noteOn(note);
    });
    key.addEventListener("pointerup", () => noteOff(note));
    key.addEventListener("pointercancel", () => noteOff(note));
    key.addEventListener("lostpointercapture", () => noteOff(note));
    keyboard.appendChild(key);
  }
}

function buildPrograms() {
  const select = el("program");
  for (let i = 0; i < 128; i++) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = "Programa " + (i + 1);
    select.appendChild(option);
  }
  select.addEventListener("change", () => {
    sendMidi({ type: "program", program: Number(select.value) })
      .catch(() => showMidiError("No se pudo cambiar el programa"));
  });
}

function displayStatus(state) {
  lastStatus = state;
  const running = Boolean(state.nativeRunning);
  const ready = Boolean(state.nativeReady);
  const age = state.healthAgeSeconds;
  const hasHeartbeat = typeof age === "number" && age < 4;
  const blocks = Number(state.blocks) || 0;
  const peak = Math.max(0, Number(state.peak) || 0);
  const pair = Number(state.stereoPair) || 1;
  const errors = Number(state.audioErrors) || 0;

  el("engine").textContent = !running ? "Detenido" : !ready ? "Iniciando…" : "CoreAudio activo";
  el("engineDetail").textContent = ready
    ? (hasHeartbeat ? "Telemetría recibida" : "Esperando respuesta del DSP")
    : "Sin confirmación de arranque";
  el("blocks").textContent = blocks.toLocaleString("es-ES");
  el("pair").textContent = "Par estéreo " + pair + " / 6";
  el("errors").textContent = "Errores de proceso: " + errors;
  const db = peak > 0 ? Math.max(-120, 20 * Math.log10(peak)) : -Infinity;
  el("level").textContent = Number.isFinite(db) ? db.toFixed(1) + " dBFS" : "Sin señal (0)";
  el("levelBar").style.width = peak <= 0 ? "0%" : Math.min(100, Math.max(3, ((db + 80) / 80) * 100)) + "%";

  const badge = el("connection");
  badge.className = "status-pill " + (!running ? "bad" : hasHeartbeat && ready ? "good" : "");
  badge.textContent = !running ? "Motor detenido" : !ready ? "Arrancando" : hasHeartbeat ? "Motor conectado" : "Motor sin respuesta";
  const title = el("diagnosisTitle"), detail = el("diagnosis");
  if (!running) {
    title.textContent = "El proceso nativo ha terminado";
    detail.textContent = "Revisa el Terminal que abrió OsTIrus. No se ha confirmado salida de audio.";
  } else if (!ready) {
    title.textContent = "Comprobando inicialización del firmware";
    detail.textContent = "El motor todavía no ha enviado la confirmación de CoreAudio.";
  } else if (errors > 0) {
    title.textContent = "Se ha producido un error durante el procesado";
    detail.textContent = "El contador de errores del callback es " + errors + ". No asumas que el motor esté produciendo sonido.";
  } else if (!hasHeartbeat || blocks === 0) {
    title.textContent = "Motor iniciado; ejecución de audio por verificar";
    detail.textContent = "CoreAudio está abierto, pero todavía no se ha comprobado que los bloques de audio avancen.";
  } else if (peak > 0.00001) {
    title.textContent = "Señal PCM nativa detectada";
    detail.textContent = "Se han medido muestras de audio no nulas en el par estéreo " + pair + ". Confirma escuchando los altavoces del Mac.";
  } else {
    title.textContent = "DSP procesando; salida digital en silencio";
    detail.textContent = "Los bloques aumentan, pero la señal es cero. Prueba varios programas; si persiste, hay que revisar el arranque del firmware.";
  }
}

async function updateStatus() {
  try {
    const result = await fetch("/api/status", { cache: "no-store" });
    if (!result.ok) throw new Error("Server unavailable");
    displayStatus(await result.json());
  } catch (_err) {
    if (lastStatus !== null) {
      el("connection").className = "status-pill bad";
      el("connection").textContent = "Servidor desconectado";
      el("diagnosisTitle").textContent = "Sin conexión con el servidor local";
    }
  }
}

function onMidiMessage(event) {
  const [status, data1, data2] = event.data || [];
  if (status === undefined || data1 === undefined) return;
  switch (status & 0xf0) {
    case 0x90:
      if (data2 > 0) noteOn(data1, data2); else noteOff(data1);
      break;
    case 0x80:
      noteOff(data1);
      break;
    case 0xb0:
      sendMidi({ type: "cc", controller: data1, value: data2 }).catch(() => {});
      break;
    case 0xc0:
      el("program").value = String(data1);
      sendMidi({ type: "program", program: data1 }).catch(() => {});
      break;
    default:
      break;
  }
}

async function connectMidi() {
  if (!navigator.requestMIDIAccess) {
    showMidiError("Este navegador no permite MIDI externo; el teclado de pantalla sí funciona");
    return;
  }
  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });
    function attach() {
      const inputs = [...access.inputs.values()];
      inputs.forEach(input => input.onmidimessage = onMidiMessage);
      showMidiError(inputs.length ? "MIDI conectado: " + inputs.map(input => input.name).join(", ") : "MIDI autorizado, pero no hay un teclado conectado");
    }
    attach();
    access.onstatechange = attach;
  } catch (_err) {
    showMidiError("Permiso MIDI denegado. Puedes seguir usando el teclado de pantalla.");
  }
}

function setupComputerKeyboard() {
  const notes = Array.from({ length: typingKeys.length }, (_, i) => i + 60);
  window.addEventListener("keydown", ev => {
    if (ev.repeat || ev.metaKey || ev.ctrlKey || ev.altKey || ev.target.closest("input,select,textarea")) return;
    const idx = typingKeys.indexOf(ev.key.toLowerCase());
    if (idx >= 0) { ev.preventDefault(); noteOn(notes[idx]); }
  });
  window.addEventListener("keyup", ev => {
    const idx = typingKeys.indexOf(ev.key.toLowerCase());
    if (idx >= 0) noteOff(notes[idx]);
  });
  window.addEventListener("blur", releaseAll);
  document.addEventListener("visibilitychange", () => { if (document.hidden) releaseAll(); });
}

buildPrograms();
buildKeys();
setupComputerKeyboard();
el("panic").addEventListener("click", releaseAll);
el("external").addEventListener("click", connectMidi);
updateStatus();
setInterval(updateStatus, 950);
