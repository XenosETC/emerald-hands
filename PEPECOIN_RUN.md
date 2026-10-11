# PepeCoin Emerald Run development pass — October 11, 2026

The runner keeps its existing endless score loop and isolated `pepecoin-emerald-run-v1` best score. This pass repairs course continuity and run lifecycle and adds an accessible jump control, landing buffer and visible rank progression. It is a local finishing candidate: core controls/results/replay and progression fixtures pass, with human balance and physical-device gates still open.

## Changes

- New batches append beyond the generated horizon rather than overlapping existing spikes and emeralds. Objects behind the camera are removed to bound long-run storage.
- A late market response is held for the next run, so the ground cannot change underneath a playing coin.
- Active runs cannot be restarted by a duplicate launch. Loss records once, replay focuses the canvas, and results focus the replay button.
- Paused input, repeated keydown and focused controls cannot trigger jumps. Invalid or unavailable best-score storage no longer prevents launch; blocked writes retain a session best.
- Start instructions explain the existing every-third-shard multiplier and 3.2-second collection window.

- A full-width phone Jump button supports pointer and keyboard activation. Pausing disables it and clears queued taps; pointer clicks never queue a second jump.
- A 120 ms landing buffer remembers a tap just before landing. Rolling off a slope now clears grounded state, preventing an unintended airborne jump. Jump impulse is unchanged.
- Live next-rank guidance uses the existing 1,800 / 4,500 / 9,000 / 18,000 thresholds. Results and shared achievements use the highest combo reached rather than the combo remaining at impact.

- Consecutive spikes now have at least 550 world units between their centers. The existing jump takes about 450 units at the 570-unit/s speed cap; the extra gap provides a recovery window. Emerald clusters retain their original spacing and rewards. This deliberately reduces tightly packed spike density.
- Market tapes reject nonnumeric, nonfinite, nonpositive and oversized input. Terrain normalization is computed once when a tape is accepted, rather than rescanning every price for every road point.
- Cache-write failure does not discard usable market data. Run IDs stop delayed hints/results from changing a newer run.

## Verification

Root smoke and 135 behavior tests pass in the workspace and clean staged copy. New actual-controller fixtures cover non-overlapping course extension, cleanup, deferred terrain, duplicate launch/loss and paused/repeat-key input. Existing replay clock regression now ends a run before replaying.

Browser checks use separate localhost origins to preserve user saves. Native launch and Space jump were exercised in the first pass. This pass checked the Jump button, pause/resume, natural loss and replay at a 390 x 844 viewport. The page was 375 px wide, with no overflow, and the canvas retained its 16:9 geometry. A natural phone-sized run ended at 21 points; replay kept that best and reset emeralds/combo. Pointer automation at phone dimensions is not physical-device touch testing.

[Phone result evidence](docs/pepecoin-run-finish-2026-10-11/results-phone.png)

Controller fixtures additionally verify landing-buffer expiry, falling-state correction, pointer versus keyboard activation, pause clearing and peak-combo achievement payloads. High-rank thresholds are fixture checks, not a manually won high-rank run.

The final pass adds two five-minute, 60 Hz actual-controller runs with flat terrain and deterministic random values 0 and 0.5. A synthetic timing player jumps at real spikes; collisions remain enabled. Both reach the speed cap, cross multiple appended batches, keep object counts bounded, exceed 18,000 points and record Ancient Pepe through the normal loss path. This isolates spacing and progression; it does not prove all curved market roads are balanced. Before the spacing repair, the 0.5 run crashed after roughly 101 seconds as repeated jumps lost their recovery window.

Additional fixtures reject corrupt tapes, ensure accepted arrays cannot be mutated externally, prevent stale result callbacks and retain playable results/replay when best-score storage throws. Browser launch, natural loss, replay and pause/resume were rechecked after the final spacing changes on an isolated origin. The five-minute runs and Ancient Pepe result are fixtures, not native browser wins.

## Remaining gates

Physical touch comfort, sustained human jump timing, high-rank pacing and hosted behavior remain open before calling the game fully release-ready. The next implementation pass in the queue is Space Unchained. Market data is optional visual input, not a real-time financial feed. Scoring and jump strength are unchanged; the 120 ms input buffer is an explicit control-feel assumption to review in human play.
