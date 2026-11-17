"""Prevent stale installer checks from breaking v0.6 ZIP distribution."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
INSTALLER = (ROOT / "INSTALAR_PANEL_TI2.command").read_text(encoding="utf-8")
WORKFLOW = (ROOT.parent / ".github/workflows/panel-v06.yml").read_text(encoding="utf-8")


class PanelInstallerTests(unittest.TestCase):
    def test_installer_checks_exact_assets_shipped_in_zip(self):
        required = ("server.py", "ui/index.html", "ui/app.js", "ui/style.css",
                    "ui/ti2-v06.js", "ui/ti2-v06.css")
        for rel in required:
            with self.subTest(file=rel):
                self.assertIn('"'+rel+'"', INSTALLER)
                self.assertIn(Path(rel).name, WORKFLOW)

    def test_stale_old_version_asset_is_not_required(self):
        self.assertNotIn('"$SRC/ui/ti2-panel.js"', INSTALLER)

    def test_engine_and_rom_are_not_changed(self):
        self.assertNotIn('cp "$SRC/bin/', INSTALLER)
        self.assertNotIn('cp "$SRC/*.bin"', INSTALLER)
        self.assertIn('RESGUARDO_PANEL_', INSTALLER)


if __name__ == "__main__":
    unittest.main()
