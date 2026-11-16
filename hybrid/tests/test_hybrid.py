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


FAKE_HOST = """#!/usr/bin/env python3
import sys
print("[OSTIRUS_READY] audio=CoreAudio rate=44100", file=sys.stderr, flush=True)
for line in sys.stdin:
    line=line.strip()
    if line=="PING":
        print("[OSTIRUS_HEALTH] blocks=25 peak=0.1234 pair=1 errors=0", file=sys.stderr, flush=True)
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
            self.assertIn("OsTIrus", response.read().decode("utf-8"))
            self.assertIn("nosniff", response.headers["X-Content-Type-Options"])


if __name__ == "__main__":
    unittest.main()
