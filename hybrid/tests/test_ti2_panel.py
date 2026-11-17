"""Verifica estructura y asignaciones CC del panel, sin ejecutar firmware."""
from pathlib import Path
import re
import unittest

BASE = Path(__file__).resolve().parents[1]
HTML = (BASE / "ui/index.html").read_text(encoding="utf-8")
CONTROLS = (BASE / "ui/ti2-panel.js").read_text(encoding="utf-8")
STYLE = (BASE / "ui/ti2-panel.css").read_text(encoding="utf-8")
SERVER = (BASE / "server.py").read_text(encoding="utf-8")


class TI2FrontPanelTests(unittest.TestCase):
    def test_all_hardware_sections_exist(self):
        for section in ("ti2-master", "ti2-lfo", "ti2-osc1", "ti2-osc2",
                        "ti2-mixer", "ti2-filter1", "ti2-filter2", "ti2-fx",
                        "ti2-performance", "ti2-filter-env", "ti2-amp-env"):
            with self.subTest(region=section):
                self.assertIn('id="' + section + '"', HTML)
                self.assertIn('"' + section + '": [', CONTROLS)

    def test_real_midi_cc_assignments_and_unique_numbers(self):
        pairs = re.findall(r'\["[^"]+",(\d+),(\d+),(\d+)\]', CONTROLS)
        self.assertEqual(len(pairs), 45)
        nums = [int(num) for num, _maximum, _initial in pairs]
        self.assertEqual(len(nums), len(set(nums)))
        self.assertTrue(all(0 <= cc < 128 for cc in nums))
        self.assertTrue(all(0 <= int(initial) <= int(maximum) <= 127 for _cc, maximum, initial in pairs))
        for cc in (40, 41, 42, 43, 54, 55, 56, 58, 59, 60, 61, 63,
                   17, 22, 67, 79, 104, 114, 115):
            self.assertIn(cc, nums)

    def test_panel_is_real_control_not_static_image(self):
        self.assertIn('new Event("change"', CONTROLS)
        self.assertIn('role", "slider"', CONTROLS)
        self.assertIn('type: "cc", controller: cc, value', CONTROLS)
        self.assertIn('requestAnimationFrame', CONTROLS)
        self.assertIn('pointermove', CONTROLS)
        self.assertIn('keydown', CONTROLS)

    def test_server_serves_only_known_panel_assets(self):
        for filename in ("ti2-panel.js", "ti2-panel.css"):
            self.assertIn('"/' + filename + '":', SERVER)
            self.assertIn(filename, HTML)

    def test_visual_chassis_hardware_layout(self):
        self.assertIn("ti2-chassis", HTML)
        self.assertIn("ti2-screen", HTML)
        self.assertIn("ti2-knob-disc", STYLE)
        self.assertIn("ti2-grid", STYLE)
        self.assertIn("ti2-control-grid", STYLE)

    def test_presets_not_claimed_as_firmware_backed(self):
        self.assertIn("VALORES ORIGINALES NO LEÍDOS", CONTROLS)


if __name__ == "__main__":
    unittest.main()
