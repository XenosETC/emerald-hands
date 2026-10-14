# Pepe Soul World finishing work — October 13, 2026

This pass builds on academy training, three seal realms, optional Temple, quests, equipment, skills and shrine retry, preserving guard ownership and independent saves.

Guardian guidance now distinguishes an uncollected seal, uncollected guardian gear, and both already recovered. Fixtures cover all twelve combinations across Frozen District, Crimson Marsh and Void Swamp and compare guidance to reconstructed drops. Temple behavior, combat, rewards and save schema are unchanged.

Remaining gates: natural oath progression, native desktop/phone review, save recovery and human combat pacing. This is not yet a local finishing candidate. Unrelated native projects, untracked art and tooling remain outside the browser release.


## Checkpoint storage boundary

The browser controller now uses a small checkpoint store with the existing core save validator. Unreadable saves are retained byte-for-byte; fallback play is temporary and cannot replace original data. Restoring valid data requires reload to clear the recovery latch. Write-only storage failures can recover on a later save, and page hide attempts a final checkpoint after earlier failures. A persistent gameplay warning explains unsaved progress. Fixtures cover damaged shapes, recovery, saved seal/loot preservation and practice-key isolation. The reward-preservation fixture is seeded, not an earned guardian playthrough. No schema, combat or reward rules change; backup reconstruction remains open.


## Recovery after guardian victory

An attuned run that dies after defeating its guardian now revives inside the cleared arena, keeping the victory and reconstructing only uncollected first rewards. The death control labels this destination accurately. Living-guardian death still retries from the approach; unattuned death still returns to Academy. Fixtures cover all four arenas, claimed/unclaimed rewards and snapshot reload. These are seeded checkpoint states, not new native guardian-clear evidence. Guard ownership, combat stats and reward amounts are unchanged.

A saved death after an attuned guardian victory also reloads at the cleared-arena recovery point, retaining the defeated guardian and pending drops. Other death-save destinations retain their existing Academy behavior. The same fixture covers death-before-retry reload and retry-after-death reload.


## Optional academy trails

The objective strip now offers walking to Goribbit, a safe side of the effigy or the veil gate during academy onboarding. It uses the existing walk-target/physics path, preserves held guard ownership and waits for manual movement to be released. Player movement or ground clicks retain control; talking, cuts and quest claims remain player actions. Ready rewards take priority, and trails never steer combat realms, dead players or completed oaths. An actual movement/action fixture accepts the oath, lands three timed cuts, claims the first reward and reaches Frozen District without assigned positions, XP or rewards. Separate coordinate fixtures check approach sides and disabled states.

2026-10-13 verification: 157 Soul World tests and 253 arcade tests passed. A fresh isolated practice browser run walked to Goribbit, accepted the oath, walked into effigy range, landed three player-issued cuts, claimed the first reward (level 2, 12 fragments), walked to the gate and entered Frozen District. No save/state injection was used. Full oath completion and physical-device combat remain open finishing gates.

Phone viewport review at 390px found no horizontal overflow and a 44px trail tap target; tapping it began normal walking. Proof: docs/soul-world-trails-2026-10-13/phone.png. This is browser responsive QA, not physical-device multitouch validation.

## Previous-checkpoint recovery — October 13, 2026

Changed checkpoints now keep the preceding readable snapshot under the same game's :backup key; identical writes leave that backup intact. An unreadable primary save offers a two-click recovery control in the visible warning panel. Recovery archives damaged bytes under :recovery-original before restoring the validated backup, then reloads. A readable current save, conflicting archive, unreadable backup or write failure cancels recovery safely. The existing session remains latched until reload. Practice backup and archive keys stay separate from normal campaign saves. Backup rotation can fail when storage is full; the current checkpoint stays untouched and the existing unsaved-progress warning appears. A backup becomes available after two distinct successful checkpoints; this does not add cloud or file-based backup.

Store fixtures cover changed/unchanged writes, damaged-byte preservation, restoration, write failure at both archive and primary steps, archive conflicts and practice isolation. Browser recovery review uses a deliberately seeded damaged practice save and valid level-2/training-3 backup on a unique localhost origin; it is recovery UI evidence, not earned campaign evidence. Full oath completion and physical-device combat remain open.

Browser verification restored the seeded level-2 checkpoint with training 3/3, 12 fragments and one skill point; no error logs were observed. At 390px the recovery confirmation has a 44px button and no horizontal overflow. Screenshots: docs/soul-world-recovery-2026-10-13/. Test fixture setup is excluded from the web release.

Clean staged release verification passed 253 arcade tests and 163 Soul World tests on October 13, 2026.

## Earned oath route and completion journal — October 13, 2026

A new fresh-state route test uses movement, timed attacks, healing items, earned quest claims/equipment/skills and checkpoint reconstruction to finish Frozen District, Crimson Marsh and Void Swamp. It grants no XP, positions, invulnerability, health or rewards. Result: 113 simulated seconds, 58 combat cuts, one healing flask, all three seals/guardian gear receipts, six quest claims, 981 XP and 312 fragments. Repeated mentor interaction/claims do not duplicate rewards. The strategy uses continuous attacks with exact simulation observations; it proves reachability, not human difficulty or native combat feel.

Map and Quests now show a guardian completion card derived from saved progress: Kek Domain controls, Emerald Temple access, claimed reward count and pending claims. The card links to the map or skill details. Completed quests no longer suggest an unfinished next oath when every reward is claimed. This adds no combat or reward rules. Native presentation review uses a seeded isolated practice save; it is separate from the earned simulation route. Full native campaign completion, human pacing and sustained physical-device combat remain open gates.

Completion-panel desktop review verified the reward count, Temple directions and links from Quests to Map to Kek Domain details with no error logs. Proofs are stored under docs/soul-world-oath-2026-10-13/. The seeded browser fixture is excluded from release contents.

390px responsive review confirmed no horizontal overflow, readable completion copy and a 44px navigation button. Physical-device testing remains outstanding.

Clean staged release checks passed 253 arcade tests and 166 Soul World tests on October 13, 2026.

## Patrol loot survives approach reloads — October 13, 2026

A ranged patrol defeat reproduced a loss: cleared enemies survived the checkpoint but their uncollected fragments/flask did not. Checkpoints now include pending ordinary drops with source enemy IDs and bounded positions. Loading accepts only unique IDs backed by cleared enemies in the current approach; fixed reward amounts/items are reconstructed from game rules, never imported from save fields. Collecting removes the pending record, preventing replay after another reload. Older saves without pending records add no retroactive loot. Realm/phase transitions retain their existing behavior; this fix covers reloads within a living approach and does not change death destinations, combat or reward values.

Fixtures cover a real ranged defeat from a seeded onboarding encounter, collection/reload, fixed flask rewards, wrong-phase/uncleared/duplicate/malformed records and old saves. The fresh oath route now reloads after every cleared combat phase before collecting pending drops: 111 simulated seconds, 58 cuts, one healing flask, 981 XP and 312 fragments. These are simulation receipts, not a native full campaign. Browser review uses an isolated practice encounter with seeded onboarding progress and normal live enemy health.

The first live browser encounter was knocked out while awaiting UI inspection; it is not a successful native ranged-clear receipt. The browser reload/collection fixture instead earns the first ranged defeat through the same normal simulation actions before loading that checkpoint into the isolated practice page.

Browser verification loaded the simulated earned pending drop, collected it using normal Warp movement, observed 5 fragments and 22 XP, then reloaded again. The reward remained 5 fragments, XP remained 22 and the patrol count remained 2/3; no error logs were observed. Proof: docs/soul-world-loot-2026-10-13/collected-after-reload.png. Test fixture setup is excluded from the release.

Clean staged release checks passed 253 arcade tests and 169 Soul World tests on October 13, 2026.

## Ground reward map — October 13, 2026

Map now lists current ground rewards nearest-first with pickup coordinates, fixed fragment/item labels, and a Return to collect button. Cleared approaches with pending loot remind players to collect it before crossing and point to the nearest drop. Active combat and guardian-return guidance retain priority. This is presentation only: walking into a drop remains the collection action, and travel stays available. It does not grant loot or introduce a departure lock.

Fixtures verify non-mutating reward summaries, reminder removal after collection, combat priority, and combined guardian seal/gear labels. Browser review uses a seeded cleared-approach practice fixture; it verifies map display and normal Warp pickup separately from the earned simulation campaign.

Native browser review showed both seeded drop locations, normal Warp pickup reducing the list to one, and the second pickup clearing the card/reminder. Totals were 10 fragments and three healing flasks. At 390px there was no horizontal overflow and the return button was 44px high; no error logs were observed. Desktop/phone proofs: docs/soul-world-reward-map-2026-10-13/. This is seeded presentation/pickup QA, not native campaign completion.

Clean staged release verification passed 253 arcade tests and 172 Soul World tests on October 13, 2026.

## Death reload follows shrine retry — October 13, 2026

A new regression reproduced that an unfinished attuned death offered a shrine retry in the live session but saved an Academy destination for reload. Death snapshots now use the existing retry destination: attuned approaches retain their realm, cleared patrols and pending drops at shrine position 1360; living guardian deaths fall back to Approach II (Temple uses its single approach); cleared guardian arenas stay cleared. HP/SP and saved technique cooldowns match normal retry. Unattuned deaths still return to Academy. Snapshot creation does not revive or mutate the current dead session. Combat, rewards and save version stay unchanged.

Fixtures compare reload and explicit retry across all four realms and unfinished phases, verify pending patrol loot and immutable dead state, and retain Academy fallback checks. Native browser review uses a seeded attuned one-HP practice encounter and an actual enemy knockout; it is not an earned shrine or full campaign receipt.

Browser verification observed the seeded one-HP encounter die to a normal enemy hit and show Return to the echo shrine. Reload before pressing retry restored Frozen District / Approach I at position 1360, HP/SP 100, 25 fragments, two living patrol enemies and the pending 5-fragment drop at 800. No error logs were observed. Proof: docs/soul-world-shrine-2026-10-13/death-reload.png. Fixture setup remains outside the release.

Clean staged release verification passed 253 arcade tests and 174 Soul World tests on October 13, 2026.

## Arcade hub completion handoff — October 13, 2026

The hub's existing read-only Soul World checkpoint projection now labels completed oaths, gives ready quest rewards priority in Academy, and points fully claimed runs to Emerald Temple or replay/build refinement after the Temple reward is recovered. Active realm combat still uses the game's current objective and Continue journey action. No save writes, shared currencies, rewards or practice-save reads are added. Existing incomplete, invalid and legacy-save behavior is preserved.

Root fixtures cover outstanding rewards, Temple unlock/recovery, active Temple combat and pending patrol pickup guidance. Browser presentation review uses a seeded completed checkpoint on a unique localhost origin; it verifies the hub card, not earned completion or a hosted deployment. Proofs: docs/soul-world-hub-2026-10-13/.

Browser review confirmed Oath fulfilled, level 7 / Academy / 3 seals, the Temple-unlock objective and Revisit journey link in Continue playing. The catalog card also showed the completed label. At 390px the card was readable without horizontal overflow; no error logs were observed. The seeded fixture and its navigation history are confined to the isolated QA origin.

Clean staged release verification passed 255 arcade tests and 174 Soul World tests on October 13, 2026.

## Playable when storage access is blocked — October 13, 2026

The browser controller now resolves localStorage only inside the guarded checkpoint layer. A blocked storage getter no longer aborts startup. Read-access failure shows Storage unavailable / temporary session rather than claiming the save is damaged; the intro also explains that progress only remains in this tab. Read-blocked sessions stay write-protected until reload, even if access returns, so temporary fallback progress cannot overwrite a previously unread checkpoint. Existing write-only retry and damaged-save recovery behavior remain intact.

Fixtures cover deferred access, blocked getters, status distinction, read-protection after access returns and fresh-store recovery. Browser review uses a temporary copy of the real game page with a throwing storage getter on a unique localhost origin; it is a fault-injection fixture and is excluded from release contents.

Actual browser onboarding under blocked storage accepted the oath, landed three player-issued cuts and claimed the first reward: level 2, 12 fragments and one skill point, with the temporary-session warning intact and no error logs. The warning's observed height now offsets the objective strip so its text/buttons remain readable instead of being covered.

390px browser review confirmed no horizontal overflow and an 8px gap between the warning and objective strip. Reload correctly reset the unsaved temporary run to level 1/training 0; this confirms the stated session-only limit. Final responsive proof: docs/soul-world-storage-2026-10-13/phone.png.

Clean staged release verification passed 255 arcade tests and 176 Soul World tests on October 13, 2026.

## Keyboard-safe journal navigation — October 13, 2026

Global Tab interception previously prevented keyboard traversal before the game began. Tab-to-Map now requires active play with focus on the canvas; Shift+Tab, startup, paused/dead play and already-open journal navigation retain normal traversal. Letter shortcuts remain available during active play. The journal now exposes modal dialog semantics, focuses its Close control when opened, wraps Tab/Shift+Tab at its visible enabled controls, and recovers focus after a reward/action re-renders content. Escape still closes it and restores canvas focus. No combat, economy or checkpoint rules change.

Shortcut fixtures cover startup, active canvas, reverse navigation, paused/dead state and letter shortcuts. Native browser checks use a fresh isolated practice origin with no seeded progression.

Desktop keyboard review confirmed startup Tab reaches Enter Kek Academy; Enter begins play; canvas Tab focuses Close in the modal journal; forward/reverse traversal wraps at visible controls; Escape restores canvas focus; Shift+Tab returns to Pause; and paused L did not spend Spirit. Tab reached the resume button and Enter resumed. No error logs were observed. Proofs: docs/soul-world-keyboard-2026-10-13/.

390px keyboard review wrapped Shift+Tab from Close to the last visible control. An earned native academy reward was activated with Enter; after the claim re-render, focus returned to Close instead of leaving the dialog. No horizontal overflow was observed. Background controls are inert while the journal is open and restored when it closes.

Final modal review confirmed the canvas and header become inert on open, lose inert on close, and focus returns to the game. Existing checkpoints remain isolated; no seeded campaign state was used for keyboard onboarding.

Clean staged release verification passed 255 arcade tests and 178 Soul World tests on October 13, 2026.

## Ability requirements and recovery cues — October 13, 2026

A small read-only status helper now explains the same combat gates used by the simulation. Touch ability hints and idle combat status identify Spirit cost, cooldown, guard release, hit recovery, current-technique recovery, unlock and grounded requirements. Airborne L reports Kek Rift's separate 40-SP cost and cooldown rather than the grounded Wave requirement. Upgraded Warp costs come from current stats. Domain uses its actual readiness and grounded rules. Existing guard, cut and Rift animation cues retain priority. No damage, costs, timing or unlock rules change.

Fixtures compare status readiness to combat readiness over multiple player states and verify that producing messages leaves the complete simulation state unchanged. Browser review uses a seeded unlocked 30-SP practice checkpoint on an isolated origin; it checks live Jump/Wave input feedback, not earned unlock or full campaign completion.

Native seeded-checkpoint review found grounded Wave ready at 30 SP, then Jump switched L to disabled Kek Rift with Need 40 SP. After normal Release and Wave casts, Warp was disabled with Need 20 SP while Wave showed its independent 1.2s cooldown. No error logs were observed. The phone screenshot records the controls layout; the short-lived low-Spirit status was verified through the live button state and combat-status text.

Clean staged release verification passed 255 arcade tests and 181 Soul World tests on October 13, 2026.

## Optional sound failures cannot stop play — October 13, 2026

Audio construction/resume and note playback are now contained inside the optional Sound layer. A failed start or playback disables sound, cleans up its own nodes/context where possible, and leaves the game running silently. The toggle waits for successful resume, reports Sound unavailable with retry guidance on failure, and cannot be switched back on by a late resume after an off request. The master connection is reused instead of reconnecting on each enable. Local synthesized waveforms, volume and timing remain unchanged; no network audio or automatic opt-in is added.

Fixtures cover opt-in, unknown events, constructor/resume/suspended-context failures, retry, playback exceptions and delayed-resume cancellation. Native browser fault review uses a temporary copy of the real page with a deliberately throwing AudioContext constructor on an isolated practice origin. That fixture is excluded from the release.

Browser fault verification showed Sound unavailable with aria-pressed false and retry guidance, then earned academy training and the first reward normally (level 2, 12 fragments, one skill point). At 390px there was no horizontal overflow. In a normal page, Sound on enabled successfully, a Jump event left it enabled, and Sound off muted it; no error logs were observed. This verifies control/runtime behavior, not human listening quality. Final proof: docs/soul-world-audio-2026-10-13/phone.png.

Clean staged release verification passed 255 arcade tests and 185 Soul World tests on October 13, 2026.

## Earned Emerald Temple route and accurate reward receipts — October 13, 2026

The fresh-state oath route now continues through the unlocked Temple approach, shrine attunement, Jade Abbot, reward pickup, checkpoint reload and return to Goribbit. It still uses normal movement/attacks, earned gear/skills and one healing flask; no positions, health, XP, invulnerability or rewards are assigned. Result: 135 simulated seconds, 64 combat cuts, 1117 XP, 357 fragments, all six quests and all four guardian reward receipts. Reload and repeat mentor interaction do not duplicate the final rewards. The controller has exact simulation observations and continuous attacks; this establishes reachability, not human combat pacing or native full-campaign completion.

Guardian first-clear reward definitions are now shared by combat drops, reload reconstruction and journal receipts. Values are unchanged: three realm blades and Temple's Healing Flask, each with 20 fragments. The journal lists exact reward types and describes these as receipt history, so a consumed flask is not presented as currently owned equipment. The prior generic blade wording incorrectly included Temple supplies. Definitions and non-mutating history have regression fixtures.

Browser review loads the actual checkpoint emitted by the simulation test on an isolated practice origin. It is an earned simulation checkpoint viewed natively, not a native-earned full campaign. Inspectable route/checkpoint receipt: docs/soul-world-temple-2026-10-13/earned-route.json.

Native checkpoint-display review confirmed Temple completed, six quest claims, level 8, 357 fragments and six healing flasks. The reward journal now names each blade and Temple's Healing Flask separately. Its receipt card uses the full journal width, with a responsive list; 390px review showed no horizontal overflow. These are native display checks of the simulation-earned checkpoint. Human feel, sustained physical-device play and a native-earned complete campaign remain open, so game 14 remains finishing in progress.

Clean staged release verification passed 255 arcade tests and 187 Soul World tests on October 13, 2026.

## Portable file checkpoints — October 13, 2026

The journal now has a Save tab. Download backup exports the current session, including pending loot and earned receipts, even when browser storage cannot save. A chosen Soul World file is validated and previewed with level, realm, seals and fragments; it does not write anything until Restore this backup and reload is pressed. Cancel discards the preview. Restore keeps the existing readable primary as the previous checkpoint, or archives damaged bytes before writing; conflicting damaged archives and failed writes leave the current session open. Practice operations use only practice keys. Backup files carry a Soul World format marker and a 250 KB limit, preventing accidental foreign-game imports. Existing restore normalization is reused; this is local portability, not cloud sync or tamper protection.

Fixtures cover file roundtrip, malformed/foreign/unsupported/oversized files, primary rollback, damaged archives, failed writes and practice isolation. Browser review imports the previous earned simulation checkpoint into an isolated practice origin, separately from native-earned campaign proof.

Browser download produced a valid format-1 Soul World file for the original level-1 session. Preview showed the selected earned level-8 checkpoint without changing the current run; Cancel retained level 1. The first native restore exposed a pagehide race that rewrote the pre-import session. Successful import now latches old-session writes until reload, with a regression for that exact sequence. Repeated native restore then loaded level 8, three seals and 357 fragments correctly. Previous-checkpoint rollback follows the normal rotating backup policy; the preview advises downloading first for a permanent copy.

Final 390px review showed no horizontal overflow, and Escape from the file control closed the journal and returned focus to the canvas. No browser error logs were observed. Proofs: docs/soul-world-files-2026-10-13/. Download/cancel/restore were tested on the isolated practice origin; the normal campaign was never imported or overwritten.

Clean staged release verification passed 255 arcade tests and 192 Soul World tests on October 13, 2026.

## Guard readiness and recovery feedback — October 13, 2026

Guard status now explains the existing raise gates: minimum Spirit, landing, hit/cut/Warp/technique recovery, wave release and break/rearm. Held inputs remain available to queue guard; presentation never disables them merely for temporary readiness. The combat strip describes queued guard when no cut/Rift/Domain cue has priority. Active guard now says frontal hits spend Spirit, with a low-Spirit release-to-recover message instead of an unconditional protection claim. Desktop and touch controls share the same explanation and retain rear-hit/ground-hazard guidance. Ownership, raise timing, costs, break rules and damage remain unchanged.

Fixtures check readiness agreement, complete state immutability, actual regeneration while held and release/rearm distinctions. Native review uses a seeded zero-Spirit practice checkpoint and ordinary control inputs on an isolated origin; it is not earned campaign evidence.

Native seeded-checkpoint review displayed GUARD QUEUED / Need 8 SP, then raised the latched guard through normal regeneration. The active cue described Spirit-funded frontal hits. Clicking release followed immediately by J produced an attack pose without a stuck guard; no error logs were observed. This verifies ordinary controller transitions, not enemy block success or physical-device multitouch. Proofs: docs/soul-world-guard-status-2026-10-13/.

Responsive active-guard review at 390px showed the full Spirit-funded cue and touch explanation without horizontal overflow. The active touch label is Guard on so it wraps cleanly within its narrow button. Physical-device sustained hold/multitouch remains a separate gate.

Clean staged release verification passed 255 arcade tests and 195 Soul World tests on October 13, 2026.

## Deliberate keyboard shortcuts — October 13, 2026

Keyboard dispatch now ignores Ctrl/Alt/Meta commands and composition input, so browser shortcuts do not also become combat or journal actions. Escape, journal keys and flask keys act only on the initial keydown. Previously repeated flask events could spend another Spirit Flask as regeneration created room, and held menu keys could repeatedly toggle their panel. Held movement/combat keys still prevent browser scrolling without retriggering an action; existing keyup and guard ownership remain unchanged. File input and native button activation keep their keyboard behavior. Flask amounts, costs, saves and combat balance are unchanged.

Four regression fixtures cover modified commands, repeated menu/flask keys, an actual regeneration-and-flask sequence, movement scrolling suppression, and startup/modal/button ownership. Browser review on a practice origin confirmed Ctrl+M leaves the journal closed, Q opens it, Escape returns canvas focus, Escape pauses, Enter on Resume resumes, and J produces an attack pose; no browser errors were observed. This is controller verification, not a native-earned campaign or physical-keyboard sustained-hold test. Proof: docs/soul-world-keyboard-safety-2026-10-13/paused.png.

Clean staged release verification passed 255 arcade tests and 199 Soul World tests on October 13, 2026.

## Checkpoint changes across tabs — October 13, 2026

Each checkpoint store now remembers its last observed primary bytes. Before saving, a different primary (including creation or deletion) stops that session's writes until reload. Storage notifications check immediately without changing the live run or writing anything. The warning directs players to Journal → Save to download their current session before reloading the saved checkpoint. Older sessions no longer rotate the newer backup or overwrite a detected external save. Practice keys remain separate. Explicit file restore remains a deliberate replacement action; successful file and previous-checkpoint restores both block old-session pagehide writes until reload.

Five fixtures cover competing stores, initially empty tabs, storage notifications/deletion, unchanged own writes, practice isolation, explicit import and recovery before load. This is change detection, not an atomic cross-process lock: a change between the final read and write remains a limitation of this localStorage boundary.

Two actual browser practice sessions shared an isolated origin. The second walked toward Goribbit and accepted the oath normally. The first retained its pre-oath run, displayed the external-change warning, kept Download backup enabled and refused a journal-triggered save. Reloading the first session then loaded the second's oath and position (467), with no browser errors. The desktop warning and objective had an 8px gap and no horizontal overflow. The attempted phone override remained at 1280px, so no phone-width claim is made for this warning. Proof: docs/soul-world-checkpoint-tabs-2026-10-13/conflict.png. This does not establish a full native-earned campaign.

Clean staged release verification passed 255 arcade tests and 204 Soul World tests on October 13, 2026.

## Journal section navigation — October 13, 2026

Letter shortcuts now open their requested journal section instead of closing a different section. M → I → Q switches Map → Inventory → Quests while gameplay remains suspended. Pressing the shortcut for the already selected section still closes the journal, as does Escape. The controller uses the journal's actual current section, including sections selected with the mouse, rather than a second copied selection state. Headings name the section and exactly one navigation button exposes aria-current. Normal Tab navigation, file input ownership, focus return and held-key suppression remain intact; combat, progression and checkpoint formats are unchanged.

A matrix fixture covers every current section (including Save) against every letter shortcut. Browser review verified M → I → Q, a second Q closing to canvas focus, and clicked Save → G opening Gear. The selected section matched the heading with exactly one aria-current marker; no browser errors were observed. Proof: docs/soul-world-journal-navigation-2026-10-13/gear.png. This verifies journal navigation, not campaign completion or combat feel.

Clean staged release verification passed 255 arcade tests and 205 Soul World tests on October 13, 2026.
