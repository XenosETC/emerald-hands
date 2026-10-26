# Expanded targeting - 2026-10-25

Assumption: players benefit from additional aim priorities without changing tower stats or enemy pacing. The Tower panel's existing target button now cycles First, Strong, Last, Close. Its hint explains the current rule and names the next choice; it is a regular action button with an accessible description, not a misleading two-state toggle.

- First: living enemy furthest along the road in range (unchanged default).
- Strong: highest maximum health in range, then road progress (unchanged).
- Last: living enemy least advanced along the road in range. Useful for entrance coverage; can let advanced enemies pass.
- Close: living enemy nearest this tower, then road progress. Useful for local coverage; does not prioritize threats to the relic.

Exact remaining ties keep enemy array order for deterministic selection. All modes ignore dead and out-of-range enemies. Changing modes is free during build or combat and never resets an attack cooldown. Pause and moving guards remain in force. Thornkeeper retains road traps and cannot switch targeting. Nova retains its area-of-effect behavior.

Modes persist through upgrades, moving and local build checkpoints. Earlier First/Strong saves remain compatible; unknown modes are rejected. During-wave refresh still rolls back to the saved build phase, including its targeting choices. New towers default to First. No new assets, stats, rewards, wave formations or automatic choices are introduced.

## Validation

Focused regressions cover Last/Close priorities, stable ties, dead/range exclusions, no-target behavior, four-way cycling and hints, cooldown preservation, pause/move guards, moving/upgrading/resuming, and invalid save modes. Existing earned-fund campaign and equivalent-speed checks continue to run against the production simulation. Browser checks use a fresh local origin and real 180-shard start; no seeded funds or altered enemy flow.

Clean staged release: 398 arcade tests plus 17 launch tests passed (415 total), plus smoke coverage for 18 games. Mixed earned-fund campaigns retain 89 relic HP at 1x and 2x; the earlier-new-defender order retains 72 HP, all defeating three major bosses. These existing policies use First/Strong and verify preserved baseline behavior; they do not claim optimal Last/Close strategy. Browser checks confirmed all four labels and explanations, Close surviving refresh/resume, and live-wave switching. At 390x844 and 320x568, the target button remained 44px high with no horizontal overflow; phone inspector content scrolls as before. Browser warnings/errors were empty. Physical-device performance and player strategy feedback remain open.
