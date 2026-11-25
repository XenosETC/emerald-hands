# Pepe's Paradox: proposed long-term art direction

Recommendation: keep the current painted assets for this release, then benchmark
one small, authored pixel-art scene before committing to a full conversion.
This is a production proposal; no pixel-art conversion is included in this release.

The current game already has a 1280×720 canvas, a reusable character atlas,
layered parallax backgrounds, and gameplay geometry separate from those images.
A visual-direction change does not require replacing the engine.

## Where pixel art could help

A fixed pixel grid, limited palette, standard character dimensions, reusable tiles,
and animation templates could make future rooms and biomes more repeatable.
The production benefit comes from those constraints and reuse, rather than the
pixelated appearance alone. The painted direction could also improve with a
stricter atlas/export pipeline.

Pixel art still requires readable silhouettes, coherent animation, tile seams,
level design, collision, effects, integration and browser testing. There is no
measured basis for promising a tenfold end-to-end development speedup.

## Smallest useful comparison

Build one optional comparison scene containing Crown Pepe, one enemy, one hazard,
one collectible and a compact modular terrain set. Proposed starting constraints:
32-pixel terrain tiles and a 48- or 64-pixel character, selected after readability
tests at actual desktop/phone game size. Keep painted portraits and promotional
art if they strengthen the visual identity.

Measure first usable asset time, animation cleanup, integration/revision time,
consistency and readability. Then build a second room using the same kit to
measure actual reuse. Choose a full conversion only after comparing that result
with an equivalent room in the current direction.

## Workflow reference

[Aseprite tilemaps](https://aseprite.org/docs/tilemap/) support building maps from
reusable tilesets. This supports the proposed workflow; it does not establish a
production speed multiplier for this project.
