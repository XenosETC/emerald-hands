# Tower Defense map roster

## Map 01 - Floodgate Delta

User selected on 2026-10-25. Preserve this map's identity while exploring further maps.

- Selected concept: map-concepts-v2/floodgate-delta-v1.png
- Structure: three marsh defense islands, two causeways, nine visible tower foundations, one serpentine route to the relic.
- Status: integrated in the six-map game, with authored route, nine interactive pads and independent checkpoint. See ../../docs/tower-defense-map-integration.md for balance/verification evidence.
- Design provenance: map-concepts-v2/README.md.

All four expansion maps below are now integrated in the map selector. Their numbering preserves Delta as Map 01. Physical-device performance and human balance feedback remain open.

## Maps 02-04 - selected for development

- Map 02, Sunscar Quarry: map-concepts-v3/sunscar-quarry-v1.png. Three-pass switchbacks on a quarry floor; nine visible empty foundations.
- Map 03, Twinroot Grove: map-concepts-v3/twinroot-grove-v1.png. Integrated split-and-rejoin route with nine pads; ordinary arrivals alternate lanes and major boss/escort groups stay together.
- Map 04, Tideglass Harbor: map-concepts-v3/tideglass-harbor-v1.png. Integrated U-shaped fortified quay, lower-left relic and eight interactive foundations. The controls reflect eight pads rather than inventing a ninth.

Generation briefs and inspection notes: map-concepts-v3/README.md.

## Classic - Emerald Courtyard

The original map has stable identity `courtyard`. New selections use emerald-vault-courtyard-v3-baked.png with an aligned road, nine pads and live HP feedback on the painted relic. Legacy v1 saves resume the original road/pads on emerald-vault-courtyard-v2.png, labeled Legacy build, without shifting saved towers. No renumbering of Delta is needed.

## Map 05 - Emerald Celestial Hall

Requested by the user as one additional map. The roster now contains six battlegrounds: Classic plus Maps 01-05.

- Selected art: emerald-celestial-hall-v2.png. The prior v1 is preserved as an earlier revision.
- Identity: a jade/gold celestial palace with a compact crescent-and-comet centerpiece, ivory processional road and upper-right relic.
- Corrected route: left entry, upper sweep, descent just right of the orrery, lower-right U-turn, ascent to relic. The disconnected lower-edge road in the initial generation was rejected and removed by imagegen.
- Status: integrated with nine interactive build foundations and a route to the upper-right relic. The oversized central orb/platform was removed; the small centerpiece is decorative and the upper-right shrine remains the objective. The baked relic has live health/hit feedback without a duplicate full sprite.
- Prompt/inspection notes: CELESTIAL_AND_CLASSIC_ART.md.

Game structure and proposed implementation order: ../../docs/tower-defense-five-map-structure.md.
