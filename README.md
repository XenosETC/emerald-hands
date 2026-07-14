# Emerald Arcade

Premium ETC-inspired eight-game arcade hub.

Open `index.html` for the ETC Mini Games Lab hub. `emerald-hands.html` opens the idle/clicker game directly.

The hub reads local arcade progress from `localStorage`: arcade XP, badges, best runs, a rotating daily challenge, the last-played game, and privacy-friendly session signals. This is cosmetic/local only; nothing is transmitted.

## Arcade Badges

The hub includes a twelve-badge cosmetic trophy cabinet with generated emerald/gold medallion art under `assets/badges/` and selected game art.

Current badge unlocks:

1. `Emerald Pilot`: play any arcade game.
2. `Shard Stacker`: score 9K+ in Shard Rush.
3. `LP Reviver`: earn the first OG point in Emerald Hands.
4. `Combo Runner`: hit a x6 combo in Shard Rush.
5. `Boss Challenger`: reach Wave 3 in Galactic Heroes.
6. `Gasbreaker`: finish Galactic Heroes with Gasbreaker rank.
7. `Market Sage`: reach 7 OG points in Emerald Hands.
8. `Emerald Ace`: finish Galactic Heroes with Emerald Ace rank.
9. `Chart Surfer`: score 4.5K+ in PepeCoin Emerald Run.
10. `Space Unchained`: reach Wave 3 in Pepe: Space Unchained.
11. `Vault Defender`: survive Wave 5 in Pepe Tower Defense.
12. `Pepe Warlord`: win a Pepe Wars shard siege.

## Pepe Relic Rumble

`pepe-relic-rumble.html` is a selectable-roster chunky Pepe fighting prototype with local PvP and a CPU tournament mode.

The fighter art uses generated transparent sprites under `assets/pepe-relic-rumble/`, derived from the user's chunky Pepe brawler reference. Chroma-key sources are kept beside the final PNGs for regeneration/audit.
The stage uses a generated side-view Pepe arena background at `assets/pepe-relic-rumble/pepe-arena.png`.

Core loop:

1. Choose from Crown, Corrupt, Fallen, Emerald, Bandit, Ninja, Mecha, or Berserk Pepe for each side.
2. Launch local PvP (first to three) or Tournament Rumble (two CPU bouts, first to two each).
3. Move, jump, punch, kick, block, and charge relic energy.
4. Spend full energy on a short-range relic burst.
5. Win the match or clear the tournament roster to record a local arcade result.

Controls:

- Player 1: `WASD` move, `F` punch, `G` kick, `H` block or relic burst.
- Player 2: arrow keys move, `J` punch, `K` kick, `L` block or relic burst.
- Tournament: Player 1 uses the normal controls while the CPU controls each rival.

Fallen Pepe's supplied reference, generated chroma-key source, and transparent game asset are retained together under `assets/pepe-relic-rumble/` for auditability.
Emerald Pepe's generated chroma-key source and transparent game asset are retained in the same folder.
Bandit, Ninja, Mecha, and Berserk Pepe follow the same auditable source-plus-transparent-asset convention.

Current roster identities:

- `Crown Pepe`: original vault champion.
- `Corrupt Pepe`: red-energy rival.
- `Fallen Pepe`: red-crystal fallen warrior.
- `Emerald Pepe`: gold-trimmed emerald guardian.
- `Bandit Pepe`: shard outlaw with a holstered relic blaster.
- `Ninja Pepe`: emerald-shadow fighter with forearm shard blades.
- `Mecha Pepe`: reactor-powered vault defense unit.
- `Berserk Pepe`: unchained emerald-fury bruiser.

All fighters currently share the same combat statistics. Character-specific move balance remains gated on real playtesting.

## Concept

Players collect fictional `Emerald Shards`, spend them on infrastructure, use infrastructure to generate passive production, then acquire businesses and vault upgrades to compound the shard engine.

This is intentionally a game economy only. Shards are not real ETC, not a financial reward, and not connected to wallets.

## MVP Loop

1. Click the emerald shard cluster to earn shards.
2. Buy `Sharper Hands` to improve click income.
3. Buy `Emerald Rails` to generate passive shard flow.
4. Buy `Shard Businesses` to compound production and empire value.
5. Add `Media Studio`, `Acquisition Desk`, `Research Lab`, and `Market Building` upgrades for IP, deal-flow, automation, and dead-LP revival layers.
6. Buy `OG Vault` upgrades for late-game multipliers.
7. Reach `Ancient OG`, prestige into `OG Points`, and start the next run with a stronger multiplier.

The first prestige is intentionally capped at `+1 OG Point` so players enter the prestige ladder as `Emerald Initiate`. Later prestiges scale with total earned and gentler vault bonuses.

## Shard Rush

`shard-rush.html` is the second mini game: a 60-second arcade sprint where players move a vault collector, catch green market objects, and dodge red hazards.

Core loop:

1. Start a 60-second sprint.
2. Catch emerald shards, liquidity orbs, candle boosts, dead LP fragments, and combo tokens.
3. Avoid red FUD blocks and broken bot hazards.
4. Build score, combo, and end-run rank.

Controls: mouse, touch, arrow keys, or `A` / `D`.

## Emerald Hands Events

Emerald Hands includes occasional event-card moments above the rank progress bar:

- `Emerald Sage of Rage`: a rare 30-second 2x click and passive shard frenzy with red/orange lightning on the progress bar.
- `Corrupted Shards`: a negative 30-second efficiency event with dark galaxy-purple lightning. Clicks and shards/sec run at 80% efficiency.
- `Emerald Flush`: a regenerative shard mine acquisition that pays a capped empire-relative shard drop and boosts shards/sec by 10-20% for 45 seconds.
- `Sage's Due Diligence`: a scroll-choice event. `Scroll of Volatile Dominion` offers bigger upside with controlled downside risk; `Scroll of Steward's Yield` offers a smaller guaranteed payout and clean passive boost.

Cadence target: standard market signals should be the usual rhythm, `Emerald Flush` should appear sometimes, `Corrupted Shards` should lightly counterbalance boosts, scroll choices should feel like a notable decision, and `Emerald Sage of Rage` should be the rare hype event. The scheduler uses weighted eligibility, per-event cooldowns, and an anti-clump penalty after special events.

## Emerald Galactic Heroes

`emerald-galactic-heroes.html` is an arcade shooter where players defend the emerald sector from fictional rival gas empire ships.

Core loop:

1. Launch the hero ship.
2. Auto-fire emerald lasers.
3. Dodge purple enemy shots and red FUD meteors.
4. Collect shield and shard bomb power-ups.
5. Survive waves and boss cruisers for score and rank.

Controls: mouse, touch, arrow keys, or `WASD`.

Enemy lasers reduce regenerating shield charge. Physical ship collisions consume shield cells.
If shield charge hits zero, one shield cell breaks and the charge restarts low. Weapons auto-upgrade from `Mk I` through `Mk IV` as score and waves climb. Destroyed ships can drop sparse reachable pickups, including a `Wingmen Beacon` that adds two ally fighters for 30 seconds; beacon drops become rarer at higher weapon tiers.
The shooter now includes boss warnings, weapon-upgrade popups, pickup text, hit feedback, and end-run stat summaries.

## How To Run

Open `index.html` in a browser for the full arcade hub, or `emerald-hands.html` to jump straight into Emerald Hands.

No build step is required.

Run `npm test` for the dependency-free smoke suite. It verifies all eight pages, local asset references, shared arcade contracts, hub-return navigation, and JavaScript syntax.

## Deploy To Render

This repo is Render-ready as a static site.

1. Push the latest `master` branch to GitHub.
2. Open Render's Blueprint flow: https://dashboard.render.com/blueprint/new
3. Connect the GitHub repo that contains this project.
4. Apply the `render.yaml` Blueprint.

Render should create one static web service:

- Name: `emerald-arcade`
- Runtime: `static`
- Publish path: `.`
- Build command: none

## Assumptions And Risks

- This is an entertainment prototype, not financial software.
- All shard balances are local browser state in `localStorage`.
- `OG Points` are also fictional local progress and do not represent ownership, tokens, or yield.
- Arcade XP, badges, daily challenges, and best scores are local cosmetic progress only.
- Session analytics are stored locally and track starts, completions, retries, total play seconds, and the last-played game. They are not network analytics.
- Tower mastery is persistent but cosmetic: placement and upgrade counts produce Recruit, Operator, Veteran, and Legend labels without changing combat balance.
- Real wallet integration, real token rewards, staking, yield, sweepstakes, or gambling-style mechanics would require legal and security review.
- The generated art is project-local under `assets/` and should be replaced or licensed intentionally before commercial distribution.

## Next Steps

- Run five-to-ten-player replay testing and compare the local starts/completions/retries signals before adding a ninth game.
- Balance Tournament Rumble only after observing human play; the three fighters intentionally share the same combat stats today.
- Add mobile fighting controls and richer sound design.
- Add a leaderboard only after spam, authentication, privacy, and abuse risks are scoped.
