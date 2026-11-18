#!/usr/bin/env python3
"""OsTIrus Web: local-only browser controller for the native TI2 CoreAudio host.

The ROM is read only by the local native executable. It is never served over HTTP.
No third-party Python dependencies and no internet connection are required.
"""
import argparse
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import math
from pathlib import Path
import re
import signal
import subprocess
import sys
import threading
import time
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
UI_DIR = ROOT / "ui"
MAX_POST_BYTES = 512
MIDI_RANGE = range(128)
HEALTH_RE = re.compile(
    r"^\[OSTIRUS_HEALTH\] blocks=(\d+) peak=([+-]?\d+(?:\.\d+)?) pair=(\d+) errors=(\d+)$"
)
# Only the scalar indicators emitted by Gearmulator's DSP FrontpanelState.
# Not patch values, mode, program name, selection focus, or raw SysEx.
FLOAT_RE = r"([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)"
FRONT_RE = re.compile(
    r"^\[OSTIRUS_FRONT\] revision=(\d+) lfo1=" + FLOAT_RE +
    r" lfo2=" + FLOAT_RE + r" lfo3=" + FLOAT_RE +
    r" bpm=" + FLOAT_RE + r" logo=" + FLOAT_RE + r" activity=(\d+)$"
)


def midi_line(data):
    """Validate and translate browser events into the native host's MIDI protocol."""
    if not isinstance(data, dict):
        raise ValueError("JSON object required")
    kind = data.get("type")
    a, b = data.get("note"), data.get("velocity")

    def midi_number(value):
        return type(value) is int and value in MIDI_RANGE

    if kind == "note_on":
        if midi_number(a) and type(b) is int and 1 <= b <= 127:
            return f"NOTE {a} {b}"
    elif kind == "note_off":
        if midi_number(a):
            return f"OFF {a}"
    elif kind == "program":
        p = data.get("program")
        if midi_number(p):
            return f"PROG {p}"
    elif kind == "cc":
        controller, value = data.get("controller"), data.get("value")
        if midi_number(controller) and midi_number(value):
            return f"CC {controller} {value}"
    elif kind == "panic":
        return "CC 123 0"
    raise ValueError("Invalid MIDI event")


class NativeHost:
    def __init__(self, engine, rom):
        if not Path(engine).is_file():
            raise FileNotFoundError("Native engine executable not found")
        if not Path(rom).is_file():
            raise FileNotFoundError("Local firmware not found")
        self.process = subprocess.Popen(
            [str(Path(engine).resolve()), "--rom", str(Path(rom).resolve())],
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        self._lock = threading.Lock()
        self._state_lock = threading.Lock()
        self._stopped = threading.Event()
        self.ready = False
        self.blocks = 0
        self.peak = 0.0
        self.pair = 0
        self.errors = 0
        self.last_health = None
        self.frontpanel = None
        self.last_frontpanel = None
        self.messages = deque(maxlen=6)
        threading.Thread(target=self._read_stderr, daemon=True).start()
        threading.Thread(target=self._ping_loop, daemon=True).start()

    def _read_stderr(self):
        for raw in self.process.stderr:
            line = raw.strip()
            health = HEALTH_RE.fullmatch(line)
            front = FRONT_RE.fullmatch(line)
            with self._state_lock:
                if line.startswith("[OSTIRUS_READY]"):
                    self.ready = True
                elif health:
                    self.blocks = int(health.group(1))
                    self.peak = float(health.group(2))
                    self.pair = int(health.group(3))
                    self.errors = int(health.group(4))
                    self.last_health = time.monotonic()
                elif front:
                    revision = int(front.group(1))
                    levels = [float(front.group(i)) for i in (2, 3, 4)]
                    bpm, logo = float(front.group(5)), float(front.group(6))
                    activity = int(front.group(7))
                    if (revision > 0 and all(math.isfinite(v) for v in levels + [bpm, logo])
                            and 0 <= activity <= 65535
                            and (self.frontpanel is None or revision > self.frontpanel["revision"])):
                        self.frontpanel = {
                            "source": "dsp-frontpanel",
                            "revision": revision,
                            "lfoLedLevels": levels,
                            "bpmLedLevel": bpm,
                            "logoLedLevel": logo,
                            "midiActivityMask": activity,
                        }
                        self.last_frontpanel = time.monotonic()
                elif line.startswith("[OSTIRUS_ERROR]"):
                    # Do not propagate arbitrary firmware paths or exception text into the UI.
                    self.messages.append("El motor nativo ha comunicado un error.")
        self._stopped.set()

    def _send(self, line):
        if self.process.poll() is not None:
            return False
        with self._lock:
            try:
                self.process.stdin.write(line + "\n")
                self.process.stdin.flush()
                return True
            except (OSError, ValueError, BrokenPipeError):
                return False

    def send_midi(self, payload):
        return self._send(midi_line(payload))

    def _ping_loop(self):
        while not self._stopped.wait(1.0):
            if not self._send("PING"):
                return

    def status(self):
        with self._state_lock:
            up = self.process.poll() is None
            # Never report stale or nonexistent DSP indicators as live.
            feedback = None
            if (up and self.frontpanel is not None and self.last_frontpanel is not None
                    and time.monotonic() - self.last_frontpanel < 3.0):
                feedback = dict(self.frontpanel)
                feedback["ageSeconds"] = round(time.monotonic() - self.last_frontpanel, 2)
            return {
                "nativeRunning": up,
                "nativeReady": up and self.ready,
                "blocks": self.blocks,
                "peak": round(self.peak, 6),
                "stereoPair": self.pair + 1,
                "audioErrors": self.errors,
                "healthAgeSeconds": None if self.last_health is None
                    else round(time.monotonic() - self.last_health, 1),
                "messages": list(self.messages),
                "dspFrontpanel": feedback,
                "architecture": "Native CoreAudio · local MIDI via HTTP",
                "firmware": "Fichero local, nunca enviado al navegador",
            }

    def stop(self):
        self._stopped.set()
        self._send("STOP")
        try:
            self.process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            self.process.terminate()
            try:
                self.process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.process.kill()


class LocalHandler(BaseHTTPRequestHandler):
    backend = None

    def _allowed_host(self):
        return self.headers.get("Host", "") in {
            f"127.0.0.1:{self.server.server_port}",
            f"localhost:{self.server.server_port}",
        }

    def _response(self, code, content, mime):
        self.send_response(code)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'")
        self.end_headers()
        self.wfile.write(content)

    def _json(self, code, obj):
        self._response(code, json.dumps(obj, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def do_GET(self):
        if not self._allowed_host():
            return self._json(403, {"error": "Invalid local host"})
        path = urlsplit(self.path).path
        if path == "/api/status":
            return self._json(200, self.backend.status())
        files = {
            "/": ("index.html", "text/html; charset=utf-8"),
            "/index.html": ("index.html", "text/html; charset=utf-8"),
            "/app.js": ("app.js", "text/javascript; charset=utf-8"),
            "/style.css": ("style.css", "text/css; charset=utf-8"),
            "/ti2-panel.css": ("ti2-panel.css", "text/css; charset=utf-8"),
            "/ti2-panel.js": ("ti2-panel.js", "text/javascript; charset=utf-8"),
            "/ti2-v06.css": ("ti2-v06.css", "text/css; charset=utf-8"),
            "/ti2-v06.js": ("ti2-v06.js", "text/javascript; charset=utf-8"),
            "/ti2-precision.css": ("ti2-precision.css", "text/css; charset=utf-8"),
            "/ti2-precision.js": ("ti2-precision.js", "text/javascript; charset=utf-8"),
            "/ti2-controls-v08.js": ("ti2-controls-v08.js", "text/javascript; charset=utf-8"),
            "/ti2-controls-v09.js": ("ti2-controls-v09.js", "text/javascript; charset=utf-8"),
            "/ti2-controls-v10.js": ("ti2-controls-v10.js", "text/javascript; charset=utf-8"),
        }
        entry = files.get(path)
        if not entry:
            return self._json(404, {"error": "Not found"})
        file_path = UI_DIR / entry[0]
        try:
            data = file_path.read_bytes()
        except FileNotFoundError:
            return self._json(500, {"error": "Missing UI asset"})
        return self._response(200, data, entry[1])

    def do_POST(self):
        if not self._allowed_host():
            return self._json(403, {"error": "Invalid local host"})
        origin = self.headers.get("Origin")
        if origin and origin not in {
            f"http://127.0.0.1:{self.server.server_port}",
            f"http://localhost:{self.server.server_port}",
        }:
            return self._json(403, {"error": "Cross-origin blocked"})
        if urlsplit(self.path).path != "/api/midi":
            return self._json(404, {"error": "Not found"})
        try:
            n = int(self.headers.get("Content-Length", "-1"))
            if not 1 <= n <= MAX_POST_BYTES:
                raise ValueError("Payload size")
            payload = json.loads(self.rfile.read(n))
            command = midi_line(payload)
        except (ValueError, TypeError, json.JSONDecodeError):
            return self._json(400, {"error": "Invalid MIDI request"})
        if not self.backend._send(command):
            return self._json(503, {"error": "Native engine unavailable"})
        return self._json(200, {"sent": True})

    def log_message(self, *_args):
        return


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", required=True)
    parser.add_argument("--rom", required=True)
    parser.add_argument("--port", type=int, default=8088)
    args = parser.parse_args()
    if args.port < 1024 or args.port > 65535:
        parser.error("Port out of range")
    # Bind the port before starting native audio, avoiding an orphan process if
    # another local service already occupies the listening socket.
    server = ThreadingHTTPServer(("127.0.0.1", args.port), LocalHandler)
    host = None
    try:
        host = NativeHost(args.engine, args.rom)
        LocalHandler.backend = host

        def graceful_shutdown(_signum, _frame):
            # shutdown() must run in a different thread from serve_forever().
            threading.Thread(target=server.shutdown, daemon=True).start()

        signal.signal(signal.SIGTERM, graceful_shutdown)
        print(f"OsTIrus Web Nativo en http://127.0.0.1:{args.port}/", flush=True)
        try:
            server.serve_forever(poll_interval=0.2)
        except KeyboardInterrupt:
            pass
    finally:
        server.server_close()
        if host is not None:
            host.stop()


if __name__ == "__main__":
    main()
