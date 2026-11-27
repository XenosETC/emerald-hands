# Arcade expansion pass

This batch extends the arcade with playable content, clearer tactical feedback and bounded management screens. It combines the tabletop/combat improvements with the campaign, multiplayer and world expansion pass for release together.

## Delivered gameplay

| Game | Usable change | Main source / detail |
| --- | --- | --- |
| Poker | Eight seats, read-only watch links, private multiple-table manager, per-room reconnect; free emotes and clearer bet totals retained | `pepe-poker/`; [table behavior](poker-tables.md) |
| Chess | Optional attack rings follow live/review/flip; validated PGN import retained | `pepe-chess/`; [tactical previews](tabletop-depth.md) |
| Checkers | Full capture previews report kings, crowns, winning turns and next-turn recapture possibilities, including later reply jumps | `pepe-checkers/`; [tactical previews](tabletop-depth.md) |
| Paradox | Eight travel stages, two upgrade bases, four pieces of permanent journey gear, checkpoint resume, painted map, marsh sentinels and telegraphed surges | `pepes-paradox.*`, `paradox-campaign*.js`; [campaign and stages](paradox-campaign.md) |
| Emerald Run | New corrupt and volcanic worlds with equal spans, authored recurring pickup intervals, animated disco motes and facets | `pepecoin-route.js`, `pepecoin-run.js`; [world sequence](emerald-run-frontier.md) |
| Emerald Hands | Compact business cards, direct purchase shortcuts and visible wallet while shopping | `strategy-screen.js/css`; [screen findings](idle-screen-strategy.md) |
| Satoshi | Immediate next-action guidance and visible treasury while building | `strategy-screen.js/css`; [prototype direction](idle-screen-strategy.md) |
| Relic Rumble / Galactic Heroes / Shard Rush | Earlier touch combat, shot telegraphs and final-sprint feedback retained and regression-tested | [combat pass](arcade-combat-polish.md) |

Generated Paradox and Runner assets live under their existing `assets/` folders with prompt records. Chess/Checkers keep their established Pepe artwork. Shared strategy-screen version references were refreshed in its five consuming pages. `package.json` now includes the new campaign unit suite in the ordinary root test command.

## Decisions and boundaries

- Poker table links stay private. Remembered tables are local to the browser, rather than a global public lobby. Rooms remain process-local and expire after twelve hours: durable multiplayer hosting is the next technical priority.
- Paradox's two implemented levels each contain four travel stages and a base. Cinder Crown and Moonlit Citadel are planned and disabled. Pepina's final rescue needs a future playable final encounter. Several routes share biome scenery and landmarks; campaign costs and difficulty need longer human playtests.
- Journey equipment spends independent journey shards. Existing arcade saves and established economy formulas are preserved. Satoshi was clarified rather than replaced or silently migrated.
- Equal distance and deterministic spacing are implemented pacing decisions, not proof that every player will find the full long run rewarding.

## Recommended development order

1. Playtest the current Paradox chapter for difficulty, upgrade usefulness and stage identity; then author Cinder Crown's four routes and Ember Watch before enabling its map nodes.
2. Give Poker durable authoritative room storage and reconnect behavior across server restarts before building a public lobby or events.
3. Prototype Satoshi separately: three destinations, one visible courier, one hazard, a single fictional resource and a five-minute route → deliver → expand sector. Keep the current simulation/save as legacy. Evaluate the active interaction before generating a large asset catalog or deciding an explicit migration.
4. Add authored tactical challenges to Chess and Checkers using existing rules and sprites; prioritize scenarios that teach a visible decision rather than new currencies.
5. Extend shared game-screen conventions: primary action and live feedback on the stage, management/history in bounded modal panels, phone portrait and short-landscape checks in every new regression.

## How to playtest

Start `npm run dev`, open the server URL, and launch each cabinet. In Poker, open Tables to create another table or open a Watch link; eight players require separate seat identities. In Chess, try Show threats after `e4 d5`. In Checkers, open Capture routes when a jump is forced. In Paradox, follow the Journey map; each fifth stage opens camp. In Hands, open Upgrades and jump between businesses while watching the pinned wallet.

Use `npm test` for core checks and the new/updated specs under `scripts/browser/` for real Chromium interactions. Test fixtures include funded purchase checks and saved checkpoint starts; those establish behavior and layout, not whole-campaign balance or physical-device performance. Final command evidence is stored in `test-results/arcade-upgrades-final-core.log` and `test-results/arcade-upgrades-final-browser.log`.

Final results: root `npm test` passed the 21-game smoke check and all **569 tests** (31 Poker, 521 main suites, 17 One More Launch). The combined **82 browser tests passed** in 3.5 minutes across the twelve selected specs. A final map-connector adjustment passed three additional map bounds/navigation checks. Scoped whitespace checks passed. Local playtesting used a fresh server on `http://127.0.0.1:4195`.
