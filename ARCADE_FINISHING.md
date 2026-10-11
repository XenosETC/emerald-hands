# Arcade finishing order

Finish the collection from oldest to newest, one complete game loop at a time. This order uses the first tracked build in this repository. Games imported in the same commit are a cohort: their internal order is a working queue, not a claim about their original creation dates.

| Order | Game | First tracked build | Status |
| --- | --- | --- | --- |
| 1 | Emerald Hands | June 29, 2026 · `39925b3` (originally `index.html`) | [Finishing candidate](EMERALD_HANDS.md) |
| 2 | Shard Rush | June 29, 2026 · `1826d75` | [Finishing candidate](SHARD_RUSH.md); Classic/Daily, guide and retry advice |
| 3 | Emerald Galactic Heroes | June 29, 2026 · `9b6401b` | [Finishing candidate](GALACTIC_HEROES.md); flight/results, combat and input repairs |
| 4 | Pepe Relic Rumble | July 10, 2026 · `3853947` | [Finishing candidate](RELIC_RUMBLE.md); fair draws, tournament/replay and input |
| 5 | PepeCoin Emerald Run | July 12, 2026 · `7afc074` | [Finishing candidate](PEPECOIN_RUN.md); jump controls, rank goals and max-speed spacing |
| 6 | Pepe: Space Unchained | July 12, 2026 · `ac9b3d1` | [In progress](SPACE_UNCHAINED.md); boss combat fixtures, bankable flights and consistent steering |
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

## Next: Pepe: Space Unchained

Review Space Unchained's launch, flight controls, objectives, loss/replay and saved records. Emerald Run has phone-sized loop checks and five-minute spacing/progression fixtures. Human balance, physical-device comfort and hosted-release checks remain open for the first five finishing candidates.
