import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/patch_wasm_runtime.py"
spec = importlib.util.spec_from_file_location("patch_wasm_runtime", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class RuntimeGuardTests(unittest.TestCase):
    def test_every_patch_is_idempotent(self):
        for relative, rules in mod.PATCHES.items():
            with self.subTest(relative=relative):
                before = "\n\n".join(old for old, _ in rules)
                after = mod.patched_text(relative, before)
                for _, expected in rules:
                    self.assertIn(expected, after)
                self.assertEqual(mod.patched_text(relative, after), after)

    def test_reject_unknown_sources(self):
        for relative in mod.PATCHES:
            with self.subTest(relative=relative):
                with self.assertRaises(ValueError):
                    mod.patched_text(relative, "completely different code")

    def test_no_partial_update_if_any_file_does_not_match(self):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            originals = {}
            for i, (relative, rules) in enumerate(mod.PATCHES.items()):
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                original = "unexpected code" if i == 2 else "\n\n".join(old for old, _ in rules)
                path.write_text(original, encoding="utf-8")
                originals[path] = original
            with self.assertRaises(ValueError):
                mod.apply(root)
            for path, original in originals.items():
                self.assertEqual(path.read_text(encoding="utf-8"), original)


if __name__ == "__main__":
    unittest.main()
