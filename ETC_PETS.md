# ETC Pets inventory repair and sanctuary refresh — October 12, 2026

## Confirmed inventory overwrite

The shared companion kept a cached pet save and wrote that whole object during roaming every 5.2 seconds. An older arcade tab could overwrite newer purchases, training, food and joy from another tab. Selecting a pet from stale cached state had the same risk. The old controller reproduces the regression: three remaining sticks and improved stats are replaced with the old one-stick/default-stats snapshot.

Roaming now reloads the current state and changes only its visual position; it does not write inventory or stats. Pet selection reloads before saving. Storage events refresh other tabs' pet displays. Consumer HTML references use the new shared-script version. Existing open tabs must be refreshed to replace already-loaded old code. This prevents future overwrites; it does not invent balances or reconstruct previously lost purchases.

## Care behavior and presentation

Feed consumes one shoot, Play consumes no supplies, Train consumes exactly one stick, and buying a stick adds one for the existing 18-shard cost. Messages now state resource use and remaining stock. Empty/unaffordable actions disable and selection exposes pressed state. A persistent desktop supply panel, clearer care cards, two-column roster, readable full pet names, better phone spacing and reduced-motion support refresh the sanctuary using its existing artwork. The pet identity stays clear of the desktop arcade dock. Costs, stats, unlocks and assists are unchanged.

## Arcade cards

Tower Defense, Paradox, Wars and Pets descriptions/tags now match their current playable features. Tower Defense uses the generated courtyard, Wars features the new corrupt citadel, Paradox describes Bamboo Mountains rather than Emerald Forest, and Pets gets a centered single-frame artwork crop and supply/training copy. Game-save isolation and discovery controls are unchanged.

## Verification

Root smoke and 207 behavior tests pass, including three new actual shared-controller tests with two VM tabs sharing storage. Tests check old roaming cannot write over inventory, pet selection reloads state, exact care consumption and insufficient-funds buying. Against the prior controller these regressions fail, confirming the cause rather than only asserting the new code.

Native browser checks use an isolated origin and two tabs: starting at 60 shards, buying three sticks, feeding, playing and training leaves six shards, one shoot and three sticks. Reload retains those balances. A second tab's pet picker shows the same counts while its roaming position changes. Desktop and 390px phone layout were inspected; phone page width is 375px without overflow. Physical-device testing remains separate. User-origin saves were not modified during QA.

Evidence: [desktop sanctuary](docs/pets-and-cards-2026-10-12/sanctuary-desktop.png), [phone care controls](docs/pets-and-cards-2026-10-12/supplies-phone.png).

## Blocked-storage spending guard

Supply purchases and pet unlocks now check that the pet store can accept an unchanged write before charging Arcade Shards. Persistent storage failure returns a clear stopped-purchase message and does not invoke wallet spending. A controller fixture verifies both operations preserve the wallet and stored pet state when writes are blocked. Shared script references were updated across consumer pages. Costs, unlocks and successful purchase behavior are unchanged.

This preflight protects persistent unavailability; it is not an atomic transaction across the wallet and pet storage keys and does not guarantee recovery from a failure occurring after the preflight. The recoverable-purchase section below supersedes this limitation for new purchases after the updated controllers load.

## Visible training progression

The sanctuary now displays XP to the next strength level, the number of ten-XP sticks needed, and an accessible within-level progress meter. It uses the existing quadratic XP thresholds and level-25 cap; costs and XP per training are unchanged. Training at the cap is now rejected without consuming sticks, rather than spending supplies without gaining strength. Play/feed remain available.

Controller fixtures verify level boundaries, stick requirements and capped training preserving inventory. Native training from the starter state consumes its one stick, reaches level 2 and displays 30 XP / three sticks to level 3. Consumer scripts are cache-busted to load the helper and cap guard consistently.

## Roster unlock and selection clarity

The roster reports unlocked companions out of eight and explains shared supplies versus individual strength. Unaffordable locked companions disable. Unknown care actions and companion IDs are rejected without aura gains or spending. Existing unlock prices are unchanged.

A controller fixture uses a 500-shard test budget, trains Pepe, unlocks Wojak for 90 once, switches pets, buys one stick and trains Wojak. Each retains level 2 individually, shared sticks reach zero, and a fresh tab retains the selection. A second fixture verifies unknown actions/IDs leave saves and wallet unchanged. This is fixture-funded unlock evidence, not a native earned-shard unlock journey.

## Visible supported-game assists

The sanctuary displays the selected pet’s actual Rush magnet radius, Paradox collection radius and Rocket salvage percentage, with care-factor feedback and cap wording. This uses existing bonus rules, not new effects. The assist panel remains available on shorter desktop windows. A controller fixture verifies low-care level-five range is four pixels, feed/play restore it to eight, sticks remain unchanged and maximum bonuses stay at 24px / 15%. Fixture XP/care values are seeded, not an earned native progression journey.


## Failed care saves

Feed, play and train now return a failed-care receipt when the pet write fails, restoring the controller snapshot. Saved supplies, strength and aura remain intact; retrying after storage recovers applies the action once. Controller fixtures inject quota-style failure for all three actions and verify saved state, in-memory sticks and retries. This does not resolve the separate wallet/pet purchase transaction recovery gate.


## Recoverable purchases

New purchases save the shard debit and cumulative supply or companion grant together in the wallet key. Pet loading reconciles these totals against its previously applied totals; successful care saves record the reconciliation. If the pet write fails after charging, the UI reports a secured delivery and a fresh load recovers it without charging again. Wallet write failure stops the purchase. Existing inventory and legacy purchases are untouched; no historical refund is inferred. Refresh all arcade tabs for the new shared controllers.

Controller fixtures cover delayed supply/unlock delivery, reloads without duplicate grants, and actual wallet write failure preserving its serialized state. This remains localStorage persistence, not a server transaction: simultaneous writes across tabs, manual deletion of only one save key, and external clearing of browser data remain separate limitations. Normal full arcade reset clears both keys.

Native isolated-browser check: buying one stick leaves 42 shards and two sticks after reload; training leaves one stick, level 2 and the same 42 shards after a second reload. No user-origin saves were changed.


## Companion adventure links and integrated recovery checks

The live assist panel now links directly to Shard Rush, Pepe’s Paradox and Rocket Simulator, with the relevant bonus type beside each destination. Navigation does not write game progress or award shards. Tests now execute both shipped shared controllers together, covering basket purchases, feeding, training, insufficient funds, fresh-tab state and a pet-save quota failure after a real wallet charge. These strengthen recovery evidence without asserting simultaneous-write protection.


## Save field validation

Pet loading normalizes supply counts and XP to finite nonnegative integers, clamps food and joy to 0–100, and filters unknown companion IDs. Valid numeric legacy values and training-derived XP remain supported. Invalid XP becomes zero, invalid care uses starter care defaults, and negative supplies become zero; no historical reimbursement is inferred. Regression fixtures cover damaged fields alongside retained valid legacy progress. Malformed whole-file JSON and cross-tab simultaneous writes remain separate recovery limitations.


## Unreadable save protection

Malformed JSON, null and array-valued pet saves now block care, selection and purchases while retaining the original stored text. Care returns an explicit stopped-action receipt. The display may show starter fallback values, but those are not persisted over the damaged save. Fixtures verify all three malformed shapes retain their exact bytes and wallet balance. Automatic reconstruction is not implemented; restore a known-good save before resuming.
