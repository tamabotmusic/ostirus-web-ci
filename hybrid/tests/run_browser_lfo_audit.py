"""Exercise the packaged TI2 UI in Chromium with a ROM-free engine fixture."""
import argparse
from http.server import ThreadingHTTPServer
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from threading import Thread

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class EngineFixture:
    def __init__(self):
        self.commands = []
        self.age = 0

    def status(self):
        return {
            "nativeRunning": True,
            "nativeReady": True,
            "healthAgeSeconds": 0,
            "dspFrontpanel": {
                "source": "dsp-frontpanel",
                "revision": 1,
                "ageSeconds": self.age,
                "lfoLedLevels": [0.5, 0, 1],
            },
        }

    def _send(self, command):
        self.commands.append(command)
        return True


class AuditHandler(server.LocalHandler):
    backend = EngineFixture()

    def do_GET(self):
        if self.path == "/audit.js":
            script = Path(__file__).with_name("browser_lfo_audit.js").read_bytes()
            return self._response(200, script, "text/javascript")
        if self.path == "/audit/midi":
            return self._json(200, self.backend.commands)
        if self.path == "/audit/end-feedback":
            self.backend.age = 4
            return self._json(200, {})
        return super().do_GET()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ui", type=Path, help="UI directory to verify")
    parser.add_argument("--browser", required=True)
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as temporary:
        server.UI_DIR = Path(temporary) / "ui"
        shutil.copytree(args.ui, server.UI_DIR)
        index = server.UI_DIR / "index.html"
        index.write_text(index.read_text(encoding="utf-8").replace(
            "</head>", '<script defer src="/audit.js"></script></head>'), encoding="utf-8")

        with ThreadingHTTPServer(("127.0.0.1", 0), AuditHandler) as http:
            worker = Thread(target=http.serve_forever, daemon=True)
            worker.start()
            try:
                run = subprocess.run([
                    args.browser, "--headless", "--no-sandbox", "--disable-dev-shm-usage",
                    "--window-size=1600,1000", "--virtual-time-budget=8000", "--dump-dom",
                    f"--user-data-dir={temporary}/browser", f"http://127.0.0.1:{http.server_port}/",
                ], capture_output=True, text=True, timeout=30)
            finally:
                http.shutdown()
                worker.join()

        if run.returncode != 0:
            raise SystemExit(run.stderr or f"Chrome terminó con código {run.returncode}")

        output = re.search(r'<output id="lfo-audit">(.*?)</output>', run.stdout, re.S)
        if output is None or output.group(1) != "PASS":
            raise SystemExit(output.group(1) if output else "La auditoría no se ejecutó")
        print("PASS: selección LFO, MIDI RATE, LED DSP y caducidad")


if __name__ == "__main__":
    main()
