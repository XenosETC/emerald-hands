# Pepe's Paradox: the lantern road

## Implemented scope

The existing painted platformer now has two playable five-stage levels. Stages 1–4 are authored 5,400-unit trails, and every stage 5 is an interactive base with permanent journey equipment. This is eight travel stages and two bases, not ten platforming courses. The initial Moonlit Approach preserves the original course; the other seven trails have individually authored islands and elevation changes, moving platforms, realm stones, item placements and signal dialogue.

| Level | Stage 1 | Stage 2 | Stage 3 | Stage 4 | Stage 5 base |
| --- | --- | --- | --- | --- | --- |
| Jade Mountain | Moonlit Approach | Bellwind Crossing | Echo Monastery | Fallen's Gate | Frogspire Outpost |
| Corrupt Marsh | Violet Causeway | Sentinel Reeds | The Flooded Archive | Heart of the Blight | Lantern Refuge |

Corrupt Marsh adds generated painted scenery and transparent stone-frog sentinels. Sentinels patrol, telegraph a faster charge, cause contact knockback, and can be dispersed for five seconds with Dash. Wisps retain their different floating patrol and shorter dispersal. The fourth trail in each level has a telegraphed blight pulse between world positions 1,850 and 2,600; Echo realm and active dash protect against the pulse. Falling remains recovery rather than a collectible-erasing death.

The painted map has accurate HTML stage buttons, clear/ready/locked states and real sequential unlocking. Cinder Crown and Moonlit Citadel are explicitly planned, disabled destinations. Their stage-five bases are Ember Watch and Pepina's Sanctuary. Pepina's final rescue is a future chapter; this build ends at Lantern Refuge and says so.

## Journey economy and gear

Journey shards are an independent campaign currency. A completed trail credits its best recovered shard count; replaying credits only an improvement over that best. No shared Arcade Shards are spent by the camps. Existing score and per-run record reward inputs retain their original formulas. Camps do not grant extra shared-wallet rewards.

| Gear | Cost | First base | Actual effect |
| --- | --- | --- | --- |
| Winged Travel Boots | 8 | Frogspire | Dash cooldown 0.9s → 0.7s |
| Lotus Ward | 10 | Frogspire | Enemy/blight contact protection 1.1s → 1.6s |
| Frogstep Soles | 16 | Lantern Refuge | Jump launch speed 740 → 780 |
| Lantern Lens | 12 | Lantern Refuge | Collectible reach +18 world units |

These initial costs are explicit design assumptions, not a claim of balanced long-term progression. All gear is optional; the authored routes can be completed without purchasing equipment. Replay map selection restarts that selected stage; ordinary reload resumes its saved lantern and collected items.

## Persistence and layout

`emerald-pepe-paradox-campaign-v1` stores current stage, clears, per-stage best shard claims, owned gear, and the active trail's safe island/position, item indices and signal completion. Storage errors retain in-memory play and display a save warning. Malformed input falls back to a fresh journey. Existing independent arcade data is preserved. A legacy Paradox record with stage >=2 marks the old first course cleared and starts at 1-2, without minting journey money. Older completion records could not retain checkpoint details, so those cannot be migrated.

The campaign module is optional: if it is unavailable, the original single-course runtime remains functional. The game screen continues using the existing viewport shell. Native map/base dialogs pause local simulation, clear held controls, trap modal focus and have bounded internal scrolling; small screens pan the detailed route inside the map instead of widening or scrolling the document.

## Assets

Built-in image generation produced `corrupt-marsh-v1.webp`, `campaign-map-v1.webp`, `marsh-sentinel-v1.webp` and `journey-relics-v1.webp`. Exact prompts are in `assets/pepes-paradox/campaign-prompts.json`. Generated PNG originals remain in the Codex image output directory; selected assets are optimized WebPs in this repository. Enemy and item transparency is preserved. Map labels, statuses, stages and interactions are code-rendered rather than generated image text. The existing player and collectibles atlases remain in use.

## Verification and next extension

Run `node --test paradox-campaign.test.cjs` for layout/economy/migration checks. Run `npx playwright test scripts/browser/paradox-campaign.spec.cjs` with `ARCADE_BROWSER_TEST_PORT=4252` and `PLAYWRIGHT_BROWSERS_PATH=0` for real browser map, camp, reload, recovery and progression checks. Browser coverage includes full native-control runs of 1-3 and 2-4; the other six waygates are checked from legitimate final-lantern save fixtures. This does not establish campaign balance or physical-device performance.

Extend the data module with a fully authored Cinder Crown next: build a new hazard vocabulary, four actual routes and an Ember Watch base before enabling its map nodes. Keep Pepina's rescue linked to a playable final encounter rather than a map-only promise. Additional unique stage scenery and bespoke shrine/gate sprites would further distinguish the current eight routes.
