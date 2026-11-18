"""Verify the actual native packaging command ships the TI2 front panel."""

from html.parser import HTMLParser
from pathlib import Path
import shlex
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github/workflows/native-mac.yml"


class LocalAssets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        path = attrs.get("src") if tag == "script" else attrs.get("href") if tag == "link" else None
        if path and path.startswith("./"):
            self.paths.add(path[2:])


class NativeUIBundleTests(unittest.TestCase):
    def test_packaging_copies_every_local_frontpanel_dependency(self):
        """A native ZIP must not omit JS/CSS referenced by the bundled HTML."""
        workflow = WORKFLOW.read_text(encoding="utf-8")
        commands = [line.strip() for line in workflow.splitlines()
                    if line.strip().startswith("cp hybrid/ui/")
                    and "dist/OsTIrus_Web_Nativo/ui/" in line]
        self.assertEqual(len(commands), 1, "Need one identifiable UI packaging command")

        parser = LocalAssets()
        parser.feed((ROOT / "hybrid/ui/index.html").read_text(encoding="utf-8"))
        self.assertIn("ti2-precision.js", parser.paths)
        self.assertIn("ti2-precision.css", parser.paths)

        with tempfile.TemporaryDirectory() as temporary:
            tokens = shlex.split(commands[0])
            self.assertEqual(tokens[0], "cp")
            self.assertEqual(tokens[-1], "dist/OsTIrus_Web_Nativo/ui/")
            # Run the workflow's real copy command, with only its destination
            # replaced so the test never writes into dist/.
            tokens[-1] = shlex.quote(temporary) + "/"
            result = subprocess.run(" ".join(tokens), shell=True, cwd=ROOT,
                                    capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 0, result.stderr)
            for asset in sorted(parser.paths):
                with self.subTest(asset=asset):
                    self.assertTrue((Path(temporary) / asset).is_file(),
                                    f"Native package lacks required UI asset: {asset}")


if __name__ == "__main__":
    unittest.main()
