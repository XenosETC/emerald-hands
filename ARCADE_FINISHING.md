# Arcade finishing order

Finish the collection from oldest to newest, one complete game loop at a time. This order uses the first tracked build in this repository. Games imported in the same commit are a cohort: their internal order is a working queue, not a claim about their original creation dates.

| Order | Game | First tracked build | Status |
| --- | --- | --- | --- |
| 1 | Emerald Hands | June 29, 2026 · `39925b3` (originally `index.html`) | [Finishing candidate](EMERALD_HANDS.md) |
| 2 | Shard Rush | June 29, 2026 · `1826d75` | Next full-game review; Daily Vault and ghosts already shipped |
| 3 | Emerald Galactic Heroes | June 29, 2026 · `9b6401b` | Queued |
| 4 | Pepe Relic Rumble | July 10, 2026 · `3853947` | Queued |
| 5 | PepeCoin Emerald Run | July 12, 2026 · `7afc074` | Queued |
| 6 | Pepe: Space Unchained | July 12, 2026 · `ac9b3d1` | Queued |
| 7 | Pepe Tower Defense | July 14, 2026 · `0e9cec9` | Same-commit cohort |
| 8 | Pepe Wars | July 14, 2026 · `0e9cec9` | Same-commit cohort |
| 9 | Pepe's Paradox | July 14, 2026 · `0e9cec9` | Same-commit cohort |
| 10 | ETC Pets | July 18, 2026 · `68c2492` | Same-commit cohort |
| 11 | ETC Rocket Simulator | July 18, 2026 · `68c2492` | Same-commit cohort |
| 12 | ETC: Unstable Launch | July 18, 2026 · `68c2492` | Same-commit cohort |
| 13 | Satoshi System | October 5, 2026 · `7e1f161` | Imported build; earlier separate development |
| 14 | Pepe Soul World | October 5, 2026 · `7e1f161` | Same import cohort |
| 15 | Pepe Temple Run | October 5, 2026 · `7e1f161` | Same import cohort |
| 16 | Pepe Feudalism | October 5, 2026 · `7e1f161` | Same import cohort |

## Finish gate for each game

- Clear first action, readable objectives, and a complete progression or score loop.
- Reachable win/loss/completion outcome and reliable replay, restart, pause and resume.
- Save compatibility and understandable recovery, with isolated game economies.
- Controls, focus, audio failure handling, and desktop/phone layouts verified. Unsupported controls stated clearly.
- Automated checks of actual gameplay rules and browser checks of main transitions. Fixture-based late-game checks identified explicitly.
- Clean staged-copy release, scoped commit/push, and explicit remaining gates.

“Finishing candidate” means the implemented loop passed its documented local checks. Physical-device comfort, human pacing, hosted behavior and asset rights for commercial release remain separate gates before calling a game fully release-ready. Native Unreal/Godot projects are outside this browser-game queue.

## Next: Shard Rush

Review Classic and Daily as one finished game: teach movement and hazards, verify run → results → retry, inspect saved records and recovery, test keyboard/drag handoff and phone input, then close remaining gaps. Keep daily courses, medal thresholds and ghost recordings compatible.
