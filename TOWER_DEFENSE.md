# Pepe Tower Defense development pass — October 11, 2026

In-progress finishing pass; costs, tower statistics, waves and mastery thresholds are unchanged.

- Fatal breaches clamp vault integrity to zero and stop remaining combat/wave processing. Results record once and accurately show zero cleared waves when wave one is lost.
- Paused placement/upgrades and wave requests do not spend shards or launch a wave. Repeated keys, modifiers and focused controls do not trigger game shortcuts.
- Blocked mastery and best-score writes retain usable tab state. Invalid or unavailable best-score storage no longer blocks startup. Results focus Rebuild Defense.

Verification: root smoke and 166 behavior tests pass in the workspace and clean staged copy. Three controller fixtures cover fatal breach/duplicate results, paused mutations and storage-failure placement/results. Tests access the private controller through a gateway injected only into the in-memory test source; shipped code has no gateway. Browser placement, upgrades, later-wave balance and full win/loss/replay playthroughs remain to be checked before marking this game as a finishing candidate.

## Courtyard artwork

The background is now a generated top-down jade/obsidian vault courtyard with frog guardians and edge ruins. It uses an open central floor beneath the existing live path, pads and sprites; a 16% dark wash preserves combat contrast. The old procedural plate remains the loading/failure fallback. Desktop and 390 px phone layout were checked in-browser (375 px page width, no horizontal overflow). Artwork and exact built-in generation prompt: [COURTYARD_ARTWORK.md](assets/pepe-tower-defense/COURTYARD_ARTWORK.md). No gameplay rules changed.

## Opening flow

Start Defense now opens a safe build phase with 180 shards; the player sends wave one explicitly. Repeat launch cannot erase an active defense. Wave control is disabled before launch, during combat and while paused. Tower selection exposes aria-pressed state. A controller fixture checks placement before the first wave and launch guarding; native browser checks confirmed Start Wave enables after launch and disables once combat begins. The objective explicitly states all 12 waves. Full placement/upgrade and campaign playthroughs remain open.

## Slow combat repair

Slow effects now use their defined strengths rather than a fixed 45% slowdown: base Shard Slow 48%, upgraded effects through 82%, and Mage effects 12%/18%. The strongest active slow is retained when a weaker hit refreshes the effect; duration takes the maximum. Evolved Shard Slow applies its strength to nearby creeps. Expiry partway through a frame restores normal movement for the remaining time. This changes effective control balance without changing tower prices or upgrade stats; human tuning remains open.

Controller fixtures verify actual slowed movement and expiry, evolved area strength, weaker-hit handling, and finite coordinates when an enemy starts exactly at a waypoint on a zero-time frame. This pass uses combat fixtures rather than a native campaign win; browser campaign testing remains open.

## Numbered pad controls and target repair

Nine full-size pad buttons now show the selected defender build price or the occupied tower upgrade cost and next level. Buttons disable when paused, outside a defense, unaffordable or maxed. Empty map pads display matching numbers. The existing build/upgrade functions, prices, mastery and saves remain unchanged. Keyboard and pointer activation use the same buttons.

Native browser checks at 390 x 844 built a 75-shard Blaster on pad 1, selected Archer, then built its 105-shard tower on pad 2. The 180-shard budget reached exactly zero, both upgrade labels showed level 2 / 120 shards and unaffordable purchases disabled. Page width was 375 px without overflow. Physical touch comfort and a campaign win remain open. Towers also ignore enemies killed earlier in the same update, preventing wasted shots; a controller regression checks live-target selection.
