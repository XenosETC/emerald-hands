# Pepe Wars finishing development — October 11, 2026

In progress. Existing unit prices/statistics, miners/deposits, income and victory bonus are preserved. The independent `pepe-wars-best-v1` record stays compatible.

- Speed-based Shard General/Relic Captain ranks now require a victory. A quick defeat uses score thresholds rather than receiving a fast-win rank. Existing saved records are not rewritten.
- Dead units cannot take another turn or remain a valid target. Fatal base combat stops the remaining actors, clamps base health at zero and records results once.
- Paused and post-result recruitment cannot spend shards or silently relaunch. Stance and keyboard controls reject paused/invalid actions; repeated keys and focused controls do not issue game commands.
- Invalid/unavailable best-score storage cannot block startup. Failed writes retain a session best and usable results. Results focus the replay button.

Verification: root smoke and 179 behavior tests pass in the workspace and clean staged copy. Three controller fixtures cover rank boundaries, dead/fatal combat and paused/post-result recruitment with blocked storage. An in-memory gateway exposes the private controller only in test copies; none is shipped. Native browser launch and Miner recruitment were checked on an isolated origin: after buying a miner, income brought the displayed balance to 74; paused recruitment left it exactly 74.

Next: miner economy, stance behavior, base victory/loss/replay and phone layout. Combat balance, physical touch comfort and hosted behavior remain open; this is not yet a finishing candidate.

## Recruitment and stance handoff

Recruit cards now disable before launch, after results, while paused and when unaffordable. Stance buttons expose pressed state and disable outside active play. Reset returns focus to the battlefield and paused reset is rejected. Training updates affordability immediately.

Hold and Defend now move advanced fighters back to the center (x650) or home defense line (x330), rather than leaving them beyond the commanded line. They prioritize falling back over attacking until they reach the line. Miners retain gathering behavior and deposits are unaffected. Forward movement clamps at the assigned line. This is an explicit stance-behavior change; unit stats and costs are unchanged. Controller fixtures verify both fallback positions and mining while defending. Native 390px checks selected Hold, trained a miner, and confirmed pause disabled recruitment; page width 375px showed no overflow. Sustained tactical balance and physical touch comfort remain open.
