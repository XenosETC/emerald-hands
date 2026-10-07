# Pepe Soul World — Kek Academy

An isolated Emerald Arcade action-RPG prototype. Open `http://127.0.0.1:4173/pepe-soul-world/index.html` with the repository preview running.

## What is playable

Kek Academy, Frozen District, Crimson Marsh, and Void Swamp; Crown’s illustrated idle, eight-frame run, six-frame cuts, jump, recoil, awakening, and four-pose Warp Step; mentor, training effigy, enemies, guardians, seals, and first-oath completion.

The world fills the available screen. The paused Soul Journal contains a realm map, six claimable quests, six skill paths, twelve inventory items, three equipment slots, and Goribbit’s forge and flask shop. Equipment and skills change combat stats. Enemies drop fragments and supplies; first guardian rewards include a realm sword; bounty quests award robes; discovering three shrines awards an Echo Talisman. Quest and guardian rewards persist once claimed.

Warp Step reads **plant → vanish → reappear**: 60ms anticipation, 140ms phase, 140ms landing/recovery. One jade silhouette marks the origin; faint secondary echoes and a short line show direction. Grounded landings stay planted. Sword attacks have no forced forward movement or camera shake; hit pause and sparks communicate impact. The camera follows movement through a dead zone and keeps the hero visible during warps. Each sprite frame has an alpha-derived sole anchor; the world backgrounds have calibrated walkway heights.

## How to play

1. Speak to Goribbit with E and land three J cuts on the effigy.
2. Open Quests and claim The First Cut. Spend your first point in Skills.
3. Walk to the right-hand veil gate, open Map, and choose a realm.
4. Fight the realm’s enemies and guardian, recover the seal and loot, and attune its shrine with E.
5. Return through Map to prepare at Goribbit. Recover three seals and speak to him to complete the oath.

A/D or arrows move; Space jumps; J cuts and queues combos; K Warp Steps; L fires Kek Wave; R awakens after level 3 and a seal; E interacts. 1 uses a healing flask and 2 a spirit flask. M map, Q quests, C skills, I inventory, G gear, Tab journal, Esc close/pause. Clicking empty ground walks; clicking a nearby enemy cuts. The journal pauses combat. Its buttons work with keyboard focus as well as pointer input.

Warp starts at 240 reach, 20 spirit, 0.9s cooldown. Each rank adds 35 reach and lowers cost/cooldown. Wave costs 28; awakening costs 55 and starts at eight seconds. Skills, enemy stats, reward amounts, names, and lore are draft prototype assumptions. Gear changes stats and item art; Crown’s on-body costume and blade artwork currently retain the approved base appearance.

## Files and isolation

`core.js`: simulation and checkpoint migration. `systems.js`: pure progression, inventory, equipment, quests, skills, forge and consumables. `journal.js`: in-game journal. `render.js`: motion, camera, effects and sprites. `art-layout.js`: generated sole anchors. `game.js`: input, screen sizing, UI and independent local storage. `audio.js`: opt-in synthesized sound.

The save key remains `pepe-soul-world-v1`; its inner payload migrates version 1 into version 2 without discarding old XP, training or seals. Position, health, spirit, gear, supplies, ranks and rewards are checkpointed. Combat encounters reset on reload; progression stays. No shared arcade currency or other games’ saves are modified.

Generated art remains project-local with original sources retained. Exact prompts are in `docs/asset-prompts.json` and `docs/rpg-asset-prompts.json`. Warp’s costume uses Crown’s sprite reference; its forward lean and jade echo direction draw from the earlier isolated Rumble Warp Step proof. These are separate game implementations.

## Verification and remaining review

Run `node --test pepe-soul-world/tests/*.test.mjs` from the repository root. Forty-nine tests cover the campaign loop, hit timing, Warp phases/cooldown/planting, stationary attacks and camera, save migration, skill points, gear bonuses, forge spending, consumables, one-time quests, sprite anchors and guardian choreography. Root `npm test` separately verifies thirteen existing arcade contracts.

`tools/render-proof.mjs` regenerates software canvas world renders, sword filmstrip and motion GIF. It requires a bundled node_modules directory containing sharp and @napi-rs/canvas; these are development tools, with no game runtime dependencies. `tools/build-anchors.mjs` derives sole anchors from alpha. The animation studio includes the four Warp poses for frame review.

Live input and layout observations are recorded in `docs/browser-verification.json`; software renders are separate evidence. Human review remains necessary for animation feel, character likeness, balance, narrow-screen usability, and unique guardian art. This is a local playable prototype, not a published campaign or a claim of visual parity with the northstar.

Native-input Frozen District playthrough: three enemies, bounty claim, Frostweave Cloak equip, shrine attunement, Rime Warden defeat, seal and Rime Fang collection, academy return, forge +1 and reload persistence verified. Paused between observations; an earlier guardian attempt ended in knockout. See docs/combat-playtest.json. Next: human review of combat timing, then unique guardian animations.

For an isolated input test, `?practice=1` uses a separate `pepe-soul-world-practice-v1` save and leaves the normal journey untouched. `docs/warp-step-motion.gif` is a deliberately slowed software-renderer review of the actual Warp choreography, not a browser recording.

Enemy source poses are now extracted as complete connected silhouettes before atlas packing, preventing neighboring swords/feet from leaking across cells. `tools/pack-enemies.mjs` records the normalized layout. `tools/pack-items.mjs` extracts the main connected item shape, removes neighboring fragments and fits each icon into a padded cell.

## Combat polish pass

Enemy facing now locks when its windup begins, so the warning predicts the committed strike. A strike cannot hit Crown more than 25 units behind the attacker. K can cancel the final 180ms of sword recovery after damage has connected; it cannot cancel anticipation or spend spirit before that window. Windup rings fill toward the strike; recovery displays OPEN. The nearby-enemy readout exposes health and timing cues. Equipped weapons color the sword trail. Jump shadows shrink with altitude while staying on the walkway.

Pointer attacks clear old click-to-walk destinations. E at the unlocked academy gate opens the Map directly. Touch controls appear on devices with coarse pointers. Hit pause is now decremented once per rendered frame, preserving the intended 45ms stop.

These combat timings and the rear-strike tolerance are draft balance assumptions. Automated checks include recovery cancellation, locked facing and gate behavior; see the combat playtest receipt for native-input evidence.

Attuned shrines also serve as revival points during the current run. Cleared enemies stay cleared; surviving enemies recover health and the guardian returns to its starting position. Crown revives with full resources and a short protection window. Reloading after knockout still uses the safe academy checkpoint. This avoids carrying a weakened boss through repeated deaths and keeps the retry close to the fight.

## Guardian choreography

`enemy-motion.js` derives anticipation, strike and recovery from actual simulation timing. Sole-centered squash and shear add a restrained weight shift without translating the floor anchor. Reduced effects keep geometry stable. Guardians carry realm-specific crystal, flame or orbit sigils; Rime Cut / Ember Cut / Void Cut warnings change to their wave cue before every second strike. Blade sweeps use realm colors. These are motion treatments of existing enemy sprites, not new dedicated guardian atlases.

`tools/guardian-proof.mjs` exports `docs/guardian-motion.gif` (slowed actual renderer choreography) and an anticipation comparison PNG. It uses the same bundled node_modules argument as render-proof. The native browser revisit observed the Rime Warden windup and recovery after real Warp traversal; no console errors appeared. See `docs/guardian-verification.json`. Human timing/likeness review remains open; no additional realm clear is claimed in this pass.

## Wave and retry follow-through

The death-screen button now calls shrine revival, rather than always traveling to the academy. Its label reflects the available checkpoint. Revival resets player cooldowns and the guardian's alternating attack cycle. Native-input verification observed a Frozen District knockout, clicked Return to the echo shrine, and confirmed Crown at 1360 with 165 HP, 100 SP, level 4, Rime Fang and one seal intact. Cleared-enemy preservation is covered separately by simulation tests. See `docs/retry-verification.json`.

Hostile waves carry realm identity, use realm-colored crescents and trailing echoes, and emit a launch burst plus an opt-in synthesized sound. The nearby foe warning identifies the wave and suggests jumping or Warp. Simulation tests confirm a grounded wave hit and a jump avoiding it. Loot now displays the recovered item and fragment amount. These changes preserve existing combat damage and rewards; no new balance economy is introduced.

## Dedicated Rime Warden artwork

The Frozen guardian now uses assets/rime-warden-v1.png: four clean poses packed on a shared sole baseline. The crystal crown, heavier armor and large icy sword distinguish him from Frostbound Tads. Recovery currently returns to the guard pose; two extra touching source poses were excluded. Original generation and extraction outputs remain available for revision. tools/pack-rime.mjs packs the clean silhouettes; docs/rime-warden-layout.json records source bounds and sole anchors. See docs/rime-art-verification.json and the regenerated guardian-motion.gif. Ember Keeper and Unnamed still use the previous atlas. Native Warp traversal verified the new Rime artwork in-game; 32 automated checks pass. Next: dedicated recovery/in-between frames and human animation review.

## Dedicated Ember Keeper

assets/ember-keeper-v1.png supplies four complete poses for the Crimson guardian, with copper armor, broken forehead mask and ember sword. Source and built-in generation prompt are retained in assets/ember-keeper-source-v1.png and docs/ember-asset-prompt.json. tools/pack-ember.mjs records sole anchors and source bounds. Rime and Ember share a 120ms anchored recovery blend; reduced effects retain a stable guard. Native controls verified the Crimson guardian defeat, second seal, Ember Fang pickup/equip and academy return. Normal enemies were bypassed, so this is not a bounty clear. See docs/ember-verification.json. Guardian comparison renders were regenerated; 34 automated checks pass. Dedicated recovery drawings and Void guardian artwork remain next.

## Dedicated Void guardian and oath completion

The Unnamed now uses assets/void-guardian-v2.png, with violet sword, floating shoulder sigil and porcelain mask. The first source reached the image edges; the selected v2 restores padding and complete blades. All three guardians now have distinct atlases, four key poses and shared sole-anchored recovery blending. Built-in generation prompts are saved in docs/void-asset-prompts.json. tools/pack-void.mjs and docs/void-guardian-layout.json record packing.

The isolated native-input journey reached the Void shrine, defeated the guardian, collected/equipped Veil Fang and recovered the third seal. Returning to Goribbit completed the oath; its 40-fragment quest reward and Guardian status persisted after reload. Crimson/Void regular enemies were bypassed, and their bounties plus the Crimson shrine remain unfinished. See docs/void-verification.json. Thirty-six checks pass. Next: dedicated recovery/in-between poses and human review of full-speed fights.

## Kek Domain ultimate

Complete the three-seal oath with Goribbit, then press F or the on-screen Kek Domain button. Soul Release remains R. Draft balance: 80 SP, 30-second cooldown, 2.4-second rooted protected cast, one 100-damage pulse after 1.25 seconds inside 420 units. The transparent crowned jade spirit is a separate layer behind actors; floor rings show the range. Reduced effects lower spirit opacity and suppress vertical streaks. Domain cooldown and spending checkpoint immediately and survive reload/travel. The cast is canceled by realm travel; transient animation is not saved. Shrine revival resets cooldown as part of the retry.

Native keyboard and button casts were checked in the academy with blocked Warp movement and no console errors. Enemy damage and single-pulse behavior were verified by simulation, not a native enemy encounter this pass. Crown still uses the existing release pose; the reference's crouched prayer pose, richer dissolve particles and sound remain unfinished. docs/kek-domain-browser.png is native proof; docs/kek-domain-preview.png is a software-rendered peak. See docs/kek-domain-verification.json and docs/kek-domain-prompt.json. Thirty-nine checks pass.


## Official Crown animation source

Kek Domain now holds the official crown-atlas idle cell, using its existing sole anchor. A separately generated prayer drawing was explored and then removed from runtime following the user's direction: animation poses must derive from the official in-game sprite. Exploration sources remain retained but are not loaded. The giant jade spirit now fades with rising jade shards; reduced effects omit shards. Separate opt-in synthesized cast and pulse cues were added, but have not been listening-tested. Native F input verified the official Crown sprite in the academy with zero console errors. Forty-one automated checks pass. See docs/kek-domain-polish-verification.json. Next: derive anticipation, planted cast and recovery frames directly from the official Crown sprite and playtest full-speed transitions.


## Official sprite cast choreography

Domain charge, pulse and recovery now animate the official Crown idle cell through a small eased scale/shear transform centered on its existing sole anchor. The source artwork, face and equipment remain identical. Reduced effects retain stable geometry. This is whole-sprite motion, not articulated prayer hands or cloth animation. Forty-three checks pass; native F input captured charge and recovery with no console errors. docs/kek-domain-official-motion.gif shows a three-second full-speed software capture of the actual simulation and renderer on an empty Frozen map. See docs/domain-choreography-verification.json. Next: articulated poses derived directly from the official sprite and native combat timing review.


## Domain pulse impact

The 1.25-second damage pulse now triggers a brief 2.5-percent maximum camera push, low-opacity emerald flash and floor-aligned elliptical ripple. Camera scaling centers on Crown's foot anchor and includes the world surface, preserving the visible contact point. It returns to normal within half a second. Reduced effects omit zoom and flash and soften the ripple. Forty-four checks pass; native F input verified the academy cast with zero console errors. See docs/domain-impact-verification.json. The full-speed GIF was regenerated. Human comfort and enemy-fight readability remain the next checks.


## Domain enemy confirmation and sprite echo

Domain now reports actual living targets struck and defeated, including a clear empty-range result. Its pulse carries a brief emerald echo sampled from the official Crown idle cell and anchored to the same floor line; reduced effects omit the echo. Native pointer traversal, Warp, Map travel and F input defeated one Frostbound Tad in Frozen District. Crown remained at 105 with 130 HP through the observed cast; XP rose from 122 to 144. No browser errors appeared. Forty-five checks pass. See docs/domain-combat-verification.json. Guardian and multi-target native casts, articulated prayer hands and listening review remain open.


## Dedicated official-derived Domain poses

assets/crown-domain-official-v1.png supplies anticipation, planted prayer, pulse scarf lift and standing recovery, edited directly from the official Crown atlas with the built-in image tool. tools/pack-domain.mjs extracts four connected transparent silhouettes at a shared 504/512 sole baseline. The cast blends between poses over 120ms and returns to the original idle before control resumes. Original source and exact prompts are retained in docs/domain-official-pose-prompts.json. Forty-six tests pass, including atlas dimensions, clipping margins and pose timing. The full-speed simulation GIF is regenerated. These are four key poses with eased transitions; additional hand/cloth in-between drawings and human likeness review remain open.


## Six-pose cast sequence

Two new official-derived poses bridge anticipation to prayer and prayer to standing recovery. assets/crown-domain-between-v1.png and its source remain separate from the four-pose atlas. domainFrames now sequences six drawings with 80ms blends, retaining the same floor anchor and pulse timing. tools/pack-domain-between.mjs records clipping margins. Forty-seven checks pass. Native ultimate-button casting at academy position 691 verified the new entry pose and prayer pulse with zero browser errors. See docs/domain-inbetween-verification.json and docs/domain-inbetween-prompt.json. The full-speed GIF was regenerated; human motion review and additional cloth/knee drawings remain open.


## Domain pose scale and grounding

In-between packing now uses scale 0.48 so its silhouette height falls between standing and crouched key poses. Both Domain sheets center on the midpoint of the outer boot soles, avoiding alpha-weight shifts when one boot carries more pixels. Packing metadata now matches the actual 300px draw size. Forty-eight checks pass; native F input verified entry and pulse at academy position 691 with zero errors. docs/domain-grounding-comparison.png compares all six poses and original idle on one floor line. See docs/domain-grounding-verification.json. Individual toe positions still differ between drawings; human full-speed feel review remains open.


## Bent-knee recovery drawing

A seventh official-derived pose, assets/crown-domain-rise-v1.png, bridges the pulse crouch to hands-opening recovery. Its packed height sits between those adjacent poses and uses the same boot midpoint and 504/512 floor anchor. Recovery proceeds through the bent-knee rise at 1.65s, hands opening at 1.86s, standing at 2.06s and original idle at 2.22s. Forty-nine checks pass. Native F input captured the new frame at academy position 691 with no console errors. See docs/domain-rise-verification.json and docs/domain-rise-prompt.json. The full-speed GIF and grounding comparison were regenerated. Individual toe cleanup and human full-speed feel/likeness review remain open.


## Solid pose blending

Crown's Domain blends now accumulate weighted drawings on a transparent layer before compositing onto the world. This fixes overlapping opaque pixels briefly becoming translucent during direct source-over crossfades. tools/check-domain-blend.mjs verifies five blend weights retain opaque overlaps and do not spill below the sole baseline. All 49 gameplay checks pass. Native F casting verified the browser canvas path with no errors; see docs/domain-solid-blend-verification.json. Different outlines still crossfade briefly; individual toe cleanup and human feel review remain open.


Final browser review exposed double outlines on changing limb poses, so those transitions now use direct drawn frames. Only the nearly identical prayer/pulse cloth drawings retain the solid-layer blend. Native F input verified the crisp entry with no errors in docs/domain-crisp-transition-browser.png. The full-speed preview reflects this final version.

## Ultimate guide and guardian verification

Skills now shows Kek Domain oath/seal progress, canonical 80 SP cost, 30-second cooldown, 420 reach, 100 damage and cast phases. The grounding comparison renders both facing directions. All 50 gameplay tests pass, including guardian cast protection, root/facing lock and one pulse in both directions. Native practice gameplay with pointer movement, Warp Step, realm travel and F casting hit four enemies, defeated three and reduced the Rime Warden from 210 to 110 HP, triggering level 5 to 6. No browser errors. See docs/domain-guardian-guide-verification.json. This verifies guardian damage through real input; individual toe cleanup, human full-speed review and sound listening remain open.


## Standing cast scale correction

Anticipation and standing recovery now draw at 270px instead of 300px, reducing the silhouette jump against the original 230px atlas idle. Crouched and intermediate poses retain their existing sizes and every pose uses its existing sole anchor. Both-facing grounding comparison and full-speed simulation GIF were regenerated. This corrects presentation scale; individual toe shapes are unchanged.


## Domain motion studio

The animation studio includes Kek Domain as a 72-frame, 30fps, 2.4-second sprite inspection sequence. It reuses the gameplay pose selection, transforms and pulse blend, supports keyboard scrubbing, mirroring, onion skin and speed control. The floor guide now uses the same 468px sole position as the preview. Playback advances every elapsed frame instead of dropping advances during slower rendering. Native studio controls verified left-facing frame 72, pulse frame 40 with onion skin, and resumed playback at frame 47; zero console errors. All 50 existing checks pass. This is sprite review without ultimate spirit/camera effects; actual toe artwork remains unchanged.


## Boot contact during Kek Domain

Domain foot contact spans are sampled from opaque pixels in the bottom eight rows of every official-derived pose. domain-feet.js is generated by tools/build-domain-feet.mjs. The renderer draws two subtle contact shadows below the corresponding boots, respecting pose size, facing and grounded horizontal compression. The existing broad shadow remains underneath. Original sprite pixels and simulation are unchanged. Toe shapes still need art refinement.


## Readable cast phases

Kek Domain now shows a compact Plant / Prayer / Pulse / Recover cue and cast progress bar above the lower HUD. Phase boundaries follow the existing pose sequence; simulation timing, damage and cost are unchanged. The cue disappears outside the cast. All 51 checks pass, including phase boundaries and bounded progress. Human combat readability remains a playtest gate.


## Guardian focus in crowded combat

The combat HUD prioritizes a living guardian within 430 units over closer regular enemies. Otherwise it shows the nearest living enemy in the current realm. A nearby-enemy count keeps crowd pressure visible. Target selection is presentation only: damage and enemy AI are unchanged. On narrow screens the cast cue sits above the combat readout. All 53 tests pass, including boss priority, range boundaries, realm/dead filtering and regular-enemy fallback.


## Crowd label lanes

Enemy labels draw after all enemy sprites. Living enemies reserve non-overlapping 60px vertical lanes when their label widths intersect, ordered by guardian priority and stable position/id. Name, committed attack/recovery cue and health bar share each lane. Dead enemies reserve no space. All 55 checks pass. Large crowds on short viewports can still extend labels above the visible area; the guardian combat HUD remains available.


Final crowd review capped upward lanes at 360 units above the floor; additional labels spread left with leader lines instead. All 56 checks pass. This final sideways fallback is covered by layout tests; the saved native screenshot shows the preceding upward-only version that exposed the issue.


## Desktop and narrow crowd verification

Native gameplay at 1280x720 and 640x900 verified final sideways label lanes against a guardian plus three tads. The narrow cast and guardian readouts remain separate. Review exposed overlapping narrow Warp/Domain controls: Domain now sits above Warp with a measured 4px gap at 640px. Revival now calls the shared unpause path to clear a lingering pause overlay. All 56 checks pass; no browser errors in the layout run. Viewport override was reset after testing.


## Expanded touch controls

Narrow screens show 48px-minimum controls for movement, Jump, Slash, Warp Step, Wave, Talk, Release, Domain, Heal and Spirit. Pointer ownership is tracked separately from keyboard-held keys: one released/cancelled pointer cannot clear another finger's movement. Pause, journal, blur and death clear both input sources. Native pointer tests at 640x900 moved Crown 695 to 743 with a held button, stopped on release, jumped, slashed, warped and cast Domain after slash recovery. All 58 checks pass; no console errors. Simultaneous physical multi-touch and flask consumption remain device/playtest gates.


## Touch supply counts and Domain readiness

Heal and Spirit show pack counts and disable at full resources, zero supplies, pause/journal or death. Domain's touch and main button share domainReady with the simulation, including grounded state, hurt/attack/dash recovery, cooldown and spirit. Native 640px practice tests bought one flask of each at Goribbit: Wave lowered SP to 75, Spirit restored 100 and consumed the flask; changing robe then re-equipping the cloak left HP175, Heal restored195 and consumed the flask. Full/empty button states were verified. All 59 checks pass; no browser errors. Physical simultaneous multi-touch remains open.


## Touch combat readiness

Warp Step, Wave and Release share abilityReady with the simulation. Their touch buttons disable during unavailable combat states, show cooldown seconds, and expose spirit-cost/recovery help. Release shows active awakening duration. Native 640px tests cast Release, Wave and Warp Step; verified awakening, Wave cooldown, Domain low-SP disable and Warp cooldown. All 61 checks pass with no console errors. Rules and balance remain unchanged; physical simultaneous touch remains open.


## Crown overlap visibility

Crown gains a subtle steady jade rim light when a living enemy overlaps his screen silhouette (160 units for guardians, 100 for regular enemies, within 230 vertical units). Reduced effects use a smaller blur. It changes neither sprite pixels, sole anchors nor combat state. tools/hero-visibility.mjs renders a reproducible four-enemy crowd fixture with the actual renderer; docs/crown-crowd-before.png and docs/crown-crowd-preview.png compare the result. All 61 checks pass.


The native route ran without browser errors, but Crown died before an unobstructed overlap capture. The retained crowd comparison is a software-rendered fixture; live overlap visual confirmation remains open.


## Solid recoil visibility

Live guardian review exposed the existing 0.6 recoil opacity hiding Crown against overlapping dark cloaks. Recoil now draws opaque; the dedicated hurt frame, knockback and hit effects convey the impact. Warp phase retains its 0.18 opacity. Native input route and a guardian hit verified HP173 to151 and Crown's solid recoil at x1823, with zero browser errors. All 61 tests pass. See docs/crown-solid-recoil-browser.png. Physical feel and likeness review remain open.


Quest reward clarity: Quests now sorts ready rewards first and claimed quests last, labels progress and receipt status, and links earned equipment to Inventory. Guardian spoils use saved recovery flags. Verified the native Quests-to-Inventory flow in practice mode with no console errors; all 61 tests passed. Screenshot: docs/quest-rewards-browser.png. Claim-ready sorting was inspected in source; the current practice save had no unclaimed ready quests.

Gear comparison: Inventory previews slot-specific gains/losses using the actual stats function, including individual blade tempering. It displays resulting sword bonus, HP, defense, spirit regeneration, Warp reach and wave bonus, with an HP-cap warning when relevant. Live practice verified Veil Fang to Rime Fang +1, equal Ember stats, and Veil +6 comparison; original loadout restored. 63 tests pass, no browser console errors. Native screenshot: docs/gear-comparison-browser.png.

Skill previews: Skills shows current-to-next-rank combat values and explicit lock reasons, with maximum-rank labels. Learning shares the same eligibility rules as the preview. 65 tests pass, covering all six skill previews and blocked learning. Native practice UI verified Warp rank 1 to 2: reach 275 to 310, cost 18 to 16 SP, cooldown 0.8 to 0.7 seconds, and points 3 to 2. No browser errors. Practice save now retains rank 2; normal save untouched. Screenshot: docs/skill-preview-browser.png.

Realm map clarity: Map separates seal recovery, shrine attunement and guardian gear recovery, and explains disabled travel prerequisites. Travel buttons name destinations; journal closes only when travel succeeds. Native practice verified Frozen to Academy return, HP restoration 173 to 195, saved realm milestones and gate-distance lock guidance with no console errors. Practice save now at Academy 420; normal save untouched. Syntax checked. Screenshot: docs/realm-progress-browser.png.

Exploration quest guidance: The HUD prioritizes claimable rewards and adds their count to the Quests launch button. Otherwise it guides academy training, shrine checkpoints, seal collection, guardian gear pickups and unfinished bounties using saved progress. 67 tests pass. Native practice verified the post-oath remaining objective (Ashes of the oath) visibly appears, with no console errors. Reward-count and realm branches covered by rule tests rather than a new native playthrough. Screenshot: docs/quest-guidance-browser.png.

Combo trail polish: Official Crown attack frames retained; opening and return cuts now sweep opposite directions, while the third cut has a wider, heavier trail. Glow uses the equipped blade color and respects reduced effects. Strike timing/damage unchanged. 68 tests pass. Native J input entered attack mode with no console errors. Three-cut visual comparison is a software-rendered fixture using the gameplay renderer, not a native sequence recording: docs/combo-trails-preview.png. Full-speed visual feel remains a playtest gate.

Combo timing cues: Existing Warp status now temporarily shows cut number, accepted queued-next-cut state, and Warp cancel only when actual dash eligibility allows it. 69 tests pass; simulation test exercises queue acceptance then Warp cancellation. Native keyboard slash verified Commit and queue-next prompts with no browser errors. Timed native Warp-cancel capture missed the brief window, so queued/cancel transitions remain rule-test verified. Screenshot docs/combo-cue-browser.png.

Combo continuity: New prototype grace window is 0.65 seconds after attack recovery; idle attacks restart at cut one, while queued cuts and quick Warp follow-ups retain continuity. Hurt and realm travel clear the chain. 71 tests pass, including queued continuation, idle restart and Warp follow-up. Native keyboard verified accepted Cut 2 queued and Warp cancel cue together, plus a fresh cut-one start after idle; no browser errors. Native screenshot docs/combo-queued-browser.png. Grace duration needs player feel tuning.

Frozen atmosphere slice: Deterministic layered snowfall with camera parallax and periodic wind gusts replaces the generic frozen motes. Grounded running and landings kick up snow; Warp parts nearby flakes and throws departure/landing snow; Domain spirals nearby flakes then pushes them outward at pulse. Bounded transient particles, reduced-effects counts and no gameplay/save mutation. 74 tests pass. Native walking/gate crossing to Frozen and successful keyboard Warp verified (x260 to480 during phase, SP100 to85), no console errors. Native docs/frozen-weather-browser.png; empty-scene software fixture docs/frozen-weather-preview.png. Domain swirl and full-speed feel still need visual playtesting. Other realms retain existing ambient effects.

All-realm atmosphere: Academy falling leaves, Frozen snowfall, Crimson rising embers and Void curved spirit wisps now share bounded layered weather and footfall/Warp/Domain reactions. Old generic motes removed. Every crossing clears transient particles immediately. 75 tests pass, including all realms in both layers and reduced mode, Domain phases and cross-world cleanup. Native practice visited Frozen, Academy, Crimson and Void through walking/gate controls; Crimson Domain completed (one enemy defeated); Void reduced-effects toggle verified. No console errors. Practice returned safely to Academy, normal save untouched. Software comparison docs/all-realm-weather-preview.png; native docs/weather-{frozen,academy,crimson,void}-live.png. Full-speed aesthetic tuning and device performance remain playtest gates.

Atmosphere refinement: Crimson now mixes gray falling ash with warm rising embers, giving the two particle types opposite vertical motion. Void wisps occupy a low band above the surface instead of floating across the whole sky. 76 tests pass, including ash/ember direction and Void surface bounds, plus the existing all-realm rendering and reaction checks. Refreshed and visually inspected the software-rendered four-realm comparison. This pass did not repeat the native travel review; full-speed artistic tuning remains open.

Two-map realm journey: All enemy realms now begin in an approach with three regular enemies and a shrine. Clearing all three opens the passage at 2250; E or the nearby Map action enters a separate boss-only guardian arena. Arena travel back to Academy is locked until guardian defeat and proximity to its return portal at 2250. Defeat opens the portal; E returns home. Approach clear IDs, arena state and guardian defeat persist in version-2 saves; uncollected guardian rewards reappear on reload without duplicating collected rewards. Attuned arena death returns to the approach shrine with its passage still clear for that run. Existing saves migrate to the approach without losing permanent progression. Arena uses a closer composition of the current realm painting, not newly commissioned arena art. 78 tests pass, including full simulated completion of all three realms, gates, save/reload reward safety and shrine retry. Native Frozen run used real walking, cuts, waves and Domain: three enemies cleared, arena entered, guardian defeated, return portal used, Academy reached at level 7 with full HP/SP and no console errors. Native proof docs/guardian-portal-unlocked-browser.png. Crimson/Void complete flow is simulation-tested, not newly native-played this turn.

Three-map realm expansion: Approach I now leads to an elite Approach II, then the guardian arena in all three realms. Six new enemy designs with 24 packed, grounded poses; distinct lunges, heavy cleave and caster behavior. All 82 tests pass. Native Frozen full route returned to Academy without browser errors; corrected art inspected across all realm visual fixtures. Stage paintings are recomposed existing art; balance and animation in-betweens remain playtest work. Detailed evidence and files: docs/approach2-validation.md. Kek Rift remains a discussion reference, not an implemented skill.

Kek Rift prototype: unlock at level 3 with one seal; jump then L for a committed sword slam and forward fracture. Surviving patrol enemies launch, guardians stagger; cost 40 SP, cooldown 8s, reach 600. Existing official Crown frames reused. All 86 tests pass; native cast and elite damage verified, all-realm launch previews simulation-rendered. Dedicated reference-matching overhead/ground-stab poses and organic fracture artwork remain future polish. See docs/kek-rift-validation.md for files, tuning assumptions and evidence.

Rift motion refinement: five official attack poses now cover overhead windup, descent, low impact and recovery. Sole-anchored impact compression and irregular fracture growth replace the initial three-pose/even-shard sequence. Rift is reviewable in the animation studio through scrubbing, flipping and onion skin. 89 tests pass; native studio and Academy casting verified without errors. Dedicated planted-blade artwork remains a visual gap. See docs/kek-rift-validation.md.

Rift quick-input reliability: a 0.15-second rising-jump buffer catches early L inputs and spends Spirit only when casting starts. Grounded L remains Wave; cancelled or expired inputs cost nothing. Enemy hit feedback preserves Rift impact shake, while reduced effects disables it. All 93 tests pass; fast native Space/L casting completed and returned to grounded idle without console errors. See docs/kek-rift-validation.md and docs/rift-quick-input-native.png. Buffer timing needs feel testing; dedicated planted-blade artwork remains open.

Realm art v1: six distinct approach paintings now match their Frozen/Crimson/Void identities; guardian arenas retain the original scenes. All gates use four new transparent painted portal frames with animated energy and grounded bases. Rift uses four painted eruption variants, ground light, a brief camera push, darker windup and impact flash; official Crown sprites retained. 97 tests pass, native Frozen travel and Academy Rift casting verified, studio scrubbed without errors. All six approaches/four portals/three-realm Rift reviewed in renderer fixtures. See docs/realm-art-v1-validation.md for assets, prompts, evidence and remaining feel/animation checks.

Rift planted-blade pass: two official-Crown-derived frames now show sword planting at ground contact and pull-out recovery. Original overhead/descent/ready frames retained, short transparent-layer blends smooth transitions, reduced effects switches directly. 98 tests pass; native studio inspected both poses including mirrored pull-out, real Academy Space/L casting completed without errors. Source, packed atlas and exact prompt preserved; see docs/kek-rift-validation.md and docs/rift-planted-sequence-preview.png. Full-speed feel and reference likeness remain human review.

Rift flow polish: descending emerald sword trail bridges windup and contact; planted pose blend now completes in18ms and ready recovery in30ms. Reduced effects keeps a restrained trail. 99 tests pass; native keyboard casting completed without errors. Full-speed empty Academy simulation/renderer GIF is linked from the animation studio: docs/rift-full-speed-flow.gif. Details and native evidence: docs/kek-rift-validation.md.

Portal coherence cleanup: state-backed sealed/open gates and destination prompts across every realm, aligned travel boundaries, corrected arena return guidance, and reduced-effects Rift density. 106 tests pass; 26 portal renderer cases reviewed and native Academy/Frozen return verified without console errors. See docs/portal-coherence-validation.md for files, evidence and playtest limits.
Kek Wave visual upgrade (2026-10-05): filled emerald sword crescent with a bright leading edge, tapered translucent wake, bounded travelling streaks, launch ring and enemy impact cut/sparks. Grounded casting uses existing official Crown sword poses without changing movement, damage, cost, projectile speed or airborne Rift routing. Reduced effects removes glow and lowers streak count. Files: kek-wave.js, core.js, render.js, tests/kek-wave.test.mjs, tools/wave-proof.mjs. All 107 tests pass, including one impact event per enemy and official release pose recovery. Native practice L cast verified SP100 to72 with no console errors; docs/kek-wave-native.png. Full-speed empty-map preview docs/kek-wave-full-speed.gif is a simulation/renderer fixture, not a browser recording. Human aesthetic and combat readability review remains next.
Wave continuity polish: standing release/recovery now blends official Crown poses over 35ms and returns to idle; movement immediately uses the running clip, fixing a cast-pose override. The wake grows from the sword at launch. Enemy contacts now show a directional emerald cut with radial streaks; reduced effects removes glow and reduces streaks. Updated kek-wave.js, render.js, tests/kek-wave.test.mjs and visual receipts. All 109 tests pass, including each enemy realm's single-hit damage and movement override. Native practice L input confirmed spirit consumption and no console errors (docs/kek-wave-polish-native.png). Refreshed full-speed renderer GIF; full enemy-combat visual playtesting remains next.
Wave combat readability audit: replaced the oversized launch ring with a compact directional crescent tied to the sword. Reviewed actual renderer contacts across nine cases: regular approach, elite approach and guardian arena in Frozen, Crimson and Void (docs/kek-wave-combat-audit.png). 111 tests pass, including elite/guardian damage, piercing with no repeat hits per target, and effect expiry in normal/reduced mode. Changed kek-wave.js, render.js, tests/kek-wave.test.mjs; added tools/wave-combat-proof.mjs and refreshed preview assets. Damage, cost, input and progression remain unchanged. This pass used simulation/renderer fixtures; native casting was verified in the preceding pass, and a complete live enemy-combat playtest remains open. Test: run node --test pepe-soul-world/tests/*.test.mjs, then use grounded L against patrols and guardians. Next: tune full-speed readability and enemy responses during a full realm run.
Wave controls and native combat pass: touch control/footer now consistently name Kek Wave; the HUD shows its active cooldown after grounded L. Skills adds a sword-release card with live level/gear damage, SP cost, cooldown, piercing behavior and airborne Rift distinction. Changed game.js, journal.js and index.html. Syntax checks passed and native Skills card displayed 60 damage for the current level-8 build. Native practice crossed the Academy gate into Frozen via real controls: first L reduced a Frostbound Tad from65 to5 HP; second L defeated it (3 remaining to2, XP64 to86). No console errors. Returned to Academy at x420 with full HP/SP. Normal save untouched. Receipts: docs/kek-wave-combat-native.png and docs/kek-wave-skills-native.png. The prior111-test suite covers realm/elite/guardian wave damage; this pass adds native Frozen evidence, not a full three-realm boss replay. Next: full-run feel tuning and airborne switching review.
Combat cue coherence: extracted combat-cues.js so the HUD retains simultaneous Warp and sword-ability readiness. Low spirit explicitly shows the required SP; recovery is labelled. Unlocked airborne L uses Rift's separate cooldown, while pre-unlock airborne L remains Wave. Existing committed Rift/queued jump and combo timing cues retain priority. Changed game.js; added tests/combat-cues.test.mjs. 113 tests pass. Native Space showed Rift40SP, then L cast successfully with the RAISE cue; grounded L afterward showed Wave cooldown alongside Warp16SP. No console errors during Rift verification. Practice restored at Academy; normal save untouched. Receipts docs/combat-cues-native.png and docs/combat-cues-wave-native.png. Next: smaller-screen layout and full-run feel testing. No combat balance changes.

Emerald Temple: optional post-oath two-map challenge (Approach → Jade Abbot sanctuary → home). Two new paintings, new four-pose guardian art, emerald atmosphere, saved flask/fragment reward, and clean all-four-moves GIF. 114 tests pass and live approach travel verified. See docs/emerald-temple-validation.md for assumptions, evidence, files and prompts.

Emerald Temple encounter pass: distinct four-pose Jade Disciple art, dedicated Abbot cleave / fixed lotus eruption / low wave cycle, three lotus zones below half health, readable recovery cues, and grounded per-frame disciple anchors. 124 tests pass. Native isolated practice completed approach, shrine, boss, reward and Academy return; no warning/error console entries. Real Domain, Rift stagger, Wave victory and Warp lotus evasion verified. Details, files, prompts, tuning assumptions and screenshots: docs/temple-encounter-validation.md. Next: human difficulty and full-speed pose-transition review.

Temple timing pass: existing enemy poses blend through anticipation, release and recovery around grounded sole anchors; Rift stagger returns from the interrupted pose. Visible windup/counter meters and a timed jump cue make dodges easier to read. Temple sweep jump clearance changes from135 to100 units; damage/cost/timing stay unchanged. Replay guidance respects an already recovered reward. 130 tests pass; live disciple and Abbot jump evasion, reduced effects, boss completion, saved victory and Academy return verified without browser errors. Full-speed 3.1MB simulation preview: docs/temple-dodge-counter.gif. Files, tuning and evidence: docs/temple-timing-validation.md. Next: dedicated enemy movement poses and human feel tuning.

Temple enemy walking pass: dedicated six-pose disciple/Abbot cycles now follow real travel distance, with measured sole anchors and walk-to-attack transitions. 135 tests pass; native approach, boss and return flow verified. See docs/temple-walk-validation.md and the 7.4 MB docs/temple-walk-combat.gif simulation preview.

Sword guard: four official-Crown-derived poses now raise, hold, brace and recover around grounded sole anchors. Hold S / Down, click the desktop toggle, or hold the touch control; frontal strikes/projectiles spend Spirit, rear hits and ground eruptions bypass, and K exits into Warp. Spirit exhaustion breaks guard. 143 tests pass; native Temple blocks, guard break and mirrored studio pose verified with no browser warnings/errors. Practice returned to Academy; normal save untouched. See [validation, files and tuning assumptions](docs/sword-guard-validation.md), [live block](docs/sword-block-temple-native.png), and the [4.2 MB block-to-counter simulation GIF](docs/sword-guard-counter.gif). Next: full-encounter feel and mobile hold review.

Guard-to-counter flow: releasing the last keyboard/touch/toggle input clears guard immediately, preventing fast follow-up cuts being dropped between simulation ticks. Touch guard now takes over a desktop toggle, and the existing braced/held art blends into the opening cut over 60ms. 149 tests pass. Native keyboard and 390px touch-control checks verified release → Slash; two Temple disciples were blocked then countered with HP240 unchanged. Practice returned to Academy; normal save untouched. Updated [4.2 MB preview](docs/sword-guard-counter.gif) and [evidence/files](docs/sword-guard-validation.md). Damage, costs and hit timing unchanged. Next: physical multitouch and lower-level guardian feel review.
