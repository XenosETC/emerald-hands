# KONTRA: THE KEK WARS

A local, single-player Pepe run-and-gun prototype with three playable realms: the swamp assault against Iron Lily, Stormforge against the Tempest Warden, and Jade Rift against the Rift Bloom. All visuals are drawn by this game's renderer; no reference-game assets, music, maps, or code are included.

## Play

Double-click **Play Kek Wars.cmd** (requires Node.js on PATH). It starts the arcade's static server on port 4188 and opens the game. Alternatively run `npm run dev` from the arcade root and open http://127.0.0.1:4173/kontra-kek-wars/index.html.

Move with A/D or arrows; Space/Z jumps; hold J/X to fire; W/S or up/down aims (downward fire while airborne); K/C throws a grenade; Shift dashes; P/Escape pauses. On-screen controls include DASH and support simultaneous pointer inputs. Sound is optional. Losing browser focus pauses the mission.

Press Q or tap SWAP to cycle unlocked weapons. Realm-clear screens offer an optional upgrade before continuing. No campaign kit or checkpoint data is written to other games or persisted across a page refresh.

## Field test 008 — Jade Rift and the Rift Bloom

- **Wisp preparation:** a half-second charge locks the target before the shot. Orbital coils compress during charging, expand on release and trail behind the floating crystal. A small target ring previews the committed aim. Hits briefly stagger and tilt the wisp.
- **Stalker movement:** a crouch previews a committed landing point, followed by a 720ms leap with a 78-unit arc. The landing is capped at 130 horizontal units from launch; it does not retarget in flight. Six articulated legs tuck during the leap, stretch on landing and settle through a short recovery. Crystal enemies break into cool-colored shards.
- **Rift Bloom:** petals close during attack preparation and open during recovery. The exposed recovery state grants 15% additional bullet damage. Root waves now warn before travelling left at 290 units/second, instead of hitting the whole arena simultaneously. Watch the approaching front and hold jump over it. Spore locks mark fixed ground locations; phase two adds a second delayed mark and a 750ms cadence break when the phase changes. HP remains 110; there is no invulnerable shield phase.
- **Visual depth:** moon haze, layered floating shelves, crystal roots, moving mist and detailed petals replace the flatter silhouettes. Live root crests and their fading trails are visually separate; target marks display countdowns. All motion follows simulation time and freezes on pause.
- **Verification:** 48 tests pass across `engine.test.cjs`, `reactor-surge.test.cjs` and `jade-rift.test.cjs`. New tests cover aim locking, committed landings/recovery, finite travelling-wave collision, phase-two spacing, the 15% core bonus, shatter feedback and a clean held-jump dodge. `jade-rift-qa.cjs` records a real-input direct Jade Rift clear at 9,150 points, full armor and no retries, including enemy preparation/leap frames, pause pixel equality, both boss phases and phone layout. `campaign-qa.cjs` records a full three-realm clear at 32,850 points, three armor and no retries. Receipts: `jade-verification-v8.json` and `campaign-verification-v8.json`.

Run `node --test kontra-kek-wars/engine.test.cjs kontra-kek-wars/reactor-surge.test.cjs kontra-kek-wars/jade-rift.test.cjs`. With the local server running, use `node kontra-kek-wars/jade-rift-qa.cjs` for the focused browser check. Reactor Surge reward rules, weapon modifiers and checkpoint kit restoration remain in place. No additional realm event was implemented in this pass.

The automated clears establish a completable route and visible animation states. Human feel, audible sound quality, low-end-device performance and physical-phone multitouch remain manual quality gates.

## Field test 007 — gate rhythm and combat feedback

- **Readable gate timing:** a 900ms all-safe startup leads into a shared 3.2-second clock. Each conduit has 1.65s open, 1s charging, 400ms live and 150ms venting, with staggered phases. Logic, world labels and the nearest-gate readout use the same `gateState()` result. Green crossing advice becomes conservative near the end of an opening; use it from the marked waiting pads, not from anywhere in the chamber.
- **Waiting and progress cues:** pads sit outside the collision columns; charging panels, decimal countdowns, live-energy filaments, vent wisps and cleared-gate lights show the rhythm. The chamber instruction panel stays on screen as the camera moves. Passing a gate is remembered while backtracking; it does not disable that gate's energy.
- **Distinct weapon signatures:** Piercing Rails has cool elongated tracers, rail attachments, firmer recoil and a ring/streak plus chime when a shot actually penetrates an ordinary enemy. Overclock has amber weapon vents, warmer tracers, faster recoil recovery and a sharper shot tone. Their mechanical bonuses remain +1 penetration versus +20% firing rate; there is no new damage buff or heat penalty.
- **Enemy and player animation:** crawler leg motion follows actual movement and its charge has a distinct state; drones bank gently and dip when firing. Hit reactions use a brief rim flash rather than an opaque block over the sprite, with torso flinch and a short player hurt accent.
- **Verification:** 41 unit tests pass, including a zero-damage opening-following route at 30/60/120 input updates per second, exact timing states and a real projectile punch-through effect. The updated `reactor-qa.cjs` records `reactor-verification-v7.json`: real-input zero-damage conduit clears, both upgrade firing signatures, exact pause pixel freeze, death/retry retention, boss clear, Jade Rift carryover and phone reward selection. `enemy-animation-qa.cjs` records the crawler/rocketeer/drone/stagger browser checks in `enemy-animation-verification-v7.json`. The arcade smoke check passes.

The timing and feedback are still prototype tuning. These checks establish deterministic behavior and rendered states, not human feel approval, audible sound quality or physical-phone multitouch performance.

## Field test 006 — Reactor Surge

The approved optional event is available at the marked gate near **x=2500 in Stormforge**. Press **E** or use INSPECT SURGE. Its preview pauses combat. Take the safe bypass without starting any event hazards, or accept a short side chamber with three timed conduit gates. Wait for dark windows or dash through active energy. WITHDRAW returns to the ordinary route and retains damage taken. There is no time limit and no event enemy spawn.

Cross all three conduits and choose one weapon modifier:

- **Piercing Rails:** every weapon penetrates one additional ordinary enemy. Rifle/Spread pierce two targets, Pulse three.
- **Overclock Chamber:** every weapon fires 20% more shots per second; its firing interval is divided by 1.2. The bonus also applies to weapons unlocked later in the campaign.

The chosen modifier carries through the remaining campaign, including newly unlocked weapons and checkpoint retries. The upgrade and claimed-event flag are committed to retry kits without changing the checkpoint score, enemies, supplies or ordinary pickup snapshot. This lets a player retain the earned modifier after a later death without farming rewards. Only one choice can be claimed; failed, unclaimed attempts can be tried again after checkpoint retry. Fresh deployment, RESTART and refresh begin a fresh run. Campaign-long does not mean permanent across runs.

Event logic lives in `reactor-surge.js` and its gate/sign art in `reactor-art.js`. Other proposed realm events remain unimplemented. `EVENT_DESIGNS.md` separates the shipped event from proposals.

Run `node --test kontra-kek-wars/engine.test.cjs kontra-kek-wars/reactor-surge.test.cjs` for the combat and event tests (currently 41 total). With the local server running, `node kontra-kek-wars/reactor-qa.cjs` checks the bypass, real-input conduit clear, freeze behavior, both reward choices, a real death/retry, Stormforge victory and modifier carry into Jade Rift. The current receipt is `reactor-verification-v7.json`; `reactor-verification-v6.json` is the earlier event implementation receipt. The browser test is an automated playthrough, not human feel approval.

## Field test 005 — balance, loadouts and the Jade Rift

**Stormforge balance:** enemies activate within 600 world units, show a half-second wind-up and lock their aim before firing. Drones shoot more slowly, rockets travel more slowly, and crawlers have a shorter rush with longer recovery. The Warden's rail warning is 1.1 seconds, its attack gaps are longer, and phase two adds a 650ms breathing window. A charge meter culminates in JUMP NOW during the final 280ms of a low-rail warning. The exposed recovery window takes 25% additional bullet damage. Arena entry removes approach fire and stops off-arena enemies from adding pressure during the boss.

**Animation and readability:** rocketeers brace and recoil with a visible backblast, drones dip when firing, crawlers compress during wind-up, and charge bars distinguish preparation from recovery. The Warden's armor keeps its detail on hit; its exposed core and phase shift have distinct cues. Pulse shots, rifle shots and rift spores have different visual shapes/colors.

**Weapons and upgrades:** Rifle remains a fast single shot; Spread fires three lanes; Pulse fires a 3-damage shot every 200ms that can pierce two ordinary enemies. It trades spread coverage for a focused line. A realm-clear choice unlocks Pulse or a Dash Coil (1.25s recharge instead of 1.6s). One optional reward can be claimed per clear, and already-owned rewards cannot be taken again. Inventory, active weapon and the coil carry into the next realm and checkpoint retries; RESTART resets that realm to a fresh kit. Choosing a mission directly starts without campaign rewards.

**Jade Rift:** a compact 4,400-unit third realm with drifting islands, crystal growth, moving foliage, luminous spores and six-legged stalkers. Wisps hover and fire spores; stalkers wind up and leap. Its Rift Bloom boss alternates a warned root wave and targeted spore locks, with a faster second phase. Root waves are ordinary boss attacks, not the proposed realm-event feature. A Pulse capsule ensures direct realm-three deployment can try the new weapon. Two checkpoints use x=1840 and x=3540.

**Historical status at Field Test 005:** realm events were design-only. Reactor Surge is now implemented as described above; Flood Pulse, Gravity Bloom and Echo Grove remain proposed. Realm-clear loadout rewards are separate from the event reward.

All weapon, upgrade and balance values are provisional. This remains a short prototype campaign with continuous ground, not a finished content release.

## Field test 004 — Operation Stormforge

Choose either mission on the deployment screen. After defeating Iron Lily, CONTINUE starts Stormforge with the earned score, kill count and weapon, plus full armor and three grenades. Choosing a mission directly starts its own fresh run with zero score. RESTART resets the currently selected mission. Campaign progress is session-only; refreshing returns to mission one while retaining the local best score.

- **New route:** a 4,800-unit rain-soaked foundry with a different platform layout, cooling machinery, lit vents, animated fans, cranes, steam, rain and wet steel reflections.
- **Crawler bots:** low mechanical units telegraph, then rush horizontally. Their legs accelerate during the charge.
- **Hover sentries:** oscillate above the route and fire aimed shots downward; rotating fans and a warning eye distinguish their attacks.
- **Rocket troops:** hold position and fire slower, clearly drawn missiles. The launcher and armored silhouette distinguish them from the jungle riflemen.
- **Tempest Warden:** an articulated reactor walker with a rotating core, moving legs, recoil and missile pods. Its first phase alternates a warned low rail beam with missile locks. Phase two adds high rails and a second missile zone. Jump low rails, stay grounded for high rails, and leave the marked missile zone.
- **Two new checkpoints:** transmitters at x=2040 and x=3940. Retries preserve the current mission, checkpoint score and pickup/enemy snapshot, with full armor and a fresh full-health Warden. Campaign score and the carried weapon also survive an early mission-two death before its first checkpoint.
- **Further polish:** footfall dust, swaying resistance flags, detailed platform edges and highlighted supply capsules carry across the two missions.

Enemy HP, timings, route length, supply counts and score carry are provisional prototype choices. The ground remains continuous; pits, moving platforms and a third mission are outside this slice.

## Field test 003 — combat feel and animation

- Tap jump for a shorter arc; hold for a higher jump. A 100ms minimum rise keeps taps useful. An 85ms ledge grace period and 110ms input buffer make platforming more forgiving. Holding jump no longer causes repeated automatic jumps.
- Shots now travel at 820 world units per second, originate at the aimed muzzle, and check the path traveled during each simulation step. Hit sparks, a 90ms enemy stagger, and a 28ms kill hit pause reinforce confirmed hits.
- Art is now separated into `art.js`: articulated running legs, airborne knee lift, landing squash, idle breathing/blinking, headband motion, aiming arms, rifle recoil, muzzle flashes, enemy flinch/fall, and aiming turrets. Animation is driven by simulation state, not browser wall time.
- Tracers, ejected casings, score popups, expanding blast rings, smoke and boss-core lighting replace the basic rectangle-only feedback. Result explosions can finish for 800ms without advancing combat or rewards.
- The camera eases toward the player; layered mountain ridges, mist, light shafts, waterfalls, foliage motion and ground reflections add depth. The Iron Lily has shaded armor, recoil, phase-two smoke and pulsing lamps.
- Existing stage, checkpoint restoration, controls and best-score storage key remain in place. Bullet speed, stagger and jump tuning are provisional feel decisions.

## Field test 002 — combat and mission upgrade

- **Dodge dash:** 0.19 seconds of fast movement and damage protection, followed by a 1.6-second recharge. Direction follows movement or facing. A ghost trail and charge bar show the active state.
- **Kill chains:** successive kills within three seconds increase the score multiplier, up to ×4. Taking damage or letting the timer expire resets the chain.
- **Outpost and fortress checkpoints:** transmitters at x=1720 and x=3340 restore up to two armor and supply at least two grenades. Death offers a retry with full armor, the checkpoint weapon/supplies, and the score, enemies and pickups captured when that checkpoint activated. Earned progress after the checkpoint is rolled back. Checkpoints last only for the current page session. RESTART always starts a fresh mission.
- **Iron Lily phase two:** half health changes attack timing and adds a second mortar zone. The boss alternates aimed volleys with ground strikes. Mortar locations lock before impact; move out, jump above the blast, or dash through it. Retrying the fortress restores the boss to full health.
- **Mission scenery:** swamp foliage, ruined outpost buildings, fortress masonry, and activated checkpoint radios distinguish the route. The HUD adds a route strip, dash recharge, chain timer and checkpoint alerts. Pepe's weapon now tilts with aim.
- **Victory rank:** S for at least four armor remaining, A for two or three, B for one. These are provisional tuning values, not a difficulty certification.

## Scope and boundaries

- Soldiers and turrets telegraph shots. Elevated platforms support alternate routes.
- S capsules grant permanent spread shot for the current run; H restores up to two armor.
- Five armor, three starting grenades, three compact stages, six checkpoints, three boss arenas, optional realm-clear upgrades, weapon switching, defeat/retry and campaign continuation.
- Only a best score persists under `kontra-kek-wars-best-v1`. Runs restart fresh. No shared currency, rewards, or saves.
- Mission definitions and layouts live in `missions.js`; kit/reward rules in `arsenal.js`; engine state/combat in `engine.js`; input/audio/HUD orchestration in `game.js`; shared art in `art.js`; realm art in `scenery.js`, `foundry-art.js` and `rift-art.js`; layout in `style.css`.
- Working title; original genre-inspired prototype, with no affiliation asserted. Publication and arcade catalog integration have not been performed.

## Verification

Run `node --test kontra-kek-wars/engine.test.cjs` from the arcade root. Thirty tests cover all three realm routes, enemy behaviors, boss phases, inventory and upgrade carry, reward farming guards, Pulse piercing, checkpoint restoration, aim locking, recovery cues, pause and movement. One isolated Iron Lily test grants invulnerability to check its reward path; all three full-route tests use normal health.

`node kontra-kek-wars/balance.cjs` records provisional Stormforge calibration in `balance-verification-v5.json`. The basic warning-response driver finished with three armor at 30/60/120 input updates per second, compared with two armor for simply advancing and firing. These are deterministic automated input strategies, not human playtesting or a claim of finished difficulty.

`node kontra-kek-wars/campaign-qa.cjs` checks the complete three-realm campaign using keyboard inputs without state injection, realm-clear reward choices, inventory switching, score carry, pause, final victory, best-score persistence and phone realm selection. Its receipt is `campaign-verification-v5.json`. The v4 receipts below are historical evidence for the earlier two-mission slice.

With the local server on port 4173, `node kontra-kek-wars/qa.cjs` exercises Edge keyboard movement, jump, grenade, pause/resume, restart, 390px layout, pointer movement/release, on-screen dash and a storage sentinel. `node kontra-kek-wars/mission-qa.cjs` now completes both missions through browser keyboard inputs: Iron Lily death/retry, transition with score carry and resupply, both Warden phases, campaign victory, persisted best, direct mission-two deployment/restart and phone mission selection. It reads diagnostics to choose inputs without modifying game state. The latest receipt is `campaign-verification-v4.json`: 13,500 after mission one, 25,600 after mission two, one armor remaining, no mission-two retry. This proves automated completion with normal health; human difficulty is still provisional. These browser scripts use this workstation's bundled Playwright path.

`node kontra-kek-wars/foundry-visual-qa.cjs` checks direct mission-two selection, foundry rendering, exact animation freeze on pause, phone deploy-button placement, touch dash and layout overflow. Its receipt is `foundry-visual-verification-v4.json`; v4 screenshots capture the new stage, Warden warnings and campaign victory.

`node kontra-kek-wars/feel-qa.cjs` verifies visible running/recoil/aim/jump/landing states, sound-toggle behavior, and exact canvas pixel equality during pause. `feel-verification-v3.json` and the v3 recoil/jump/combat screenshots record that run. The existing 16-game arcade smoke check also passed.

## Next quality gate

Play Jade Rift by hand to judge landing warnings, root-wave jump timing and the Bloom's recovery opening. Physical-device multitouch, audible sound quality, low-end-device performance and unassisted human clears remain manual checks. Discuss any further realm event before implementing it.
