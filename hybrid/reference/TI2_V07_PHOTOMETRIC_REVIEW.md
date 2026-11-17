# OsTIrus TI2 Desktop v0.7 — photometric review (17 Nov 2026)

**Status: NOT READY FOR INSTALLATION. No release or new executable.**

## Reference hierarchy
1. User-supplied **black TI2 Desktop** photograph (authoritative for physical layout and finish), normalized locally to **1533 × 685** pixels.
2. Access *Virus TI User Manual*, ch. 2 “First Steps”, pp. 21–45, for legend meaning, shared encoders and physical operation. The PDF dates from the older TI era, so do not override an observed TI2 hardware difference with an older TI illustration.
3. User-supplied white/silver TI photo only for secondary high-contrast silkscreen comparison. It is not the authoritative TI2 device.

Neither source photograph nor full manual nor ROM is included in this repository.

## Work completed in the current visual review
- Independently measured all **32 rotary centers** and **43 visible key cap centers**, saved to `TI2_V07_MEASURED_COORDINATES.json`.
- Recreated the actual asymmetric Master/ARP boundary; narrow, highlighted vertical Mixer strip; two tier Effects; shared OSC selection; and Filter 4+1 knobs with five-mode LEDs.
- Moved the LCD, value trio, navigation keys and envelopes toward measured centers.
- Changed physical Master Volume to **unmapped** until its true native control path is verified; CC91 is not sufficient evidence for the master knob.
- Preserved existing browser → local host control logic, including Program Change.
- Earlier local browser renders (Chromium) were compared against the black TI2 photo. **No reference photo was committed**.

## Photo registration follow-up (17 Nov 2026)

- Inspected the user-provided black TI2 photo in its registered 1533×685 frame with the existing center overlay.
- Applied the common affine registration to the vector face. The first overlay showed the TRANSPOSE pair was about 23 pixels too high; corrected source y from 565 to 588.
- Adjusted the physical keys in MATRIX, MODULATORS, OSCILLATORS, FILTERS, EFFECTS and LCD navigation to the photographed cap centers.
- Recreated **two** separate FILTER SELECT caps. There are **43 visible rectangular caps** in the photo, while the manufacturer's 42-button overview may count the paired select control differently. Do not drop the visible fifth FILTERS cap to satisfy a numeric assertion.
- Increased cap dimensions from 36×35 to 41×42 source units to match the photo more closely.
- The coordinate overlay is a **geometry review**, not a pixel-perfect browser render or final approval.

## Current browser and photo comparison (17 Nov 2026)
- GitHub Actions ROM-free reference run [44108722814](https://github.com/tamabotmusic/ostirus-web-ci/actions/runs/44108722814) completed **successfully**.
- The workflow runs geometry tests, panel tests and `node --check`, then opens the **actual JavaScript/CSS** in headless Chrome.
- Browser DOM inventory verified: **32 rotary groups and 43 physical key-cap groups**.
- Browser screenshot generated at 1533×740, with the 1533×685 face region compared locally against the owner's black TI2 photograph.
- Local side-by-side and geometry overlays were inspected. They are intentionally **not uploaded to GitHub** because the reference photograph belongs to the user.
- The browser render exposed a browser-serif fallback on the ARP tab, duplicate/cramped VALUE legends, an excessively low FM MODE label, and short bottom envelope/effects contours; all have been corrected and re-rendered.
- This confirms **geometric alignment and successful browser rendering**, not photorealistic finish or accurate live hardware state.

## Release blockers
- Several very small silkscreen and SHIFT secondary legends still require a final per-control typographic audit.
- Vector knob material, engraving texture, color and LCD styling are not yet photo-realistic; the latest screenshot shows a recognisable TI2 layout but not a pixel-identical instrument.
- Decorative LEDs are **not** synced with emulated DSP state; they must not imply live patch status.
- Three VALUE encoders are intentionally unconnected until the LCD context can be read.
- Further comparative render cycles are required before any UI-only installer is generated.

## Non-negotiable protection
`main` and existing **OsTIrus Web Nativo CoreAudio** executable remain unchanged. No ROM, proprietary firmware, manual PDF, photographs, user patches or licensed font files may be uploaded to GitHub.
