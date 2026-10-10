# Emerald Arcade

Local-first sixteen-game arcade portfolio with ETC-inspired games, Pepe Legends prototypes, and one institutionally separate Bitcoin-themed guest simulation.

Open `index.html` for the ETC Mini Games Lab hub. `emerald-hands.html` opens the idle/clicker game directly.

## Browser game release — October 5, 2026

The sixteen-game hub includes four new browser prototypes: Satoshi System, Pepe Soul World (`pepe-soul-world/index.html`), Pepe Temple Run (`pepe-temple-run/index.html`), and Pepe Feudalism (`pepe-feudalism/index.html`). The three independent Pepe games preserve their own gameplay and saves without shared arcade rewards. Native Unreal/Godot projects, local galleries, and historical screenshots are outside this web release.

Temple Run ships its Crown runner model, environment assets, and local Three.js dependency with the vendor license. Serve the site over HTTP for module-based games; no build is required. Test the collection with `npm test`, Soul World with `npm test --prefix pepe-soul-world`, Feudalism with `npm test --prefix pepe-feudalism`, and Temple Run with `node --test pepe-temple-run/*-test.mjs`.

## Personal arcade library

### Continue playing — October 10, 2026

The hub now shows saved Soul World checkpoints and objectives, Feudalism warbands and contracts, and Temple Run distance records. Its Continue playing shelf combines recent openings with existing saved journeys, while Daily Vault return links remember the selected mode. These summaries only read each game's own save. See [CONTINUE_PLAYING.md](CONTINUE_PLAYING.md) for behavior, save boundaries and verification.

### Arcade refresh — October 7, 2026

**Daily Vault:** Shard Rush now offers a fixed daily course with three escalating waves, Bronze/Silver/Gold targets, retry comparisons, and a local daily best shown on the hub. Select Daily Vault or open `shard-rush.html?mode=daily`. See [DAILY_VAULT.md](DAILY_VAULT.md) for rules, save boundaries and testing.

**Best-run ghost — October 8:** Completed daily bests now save an optional ghost collector and score pace for the next attempt. Race your own route, toggle its visibility, and track whether you are ahead or behind. Existing records need a matching or better completed run to create a replay. Reduced motion defaults it off.

The hub now features Temple Run, distinct covers for the three independent Pepe games, and quick routes into arcade, adventure, and idle collections. Visible game tags are searchable, and the return link follows actual play history. Phone layouts bring the collection closer to the top; local arcade records sit together below the games.

Shard Rush has catch/combo/hazard feedback, a next-rank score meter, direct Start/Play again controls, reliable keyboard/drag handoff, and a laptop-sized playfield. Its existing scores, rewards, rank thresholds, and 60-second simulation remain unchanged. Shared controls release held input on pause, provide a visible Resume button, return keyboard focus to canvas games, and support keyboard navigation inside Controls. Replay clocks were repaired in Shard Rush, Galactic Heroes, PepeCoin Run, Space Unchained, Wars, and Tower Defense; canceled animation requests stay canceled after pausing.

The “What’s new” section links directly to the refreshed games. Soul World now includes sword guard poses, Spirit-based frontal blocking, and immediate guard-to-counter input. Its game and save remain independent of shared arcade rewards.

Run `npm test` for the sixteen-page smoke check and 72 behavior tests, and `npm test --prefix pepe-soul-world` for Soul World’s combat suite. See [ARCADE_REFRESH.md](ARCADE_REFRESH.md) for the earlier refresh scope and [DAILY_VAULT.md](DAILY_VAULT.md) for the daily challenge. Hosted deployment has not been verified.

### Browsing your collection

Save any game with its star button, then use Favorites to see your collection. Continue playing lists up to four recent games and fills unused slots with supported saved journeys. The hero's Return link follows your latest game. Openings are navigation history; they do not claim completed runs or change game rewards.

All sixteen games share one navigation catalog with genre and control metadata. Search supports titles, descriptions and controls; genre, favorites and touch filters combine. Sort by featured order, title or recently opened. Pick a game chooses only from the visible results. Filters are preserved in the page URL for reload and browser Back.

Favorites and recent openings use only `emerald-library-v1`. Existing game saves, currencies and shared arcade progress stay separate. Library preferences are device/browser-local and are not a cloud backup. If browser storage is blocked or full, browsing still works and favorite changes display an unsaved notice. `npm test` covers catalog/page integration, history, favorites, filter intersections, invalid storage, and save isolation.

## Satoshi System

`satoshi-system.html` is a flagship one-click guest Monetary Systems Lab game with an Emerald Hands-inspired click-buy-grow rhythm and completely separate state and semantics. Each click advances a saved fictional clock, routes integer simulated sats, and moves a transparent Bull, Balanced, or Bear market-weather model. Players keep sats liquid or deploy them into repeatable Routing Efficiency and Productive World levels, two resilience upgrades, and one expansion gate. Six derived system ranks make long-run progress visible without adding prestige or another currency.

Its fixed-supply ledger is closed-loop and local: global issued supply always equals circulation plus the player treasury. Business income transfers already-issued sats; purchases return sats to circulation; and an accelerated first emission epoch contracts the click reward from 8 to 4 sats.

The visible fictional `Network Maturity` curve is independent of price weather. At tick 60 with Relay Moon connected, the next Merchant Planet level costs 10% fewer sats; after Epoch II with Merchant Planet connected, the next Forge World level costs 15% fewer sats. Level costs still grow exponentially, availability gates remain, and operating load rises with every productive level. These are game-balancing unlocks, not purchasing-power forecasts.

`Return on Satoshis (ROS)` is intentionally deferred beyond this first slice. If added later, it should appear only as separate cycle-based capacity, commerce, resilience, and optionality signals—never as ROI, expected performance, or one optimization score.

Satoshi System has its own save, branding, currency semantics, and disclosures. It has no wallet, custody, trading, live data, real money, offline income, financial advice, or exchange with ETC or other arcade currencies.

The shared runtime records guest sessions and best results for navigation only: Satoshi System awards no arcade shards, XP, or ETC badges, and receives no pet assists. Its Reset Simulation action clears only its own save; the arcade-wide reset preserves that save. Press `Space` to route sats, `P` to pause, `M` to mute, or `R` to reload the saved simulation.

Every build is an outright closed-loop spend of fictional sats from the player Treasury back into the Circulation Belt. The MVP has no Bitcoin collateral, borrowing, loan, liquidation, leverage, margin, interest, loan-to-value, or real financing analogue.

The hub reads local arcade progress from `localStorage`: arcade XP, badges, best runs, a rotating daily challenge, the last-played game, and privacy-friendly session signals. This is cosmetic/local only; nothing is transmitted.

## Arcade Badges

The hub includes an eighteen-badge cosmetic trophy cabinet with generated emerald/gold medallion art under `assets/badges/` and selected game art.

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
13. `Vault Champion`: win the Relic Rumble tournament and its KEK Domain final.
14. `Rage-Bait Survivor`: clear Bamboo Mountains.
15. `Emerald Singularity`: lock a fictional $30K+ lore price in Unstable Launch.
16. `Origin Voyager`: reach 100K km in Rocket Simulator.
17. `Aura Farmer`: raise an arcade pet to 200 aura.
18. `Bamboo Disciple`: train a pet to Strength Level 2.

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

Run `npm test` for the dependency-free smoke suite. It verifies all sixteen game pages, local asset references, shared arcade contracts, hub-return navigation, JavaScript syntax, and Satoshi progression and save isolation.

## Design polish — September 2026

The hub includes title search, five genre filters, a separate Satoshi guest card, and expandable trophies and play history. Existing artwork is reused; the Satoshi cosmos image was copied from its earlier working copy.

All twelve Emerald games share `game-polish.css` for readable controls, focus states, play guides, and responsive presentation. Mobile HUDs and long introductions flow outside the proportionally scaled playfields. Rumble and Paradox still require a keyboard. Satoshi has a separate copper observatory design, a mobile-first upgrade order, and expandable system records.

See `DESIGN_POLISH.md` for scope, verification and the next playtest.

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

- Run five-to-ten-player replay testing and compare the local starts/completions/retries signals before expanding the collection.
- Balance Tournament Rumble only after observing human play; the eight fighters currently share baseline combat statistics.
- Add mobile fighting controls and richer sound design.
- Add a leaderboard only after spam, authentication, privacy, and abuse risks are scoped.
