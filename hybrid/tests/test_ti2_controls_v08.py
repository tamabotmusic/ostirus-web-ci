"""v0.8 control-layer tests: protect the approved v0.7 face and native host."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PANEL = (ROOT / "ui/ti2-precision.js").read_text(encoding="utf-8")
CONTROL = (ROOT / "ui/ti2-controls-v08.js").read_text(encoding="utf-8")
APP = (ROOT / "ui/app.js").read_text(encoding="utf-8")
HTML = (ROOT / "ui/index.html").read_text(encoding="utf-8")
SERVER = (ROOT / "server.py").read_text(encoding="utf-8")
HOST = (ROOT / "native/ostirus_native_host.cpp").read_text(encoding="utf-8")


class ProgramControlTests(unittest.TestCase):
    def test_v07_approved_geometry_is_untouched(self):
        self.assertIn("['RATE',545,162,27,67]", PANEL)
        self.assertIn("d:'M592 114 V339'", PANEL)
        self.assertIn("const effectLowerLEDs=[80,150,232,296,363]", PANEL)
        self.assertIn("if(knobs.length!==32 || buttons.length!==43)", PANEL)
        self.assertIn("'data-name':name", PANEL)
        self.assertIn("selector.addEventListener('input',setPatch)", PANEL)

    def test_new_code_is_a_separate_layer(self):
        self.assertIn('src="./ti2-precision.js"', HTML)
        self.assertIn('src="./ti2-controls-v08.js"', HTML)
        self.assertLess(HTML.index('src="./ti2-precision.js"'), HTML.index('src="./ti2-controls-v08.js"'))
        self.assertIn('"/ti2-controls-v08.js":', SERVER)
        self.assertIn("window.OsTIrusProgram", APP)
        self.assertIn("programSendQueue", APP)
        self.assertIn('select.addEventListener("change", () => {', APP)
        self.assertIn('select.dispatchEvent(new Event("input"', APP)

    def test_real_program_change_only(self):
        self.assertIn("bindProgramKey('VALUE −', -1", CONTROL)
        self.assertIn("bindProgramKey('VALUE +', 1", CONTROL)
        self.assertIn("data-label=\"VALUE 3\"", CONTROL)
        self.assertIn("programs.step(delta)", CONTROL)
        self.assertIn("programs.step(event.deltaY < 0 ? 1 : -1)", CONTROL)
        self.assertIn("gesture.y - event.clientY", CONTROL)
        self.assertIn("refresh(false)", CONTROL)
        self.assertIn("knob.classList.remove('control-pending')", CONTROL)
        self.assertIn("sendMidi({ type: \"program\", program })", APP)
        self.assertNotIn("type: 'cc'", CONTROL)
        self.assertNotIn("/api/midi", CONTROL)
        self.assertNotIn("fetch(", CONTROL)

    def test_engine_midi_protocol_is_not_extended(self):
        self.assertIn('return f"PROG {p}"', SERVER)
        self.assertIn('action == "PROG"', HOST)
        self.assertIn('status = 0xC0', HOST)
        self.assertNotIn("sysex", CONTROL.lower())
        self.assertNotIn("rom", CONTROL.lower().replace("program", ""))


if __name__ == "__main__":
    unittest.main()
