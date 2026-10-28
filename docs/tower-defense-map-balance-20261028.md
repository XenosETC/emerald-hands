# Six-map boss balance - 2026-10-28

Goal: a prepared mixed defense should be able to defeat all three major bosses on every map, with readable guard pressure and meaningful counterplay. Equal difficulty and victory for every build are not goals. These are deterministic controller results, not human balance approval.

## Changes

Sunscar Quarry major bosses on waves 20, 35 and 50 gain 25% health to account for its long, overlapping switchbacks. Ordinary enemies, minor bosses, escort stats/counts, fixed arrival gaps, armor, speed, slow resistance, breach damage and rewards are unchanged. Other maps and legacy Classic retain their existing health profiles. Scouting, actual spawning and encounter advice share the profile; the bonus is disclosed before the wave.

Each map now has a collapsible Battleground plan in Build. Advice covers road coverage, the correct relic, Grove boss lanes and Harbor's eight-pad role tradeoff. Major-boss advice distinguishes Strong Ballista/Alchemist support from First rapid-fire guard coverage. No targeting changes occur automatically in the shipped game.

## Evidence

48 full campaign comparisons ran at 30 Hz against the actual game, using 180 starting shards and earned funds. The controller purchases only at build breaks, recruits a mixed roster with two heroes, follows fixed map-specific pad orders, upgrades primary paths before crosspaths, and casts Nova automatically when available and in range. It neither moves nor sells towers and never injects funds or changes combat stats. Automatic ability timing and deterministic placement remain idealizations.

Putting all heroes on Strong reduced guard coverage and lost multiple campaigns; it was not treated as evidence to nerf those maps. Keeping heroes on First while Ballista and Alchemist use Strong lets Harbor defeat its final boss instead of merely absorbing its breach. Its enemy health is unchanged.

| Map | Prepared support targeting + Nova | Major bosses defeated | First targeting without Nova |
| --- | ---: | ---: | --- |
| Classic | 77 HP, clear | 3 / 3 | 65 HP, clear |
| Floodgate Delta | 43 HP, clear | 3 / 3 | Defeat on wave 48 |
| Sunscar Quarry | 100 HP, clear | 3 / 3 | 100 HP, clear |
| Twinroot Grove | 66 HP, clear | 3 / 3 | 29 HP, clear |
| Tideglass Harbor | 48 HP, clear | 3 / 3 | Defeat on wave 48 |
| Emerald Celestial Hall | 71 HP, clear | 3 / 3 | 71 HP, clear |

Quarry remains the forgiving long-road map. With the same prepared strategy, its Sovereign kill time rises from 23.6s to 29.6s after entry (42,947 to 53,684 starting HP). Other successful prepared boss fights range from 10.9s to 50s. A perfect-health controller clear is not proof that human players find Quarry trivial. Harbor's final boss dies late in its route, so reserve finish-line coverage and keep guards under control.

The compact JSON report records before/after prepared runs and the final three-policy matrix. Raw per-wave outputs and logs remain under releases/tower-balance-20261028* locally.

## Reproduce and test

Normal npm test now requires earned-fund, build-break-only campaigns to clear all six maps and defeat all three majors. Focused tests verify Quarry-only major scaling, unchanged guards/rewards/cadence, shared scouting/spawning HP, and map advice through selection/resume. Set TOWER_BALANCE_AUDIT=1 and run the Balance audit tests for optional policy comparisons. TOWER_BALANCE_POLICIES accepts a JSON array of strong/nova choices; strong="support" assigns only Ballista and Alchemist, true also assigns heroes, and false retains First. TOWER_BALANCE_LABEL separates output folders.

Browser checks exercised normal 180-shard purchase and wave start on all six maps, including Harbor's eight pads, and verified all six distinct plans. Responsive checks and any seeded encounter fixtures are layout/runtime evidence, not earned campaign or physical-phone performance proof. Full human playtests on the target phones remain the next gate.

Files: pepe-tower-maps.js, pepe-tower-defense.js, pepe-tower-defense.html, pepe-tower-command.css, scripts/tower-balance-sim.cjs, scripts/tower-visual-art.test.cjs, and this report/JSON.

Final browser checks: Harbor's plan was readable at 390x844. Native controls changed targeting, moved a 75-shard Blaster to pad 8, then sold for 52, leaving 157 shards as expected. An explicitly seeded Quarry wave-50 entrance fixture showed the actual 53,684-HP Sovereign, six guards, and the disclosed 25% bonus. Both Nova controls and boss health remained visible at 390x844 and 844x390, with 136px and 102px of scrollable intelligence space and no horizontal overflow. No warning/error console messages were captured in that fixture. Its skipped prelude and seeded defense establish presentation only.
