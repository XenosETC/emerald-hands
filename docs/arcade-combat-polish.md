# Arcade controls and combat feedback

This batch improves Relic Rumble, Emerald Galactic Heroes and Shard Rush.
The existing uncommitted PepeCoin Run changes remain separate and untouched.
Scoring, shared rewards, fighter stats, enemy firing cadence and save keys are
unchanged.

## Relic Rumble

Solo Tournament now supports a seven-button touch pad on coarse-pointer or
narrow layouts: left/right, jump/charge, punch/kick and shield/special. Local
Versus still uses two keyboard control sets. The pad reserves its own space
outside the fixed-camera stage, keeps 44px targets and clears on pause, blur,
visibility changes, pointer cancellation, lost capture and fight transitions.

`relic-rumble-touch.js` owns pointer capture and button interaction. The main
controller merges keyboard and touch ownership: releasing one source cannot
release the other. All actions use the existing combat input path, including
charging and the full-energy special. Holding movement/Charge while tapping
an attack is supported. Native button keyboard activation is also supported.

The compact HUD shows health plus violet energy bars. Its score reads
`0 — 0 · FT2` (first to two; Versus uses FT3), with a full accessible label.
The touch special distinguishes full energy from actual firing range: at 100
energy it asks the player to close distance, then shows Relic Burst within the
existing 380-unit range. The expanded
keyboard help remains in Game info. The touch-only arcade filter now includes
Rumble, and the hub distinguishes touch Tournament from keyboard Versus.

## Galactic Heroes

Fighters show a violet firing lane during their final 0.28 seconds before
shooting; cruisers use 0.32 seconds. The lane follows the current muzzle x,
matching the vertical projectile path. A local charge ring and the boss status
label reinforce the warning. Meteors, destroyed hulls and fully offscreen hulls
do not show shot warnings. No new damage, spread, delay or enemy types are added.

Warnings use simulation timers and freeze with shared pause. Reduced motion
holds the charge ring size steady; there is no flashing full-screen effect.

## Shard Rush

The existing seconds HUD now includes a draining 60-second time bar. The final
ten seconds receive a gold FINAL SPRINT treatment. Screen-reader cues occur at
ten and five seconds, and replay clears those cues. Classic and Daily share
this presentation while retaining their own scoring, seed, ghost and reward
behavior.

## Verification

Controller coverage exercises mixed keyboard/touch ownership, real touch-mapped
combat actions, unchanged projectile cadence/lane, and final-sprint cue/reset
behavior in Classic and Daily. Browser checks exercise actual simultaneous touch
input, cancellation, pause recovery, charged special activation, touch-only
discovery, firing and countdown transitions.

Touch layouts are checked at 320×568, 390×844 and 844×390, including a compact
fight HUD under 100px and all tested touch targets on screen. Desktop layout
checks remain in the existing canvas suite. These checks establish Chromium
interaction and presentation, not physical-device comfort or tournament balance.

Final checks: all 557 core tests passed, followed by 37 focused browser checks
covering this batch, the existing canvas screens and hub behavior. The charged
special case uses the existing energy QA preset and native approach/touch input;
it verifies both the out-of-range message and actual activation in range.
Phone screenshots were reviewed, and `git diff --check` reported no whitespace
errors. Changes remain local and uncommitted.
