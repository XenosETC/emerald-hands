# Idle game screen strategy

## Findings and changes

Hands' existing modal allowed all eight purchases at 320×568, 390×844, 844×390 and 1440×900 in browser tests. A blocked purchase was not reproduced. The actual usability problem was a long, repetitive shop with the available balance outside the modal: approximately 2,456px of content on the smallest phone and 2,200px on desktop. The compact cards and desktop two-column grid reduce the latter to approximately 811px. Upgrade shortcuts jump directly to a chosen business and focus its real purchase button. The wallet remains visible while the bounded panel scrolls. Bulk quantity stays in the shop header. Progress retains the prestige/reset and save actions.

Satoshi already contains a guided Genesis Orbit objective. The screen adapter had moved that advice into System, separating it from the player's immediate action. A visible Next button now opens Build, where the full existing advice and a sticky treasury balance are available. The same game-generated advice updates after purchases; it is not a second progression model.

The collector/Genesis Star and the live world remain on the main game screen. Long management and explanatory content scroll inside the modal. The document itself stays bounded. Modal Done, Escape, tabs and return focus retain their existing behavior. These changes do not alter prices, production, prestige, save keys, balances, or reset semantics. The screen adapter observes rendered game values rather than editing economy state.

## Satoshi recommendation

The current simulation has coherent accounting but too many concepts between the first click and a satisfying visible outcome. More statistics will not solve that. Build a separate small playable prototype around **route, deliver, expand**:

1. Select a visible route on a small illustrated network.
2. Time a launch or redirect a delivery around a clear hazard.
3. Watch a courier reach a world and receive a readable fictional reward.
4. Choose one upgrade: faster travel, a safer route, or a new destination.
5. Finish a short sector with a visible event and a new destination reveal.

Start with three worlds, one courier, one hazard and one five-minute sector. Keep a single spendable fictional resource. Treat price charts, reserve ratios and simulated regimes as optional later flavor if they improve decisions. Test whether the route interaction is enjoyable before generating a large asset set or expanding the economy.

Retain the current simulation as a playable legacy mode while evaluating the prototype. Give the prototype an independent versioned save key. Do not silently convert accumulated Treasury, upgrades, or arcade records. If the replacement proves better, offer an explicit opt-in import that preserves the old save and grants a clearly described cosmetic legacy badge; any currency conversion requires a separate product decision. Existing saves must remain exportable and recoverable.

## Verification and limits

Funded browser fixtures test every Hands purchase and the six Satoshi build actions at the four sizes above, including persisted Satoshi progression and its supply invariant. Existing screen regressions cover Hands, Satoshi, Tower Defense, Pepe Wars and Rocket Simulator. Unit suites cover the existing economy and save recovery behavior. Seeded purchases are layout/persistence evidence; they do not establish campaign balance, physical-device touch quality, or long-session fun. The new Satoshi loop described above is a recommendation, not implemented gameplay.
