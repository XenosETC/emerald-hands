# Pepe Feudalism - The Emerald Marches

A single-screen, standalone browser RPG prototype. All changes and assets stay within `pepe-feudalism`; existing arcade and Rumble assets remain intact.

## Play

Open http://127.0.0.1:4173/pepe-feudalism/index.html while the arcade server runs, or use `Play Pepe Feudalism.cmd`. From workspace root: `node scripts/dev-server.mjs`.

Start in Crownhaven. Open its quest board, accept Raiders in the Briar, recruit at the barracks, then open the world map. Select Briar Forest, travel, and enter the encounter. Win, collect loot, travel back, and claim the local contract reward.

## World and controls

- 3000 x 1800 world space, 18 connected destinations, twelve local contracts.
- Towns: Crownhaven, Mossford, Frostford. Castles: Sunspire, Reedwatch, Ashfang Keep. Ports: Tideharbor, Eastwatch. Encounters: Briar Forest, Elderwood, Jadefall, Moonwell Ruins.
- Drag to pan; wheel or + / - to zoom. Overview shows the region. Find Crown recenters the map.
- Select a landmark, then Travel. Crown follows the connected road network; location saves on arrival. Reloading while traveling returns to the last arrived stop.
- C opens Crown's attribute scroll; I opens inventory on the right; J opens quests; M opens the map outside battle. Escape closes a scroll.
- Town buildings and bottom buttons open quest boards, barracks, forge, or gate. There is no persistent sidebar or document scroll; long parchment contents scroll inside the game.
- Combat: WASD / ground click moves, enemy click / Space attacks, Q sweeps, E rallies, 1-4 gives army orders, P pauses. Open scrolls pause combat and restore the prior pause state on closing.

## Skills, loot and quests

Two attribute points per level. Bonuses apply to the next battle. STR adds 3 melee damage; DEX adds 4 movement and reduces weapon recovery 2%; VIT adds 12 maximum HP; INT adds 5 Sweep damage; WIS adds 4 Rally healing and reduces ability recovery 2%. Recovery reductions cap at 50%. These are provisional rules.

Victories add jade/steel salvage and healing draughts to the 60-item inventory. Sell salvage at settlements, switch owned equipment while resting outside battle/travel, or consume a draught in battle to restore 80 HP. Potion use saves consumption immediately; battle progress itself is not saved.

Accept contracts at their issuing town/castle/port. A gold diamond marks an active objective; a green diamond marks a board ready to pay. Victory at the target makes the contract ready. Return to its issuing settlement to claim the reward once. Three active contracts are allowed at once. Newly captured castles offer contracts too.

## Existing campaign

Capture Reedwatch to unlock Crown Guards, then conquer Ashfang Keep. Troop casualties persist, surviving victories grant ranks through Recruit / Seasoned / Veteran / Elite. Each rank adds 15 HP and 2 attack; rank caps at 3. Crown recovers between battles. Prices, rewards, growth, ability bonuses and troop stats are provisional balance assumptions.

Longsword: 25 base damage / 68 reach / .48s recovery. Spear: 22 / 112 / .58s, 65 gold. Axe: 42 / 60 / .78s, 90 gold. Guardian Mace: 34 / 66 / .65s, 120 gold. Tidefang Dagger: 18 / 48 / .30s, 55 gold. Forge upgrades add 12 damage to every weapon, including future recoveries.

## Armory and regional weapon recovery

Inventory and forge use Weapons, Armor and Shields categories; inventory also has Battle loot for draughts and trade goods. Inventory shows Crown's current worn sprite beside all three gear slots. Cards compare actual next-battle stats against current gear, including STR, DEX and weapon upgrades. Green/red signed changes show the tradeoff; lower recovery is favorable. Weapon icons share the clean held-item crops at a readable inventory size. Changing categories keeps keyboard focus inside the scroll.

Every listed weapon remains purchasable at settlement forges. Four encounters also guarantee a first recovery:

| Victory location | Weapon recovered |
| --- | --- |
| Elderwood Grove | Frog Guardian Mace |
| Moonwell Ruins | Tidefang Dagger |
| Jadefall Forest | Jade War Spear |
| Ashveil Grove | Ashbreaker Axe |

Recovery adds ownership without spending gold, replacing current gear, or duplicating an owned weapon. The scout scroll previews an unowned reward, and the forge can show its destination on the map. Victory reports and the campaign chronicle record the item. **Inspect recovered equipment** opens the relevant inventory category directly. Old saves remain valid; already completed repeatable encounters can be revisited for unowned weapons.

Normal attack techniques:

- Spear: one additional enemy behind the primary target, within 24 units of the thrust line and within weapon reach, takes 60% damage.
- Axe: at most two additional nearby enemies in the forward cone, within 60 units of the target and within weapon reach, take 45% damage.
- Mace: surviving soldiers cannot move, attack or heal for 0.45s; captains and Lord Ashfang resist to 0.20s. Timers freeze with battle pause.
- Sword and dagger keep single-target attacks; the dagger trades reach and per-hit damage for the fastest recovery.

Secondary damage is rounded and still passes through armor mitigation. Sweep does not trigger any normal-attack technique. These percentages, durations and recovery placements are provisional design choices, not playtest-approved balance.

Implementation: `gear-panel.js` owns equipment cards/categories, `gear-progression.js` owns comparisons and recovery rules, and `weapon-techniques.js` owns technique geometry. `combat.js`, `main.js`, `panel.js`, `feedback.js`, `battle-markers.js`, `art.js` and `style.css` integrate them. No new bitmap assets or save version were required.

Verification for this slice: 60 domain tests, inventory switch/reload, forge purchase/reload, supplies, the complete fresh world/quest flow, and actual mace/dagger attack sprite checks passed. `tests/armory-adventure-qa.cjs` uses a disclosed prepared campaign fixture, then real mouse/keyboard input for comparisons, world travel, equipment locks, Elderwood victory, reward inspection, equipping, persistence, mace stagger and repeat-victory deduplication. Desktop/mobile images and the receipt are in `docs/armory-*`; the mobile scroll fits a 390px viewport. This verifies behavior and presentation, not human fun or weapon balance.

## Forest objectives

Elderwood Grove now contains two trapped frog herbalists. Clear enemies near a cage, approach within 80 world units and press F (or use the battle button) to free its captive. Any living enemy soldier within 110 units guards that cage. Both rescues and every raider must be cleared before victory. Open cages and the objective counter show progress. The Elderwood Watch and The Gatherers' Road contracts use this objective.

Ashveil Grove contains two Emberheart Totems with 120 health each. Each surviving totem restores up to 12 health to living, wounded raiders within 220 units every four seconds; neither structures nor Crown's units can receive that healing. Destroying a totem stops its pulses and leaves rubble. Click the visible totem body to target it; regular attacks and abilities damage it. Both totems and all raiders must fall before victory. Ash, embers and a smoky tint distinguish the grove from Elderwood.

The scout scroll explains each objective before entry. A compact battlefield counter and contextual hint guide progress; menus and pause freeze combat, totem timers and interactions. Victory grants an additional 30 gold for Elderwood or 45 for Ashveil (115 or 130 total battle gold), including repeat victories. Quest turn-in rewards remain separate. Withdrawal pays the existing 25 relief gold with no objective bonus. Battle reports, the journal and the saved chronicle record the outcome; in-progress battles still restart on reload. Older completed contracts retain their status.

These amounts, radii and encounter layouts are provisional design assumptions. Props are visual and targetable/interactable where appropriate, without new collision obstacles. Mace stagger affects soldiers, not structures. Pointer targeting follows painted depth when enemy bodies overlap.

Files: `missions.js` contains battle-local rules; `mission-art.js` draws the props and objective display; `battle-targeting.js` selects visible targets. Integration lives in encounters, combat, scouting, scene, main, panel, feedback, chronicle and atmosphere. Existing armor-only Crown sprites and held-equipment sockets are unchanged.

New art was generated using built-in imagegen with transparency: `assets/mission-props-v1.png`. The exact submitted prompt is retained in `assets/mission-props-v1.prompt.txt`. Explicit source bounds isolate closed/open cages and intact/destroyed totems while preserving their proportions and ground anchors.

Verification: `tests/missions.test.js` covers rescue guards/proximity, death and victory gates, totem healing limits/cadence, damage/stationary behavior, overlap targeting, scouting and old/new chronicle saves. `tests/forest-missions-qa.cjs` uses an isolated, disclosed level-10 campaign fixture with seven seasoned troops and two active contracts, then real keyboard/mouse input for both battles, rescues, pause, travel, Mossford turn-in, weapon recovery and persistence. Receipts and inspected screenshots live in `docs/forest-missions-verification.json`, `docs/elderwood-*` and `docs/ashveil-*`. Final checks: all 76 domain tests passed, plus forest-missions, armory-adventure, fresh-save world and cargo browser flows. The fresh-world reload test now pauses travel through the actual inventory shortcut before taking its screenshot, preventing screenshot time from completing the short trip. Browser playthroughs reported no page errors. Automated checks do not establish human difficulty or fun.

## Battle discipline and feedback

- Twelve fixed posts are allocated when battle starts. Guards prefer the front, spears the middle, and archers/mages the rear; overflow fills unused posts. A casualty leaves a vacancy without moving every survivor to a new slot. Reinforcements use free posts, preserving the positions of surviving troops.
- Hold defends these posts and regroups when a soldier is displaced or a target pulls away. Follow turns after 45 units of horizontal marching, rather than reacting to Crown's attack facing or a small correction. An explicit order can establish a new facing immediately. Retreat uses twelve spaced positions near the left edge.
- Friendly soldiers retain a living target unless another is at least 50 units closer, the target dies, or the order's pursuit limits exclude it. Enemy targeting retains its previous nearest-enemy behavior; an initial fresh-campaign failure exposed the difficulty effect of applying retention to enemies, and that change was removed.
- The formation grid shifts as a whole at battlefield edges instead of collapsing several posts onto the same coordinate. Follow posts bend around Crown where possible. Close combat still uses soft separation; this is not obstacle-aware squad pathfinding, and crowded melee can still overlap visually.
- Crown's outgoing damage uses larger gold numbers; incoming damage to Crown uses coral numbers. Near-simultaneous troop hits on the same unit are summed in a smaller number over a 0.18s window. These are display changes only; applied damage is unchanged. Spear impacts trace the thrust direction and mace impacts have a heavier synthesized cue. Reinforcement labels name the arriving troop and remain inside the viewport.

The 35-unit Hold leash, 180-unit Follow leash, turn threshold and target-retention margin are provisional behavior tuning. Save data and troop/reinforcement capacity remain unchanged. New logic lives in `formation.js`, `soldier-tactics.js` and `combat-numbers.js`; integration updates combat, feedback, audio, order descriptions and read-only diagnostics.

Verification: 69 domain checks cover post stability through casualties/reinforcements, corner spacing, role allocation, follow turns, pursuit limits, target retention, unchanged enemy targeting and damage-number totals. Real-input browser checks cover a prepared 36-soldier battle, actual casualties and replacement troops, pause, damage feedback, retreat and reload persistence. Fresh-campaign conquest and prepared 24-soldier conquest both pass after restoring enemy targeting. Screenshots and the prepared-run receipt are `docs/disciplined-*.png` and `docs/battle-discipline-verification.json`. Human feel and balance remain open playtest gates.

## Saves and limits

Independent save key: `pepe-feudalism-campaign-v1`. Old saves retain territory, gold, equipment and roster; missing adventure fields initialize safely. Reset affects only this game. Battle reload restores the last campaign roster; quests, inventory, skill allocations and arrived position persist. The battle report is temporary UI.

This is one authored region, not an unlimited continent. The twelve contracts reuse the base encounter templates. Crownhaven retains its capital scene; ports, villages and castles now use distinct painted service interiors, shared within each settlement category; map landmark designs differ for towns, castles, ports, forests, ruins and enemy fortresses. Towns support walking and service interactions. There is no naval travel, dynamic NPC schedule, multiplayer, taxes or backend.

Soldiers use illustrated sprite regions with leg motion and attack tilt. Crown uses four armored poses; neither is a finished smooth animation system. Human likeness, readability and balance review remain open. Asset reuse/generation does not imply commercial rights clearance.

## Art provenance

- Original Crown sheet preserved. Armored Crown: `assets/crown-armored-v1.png`; prompt in `crown-armored-v1-prompt.txt`.
- Troops: `assets/soldiers-v3.png`. Town: `assets/crownhaven-v2.png`. Battle: `assets/battlefield-v2.png`.
- World: `assets/world-v1.png`. Map landmarks: `assets/landmarks-v1.png`. Forest encounter: `assets/forest-v1.png`.
- Built-in imagegen produced these assets. Final prompts: `assets/generation-manifest.json` and `assets/world-assets-prompts.json`. Equipment uses generated bitmap art; effects, road overlays and quest markers are drawn in canvas.

## Verification

From workspace root:

```
node --test pepe-feudalism/tests/*.test.js
node pepe-feudalism/tests/world-qa.cjs
node pepe-feudalism/tests/conquest-qa.cjs
node pepe-feudalism/tests/battle-discipline-qa.cjs
node pepe-feudalism/tests/settlements-qa.cjs
```

The combined world QA checks real mouse/keyboard travel, quest acceptance/return, loot, skill allocation, persistence, camera controls, scroll pause and viewport containment. Conquest QA checks actual Reedwatch and keep victories and captured settlement services. Both use bundled Playwright and Edge; adjust imports for another machine. Read-only diagnostics expose snapshots, never action handlers. Receipts and reviewed screenshots are in `docs/`. The older browser/town test names redirect to world QA.

Next: smoother battle animation, richer encounter objectives and sound, after reviewing this complete loop.

Settlement atlas: `assets/settlements-v1.png` contains three exact horizontal thirds (port, village, castle). Building labels and mouse targets share `settlements.js`. Crown travels with two walking poses and directional facing. Scene QA visits all three categories through real map clicks and travel, then exercises their hall, barracks, forge and quest board.

Battle motion polish: `motion.js` tracks distance and simulation time for foot cycles and breathing. Pause freezes visual motion. Sword/axe arcs and spear thrust are weapon-specific; troop hit glow improves damage readability. Rendering does not change combat damage, range or cooldowns. These remain illustrated pose animations rather than fully rigged sprites.

Lost Harbor Cargo now uses an explicit recovery objective at Moonwell Ruins when that contract is active. Clear the guards, approach within 85 world pixels of the chest, and press F or Recover cargo. Victory, loot and quest readiness wait for recovery; withdrawal forfeits it. This is a quest objective, not a sellable inventory item. Reload follows the existing unsaved-battle rule. `node pepe-feudalism/tests/cargo-qa.cjs` checks real combat, guard lock, mouse approach and keyboard recovery; receipt: `docs/cargo-verification-v6.json`.

Moonwell Ruins has its own painted sanctuary battlefield (`assets/moonwell-v1.png`, exact prompt adjacent). `atmosphere.js` adds deterministic forest leaves, regional light/fireflies and moonwell motes using simulation time; all freeze when paused. These scenery effects are decorative and do not obstruct combat or change balance. Forest locations still share one base illustration. Verified ruins cargo screenshot: `docs/moonwell-objective-v7.png`.

Regional camps: Briar retains five starter raiders; Elderwood has a guard and two archers; Jadefall has six enemies including Varric the Thorn (180 HP, 16 damage). Captain defeat is required as part of clearing every enemy. Camps use decorative native canvas tents, stakes and banners above the movement area. Rewards retain the existing hunt economy. Balance is provisional; Jadefall browser QA uses six seasoned troops and a tier-two blade. Run `node pepe-feudalism/tests/jadefall-qa.cjs`.

Destination scouting: `scouting.js` derives enemy rosters and captain statistics from the actual combat setup; captured fortifications show settlement services. Map scrolls show troop previews, cargo recovery requirements and approximate journey time from graph distance at the current 330px/s travel speed. Travel estimates exclude arrival dialogs. Captains wear a red mantle. Scouting UI and captain combat are covered by Jadefall browser QA; screenshot: `docs/scouting-scroll-v9.png`.

Sound: `audio.js` synthesizes quiet local cues for travel steps, weapon impacts/arrows, abilities, scrolls, town services, arrival and results. A user gesture unlocks playback. Guide scroll offers Sound On/Off; preference uses independent `pepe-feudalism-sound-v1`. Movement/combat cues stop during pause, scrolls or a hidden document. No music or recorded ambience yet. `node pepe-feudalism/tests/audio-qa.cjs` verifies gesture unlock, cue scheduling, mute, reload persistence and unmute. Receipt: `docs/audio-verification-v10.json`. Browser checks confirm scheduling, not speaker output or subjective sound quality; listen in the game for that final review.

Local quest residents: eight authored names and roles in `residents.js` provide offer, active, ready and completed dialogue derived from existing quest state. Boards show their local speaker; the journal names the requester; settlement halls record completed and paid contracts. No extra reward or new save fields are introduced. These are scroll conversations, not moving NPCs. World browser QA checks Rowan’s active and completed lines through real acceptance, combat, return and payment. Screenshot: `docs/resident-dialogue-v11.png`.

Settlement life: `town-life.js` adds two walking frog residents, the named local quest giver and Crown standing near the hall. Clicking the quest giver opens the existing board conversation. Its marker turns green when payment is ready. Paths are decorative loops, not schedules or a free-walking town simulation. Residents use lightweight native canvas artwork; Crown uses the existing armored atlas. World QA checks movement and the real resident click; settlement QA checks building targets remain usable.

Town movement: Crown now walks with WASD or an empty-ground click in a bounded central area (x170–1040, y270–555). Diagonal motion is normalized; manual keys replace the click target; opening scrolls cancels motion. Resident/building clicks still open services directly. Town positions are temporary and reset on entry/reload. The painted scene has no building collision or pathfinding yet, so this is an exploratory movement prototype. Real-input world QA checks keyboard movement, click arrival and scroll stop.

Town navigation update: 20px grid routes avoid three conservative service footprints with 10px clearance. Ground clicks draw a faint route and endpoint; blocked destinations resolve to clear grid cells. Keyboard movement slides along footprint edges. Services remain directly clickable. These footprints share the service layout and do not trace every detail of the painted scenery. Domain movement tests check route completion, clearance and keyboard blocking; world QA verifies actual click travel.

Proximity interactions: `town-interaction.js` selects the nearest resident/service entrance within 90 scene pixels. The HUD names the action; F opens its scroll or leaves through the gate. Hall entrances are projected onto the reachable courtyard. Direct clicks and service buttons remain available. World QA now exercises the actual F key and confirms the local quest scroll opens.

Quest navigation: ready journal entries offer Show reward town on map. Both quest navigation actions frame the road route from Crown’s current stop to the requested destination. Selecting another map location previews its route with a dashed gold line; actual travel remains a solid gold line. Travel still requires the explicit travel action. World QA verifies the ready quest return button and destination selection. Screenshot: `docs/quest-return-route-v14.png`.

Town supplies: inventory scroll offers healing draughts for 25 gold in settlements. Existing potions restore 80 HP and sell for 20 gold. Price is a provisional balance choice; supply is unlimited within the existing 60-item satchel capacity. Purchases require settlement, space and funds, and save immediately. Native canvas jade/steel/draught illustrations clarify loot. `node pepe-feudalism/tests/supplies-qa.cjs` checks purchase, gold, reload and resale; receipt: `docs/supplies-verification-v15.json`.

Combat recovery: R drinks one carried draught while battle is running and Crown is wounded. The battle control shows remaining supply and disables itself at full health, without supplies or while paused. Successful use consumes and saves the item immediately; healing uses the existing 80-HP rule. Below 25% health a soft red edge tint warns of danger. Cargo browser QA exercises real R input after combat damage and verifies HP, item consumption and that no scroll opens.

Battle command feedback: `battle-markers.js` adds a selected-enemy ring and pointer, ground destination with a faint travel line, and a Hold position ring. Markers follow simulation time and disappear with their relevant target. Crown now prioritizes the selected living enemy instead of attacking a closer bystander; the target clears on death. `tests/target-priority.test.js` covers actual damage and target clearing; Jadefall and world browser checks cover the combat flow.

Battle results: `battle-roll.js` derives returning and fallen troop counts by type from actual units, plus their resulting survivor ranks. Result parchment names newly ready quest objectives, issuing reward towns and level-up skill points. It stays temporary and uses an internal scroll for long results. World browser QA checks roll totals against survivors and the correct reward town; screenshot: `docs/battle-report-v17.png`.

Crown character scroll: armored portrait, equipped blade tier, victories to next level and effective next-battle stats. `hero-stats.js` centralizes health, attack, speed and recovery calculation used both by the preview and actual battle initialization; ability preview follows existing INT/WIS rules. Attribute changes apply to the next encounter, not an ongoing paused battle. World QA includes allocation, reload and actual STR damage after restarting battle.

Geography revision: 18 connected destinations and 10 contracts. Ashfang Keep moved onto the eastern volcanic foothills; Frostford moved into the northern snowy belt. Crownhaven/Mossford/Moonwell and Eastwatch were repositioned onto appropriate plains or shoreline. Added Pearlport (west-bay-facing port), Greenmere, Highpass Shrine, Wintercrown Castle, Cinderford and Ashveil Grove. Northern/volcanic roads use intermediate stops rather than a direct keep shortcut. IDs and existing saves/quests remain compatible. Wintercrown and Cinderford offer new contracts through Warden Snow and Scout Ember. New locations reuse the existing settlement/encounter categories; terrain alignment is authored against the map painting, not a collision/navmesh reconstruction. `node pepe-feudalism/tests/geography-qa.cjs` travels to new settlements and checks services. Overview: `docs/world-expanded-v18.png`.

Corrupted citadel correction: Ashfang always uses the existing black/red fortress sprite (bottom-right atlas cell) beside the volcano, including after conquest. Ownership changes the flag, not the architectural asset. Native ember glow reinforces its volcanic placement. Captured keep interiors now use a dedicated corrupted courtyard. Screenshot verification covers both owned/unowned map states.

Corrupted scenes: `assets/corrupted-citadel-v1.png` provides exact half-height courtyard/battle crops. Ashfang uses volcanic battle art and ember atmosphere; the captured settlement uses black architecture, Basalt Barracks, Cinder Forge and Blackstone Gate. Original map fortress remains preserved. Exact imagegen prompt sits beside the atlas. Conquest QA passed real outpost/keep victories and captured services; screenshots: `docs/corrupted-battle-v20.png`, `docs/corrupted-courtyard-v20.png`.

Resident art pass: `assets/residents-v1.png` replaces native placeholder frogs with illustrated steward, porter and herbalist sprites. Alpha is preserved (RGBA, transparent pixels confirmed); the exact built-in imagegen prompt is adjacent. Town movement/interaction stays unchanged, and local conversation scrolls use the steward portrait. Named quest givers share this role portrait; unique individual portraits and fully articulated walk cycles remain future art work. World browser QA passed movement, resident clicks and full quest progression.

Northern art pass: winter atlas exact thirds supply Frostford village, Wintercrown courtyard and Highpass battle backgrounds. Service positions remain consistent, with northern service names and soft deterministic snowfall. Highpass uses the existing hunt battle rules; snow is decorative. Original imagegen source and exact prompt are retained. Verified scene loading, real Highpass WASD movement and northern travel/services; screenshots: `docs/frostford-v22.png`, `docs/highpass-battle-v22.png`.

Regional map landmarks: Frostford, Wintercrown and Cinderford use dedicated transparent winter-village, snowy-castle and basalt-frontier sprites from `assets/regional-landmarks-v1.png`. Existing IDs/positions and Ashfang’s corrupted fortress remain intact. Prompt and original source retained. Geography QA verifies northern/frontier travel and services after the art change.

Cinderford interior: dedicated friendly basalt frontier town with Frontier Hall, Ashroad Barracks, Emberworks Forge, Scout Quest Board and Basalt Gate. Map and interior now share the volcanic frontier theme while Ashfang remains the corrupted citadel. Existing resident, paths, services and contracts are retained. Imagegen prompt/source retained beside `assets/cinderford-v1.png`. Geography QA visits Cinderford and exercises its service targets.

Town character polish: Crown and residents are drawn in ground-depth order, rather than always placing Crown on top. Crown uses native atlas proportions and per-pose foot anchors at the same scale as residents, with a subtle ownership ring. Walking no longer squashes each pose into the same rectangle. Existing movement and quest interactions remain unchanged.

Warband formation: `formation.js` allocates guarded front, spear middle and archer rear slots for Follow/Hold, mirrored to facing and clamped inside the battlefield. Hold anchors facing at order time and shows individual slots. Combat engagement/range rules remain unchanged; formations are soft movement targets, not rigid collision walls. Formation tests cover role order, lane separation, mirroring and bounds. World QA exercises actual Hold key input; conquest QA checks real outpost/keep fights.

Final defender: Lord Ashfang leads the keep’s existing eleven-enemy roster (140 HP, 13 damage, 69 speed). He is a larger armored guard with mantle, nameplate and crown marker; scouting derives his stats from the same encounter setup. Defeating every defender, including the lord, remains necessary for conquest. Rewards and capture gates are unchanged. Stats are provisional balance values. Conquest browser QA verifies scouting, lord spawn, actual victory and captured services; screenshot: `docs/lord-ashfang-v26.png`.

Campaign chronicle: settlement halls offer an internal scroll recording the three conquest territories, battle wins, current roster and paid contracts from the actual save. Before victory it names the next conquest; after capturing the keep it presents the Emerald Crown restored finale. The keep victory report announces this milestone while retaining exploration and remaining contracts. No bonus reward or new save schema is introduced. Conquest QA checks the finale chronicle after actual victory and reload; screenshot: `docs/campaign-chronicle-v27.png`.

Post-conquest quest repair: capture contracts accepted after Reedwatch/Ashfang are already owned become ready rather than impossible to finish. Existing active capture contracts normalize to ready on load when ownership proves the objective. Repeatable forest/recovery objectives still require their own encounter. Payment remains once-only at the issuing town. Unit and browser checks verify late acceptance, location restriction, saved completion and no duplicate reward; receipt: `docs/post-conquest-verification-v28.json`.

Quest-board clarity: journal and boards show active contracts out of three. At capacity, unavailable contracts have a disabled Journal full button with an explanation; capture objectives already satisfied can still be accepted for reporting. Journal sorts ready rewards ahead of active and completed entries. Browser capacity check verified three active contracts block new work, ready quests free a slot, and ready entries sort first. Regression pass also reran domain, world, supplies, audio and conquest checks.

Battle control polish: Pause/Resume button shares the same behavior as P and clears held keys at either transition. Ground destinations clamp to actual battle movement limits, so their markers cannot indicate unreachable sky/off-field points. World browser QA clicks pause, verifies real movement input leaves Crown frozen, resumes and completes the encounter.

Travel scroll pause: road movement now stops while inventory, quests, character or guide scrolls are open. Closing resumes the same route; arrival no longer replaces a scroll being read. HUD explains the paused journey. Save/reload still returns to the last arrived stop. World browser QA opens inventory mid-route, verifies identical coordinates after a wait, closes it and confirms travel resumes.

Town click interactions: clicking a distant resident/building queues a route to its reachable entrance and opens the service when Crown arrives. Within 90px it opens directly; automatic arrival uses 40px. Manual keys, new ground targets, scrolls or leaving town cancel the request. F and quick service buttons remain available. World and settlement QA now wait for actual walk-and-open behavior instead of immediate remote interaction.

Ambient world traffic: four small covered merchant wagons travel back and forth on existing connected road segments. Native canvas artwork keeps Crown and quest icons distinct. Wagons are decorative, not an economic simulation; they do not alter gold, quests or saves. `world-life.js` computes bounded segment positions and direction from time.

Regional recruitment: settlement barracks name troops by their local regiment. Recruitment origin persists through casualties and saves; legacy soldiers default to Crownhaven. Regional sashes appear in combat. Role stats and existing guard unlock remain shared; dedicated regional sprite sheets and differentiated balance are future work.

Special orders: Holy Knights (95g) and Holy Mages (110g) recruit at Sunspire/Wintercrown; Shadow Knights (105g) and Shadow Mages (115g) at Cinderford/captured Ashfang; Frog Guardians (120g) at Crownhaven/Mossford/Greenmere. All use a dedicated transparent orders-v1 atlas. Holy mages heal 12 HP within 190 pixels every 6 seconds while alive and fire 15-damage sun bolts; shadow mages cast 24-damage hex bolts. Knights and guardians form the frontline, mages the rear. Existing ranks, casualties, capacity and persistence apply. Prices and balance are provisional design choices. Verified with 29 domain tests and orders-qa.cjs real UI recruitment and battlefield screenshots.

Environment troop artwork: environment-troops-v1.png supplies twelve transparent sprites, spear/bow/shield for winter, coast, woodland and ashland. The renderer selects each soldier's original recruiting region, so mixed armies keep local armor and weapons while traveling. Local barracks display the regional previews. Special holy/shadow/Guardian artwork remains separate. Regional base-role stats remain shared. Verified 29 domain tests plus environment-troops-qa.cjs recruitment in four regions, reload persistence and mixed battlefield rendering.

Regional enemies now use environment-matched armor: woodland camps, winter Highpass, ashland Ashveil/Ashfang and coastal Moonwell. Red diamond insignia identifies hostile regional units. Scouting previews and names use the same encounter origin. Enemy roster sizes, captain stats and combat balance remain unchanged. Verified domain origin tests and browser battlefield rendering.

Battle readability pass: Follow/Hold formations group frontline, middle and rear roles across unit types, preventing knights and Guardians from receiving overlapping slots. Wider 58px lanes and 58px row depth; rear troops remain behind Crown. New atlas units use split lower-leg walking, spear thrust offsets, attack recoil and holy/shadow casting circles, all driven by simulation time. Animation remains atlas-based rather than fully rigged. Domain formation checks and special-order browser combat passed.

Barracks scroll now presents each locally available recruit as an illustrated card with health, damage, reach, equipment and a hire button. Locked hiring explains missing gold, capacity or conquest. Warband scroll groups actual soldiers by type and original regiment, showing each local appearance and rank distribution. Browser recruitment checks passed for special orders and four environment regions.

World-map settlement scrolls now preview the local regiment and recruit artwork, costs, health and attack before traveling. Special orders appear only at their recruiting settlements. Local contracts show their destination, reward and current status. Recruiting and accepting remain town interactions. Verified map selection through real mouse input and mobile overflow check.

Town warband management: dismiss one soldier by regiment and rank from the Warband scroll, freeing a slot without refund. Disabled during combat or road travel and outside settlements; origin and experience arrays remain aligned after removal and reload. Verified domain removal/guard tests plus real browser dismissal and save reload.

Warband recruit finder: Holy Knights/Mages, Shadow Knights/Mages and Frog Guardians link to the nearest accessible recruiting settlement ranked by the existing road route travel distance. Hostile castles are excluded until captured. Links frame the route and open the destination scroll; they never start travel or spend gold. Domain destination checks and real browser click path passed.

Warband composition summary shows frontline/ranged counts, Holy Mage support, experienced soldiers and total troop health including rank bonuses for the next battle. Contextual tips describe missing frontline, ranged support, healing or experience; these are composition observations, not victory predictions. Domain calculation and real browser scroll checks passed.

Army expansion MVP: 36 total troops, 12 deployed at once, reserve replacements arrive from the left with a 3-second cadence as casualties free slots. Initial troops spawn directly into Hold formation. Unused reserves survive withdrawal/victory without earning combat ranks; deployed survivors gain ranks. HUD displays reserve count. Generated equipment-v1 atlas appears in forge, inventory and Crown's held weapon; equipping applies existing weapon stats and persists. Armor slots are not implemented yet. Verified domain reserve/casualty/rank checks and browser equipment switching/reload. Enemy garrison sizes remain authored, not scaled to army size.

Garrison expansion: Reedwatch now has 16 defenders (8 initially deployed + 8 reserves), Ashfang 24 (11 + 13). Enemy reserves enter from the right every 3 seconds while fewer than 12 enemies are active. Victory waits for all enemy reserves as well as deployed defenders. Scout reports include full garrison and reserve totals, HUD shows remaining reserves on both sides. Starter camps retain existing rosters. Counts and pacing are provisional; larger-garrison human balance testing remains needed. Verified 36 domain tests and browser scouting/actual timed enemy arrival.

Shield equipment MVP: generated oak/jade/holy shield items purchased once at the forge for 45/90/150 gold, adding 25/50/80 maximum health. Owned shields equip/unequip from inventory outside battle/travel, persist independently, and render on Crown in combat. Stats apply next battle; body armor and gear drops remain future work. Domain purchase/stat checks and real browser buy/equip/reload verified.

Battle equipment rewards: a first hunt victory grants an Oak Frog Shield, Reedwatch grants Jade Lotus, and Ashfang grants Holy Sun if not already owned. No duplicate equipment rewards and no automatic equip. Scouting previews outstanding rewards; victory parchment displays generated item art with next-battle equip instructions. Equipment persists separately from the consumable satchel. Reward-tier domain tests passed; full world browser campaign check run for victory integration.

Body armor MVP: Marsh Scout Vest/Jade Lotus Armor/Basalt Warplate cost 55/110/180 gold and reduce incoming hit damage by 1/2/3, minimum 1. Separate saved armor ownership and equipped slot; generated item artwork in forge/inventory with a provisional chest overlay in combat. Works with a shield. Combat stat reduction tested through actual enemy attacks; browser purchase/equip/reload passed. Overlay alignment and armor balance need visual playtesting.

Crown character scroll now displays three illustrated loadout slots (weapon, armor, shield), including empty-slot states, armor damage protection and shield health bonus. Manage Equipment opens inventory directly. These describe the next battle loadout, consistent with battle equipment locking. Equipment tests and desktop/mobile browser interaction passed.

Equipment fit pass: trimmed transparent atlas margins at draw time, preserved round-shield aspect ratios, made holy shields taller, and fitted body armor to Crown's torso. Pose-specific chest, offhand and weapon-hand sockets follow idle/walk/lunge frames and mirror with facing. Battle weapons rotate around their grip with individual lengths; inventory art remains independent. Browser special-order combat and equipped Crown idle/walk screenshots verified. Layered sprite equipment remains provisional rather than rigged.

Formation visibility: Hold positions now place spear infantry behind Crown, shield units forward and ranged support farther back, using 68px lanes and 70px row depth. Starter formation leaves at least 60px around Crown so equipped silhouette remains readable. Formation tests and mixed-regional browser battle checks passed. Melee crowds can still overlap during fighting.

Combat crowd pass: living allies maintain wider spacing than opposing melee units, and soldiers yield around Crown without separation moving the player. Separation results clamp to battlefield bounds. This improves equipment visibility while keeping melee attack ranges viable. Verified 41 domain tests and browser special-order combat. This is soft separation, not full collision pathfinding.

Opening deployment management: Warband groups show opening/reserve counts. At a settlement, Deploy One First moves a selected reserve troop to the front of the saved army order, preserving origin/rank and moving the previous twelfth soldier into reserve. Changes lock during battle/travel. Actual battle construction follows that order. Domain and real browser save/reload checks passed.

Armor loot progression: first hunt-tier victory grants Marsh Scout Vest, Reedwatch Jade Lotus Armor, and Ashfang Basalt Warplate if not already owned. Battle reports display recovered armor art and protection; scouting previews outstanding armor rewards. Existing equipped choices remain unchanged. Domain duplicate/persistence tests passed; full browser victory/quest loop checked.

Corrupted army identity: Ashfang's 13 reserves now include one Shadow Knight in the first reserve slot and one Shadow Mage later in the queue. Total garrison remains 24. Scouting enumerates all troop types and gives preparation context; spells use the same combat rules as recruited shadow units. Domain roster/count checks and real browser scouting/timed Shadow Knight spawn passed. Full larger-garrison balance remains unverified by a human playtest.

Expanded conquest verification: expanded-conquest-qa.cjs uses a clearly seeded prepared 24-soldier seasoned army, level 3 Crown, tier 3 sword, jade armor and shield. Real keyboard/mouse combat defeated 16-defender Reedwatch then 24-defender Ashfang including Shadow reserves, and reload verified captured keep plus Basalt armor reward. This proves the prepared combat path, not starter-army balance or natural campaign economy. Receipt: docs/expanded-conquest-v44.json; battle screenshots alongside.

Fresh-save conquest regression rerun after garrison expansion: existing conquest-qa.cjs recruited with starting gold, defeated expanded Reedwatch, used captured-town recruitment/forge, traveled to and defeated expanded Ashfang, and verified ownership, captured services, quest board and chronicle after reload. No seeded combat army or gold. Fixed the test's target click during empty reinforcement gaps. All 44 domain tests passed. This is an automated skilled-control path, not a human difficulty/fun evaluation.

Battle results now distinguish deployed soldiers from untouched reserves, per troop type and in the overall report. Rank promotion totals count only deployed surviving soldiers; untouched reserves retain their rank. Explicit copy explains experience eligibility. Domain casualty/reserve report check passed; full browser campaign regression run.

Holy healing readability: a golden curved link shows which ally a Holy Mage heals, with a green ground pulse and green recovery number. Effect timing follows battle simulation and freezes during pause. Healing amount, targeting and cooldown remain unchanged. Holy combat domain tests and special-order browser battle checks passed.

Settlement contract expansion: Greenmere's Herbalist Willow offers The Gatherers' Road (Elderwood, 55 gold), Pearlport's Dockmaster Brine offers Salt for the Snowbound (Highpass, 60 gold). Each uses existing accept/active/victory/return/claim state with authored resident dialogue and quest map markers. Campaign now has twelve contracts across all twelve service settlements. 45 domain tests passed; real browser acceptance and tracked destinations verified for both new boards.

Quest discovery markers: a small parchment beside a friendly settlement means an unaccepted local contract is available. It disappears after acceptance; hostile castles hide their board marker until captured. Existing gold active-destination and green reward-ready markers remain distinct. Guide explains all three. Domain marker-state tests and browser world rendering checks passed.

Reinforcement HUD: compact battlefield panels on Crown/enemy sides show reserve totals and either Frontline Full, next-arrival countdown or No Reserves. Countdown reads simulation state and pauses with combat. Main status line is shortened to Crown health and enemies on field. Domain indicator states and browser combat checks passed.

Town loadout continuity: Crown wears equipped armor and carries the saved shield/weapon while walking through settlements. Town pose sockets mirror battle positioning at town sprite scale; changing gear updates immediately. Existing town routing/interactions are unchanged. Browser visits and recruitment across four town environments passed.

Active contracts can now be abandoned without payment from the quest scroll, freeing a journal slot and restoring the settlement's available marker. Reacceptance requires the original board. Ready/completed quests cannot be abandoned; battle/travel lock the action. Domain and real browser abandon/reload/reaccept checks passed.

Battle preparation: hostile destination scrolls show Crown's current weapon, armor protection, shield, health and attack plus initial deployed count, reserves and overall frontline/ranged/healer composition. Existing composition tips appear beside scouting, and reserve garrisons explain victory/experience rules. No estimated win probability is claimed. Real browser desktop/mobile checks passed.

Enemy targeting readout: clicking a living enemy shows its local troop/captain name, current/max health, attack and health bar in a compact top-center battlefield panel. It clears when the target dies. Drawn above battle sprites so it stays visible. Target-state domain check and browser combat passed.

Warband deployment management now supports Keep One In Reserve when the army exceeds twelve. It moves an opening soldier to the back of the saved queue and promotes the next reserve into deployment, preserving rank/origin. Town-only; combat/travel locked. Domain and browser save/reload checks passed.

Army command clarity: concise battlefield text explains the active order, moves below the selected-target panel when needed, and command buttons include matching tooltips plus aria-pressed state alongside existing visual selection. Retreat explicitly means falling back without attacking; Withdraw remains the separate battle exit. Browser order/combat checks passed.

Castle regional troops: castle-troops-v1.png adds six generated designs for Sunspire regular lancer/bowman/guard and Reedwatch river pikeman/bowman/guard. Reedwatch now has its own regiment names and reed/bronze kit for recruits and hostile garrison. Recruiting origin selects artwork through travel and combat. Holy and other special orders remain separate. Updated conquest UI labels; 50 domain tests and special-order/browser recruitment checks passed.

Persistent battle chronicle: records the most recent twenty victories/withdrawals with location, surviving army, casualties and newly recovered shield/armor names. Visible in Campaign Chronicle at settlement halls, newest first. Older saves begin with an empty history rather than invented past records. Domain bounded-history/malformed-save checks and browser campaign regression passed.

Combat feedback: armor mitigation produces a brief impact spark when protection reduces incoming damage. Holy Mage recovery numbers report actual restored health, including partial heals near maximum health. Added a partial-heal domain regression; special-order browser combat passed.

Troop attack motion: shared atlas rendering gives regular and regional spearmen a forward thrust, archers a release recoil, knights colored swing trails, Frog Guardians a heavier rising strike, and mages a rotating casting flare. Motion follows simulation swing time, including pause. Uses existing static sprite sheets; these are pose effects rather than fully rigged limb animations. Special-order browser combat passed.

Battle health readability: unit health bars render after all soldiers to prevent foreground sprites hiding them. Framed bars distinguish Crown, allies and enemies; Crown has a wider bar. Wounded bars turn amber below half health and critical bars red with an exclamation marker at quarter health. Presentation only; special-order browser combat passed.

Equipped Crown continuity: character-scroll portrait now layers saved body armor, shield and held weapon on Crown, alongside the illustrated equipment slots. World traveler renders the same gear with facing and walking sockets at zoom-independent scale. Town and battle gear rendering remains active. Regular ally separation increased from 46 to 50 pixels; Frog Guardian pairs use 58 pixels. 52 domain checks passed; world and special-order browser checks cover runtime.

Gear fit repair: expanded Crown portrait canvas, reduced torso overlay, lowered walking/idle weapon grips, shortened held axe and angled resting weapons away from the face. Shield equipment icon now fills its slot more consistently. Applies to portrait, town, world traveler and battle sockets. Seeded leather/oak/axe visual fixture saved in docs/gear-fit.png and inspected; actual menu keyboard path verified. Static Crown art still contains authored base clothing beneath equipment overlays.

Modular Crown base repair: crown-base-v2.png replaces built-in emerald plate/cape with plain underclothing while retaining Crown identity and four pose positions. Generated using the built-in image tool; exact prompt saved beside asset. Existing armored atlas preserved for rollback. Equipped vest now sits over clothing, held axe restored to readable scale with grip aligned to fist and resting blade angled outward. Character portrait enlarged. Seeded equipped portrait inspected, 52 domain checks and special-order browser battle passed.

Shared Crown pose anchors: crown-poses.js centralizes the four atlas frames and their gear sockets for battle, town and world. World rendering uses the original pose anchor and aspect ratio instead of stretching every frame into a fixed rectangle; portrait uses the same idle anchor. Seeded axe/leather/oak, sword/jade/jade and spear/basalt/holy portraits saved and visually inspected. 52 domain checks and special-order battle browser checks passed.

Worn armor pose fitting: shared pose metadata defines armor angle and dimensions, with a lower collar and shorter torso silhouette. Walking/attack armor follows torso lean instead of remaining upright. Menu/town/world/battle consume the same worn-armor renderer. Three equipment portraits visually checked; 52 domain tests and special-order browser combat passed.

Integrated scout/axe loadout: dedicated crown-scout-axe-v1.png renders Crown actually wearing leather armor and gripping oak shield/Ashbreaker together in four poses. Selected only for that exact equipped combination; other loadouts use modular base. Matching loadout skips all gear overlays in portrait/town/world/battle. Authored crop frames and attack-frame clipping isolate nearby atlas poses. Original art retained. Built-in image generation prompts saved beside asset. Seeded menu switch and real battle movement/attack browser check passed, plus 52 domain tests. Other loadouts still need integrated art passes.

Integrated jade/sword loadout: Crown's exact sword/jade armor/jade shield combination now selects crown-jade-sword-v1.png, with fully worn shoulder armor, bracers, greaves and held shield/sword in four poses. Registry selects artwork by all three gear slots and falls back for unmatched combinations. Same selection feeds portrait, town, map and battle. Built-in imagegen source and exact prompt saved. Seeded loadout switching and actual movement/attack checks passed for scout and jade sets; 52 domain tests passed.

Integrated basalt/spear loadout: exact spear/basalt armor/holy shield combination selects a four-pose worn armor set with greaves, bracers and sun shield. Same registry drives all game views. Source and exact built-in imagegen prompt saved. Gear browser QA now waits for actual Crown swing before pausing/capturing each of the three complete loadouts. All three real movement/attack checks and 52 domain tests passed. Mixed gear combinations still use modular overlays.

Armor overlap fix: all armor/weapon/shield combinations now select worn-armor character art. Mixed gear uses armor-only leather/jade/basalt sprites with separate held weapon/shield sockets; complete matched sets retain their integrated art. Removed the armor inventory-icon overlay from every character rendering path. Tight per-pose crops prevent neighboring armor frames bleeding into attack poses. Three new armor-only atlases generated using built-in imagegen, exact prompts adjacent. Regression covers all 36 armored held-gear combinations including no shield. 53 domain tests and six menu/actual-attack browser loadouts passed.

Inventory equipment preview: satchel now displays the same worn Crown preview and three current gear slots as the character scroll. Switching gear updates the illustration when its asset loads. Inventory-only self-navigation button removed. Seeded ownership fixture used actual inventory buttons to switch leather to mixed jade, unequip armor/shield and reload; saved empty slots and source selection verified. Screenshot inspected; inventory-switch-qa.cjs passed.

Full equipment variation QA: 48 loadouts (four armor states, three weapons, four shield states) rendered in four poses and both directions, totaling 384 browser renders. Contact sheets inspected for grip, clipping and stray neighboring assets. Fixed shield source bounds: jade crosses its nominal column; holy previously included a detached jade edge. Removed independent spear translation from the fist and adjusted attack angles outward. All loadouts now consistently use armor-only sprites with separate held gear; old complete loadout atlases retained as art references, no longer selected, eliminating their neighboring frame artifacts. 53 domain tests, six actual attack/loadout checks and real inventory switching passed. Review sheets: tests/gear-gallery.html; PNGs docs/gear-sheet-*.png.

Equipment expansion: Frog Guardian Mace (120 gold, 34 damage, 66 reach, .65s recovery) and Tidefang Dagger (55 gold, 18 damage, 48 reach, .30s recovery). Generated weapons-v2.png and exact prompt saved beside it. Source crops preserve aspect ratio and grip positions across all armor sprites; mace uses crushing impact and dagger a shorter slash trail. Forge purchases charge once; five owned weapons now persist valid saves. Initial balance is provisional. 54 domain tests, purchase/reload browser check, actual attacks for eight loadouts and 640 pose/direction render checks passed. Equipment now supports 80 total armor/weapon/shield combinations including empty armor/shield slots.
