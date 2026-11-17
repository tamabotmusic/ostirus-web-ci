"""ROM-free contract for the bounded DSP frontpanel feedback channel."""
import importlib.util
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/"native/ostirus_native_host.cpp").read_text(encoding="utf-8")
SERVER=(ROOT/"server.py").read_text(encoding="utf-8")
spec=importlib.util.spec_from_file_location("ostirus_frontpanel_server",ROOT/"server.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DSPFrontpanelReadbackTests(unittest.TestCase):
    def test_read_only_validated_frontpanel_packet(self):
        self.assertIn('#include "virusLib/frontpanelState.h"',HOST)
        self.assertIn("if (!frontpanel.fromMidiEvent(event)) continue;",HOST)
        self.assertIn("std::isfinite(frontpanel.m_bpm)",HOST)
        self.assertIn("std::isfinite(frontpanel.m_logo)",HOST)
        self.assertIn("std::isfinite(level)",HOST)
        self.assertIn("state.midiOut.clear();",HOST)
        self.assertIn("state.frontpanelRevision.fetch_add(1, std::memory_order_release);",HOST)

    def test_no_http_or_mutex_in_audio_feedback_path(self):
        begin=HOST.index("virusLib::FrontpanelState frontpanel;")
        end=HOST.index("// TI2 provides six stereo pairs.",begin)
        callback=HOST[begin:end]
        for forbidden in ("std::lock_guard", "std::cerr", "getState(", "sendSysex(",
                          "std::vector<", "std::mutex", "new ", "fetch(", "HTTP"):
            self.assertNotIn(forbidden,callback)

    def test_scalar_protocol_no_firmware_or_sysex(self):
        self.assertIn('[OSTIRUS_FRONT] revision=',HOST)
        self.assertIn('"dspFrontpanel": feedback',SERVER)
        self.assertIn('"source": "dsp-frontpanel"',SERVER)
        self.assertNotIn('"/api/rom"',SERVER)
        self.assertNotIn('"/api/sysex"',SERVER)

    def test_front_regex_accepts_scientific_notation(self):
        line="[OSTIRUS_FRONT] revision=123 lfo1=1.5e-3 lfo2=-0.2 lfo3=0.99 bpm=0 logo=1 activity=65535"
        match=module.FRONT_RE.fullmatch(line)
        self.assertIsNotNone(match)
        self.assertEqual(int(match.group(1)),123)
        self.assertEqual(int(match.group(7)),65535)

    def test_front_regex_rejects_untrusted_payloads(self):
        for line in (
            "[OSTIRUS_FRONT] revision=1 lfo1=nan lfo2=0 lfo3=0 bpm=0 logo=0 activity=0",
            "[OSTIRUS_FRONT] revision=1 lfo1=0 lfo2=0 lfo3=0 bpm=0 logo=0 activity=0 /private/rom",
            "[OSTIRUS_FRONT] revision=1 lfo1=0 lfo2=0 lfo3=0 bpm=0 logo=0 activity=-1",
            "[OSTIRUS_FRONT] revision=1 lfo1=0 lfo2=0 lfo3=0 bpm=0 logo=0 activity=0\nCC 127 127",
        ):
            with self.subTest(line=line):
                self.assertIsNone(module.FRONT_RE.fullmatch(line))


if __name__=="__main__":
    unittest.main()
