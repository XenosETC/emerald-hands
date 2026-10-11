# PepeCoin Emerald Run development pass — October 11, 2026

The runner keeps its existing endless score loop and isolated `pepecoin-emerald-run-v1` best score. This pass repairs course continuity and run lifecycle; it is not yet a full finishing candidate.

## Changes

- New batches append beyond the generated horizon rather than overlapping existing spikes and emeralds. Objects behind the camera are removed to bound long-run storage.
- A late market response is held for the next run, so the ground cannot change underneath a playing coin.
- Active runs cannot be restarted by a duplicate launch. Loss records once, replay focuses the canvas, and results focus the replay button.
- Paused input, repeated keydown and focused controls cannot trigger jumps. Invalid or unavailable best-score storage no longer prevents launch; blocked writes retain a session best.
- Start instructions explain the existing every-third-shard multiplier and 3.2-second collection window.

## Verification

Root smoke and 126 behavior tests pass. New actual-controller fixtures cover non-overlapping course extension, cleanup, deferred terrain, duplicate launch/loss and paused/repeat-key input. Existing replay clock regression now ends a run before replaying.

Browser checks use a separate localhost origin to preserve user saves. Native launch and Space jump were exercised; natural loss and replay were checked in the result screen.

## Remaining gates

Phone layout and physical touch comfort, sustained human jump timing, high-rank progression and hosted behavior remain to be checked before advancing the finishing queue. Market data is optional visual input, not a real-time financial feed. Scoring and jump strength are unchanged.
