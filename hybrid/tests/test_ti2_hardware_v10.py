"""v0.10 hardware-behavior parity tests: protect the known-good v0.9 engine."""
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
PANEL=(ROOT/"ui/ti2-precision.js").read_text(encoding="utf-8")
V08=(ROOT/"ui/ti2-controls-v08.js").read_text(encoding="utf-8")
V09=(ROOT/"ui/ti2-controls-v09.js").read_text(encoding="utf-8")
V10=(ROOT/"ui/ti2-controls-v10.js").read_text(encoding="utf-8")
HTML=(ROOT/"ui/index.html").read_text(encoding="utf-8")
SERVER=(ROOT/"server.py").read_text(encoding="utf-8")
HOST=(ROOT/"native/ostirus_native_host.cpp").read_text(encoding="utf-8")


class HardwareParityTests(unittest.TestCase):
    def test_v07_physical_geometry_is_frozen(self):
        self.assertIn("if(knobs.length!==32 || buttons.length!==43)",PANEL)
        self.assertIn("['RATE',545,162,27,67]",PANEL)
        self.assertIn("d:'M592 114 V339'",PANEL)
        self.assertIn("['RESONANCE',1281,160,28,42]",PANEL)

    def test_separate_layer_and_load_order(self):
        scripts=("ti2-precision.js","ti2-controls-v08.js",
                 "ti2-controls-v09.js","ti2-controls-v10.js")
        for path in scripts:
            self.assertIn('src="./'+path+'"',HTML)
            self.assertIn('"/'+path+'":',SERVER)
        for a,b in zip(scripts,scripts[1:]):
            self.assertLess(HTML.index('src="./'+a+'"'),HTML.index('src="./'+b+'"'))

    def test_hardware_shift_modifier_gates_value3(self):
        self.assertIn("getAttribute('data-name')==='SHIFT'",V10)
        self.assertIn("knob.addEventListener('wheel'",V10)
        self.assertIn("knob.addEventListener('pointerdown'",V10)
        self.assertIn("knob.addEventListener('keydown'",V10)
        self.assertIn("event.stopImmediatePropagation()",V10)
        self.assertIn("if(!consume(event))",V10)
        self.assertIn("programs.step(keySteps[event.key])",V10)
        self.assertIn("const keySteps={ArrowUp:1,ArrowRight:1",V10)
        self.assertIn("data-shift-required",V10)
        self.assertIn("window.OsTIrusModifier",V10)
        self.assertIn("armed=false",V10)
        self.assertIn("window.addEventListener('blur'",V10)

    def test_v09_context_and_v08_program_controls_remain(self):
        self.assertIn("window.OsTIrusTI2Context=context",V09)
        self.assertIn("f===1?42:43",V09)
        self.assertIn("f===1?44:45",V09)
        self.assertIn("bindProgramKey('VALUE −', -1",V08)
        self.assertIn("bindProgramKey('VALUE +', 1",V08)
        self.assertIn("status = 0xC0",HOST)

    def test_no_engine_firmware_or_unverified_cc_added(self):
        self.assertNotIn("fetch(",V10)
        self.assertNotIn("/api/midi",V10)
        self.assertNotIn("type:'cc'",V10)
        self.assertNotIn("type:'sysex'",V10)
        self.assertNotIn("romData",V10)
        self.assertIn("status = 0xB0",HOST)


if __name__=="__main__":
    unittest.main()
