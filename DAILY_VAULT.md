# Daily Vault — Shard Rush

## What changed

Shard Rush now has a complete daily challenge loop alongside its classic sprint. The hub opens Daily Vault directly, shows the current course date, and displays the player's best score and completed attempts. In the game, select a mode before starting; a run locks that choice until it ends.

The daily course has three 20-second waves. A seeded route lays out nearby reward lanes and occasional flanking hazards, with faster drops and shorter spawn intervals in each wave. Every retry on the same UTC date uses the same versioned course. Daily simulation uses 120 fixed steps per second so render refresh rate does not change the drop sequence or collision steps.

The result screen reports Bronze, Silver, or Gold, compares the finished score against the prior best, and offers an immediate retry. The next attempt resets the course, score, clock, and controls. Switching to Classic restores its random drops, pet bonuses, usual high score, and arcade rewards.

## Why it matters

Players can learn a route and improve on a measurable personal result. The hub gives them a playable challenge to return to each day.

## Files touched

- `shard-rush-challenges.js`: versioned course generation, medal thresholds, date validation, bounded record book.
- `shard-rush.js`, `shard-rush.html`, `shard-rush.css`: mode selection, fixed simulation, results, controls and layout.
- `arcade-daily-ui.js`, `index.html`, `mini-games.css`: hub entry and daily best.
- `scripts/shard-rush-challenges.test.cjs`, `scripts/shard-rush.test.cjs`, `package.json`: course, persistence and actual-game regression tests.

## Assumptions and boundaries

- Bronze at 3,000, Silver at 9,000, and Gold at 18,000 reuse existing Shard Rush rank thresholds as initial prototype targets. Course difficulty and targets still need human balance testing.
- A day resets at **00:00 UTC**, based on the browser's clock. A run crossing midnight finishes on the date it started; the next attempt starts the new day's course.
- Daily runs use the standard collector without pet pickup bonuses. Daily results do not update classic records or award arcade XP/currency. The pet-assist badge is hidden in daily mode to reflect that rule.
- Results are personal, local records, not an online leaderboard or verified competitive score. No account, server, network write or anti-cheat claim is involved.
- Only completed 60-second daily runs write `shard-rush-daily-v1`. This save holds at most 90 dates. Reloading/abandoning a run does not count it. Existing game saves remain separate.
- Corrupt records are ignored. Storage failures leave the run playable and show an explicit unsaved notice; that tab retains its best while open. Another tab's best is merged at completion; simultaneous cross-tab completions do not have a transaction guarantee.
- Large frame stalls are bounded to 100ms of simulation per delivered frame. Pausing stops simulation; prolonged low frame rates can make the full run take longer than a wall-clock minute.

## How to test

Run `npm test`. The 47 tests include identical courses and simulations at 30/60/144 FPS, valid dates, midnight rollover, duplicate records, storage failure, daily/classic isolation, early-abandon handling, medal boundaries and retry resets.

The clean staged release copy passed the 16-game smoke check and all 283 tests: arcade 47, Soul World 149, Feudalism 76, and Temple Run 11.

Open `shard-rush.html?mode=daily` through the local server, start the vault, steer with A/D, arrows or drag, pause/resume with P, and finish a full minute. Check the medal and daily-best comparison. Retry, then return to the hub and reload to verify the saved daily record. Change back to Classic between runs to verify its normal rank and pet bonus presentation.

## Browser checks

A complete local daily run used keyboard input, reached the result screen, and saved 760 points with 16 catches, five hazard hits and a maximum combo of two. The result showed its date, first completion and local save status. This was a bounded functional check, not a balance playtest.

Reloading retained that record. A phone-width retry restarted at zero with the same course date, accepted pointer dragging, and displayed the shared pause overlay. The checked 390px layout had no horizontal overflow. Physical-device multitouch and full-run performance remain human review items.

The paused timer remained at 56 seconds across the inspection. After resuming and returning to the hub before completing the retry, the hub still showed the 760-point best and exactly one completed run. The inspected browser log had no warnings/errors.

## Next review

Play several dates on a physical phone and keyboard to tune route difficulty, movement comfort and medal targets before extending this mode to another game. Hosted deployment remains a separate verification step.
