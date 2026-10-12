# ETC Pets inventory repair and sanctuary refresh — October 12, 2026

## Confirmed inventory overwrite

The shared companion kept a cached pet save and wrote that whole object during roaming every 5.2 seconds. An older arcade tab could overwrite newer purchases, training, food and joy from another tab. Selecting a pet from stale cached state had the same risk. The old controller reproduces the regression: three remaining sticks and improved stats are replaced with the old one-stick/default-stats snapshot.

Roaming now reloads the current state and changes only its visual position; it does not write inventory or stats. Pet selection reloads before saving. Storage events refresh other tabs' pet displays. Consumer HTML references use the new shared-script version. Existing open tabs must be refreshed to replace already-loaded old code. This prevents future overwrites; it does not invent balances or reconstruct previously lost purchases.

## Care behavior and presentation

Feed consumes one shoot, Play consumes no supplies, Train consumes exactly one stick, and buying a stick adds one for the existing 18-shard cost. Messages now state resource use and remaining stock. Empty/unaffordable actions disable and selection exposes pressed state. A persistent desktop supply panel, clearer care cards, two-column roster, readable full pet names, better phone spacing and reduced-motion support refresh the sanctuary using its existing artwork. The pet identity stays clear of the desktop arcade dock. Costs, stats, unlocks and assists are unchanged.

## Arcade cards

Tower Defense, Paradox, Wars and Pets descriptions/tags now match their current playable features. Tower Defense uses the generated courtyard, Wars features the new corrupt citadel, Paradox describes Bamboo Mountains rather than Emerald Forest, and Pets gets a centered single-frame artwork crop and supply/training copy. Game-save isolation and discovery controls are unchanged.

## Verification

Root smoke and 206 behavior tests pass, including three new actual shared-controller tests with two VM tabs sharing storage. Tests check old roaming cannot write over inventory, pet selection reloads state, exact care consumption and insufficient-funds buying. Against the prior controller these regressions fail, confirming the cause rather than only asserting the new code.

Native browser checks use an isolated origin and two tabs: starting at 60 shards, buying three sticks, feeding, playing and training leaves six shards, one shoot and three sticks. Reload retains those balances. A second tab's pet picker shows the same counts while its roaming position changes. Desktop and 390px phone layout were inspected; phone page width is 375px without overflow. Physical-device testing remains separate. User-origin saves were not modified during QA.

Evidence: [desktop sanctuary](docs/pets-and-cards-2026-10-12/sanctuary-desktop.png), [phone care controls](docs/pets-and-cards-2026-10-12/supplies-phone.png).

## Blocked-storage spending guard

Supply purchases and pet unlocks now check that the pet store can accept an unchanged write before charging Arcade Shards. Persistent storage failure returns a clear stopped-purchase message and does not invoke wallet spending. A controller fixture verifies both operations preserve the wallet and stored pet state when writes are blocked. Shared script references were updated across consumer pages. Costs, unlocks and successful purchase behavior are unchanged.

This preflight protects persistent unavailability; it is not an atomic transaction across the wallet and pet storage keys and does not guarantee recovery from a failure occurring after the preflight. More comprehensive transaction recovery remains a separate engineering gate.

## Visible training progression

The sanctuary now displays XP to the next strength level, the number of ten-XP sticks needed, and an accessible within-level progress meter. It uses the existing quadratic XP thresholds and level-25 cap; costs and XP per training are unchanged. Training at the cap is now rejected without consuming sticks, rather than spending supplies without gaining strength. Play/feed remain available.

Controller fixtures verify level boundaries, stick requirements and capped training preserving inventory. Native training from the starter state consumes its one stick, reaches level 2 and displays 30 XP / three sticks to level 3. Consumer scripts are cache-busted to load the helper and cap guard consistently.

## Roster unlock and selection clarity

The roster reports unlocked companions out of eight and explains shared supplies versus individual strength. Unaffordable locked companions disable. Unknown care actions and companion IDs are rejected without aura gains or spending. Existing unlock prices are unchanged.

A controller fixture uses a 500-shard test budget, trains Pepe, unlocks Wojak for 90 once, switches pets, buys one stick and trains Wojak. Each retains level 2 individually, shared sticks reach zero, and a fresh tab retains the selection. A second fixture verifies unknown actions/IDs leave saves and wallet unchanged. This is fixture-funded unlock evidence, not a native earned-shard unlock journey.
