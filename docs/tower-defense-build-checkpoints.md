# Tower Defense build-phase checkpoints - 2026-10-25

Assumption: a 35-minute local campaign should survive a refresh without requiring mid-combat serialization. This release keeps one build-phase checkpoint for Tower Defense per browser origin. It is a local convenience save, not a cloud sync or anti-cheat boundary.

## Player behavior

The opening screen offers Resume wave N when a valid checkpoint exists, alongside the clearly labeled Start New Defense action that replaces it. Builds, upgrades, completed moves, sales and targeting changes save during build phases. Each wave clear saves the next build phase, and sending a wave commits its exact starting build. Leaving the page during a build break also updates the save. A refresh during combat returns to that wave's saved starting build; earnings, spending and damage from the interrupted attempt are rolled back together.

Wave, score, run shards, relic health, pad assignments, tier paths, targeting, aim, attack cooldowns and both slot-specific Nova cooldowns restore. Combat enemies, traps, projectiles and effects are transient. Restore creates one animation chain, recomputes tower stats and sell investment from current specifications, and does not replay mastery actions or award run rewards. A completed or lost run removes its checkpoint. Best score, mastery, other games and shared Arcade Shards retain their own storage.

## Implementation and limits

pepe-tower-checkpoint.js contains the pure version-one validator. It rejects malformed/oversized input, unknown tower types, duplicate pads or hero slots, invalid 5/2/0 tiers, invalid health/currency, and impossible cooldown values. Only whitelisted fields survive decoding. The game owns persistence and restoration; live combat state is never serialized. Storage failures leave the current run playable and show a keep-this-tab-open message.

Checkpoints are event-driven, not written every animation frame. Clearing browser storage removes them; one tab's latest build save can replace another Tower Defense tab's checkpoint on the same origin. Localhost and the published site have separate browser storage. Mid-wave progress and transient thorn patches are intentionally not resumed.

## Verification

Clean staged release passed 382 arcade tests plus 17 launch visual tests (399 total), including the complete earned-fund campaign regressions. Normal-fund desktop and 390x844 browser checks built, upgraded, retargeted and moved a Blaster, refreshed, and resumed it with the correct 30 shards and 1/0/0 tiers. A mid-wave sale followed by refresh restored the pre-wave tower and currency together, rather than keeping the sale proceeds. A separate, explicitly seeded wave-35 fixture restored both heroes and Ballista; it is UI coverage rather than earned-campaign evidence. The phone Resume / Start New Defense prompt remained readable, and no warning/error browser messages were captured. Tests cover full-roster restores, both hero slots, refunds, mastery/reward isolation, combat rollback, malformed saves and unavailable storage. Browser refresh/resume checks will distinguish normal starting funds from any seeded visual fixture.
