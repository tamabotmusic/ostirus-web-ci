"""Guard against persistent native MIDI output accumulation on the CoreAudio thread.

Gearmulator appends FrontpanelState MIDI output on every 256-sample block.
The browser host currently does not consume this output. A persistent vector
without clear() would grow throughout a live set.
"""
from pathlib import Path
import re
import unittest

HOST=(Path(__file__).resolve().parents[1]/"native/ostirus_native_host.cpp").read_text(encoding="utf-8")


class NativeMidiOutputTests(unittest.TestCase):
    def test_persistent_midiout_is_reset_before_every_process(self):
        match=re.search(
            r"state\.midiOut\.clear\(\);\s*"
            r"state\.synth->process\(inputs, outputs, kFrames, midi, state\.midiOut\);",
            HOST
        )
        self.assertIsNotNone(match,"The MIDI-out vector must be cleared on the audio thread before each block")

    def test_midiout_is_not_cleared_from_http_or_main_thread(self):
        self.assertEqual(HOST.count("state.midiOut.clear();"),1)
        self.assertEqual(HOST.count("state.synth->process(inputs, outputs, kFrames, midi, state.midiOut);"),1)
        self.assertIn("std::vector<synthLib::SMidiEvent> midiOut;",HOST)
        self.assertIn("std::array<float, kFrames * 2>& stereo",HOST)

    def test_audio_and_midi_input_paths_unchanged(self):
        self.assertIn("state.pendingMidi.emplace_back",HOST)
        self.assertIn("midi.swap(state.pendingMidi)",HOST)
        self.assertIn("AudioQueueEnqueueBuffer(queue, buffer, 0, nullptr)",HOST)
        self.assertIn("state.synth->process(inputs, outputs, kFrames, midi, state.midiOut);",HOST)


if __name__=="__main__":
    unittest.main()
