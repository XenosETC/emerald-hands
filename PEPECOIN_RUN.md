# PepeCoin Emerald Run development pass — October 11, 2026

The runner keeps its existing endless score loop and isolated `pepecoin-emerald-run-v1` best score. This pass repairs course continuity and run lifecycle and adds an accessible jump control, landing buffer and visible rank progression. It is not yet a full finishing candidate.

## Changes

- New batches append beyond the generated horizon rather than overlapping existing spikes and emeralds. Objects behind the camera are removed to bound long-run storage.
- A late market response is held for the next run, so the ground cannot change underneath a playing coin.
- Active runs cannot be restarted by a duplicate launch. Loss records once, replay focuses the canvas, and results focus the replay button.
- Paused input, repeated keydown and focused controls cannot trigger jumps. Invalid or unavailable best-score storage no longer prevents launch; blocked writes retain a session best.
- Start instructions explain the existing every-third-shard multiplier and 3.2-second collection window.

- A full-width phone Jump button supports pointer and keyboard activation. Pausing disables it and clears queued taps; pointer clicks never queue a second jump.
- A 120 ms landing buffer remembers a tap just before landing. Rolling off a slope now clears grounded state, preventing an unintended airborne jump. Jump impulse is unchanged.
- Live next-rank guidance uses the existing 1,800 / 4,500 / 9,000 / 18,000 thresholds. Results and shared achievements use the highest combo reached rather than the combo remaining at impact.

## Verification

Root smoke and 130 behavior tests pass in the workspace and clean staged copy. New actual-controller fixtures cover non-overlapping course extension, cleanup, deferred terrain, duplicate launch/loss and paused/repeat-key input. Existing replay clock regression now ends a run before replaying.

Browser checks use separate localhost origins to preserve user saves. Native launch and Space jump were exercised in the first pass. This pass checked the Jump button, pause/resume, natural loss and replay at a 390 x 844 viewport. The page was 375 px wide, with no overflow, and the canvas retained its 16:9 geometry. A natural phone-sized run ended at 21 points; replay kept that best and reset emeralds/combo. Pointer automation at phone dimensions is not physical-device touch testing.

[Phone result evidence](docs/pepecoin-run-finish-2026-10-11/results-phone.png)

Controller fixtures additionally verify landing-buffer expiry, falling-state correction, pointer versus keyboard activation, pause clearing and peak-combo achievement payloads. High-rank thresholds are fixture checks, not a manually won high-rank run.

## Remaining gates

Physical touch comfort, sustained human jump timing, high-rank pacing and hosted behavior remain to be checked before advancing the finishing queue. Market data is optional visual input, not a real-time financial feed. Scoring and jump strength are unchanged; the 120 ms input buffer is an explicit control-feel assumption to review in human play.
