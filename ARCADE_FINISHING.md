# Arcade finishing order

Finish the collection from oldest to newest, one complete game loop at a time. This order uses the first tracked build in this repository. Games imported in the same commit are a cohort: their internal order is a working queue, not a claim about their original creation dates.

| Order | Game | First tracked build | Status |
| --- | --- | --- | --- |
| 1 | Emerald Hands | June 29, 2026 · `39925b3` (originally `index.html`) | [Finishing candidate](EMERALD_HANDS.md) |
| 2 | Shard Rush | June 29, 2026 · `1826d75` | [Finishing candidate](SHARD_RUSH.md); Classic/Daily, guide and retry advice |
| 3 | Emerald Galactic Heroes | June 29, 2026 · `9b6401b` | [Finishing candidate](GALACTIC_HEROES.md); flight/results, combat and input repairs |
| 4 | Pepe Relic Rumble | July 10, 2026 · `3853947` | [Finishing candidate](RELIC_RUMBLE.md); fair draws, tournament/replay and input |
| 5 | PepeCoin Emerald Run | July 12, 2026 · `7afc074` | [Finishing candidate](PEPECOIN_RUN.md); jump controls, rank goals and max-speed spacing |
| 6 | Pepe: Space Unchained | July 12, 2026 · `ac9b3d1` | [Finishing candidate](SPACE_UNCHAINED.md); combat/progression fixtures, banking and burst/repair choices |
| 7 | Pepe Tower Defense | July 14, 2026 · `0e9cec9` | [Finishing candidate](TOWER_DEFENSE.md); fitted artwork, accessible pads and real-combat campaign fixtures |
| 8 | Pepe Wars | July 14, 2026 · `0e9cec9` | [Finishing candidate](PEPE_WARS.md); generated citadels, mining, stance and full-combat siege fixtures |
| 9 | Pepe's Paradox | July 14, 2026 · `0e9cec9` | [Finishing candidate](PARADOX.md); real-physics traversal fixture, story handoff and safe recovery |
| 10 | ETC Pets | July 18, 2026 · `68c2492` | [Finishing candidate](ETC_PETS.md); care receipts, purchase recovery and cooperating sanctuary locks |
| 11 | ETC Rocket Simulator | July 18, 2026 · `68c2492` | [Finishing candidate](ROCKET_SIMULATOR.md); earned-route fixture, sector completion and save restore |
| 12 | ETC: Unstable Launch | July 18, 2026 · `68c2492` | [Finishing candidate](UNSTABLE_LAUNCH.md); original flight art, exact crashes, milestones and record protection |
| 13 | Satoshi System | October 5, 2026 · `7e1f161` | [Finishing candidate](SATOSHI_SYSTEM.md); native earned completion, isolated ledger and checkpoint restore |
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

## Next: Pepe Soul World

Satoshi System local finishing review is closed. The first thirteen games have documented local finishing candidates. Next, review Pepe Soul World’s browser progression, combat, academy/realm objectives and save/replay boundaries. Automated runs do not replace manual feel, physical-device or hosted-release review.
