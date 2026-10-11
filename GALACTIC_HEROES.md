# Emerald Galactic Heroes finishing pass — October 11, 2026

The third game in the oldest-to-newest queue retains its endless survival-shooter identity. Reach the existing Emerald Ace rank at wave 5 or 70,000 points, then continue defending until the last shield cell is lost. This pass adds no campaign victory, new currency, or save format.

## Changed behavior

- The flight brief explains the rank target, next timed wave and boss advancement. Boss health is visible during a cruiser encounter, using its actual remaining hit points.
- Launch and replay are available inside the overlay. An active flight cannot be silently restarted by the launch button; starting focuses the canvas and brings the playfield into view. Results focus the replay action.
- Finish flight banks the actual current score through the existing result/reward path. It is available only during flight, pays once, and distinguishes a voluntary finish from loss of the last cell.
- Boss-earned wave advancement persists instead of being overwritten by the elapsed-time wave calculation. Weapon upgrades follow the preserved wave on the next update.
- Destroyed enemies cannot collide with the hero afterward or remove their neighboring ship. Fatal missile or hull hits stop the frame before subsequent combat/pickup phases, keeping the displayed and recorded result consistent. Shield cells cannot become negative from a fatal boss collision.
- Keyboard and drag control explicitly hand off ownership. Secondary pointers, canceled capture, blur, pause and hidden-page input are handled. Controls pressed during pause do not latch into resumed play, and Space respects focused buttons and repeat.
- Existing shared arcade best scores are shown without introducing a separate save. Long overlays scroll, and laptop playfields fit the HUD and ship on screen together.

## Verification

`npm test` now includes twelve tests running the actual Galactic Heroes controller. They cover launch/replay, input handoff and release, paused/focused input, boss advancement, destroyed hull collisions, fatal-hit result consistency, boss health/target text, replay clocks and existing-record projection. The root total is 116 behavior tests plus the sixteen-game smoke check.

Combat and late-wave test states are deterministic fixtures, not evidence of human balance or a manually earned Emerald Ace run. Browser checks use an isolated localhost origin so records do not change the user's game saves.

Native browser launch and auto-fire reached wave 5 without injected state. A second flight banked 211,500 points through Finish flight; the record survived reload, and replay reset score to zero and cells to three. This run needed very little steering, so it highlights an unresolved difficulty/pickup pacing gate. Fatal-loss consistency is verified in controller fixtures rather than a naturally lost browser flight.

At a measured 390-pixel viewport, page width was 375 with no horizontal overflow. Launch, shared pause/resume, Finish flight and replay worked through visible controls. Desktop and phone browser logs showed no warnings or errors. [Clean desktop replay screen](docs/galactic-heroes-finish-2026-10-11/flight-results-desktop-clean.png) records a zero-score QA flight; [Emerald Ace result](docs/galactic-heroes-finish-2026-10-11/flight-results-desktop.png) records the earned auto-fire run.

## Remaining gates

Human difficulty/weapon pacing, sustained physical-phone input, hosted URL verification and commercial asset rights remain open. Boss advancement was already present in the controller; preserving it now affects how quickly a successful pilot reaches the later waves. Gameplay remains endless, and rewards remain governed by the existing shared arcade record system.
