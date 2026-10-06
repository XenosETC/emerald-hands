# Arcade design polish — 2026-09-05

## Delivered

- Redesigned the hub with a cinematic forest hero, consistent game cards, search, genre filters, empty-result recovery, and expandable local records.
- Added the earlier Satoshi System implementation from the separate working copy to this thirteen-game arcade. Its copper observatory design keeps clicking and upgrading prominent; mobile puts upgrades before the larger orbit view.
- Added a shared presentation layer to the twelve Emerald game pages: calmer headers, visible focus, readable HUDs, permanent control guides, proportional playfields, reachable fighter selection, and compact mobile strategy shops.
- Moved Unstable Launch's ignition/lock control ahead of the flight and timeline. Made the collapsed mobile menu smaller and placed mobile pet-assist panels outside gameplay.
- Reused existing local artwork, including the earlier Satoshi cosmos image. No new image generation or deployment.

## Files

Hub: `index.html`, `mini-games.css`, `mini-games.js`.

Games: all twelve existing game HTML pages and `game-polish.css`; new `satoshi-system.html`, `satoshi-system.css`, `satoshi-system.js`, and `assets/satoshi-system/monetary-cosmos.png`.

Shared runtime and checks: `arcade.js`, `arcade-pet.js`, `scripts/smoke.mjs`, `README.md`.

## Boundaries and fixes

Satoshi uses a separate local save, fictional sats, and no pets, shared currency rewards, wallet, real money, or live prices. Its simulation reset preserves Emerald data; the arcade reset preserves its simulation save. The shared hub can record navigation and best results.

Fixed Satoshi input while paused, particle effects consuming the saved weather generator, and the displayed reward at the fictional supply cap. Preserved its original costs and progression rules.

## Verification

- The thirteen-game smoke suite covers local references, syntax, shared runtime contracts, and actual Satoshi ledger conservation, purchases, progression, deterministic reload, corruption recovery, pause behavior and separate resets.
- Browser checks covered all thirteen game pages and the hub at desktop and phone widths, with no horizontal overflow or captured console errors/warnings in those passes.
- Exercised search, category filtering, no-results recovery, Satoshi tapping, Rumble tournament roster access, platformer start, and Unstable Launch ignition and lock.
- Visually reviewed the hub, Satoshi, platformer, fighter selection, tower defense, launch game, and shooter on phone layouts.

These are local prototype checks, not a complete gameplay balance or device certification pass. Browser play checks may add local session records. Rumble and Paradox remain keyboard games.

## Try it

Run `npm run dev` and open `http://127.0.0.1:4173/`, or open `index.html` directly. Run `npm test` for the automated checks.

Next: a short human playtest focused on time to first action, Satoshi's first upgrade, and mobile control comfort. Rebalance only after observing players.
