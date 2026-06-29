# Emerald Hands

Premium small ETC-inspired idle/clicker mini game.

## Concept

Players collect fictional `Emerald Shards`, spend them on infrastructure, use infrastructure to generate passive production, then acquire businesses and vault upgrades to compound the shard engine.

This is intentionally a game economy only. Shards are not real ETC, not a financial reward, and not connected to wallets.

## MVP Loop

1. Click the emerald shard cluster to earn shards.
2. Buy `Sharper Hands` to improve click income.
3. Buy `Emerald Rails` to generate passive shard flow.
4. Buy `Shard Businesses` to compound production and empire value.
5. Add `Media Studio`, `Acquisition Desk`, and `Research Lab` upgrades for IP, deal-flow, and automation layers.
6. Buy `OG Vault` upgrades for late-game multipliers.
7. Reach `Ancient OG`, prestige into `OG Points`, and start the next run with a stronger multiplier.

## How To Run

Open `index.html` in a browser.

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
