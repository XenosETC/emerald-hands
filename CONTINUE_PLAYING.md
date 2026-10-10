# Continue playing — October 10, 2026

## What changed

The hub's recent links are now a scrollable Continue playing shelf with up to four games. Recent openings come first. Valid saves from the three independent Pepe games fill unused slots even when they predate the hub's navigation history. The same summaries appear on those games' collection cards.

- Soul World shows the saved realm, level, seal count and the game's own next-objective guidance. Its link reopens the saved checkpoint.
- Feudalism shows the saved location, level, warband size and an active or ready-to-claim contract. Ready rewards take priority. Its link reopens the saved campaign.
- Temple Run shows best distance and says **Run again**. It starts a new attempt; it does not resume an unfinished run.
- Shard Rush remembers a Daily Vault selection in both the shelf and the hero return link. Choosing Classic updates both links. A daily return opens the current UTC day's course for a fresh attempt.

The shelf updates on page return, focus and relevant storage changes. Keyboard focus and shelf scroll position are retained when summaries refresh. Favorites, filtering and sorting still operate on the game collection independently.

## Files and architecture

- `arcade-progress.mjs` reads only `pepe-soul-world-v1`, `pepe-feudalism-campaign-v1`, and `pepe-temple-run-v1`. It reuses the native Soul World save/quest logic and Feudalism migration/contract logic. It never starts a game loop or writes storage.
- `pepe-feudalism/world-data.js` holds the existing map metadata, unchanged. `world.js` imports and re-exports it so the hub can resolve real settlement names without loading rendering assets.
- `arcade-library.js`, `arcade-visit.js`, and `shard-rush.js` preserve a validated daily-mode bookmark. Destinations come from known catalog IDs; arbitrary stored URLs and query strings are never used.
- `arcade-library-ui.js`, `index.html`, and `mini-games.css` render the shelf, card summaries and mode-aware return links. The new module is loaded only by the hub; browsing still works if its optional progress summaries are unavailable.
- Released pages update the navigation-script cache versions together. `scripts/dev-server.mjs` serves `.mjs` files with a JavaScript MIME type.

## Boundaries and assumptions

These are local **saved** snapshots, not live sessions or cloud saves. A game open in another tab may have unsaved changes. A navigation timestamp means the game was opened, not that it saved or completed a run. Save-only fallback cards never invent a last-played timestamp.

The hub does not merge economies, award XP, change game saves, or read Soul World's separate practice save. It distinguishes absent saves from unreadable, unsupported or oversized saves. Unavailable summaries direct players to the game without resetting data. Reads are capped at 250 KB per supported save.

Navigation stays in `emerald-library-v1`: the existing version-one format gains an optional `mode: "daily"` only for Shard Rush. All old records remain readable. Older cached navigation code can discard that optional hint, so all released pages refresh both scripts together. No persisted runtime state or save-schema migration is introduced.

## How to test

Run `npm test`, `npm test --prefix pepe-soul-world`, `npm test --prefix pepe-feudalism`, and `node --test pepe-temple-run/*-test.mjs`.

New tests cover native checkpoint summaries, legacy saves, quest readiness, invalid saves, storage failures, a strict read-only allowlist, default record semantics, saved-game fallback ordering, validated destinations, and the actual visit hook's daily/classic mode changes. The release also runs from a clean copy reconstructed from the Git index.

For browser checks, open the hub over HTTP. Visit Daily Vault, return to the hub, and use the hero return link. Change to Classic, return again, and confirm the link drops `?mode=daily`. On a separate test origin, begin Soul World and accept the oath, accept Feudalism's first contract, and finish a Temple Run attempt. Return to the hub after each; compare its summary with the actual game UI. Reload, test keyboard navigation, and check the shelf at 1280px and 390px without horizontal page overflow.

## Verified release checks

The clean Git-index copy passed 308 behavior tests: 72 arcade/library, 149 Soul World, 76 Feudalism, and 11 Temple Run, plus the sixteen-game smoke check.

Browser checks used normal game controls on a separate local test origin. The hub displayed Soul World's accepted oath and effigy objective, Feudalism's active Briar contract with three soldiers, and a completed Temple Run record of 143 m. Reopening Feudalism restored its active contract; reloading the hub retained all three summaries. Searching for Soul showed one of sixteen games and its checkpoint summary; clearing search restored all sixteen. Daily Vault and Classic return links both preserved the selected mode.

At 1280 px and 390 px, the page had no horizontal overflow. On the phone layout, keyboard navigation reached all four shelf links and scrolled the shelf to reveal the final card. The tested browser recorded no warning or error console entries. These checks use a browser viewport, not a physical phone.

Evidence: [desktop](docs/continue-playing-2026-10-09/desktop.png) and [phone](docs/continue-playing-2026-10-09/phone.png). Test saves were created on the separate QA origin, not in the user's existing preview saves.

## Next step

Extend summaries to another game only through its own save rules. Physical-phone scroll/input comfort and hosted deployment remain separate checks.
