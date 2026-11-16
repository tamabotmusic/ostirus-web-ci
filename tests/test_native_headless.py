import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

script = Path(__file__).resolve().parents[1] / "scripts/prepare_native_headless.py"
spec = importlib.util.spec_from_file_location("prepare_native_headless", script)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class NativeBuildPreparation(unittest.TestCase):
    def make_sources(self, root, known=True):
        thirdparty = root / "source/3rdparty/CMakeLists.txt"
        thirdparty.parent.mkdir(parents=True)
        thirdparty.write_text("# Stub for WASM build\n" if known else "another project\n")
        top = root / "CMakeLists.txt"
        top.write_text("project(gearmulator VERSION 2.2.2)\n")
        return thirdparty, top

    def test_native_prep_is_idempotent(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            thirdparty, top = self.make_sources(root)
            mod.apply(root)
            original = (thirdparty.read_text(), top.read_text())
            self.assertIn("add_library(Freetype::Freetype ALIAS freetype)", original[0])
            self.assertIn("add_executable(ostirus_native_host", original[1])
            self.assertIn("framework AudioToolbox", original[1])
            mod.apply(root)
            self.assertEqual(original, (thirdparty.read_text(), top.read_text()))

    def test_unknown_snapshot_is_rejected_without_changes(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            thirdparty, top = self.make_sources(root, known=False)
            original = (thirdparty.read_text(), top.read_text())
            with self.assertRaises(ValueError):
                mod.apply(root)
            self.assertEqual(original, (thirdparty.read_text(), top.read_text()))


if __name__ == "__main__":
    unittest.main()
