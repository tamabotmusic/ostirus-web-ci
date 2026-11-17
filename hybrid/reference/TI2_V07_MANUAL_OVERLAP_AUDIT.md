# OsTIrus TI2 v0.7 — red-marked overlay audit and official manual cross-check
Date: 17 November 2026. **Reference only — no installer and no release.**

## Sources and precedence
- Official Access/Kemper **Virus TI2 Series Quickstart**, ©2009: https://www.virus.info/support/manuals (Virus TI2 Series → Virus TI Quickstart, original file /download/199).
- Accessible reading copy of the same multilingual TI2 Quickstart: https://www.garsumene.lt/wp-content/uploads/2024/02/access-virus-ti2-desktop-quickstart-manual.pdf (English printed pp. 23–38).
- The owner's black TI2 Desktop photograph: authoritative for **physical coordinates, contours and printed legends**. Private image is not committed.
- The owner's 17 November screenshot with red rectangles: authoritative for visible v0.7 defects. Private screenshot is not committed.
- The user's uploaded 2006 `User_Manual_English.pdf` documents the **older TI1**. It is secondary; it must never override the TI2 Quickstart and actual black TI2 photograph.

## Confirmed by the TI2 Quickstart
- 32 knobs; the overview says 42 buttons, but the actual black TI2 photo has 43 visibly separated rectangular caps. Keep the visual inventory distinct from the documentation's functional count pending detailed reconciliation (p. 11).
- Three LFO SELECT keys choose which LFO shares the single RATE knob and the upper control buttons (pp. 30–31).
- Matrix: six slots, a MOD SELECT key, two DESTINATION cursor keys (pp. 31–32).
- Filters: two FILT MODE keys, **two distinct FILT SELECT keys** to choose resonance/envelope target (pp. 27–29).
- Effects: upper SELECT/EDIT row (SEND, TIME/COLOR, FEEDBACK/DAMPING), lower SELECT/EDIT row (TYPE/MIX, INTENSITY); secondary EQ labels remain visible (pp. 32–34).
- Envelopes: each has ATTACK/DECAY/SUSTAIN/RELEASE; SUSTAIN SLOPE is SHIFT+SUSTAIN (pp. 29–30).
- Master: PART, PARAMETERS/BANK, VALUE/PROGRAM labels; SHIFT, STORE, SEARCH and TRANSPOSE have their own printed legends (pp. 19–21, 35–38).

## Owner's red rectangles — code changes
1. **MATRIX**: removed a duplicated white divider that intersected the DESTINATION button; raised DEMOSONG and PRESS + HOLD legends.
2. **ARP**: removed a second line that passed through the ARP silver tab; retain one shared contour.
3. **MODULATORS**: the photograph shows **waveform symbols** beside the upper SHAPE button, not a stack of WAVE/PW/RESONANCE labels. Replaced that false upper column with four waveform symbols and placed the seven LFO2 destinations (WAVE, CUTOFF 1, CUTOFF 2, SHAPE, FM AMT, PAN, ASSIGN) next to the lower LFO2 selector. Kept the abbreviated RESO and FILT GAIN in the lower LFO1 destination column.
4. **FILTERS**: keep the long FILTER BALANCE caption inside the right contour with a slightly smaller font and left inset. Photo-verify numeric scales: FILTER BALANCE 0–12, CUTOFF 2 -6/+6, SEMITONE -48/+48.
5. **EFFECTS**: move both selection LED ribbons to the correct LED rows; lift EQ secondary legends above the lower ribbon; join the upper contour, transpose notch and bottom perimeter into one path.
6. **MASTER RIGHT**: place PART and PARAMETERS/BANK labels between physical rows; split VALUE and PROGRAM into two distinct legends below the last pair.
7. **FILTER/AMPLIFIER ENVELOPES**: lift secondary legends from the border line, retaining PATCH VOLUME, SUSTAIN SLOPE and TEMPO. Adjust lower scale digits to avoid touching RELEASE.
8. **LCD**: separate SINGLE status and PROGRAM title, which had overlapping text bounding boxes in the actual Chromium DOM.
9. **EFFECTS lower selector (owner follow-up)**: replace the misaligned dark stripe *below* DISTORTION/CHARACTER/CHORUS/PHASER/OTHERS with the original's recessed silver-outlined strip; position each of the five LEDs and captions fully inside it using measured nonuniform centers, and restore its hairline to SELECT. Lower the adjacent EFFECTS section contour so its line stays separate from the selector border. Preserve all other zones.

## Validation gate
- Static regression tests assert the exact corrected text/contour patterns.
- Headless Chromium performs a real SVG bounding-box audit for all text against 43 keycaps, selected legends against panel contours, and all text/text pairs; the zero-overlap gate is checked automatically.
- GitHub Actions runs the real panel JavaScript in headless Chromium, checks 32 knob groups and 43 key-cap groups, and exports a ROM-free screenshot for private visual comparison.
- **Do not approve** until the latest browser render has been inspected against the original, including text-to-cap and text-to-line clearance.
- Existing native audio host, firmware and patches remain untouched.
