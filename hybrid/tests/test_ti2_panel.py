"""TI2 Desktop v0.7 visual control inventory (no firmware required)."""
from pathlib import Path
import re
import unittest

BASE=Path(__file__).resolve().parents[1]
HTML=(BASE/"ui/index.html").read_text(encoding="utf-8")
JS=(BASE/"ui/ti2-precision.js").read_text(encoding="utf-8")
CSS=(BASE/"ui/ti2-precision.css").read_text(encoding="utf-8")
SERVER=(BASE/"server.py").read_text(encoding="utf-8")

class TI2VectorPanelTests(unittest.TestCase):
    def test_vector_panel_is_the_only_active_front_panel(self):
        self.assertIn('id="ti2-precision"', HTML)
        self.assertIn('src="./ti2-precision.js"', HTML)
        self.assertIn('href="./ti2-precision.css"', HTML)
        self.assertNotIn('src="./ti2-v06.js"',HTML)
    def test_exact_physical_inventory(self):
        knobs=JS.split("const knobs = [",1)[1].split("const buttons = [",1)[0]
        buttons=JS.split("const buttons = [",1)[1].split("if(knobs.length",1)[0]
        self.assertEqual(len(re.findall(r"\['[^']+',\d+,\d+,\d+,(?:null|\d+)\]",knobs)),32)
        self.assertEqual(len(re.findall(r"\['[^']+',\d+,\d+\]",buttons)),43)
        self.assertIn("if(knobs.length!==32 || buttons.length!==43)",JS)
    def test_hardware_geography_and_shared_sections(self):
        for legend in ("OSC BALANCE","SUB OSC VOLUME","OSC VOLUME","NOISE VOLUME",
                        "WAVE SELECT/PW","FM AMOUNT","FILTER BALANCE","CUTOFF 2",
                        "VALUE 1","VALUE 2","VALUE 3","SHAPE","ENV MODE"):
            self.assertIn(legend,JS)
        self.assertIn("M1008 111 V623",JS)
        self.assertIn("['TRANS −',386,588]",JS)
        self.assertIn("['FILTER SELECT LEFT',1432,288]",JS)
        self.assertIn("['FILTER SELECT RIGHT',1477,288]",JS)
        self.assertIn("M1109 111 V623",JS)
    def test_routing_and_status_are_honest(self):
        self.assertRegex(JS,r"\['VOLUME',79,155,31,null\]")
        self.assertIn("control-pending",JS)
        self.assertIn("do not imply reading firmware parameter state",JS)
        self.assertIn("fetch('/api/midi'",JS)
        self.assertIn("if(!response.ok)",JS)
    def test_user_red_marked_overlap_regressions(self):
        # Access TI2 Quickstart (2009) and owner photograph: labels must clear caps and contours.
        self.assertNotIn("M163 111 Q169", JS, "duplicate ARP outline must stay removed")
        self.assertIn("M164 111 V223 Q164 239", JS)
        self.assertIn("txt(svg,212,132,'DEMOSONG'", JS)
        self.assertIn("txt(svg,212,144,'PRESS + HOLD'", JS)
        self.assertIn("['WAVE','CUTOFF 1','CUTOFF 2','SHAPE','FM AMT','PAN','ASSIGN']", JS)
        self.assertIn("'data-ti2-waveform':String(i+1)", JS)
        self.assertIn("label==='CUTOFF 2'?'-6'", JS)
        self.assertIn("label==='CUTOFF 2'?'+6'", JS)
        self.assertIn("txt(svg,615,418,'SINGLE'", JS)
        self.assertNotIn("['WAVE','PW','RESONANCE','FLT GAIN','ASSIGN']", JS)
        self.assertIn("label==='FILTER BALANCE'?1462:x", JS)
        self.assertIn("label.length>13?'knob-caption-long'", JS)
        self.assertIn("x:62,y:370,width:356,height:16", JS)
        self.assertIn("x:62,y:499,width:356,height:15", JS)
        self.assertIn("[392,490,'EQ Q-FACTOR']", JS)
        self.assertIn("L333 622", JS, "effects notch must join the lower perimeter")
        self.assertIn("txt(svg,952,553,'PARAMETERS'", JS)
        self.assertIn("txt(svg,952,562,'BANK'", JS)
        self.assertIn("txt(svg,952,623,'VALUE'", JS)
        self.assertIn("[1177,613,'PATCH VOLUME']", JS)
        self.assertIn("[1378,613,'SUSTAIN SLOPE']", JS)
        self.assertIn("[1478,613,'TEMPO']", JS)
        self.assertIn(".knob-caption-long", CSS)

    def test_assets_are_local_and_allowlisted(self):
        self.assertIn('"/ti2-precision.js":',SERVER)
        self.assertIn('"/ti2-precision.css":',SERVER)
        self.assertNotIn("http://"," ".join(CSS.split()))
        self.assertNotIn("https://"," ".join(JS.split()))
    def test_rom_not_embedded(self):
        for file in (HTML,JS,CSS):
            self.assertNotIn("Access Virus TI.bin",file)
            self.assertNotIn("data:application/octet-stream",file)

if __name__=="__main__":
    unittest.main()
