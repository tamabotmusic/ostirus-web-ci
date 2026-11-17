"""Validation of the TI2 v0.7 measured physical layout. ROM-free, no screenshots uploaded."""
from pathlib import Path
import json
import unittest

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/"reference/TI2_V07_MEASURED_COORDINATES.json").read_text(encoding="utf-8"))
PANEL=(ROOT/"ui/ti2-precision.js").read_text(encoding="utf-8")
KNOBS=DATA["knobs"]
BUTTONS=DATA["buttons"]

class TI2GeometryReferenceTests(unittest.TestCase):
    def test_geometry_counts_and_reference(self):
        self.assertEqual(DATA["reference_frame"], {"width":1533,"height":685,"unit":"px"})
        self.assertEqual(len(KNOBS),32)
        self.assertEqual(len(BUTTONS),43)
        self.assertIn("approval pending",DATA["status"])
    def test_all_control_centers_in_bounds(self):
        for item in [*KNOBS,*BUTTONS]:
            with self.subTest(item=item["label"]):
                self.assertTrue(18<item["x"]<1522)
                self.assertTrue(18<item["y"]<675)
    def test_no_duplicate_physical_positions(self):
        self.assertEqual(len({(x["x"],x["y"]) for x in KNOBS}),len(KNOBS))
        self.assertEqual(len({(x["x"],x["y"]) for x in BUTTONS}),len(BUTTONS))
    def test_classic_ti2_topology(self):
        by=lambda keyword: [x for x in KNOBS if keyword in x["label"]]
        mix=[x for x in KNOBS if x["label"] in {"OSC BALANCE","SUB OSC VOLUME","OSC VOLUME","NOISE VOLUME"}]
        self.assertEqual(len(mix),4)
        self.assertEqual(len({x["x"] for x in mix}),1)
        self.assertEqual(len([x for x in KNOBS if x["label"] in {"SEND","TIME/COLOR","FEEDBACK/DAMPING","TYPE/MIX","INTENSITY"}]),5)
        filters=[x for x in KNOBS if x["label"] in {"CUTOFF","RESONANCE","ENV AMOUNT","FILTER BALANCE","CUTOFF 2"}]
        self.assertEqual(len(filters),5)
        self.assertEqual(len({x["y"] for x in filters if x["label"]!="CUTOFF 2"}),1)
        self.assertGreater(next(x["y"] for x in filters if x["label"]=="CUTOFF 2"),filters[0]["y"])
        self.assertEqual(len([x for x in BUTTONS if x["label"].startswith("TRANS ")]),2)
        self.assertEqual(len([x for x in BUTTONS if x["label"].startswith("FILTER SELECT ")]),2)
        self.assertEqual({x["y"] for x in BUTTONS if x["label"].startswith("TRANS ")},{588})
        self.assertEqual(DATA["coordinate_transform"], {"translate_x":-30,"translate_y":-20,"scale_x":1.018,"scale_y":1.017,"description":"Apply to all source-space x,y for black-photo pixel alignment"})
    def test_master_volume_unmapped_until_verified(self):
        self.assertIsNone(next(x["cc"] for x in KNOBS if x["label"]=="VOLUME"))
    def test_registration_and_unlit_leds(self):
        self.assertIn("data-registration", PANEL)
        self.assertIn("const rootSvg", PANEL)
        self.assertIn("data-state\':\'unavailable", PANEL)
        self.assertNotIn("i===1", PANEL)
        self.assertNotIn("FILTER ATTACK\']", PANEL)
    def test_no_rom_in_reference(self):
        body=json.dumps(DATA)
        for prohibited in ("Access Virus TI.bin","/Users/","/mnt/data/","PRIVATE KEY"):
            self.assertNotIn(prohibited,body)

if __name__=="__main__":
    unittest.main()
