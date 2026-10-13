# ETC: Unstable Launch local finishing candidate — October 12, 2026

This is the existing points-only fictional-price timing game, with no wagering, real-money wallet or price feed. The current pass makes audio optional, prevents held Space or interactive-focus Space from repeatedly locking/relaunching, and rejects action transitions during shared pause. Optional shared-record write failures leave results/replay usable and disclose the unsaved record.

Controller fixtures use deterministic random values and a throwing audio constructor. They execute launch → lock → replay → natural price-threshold crash, verify outcomes are recorded once, and cover key repeat/focus, pause and record failures. These are controller runs, not native human timing or balance proof.

The initial pass left native timing/replay, milestone records, frame timing and desktop/phone checks open. The local finishing review below supersedes that initial status; human comfort and pacing remain separate gates.

Native isolated-browser launch → lock → replay passed: the lock produced Reactor Cadet at $23.04, exposed Launch Again, and the next click returned to the active Lock Price control. This short native check does not establish sustained timing comfort or late-milestone pacing. User-origin saves were untouched.


## Consistent timing and exact crash boundaries

Simulation now uses fixed 1/120-second steps with a 100ms catch-up bound. The existing price-growth curve is inverted to find the exact seeded crash time; terminal price/peak stop at that threshold and stability reaches zero. Seed distributions, growth and scoring are unchanged, but old frame overshoot is removed. Fixtures compare three seeds spanning early and late crash tiers at 30/60/120 FPS, plus equal-time locks and bounded stalls. Background throttling can still slow active play; this is not offline progression. Human reaction comfort remains a separate gate.


## Flight artwork and personal records

The current asset milestone adds a dedicated launch cover, Rocket Simulator exploration cover and a dark-centered Unstable Launch flight corridor. Original sprite sheets and backgrounds remain retained. Gameplay draws the corridor with bounded drift while existing stars/rocket/effects move, avoiding a hard repeated-image seam. Exact built-in imagegen prompts and output paths are recorded in `assets/flight-art-2026-10-12.json`.

The shared record now retains highest locked price/rank independently of highest score and peak. A lower lock with a higher score or a crash cannot erase the best lock; new higher locks update its rank. These independent fields can come from different runs. The regression executes the actual shared record controller. Older overwritten records cannot be reconstructed.

Milestone boundary: finish and validate this three-image asset integration and record fix before starting the next game milestone. The local finishing review below records completed phone/native visual checks. Human reaction comfort and hosted review remain open; this asset pass does not assert full release readiness.


## Local finishing review and asset milestone closure

Native asset-review origin completed launch/lock at $28.12, replay, and an unattended crash at $2.26K. The best lock remained $28.12 after crash and reload. A deterministic rare late-tier seed permits an actual-growth Beyond Canon lock and crosses all ten timeline markers; replay clears those markers. That fixture does not establish human timing comfort or the frequency of reaching the top milestone.

The implemented loop now covers launch, lock, loss, replay, milestones, independent best fields, optional audio, pause/input guards and consistent crash timing. This is a local finishing candidate with human pacing/reaction, physical-device and hosted-performance checks still open. The three-image flight-art milestone is closed after asset integration, visual checks and staged release validation; the next game milestone has not been started.

Native phone review at 390px measured a 375px page without overflow and a 66px action button. Tap launch/lock produced Reactor Cadet at $27.61. Artwork was inspected with the live desktop HUD and phone controls. [Desktop proof](docs/flight-art-2026-10-12/gameplay-desktop.png) · [Phone proof](docs/flight-art-2026-10-12/gameplay-phone.png). Original generated PNGs are retained at roughly 2.3–2.9MB each; cover images lazy-load and decode asynchronously. Hosted bandwidth profiling remains separate.
