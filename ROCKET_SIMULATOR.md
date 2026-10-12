# Rocket Simulator finishing work — October 12, 2026

Stored zero shards now remain zero on reload; only missing balances receive the existing 180 starter shards. Finite save normalization prevents negative balances and invalid distance/run/upgrade values from breaking the hangar. Unknown upgrade IDs are ignored. Audio creation failures no longer interrupt upgrade feedback; shared mute is honored.

Controller fixtures spend a 90-shard saved balance on the existing engine upgrade, reload at zero and verify an unaffordable fuel upgrade cannot proceed. The fixture disables audio through a throwing audio constructor and checks invalid save fields separately. These are seeded persistence tests, not an earned-flight playthrough.

Next gates: actual flight-to-salvage loop, sector transitions, storage write failures, replay, frame timing, desktop/phone controls and human progression pacing. This game is not yet a local finishing candidate.


## Completion and blocked storage

Flight completion now records once per active flight and clamps terminal telemetry. A failed local save labels salvage as unsaved and held only in this tab, while keeping results and relaunch available. Failed upgrade saves roll back their cost and level. Independent shared-record/companion save errors cannot interrupt completion. The natural starter-controller fixture crosses Emerald Belt, exhausts fuel, banks salvage once, buys fuel and relaunches. A quota fixture verifies upgrade rollback and usable unsaved flight results. This does not guarantee recovery after reload with unavailable storage; cross-tab Rocket writes remain unprotected.
