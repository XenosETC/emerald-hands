# Emerald Hands

Premium small ETC-inspired idle/clicker mini game.

Open `mini-games.html` for the ETC Mini Games Lab hub.

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

## Shard Rush

`shard-rush.html` is the second mini game: a 60-second arcade sprint where players move a vault collector, catch green market objects, and dodge red hazards.

Core loop:

1. Start a 60-second sprint.
2. Catch emerald shards, liquidity orbs, candle boosts, dead LP fragments, and combo tokens.
3. Avoid red FUD blocks and broken bot hazards.
4. Build score, combo, and end-run rank.

Controls: mouse, touch, arrow keys, or `A` / `D`.

## Emerald Galactic Heroes

`emerald-galactic-heroes.html` is the third mini game: an arcade shooter where players defend the emerald sector from fictional rival gas empire ships.

Core loop:

1. Launch the hero ship.
2. Auto-fire emerald lasers.
3. Dodge purple enemy shots and red FUD meteors.
4. Collect shield and shard bomb power-ups.
5. Survive waves and boss cruisers for score and rank.

Controls: mouse, touch, arrow keys, or `WASD`.

Enemy lasers reduce regenerating shield charge. Physical ship collisions consume shield cells.

## How To Run

Open `mini-games.html` in a browser for the full arcade hub, or `index.html` to jump straight into Emerald Hands.

No build step is required.

## Deploy To Render

This repo is Render-ready as a static site.

1. Push the latest `master` branch to GitHub.
2. Open Render's Blueprint flow: https://dashboard.render.com/blueprint/new
3. Connect `https://github.com/XenosETC/emerald-hands`.
4. Apply the `render.yaml` Blueprint.

Render should create one static web service:

- Name: `emerald-hands`
- Runtime: `static`
- Publish path: `.`
- Build command: none

## Assumptions And Risks

- This is an entertainment prototype, not financial software.
- All shard balances are local browser state in `localStorage`.
- `OG Points` are also fictional local progress and do not represent ownership, tokens, or yield.
- Real wallet integration, real token rewards, staking, yield, sweepstakes, or gambling-style mechanics would require legal and security review.
- The generated art is project-local under `assets/` and should be replaced or licensed intentionally before commercial distribution.

## Next Steps

- Add mobile haptics and richer sound design.
- Add clearer prestige celebration art and sound.
- Add more business categories, like cloud infra, treasury desk, creator network, and game studio.
- Add a leaderboard only after spam, auth, and abuse risks are scoped.
