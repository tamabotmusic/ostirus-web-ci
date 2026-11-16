#!/usr/bin/env python3
"""Prepara la fuente de μcor para un build TI2; no necesita ROM."""
import argparse
from pathlib import Path
import subprocess

ORIGINAL = "params.customData = static_cast<uint32_t>(virusLib::DeviceModel::TI);"
REPLACEMENT = "params.customData = static_cast<uint32_t>(virusLib::DeviceModel::TI2);"


def select_ti2(text: str) -> str:
    if text.count(ORIGINAL) == 1 and REPLACEMENT not in text:
        return text.replace(ORIGINAL, REPLACEMENT, 1)
    if text.count(REPLACEMENT) == 1 and ORIGINAL not in text:
        return text
    raise ValueError("No se reconoce la línea de selección de modelo en ostirus_wasm.cpp")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot", type=Path, help="Directorio raíz ucor-gearmulator-src-2026-10-07")
    args = parser.parse_args()
    root = args.snapshot.resolve()
    source = root / "gearmulator"
    device = source / "source/virusLib/device.cpp"
    factory = source / "source/wasmApi/ostirus_wasm.cpp"
    patch = root / "patches/not-in-served-build/virusLib-device-boot-changes.patch"
    for path in (device, factory, patch):
        if not path.is_file():
            raise SystemExit(f"Fuente incompleta: {path}")
    orig_device = device.read_text(encoding="utf-8")
    if "maxEmscRetries" not in orig_device:
        subprocess.run(["patch", "--batch", "--forward", "-p1", "-i", str(patch)], cwd=source, check=True)
    selected = select_ti2(factory.read_text(encoding="utf-8"))
    factory.write_text(selected, encoding="utf-8")
    if "maxEmscRetries" not in device.read_text(encoding="utf-8"):
        raise SystemExit("La corrección del arranque no quedó instalada")
    print("TI2 seleccionado; bucle de arranque acotado; sin firmware en el proceso.")


if __name__ == "__main__":
    main()
