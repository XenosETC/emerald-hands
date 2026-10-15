# Pepe Temple Run finishing work — October 15, 2026

Status: finishing in progress, game 15 in the oldest-to-newest queue. The first fourteen games have local finishing candidates. This pass preserves the deterministic three-lane runner, original record key, run-only jade/shards, collision timing, corners and realm transition rules.

## Record protection

The original controller coerced saved values to numbers, silently fell back on parse errors and overwrote the record at every collision. A stale tab could lower a newer saved best. A small record adapter now validates nonnegative safe integer distances, preserves unreadable data without writing over it, merges the latest readable best before a completed-run write, and retains higher in-session records through storage failure. Valid existing `{best: number}` records remain compatible; unrelated keys and extra record fields remain untouched. Successful saves and unreadable/unavailable/write-failed storage have visible status text on start, pause and result overlays, including Focus view.

Best distance is still committed when a run ends, not during an unfinished run. Jade and shards remain run-only. This is a read/merge/write protection, not a transaction or cross-tab lock; exactly simultaneous writes remain a separate concurrency gate. No reset, overwrite-corrupt, export or restore action was added.

Six tests cover legacy data, stale-tab merging, malformed/unsafe values, byte-preserving failure, storage denial/write recovery, invalid candidate distances and actual game collision/result integration. The dedicated game run executes all 21 test files and reports 26 passing Node tests, including deterministic 10 km route replays, corners, input, renderer and character checks. Browser QA uses CUA native inputs; the historical qa.cjs browser driver was not executed in this pass.

## Native browser evidence

On isolated QA origin 4182, a default fresh run intentionally missed the first bridge. The 143 m result saved and survived reload. On retry, the actual Jump button cleared that bridge and Slide cleared the first gate, opening Corrupt Frog Temple. Pause retained the run at 243 m. Resuming without another dodge ended at 301 m in a stone-idol collision, with 9 jade and 1 shard; the new 301 m best survived reload. No distance, lane, action, inventory or score state was assigned. Receipts: docs/temple-run-records-2026-10-15/native-result.txt and native-realm-result.txt. phone-result.png shows the initial saved result.

A separate seeded unreadable-record fixture on origin 4183 verified its warning in the actual 390px phone Focus layout and at 1440px desktop width. phone-warning.png and desktop-warning.txt record that UI check; it is not earned gameplay evidence. No horizontal overflow or observed console errors appeared in those checks. Automated tests verify raw-byte preservation; browser review verified the visible warning.

## Remaining finishing gates

Native maximum-speed pacing, sustained physical swipes/multitouch, asset/performance review and hosted behavior remain open. This is not yet a local finishing candidate. Native projects and unrelated art/tooling remain outside this release.

Release-scope check: nine existing runner gameplay test files were not tracked in the initial index. They are included in this pass so the staged release reproduces the full 21-file, 26-test game check rather than the initially observed 17 tests.

Working-tree and exact staged-copy validation passed 255 arcade tests and 26 Temple Run tests on October 15, 2026.

## Native corners and keyboard ownership — October 15, 2026

The runner now yields Ctrl/Alt/Meta shortcuts and IME composition to the browser. Space/Enter on native buttons and links retain their default activation instead of becoming Jump or a global start action. Ordinary playfield Space and movement/pause keys retain their existing rules. The canvas has a visible keyboard-focus target; starting/resuming focuses it, and pause/results focus the primary overlay button. No lane, corner-window, speed, collision, RNG or save-format changes were made.

Native review exposed an early-return corner-result bug: the missed right bend reported 900 m in its result and saved best while the HUD stayed at 899 m and still displayed TURN RIGHT NOW. The result handler now synchronizes the final HUD distance and clears stale live instructions. Dead-state updates also suppress turn warnings and clear the toast. A new full-game regression follows real simulated inputs through a successful first corner and missed second corner, verifies matching 900 m HUD/result/record, hidden warning, cleared toast and restart preserving the record. The existing button-input fixture additionally covers browser modifiers, composition, native button/link activation and ordinary Space.

The native QA run on origin 4182 used the real right button to avoid the opening rows, entered the corrupted realm and paused at 333 m. At the first left corner, a wrong right input stayed unaccepted; the corrected left input locked the turn. The run passed 450 m, then continued through 500/750 m and collected a shield. Intentionally leaving the second right turn unaccepted ended at 900 m; the shield did not prevent the missed-corner loss. Reload retained the 900 m record. first-corner.txt records 464 m and CLEAN CORNER. native-900-before-fix.txt records the original mismatch and is not final UI proof.

After the repair, another native run activated the right button with Enter and intentionally missed the first left corner. The HUD/result both showed 450 m, the stale prompt was empty, and the saved best stayed 900 m. Native result receipt: docs/temple-run-corners-2026-10-15/native-result.txt; phone-result.png shows that corrected corner result. Space and Enter on Focus view were verified to toggle its pressed state correctly. Native Enter start/resume focused game, Space dispatched on the focusable canvas, and Escape paused with focus on start. A subsequent normal bridge loss confirmed results focus on start and retained the higher 900 m record; keyboard-focus.txt and phone-final-focus.png record the final focus behavior. No progress, positions, action state or scores were assigned in these browser runs.

Actual 390px phone and 1440px desktop layouts had no horizontal overflow or observed console errors. Inspection pauses were used. Successful native right turns and longer high-speed pacing, storage recovery UX, sustained physical-device feel and hosted verification remain open. Temple Run remains finishing in progress.

Working-tree and exact staged-copy validation passed 255 arcade tests and 27 Temple Run tests on October 15, 2026.

## Contextual turn controls and native 1 km review — October 15, 2026

Directional controls now describe the current corner action. Before the turn window they retain lane-movement labels and explain that turn inputs open in the final 28 m. In the window, the required button says Turn with the direction arrow, has a gold cue, and exposes Turn left/right now as its accessible name. Accepting the turn changes that button to a green Locked cue; descriptions explain when lane movement resumes. Jump and Slide keep their own hazard descriptions. Required/locked colors override the corrupted-realm theme. Text and accessible names carry the state as well as color.

All four action controls disable during loading/start, pause and defeat, and restore their existing behavior on start/resume/retry. Presentation updates only when the control phase changes; it does not alter lane position, timing, collision, RNG, rewards or turn acceptance. A real-simulation regression covers both directions, wrong-direction rejection, lock presentation, pause freeze/restoration, ordinary labels after crossing, defeat and restart. Existing deterministic replays and input checks remain intact.

The native earned-record QA run on origin 4182 cleared the first left bend and then successfully locked and cleared the second right bend, reaching 913 m. It continued through 1 km and paused at 1,130 m with a low-arch warning. The attempted later slide input did not execute before collision: the run ended at 1,136 m with 25 shards and no jade. This is not a successful higher-pace slide claim. The new best saved and survived reload; native-long-result.txt records the actual result. No progress, position, action state or score was assigned.

A fresh native review of the new controls recorded required and locked states in the actual corrupt-realm phone view. Gold required styling (background rgb(82,75,34), border rgb(245,215,93)) and green locked styling (background rgb(22,61,44), border rgb(156,222,192)) were verified after the theme correction. The locked turn survived pause/resume and crossed normally; normal lane labels returned afterward. All four controls disabled during pause. Actual 390px and 1440px layouts had no horizontal overflow or observed console errors. Proof: docs/temple-run-turn-controls-2026-10-15/phone-required.png, phone-locked.png and after-resume.txt. These browser runs used real controls, not a seeded late-game fixture.

Both native turn directions and the first kilometer are now reviewed with inspection pauses. The 1,136 m run reaches about 35.3 m/s under existing rules; maximum speed is 49 m/s and has not received sustained native/human review. Maximum-speed feel, storage recovery UX, physical-device swipes/multitouch, performance and hosted verification remain open. Temple Run stays finishing in progress.

Working-tree and exact staged-copy validation passed 255 arcade tests and 28 Temple Run tests on October 15, 2026.

## Protected record recovery and hub continuity — October 15, 2026

Unreadable originals now have a non-destructive way to resume saving. Use protected recovery creates a separate pepe-temple-run-v1:recovery record from the best completed run held in this session. It never replaces or deletes the unreadable primary value. Future completed runs use that protected record while the primary stays unreadable, and reload recognizes the protected best. Retry saving retries a transient storage failure without requiring another run. Recovery guidance and actions appear only with a save warning and disappear after success; focus returns to the primary play button.

The adapter validates both records with the same nonnegative safe-integer rule and 250,000-character size bound. If the primary becomes readable again, its saved best merges the protected best before later writes. An existing unreadable protected record is preserved rather than overwritten. If both records are unreadable, both remain available for review and no automatic reset is offered. This fallback cannot reconstruct an unknown old best from damaged bytes. Read/merge/write operations remain un-serialized across tabs as documented earlier; no import/export/reset or currency/progression system was added.

The arcade hub's read-only progress adapter also recognizes the protected record, displays Recovered distance record and retains the higher valid best. It reads only this additional Temple-specific key alongside its existing game saves, and performs no writes. New root coverage verifies primary/recovery combinations, read boundaries and unchanged storage. Three additional game tests cover actual collision-to-recovery interaction, byte-preserving failure, unreadable protected data, retry behavior, and merging a repaired primary without deleting the fallback.

Browser review used origin 4183, which already held an earlier seeded unreadable-record fixture. A new native run ended at 143 m; retry correctly kept the unreadable warning. Use protected recovery saved that completed session record, and reload showed 143 m with Protected recovery record active. A further native run avoided the opening rows, entered the corrupt realm and intentionally missed the first left corner at 450 m. Its result reported Recovery record saved, and reload retained 450 m. The hub then showed Recovered distance record · Best 450 m. No distance, lane, action or score state was assigned during these runs; only the older malformed original was fixture-seeded. The regular earned 1,136 m QA record on origin 4182 was not modified.

Evidence: docs/temple-run-recovery-2026-10-15/phone-before.png shows warning/actions with the earned 143 m session result; recovered.txt records its first successful reload; native-recovery-result.txt and phone-after.png show the subsequent saved 450 m run. hub-record.txt and phone-hub.png show the recovered hub card. Automated tests verify exact original-byte preservation; browser checks verify the native flow, reload, hidden actions after success, 390px phone layout and 1440px hub layout. No horizontal overflow or observed console errors appeared.

Protected recovery closes the basic unreadable-record and transient-retry UX gap. Maximum-speed human feel, sustained physical-device swipes/multitouch, performance and hosted verification remain open. Temple Run stays finishing in progress.

Working-tree and exact staged-copy validation passed 256 arcade tests and 31 Temple Run tests on October 15, 2026.
