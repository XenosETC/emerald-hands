# Arcade refresh — October 7, 2026

## What changed

- A Temple Run spotlight, distinct Feudalism/Soul World/Temple Run covers, collection shortcuts, a shorter phone hero, and arcade records grouped below the games.
- A dated “What’s new” section links to Soul World’s sword guard, Shard Rush’s scoring update, and Galactic Heroes. The Soul World card describes its new guard and counter controls.
- Soul World includes its pending sword-guard and guard-to-counter update: four poses, Spirit-based frontal blocking, guard break, keyboard/touch/toggle ownership, and immediate release into a cut. See `pepe-soul-world/docs/sword-guard-validation.md` for tuning and prior gameplay evidence.
- Search includes visible category and gameplay tags. New visitors see a Play link; returning visitors see their actual latest game. Collection shortcuts reset conflicting filters and move keyboard focus to the collection.
- Shard Rush now shows floating catch scores, combo gains, hazard losses, and missed-streak feedback. Reduced-motion mode keeps feedback stationary and omits impact rings. A rank meter shows the remaining score to the next existing rank and follows score losses as well as gains.
- Shard Rush has direct Start/Play again controls, a guarded active-run start button, keyboard/drag handoff, pointer cancellation, and a playfield that fits a typical laptop viewport. Starting returns the playfield into view.
- Shared pause releases held keys and captured drags, blocks gameplay input, shows a Resume button, and returns focus to canvas games on resume. Controls supports Tab, Shift+Tab, Enter/Space, and Escape without also firing game actions. Browser shortcuts and editable text retain their defaults.
- Shard Rush, Galactic Heroes, PepeCoin Run, Space Unchained, Wars, and Tower Defense establish their replay clock from the first delivered frame. A prior pause cannot create a negative simulation step. The shared frame wrapper retains a stable cancellation handle while paused, preventing canceled loops from restarting alongside a new loop.

## Why it matters

The site presents the available worlds more clearly and provides shorter routes to a game. During play, score targets and feedback explain what happened. Pausing and retrying should preserve control and time consistently.

## Files touched

- Hub: `index.html`, `mini-games.css`, `mini-games.js`, `arcade-library-ui.js`.
- Gameplay: `shard-rush.js`, `shard-rush.css`, `shard-rush.html`; clock-only edits in `emerald-galactic-heroes.js`, `pepecoin-run.js`, `pepe-space-unchained.js`, `pepe-wars.js`, `pepe-tower-defense.js`.
- Shared runtime: `arcade.js`; version queries in root game HTML pages.
- Validation: `package.json`, `scripts/shard-rush.test.cjs`, `scripts/arcade-runtime.test.cjs`, `scripts/frame-clock.test.cjs`, `scripts/animation-clock.test.cjs`.
- Soul World: combat, renderer, input, animation studio, guard modules and tests; two guard atlases, preparation/preview tools, and the linked guard validation evidence.
- Documentation: `README.md`, this file, and browser captures under `docs/arcade-refresh-2026-10-07/`.

## Risks and assumptions

This browser prototype update has been validated locally; hosted deployment has not been verified. Existing arcade scoring, reward formulas, save keys, currencies, and progression are preserved. Soul World adds the guard tuning documented in its validation note without changing its save format. Satoshi System keeps its independent fictional economy. The release includes pending Soul World work, its required assets and tests. Unrelated native engine projects and historical local captures are outside the web release. The hub reuses existing project artwork.

Browser checks are bounded interaction/layout checks, not complete balance, performance, or device certification. Tests cover simulation contracts; human feel and difficulty still need playtesting. Browser testing records normal local visits and sessions.

## How to test

1. Run `npm test`: sixteen-page smoke validation plus 37 behavior tests cover controls, pause/replay clocks, cancellation, scoring feedback, rank targets, library state, and save isolation.
2. Run `npm run dev` and open `http://127.0.0.1:4173/`. The current review server uses port 4175 because the default port was occupied during setup.
3. Search for `boss` and `60s`; check the matching shooters and Shard Rush. Combine filters, then use a collection shortcut to clear them and select its genre.
4. Start Shard Rush, drag the collector, switch to A/D or arrow keys, and use P to pause/resume. The timer should stop while paused. Use Controls with Tab and Enter, then Escape; movement focus should return to the playfield.
5. Watch score/rank progress after catches and hazards, complete a sprint, and choose Play again. The new run starts at 60 seconds and zero score even after a long pause.
6. Launch Galactic Heroes, pause, resume, and launch again. Replay should begin normally. Automated tests exercise the equivalent replay-clock cases in the other four affected games.

## Verified browser observations

- A clean copy exported from the staged Git index passed the sixteen-game smoke check and all 273 tests: arcade 37, Soul World 149, Feudalism 76, and Temple Run 11.
- The latest-updates section displayed in three columns on desktop and stacked on a 390px phone viewport with no horizontal overflow. Its Soul World link opened the correct game.
- Soul World loaded in its separate practice save. The desktop toggle entered guard; tapping S released it and J immediately showed `CUT 1` with guard off and HP100 unchanged. No browser warnings or errors appeared in that check.
- Search `boss` returned Space Unchained and Galactic Heroes; `60s` returned Shard Rush.
- An Adventure shortcut cleared a conflicting search/favorites selection and showed five games. The hub had no horizontal overflow at the checked desktop and phone sizes.
- Shard Rush pointer dragging produced score changes; native arrow input, pause/resume, modal keyboard navigation, sound-button activation, and returning focus to the canvas were exercised.
- The live rank meter showed 1,950 points remaining at a score of 1,050. Laptop layout placed the full canvas between approximately y=135 and y=624 in a 720px viewport.
- Galactic Heroes launched, paused, resumed with canvas focus, and relaunched. The inspected browser log contained no warnings/errors for that check.

## Next recommended step

Play a few complete keyboard and phone runs to judge feedback readability and control comfort, including a full Soul World guard-to-counter encounter. Verify the hosted site after deployment.
