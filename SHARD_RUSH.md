# Shard Rush finishing pass — October 11, 2026

The second game in the oldest-to-newest queue now connects its existing Classic and Daily score loops to clearer instruction and retry feedback.

## Player improvements

- A collapsible drop guide uses the actual sprite sheet for all five rewards and both hazards. It shows base points, immediate combo boosts, hazard losses, the x8 cap, and missed-reward rules.
- The live combo hint counts clean catches toward the next streak boost. Candle and combo pickups still raise the multiplier immediately, using the original score rules.
- Results include rewards missed, alongside score, maximum combo, catches and hazards. Advice reflects the run's main problem and gives the next Classic rank or Daily medal target. Completed results focus the retry button; retry resets counters and hides the old advice.
- Classic best is read from the existing shared arcade record. No additional save key or currency is introduced. Daily records, courses, ghost recordings and reward isolation retain their existing formats.
- Movement keys and pointer presses made during shared pause are ignored, preventing fresh input from latching into the resumed run. Existing drag/keyboard handoff, cancellation and visibility handling remain in place.
- Long result overlays scroll within the playfield so the retry action remains reachable.

## Verification

Four new controller regressions exercise paused input, missed reward versus safe missed hazard counting, result focus/retry reset, combo guidance, existing Classic best projection, unavailable record storage, and Daily target/reward isolation. The existing suites verify deterministic courses, pause clocks, scoring, completed Daily records, ghost persistence and replay timing.

Run `npm test` for the sixteen-game smoke check and 104 behavior tests. Browser verification used isolated localhost hostnames; their records do not change the user's arcade saves.

A real Classic run completed at 640 points, displayed missed-reward advice and a next-rank target, and retained its Classic best across reload. A real Daily run completed at 750 points, saved its record and best-run ghost, and retried with 60 seconds, Ghost on and old advice hidden. No late-game state was injected for these checks. Results now place the replay action above the statistics, and the pet assist is hidden outside a running sprint.

The sprite guide was visually checked on desktop and at a verified 390-pixel viewport (page width 375, no horizontal overflow). Phone-sized start and shared pause showed the Resume action with the timer frozen at 60 seconds. These are browser viewport checks, not physical-phone comfort certification. Browser console checks showed no warnings or errors. Evidence: [desktop guide](docs/shard-rush-finish-2026-10-11/drop-guide-desktop.png), [phone guide](docs/shard-rush-finish-2026-10-11/drop-guide-phone.png).

## Remaining gates

Human difficulty and comfort playtests, sustained physical-phone input, and hosted URL verification remain separate from this local finishing pass. Daily ghosts require a completed run, remain local to this browser, and never award shared XP or currency. Unavailable storage leaves Daily records in the current tab only, as described by the existing result notice.
