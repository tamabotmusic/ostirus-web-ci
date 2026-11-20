"""Safe integration tests. No ROM, sound driver or hardware required."""
import importlib.util
from pathlib import Path
import json
import os
import stat
import tempfile
import threading
import time
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from http.server import ThreadingHTTPServer

SERVER_FILE = Path(__file__).resolve().parents[1] / "server.py"
spec = importlib.util.spec_from_file_location("ostirus_hybrid_server", SERVER_FILE)
server_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server_module)


class ValidationTests(unittest.TestCase):
    def test_note_on_off(self):
        self.assertEqual(server_module.midi_line({"type": "note_on", "note": 60, "velocity": 100}), "NOTE 60 100")
        self.assertEqual(server_module.midi_line({"type": "note_off", "note": 60}), "OFF 60")

    def test_program_and_cc(self):
        self.assertEqual(server_module.midi_line({"type": "program", "program": 127}), "PROG 127")
        self.assertEqual(server_module.midi_line({"type": "cc", "controller": 123, "value": 0}), "CC 123 0")

    def test_lfo3_rate_only_accepts_midi_values(self):
        for value in (0, 65, 127):
            self.assertEqual(server_module.midi_line({"type": "lfo3_rate", "value": value}),
                             f"LFO3_RATE {value}")
        for value in (-1, 128, True, "65", None):
            with self.subTest(value=value), self.assertRaises(ValueError):
                server_module.midi_line({"type": "lfo3_rate", "value": value})

    def test_panic(self):
        self.assertEqual(server_module.midi_line({"type": "panic"}), "CC 123 0")

    def test_reject_malformed_messages(self):
        bad = [
            {}, {"type": "note_on", "note": 128, "velocity": 90},
            {"type": "note_on", "note": 60, "velocity": 0},
            {"type": "note_on", "note": True, "velocity": 70},
            {"type": "note_off", "note": -1},
            {"type": "program", "program": "5"},
            {"type": "cc", "controller": 200, "value": 4},
            {"type": "cc", "controller": 5, "value": 300},
            {"type": "note_on", "note": 60, "velocity": 100, "path": "../../secret"},
        ]
        for item in bad[:-1]:
            with self.subTest(item=item), self.assertRaises(ValueError):
                server_module.midi_line(item)
        # An irrelevant path key is ignored, never used by the server.
        self.assertEqual(server_module.midi_line(bad[-1]), "NOTE 60 100")

    def test_native_health_accepts_scientific_peak_values(self):
        """Quiet DSP peaks must not freeze the CoreAudio block counter."""
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            engine = base / "fake-quiet-engine"
            engine.write_text('''#!/usr/bin/env python3
import sys
print("[OSTIRUS_READY] audio=CoreAudio rate=44100", file=sys.stderr, flush=True)
for line in sys.stdin:
    if line.strip() == "PING":
        print("[OSTIRUS_HEALTH] blocks=33579 peak=1.2e-05 pair=0 errors=0", file=sys.stderr, flush=True)
    elif line.strip() == "STOP":
        break
''', encoding="utf-8")
            engine.chmod(engine.stat().st_mode | stat.S_IXUSR)
            firmware = base / "fake-firmware.bin"
            firmware.write_bytes(b"test only")
            host = server_module.NativeHost(str(engine), str(firmware))
            try:
                deadline = time.monotonic() + 3
                while time.monotonic() < deadline and host.status()["blocks"] == 0:
                    time.sleep(0.05)
                status = host.status()
                self.assertEqual(status["blocks"], 33579)
                self.assertEqual(status["peak"], 0.000012)
                self.assertLess(status["healthAgeSeconds"], 3)
            finally:
                host.stop()
                host.process.stdin.close()
                host.process.stderr.close()

    def test_native_health_ignores_nonfinite_peak_values(self):
        """Malformed large exponents cannot poison the JSON status endpoint."""
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            engine = base / "fake-overflow-engine"
            engine.write_text('''#!/usr/bin/env python3
import sys
print("[OSTIRUS_READY] audio=CoreAudio rate=44100", file=sys.stderr, flush=True)
for line in sys.stdin:
    if line.strip() == "PING":
        print("[OSTIRUS_HEALTH] blocks=77 peak=1e999 pair=0 errors=0", file=sys.stderr, flush=True)
        print("[OSTIRUS_FRONT] revision=1 lfo1=0 lfo2=0 lfo3=0 bpm=0 logo=0 activity=0", file=sys.stderr, flush=True)
    elif line.strip() == "STOP":
        break
''', encoding="utf-8")
            engine.chmod(engine.stat().st_mode | stat.S_IXUSR)
            firmware = base / "fake-firmware.bin"
            firmware.write_bytes(b"test only")
            host = server_module.NativeHost(str(engine), str(firmware))
            try:
                deadline = time.monotonic() + 3
                while time.monotonic() < deadline and host.status()["dspFrontpanel"] is None:
                    time.sleep(0.05)
                status = host.status()
                self.assertIsNotNone(status["dspFrontpanel"], "Fake PING was not processed")
                self.assertEqual(status["blocks"], 0)
                self.assertIsNone(status["healthAgeSeconds"])
            finally:
                host.stop()
                host.process.stdin.close()
                host.process.stderr.close()

    def test_native_frontpanel_polling_is_frequent_enough_for_lfo_motion(self):
        """Several DSP phase updates must arrive within one second."""
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            engine = base / "fake-moving-lfo-engine"
            engine.write_text('''#!/usr/bin/env python3
import sys
revision = 0
print("[OSTIRUS_READY] audio=CoreAudio rate=44100", file=sys.stderr, flush=True)
for line in sys.stdin:
    if line.strip() == "PING":
        revision += 1
        print(f"[OSTIRUS_HEALTH] blocks={revision} peak=0 pair=0 errors=0", file=sys.stderr, flush=True)
        print(f"[OSTIRUS_FRONT] revision={revision} lfo1=0.2 lfo2=0.4 lfo3=0.8 bpm=0 logo=0 activity=0", file=sys.stderr, flush=True)
    elif line.strip() == "STOP":
        break
''', encoding="utf-8")
            engine.chmod(engine.stat().st_mode | stat.S_IXUSR)
            firmware = base / "fake-firmware.bin"
            firmware.write_bytes(b"test only")
            host = server_module.NativeHost(str(engine), str(firmware))
            try:
                time.sleep(0.65)
                self.assertGreaterEqual(host.status()["blocks"], 3)
            finally:
                host.stop()
                host.process.stdin.close()
                host.process.stderr.close()


FAKE_HOST = """#!/usr/bin/env python3
import sys
print("[OSTIRUS_READY] audio=CoreAudio rate=44100", file=sys.stderr, flush=True)
for line in sys.stdin:
    line=line.strip()
    if line=="PING":
        print("[OSTIRUS_HEALTH] blocks=25 peak=0.1234 pair=1 errors=0", file=sys.stderr, flush=True)
        print("[OSTIRUS_FRONT] revision=23 lfo1=0.2 lfo2=0.4 lfo3=0.8 bpm=0.3 logo=0.9 activity=3", file=sys.stderr, flush=True)
    elif line=="STOP":
        break
"""


class LocalHTTPTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        directory = Path(self.tmp.name)
        self.engine = directory / "fake-engine"
        self.engine.write_text(FAKE_HOST, encoding="utf-8")
        self.engine.chmod(self.engine.stat().st_mode | stat.S_IXUSR)
        self.rom = directory / "private-test-firmware.bin"
        self.rom.write_bytes(b"TEST ONLY - no proprietary data")
        self.backend = server_module.NativeHost(str(self.engine), str(self.rom))
        handler = type("TestLocalHandler", (server_module.LocalHandler,), {"backend": self.backend})
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.port = self.httpd.server_port
        self.url = f"http://127.0.0.1:{self.port}"
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.httpd.shutdown()
        self.httpd.server_close()
        self.backend.stop()
        self.thread.join(timeout=2)
        self.tmp.cleanup()

    def request(self, path, method="GET", data=None, headers=None):
        values = {"Host": f"127.0.0.1:{self.port}"}
        if headers:
            values.update(headers)
        payload = None if data is None else json.dumps(data).encode("utf-8")
        if payload is not None:
            values["Content-Type"] = "application/json"
        return urlopen(Request(self.url + path, data=payload, headers=values, method=method), timeout=3)

    def test_status_progresses_and_avoids_rom_path(self):
        deadline = time.monotonic() + 3
        state = {}
        while time.monotonic() < deadline:
            state = json.load(self.request("/api/status"))
            if state["blocks"] == 25:
                break
            time.sleep(0.1)
        self.assertEqual(state["blocks"], 25)
        self.assertTrue(state["nativeReady"])
        self.assertEqual(state["peak"], 0.1234)
        self.assertEqual(state["stereoPair"], 2)
        self.assertNotIn("private-test-firmware.bin", json.dumps(state))

    def test_dsp_frontpanel_feedback_is_real_or_absent(self):
        deadline = time.monotonic() + 3
        state = {}
        while time.monotonic() < deadline:
            state = json.load(self.request("/api/status"))
            if state["dspFrontpanel"] is not None:
                break
            time.sleep(0.1)
        front = state["dspFrontpanel"]
        self.assertIsNotNone(front)
        self.assertEqual(front["source"], "dsp-frontpanel")
        self.assertEqual(front["revision"], 23)
        self.assertEqual(front["lfoLedLevels"], [0.2, 0.4, 0.8])
        self.assertEqual(front["midiActivityMask"], 3)
        self.assertLess(front["ageSeconds"], 3)
        self.assertNotIn("patch", json.dumps(front).lower())
        self.assertNotIn("sysex", json.dumps(front).lower())
        # A feedback packet older than three seconds is not presented as live.
        with self.backend._state_lock:
            self.backend.last_frontpanel = time.monotonic() - 10
        self.assertIsNone(self.backend.status()["dspFrontpanel"])

    def test_duplicate_dsp_revision_cannot_refresh_stale_feedback(self):
        deadline = time.monotonic() + 3
        while time.monotonic() < deadline:
            if self.backend.status()["dspFrontpanel"] is not None:
                break
            time.sleep(0.05)
        self.assertIsNotNone(self.backend.status()["dspFrontpanel"])
        with self.backend._state_lock:
            self.backend.last_frontpanel = time.monotonic() - 10
        # Fake native process continues responding to PING, but always with
        # the same DSP revision. These repetitions must not revive old LEDs.
        time.sleep(1.25)
        self.assertIsNone(self.backend.status()["dspFrontpanel"])

    def test_valid_midi_sent(self):
        data = json.load(self.request("/api/midi", method="POST", data={"type": "note_on", "note": 60, "velocity": 94}))
        self.assertTrue(data["sent"])

    def test_firmware_never_served(self):
        for name in ["/private-test-firmware.bin", "/../private-test-firmware.bin", "/api/rom", "/.env"]:
            with self.subTest(name=name), self.assertRaises(HTTPError) as error:
                self.request(name)
            self.assertEqual(error.exception.code, 404)

    def test_cross_origin_post_rejected(self):
        with self.assertRaises(HTTPError) as error:
            self.request("/api/midi", method="POST", data={"type": "panic"}, headers={"Origin": "https://elsewhere.example"})
        self.assertEqual(error.exception.code, 403)

    def test_invalid_midi_rejected(self):
        with self.assertRaises(HTTPError) as error:
            self.request("/api/midi", method="POST", data={"type": "note_on", "note": 300, "velocity": 1})
        self.assertEqual(error.exception.code, 400)

    def test_only_ui_assets_served(self):
        with self.request("/") as response:
            html = response.read().decode("utf-8")
            self.assertIn("OsTIrus", html)
            self.assertIn("PANEL v0.15", html)
            self.assertIn("nosniff", response.headers["X-Content-Type-Options"])
        with self.request("/ti2-dsp-lfo-v13.js") as response:
            self.assertEqual(response.status, 200)
            self.assertIn("javascript", response.headers["Content-Type"])
            self.assertGreater(len(response.read()), 100)
        with self.request("/ti2-lfo-rate-v15.js") as response:
            self.assertEqual(response.status, 200)
            self.assertIn("javascript", response.headers["Content-Type"])
            self.assertGreater(len(response.read()), 100)


if __name__ == "__main__":
    unittest.main()
