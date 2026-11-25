# ETC Pets living sanctuary

The sanctuary keeps residents and care controls in one viewport. Pets, Shop, and
Care info open in a native dialog; only its supporting content scrolls. Opening
the dialog pauses residents and closing restores the previous pause state and focus.

## Residents

Every unlocked pet appears. Selecting a resident also selects that pet's existing
arcade assist. Movement is presentation only: varied idle periods, eased paths,
facing, depth and soft step/celebration motion reuse the existing two-pose sheets.
These are not new frame-by-frame walking animations. Motion never writes saves.
Hidden tabs, runtime pause and reduced-motion preferences stop movement.
Names remain in the care panel and accessible labels, with no floating scene text.
Ground footprints reserve space around props, the Den's painted furniture, and other residents. Paths are
checked before walking; each movement step yields and replans if another pet
blocks the route. Placement and resize also repair occupied ground positions.
Crowded furnished rooms repack and compact resident scale as needed to preserve
ground clearance. This is cosmetic presentation, with no resident cap or stat change.

## Shop and save behavior

Initial cosmetic prices, subject to playtest tuning:

| Item | Arcade Shards |
| --- | ---: |
| Emerald Den (existing starter; save ID `bamboo`) | Free |
| Moonlit Marsh | 80 |
| Sunset Garden | 120 |
| Amber Lantern | 20 |
| Lily Pond | 35 |
| Crystal Cluster | 50 |

Ownership is permanent; equipping habitats and placing/storing owned decorations
are free. Cosmetics have no stat effects. Existing pet unlocks, care prices,
inventory and game assists retain their behavior.

Schema 3 adds sanitized sanctuary ownership/arrangement to the existing pet save.
Purchases extend the recoverable wallet grant ledger, sharing a single write with
the shard charge. If delivery fails, paid ownership can be recovered without a
second charge. Arrangement changes require a successful pet save. Web Locks
serialize sanctuary mutations across tabs where supported. No cloud sync exists.

## Files and validation

- `arcade.js`: wallet grant ledger; `arcade-pet.js`: catalog, migration, shop API.
- `etc-pets.html/css/js`: viewport layout, panels, care and shop presentation.
- `etc-pets-sanctuary.js/css`: bounded resident movement and transparent sprites.
- `assets/etc-pets/habitat-*-v1.webp`: generated scenery, with prompts in
  `habitat-prompts-v1.json`.
- `assets/etc-pets/decoration-*-v1.webp`: transparent painted props, with prompts
  in `decoration-prompts-v1.json`. Props share the resident ground plane and
  sort by their foot position. Sprites use per-pose foot alignment, contact
  shadows and subtle habitat lighting.
- `assets/etc-pets/supply-*-v1.webp`: painted bamboo shoots and training sticks
  used in inventory, care controls and the supply shop. Prompts are stored in
  `supply-prompts-v1.json`.
- `scripts/pet-inventory.test.cjs`: migration, recovery, duplicate purchases,
  cross-tab transactions and unchanged assists.
- `scripts/browser/sanctuary.spec.cjs`: four viewport sizes, purchases/reload,
  care/selection, full roster, pause, reduced-motion behavior and crowded-scene
  ground clearance over time at phone and desktop sizes.

Run `npm test` and `npm run test:browser`. Browser viewport checks do not replace
physical phone testing. Next: tune movement density and shop prices from actual
playtests, then consider pet-specific walk sheets and furniture placement.
