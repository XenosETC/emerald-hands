# Pepe Wars finishing development — October 11, 2026

In progress. Existing unit prices/statistics, miners/deposits, income and victory bonus are preserved. The independent `pepe-wars-best-v1` record stays compatible.

- Speed-based Shard General/Relic Captain ranks now require a victory. A quick defeat uses score thresholds rather than receiving a fast-win rank. Existing saved records are not rewritten.
- Dead units cannot take another turn or remain a valid target. Fatal base combat stops the remaining actors, clamps base health at zero and records results once.
- Paused and post-result recruitment cannot spend shards or silently relaunch. Stance and keyboard controls reject paused/invalid actions; repeated keys and focused controls do not issue game commands.
- Invalid/unavailable best-score storage cannot block startup. Failed writes retain a session best and usable results. Results focus the replay button.

Verification: root smoke and 182 behavior tests pass in the workspace and clean staged copy. Three controller fixtures cover rank boundaries, dead/fatal combat and paused/post-result recruitment with blocked storage. An in-memory gateway exposes the private controller only in test copies; none is shipped. Native browser launch and Miner recruitment were checked on an isolated origin: after buying a miner, income brought the displayed balance to 74; paused recruitment left it exactly 74.

Next: miner economy, stance behavior, base victory/loss/replay and phone layout. Combat balance, physical touch comfort and hosted behavior remain open; this is not yet a finishing candidate.

## Recruitment and stance handoff

Recruit cards now disable before launch, after results, while paused and when unaffordable. Stance buttons expose pressed state and disable outside active play. Reset returns focus to the battlefield and paused reset is rejected. Training updates affordability immediately.

Hold and Defend now move advanced fighters back to the center (x650) or home defense line (x330), rather than leaving them beyond the commanded line. They prioritize falling back over attacking until they reach the line. Miners retain gathering behavior and deposits are unaffected. Forward movement clamps at the assigned line. This is an explicit stance-behavior change; unit stats and costs are unchanged. Controller fixtures verify both fallback positions and mining while defending. Native 390px checks selected Hold, trained a miner, and confirmed pause disabled recruitment; page width 375px showed no overflow. Sustained tactical balance and physical touch comfort remain open.

## Siege combat baseline and base feedback

Readable native progress bars now show both bases, with numeric 1000-point health labels. After battle, the HUD uses the same final score as the recorded result, including the existing victory and remaining-base bonuses; replay clears that final projection. Native launch verified both base labels start at 1000/1000.

Three controller runs use fixed random values 0.1/0.5/0.9 and a purchasing policy: attempt recruitment every three seconds, buy up to two early miners, then affordable archers/brawlers. Only normal starting funds, passive income, mined shards and combat rewards are used. No funds, kills or base damage are injected. All three win through actual combat after 65.5–67.2 simulated seconds with player base 1000 and enemy base zero. Each records once and replay resets the final score. The 0.5 run earns 13,500 combat/mining points and records 17,000 after existing bonuses.

These are synthetic input-policy controller runs, not native victories or human balance approval. The policy wins before the 95-second brute tier appears; late-game threats, difficulty and manual siege pacing remain open. Browser loss/victory/replay and physical-device testing remain release gates.

## Artwork coverage

Artwork audit confirms 13 runtime raster assets: four player units, three enemy types, three deposits, an arena and two newly generated citadels. Existing unit/deposit/arena artwork remains unchanged. The new emerald and corrupted base sprites match existing character style references and replace the procedural rectangles, retaining live labels/health bars and fallback rendering. Both new files are 1254 x 1254 RGBA with transparent pixels and render at 170 x 170. Exact built-in imagegen prompts are recorded in [ARTWORK.md](assets/pepe-wars/ARTWORK.md).

Native gameplay preview verified the bases at desktop dimensions, then phone width 390 (375px page, no horizontal overflow). [In-game proof](docs/pepe-wars-art-2026-10-11/citadels-desktop.png). Gameplay and save rules are unchanged; root smoke and 182 behavior tests pass.
