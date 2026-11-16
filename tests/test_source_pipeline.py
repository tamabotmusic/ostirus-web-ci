"""Pruebas que no usan ni distribuyen ROM."""
import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/prepare_ti2.py"
spec = importlib.util.spec_from_file_location("prepare_ti2", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

FETCH_SCRIPT = ROOT / "scripts/fetch_ucor_source.py"
fetch_spec = importlib.util.spec_from_file_location("fetch_ucor_source", FETCH_SCRIPT)
fetch_module = importlib.util.module_from_spec(fetch_spec)
fetch_spec.loader.exec_module(fetch_module)


class SourcePipelineTests(unittest.TestCase):
    def test_ti_to_ti2_only(self):
        before = "abc\n" + module.ORIGINAL + "\nxyz"
        after = module.select_ti2(before)
        self.assertIn(module.REPLACEMENT, after)
        self.assertNotIn(module.ORIGINAL, after)

    def test_patch_idempotent(self):
        self.assertEqual(module.select_ti2(module.REPLACEMENT), module.REPLACEMENT)

    def test_unknown_source_rejected(self):
        with self.assertRaises(ValueError):
            module.select_ti2("other synthesizer")

    def test_archive_link_restricted(self):
        html = '<a href="/licenses/gearmulator/gearmulator-src-2026.tar.xz">source</a>'
        self.assertEqual(fetch_module.source_url(html),
                         "https://ucor.net/licenses/gearmulator/gearmulator-src-2026.tar.xz")

    def test_untrusted_archive_domain_rejected(self):
        with self.assertRaises(RuntimeError):
            fetch_module.source_url('<a href="https://evil.invalid/gearmulator.tar.xz">bad</a>')

    def test_no_rom_files_versioned(self):
        import subprocess
        files = subprocess.check_output(["git", "ls-files"], cwd=ROOT, text=True).splitlines()
        forbidden = (".bin", ".rom", ".syx", ".sf2", ".wasm")
        self.assertFalse([f for f in files if f.lower().endswith(forbidden)])


if __name__ == "__main__":
    unittest.main()
