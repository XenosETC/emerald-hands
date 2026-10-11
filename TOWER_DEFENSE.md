# Pepe Tower Defense development pass — October 11, 2026

In-progress finishing pass; costs, tower statistics, waves and mastery thresholds are unchanged.

- Fatal breaches clamp vault integrity to zero and stop remaining combat/wave processing. Results record once and accurately show zero cleared waves when wave one is lost.
- Paused placement/upgrades and wave requests do not spend shards or launch a wave. Repeated keys, modifiers and focused controls do not trigger game shortcuts.
- Blocked mastery and best-score writes retain usable tab state. Invalid or unavailable best-score storage no longer blocks startup. Results focus Rebuild Defense.

Verification: root smoke and 162 behavior tests pass in the workspace and clean staged copy. Three controller fixtures cover fatal breach/duplicate results, paused mutations and storage-failure placement/results. Tests access the private controller through a gateway injected only into the in-memory test source; shipped code has no gateway. Browser placement, upgrades, later-wave balance and full win/loss/replay playthroughs remain to be checked before marking this game as a finishing candidate.

## Courtyard artwork

The background is now a generated top-down jade/obsidian vault courtyard with frog guardians and edge ruins. It uses an open central floor beneath the existing live path, pads and sprites; a 16% dark wash preserves combat contrast. The old procedural plate remains the loading/failure fallback. Desktop and 390 px phone layout were checked in-browser (375 px page width, no horizontal overflow). Artwork and exact built-in generation prompt: [COURTYARD_ARTWORK.md](assets/pepe-tower-defense/COURTYARD_ARTWORK.md). No gameplay rules changed.

## Opening flow

Start Defense now opens a safe build phase with 180 shards; the player sends wave one explicitly. Repeat launch cannot erase an active defense. Wave control is disabled before launch, during combat and while paused. Tower selection exposes aria-pressed state. A controller fixture checks placement before the first wave and launch guarding; native browser checks confirmed Start Wave enables after launch and disables once combat begins. The objective explicitly states all 12 waves. Full placement/upgrade and campaign playthroughs remain open.
