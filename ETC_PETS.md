# ETC Pets inventory repair and sanctuary refresh — October 12, 2026

## Confirmed inventory overwrite

The shared companion kept a cached pet save and wrote that whole object during roaming every 5.2 seconds. An older arcade tab could overwrite newer purchases, training, food and joy from another tab. Selecting a pet from stale cached state had the same risk. The old controller reproduces the regression: three remaining sticks and improved stats are replaced with the old one-stick/default-stats snapshot.

Roaming now reloads the current state and changes only its visual position; it does not write inventory or stats. Pet selection reloads before saving. Storage events refresh other tabs' pet displays. Consumer HTML references use the new shared-script version. Existing open tabs must be refreshed to replace already-loaded old code. This prevents future overwrites; it does not invent balances or reconstruct previously lost purchases.

## Care behavior and presentation

Feed consumes one shoot, Play consumes no supplies, Train consumes exactly one stick, and buying a stick adds one for the existing 18-shard cost. Messages now state resource use and remaining stock. Empty/unaffordable actions disable and selection exposes pressed state. A persistent desktop supply panel, clearer care cards, two-column roster, readable full pet names, better phone spacing and reduced-motion support refresh the sanctuary using its existing artwork. The pet identity stays clear of the desktop arcade dock. Costs, stats, unlocks and assists are unchanged.

## Arcade cards

Tower Defense, Paradox, Wars and Pets descriptions/tags now match their current playable features. Tower Defense uses the generated courtyard, Wars features the new corrupt citadel, Paradox describes Bamboo Mountains rather than Emerald Forest, and Pets gets a centered single-frame artwork crop and supply/training copy. Game-save isolation and discovery controls are unchanged.

## Verification

Root smoke and 196 behavior tests pass, including three new actual shared-controller tests with two VM tabs sharing storage. Tests check old roaming cannot write over inventory, pet selection reloads state, exact care consumption and insufficient-funds buying. Against the prior controller these regressions fail, confirming the cause rather than only asserting the new code.

Native browser checks use an isolated origin and two tabs: starting at 60 shards, buying three sticks, feeding, playing and training leaves six shards, one shoot and three sticks. Reload retains those balances. A second tab's pet picker shows the same counts while its roaming position changes. Desktop and 390px phone layout were inspected; phone page width is 375px without overflow. Physical-device testing remains separate. User-origin saves were not modified during QA.

Evidence: [desktop sanctuary](docs/pets-and-cards-2026-10-12/sanctuary-desktop.png), [phone care controls](docs/pets-and-cards-2026-10-12/supplies-phone.png).
