"""Estructura y fidelidad cuantitativa de la v0.6 TI2 Desktop sin ROM."""
from pathlib import Path
import re
import unittest

BASE = Path(__file__).resolve().parents[1]
HTML = (BASE/"ui/index.html").read_text(encoding="utf-8")
JS = (BASE/"ui/ti2-v06.js").read_text(encoding="utf-8")
CSS = (BASE/"ui/ti2-v06.css").read_text(encoding="utf-8")
SERVER = (BASE/"server.py").read_text(encoding="utf-8")


class TI2PhysicalPanelTests(unittest.TestCase):
    def test_front_panel_root_and_resources(self):
        for value in ('id="ti2-v06"', 'ti2-v06.css', 'ti2-v06.js'):
            self.assertIn(value, HTML)
        self.assertNotIn('src="./ti2-panel.js"', HTML)
        self.assertNotIn('href="./ti2-panel.css"', HTML)

    def test_32_rotary_controls(self):
        part = JS.split("const dialGroups = {",1)[1].split("const keys = {",1)[0]
        dials = re.findall(r'\["[^"]+",(?:\d+|null),\d+\]',part)
        self.assertEqual(len(dials),32)

    def test_42_hardware_buttons(self):
        part = JS.split("const keys = {",1)[1].split("const numKnobs",1)[0]
        labels = re.findall(r'"([^"]+)"',part)
        self.assertEqual(len(labels),42)

    def test_live_filter_and_envelopes_are_preserved(self):
        for cc in (40,41,42,43,44,48,54,55,56,58,59,60,61,63):
            self.assertRegex(JS, r',"'+str(cc)+r'",')

    def test_only_knobs_send_midi(self):
        self.assertIn("type:'cc',controller:cc,value",JS)
        self.assertIn("v06-hard-button",JS)
        self.assertIn("integración pendiente",JS)
        self.assertIn("KNOB VALUES NOT YET SYNCHRONIZED",JS)

    def test_panel_layout_areas(self):
        for klass in ("v06-master","v06-matrix","v06-modulators","v06-oscillators","v06-mixer",
                      "v06-filters","v06-effects","v06-center","v06-envelopes",
                      "v06-knob","v06-lcd","v06-button-face"):
            self.assertIn("."+klass,CSS)
        self.assertIn("grid-template-columns", CSS)
        self.assertIn("grid-template-rows", CSS)

    def test_panel_assets_served_only_from_allowlist(self):
        self.assertIn('"/ti2-v06.js":',SERVER)
        self.assertIn('"/ti2-v06.css":',SERVER)
        self.assertIn("UI_DIR / entry[0]",SERVER)


if __name__=="__main__":
    unittest.main()
