# Ballista and Thornkeeper - playable defenders

Both former concepts are now recruitable in the nine-defender roster. Base sprites retain their original concept filenames; each also has generated tier-three, evolved and third-path art. Values below are provisional game balance.

## Pepe Ballista

185 run shards; 95 damage, 300 range, 1.6s base interval. Bolts ignore half the remaining armor after acid, without changing enemy armor. Spearhead uses shared power scaling and hits at most 2/3/4 enemies in a line at tiers 3/4/5; the first hit deals full damage and additional hits 70%. Targets must lie inside the narrow forward ray and range; off-axis enemies are excluded. Siege Windlass uses shared special scaling plus 14% shorter reload per tier. Watchtower uses shared utility range/speed scaling. Keyboard 8 selects it.

## Pepe Thornkeeper

155 run shards; 10 damage per thorn charge, 140 placement range, 2s base planting interval. During waves it plants at the nearest reachable path point. A base patch holds 10 charges, lasts 8s and hits each enemy at most once; maximum 3 patches per tower. Damage obeys normal armor and acid rules. Swept movement checks prevent fast enemies from skipping traps and resolve trap kills before a breach.

Briar Thorns uses shared power damage scaling. Seedbank uses shared special scaling plus 3 charges and 2s lifetime per tier; the fourth patch slot unlocks at tier 3. Wild Reach uses shared utility scaling and adds 2 collision-radius units per tier. Patches snapshot their planting stats, expire in simulation time and do not stockpile between waves beyond their normal expiry. Moving or selling removes owned patches; replay clears all patches. Keyboard 9 selects it.

Both defenders use the existing 75/120/175/230/285 tier costs, 5/2/0 constraints, mastery, move/sell/refunds and generic level-three/five stat bonuses. All three paths have five names and exact previews. No income, base healing, permanent armor changes or uncapped damage-over-time stacks.

The original design assets are now base gameplay sprites. New upgrade prompts and framing receipts: assets/pepe-tower-defense/new-defenders-v1.json and new-defenders-v1.qa.json. Human balance approval and a full mobile playtest remain separate gates.

## Release verification - 2026-10-24

The complete staged release passed 370 arcade tests plus 17 launch visual tests (387 total). New checks cover armor-piercing bounds, fast-enemy swept trap contact, one-hit-per-patch charging, expiry and ownership cleanup, order-independent crosspaths, and a 30 Hz earned-shard controller campaign through wave 50 with both new defenders (87 relic HP remaining). This is deterministic controller evidence, not human balance approval.

Desktop localhost checks built Thornkeeper using normal starting funds and observed wave-one traps; a separately labeled 10,000-shard fixture exercised Ballista tier-three/evolved and Thornkeeper third-path controls and art in the actual renderer. The 42-image gallery loaded without broken images; all six new forms were visually inspected at gameplay scale. The fixture reported no warning/error console entries. Full phone campaign playtesting remains outstanding.
