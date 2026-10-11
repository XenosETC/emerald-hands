# Pepe: Space Unchained development pass — October 11, 2026

This is an in-progress finishing pass, preserving the independent `pepe-space-unchained-best-v1` best score, endless shooter, auto-fire, rank thresholds and existing burst damage/cost/cooldown.

## Changes

- Vault nodes now use tracked 16-kill milestones. Multiple kills before a spawn check cannot skip a node, and only one boss can be active. Boss health and kills remaining appear in the mission panel.
- Fatal projectiles and hull collisions stop the remaining combat and pickup phases. Shield cannot go below zero, results record once, and late callbacks cannot overlay a replay.
- Replay restores full shield and returns focus to the canvas. Active-flight launch is guarded. Results focus Launch Again. Invalid/unavailable storage cannot stop play; failed writes keep this tab's best.
- Pause, blur and hidden pages release keys, pointer capture and velocity. Focused controls and paused/repeated Space presses cannot spend burst shards.
- Touch steering owns one pointer; cancellation ends the drag. Moving the mouse retains the original follow-pointer style. Mouse click still bursts. Touch drag now only steers; the visible Burst button spends exactly 5 shards and shows its 2.2-second cooldown.

- Flights may now be banked at any time through Finish flight. It records only the score actually earned, follows the same existing reward path, labels the result as banked, and cannot record twice. The endless game remains playable past Chainbreaker Ace.
- The existing top rank is stated plainly: wave 7 or 18,000 points. Keyboard drag uses exact time-based integration, preserving the original 60 Hz terminal speed while preventing frame-rate-dependent steering. Stars and invulnerability blink now use simulation time.

## Verification

Root smoke and 144 behavior tests pass in the workspace and clean staged copy. Six new actual-controller fixtures cover skipped boss milestones, single active boss, fatal combat/pickup cutoff, burst resource/cooldown guards, stale callbacks, blocked writes and touch ownership. Existing flight-clock replay checks now end the flight before relaunching.

Native browser checks used an isolated origin and a 390 x 844 viewport. Launch, keyboard movement, pause/resume, natural loss and replay were exercised. The page was 375 px wide without overflow. An auto-fire run ended naturally at 1,809 points, wave 1, five kills and seven remaining shards. Replay restored shield 100, zero shards and the 16-kill target while retaining the best. Pointer automation at phone dimensions is not a physical-device test. Touch ownership and funded Burst activation are controller fixtures, not a native multitouch demonstration.

[Phone result evidence](docs/space-unchained-development-2026-10-11/results-phone.png)

The second pass adds controller checks for matching keyboard motion at 30/60/120 Hz, banking once and fresh replay, and a vault-core defeat using actual projectile collision/damage. The boss fixture seeds the 16-kill checkpoint, deals all 39 HP through bullets, awards the normal 2,300 points and ten immediate shards, then reaches the next node at 32 kills. It is a fixture, not a native browser boss win.

The banking control was also exercised natively at 390 x 844: a brief flight banked its actual one-point score, replay retained that best, and pause disabled banking. Page width remained 375 px without overflow. This is a control check, not a high-score playthrough.

## Remaining work

Continue actual vault-node fights and later-wave/rank progression, sustained steering and human balance before marking this game as a finishing candidate. Physical touch comfort and hosted behavior remain separate release gates. The touch-steering change is deliberate: dragging should not spend five shards merely to reposition the fighter.
