# Rocket Simulator finishing work — October 12, 2026

Stored zero shards now remain zero on reload; only missing balances receive the existing 180 starter shards. Finite save normalization prevents negative balances and invalid distance/run/upgrade values from breaking the hangar. Unknown upgrade IDs are ignored. Audio creation failures no longer interrupt upgrade feedback; shared mute is honored.

Controller fixtures spend a 90-shard saved balance on the existing engine upgrade, reload at zero and verify an unaffordable fuel upgrade cannot proceed. The fixture disables audio through a throwing audio constructor and checks invalid save fields separately. These are seeded persistence tests, not an earned-flight playthrough.

Next gates: actual flight-to-salvage loop, sector transitions, storage write failures, replay, frame timing, desktop/phone controls and human progression pacing. This game is not yet a local finishing candidate.


## Completion and blocked storage

Flight completion now records once per active flight and clamps terminal telemetry. A failed local save labels salvage as unsaved and held only in this tab, while keeping results and relaunch available. Failed upgrade saves roll back their cost and level. Independent shared-record/companion save errors cannot interrupt completion. The natural starter-controller fixture crosses Emerald Belt, exhausts fuel, banks salvage once, buys fuel and relaunches. A quota fixture verifies upgrade rollback and usable unsaved flight results. This does not guarantee recovery after reload with unavailable storage; cross-tab Rocket writes remain unprotected.


## Next-sector objectives

The hangar now displays the next named sector, remaining distance and an accessible within-sector progress bar. Crossing a threshold advances the objective; Beyond Canon marks all nine sectors discovered. These are existing distance thresholds, not new rewards or gameplay requirements. Boundary fixtures cover Emerald Belt, the next target and the final sector.


## Consistent frame timing

Rocket now advances in fixed 1/120-second simulation steps, carrying fractional time between frames. Equal ten-second flight fixtures match distance, fuel, heat, hull and elapsed time at 30/60/120 FPS. Frames catch up at most 100 ms, so long stalls cannot instantly finish a flight. The shared arcade RAF clock continues excluding paused time. This is active-play simulation, not offline expedition progression; heavily throttled background tabs can still advance slowly. Fixed stepping can slightly change outcomes from the former frame-rate-dependent integration, so human pacing remains open.


## Upgrade control clarity

Upgrade buttons expose the named system, target level and exact salvage cost in their accessible names. Native 390px viewport inspection found a 375px page width without horizontal overflow and 44px upgrade tap targets. This viewport check is not physical-device comfort testing.

Native launch followed by shared Pause retained 0 km and the 800-km goal through an independent test-suite run; Resume was activated afterward. Full native expedition completion is still open.


## Actionable flight debrief

Successful salvage results explain the system that ended the flight: fuel recommends Fuel Lattice, heat recommends Void Cooling and structural failure recommends Obsidian Frame. The debrief uses the existing next-level price and current affordability; the matching hangar card is highlighted until relaunch. Recommendations guide review, not guarantee the best build or a particular distance. Costs, upgrades and rewards are unchanged. Fixtures verify all failure mappings and next-level pricing.


Native clean-URL starter expedition completed at 8.07K km with fuel exhaustion in Ancient Satellite Field, awarding 395 salvage for a 575 balance. Buying Fuel Lattice level 2 for 75 left 500; reload retained level 2 and the 114-shard next price. Relaunch displayed active telemetry. This native run began before the debrief copy changed and verifies the existing flight/reward/upgrade loop; debrief mappings are verified separately by controller tests. [Starter result screenshot](docs/rocket-finishing-2026-10-12/starter-completion.png). No user-origin saves were changed.


## Desktop hangar layout

At widths above 980px, the mission report and pet assist flow below the 16:9 canvas rather than occupying an extended overlay stage. A wider two-column hangar groups the six upgrades into three rows, each with a full-width 44px purchase control. Existing phone stacking remains. Native 1360px review measured a 1345px page without overflow, a 509px canvas and 732px stage including report and assist. [Desktop proof](docs/rocket-layout-2026-10-12/desktop.png). Gameplay and save behavior are unchanged.


## Build telemetry and late sectors

The hangar now explains the current build’s fuel duration, top speed and velocity where frame stress begins. Flight physics and the readout use the same system calculation; these are limits, not a promised expedition result.

A supplied-upgrade fixture (engine 1, fuel 30, frame 14, cooling 10, guidance 24, magnet 1) runs natural flight physics through Beyond Canon and ends by fuel exhaustion, without injected distance or rewards. This verifies late-sector traversal, not earned affordability. A separate exploratory 150-flight cheapest-upgrade policy using only starter and earned salvage reached about 71K km; it did not reach the final sector. Progression pacing and a practical earned route remain open, and costs/rewards are unchanged.
