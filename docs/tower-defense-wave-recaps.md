# Wave recaps - 2026-10-25

Assumption: build breaks should explain the previous wave without forcing a modal or altering combat. The Enemies panel now starts with a recap of the most recently completed or stopped wave: defeats, breaches by enemy type, and actual relic HP lost. A small unread dot and accessible description on Enemies draw attention to a new recap; opening the panel clears the indicator.

## Counting and guidance

Defeats are counted once when defeated enemies are removed. If a fatal breach ends simulation before a pending defeated enemy is collected, the recap includes that already-defeated enemy without awarding any extra currency. Breaches are counted once on path exit; health loss uses the actual clamped subtraction, so a ten-damage boss hitting a two-health relic reports two HP lost. A stopped wave is labeled separately from a cleared one and does not claim queued foes were fought.

Hints are simple, disclosed heuristics based on the foes that actually leaked: boss focus, specter resistance, armor counters, fast-foe control, or general path coverage. A clean defense suggests inspecting the next wave. These are planning prompts, not a guarantee of an optimal build or an automatic upgrade decision. There are no stat, reward, difficulty, formation, movement, targeting, or speed changes.

## Saves and mobile

The previous completed recap is saved with a build-phase checkpoint and restored on resume. Interrupted attempts do not replace that saved recap. Old checkpoints have no recap and remain valid. New runs reset it; defeat keeps the final attempt's recap visible in Enemies while removing the finished run's checkpoint. The optional recap schema validates wave/count/health bounds and known enemy types.

The recap is a scrollable command-bay card, using the existing jade/gold style. It adds no footer rows or popups, preserving space for tower controls and both hero abilities on phones.

## Verification

Clean staged release passed 395 arcade tests plus 17 launch visual tests (412 total). Full earned-fund campaign outcomes remain 89 relic HP at mixed 1×/2× and 72 HP for the earlier-new-defender order, with all major bosses defeated. A separate explicitly labeled single-breach browser fixture exercised the real exit/health/clear pipeline: one shieldbearer, zero defeats, one breach and three HP lost. The recap restored after refresh/resume, the unread description cleared when Enemies opened, and the card fit 390x844 and 320x568 without horizontal overflow. No warning/error browser logs were captured. This fixture is UI/persistence evidence rather than campaign balance proof. Focused tests cover counting, unchanged rewards, clamped fatal loss, pending kills, checkpoint resume/rollback, invalid report data and leak-specific hints. The 1×/2× equivalent-substep test now includes recap metrics.
