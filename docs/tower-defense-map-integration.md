# Six-map integration - 2026-10-25

The current Tower Defense now supports Classic, Floodgate Delta, Sunscar Quarry, Twinroot Grove, Tideglass Harbor and Emerald Celestial Hall in one engine. All are selectable immediately from the Battleground menu. Maps returns to selection and preserves the latest build break; leaving during combat rolls that attempt back to its saved build break, like refreshing. The menu discloses this on the Maps button. The selected map is remembered across refresh.

## Geometry and artwork

`pepe-tower-maps.js` is the shared UMD catalog used by browser and tests. It authors world-space routes, build positions, relic location, layout version, background and health profile. Pixel coordinates were authored against each selected PNG, normalized to the existing 1280x720 world, then visually checked using the in-game Show route guide. Input still uses the established letterbox transform. The module also supplies route assignment, remaining-distance comparison and checkpoint keys.

New Classic uses the complete courtyard v3 painting and nine aligned pads. Old Classic saves retain their original nine positions, road and v2 terrain plate, clearly labeled Legacy build. Returning to Maps and selecting Classic starts the new painted layout. Delta, Quarry, Grove and Hall have nine pads; Harbor has its eight visible pads, with an eight-button desktop/four-by-two phone control grid rather than a fake ninth location.

For baked artwork, the engine does not paint another neon road or full relic over the image. Optional route guides are separate thin overlays. Live pad highlights/numbers, towers, enemies, thorns, attacks, relic HP, hit/low-health feedback and destruction dimming remain dynamic. Relic health labels are clamped inside the world bounds. The original procedural terrain/live road/relic renderers remain loading/error fallbacks and support the legacy layout. Only the selected background is requested; map selection does not preload all six full-size plates.

## Grove routing

Ordinary arrivals alternate upper/lower routes in authored queue order. Major boss groups stay together: wave 20 upper, 35 lower, 50 upper. The pre-wave intelligence states the selected group lane; minor bosses follow normal queue alternation. Enemies carry route IDs and move through their own route to the same live relic. First/Last compare remaining road distance across routes instead of comparing unrelated segment indices; Strong and Close retain their priorities and progress tie-breaks. Legacy runs retain their established targeting ordering.

Thornkeeper searches both routes for the nearest usable road segment. Traps hit actual swept movement, with the existing one-hit-per-enemy/patch rule. Splash, acid, bolts, hero facing and Nova remain spatial systems; no copied combat engine or separate lane damage rules were introduced. Boss guard counts and complete-wave clear requirements remain shared.

## Saves and results

Modern checkpoints use version 2 with mapId/layoutVersion, map-specific keys and pad-bound validation. They retain tower upgrades, target modes, invested values derived from specs, combat records, Nova cooldowns and recap. Unknown maps, mismatched layouts and nonexistent pads cannot restore through the selected map's decoder. A null tombstone records finished defenses so the old Classic checkpoint cannot reappear after a new-layout run ends. Original v1 checkpoints remain in their original namespace and resume only on the original Classic geometry; no tower is silently shifted onto a new painted pad.

Map records independently store best score/wave and best cleared relic HP. Classic retains access to the historical best score. Tower mastery and the existing capped arcade reward reporting remain shared; this change adds no reward multiplier or new currency. Interrupted map switching does not submit an extra result. No checkpoint or score data is trusted as derived tower damage/range/refund stats.

## Initial balance

Existing 50-wave formations, arrivals, rewards, costs, upgrade rules, 100 relic HP and 180 initial run shards are retained. Starting enemy health uses a map profile: 100% on Classic/Delta/Quarry/Hall, 75% on Grove and 85% on Harbor. These two reductions followed failed baseline controller runs (Grove stopped at 33, Harbor at 43), and a targeting-only comparison also failed. The rationale is reduced concentrated coverage across split fronts and Harbor's eighth-pad limit. Scouting and spawn calculations share the same scaled starting stats; previews show the actual health multiplier.

Earned-fund 30Hz controller evidence with a mixed roster, primary upgrades then secondary paths, and both Novas:

| Map | Final relic HP | Major boss kills | Result |
| --- | ---: | ---: | --- |
| New Classic | 89 | 3 | 50 waves cleared |
| Delta | 53 | 3 | 50 waves cleared |
| Quarry | 100 | 3 | 50 waves cleared |
| Grove | 67 | 3 | 50 waves cleared |
| Harbor | 38 | 2 | 50 waves cleared |
| Celestial Hall | 71 | 3 | 50 waves cleared |

These prove a viable tested strategy, not optimality, equal difficulty, human balance approval or a guaranteed boss kill for every build. Harbor's policy survives with a major boss breach; its eight-pad tradeoff remains meaningful. Quarry's full-health controller clear is not evidence that human players find it trivial. Human feedback and physical-device performance remain open.

## Verification

Established combat fixtures explicitly run on the preserved legacy layout, keeping their historical campaign outcomes comparable. Additional production-map tests cover all six board definitions, build/move/upgrade/sell/clear/resume, independent state, records, remembered selection, legacy geometry/tombstones, invalid saves, eight-pad bounds, both Grove roads, group lanes, multi-route First/Last/thorns, no duplicate relic, optional route overlays, and equivalent 1x/2x combat including pause guards. Separate controller tests exercise full earned-fund campaigns on every new layout.

Browser checks used an isolated QA origin with real starting funds. Route overlays were visually checked against all six paintings; the mobile check built on Hall pad 9, moved to pad 8, refreshed and resumed it. Checks covered 390x844, 320x568 and 844x390; mobile map selection and pad controls remained reachable without horizontal overflow. Screenshots/logs are retained in releases/tower-map-integration-20261025. Browser/device emulation is not physical-phone performance proof.

Final clean staged validation passed 419 arcade tests plus 17 launch tests (436 total), with the 18-game smoke check. All six earned-fund campaigns cleared wave 50 with the HP/boss outcomes above. The older frame-clock fixture now loads the shared map/checkpoint modules explicitly and preserves legacy coordinates for its historical clock/combat cases. Arcade card copy now advertises six battlegrounds and 50 waves; the hub card exposes the correct game link and six-map description. Remembered-map resume was verified directly in the game. The isolated browser tab reported no warning/error console messages.
