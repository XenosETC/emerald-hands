# Deeper marsh map exploration - 2026-10-25

Built-in imagegen previews for visual review, expanding Jade Marsh. No game code, saves, balance or map selection was changed. Both images use map-concepts-v1/jade-marsh-v1.png as a style/world reference. They are not runtime maps or validated gameplay layouts.

## Sunken Sanctum

Selected asset: sunken-sanctum-v1.png.

An inward road spiral surrounds a flooded frog sanctuary and ends at an interior relic. The design intent is to let some positions cover an early pass and the final approach, with a distinct inward-facing endgame. Moss-covered colonnades, sluice ruins, boats and tree roots provide a sense of an older, deeper marsh settlement. One continuous road is visually traceable after correction.

Visual inspection: the final generated image has eight empty foundations, despite a nine-foundation prompt. Do not assume a ninth exists. This is acceptable as a concept variant; exact pad count/positions must be authored and reviewed for implementation. The relic is painted into the concept and should later be replaced with the game's live relic asset. Check sprite overlap near the interior endpoint and range coverage before approving the layout.

## Floodgate Delta

Selected asset: floodgate-delta-v1.png.

User selection update, 2026-10-25: confirmed as Map 01. See ../MAP-ROSTER.md. Runtime integration is still pending.

Three compact defense islands linked by two short stone causeways, with three visible build foundations per island. One continuous serpentine road and an exterior right-side relic. Design intent: distinguish early control, central damage, and final interception rather than scatter pads across a large courtyard. The central sluice works explain the terrain; causeways give clear visual sectors without introducing new mechanics.

Visual inspection: nine empty foundations and one road are visible. Pad-to-road distance looks more usable than the first exploration, but this is not a tower-range measurement. This is the recommended first implementation candidate because its three sectors and centerline are easier to author and inspect. That recommendation is a design judgment, not balance evidence.

## Generation briefs and iteration

Shared prompt: stylized-concept; rich premium hand-painted 3D jade/gold frog-temple marsh; near-overhead orthographic 16:9 game board; readable ochre stone road over dark green land and teal water; deliberate defense pockets; no characters, towers, enemies, numbers, labels, UI or watermark. Use the original Jade Marsh image for style/world only, not its simple S-bend layout. Keep playable surfaces open and environmental storytelling around them. No fog over road/pads.

Sanctum generation brief: a partly submerged circular frog sanctum, drowned colonnades and huge outer tree roots, low mossy walls, emerald lanterns, teal channels and lotus flowers. A long single backward-S loop around the sanctum with early, shared-coverage and final-defense pad groups, avoiding forks and crossings. The first output contained an unintended junction and dead-end spur. It was not selected.

Sanctum final edit prompt: correct road topology while preserving jade marsh style, camera, existing pads, scenery and lighting. Intended route is an inward spiral with relic at its inner dead-end. Keep left entrance, upper semicircle, right semicircle, bottom-left turn and inward curl. Remove lower-right road spur and replace with marsh water, low ruins and reeds. Relocate the small relic to the curl's inner dead-end near x42%, y61%. Add one foundation near x55%, y58%, preserving other pads. No extra paths, text, towers, enemies or UI. The model did not preserve the requested nine-pad count; actual visible count is disclosed above.

Delta generation brief: three marsh islands, one continuous horizontal W-like road. Enter left at y35%, proceed to x27%, bend down to y72%, reach x52%, bend up to y27%, reach x76%, bend down to y62%, then reach the relic near x95%, y62%. Constant-width pale ochre road, no forks/crossings/dead ends. Three empty foundations close beside each island's bend, never on the road. First island a reed/root basin, middle a mechanical sluice courtyard, last a royal shrine approach. Jade waterworks, submerged stair, low broken columns, lilies and emerald details; open flat defense land, restrained rich scenery, no occluded lanes.

## Sources and next validation

- Sanctum initial output: exec-a8e9470c-18f8-4726-8fe2-d687cb9e69a2.png
- Sanctum selected edit: exec-9e94af9b-dda4-4245-9011-42255c80ea90.png
- Delta selected output: exec-dd4ef044-f520-4a7d-89d6-1e2b76065059.png
- Originals preserved under C:/Users/Phantom Assassin/.codex/generated_images/01a112bd-f311-78e3-95fb-5a36bcd7647d/.

Before integration: author path centerlines and pad coordinates independently from art, measure range exposure, choose a baseline travel duration, check every existing tower's footprint/projectile contrast, use the live relic renderer, and test mobile layout and representative 50-wave strategies. No new environmental mechanics are implied by the artwork.
