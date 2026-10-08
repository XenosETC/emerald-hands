# Daily Vault — Shard Rush

## What changed

Shard Rush now has a complete daily challenge loop alongside its classic sprint. The hub opens Daily Vault directly, shows the current course date, and displays the player's best score and completed attempts. In the game, select a mode before starting; a run locks that choice until it ends.

The daily course has three 20-second waves. A seeded route lays out nearby reward lanes and occasional flanking hazards, with faster drops and shorter spawn intervals in each wave. Every retry on the same UTC date uses the same versioned course. Daily simulation uses 120 fixed steps per second so render refresh rate does not change the drop sequence or collision steps.

The result screen reports Bronze, Silver, or Gold, compares the finished score against the prior best, and offers an immediate retry. The next attempt resets the course, score, clock, and controls. Switching to Classic restores its random drops, pet bonuses, usual high score, and arcade rewards.

### Personal-best ghost — October 8, 2026

A completed daily best saves its collector route and score as an optional gold ghost. On the next attempt, a pace readout compares your score against that run at the same simulation tick. The ghost never catches drops, collides, moves the player, changes score, or grants rewards. The Ghost on/off button controls both the moving trace and live pace comparison. Reduced motion defaults it off; players can explicitly enable it.

Only a complete run that matches the current daily best can supply its replay. A higher best replaces the trace; ties preserve an existing matching trace. Older bests without replay data require a matching or better new run. A weaker attempt cannot masquerade as the best. The opponent stays fixed for the duration of a run, including across midnight or changes from another tab.

## Why it matters

Players can learn a route and improve on a measurable personal result. The hub gives them a playable challenge to return to each day.

## Files touched

- `shard-rush-challenges.js`: versioned course generation, medal thresholds, date validation, bounded record book.
- `shard-rush-ghost.js`: bounded replay capture, validation, storage and interpolation; `scripts/shard-rush-ghost.test.cjs` covers the replay contract.
- `shard-rush.js`, `shard-rush.html`, `shard-rush.css`: mode selection, fixed simulation, results, controls and layout.
- `arcade-daily-ui.js`, `index.html`, `mini-games.css`: hub entry and daily best.
- `scripts/shard-rush-challenges.test.cjs`, `scripts/shard-rush.test.cjs`, `package.json`: course, persistence and actual-game regression tests.

## Assumptions and boundaries

- Bronze at 3,000, Silver at 9,000, and Gold at 18,000 reuse existing Shard Rush rank thresholds as initial prototype targets. Course difficulty and targets still need human balance testing.
- A day resets at **00:00 UTC**, based on the browser's clock. A run crossing midnight finishes on the date it started; the next attempt starts the new day's course.
- Daily runs use the standard collector without pet pickup bonuses. Daily results do not update classic records or award arcade XP/currency. The pet-assist badge is hidden in daily mode to reflect that rule.
- Results are personal, local records, not an online leaderboard or verified competitive score. No account, server, network write or anti-cheat claim is involved.
- Only completed 60-second daily runs write `shard-rush-daily-v1`. This save holds at most 90 dates. Reloading/abandoning a run does not count it. Existing game saves remain separate.
- `shard-rush-ghost-v1` stores one best-run trace, separate from the 90-day score archive. It must match the day, course version and best score to be used. A new day's qualifying run replaces the previous trace. The version-1 format records 1,201 `[collectorX, score]` samples at 20 Hz, including both endpoints. Position is rounded to one canvas pixel and interpolated for display; the comparison score can trail by up to 50 ms. Course or scoring changes must version the course and ghost format together.
- Partial/corrupt/out-of-range traces and raw saves over 40 KB are ignored. Failed replay writes keep the trace usable in that tab and report the failure. Reloading loses an unsaved trace. Ghost settings are per tab, and no replay is uploaded or shared.
- Corrupt records are ignored. Storage failures leave the run playable and show an explicit unsaved notice; that tab retains its best while open. Another tab's best is merged at completion; simultaneous cross-tab completions do not have a transaction guarantee.
- Large frame stalls are bounded to 100ms of simulation per delivered frame. Pausing stops simulation; prolonged low frame rates can make the full run take longer than a wall-clock minute.

## How to test

Run `npm test`. The 62 tests include identical courses and simulations at 30/60/144 FPS, valid dates, midnight rollover, duplicate records, storage failure, daily/classic isolation, early-abandon handling, medal boundaries and retry resets. Replay tests cover bounded capture, corruption, persistence, interpolation, score loss, weaker/tied/new best replacement, older records, another tab's best, clock alignment, reduced motion, and identical gameplay with the ghost on or off.

The ghost release passed a clean copy reconstructed from the Git index: 16-game smoke and **298 tests** (arcade 62, Soul World 149, Feudalism 76, Temple Run 11). This adds 15 replay behavior tests to the previous daily-course release.

Open `shard-rush.html?mode=daily` through the local server, start the vault, steer with A/D, arrows or drag, pause/resume with P, and finish a full minute. Check the medal and daily-best comparison. Retry, then return to the hub and reload to verify the saved daily record. Change back to Classic between runs to verify its normal rank and pet bonus presentation.

For the ghost, finish a new best, reload, then retry and look for the gold dashed collector labeled BEST. Move away from its route and check the live pace comparison. Toggle Ghost off/on, pause/resume, and retry again to verify alignment. At 390px width, check the controls and collector remain visible and drag still works. Keep existing browser records: use a separate local server port when testing the first-run experience.

## Browser checks

A complete local daily run used keyboard input, reached the result screen, and saved 760 points with 16 catches, five hazard hits and a maximum combo of two. The result showed its date, first completion and local save status. This was a bounded functional check, not a balance playtest.

Reloading retained that record. A phone-width retry restarted at zero with the same course date, accepted pointer dragging, and displayed the shared pause overlay. The checked 390px layout had no horizontal overflow. Physical-device multitouch and full-run performance remain human review items.

The paused timer remained at 56 seconds across the inspection. After resuming and returning to the hub before completing the retry, the hub still showed the 760-point best and exactly one completed run. The inspected browser log had no warnings/errors.

## Next review

Play several dates on a physical phone and keyboard to tune route difficulty, movement comfort and medal targets before extending this mode to another game. Hosted deployment remains a separate verification step.

## Ghost browser verification — October 8, 2026

- Used a separate localhost origin on port 4176 to preserve existing preview records. A normal complete run saved **8,990 points**, Bronze, 17 clean catches, six hazard hits and maximum combo x6. The result reported that the ghost was ready. [Result capture](docs/daily-ghost-2026-10-08/first-result.png).
- Reloaded the final build. Its saved ghost was available, and a new run started at zero with the gold dashed collector labeled BEST. Live pace showed level with the recorded run. Ghost off hid the replay and comparison; turning it back on restored them. [Desktop chase](docs/daily-ghost-2026-10-08/desktop-ghost.png).
- Paused at 57 seconds: both the timer and pace stayed unchanged through inspection and resizing. Resumed at 390px width and used a pointer drag; the controls, HUD and collector stayed visible. Document width and scroll width were both 375px (the viewport includes the scrollbar). [Phone chase](docs/daily-ghost-2026-10-08/phone-ghost.png).
- Returned to the hub before completing the retry. It still showed the 8,990-point best and exactly one completion. The updated daily entry fit both phone and desktop layouts; the browser log contained no warnings/errors. [Phone hub](docs/daily-ghost-2026-10-08/phone-hub.png).
- This preview delivered frames slowly, so the fixed 60-second simulation took longer in wall-clock time. Real-device frame rate, control feel and medal balance remain review gates. These local checks do not verify hosted deployment.
