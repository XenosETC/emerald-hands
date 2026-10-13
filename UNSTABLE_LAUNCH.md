# ETC: Unstable Launch finishing work — October 12, 2026

This is the existing points-only fictional-price timing game, with no wagering, real-money wallet or price feed. The current pass makes audio optional, prevents held Space or interactive-focus Space from repeatedly locking/relaunching, and rejects action transitions during shared pause. Optional shared-record write failures leave results/replay usable and disclose the unsaved record.

Controller fixtures use deterministic random values and a throwing audio constructor. They execute launch → lock → replay → natural price-threshold crash, verify outcomes are recorded once, and cover key repeat/focus, pause and record failures. These are controller runs, not native human timing or balance proof.

Remaining finishing gates: native timing/replay, milestone and best-record behavior, frame timing, desktop/phone comfort and human risk/reward pacing. The game is not yet a local finishing candidate.

Native isolated-browser launch → lock → replay passed: the lock produced Reactor Cadet at $23.04, exposed Launch Again, and the next click returned to the active Lock Price control. This short native check does not establish sustained timing comfort or late-milestone pacing. User-origin saves were untouched.


## Consistent timing and exact crash boundaries

Simulation now uses fixed 1/120-second steps with a 100ms catch-up bound. The existing price-growth curve is inverted to find the exact seeded crash time; terminal price/peak stop at that threshold and stability reaches zero. Seed distributions, growth and scoring are unchanged, but old frame overshoot is removed. Fixtures compare three seeds spanning early and late crash tiers at 30/60/120 FPS, plus equal-time locks and bounded stalls. Background throttling can still slow active play; this is not offline progression. Human reaction comfort remains a separate gate.
