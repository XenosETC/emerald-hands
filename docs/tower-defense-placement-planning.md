# Placement planning and road coverage - 2026-10-26

Build now offers an optional Plan placement toggle, off by default. With it on, tapping an empty pad previews the selected defender as a translucent base-form silhouette with its actual base range circle. No tower, mastery placement, currency charge or checkpoint write is created by the preview action. Build here confirms through the existing purchase function; Cancel preview discards the pad while leaving planning mode on. Quick building remains unchanged with the toggle off.

The preview footer displays the pad/name, price and road coverage. Players may switch defender cards while keeping the preview pad, including looking at unaffordable towers for free. Confirmation is disabled for insufficient funds, pause, moving or the two-Sunwarden limit; the underlying purchase guards also remain in force. Selecting an occupied pad opens management instead. Moving a real tower bypasses the hypothetical placement path and keeps its normal free build-break relocation rules.

Planning does not pause combat. The hint says so during an active wave. Starting a wave clears an unconfirmed pad, as do map selection/new-run transitions; previews are not restored from saves. Escape on the battlefield or Cancel preview dismisses the current preview. While confirming a preview, the redundant mode toggle and Start Wave button are temporarily hidden to leave room for defender cards on phones; canceling or buying restores normal controls. The existing wave hotkey still clears an unconfirmed preview before launch.

## Geometry and interpretation

The shared map module clips each straight road-centerline segment against the tower's circular range analytically, sums covered length and divides by that route's total length. Degenerate segments and tangencies contribute no length. Each Grove route is measured independently, including its own common entry/exit portions; percentages must not be added as if they were a single road.

Coverage is rounded for display, with a less-than-one-percent indication for positive slivers. It is a geometric reach measure, not damage, target priority, time in range, boss-kill probability or splash/chain reach. Thornkeeper explicitly calls it planting reach and notes that traps go to the nearest road. Owned defenders display the same measure using their actual upgraded range, so range upgrades and moves update the readout.

No enemy, tower, cost, reward, formation, save schema or map balance changes are introduced. The planning flag/pad are transient UI state; existing pagehide/Maps build-break saving can still save the selected defender preference and real towers, never the hypothetical preview.

## Validation

Focused tests cover exact line/circle clipping, full/outside/tangent/degenerate cases, monotonic range growth, and unmodified catalog data. Every production map exercises preview without spending/writing a checkpoint, a single confirmed purchase, duplicate confirmation protection and unchanged quick-build. Further checks cover affordability, hero caps, pause, cancellation, movement, wave/map transitions, switching defenders, upgraded owned coverage and the range renderer.

The browser check uses a fresh local QA origin and real 180-shard start. On Grove, Archer at pad 1 previews 29% upper/30% lower coverage at no cost, then confirms for 105 shards. A 75-shard Long Watch upgrade raises the displayed coverage to 33%/34%; the real tower and upgrade survive refresh/resume while preview mode resets. Phone layout keeps confirmation accessible and defender cards scrollable. Browser evidence is distinct from physical-device performance and human balance feedback.

Final clean staged validation: 424 arcade tests plus 17 launch tests passed (441 total), with the 18-game smoke check. Six-map controller outcomes remain Classic 89, Delta 53, Quarry 100, Grove 67, Harbor 38 and Hall 71 relic HP. Browser checks covered 390x844, 320x568 and 844x390: preview confirmation controls were 44px high, unaffordable confirmation stayed disabled, no horizontal overflow was observed and warning/error logs were empty. The selected screenshot is releases/tower-placement-20261026/planning-phone.png, showing a free Archer preview with the original 180 shards.
