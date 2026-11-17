# OsTIrus TI2 Desktop — control audit for the visual reference

**Status: REFERENCE / NOT A RELEASE.** This file is a working inventory to compare a faithful OsTIrus graphical panel against a **real Virus TI2 Desktop**. No firmware, manual PDF or photographs are stored in the repository.

Primary geometric reference: user-provided black TI2 Desktop frontal photograph. The white-silver photograph shows a Virus TI and is useful for reading labels, but **must not override the TI2 photograph where hardware variations exist**.

Manufacturer documentation:
- Official manuals catalogue: https://www.virus.info/support/manuals (Virus TI2 Quickstart + Virus TI Reference).
- Quickstart: controls overview (printed pages 22–38, plus operation on pages 18–21). The manual explicitly describes 32 knobs and 42 buttons.
- The reference parameter manual is needed for secondary functions and all MIDI details. Do **not** guess a MIDI CC from a label.

## PHYSICAL INVENTORY — 32 knobs

| Region | Quantity | Physical rotary legends and placement |
| --- | ---: | --- |
| Master | 1 | VOLUME (large upper-left) |
| Modulators | 1 | RATE (selected LFO 1/2/3 shares this rotary) |
| Oscillators | 5 | WAVE/SHAPE, WAVE SELECT/PW, SEMITONE, DETUNE 2/3 across top; FM AMOUNT below on right |
| Mixer | 4 | OSC BALANCE, SUB OSC VOLUME, OSC VOLUME, NOISE VOLUME, in one vertical strip |
| Filters | 5 | CUTOFF, RESONANCE, ENV AMOUNT, FILTER BALANCE across top; CUTOFF 2 below |
| Effects | 5 | SEND, TIME/COLOR, FEEDBACK/DAMPING across first row; TYPE/MIX, INTENSITY below |
| Screen soft values | 3 | VALUE 1 (CATEGORY), VALUE 2 (BANK), VALUE 3 (PROGRAM) below LCD |
| Filter envelope | 4 | ATTACK, DECAY, SUSTAIN, RELEASE |
| Amp envelope | 4 | ATTACK, DECAY, SUSTAIN, RELEASE |
| **Total** | **32** | |

## PHYSICAL INVENTORY — 42 tactile buttons

| Region | Quantity | Buttons |
| --- | ---: | --- |
| ARP | 2 | EDIT, ARP ON |
| Matrix | 3 | DESTINATION ↓, DESTINATION ↑, MOD SELECT |
| Modulators | 6 | EDIT, ENV MODE, SHAPE, LFO 1 SELECT, LFO 2 SELECT, LFO 3 SELECT |
| Oscillators | 5 | OSC SELECT, OSC EDIT, OSC 3 ON, MONO, SYNC |
| Filters | 4 | EDIT, FILT 1 MODE, FILT 2 MODE, FILT 1/2 SELECT |
| Effects | 4 | SELECT and EDIT for upper row; SELECT and EDIT for lower row |
| Left LCD navigation | 8 | EXIT, TAP, EDIT, CONFIG, STORE, UNDO, SHIFT, SEARCH |
| Right LCD navigation | 8 | PART −, PART +, MULTI, SINGLE, PARAMETER −, PARAMETER +, VALUE −, VALUE + |
| Transpose | 2 | TRANSPOSE −, TRANSPOSE + |
| **Total** | **42** | |

## Important behavior verified in the official Quickstart

1. **Oscillator section:** the upper rotary knobs are **shared** between OSC 1/2/3 selected by OSC SELECT; they must not be represented as independent oscillator-specific knobs.
2. **Modulator section:** a **single RATE knob** operates the currently selected LFO; LFO 1/2/3 each have a SELECT button. SHAPE is a **button**, not a rotary knob.
3. **Filter section:** RESONANCE and ENV AMOUNT act on the selected Filter 1/2, using FILT 1/2 SELECT. FILTER BALANCE is a single rotary; CUTOFF 2 is on the lower row.
4. **Effects:** upper row has three shared knobs and SELECT+EDIT; lower row has two shared knobs and SELECT+EDIT. The physical knob meaning depends on the selected effect.
5. **Matrix:** exactly six SLOT LEDs and a MOD SELECT button; DESTINATION up/down chooses routing; VALUE 1/2/3 edit source, amount and destination.
6. **VALUE knobs:** their function varies with the LCD page. They are **not fixed CC parameters**.
7. **SHIFT:** exposes secondary silkscreen functions of knobs/buttons. Smaller text beneath controls is meaningful to an expert player.
8. **Status LEDs:** fixed decorative lit LEDs cannot claim to mirror the loaded patch before the firmware state is available.
9. **Master VOLUME vs PATCH VOLUME:** these must not be assumed interchangeable. Reconfirm the native engine's MIDI protocol before binding this hardware knob; standard CC 91 is not sufficient evidence.

## Visual validation protocol BEFORE distribution

- Overlay the new SVG panel onto the **TI2 black photo**, with the same cropping, aspect and four corners registered.
- Inspect every knob and tactile switch center; examine their grouping lines, LED positions, captions and secondary legends.
- Record displacement in source reference pixels and fix outliers; do not replace visually recognisable placement with a mere 32/42 count.
- Confirm there is no clipping, duplicate text, mislabeled knob, unexplained connector, false button state, or mixed TI1/TI2 legend.
- Re-render after correction and repeat. A successful JavaScript build is **not** a visual approval.
- Never distribute the owner's reference photograph or copies of proprietary manual pages with the application.
- Keep the working TI2 CoreAudio executable unchanged, and release a reversible UI-only patch only after review.

**Open issues identified in first overlay:** LCD differs from the original in pixel proportion; several micro-legends overlap nearby controls; panel boundary and area labels require further alignment. Thus the v0.7 preview is **not approved for user installation**.
