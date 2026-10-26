# Tower Defense map roster

## Map 01 - Floodgate Delta

User selected on 2026-10-25. Preserve this map's identity while exploring further maps.

- Selected concept: map-concepts-v2/floodgate-delta-v1.png
- Structure: three marsh defense islands, two causeways, nine visible tower foundations, one serpentine route to the relic.
- Status: selected visual design; runtime integration and balance validation pending.
- Design provenance: map-concepts-v2/README.md.

User selection update: all four maps below are selected for game development. Their numbering preserves Delta as Map 01. Selection does not imply the current game has a map picker or these new maps are playable yet.

## Maps 02-04 - selected for development

- Map 02, Sunscar Quarry: map-concepts-v3/sunscar-quarry-v1.png. Three-pass switchbacks on a quarry floor; nine visible empty foundations.
- Map 03, Twinroot Grove: map-concepts-v3/twinroot-grove-v1.png. Intentional split-and-rejoin forest route; nine visible foundations. Requires multi-route simulation support; proposed branch allocation is documented in ../../docs/tower-defense-five-map-structure.md.
- Map 04, Tideglass Harbor: map-concepts-v3/tideglass-harbor-v1.png. U-shaped fortified quay, relic at lower-left; eight visible foundations. Keep eight pads for the initial authoring pass rather than invent an invisible ninth. Right-side sprite clearance needs checking before implementation.

Generation briefs and inspection notes: map-concepts-v3/README.md.

## Classic - Emerald Courtyard

The original map remains the fifth battleground, with stable identity `courtyard`. Its background is refreshed to emerald-vault-courtyard-v2.png while the original path, nine pads, relic placement, simulation and saves remain unchanged. No renumbering of Delta is needed.

Game structure and proposed implementation order: ../../docs/tower-defense-five-map-structure.md.
