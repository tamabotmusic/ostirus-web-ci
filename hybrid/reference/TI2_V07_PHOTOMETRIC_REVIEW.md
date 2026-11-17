# OsTIrus TI2 Desktop v0.7 — photometric review (17 Nov 2026)

**Status: NOT READY FOR INSTALLATION. No release or new executable.**

## Reference hierarchy
1. User-supplied **black TI2 Desktop** photograph (authoritative for physical layout and finish), normalized locally to **1533 × 685** pixels.
2. Access *Virus TI User Manual*, ch. 2 “First Steps”, pp. 21–45, for legend meaning, shared encoders and physical operation. The PDF dates from the older TI era, so do not override an observed TI2 hardware difference with an older TI illustration.
3. User-supplied white/silver TI photo only for secondary high-contrast silkscreen comparison. It is not the authoritative TI2 device.

Neither source photograph nor full manual nor ROM is included in this repository.

## Work completed in the current visual review
- Independently measured all **32 rotary centers** and **42 tactile button centers**, saved to `TI2_V07_MEASURED_COORDINATES.json`.
- Recreated the actual asymmetric Master/ARP boundary; narrow, highlighted vertical Mixer strip; two tier Effects; shared OSC selection; and Filter 4+1 knobs with five-mode LEDs.
- Moved the LCD, value trio, navigation keys and envelopes toward measured centers.
- Changed physical Master Volume to **unmapped** until its true native control path is verified; CC91 is not sufficient evidence for the master knob.
- Preserved existing browser → local host control logic, including Program Change.
- Generated local browser renders (Chromium) and compared against the black TI2 photo. **No reference photo was committed**.

## Latest local automated visual check
- Browser JavaScript exceptions: **0**.
- SVG rotary groups: **32**.
- SVG tactile button groups: **42**.
- Distinct SVG text/text intersections above 38% of smaller text area: **0** after fixes.
- **Not yet an approval:** this only checks the control counts and gross typographic overlaps. It does not measure exact chasis color, knob textures, all small legends or multi-layer line intersections.

## Release blockers
- Precise per-control silkscreen and SHIFT secondary legends still need comparison with the black photo and manual.
- Some body elements/contours and proportions are close but not pixel-verified against the original.
- Decorative LEDs are **not** synced with emulated DSP state; they must not imply live patch status.
- Three VALUE encoders are intentionally unconnected until the LCD context can be read.
- Further comparative render cycles are required before any UI-only installer is generated.

## Non-negotiable protection
`main` and existing **OsTIrus Web Nativo CoreAudio** executable remain unchanged. No ROM, proprietary firmware, manual PDF, photographs, user patches or licensed font files may be uploaded to GitHub.
