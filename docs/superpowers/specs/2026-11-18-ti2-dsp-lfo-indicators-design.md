# TI2 DSP LFO Indicators Design (Experimental v0.13)

## Intent and constraints

Show the real LFO1–3 activity on the three existing physical TI2 Desktop indicator circles using the scalar phase readings already delivered by the native DSP host. Preserve the owner's approved v0.7 panel geometry exactly, along with the stable v0.9 installation, MIDI control behavior, and local-only firmware boundary. This is a draft experiment based on v0.12, not a production merge.

## Approach

- **Chosen:** existing `/api/status` transports small scalar `dspFrontpanel` snapshots; speed up its local cadence, dispatch the result to a dedicated small UI controller, and color only tagged LFO1–3 SVG circles. No new endpoint or native binary protocol.
- Alternative: drive at the original 1 Hz cadence. Less traffic, but insufficient to demonstrate meaningful LFO motion.
- Alternative: stream DSP events over WebSockets. Smoother at high rates, but unnecessary complexity and a larger attack surface for three lights.

## Visual and data contract

- Only the three existing circles at SVG positions `(310,125)`, `(352,125)`, `(400,125)` are tagged and may show DSP activity; all other circles retain their existing neutral/local semantics. No shapes or positions change.
- Input is `dspFrontpanel` with `source === "dsp-frontpanel"`, finite nonnegative revision, `ageSeconds < 3`, and exactly three finite phase floats in `lfoLedLevels`; reject missing, stale, malformed, or non-DSP data and revert only those three circles to their existing neutral fill.
- The upstream Gearmulator TI plugin maps phase `p` to LED intensity `pow(1 - clamp(p,0,1), 0.2)`. Render that intensity between the existing dark fill and the v0.9 local red, with no interpretation of LFO phase as literal brightness.
- Do not render BPM, logo, MIDI activity, OSC selection, or unavailable firmware parameter values from DSP. A server disconnection extinguishes all three LFO lights.
- Advance native `PING` roughly every 100 ms and browser status requests roughly every 125 ms; avoid overlapping HTTP status requests.
- Never disclose the user's private firmware, observations, or runtime metrics in a public PR.

## Validation

ROM-free Node tests drive the real LFO UI controller with simulated status events, including bright/dark/intermediate phases, malformed readings, stale/disconnected state, and unrelated LEDs. Python integration tests ensure the new script is served and that native status polling is periodic. The existing suites and JS syntax checks must pass.
