# Wave spacing pass - 2026-10-24

Goal: make wave entrances easier to read without changing enemy stats, counts, roster order, rewards, collision or tower rules. The spacing budget is a provisional normal-difficulty choice.

Every wave now uses deterministic per-arrival gaps. Ordinary gaps keep the existing minimum interval, give a large slow predecessor extra clearance, and add a short break before every sixth arrival. Clearance uses the smaller of the two sprites at 40% of size, bounded to 22-38 world units, divided by the predecessor's actual starting speed. Raw clearance is capped at 0.8s; the group break is 0.12s.

A per-wave scale bounds added spawn-train time to 25% of the previous schedule. Across all fifty authored waves, mean train extension is 17.3%; opening wave extension is 1.5%. This is spawn-train length, not total combat duration. Boss entrance gaps (2s), guard spacing (1.1s), and the recovery after the last guard are unchanged. The preview explains variable arrival gaps instead of promising a single fixed interval.

Spawn timing carries a small fractional frame remainder so 30Hz and 60Hz schedules match closely. Only one enemy can spawn per update; debt is capped at 50ms so a stalled frame cannot dump a burst. Initial placement uses the same schedule as later arrivals.

Enemies still overtake and slows still cause natural bunching. That preserves splash, line penetration and road-trap interactions; there is no forced body collision, speed nerf or teleporting queue.

Idle sprite glow is reduced and health bars / status labels render without a blur, separating overlapping silhouettes. Ordinary sprite frames are capped at their hit diameter plus 22 world units (for example, brutes/shieldbearers draw at 68 rather than 94); bosses retain their large silhouettes. Collision radii and all combat calculations stay unchanged.

## Verification

Clean staged-copy release passed 378 arcade tests and 17 launch visual tests (395 total). Tests check all fifty wave budgets, exact boss/guard gaps, deterministic 30/60Hz spawn timestamps, capped frame debt, sprite sizing versus unchanged collision/armor, and full earned-fund campaigns. Mixed First and mixed Strong controllers finish with 89 relic HP and all major bosses killed; the earlier-new-defender build finishes with 72 HP and all three majors killed. Active duration rises about 57-62s versus the preceding release (roughly 3%). A no-Nova control also finishes with 89 HP, so spacing is somewhat more forgiving; no compensating enemy-health buff was added. A seeded-funds wave-28 browser check verified the preview, live arrivals, upgrades, and lower-glow rendering on desktop and a 390x844 viewport with no horizontal overflow or warning/error logs. Existing complete campaign controllers and new fifty-wave timing checks are the primary mechanical regression coverage; browser fixtures are visual checks, not physical-device performance or human balance approval.
