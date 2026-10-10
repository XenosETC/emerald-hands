# Emerald Hands finishing candidate — October 10, 2026

Emerald Hands is the oldest tracked arcade game and the first title in the [finishing queue](ARCADE_FINISHING.md). This pass completes its visible progression and save-management flow around the existing idle economy.

## Playable loop

Collect shards, buy tap power and passive production, reach Ancient OG at 400,000 earned shards in a cycle, then review and seal that cycle for OG points. The next-move panel guides the first upgrades and explains that spending does not reduce the earned-shard goal.

The shop supports one level, ten levels, or the maximum affordable quantity. Bulk purchases sum the original individual prices exactly. Decimal rates expose small boosts such as the first prestige's 1.12 shards per click. Costs, upgrade effects, rank thresholds, event rewards and prestige formulas are unchanged.

The existing highest prestige rank, **Emerald Sovereign at 60 OG**, is treated as the rank journey's completion target. Its result screen celebrates completion and offers endless play. This presentation assumption introduces no extra currency or reward. Existing saves above 60 OG are recognized immediately.

The latest ten sealed cycles record earned shards, empire value, OG reward and total OG. Older saves keep their OG points and lifetime count; past runs are not fabricated. “Restart cycle” discards only current shards, earned total and upgrades, keeping OG points, completed-cycle count and history. Prestige has a separate review showing what resets and what is retained.

## Saves and controls

- `emerald-hands-v1` accepts unversioned legacy saves. Balances and upgrade counts are validated before use.
- Unreadable or unsupported saves remain untouched: automatic writes pause and the original code is available in Save vault. Storage failures display an unsaved notice without breaking gameplay.
- Save vault provides a copyable code, validation and preview before restore, and previous-save recovery at `emerald-hands-v1-previous`. Failed storage writes leave the playable state intact. These actions do not replace other games' saves.
- Saves occur periodically and on page exit. Production/events freeze during game dialogs and shared pause. No offline income is introduced.
- Native dialogs provide focus wrapping and Escape dismissal, including after focus loss. Shared R/P shortcuts cannot reload or pause behind a game dialog.
- Unavailable audio cannot interrupt purchases or saves. Negative first-frame time deltas are clamped to zero. Expired event boosts clear their temporary message.

## Verification

`npm test` includes the sixteen-game smoke check and **94 behavior tests**, including 20 Emerald Hands tests and shared-runtime dialog/reset regressions. The Hands suite executes the actual controller and save module: fresh play/reload, legacy/corrupt saves, bulk pricing, blocked storage/audio, pause/dialog freezing, timing, restart preservation, prestige/history/completion, backup recovery, failed restore and single-use scroll rewards. Confirmed arcade-wide erase clears the Hands recovery copy and cannot be undone by its exit autosave. Smoke checks now verify cached script/style URLs too.

A deterministic policy reached first prestige at **1,040 simulated active seconds** and Sovereign at **10,029 seconds across 31 cycles**, using four taps per second, affordable production upgrades and existing rules. This is a reachability check, not human completion time or balance certification. Random event benefits are omitted from the policy.

Browser checks used normal controls on `hands-finish-20261010.localhost:4177`. Fresh play earned 15 shards and bought Sharper Hands. Verified invalid-code rejection, first prestige (+1 OG and +12%), reload, restart review, bulk max (82 shards bought three levels for 78), previous-save preview, focus wrapping, Escape and keyboard collection. Late-game test saves were restored through the visible Save vault to check first prestige and 59→60 OG completion; this browser check did not manually earn all 60 OG.

Desktop and 390 px layouts showed completion/recovery dialogs without horizontal overflow. The completion action was reachable on the phone viewport. Browser console checks returned no warnings or errors. Evidence: [desktop completion](docs/emerald-hands-finish-2026-10-10/completion-desktop.png), [phone completion](docs/emerald-hands-finish-2026-10-10/completion-phone.png), [endless journey](docs/emerald-hands-finish-2026-10-10/endless-phone.png).

## Temporary event artwork

The image above the rank meter switches to dedicated artwork for Rage (30 seconds), Corrupted Shards (30 seconds), and Emerald Flush (45 seconds). After a scroll choice, the Sage's scroll image stays in that slot for the chosen boost's existing duration (20, 30 or 40 seconds). Instant market signals briefly show an appropriate existing scene for six active seconds; that display interval does not extend their one-time rewards.

An event-name/countdown label and matching border identify the temporary scene. The timers use the same paused gameplay clock as their effects. Event visuals never replace `featuredUpgrade` in the save: buying another business during the event updates the scene that returns afterward. Cycle restart, restore and prestige clear transient artwork. Tests cover all these timing and restoration paths.

New art was made with the built-in image-generation tool; [saved assets and exact prompts](assets/emerald-hands-events/ARTWORK.md) are included. The scroll image and ordinary market-signal scenes reuse existing artwork. Browser verification used a separate, temporary fixture page with visible event buttons invoking the actual event functions; it was not a naturally rolled Rage event or a change to the user's run. [Rage in the game panel](docs/emerald-hands-finish-2026-10-10/rage-event-desktop.png) and [scroll effect on phone](docs/emerald-hands-finish-2026-10-10/scroll-event-phone.png) document the integration.

The live Rage fixture remained at 30 seconds while paused, then naturally expired after resuming and restored the normal infrastructure scene with its event label hidden. The clean staged release passed all 330 behavior tests across the arcade (94), Soul World (149), Feudalism (76) and Temple Run (11), plus the sixteen-game smoke check.

## Files and remaining gates

`app.js`: gameplay/UI. `emerald-hands-save.js`: validated saves and guidance. `emerald-hands.html`, `styles.css`: player interface. `arcade.js`: native-dialog keyboard ownership. `scripts/emerald-hands.test.cjs`, `scripts/arcade-runtime.test.cjs`: behavior coverage.

Before a full public-release claim: human pacing/clarity playtests, sustained physical-phone testing, hosted URL verification and the existing commercial asset-rights review. Saves are browser-local; use Save vault before changing browsers. Shared arcade reset remains a separate, explicitly destructive arcade-wide operation.
