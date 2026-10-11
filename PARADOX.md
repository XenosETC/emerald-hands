# Pepe’s Paradox finishing development — October 11, 2026

In progress. This build is the Bamboo Mountains chapter only; the temple-opening text is a story lead, not a playable next chapter. Keyboard remains required. Existing collectibles, reward values and shared record isolation are unchanged.

- Replay restores displaced wisps, moving-platform phases, rival position/visibility, facing, particles and input. Active play/dialogue cannot be replaced by a duplicate launch.
- Optional audio failures no longer interrupt startup, jumps or story progression.
- Pause/blur/hidden-page input clears movement and dash. Paused actions, held/repeated jumps/dashes and focused controls cannot issue gameplay commands.
- Dialogue clears movement, focuses Continue, and hands focus back to the canvas after its final line. Completion requires the existing taunt sequence and focuses replay.
- Replay resets the frame baseline; negative frame deltas cannot rewind simulation.

Verification: root smoke and 192 behavior tests pass in the workspace and clean staged copy. Three controller fixtures check audio-failure launch/active launch guard, replay world/input reset and paused jump/dash guards. Private controller access is injected into in-memory test copies only. Native browser checks used an isolated origin to launch, jump, pause and resume; they do not establish a full stage playthrough.

Next: platform landing, fall recovery, dialogue/escape/completion and collectible progression. Manual jump feel, physical-device comfort and hosted behavior remain open.

## Stable fall recovery

Falls now return Crown to the last landed solid platform, with the full character width clamped inside its bounds. Moving platforms do not become recovery points. Recovery clears movement/dash, preserves collected items, and reports the fall count. Replay resets the recovery point and count. This deliberately replaces the old 360-unit rewind, which could place Crown above another gap.

Landing selects the highest surface crossed by the falling character rather than depending on platform array order. Controller fixtures cover last-safe-ground recovery and retained collectibles, and a fast fall crossing multiple surfaces. These are physics fixtures, not a native full-stage playthrough; manual jump feel remains open.
