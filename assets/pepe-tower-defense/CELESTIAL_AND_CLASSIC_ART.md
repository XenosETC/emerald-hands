# Emerald Celestial Hall and rebuilt Classic - 2026-10-25

Created/edited with built-in imagegen, as requested. Originals preserved in C:/Users/Phantom Assassin/.codex/generated_images/01a112bd-f311-78e3-95fb-5a36bcd7647d/. These selected workspace assets are map-art deliverables. This change does not alter the live background, pathing, tower placement or save data. The live game retains courtyard v2 until baked-art integration is validated.

## Emerald Celestial Hall

Selected file: emerald-celestial-hall-v1.png. Selected generated output: exec-2526a557-bb27-42dd-8a55-751a3fbdcfd6.png.

Identity: jade/gold celestial palace suspended above a turquoise astral void, frog guardians, hanging lanterns, a low central emerald orrery, ivory/gold processional road and upper-right emerald relic. The road, foundations and relic are painted into the environment. Delta was supplied as camera/art-quality reference only; relic-base-v1.webp was a design reference.

Initial generation exec-7e3cbe2c-0ad2-4301-b6d3-d85cfff4df9d.png contained disconnected lower road portions. The user explicitly requested a road fix. That image is rejected as a final deliverable.

Final edit brief: keep architecture, orrery, palette, camera and upper-right relic. One continuous road from left at roughly 53% height, up the left, across upper floor, down just right of orrery around x66%, U-turn right at lower-right, then up the rightmost lane around x83% to relic. Connect both right-side vertical lanes with constant-width ivory/gold road. Remove the old lower-left curling road and its bottom-border entrance completely, replacing with jade floor/gold inlays. No branches, road gaps, dead ends or lower-border road. Move only a directly obstructing lower pad if needed. Preserve other scenery; no labels/UI.

Visual inspection: the selected road is traceable from left entrance across upper floor, down and around the lower-right bend, then up to the relic. There are seven visible empty foundations after the correction. Nine were originally requested, but the observed image is authoritative; design a seven-pad candidate or request a further art edit before deciding otherwise. No geometry collision, route-time, balance or mobile runtime approval is claimed.

## Emerald Vault Courtyard v3 - complete painted map

Selected file: emerald-vault-courtyard-v3-baked.png. Generated output: exec-c6273d0d-670f-4288-b063-3b122de76836.png.

The user requested the original map receive a stronger visual upgrade with road and relic built into the image, like the four selected expansion concepts. The runtime v2 backdrop was not replaced blindly: it currently relies on live road/pad/relic renderers, which would duplicate the newly painted structures.

A code-rendered geometry reference was prepared under releases/tower-map-art-20261025/guide.html and captured as classic-layout-guide.png. It draws the original path and pad centers over v2, with the existing relic design. This was a layout guide for imagegen, not a substitute for generated art. Input roles: guide = authoritative requested layout; Delta = finish-quality reference; relic-base-v1.webp = relic design reference.

Generation brief: precise-object-edit/stylized game-map redesign. Transform the plain guide into a premium royal jade vault garden courtyard, 16:9 near-overhead orthographic, physical pale stone road/gold curbs, nine low carved jade/gold empty foundations and a small right-side emerald relic. Preserve guide topology: left entry at y48%, right to x13%, up to y24%, right to x34%, down to y65%, right to x59%, up to y33%, right to x81%, down to y56%, right to relic near x93%. No forks or crossings. Keep all nine guide foundation centers, with small footprints near lane. Add restored frog guardians, refined gold temple trim, shallow turquoise corner moats, lotus, controlled greenery, rich quiet dark jade floor, natural light. Keep large sprite spaces clear. No towers, enemies, UI or text.

Visual inspection: nine empty foundations and a connected road/relic are visible, with the intended overall alternating-turn topology. The model shifted some centers and bends relative to the numerical guide. Therefore this is not a pixel-exact replacement for the current simulation. Before runtime use, measure painted centerline/pad coordinates, reconcile them with legacy save geometry, and either correct art alignment or introduce a properly versioned layout change. Do not silently move saved towers.

## Integration contract

- Baked art supplies the static road, empty foundations and base appearance. The engine supplies authoritative geometry, pad interaction, range previews, towers, enemies, attacks, HP, damage and results.
- Do not draw a second full relic or neon road over the baked originals. Keep hit flash/low-health/destruction feedback and health UI, potentially with a small separately layered relic core/cutout if needed.
- Validate complete road footprint, relic arrival position, pad centers, tower sprite clearance, full view/phone crop and all hero facings in the consuming game.
- Keep source originals and current live v2 available for rollback. No runtime activation is claimed by an art-only commit.
