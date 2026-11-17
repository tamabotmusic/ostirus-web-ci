"""v0.9 physical control integration regression tests (no ROM, no DSP)."""
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
PANEL=(ROOT/"ui/ti2-precision.js").read_text(encoding="utf-8")
V08=(ROOT/"ui/ti2-controls-v08.js").read_text(encoding="utf-8")
V09=(ROOT/"ui/ti2-controls-v09.js").read_text(encoding="utf-8")
HTML=(ROOT/"ui/index.html").read_text(encoding="utf-8")
CSS=(ROOT/"ui/ti2-precision.css").read_text(encoding="utf-8")
SERVER=(ROOT/"server.py").read_text(encoding="utf-8")
HOST=(ROOT/"native/ostirus_native_host.cpp").read_text(encoding="utf-8")


class PhysicalControlTests(unittest.TestCase):
    def test_approved_v07_geometry(self):
        self.assertIn("if(knobs.length!==32 || buttons.length!==43)",PANEL)
        self.assertIn("['RATE',545,162,27,67]",PANEL)
        self.assertIn("d:'M592 114 V339'",PANEL)
        self.assertIn("const effectLowerLEDs=[80,150,232,296,363]",PANEL)
        self.assertIn("['RESONANCE',1281,160,28,42]",PANEL)
        self.assertIn("['ENV AMOUNT',1378,160,28,44]",PANEL)

    def test_load_order_and_whitelisted_local_script(self):
        for name in ("ti2-precision.js","ti2-controls-v08.js","ti2-controls-v09.js"):
            self.assertIn('src="./'+name+'"',HTML)
            self.assertIn('"/'+name+'":',SERVER)
        self.assertLess(HTML.index('ti2-precision.js'),HTML.index('ti2-controls-v08.js'))
        self.assertLess(HTML.index('ti2-controls-v08.js'),HTML.index('ti2-controls-v09.js'))
        self.assertIn("window.OsTIrusTI2Knobs",PANEL)
        self.assertIn("window.OsTIrusTI2Context=context",V09)

    def test_oscillator_mappings_and_unsupported_osc3(self):
        for code in ("{1:17,2:22,3:null}","{1:19,2:24,3:null}",
                     "{1:20,2:25,3:null}","osc===2?26:null"):
            self.assertIn(code,V09)
        self.assertIn("makeKey(selectOsc,'oscillator-focus'",V09)
        self.assertIn("oscillator===3?1:oscillator+1",V09)
        self.assertIn("if(!mapped.length)",PANEL)

    def test_filter_mappings_both_filters(self):
        self.assertIn("f===1?42:43",V09)
        self.assertIn("f===1?44:45",V09)
        self.assertIn("combined? [...new Set([...effectiveFilters(),f])].sort() : [f]",V09)
        self.assertIn("makeKey(selectF1,'filter-focus-1'",V09)
        self.assertIn("makeKey(selectF2,'filter-focus-2'",V09)

    def test_truthful_led_and_cache_semantics(self):
        self.assertIn("data-ti2-osc-select-led",PANEL)
        self.assertIn("data-ti2-filter-select-led",PANEL)
        self.assertIn("selected?'local':'unavailable'",V09)
        self.assertIn('circle[data-state="local"]',CSS)
        self.assertIn("localCCValues.clear()",PANEL)
        self.assertIn("pendingClearers.forEach(fn=>fn())",PANEL)
        self.assertIn("ti2-local-midi-cc",PANEL)
        self.assertIn("valor del firmware desconocido",PANEL.lower())
        self.assertNotIn("type: \"sysex\"",V09.lower())
        self.assertNotIn("fetch(",V09)

    def test_no_native_engine_changes_and_v08_preserved(self):
        self.assertIn("status = 0xC0",HOST)
        self.assertIn("bindProgramKey('VALUE +', 1",V08)
        self.assertIn("bindProgramKey('VALUE −', -1",V08)
        self.assertIn("const toSend=batches;batches=[];",PANEL)


if __name__=="__main__":
    unittest.main()
