# Pepe’s Paradox finishing development — October 11, 2026

In progress. This build is the Bamboo Mountains chapter only; the temple-opening text is a story lead, not a playable next chapter. Keyboard remains required. Existing collectibles, reward values and shared record isolation are unchanged.

- Replay restores displaced wisps, moving-platform phases, rival position/visibility, facing, particles and input. Active play/dialogue cannot be replaced by a duplicate launch.
- Optional audio failures no longer interrupt startup, jumps or story progression.
- Pause/blur/hidden-page input clears movement and dash. Paused actions, held/repeated jumps/dashes and focused controls cannot issue gameplay commands.
- Dialogue clears movement, focuses Continue, and hands focus back to the canvas after its final line. Completion requires the existing taunt sequence and focuses replay.
- Replay resets the frame baseline; negative frame deltas cannot rewind simulation.

Verification: root smoke and 199 behavior tests pass in the workspace and clean staged copy. Three controller fixtures check audio-failure launch/active launch guard, replay world/input reset and paused jump/dash guards. Private controller access is injected into in-memory test copies only. Native browser checks used an isolated origin to launch, jump, pause and resume; they do not establish a full stage playthrough.

Next: platform landing, fall recovery, dialogue/escape/completion and collectible progression. Manual jump feel, physical-device comfort and hosted behavior remain open.

## Stable fall recovery

Falls now return Crown to the last landed solid platform, with the full character width clamped inside its bounds. Moving platforms do not become recovery points. Recovery clears movement/dash, preserves collected items, and reports the fall count. Replay resets the recovery point and count. This deliberately replaces the old 360-unit rewind, which could place Crown above another gap.

Landing selects the highest surface crossed by the falling character rather than depending on platform array order. Controller fixtures cover last-safe-ground recovery and retained collectibles, and a fast fall crossing multiple surfaces. These are physics fixtures, not a native full-stage playthrough; manual jump feel remains open.

## Chapter completion and story handoff

Completion now reports the score actually recorded, collectible totals and fall recoveries, and explicitly says this build ends at Bamboo Mountains. Replay hides/reset the report. Delayed victory tones are tied to the completed run and cannot play after a new run starts.

A controller fixture seeds the taunt threshold, advances all three dialogue lines, checks paused advancement is rejected, waits through escape via the real update path, seeds the finish threshold and verifies one 840-point record for two shards/one relic, replay focus and fresh chapter state. Positions and collectibles are fixture inputs; this is not a manual traversal or collectible playthrough. Native full-stage jump feel and progression still remain open.

## Trail objective and collectible completion

An accessible trail meter now starts at zero, fills toward the existing gate threshold, and completes on chapter victory. Objective text distinguishes the required story/gate path from optional score collectibles. Replay clears the meter. Collection is guarded outside active play.

A controller fixture collects all twelve shards, two relics and one frog through the actual collection function, attempts each twice, seeds the previously tested story gate and verifies one 3,640-point record plus fresh replay. Item proximity and story completion are fixture inputs, not a native full-collection traversal. Full stage feel remains open.

## Frame-rate-independent locomotion

Horizontal steering now integrates drag over elapsed time. Dash frames preserve the portion before and after the 0.24-second dash expires, and facing stays consistent during the active dash. Gravity uses time-based displacement as well. The existing 390 walk speed, 720 dash speed, 740 jump impulse and 1850 gravity are unchanged, but the corrected integration slightly changes the old discrete jump arc; manual feel needs review.

Controller tests match walking, jumping and dash-expiry trajectories over half a second at 30/60/120 Hz. Native launch, Space and Shift inputs were exercised on an isolated origin. This does not establish a complete native stage traversal.

## Moving-platform story handoff

Moving platforms now use an active-play clock rather than visual/story time. Their positions and riders therefore remain stable during dialogue and Fallen’s escape, then resume smoothly without applying a cutscene-sized displacement. Replay resets the new clock along with platform phases.

A controller fixture places Crown on a platform, spends ten seconds in dialogue, advances the full story, completes escape and resumes with a zero-time update. Platform/rider positions remain unchanged, followed by a normal 16ms carry step. This isolates the handoff; it is not a native stage traversal.
