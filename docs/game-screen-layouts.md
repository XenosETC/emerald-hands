# Arcade game screens

Primary gameplay stays inside the viewport. Supporting information uses native
dialogs or bounded internal panels; the document itself does not need to scroll.
Canvas games retain their authored camera ratio and map pointer input through
the actual displayed canvas rectangle. Letterboxing preserves the whole world.

Emerald Run now has a game-specific portrait camera: a 720×720 window enlarges
the coin and nearby course on narrow, tall screens. Landscape keeps its 1280×720
view. Only the render camera changes; world positions and collision remain fixed.
See `emerald-run-cosmic.md` for the camera and rotation checks.

## Screen families

| Games | Screen behavior |
| --- | --- |
| ETC Pets | Living scene, care controls, inventory; Pets/Shop/Care info dialog |
| ETC Unstable Launch | Flight and lock button; Flight info dialog |
| Shard Rush, Galactic Heroes, Emerald Run, Space Unchained, Paradox, Relic Rumble | `canvas-game-screen.js/css`; primary actions plus Game info |
| Emerald Hands, Satoshi System, Tower Defense, Pepe Wars, Rocket Simulator | `strategy-screen.js/css`; game-specific control areas and management panels |
| Poker | Table and decisions; Table info for activity, records and replay |
| Chess, Checkers | Board and primary controls; Match options for secondary settings/reports |
| KONTRA | Compact play shell and Field guide |
| Temple Run | Existing Focus mode becomes the default; bounded overlays |
| Soul World | Short-landscape sizing correction |
| One More Launch, Feudalism | Existing viewport layouts retained and verified |

Focus screens suppress the roaming decorative pet and switcher so they do not
cover controls. Pet effects remain active; earned-assist reports remain accessible.
The homepage retains its roaming companion and ETC Pets has its own residents.
Each game's simulation, save and economy remain independently owned.

## Validation and limits

Browser coverage exercises screen bounds, starting games, primary input, panels,
pause/resume, purchases and representative save/reload flows. Canvas and strategy
families cover 320×568, 390×844, 844×390 and 1440×900. Standalone interaction checks
cover the latter three; an additional 320×568 entry-screen audit covers all 21 games.
Existing reconnect, forced-capture, stale-save and graphics-fallback regressions
remain part of the suite. Temple Run was also started and paused with its normal
3D character renderer, separately from forced 2D fallback coverage.

Use `npm test` and `npm run test:browser`. These checks establish browser screen
and interaction behavior, not complete campaign balance or physical-device quality.
Relic Rumble's solo Tournament now has a touch pad that reserves space beneath
the stage, with 44px controls and a compact health/energy HUD. Local Versus
retains keyboard controls for both players. Other keyboard-required games
retain that requirement. Internal manuals,
fighter drafts, inventories and management panels can scroll when necessary.

Paradox's proposed pixel-art production experiment is documented separately in
`paradox-art-direction.md`; this release preserves its current artwork.
