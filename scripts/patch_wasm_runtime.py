#!/usr/bin/env python3
"""Guards de ejecución síncrona de los DSP TI2 para builds WebAssembly sin hilos.

Solo modifica el código fuente GPL descargado en el runner. No accede a firmware.
Los cambios son idempotentes y se validan completamente antes de escribir.
"""
import argparse
from pathlib import Path

PATCHES = {
    "source/virusLib/dspMultiTI.cpp": [
        (
            '#include "dspMultiTI.h"\n',
            '#include "dspMultiTI.h"\n\n#include <algorithm>\n',
        ),
        (
            "\t\t_dsp2.getPeriphY().getEsai().processAudioInputInterleaved(inputs, s * 2, _latency * 2);\n\n\t\t// ESAI outputs",
            "\t\t_dsp2.getPeriphY().getEsai().processAudioInputInterleaved(inputs, s * 2, _latency * 2);\n\n"
            "#ifdef __EMSCRIPTEN__\n"
            "\t\t// Ejecutar ambos DSP en modo monohilo, pero con presupuesto fijo.\n"
            "\t\t// El bucle anterior de ~1M exec() por quantum bloqueaba AudioWorklet.\n"
            "\t\t// Fase de diagnostico: no garantiza que se obtenga audio.\n"
            "\t\tconstexpr size_t MaxDspPairsPerBlock = 8192;\n"
            "\t\tconst size_t maxSteps = std::min(MaxDspPairsPerBlock, static_cast<size_t>(s) * 64);\n"
            "\t\tauto& audioMaster = _dsp.getPeriphX().getEsai().getAudioOutputs();\n"
            "\t\tauto& audioSlave = _dsp2.getPeriphX().getEsai().getAudioOutputs();\n"
            "\t\tfor(size_t step = 0; step < maxSteps; ++step)\n"
            "\t\t{\n"
            "\t\t\tif(audioMaster.size() >= s && audioSlave.size() >= s)\n"
            "\t\t\t\tbreak;\n"
            "\t\t\t_dsp.runExec();\n"
            "\t\t\t_dsp2.runExec();\n"
            "\t\t}\n"
            "#endif\n\n\t\t// ESAI outputs",
        ),
        (
            "\t\tensureSize(*this, _frames * g_esai1TxBlockSize + g_esai1TxPadding);\n\n\t\t_esai.processAudioOutput(data() + g_esai1TxPadding, _frames * 2);",
            "\t\tensureSize(*this, _frames * g_esai1TxBlockSize + g_esai1TxPadding);\n"
            "#ifdef __EMSCRIPTEN__\n"
            "\t\t// No reutilizar datos obsoletos si faltan muestras de salida.\n"
            "\t\tstd::fill(begin() + g_esai1TxPadding,\n"
            "\t\t\tbegin() + g_esai1TxPadding + _frames * g_esai1TxBlockSize, T{});\n"
            "#endif\n"
            "\t\t_esai.processAudioOutput(data() + g_esai1TxPadding, _frames * 2);",
        ),
    ],
    "source/dsp56300/source/dsp56kEmu/audio.h": [
        (
            "\t\t\tfor (uint32_t i = 0; i < _frames; ++i)\n\t\t\t{\n\t\t\t\tm_audioOutputs.waitNotEmpty();",
            "\t\t\tfor (uint32_t i = 0; i < _frames; ++i)\n\t\t\t{\n"
            "#ifdef __EMSCRIPTEN__\n"
            "\t\t\t\t// NopSemaphore no espera; nunca retirar de cola vacia.\n"
            "\t\t\t\tif (m_audioOutputs.empty())\n\t\t\t\t\tcontinue;\n"
            "#endif\n\t\t\t\tm_audioOutputs.waitNotEmpty();",
        ),
        (
            "\t\t\tfor (uint32_t s = 0; s < _frames; ++s)\n\t\t\t{\n\t\t\t\t// INPUT",
            "\t\t\tfor (uint32_t s = 0; s < _frames; ++s)\n\t\t\t{\n"
            "#ifdef __EMSCRIPTEN__\n"
            "\t\t\t\t// Evitar sobreescritura al faltar productor DSP paralelo.\n"
            "\t\t\t\tif(m_audioInputs.full())\n\t\t\t\t\tm_audioInputs.pop_front([](RxFrame&) {});\n"
            "#endif\n\t\t\t\t// INPUT",
        ),
    ],
    "source/wasmApi/gearmulator_wasm_api.cpp": [
        (
            "    // Parse raw MIDI input bytes into events\n    data->midiInQueue.clear();\n",
            "    // Conservar hasta este bloque los eventos gmr_send_* ya recibidos.\n"
            "    // Los bytes MIDI crudos se agregan a continuacion.\n",
        ),
        (
            "            data->extraOuts[ch - 2].resize(numFrames, 0.0f);\n"
            "            outputs[ch] = data->extraOuts[ch - 2].data();",
            "            auto& extra = data->extraOuts[ch - 2];\n"
            "            extra.resize(numFrames, 0.0f);\n"
            "            std::fill(extra.begin(), extra.end(), 0.0f);\n"
            "            outputs[ch] = extra.data();",
        ),
    ],
}


def patched_text(relative: str, content: str) -> str:
    for old, new in PATCHES[relative]:
        if new in content:
            continue
        n = content.count(old)
        if n != 1:
            raise ValueError(f"{relative}: anclaje inesperado ({n} coincidencias)")
        content = content.replace(old, new, 1)
    return content


def apply(source: Path) -> list[str]:
    pending = {}
    for relative in PATCHES:
        path = source / relative
        original = path.read_text(encoding="utf-8")
        changed = patched_text(relative, original)
        if changed != original:
            pending[path] = changed
    # Ninguna escritura hasta haber validado todos los archivos.
    for path, changed in pending.items():
        path.write_text(changed, encoding="utf-8")
    return [str(path.relative_to(source)) for path in pending]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="Directorio gearmulator")
    args = parser.parse_args()
    changed = apply(args.source.resolve())
    print("WASM runtime guard:", ", ".join(changed) or "ya aplicado")
    print("El parche no demuestra sonido ni arranque de firmware.")


if __name__ == "__main__":
    main()
