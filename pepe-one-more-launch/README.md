# Crown Pepe: One More Launch — integrated ascension makeover

Play at http://127.0.0.1:4173/pepe-one-more-launch/index.html while the arcade dev server runs. Space starts the countdown, then hold Space or the boost button for thrust; release to cool. A/D, arrows or the touch steering buttons bank the ship. Escape / pause holds the flight. The hangar opens on the launchpad. Existing saves stay in `pepe-one-more-launch-v1`.

## Integrated loop

The fullscreen scene contains telemetry, an altitude route, fuel/heat instruments, controls and an upgrade hangar. Crown Pepe and his leather harness, saddle, handles, footholds and emerald rocket are one generated pixel drawing per pose. Separate flames use the rig's transformed nozzle anchors. Calm/panic expressions change with boost and heat; the same ship sprite supplies wreck fragments. Launch clamps retract, reeds and water react to ignition, debris slows during the blast, the crown survives, Pepe returns under a lily-leaf parachute, and the rig rebuilds before upgrades reopen. Sound is opt-in and follows engine power. Gentle effects remove shake and the brief flash. Switching away during a flight pauses it.

## Scalable realms

`realms.mjs` is the bottom-to-top registry: contiguous altitude intervals, ordered panel arrays, per-realm stages, fallback art, and an endless final entry. Add panels to a realm to increase its traversable scenery, or insert a new realm before the endless tail; the renderer and flight loop do not need rewriting.

| Realm | Altitude | Internal stages |
| --- | --- | --- |
| Lily Marsh | 0–500 m | pond, willow canopy, treetops |
| Thunder Garden | 500–2,000 m | floating gardens, storm front, upper atmosphere |
| Emerald Space | 2,000–5,000 m | rings, asteroid belt, violet nebula |
| Beyond | 5,000–20,000 m | broken clockwork, ascendant temples, celestial gate |
| Opal Deep | 20,000–60,000 m | citadels, stellar filaments, deep night |
| Everafter | 60,000 m onward | numbered 40,000 m sectors |

Five purpose-generated 724×2172 portrait panels replace the single-screen backdrop approach. The camera traverses each panel from its bottom to its top; neighboring panels meet through feathered atmosphere. Image aspect ratios stay intact. The renderer retains only viewport-sized compositing buffers instead of allocating a canvas as tall as the entire climb. The Everafter uses a reusable mirrored deep-space template, moving foreground crystals and stars; new authored variants can be added to its panel array.

Ship upgrades now support 60 levels. Levels 0–20 keep their previous prices. Later prices grow by 1.18 per level, instead of continuing the original 1.55 curve. This is a prototype late-game balance assumption, not a human-tested economy. Existing upgrades, cash and best altitude remain valid. Headless verification confirms a top-tier flight reaches beyond 200,000 m; this does not prove the time needed to earn those upgrades is balanced.

## Files

- `main.mjs`: input, HUD, shop, phase orchestration and persistence.
- `presentation.mjs`: flight director, rig transforms and continuous camera coordinate.
- `realms.mjs`: expandable altitude and panel registry.
- `worlds.mjs`: viewport panel composition, parallax and world effects.
- `actor.mjs`: integrated rig sprites, nozzle anchors, fragments and recovery pilot.
- `effects.mjs`, `audio.mjs`: visual bursts and optional responsive engine sound.
- `sim.mjs`: authoritative flight and economy, with higher upgrade tiers.
- `assets/crown-rig-integrated-v3.png`: one-piece ship/rider atlas.
- `assets/*-ascent-v4.png`: five connected tall world panels.
- `assets/prompts-v2.json`, `prompts-v3.json`, `prompts-v4.json`: exact built-in imagegen prompts and references. Earlier reference and asset versions remain intact.
- `art-review.html`: inspect altitude, seams and high sectors without saves or rewards. This is visual inspection, not a flight result.

## Verification

Run `node --test pepe-one-more-launch/sim.test.mjs pepe-one-more-launch/worlds.test.mjs pepe-one-more-launch/presentation.test.mjs pepe-one-more-launch/realms.test.mjs pepe-one-more-launch/runtime.test.mjs` (17 focused tests), then root `npm test`. Tests cover one-time rewards, frame rates, save validation, real flight reachability, recovery events, attachment transforms, continuous realm joins, very high camera coordinates, and insertion of multi-panel realms. Browser checks cover the visible composition and actual flight/recovery loop separately from these tests. At 390×844 the page and viewport were both 390 px wide and all touch controls fit; the temporary viewport was restored. The runtime orchestration test also checks enabled boost/steering after countdown, pause/resume, return/rebuild, and save isolation. The arcade-wide suite passed 358 tests in the latest recorded run (arcade-check.log).

Remaining limits: calm/panic are discrete integrated sprite poses rather than a full frame-by-frame animation set. Tall panels have procedural animated overlays rather than fully separated painted depth layers. Endless sectors reuse authored art. Registered in the arcade catalog with dedicated generated key art, favorites/search/touch discovery and a navigation-only recent-play hook. This game has its own economy and does not award shared Arcade Shards.


## Arcade release

The hub card uses "assets/card-key-art-v1.png"; its built-in imagegen prompt and sprite reference are preserved in "assets/card-prompt-v1.json". Root "npm test" now runs the game-specific tests after the existing arcade suite. Local preview screenshots and logs are excluded from Git. All released game pages share the updated library cache version so visits preserve the new catalog entry.
