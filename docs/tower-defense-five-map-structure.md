# Pepe Tower Defense: five-map structure

Scope update: the user subsequently requested Emerald Celestial Hall as Map 05, bringing the roster to six including Classic. The modular map/save/routing structure below still applies. Celestial uses a single route and can join the single-route integration pass; it is a generated asset rather than a playable map today. Classic also has a new fully painted road/foundation/relic candidate, documented in assets/pepe-tower-defense/CELESTIAL_AND_CLASSIC_ART.md; it requires geometry and renderer alignment before activation.

Status: implementation direction and assumptions, not a claim of completed multi-map support. User selected Classic plus Delta, Quarry, Grove and Harbor. Current executable changes only refresh Classic's background. The four new map illustrations are selected art references awaiting geometry, integration and validation.

## Player structure

Recommend one map-select screen with five freely selectable battlegrounds during MVP testing. Each map starts an independent 50-wave defense, with its own saved build break and results. Players do not have to complete 250 waves in sequence to try the environments. Preserve the existing 100 relic HP, 180 starting run shards, nine tower types, two Sunwardens, 5/2/0 upgrade rules, and bosses at 20/35/50 as the baseline. These are five ways to play the defense, not five stat-inflated copies or separate games.

Cards should show environment art, route count, build-pad count, best wave, clear status and Resume when that map has a valid checkpoint. Preview the actual road and pad layout before Start. Switching maps happens from the pre-run/results screen; leave an active defense through the existing saved build break rather than replacing it during combat.

Track map-local best wave, best score and cleared-run relic HP. Tower mastery remains shared across this game. Build currency, towers, Nova cooldowns, recaps and wave state belong to their run. Preserve current Arcade Shards caps/rules; adding map cards must not multiply rewards or introduce a new currency. Future unlocks/medals can be considered after playtesting rather than gating the MVP.

## Five identities

| Identity | Label | Layout | Initial pad count | Intended tactical emphasis |
| --- | --- | --- | --- | --- |
| courtyard | Classic: Emerald Courtyard | Original single route | 9 | Familiar mixed-defense baseline, refreshed art |
| floodgate-delta | Map 01: Floodgate Delta | Three islands, two causeways, one route | 9 | Early control, central damage, final interception |
| sunscar-quarry | Map 02: Sunscar Quarry | Three-pass switchbacks | 9 | Shared coverage between parallel passes; line-shot opportunities |
| twinroot-grove | Map 03: Twinroot Grove | One entrance splits into two routes, then rejoins | 9 | Divide resources across fronts and retain a shared final defense |
| tideglass-harbor | Map 04: Tideglass Harbor | U-shaped quay, lower-left relic | 8 | Corner coverage and committed early/final positions |

These emphases are design intentions. None of the new layouts has measured exposure or proven balance yet. Harbor has eight visible pads; do not render a ninth over water. Sunken Sanctum and earlier Forge/Terrace illustrations remain outside the five-map release scope.

## Lean implementation boundaries

Keep one shared engine. Extract a map catalog containing stable ID, layout version, title, background, route point arrays, pad IDs/coordinates, entry points, relic position, road-rendering mode and wave-profile ID. Keep the existing 1280x720 world space and shared screen-to-world input conversion. Explicit routes/pads are authoritative; generated pixels do not define collision, pathing or build eligibility.

Separate three concerns rather than rewriting the whole game:

1. Map catalog/geometry: authored data plus cumulative route lengths and helpers for distance remaining, nearest road and bounds validation.
2. Run/checkpoint state: selected map/layout version, towers by stable pad ID, per-map checkpoint and result keys, shared mastery unchanged.
3. Existing combat/render/UI: consume the selected map's geometry and art. Reuse current tower, enemy, upgrade, recap, scouting, speed and ability systems.

Current hard-coded touchpoints are `path`, `pads`, `relicBase`, the courtyard image, portal hit-testing, movement, targeting progress, nearest-road thorn placement, pad buttons and checkpoint bounds. All must consume a consistent selected-map definition. Do not bolt on a second movement loop for Grove or duplicate the game's full source per map.

## Grove routing proposal

Proposed deterministic MVP rule: ordinary enemies alternate upper/lower routes in authored spawn order. Each major boss and its fixed escort group stays on the same route; alternate the chosen boss route across major encounters. Expose this in the pre-wave preview. This is a recommendation to implement/test, not an existing mechanic or a hidden random choice.

Store a route ID and distance traveled/segment state per enemy. First should prefer least remaining route distance to the shared relic; Last should prefer greatest remaining distance. Strong/Close retain their priorities and use threat progress for ties. Comparing segment indices between two differently shaped routes is invalid. Acid, splash, bolts and Nova remain spatial effects and can hit enemies on either lane when in range. Thorn placement must examine both routes and communicate the chosen patch location; a trap still damages actual crossing enemies without a new lane-specific damage rule.

## Persistence and migration

Give each map its own versioned checkpoint key. Decode against that map's known pads/layout version; reject a save from another map. Carry forward tower tiers, targeting, combat records, Nova cooldowns and recaps as today. Read legacy single-map checkpoints as Classic only, preserving a source copy until migration is verified. Use an explicit migration marker/tombstone so finishing or clearing a migrated run cannot resurrect the old checkpoint. Invalid saves must not erase other maps' progress.

Map changes must reset transient enemies, shots, traps, selection and movement mode. A build-phase checkpoint should never restore towers to positions from another board. Best records need map IDs; arcade aggregate reporting can remain a shared game result under existing reward caps.

## Art pipeline

The new maps are concept boards with roads, pads and relics baked in. Author paths against those pixels, then produce clean terrain plates or targeted edits to remove duplicate pads/relics where the live renderer will draw them. Use one intentional road-rendering mode per map so the existing neon route is not blindly painted over the new stone road. Preserve a readable road silhouette. The live relic owns damage, HP and destruction feedback.

Map backgrounds should load on demand, with lightweight previews on cards, not five full-resolution PNGs plus all sprites at initial load. Preserve originals and generate browser-sized final assets after review. Check each large tier-five tower, both hero facings, green lasers, violet foes and health bars on every biome. The current courtyard v2 is already a clean terrain plate: no baked road or pads.

## Build and release order

1. Classic art refresh and five-map roster/design lock. No geometry or save changes. This is the current slice.
2. Map catalog, per-map save foundation and real Delta vertical slice: selection, build/move/sell/upgrade, all 50 waves, pause/speed, checkpoint resume, bosses and mobile controls. Preserve Classic regression outcomes.
3. Quarry and Harbor on the same single-route pipeline. Resolve Harbor pad clearance and tune routes/wave profiles using measured exposure rather than guessing HP multipliers.
4. Grove's explicit multi-route support and previews, including targeting/thorns/escort coherence.
5. Whole-roster balance and visual pass; publish all five as supported maps only when each passes its gates. Unfinished cards should not launch a broken map.

## Validation gates

- Geometry: every route reaches the live relic; no unintended shortcut/fork; pads on solid usable land; sufficient road/tower clearance; portal and pointer hit-tests work.
- Saves: legacy Classic resume, independent map checkpoints, layout mismatch rejection, no cross-map tower restore or old-save resurrection.
- Combat: deterministic arrivals, Grove branch allocation, boss/guard grouping, First/Last progress, thorn coverage, 1x/2x equivalence and no duplicate rewards.
- Balance: earned-fund full-campaign strategies per map, recorded boss kills/leaks and in-range time. Do not call identical enemy HP equivalent difficulty when path length and coverage differ.
- Browser: full entry/build/wave/result flow, visible art/geometry alignment, all forms, phone portrait/landscape controls, no horizontal overflow or duplicate baked/live relic.

Controller passes, generated art and desktop phone-size previews are separate evidence types; none alone proves human balance or physical-phone performance.
