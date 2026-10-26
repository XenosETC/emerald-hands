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

The original map has stable identity `courtyard`. Its current runtime background is emerald-vault-courtyard-v2.png while the original path, nine pads, relic placement, simulation and saves remain unchanged. The selected next art direction is emerald-vault-courtyard-v3-baked.png, including road, nine empty foundations and relic in the image. Align geometry and remove duplicate live base drawings before switching to that asset. No renumbering of Delta is needed.

## Map 05 - Emerald Celestial Hall

Requested by the user as one additional map. The roster now contains six battlegrounds: Classic plus Maps 01-05.

- Selected art: emerald-celestial-hall-v1.png.
- Identity: a jade/gold celestial palace with central emerald orrery, ivory processional road and upper-right relic.
- Corrected route: left entry, upper sweep, descent just right of the orrery, lower-right U-turn, ascent to relic. The disconnected lower-edge road in the initial generation was rejected and removed by imagegen.
- Status: generated map asset, runtime geometry and validation pending. Seven visible empty foundations in the corrected image; do not assume nine or invent hidden pads.
- Prompt/inspection notes: CELESTIAL_AND_CLASSIC_ART.md.

Game structure and proposed implementation order: ../../docs/tower-defense-five-map-structure.md.
