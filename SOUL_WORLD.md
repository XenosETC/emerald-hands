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

## Optional Temple handoff — October 13, 2026

After the three-seal oath and all quest claims, academy guidance now identifies Emerald Temple as the optional next challenge. The existing walking aid remains available for its academy gate until the Temple reward is recovered. Claimable rewards retain priority, dead players receive no trail, and an incomplete or invalid oath does not gain access. Walking uses the existing movement controller; realm entry rules, rewards, saves and combat are unchanged. After the Temple receipt, ordinary replay guidance resumes and the optional trail disappears.

The fresh-state simulation route now checks this handoff immediately after its earned oath and again after its earned Temple return. Separate fixtures check state immutability and quest-reward priority. Its inspectable pre-Temple checkpoint is docs/soul-world-temple-trail-2026-10-13/earned-oath.json. Browser review loaded that simulation-earned checkpoint into an isolated practice origin, clicked the walking aid, arrived at 2244, opened Map and crossed normally to Emerald Temple at 260. No browser errors were observed. This verifies navigation from simulation-earned progress, not a native-earned complete campaign.

At an actual 390px viewport, the new walking button was 44px tall, its objective was readable and the page had no horizontal overflow. Proof: docs/soul-world-temple-trail-2026-10-13/phone.png. Physical-device comfort and combat feel remain separate checks.

Clean staged release verification passed 255 arcade tests and 207 Soul World tests on October 13, 2026.

## Accurate Soul Release guidance — October 13, 2026

Release balance now has a shared immutable definition used by combat, awakening upgrades and ability guidance: 55 Spirit, 16-second cooldown, eight base seconds and 12 additional cut damage, plus two seconds and six damage per awakening rank (two ranks maximum). Values are unchanged. The blade description follows the actual rank instead of promising eight seconds for every build. The HUD names the remaining awakened seconds, and Skills now explains Release alongside Wave, Rift and Domain. Active guidance reads the existing timer; opening the journal still suspends gameplay.

Fixtures compare every supported rank's explanation against an actual cast and actual additional melee damage, and check locked/non-mutating presentation. Browser review reused the isolated practice run from the simulation-earned oath checkpoint, spent its earned skill points through normal Learn Soul Release buttons, and verified rank two describes 12 seconds and +24 cut damage. A normal R cast followed by opening Skills showed the same active timer in the card, HUD and blade description, with no browser errors. This is upgraded-ability controller verification from simulation-earned progress, not a native-earned campaign. Proof: docs/soul-world-release-info-2026-10-13/phone.png.

The Skills card fit at an actual 390px viewport without horizontal overflow. Clean staged release verification passed 255 arcade tests and 210 Soul World tests on October 13, 2026.

## Flask recovery previews — October 13, 2026

Inventory now puts supplies before equipment and previews each owned flask's current resource, maximum and capped recovery. Full-resource flasks have a disabled Already full button and an explanation. Touch-control titles use the same preview; a keyboard attempt at full health/Spirit or with no supply explains the refusal. Preview and use share the existing recovery calculation, keeping the original 45 HP / 50 Spirit limits, one-flask consumption and save events. Fractional Spirit is formatted to one decimal for readability (amounts below 0.1 are identified); combat still uses the full numeric recovery value.

Fixtures compare preview against actual flask use for both resources and multiple deficits, and verify full/empty/dead refusals leave state unchanged. Native review on the isolated simulation-earned practice run restored exactly 20 missing HP with one Healing Flask (four → three). A subsequent keyboard Heal at full health reported no flask used and retained three. After reload, both supplies appeared first in Inventory, with no browser errors. This is recovery/controller verification, not a native-earned full campaign. Proof: docs/soul-world-flasks-2026-10-13/phone.png.

Inventory fit at an actual 390px viewport without horizontal overflow. Clean staged release verification passed 255 arcade tests and 212 Soul World tests on October 13, 2026.

## Native activation for phone action controls — October 13, 2026

Phone action buttons now handle native zero-detail keyboard/assistive clicks as well as pointerdown. Jump, Slash, Warp, Wave, Talk, Release and Domain use the existing action dispatcher without holding a key. Guard uses the existing latch as a keyboard/assistive toggle, keeps button focus and reports queued/active status. Pointer clicks remain owned by pointerdown and are ignored by the new activation listener, preventing duplicate dispatch. Pointer hold/release/cancel behavior and keyboard movement remain unchanged; the movement buttons still require a pointer hold or the existing A/D and arrow keys. Guard's title explains the activation options. Combat, costs and saves are unchanged.

Fixtures exercise a real jump and guard → release → cut transition, and verify pointer click counts do not dispatch an extra action. At an actual 390px viewport, native Space on Jump reached the jump pose; Space on Slash reached attack. Enter on guard raised it, a second Enter released it, and Slash then attacked without a stuck guard. Guard focus remained on the control and aria-pressed matched its active state. No browser errors or horizontal overflow were observed. These checks establish native keyboard activation, not screen-reader hardware certification or sustained physical-device multitouch. Proof: docs/soul-world-accessible-controls-2026-10-13/phone.png.

Clean staged release verification passed 255 arcade tests and 214 Soul World tests on October 13, 2026.

## Pause focus and reliable entry — October 13, 2026

Pausing now focuses Return to your journey, with a named Game paused dialog. Tab and Shift+Tab stay on Resume during an ordinary pause; modified browser shortcuts retain ownership. If previous-checkpoint recovery is armed, Tab cycles between Resume and the existing confirmation button so recovery remains reachable. Resume or Escape returns focus to the canvas. Pause requests during startup, death or an already paused journal do not open a second overlay, but still release held inputs. Background pointer controls retain their existing behavior; this is focus containment, not a new full modal layer.

Native review verified Escape → Resume focus, Tab/Shift+Tab containment and Enter → canvas focus. On the isolated practice origin, a temporary damaged primary and readable previous checkpoint exercised the recovery exception: Tab reached Confirm recovery and reload, Enter restored the level-7 checkpoint, and the warning cleared. The normal C → Escape journal path left neither panel open and returned canvas focus. No browser errors were observed. Background-loss while a journal is open is guarded in code; an actual OS focus-loss check remains separate.

Recovery review also exposed a startup race: the HTML Enter button was initially enabled before the module installed its handler. It is now disabled with Painting your world in the initial document, and the existing ready handler enables it after art loads. Reload and immediate locator activation then entered normally. Proof: docs/soul-world-pause-focus-2026-10-13/phone.png. These checks do not establish native-earned campaign completion or physical-device comfort.

The focused pause view fit at an actual 390px viewport without horizontal overflow. Clean staged release verification passed 255 arcade tests and 214 Soul World tests on October 13, 2026.

## Defeat guidance and keyboard retry — October 13, 2026

The defeat dialog now describes the existing recovery destination, patrol/guardian reset behavior and retained progress. Its copy distinguishes an unattuned return to Academy, an attuned shrine, a reset guardian attempt and a cleared arena with uncollected rewards. The retry button receives focus on knockout, Tab/Shift+Tab remain on it and native Enter revives through the original controller. The dialog is named and describes itself through the recovery text. No death penalty, recovery rule, reward or checkpoint format changed.

Fixtures compare descriptions against actual recovery across all destinations, including Temple's single approach, and verify non-mutating guidance and retained patrol loot. At an actual 390px viewport, a seeded one-health Frozen District practice fixture suffered a real enemy knockout. Retry received focus; Tab/Shift+Tab stayed there; Enter returned to the shrine at 1360 with 130 HP and 100 Spirit. Map still showed two enemies remaining, 25 fragments and the uncollected five-fragment drop at 800. No browser errors or horizontal overflow were observed. This is seeded defeat/retry verification, not earned campaign progression or physical-device comfort. Proof: docs/soul-world-revive-guidance-2026-10-13/phone.png.

Clean staged release verification passed 255 arcade tests and 216 Soul World tests on October 13, 2026.

## Complete ability timer checkpoints — October 13, 2026

Warp, Wave and Release cooldowns now survive normal checkpoint and portable-file reloads alongside the existing Rift/Domain cooldowns. Release's remaining active duration survives too, preserving its paid bonus instead of dropping the effect while resetting its cooldown. Optional version-2 fields are bounded by the existing ability/upgrade values; old version-1/version-2 saves default to zero, and locked saves cannot restore an awakened effect. Timers resume with simulation rather than subtracting offline time, matching Rift/Domain. Cast costs, durations, damage and live cooldown rates are unchanged.

Death checkpoints still clear timers. Direct academy revival previously retained cooldowns while a death-checkpoint reload cleared them; direct revival now clears all cooldowns consistently with shrine revival and death reload. Normal realm travel retains its existing behavior.

Fixtures exercise actual casts, checkpoint/file roundtrips, normal timer expiry, malformed/legacy/locked inputs and both academy/shrine revival. Browser review loaded the simulation-earned oath checkpoint on the isolated practice origin, cast R, opened Skills and reloaded. Release resumed at about 7.8 active seconds with a 15.7-second cooldown, without browser errors. This verifies persistence from simulation-earned progress, not a native-earned campaign. Proof: docs/soul-world-checkpoint-timers-2026-10-13/phone.png.

The restored ability card fit at an actual 390px viewport without horizontal overflow. Clean staged release verification passed 255 arcade tests and 220 Soul World tests on October 13, 2026.

## Cleared battlefield walking aid — October 13, 2026

The existing academy walking aid now also serves cleared approaches and guardian arenas. It offers the nearest uncollected ground reward first, then the next passage, guardian passage or return portal. It never grants loot, attacks or crosses automatically: normal movement collects drops, and E or Map still performs travel. Living enemies, hit recovery, hostile projectiles and an uncleared guardian arena suppress the aid. Manual controls, guard ownership and cancellation retain their existing behavior. The old control ID/class remain stable for existing integrations.

Fixtures walk a cleared approach through three real pickup checks, verify the flask and fragment totals, then cross only through explicit enterArena; they also check live combat/hazard suppression, academy onboarding and Temple's direct guardian passage. Native review used a seeded cleared Frozen approach with three pending drops. Three walking requests collected them normally (25 → 40 fragments, two → three Healing Flasks), and the ground-reward list became empty. The aid then reached 2242 without changing phases. Explicit E entered Approach II; reload confirmed the new phase at 260 with its live patrol and no walking aid. No browser errors were observed. This is seeded traversal/pickup verification, not earned combat completion.

At an actual 390px viewport, the passage button was 44px tall with no horizontal overflow. Proof: docs/soul-world-journey-trail-2026-10-13/phone.png. Physical-device comfort and full campaign feel remain open.

Clean staged release verification passed 255 arcade tests and 223 Soul World tests on October 13, 2026.

## Forge and supply availability — October 14, 2026

Goribbit's shop now shows owned flask counts, the existing 99-item pack limit and precise fragment shortfalls. Full stacks disable Buy instead of offering a silent no-op. The forge shows the equipped blade's temper rank, current/next sword bonus and actual next cost. Shared non-mutating previews drive both availability and the existing purchase/upgrade actions, keeping prices, caps, rank limits and damage unchanged. The forge spans the journal width; supply offers form a responsive pair on wider screens and stack on phones.

Fixtures compare previews against real purchases/tempering across location, affordability, pack count and rank, including dead-player refusal without spending. Native review used an isolated seeded Academy practice checkpoint: Healing Flasks at 99 disabled Buy; purchasing one Spirit Flask increased two → three and spent eight fragments; tempering spent the remaining 20 and increased the blade to +1 with four additional sword damage. At zero fragments, offers correctly reported eight for a flask and 40 for the next temper. No claim of earned progression is made for this seeded shop check. Proof: docs/soul-world-shop-2026-10-14/phone.png.

Desktop review confirmed the forge spans the content width. At an actual 390px viewport, supply offers stacked without horizontal overflow; no browser errors were observed. Clean staged release verification passed 255 arcade tests and 226 Soul World tests on October 14, 2026.

## Discoverable separate practice campaign — October 14, 2026

The intro and journal Save panel now link between normal and practice campaigns. Practice resumes its existing separate journey if present; this is not a reset or copy operation. A persistent practice banner, return link, browser title and save hint identify the active mode. The journal also makes the new banner inert while open. Existing normal/practice storage keys, checkpoint behavior, costs and progression stay separate and unchanged.

Browser review on an isolated seeded origin switched from the normal intro into practice, then returned through Save. Practice displayed seven fragments; normal retained 42 and hid the practice banner. Reopening practice through the normal Save panel retained seven fragments. The banner became inert while the journal was open. Existing automated storage/import/recovery isolation tests continue to cover the underlying boundary. This verifies navigation and save selection using seeded journeys, not earned progression. Proof: docs/soul-world-practice-navigation-2026-10-14/phone.png.

At an actual 390px viewport, the return link was 44px tall, all touch controls stayed within the viewport and no horizontal overflow occurred. The browser title identified Practice, with no browser errors. Clean staged release verification passed 255 arcade tests and 226 Soul World tests on October 14, 2026.

## Fresh practice restart — October 14, 2026

Practice's Save panel now offers Preview fresh practice, followed by an explicit Start fresh practice and reload or Cancel. It uses the game's normal default initializer rather than a second set of starting rewards. Preview/cancel do not replace the checkpoint. Confirmation uses the existing protected import path: the readable previous practice checkpoint becomes the rotating backup, and old-session pagehide writes remain blocked until reload. The preview advises downloading first for a permanent copy. Normal mode has no fresh-practice control. The shared restore confirmation now disables itself and clears its pending action after success to avoid duplicate activation rotating the backup twice.

A regression fixture verifies a fresh default checkpoint, retained previous practice data, normal-save byte isolation and pagehide protection. Browser review on the isolated seeded practice journey verified preview/cancel retained seven fragments and confirmation received focus. This is restart/navigation verification, not earned campaign progression. Proof: docs/soul-world-fresh-practice-2026-10-14/phone.png.

Native confirmation then reloaded a level-one practice run with zero fragments. Returning to normal retained 42 fragments, and normal Save exposed no restart control. At an actual 390px viewport, confirmation fit without horizontal overflow; no browser errors were observed.

Clean staged release verification passed 255 arcade tests and 227 Soul World tests on October 14, 2026.

## Projectile lifetime boundary — October 14, 2026

Friendly waves and hostile shots now move only for their remaining lifetime on the final simulation frame. Already expired shots cannot move or damage anyone; a collision reached within the final active fraction still resolves before removal. Previously the full frame could extend a shot beyond its intended range. Damage, speed, lifetime and hit radii are unchanged. Regression tests cover both factions, expired shots, range overshoot and valid final-fraction hits without repeat damage. This is deterministic combat verification; full native campaign feel remains an open finishing gate.

Working-tree and clean staged-copy validation passed 255 arcade tests and 230 Soul World tests. An isolated practice browser startup check completed without console errors. No visual layout changed in this slice.

## Academy sword lesson — October 14, 2026

The mentor and quest tracker ask for three connected sword cuts. Training credit now requires those cuts instead of counting every damage source, so waves remain usable against the practice effigy without bypassing the blade lesson. Existing partial and completed training saves retain their progress. Regression coverage checks actual wave contact, pre-oath hits, missed cuts, checkpoint continuation, the 30 XP cap and realm access. This implements the existing lesson text rather than changing its rewards or target count.

Native browser input on the isolated practice origin accepted the oath, followed the effigy trail, fired a wave with training still at zero, then landed three J cuts to reach Training 3/3 and 30 XP. No console errors were observed. Proof: docs/soul-world-academy-cuts-2026-10-14/desktop.png. Working-tree and clean staged-copy checks passed 255 arcade tests and 233 Soul World tests. Full native campaign and physical phone combat feel remain open; no layout changed in this slice.

## Post-combat shrine trail — October 14, 2026

After approach combat and ground loot are finished, the walking trail now offers an unattuned echo shrine before the next passage. Beside the shrine, walking guidance waits for an explicit E attunement and the tracker explains the existing 15 XP, 10 fragments and recovery benefit. Attunement resumes passage guidance and persists across reload. It is optional: direct travel and gate controls still allow skipping it. Combat, active hostile projectiles and guardian arenas keep their existing trail restrictions. No rewards or recovery rules changed.

Regression simulation covers all four realms, actual walking, explicit attunement, duplicate reward prevention, reload, shrine revival, loot priority, hazards and skipping. Browser verification used a seeded cleared Frozen District practice checkpoint on an isolated origin: walking arrived at 1368, E granted 15 XP and 10 fragments, and reload retained the attuned shrine and next-passage trail. This is route verification, not a native-earned patrol clear. At 390px the new prompt and 44px walking button fit without horizontal overflow. Proof: docs/soul-world-shrine-trail-2026-10-14/phone.png. Full native campaign and physical phone feel remain open finishing gates.

Working-tree and clean staged-copy validation passed 255 arcade tests and 235 Soul World tests. Browser review reported no console errors.

## Technique refusal feedback — October 14, 2026

Keyboard and phone action attempts now explain blocked techniques through the existing status message: cooldown, insufficient Spirit, guard, hit recovery or technique recovery. Existing unlock messages are preserved once. Successful casts use the same simulation actions and costs; queued sword cuts are not mistaken for failures. During active play, unavailable phone techniques retain a muted dashed appearance but accept a tap to explain their current blocker, with the same reason exposed as an accessible description. Pause, journal, startup and defeat still disable these technique buttons. The desktop Domain button retains its existing disabled behavior.

Regression tests check rejected actions do not spend resources or change checkpoints, real successful casts, duplicate unlock message prevention and queued cut continuation. On the isolated practice origin, keyboard L, phone tap and Enter activation all reported “Kek Wave · Release sword guard” while Spirit stayed at 100. Pause disabled the phone technique button. At 390px there was no horizontal overflow and no console error. Proof: docs/soul-world-action-feedback-2026-10-14/phone.png. Physical phone feel and full native campaign remain open finishing gates.

Clean staged-copy validation passed 255 arcade tests and 238 Soul World tests on October 14, 2026.

## Confirm leaving uncollected rewards — October 14, 2026

E exits, journal realm returns, journal approach passages and sidebar travel now share an in-game confirmation when ground rewards would be left behind. It names each reward and its location, including seals, guardian gear and flasks. Keep exploring or Escape preserves the area; Leave rewards behind explicitly performs the original travel action. Clean exits do not prompt. The modal pauses simulation, clears held movement/guard input, defaults focus to Keep exploring and restores focus to the canvas or journal on dismissal. Technique recovery, shrine interaction and locked gates do not trigger an E travel warning. Reward amounts, pickup rules and core travel eligibility are unchanged.

Regression fixtures cover byte-equivalent checkpoint preservation on cancellation, patrol flask names, missing guardian seals/gear, explicit departure, clean exits and E eligibility. Browser review used a seeded cleared Frozen District practice checkpoint on an isolated origin: cancelling E kept its pending 5 fragments and Healing Flask, Escape from a Map return restored journal focus, and confirming the Map passage entered Approach II. This is transition verification, not a native-earned patrol clear. The HTML dialog fits at 390px without horizontal overflow, with two visible 44px controls. No console errors were observed. Proof: docs/soul-world-travel-confirmation-2026-10-14/phone.png. Full native campaign and physical phone feel remain open finishing gates.

Clean staged-copy validation passed 255 arcade tests and 241 Soul World tests on October 14, 2026.

## Shrine and seal quest checklists — October 14, 2026

Quests now lists the shrine status of all four eligible realms and separates the three recovered seals from the final return to Goribbit. Completed rows use text and color; incomplete rows explain the relevant E interaction or guardian pickup. The shrine description now accurately says three realm shrines, including optional Emerald Temple after the oath. The underlying any-three condition, rewards and existing claimed saves are unchanged. An unattuned fourth shrine is labelled Not attuned, rather than a required remaining objective.

Regression coverage checks all four three-shrine combinations, unchanged state during presentation, normal claims, reload deduplication and partially recovered seals versus mentor completion. Native browser review used a seeded practice checkpoint with Frozen, Crimson and Temple shrines: Quests showed 3/3, Void remained Not attuned, and claiming granted the existing 60 XP, 25 fragments and Echo Talisman. Reload retained Reward received and Completed. This is presentation/claim verification, not native-earned progression. The 390px checklist wraps without horizontal overflow; no browser errors were observed. Proof: docs/soul-world-quest-checklist-2026-10-14/phone.png. Full native campaign and physical phone feel remain open finishing gates.

Clean staged-copy validation passed 255 arcade tests and 243 Soul World tests on October 14, 2026.

## Combat and loot area boundaries — October 14, 2026

Enemies already pursue players outside the old inner 530–2400 range, but hit knockback and elite lunges still clamped there. A left-facing cut on an enemy at 300 could snap it rightward to 530 instead of moving it left by 32. Hit movement and elite lunges now use the same 100–2500 playable bounds as Crown Pepe and Temple pursuit. Pending patrol loot uses those bounds too, so drops near either edge retain their actual position across reload. Ordinary/guardian knockback distances, damage, lunge distances and reward amounts remain unchanged. Previously valid saved positions remain valid; this does not reconstruct positions already lost by an older save.

Three new regression cases failed before the fix and passed afterward. Coverage includes cuts from both directions, edge defeats, one-time collection after reload, normal unmodified patrol pursuit followed by a wave hit, the guardian’s smaller knockback and elite lunges at both edges. The full simulation-earned oath and Temple route continues to pass; native full-campaign feel remains an open finishing gate.

Browser verification on an isolated seeded practice checkpoint showed a pending reward at position 100 before and after reload. Following the normal walking trail collected 5 fragments; a second reload retained exactly 5 fragments and no pending ground reward. This is boundary/collection verification, not a native-earned defeat. At 390px the Map fit without horizontal overflow and no console errors were observed. Proof: docs/soul-world-combat-bounds-2026-10-14/phone.png.

Working-tree and clean staged-copy validation passed 255 arcade tests and 248 Soul World tests on October 14, 2026.

## Accessible walking and native-earned onboarding — October 14, 2026

The phone movement buttons previously supported pointer holds but ignored native Enter/Space activation. They now toggle explicit left/right walking on accessible activation, show Stop and a pressed state while active, and expose an instruction description. Opposite activation switches direction. Physical movement takes over; a ground click cancels the toggle. Existing input clearing on pause, journal, travel confirmation, death and world changes also clears automatic walking. Normal pointer holds remain independent, and a pointer click does not duplicate its pointerdown action. Attacks keep their existing committed stop, then movement resumes as it does with a held key. There is no automatic combat, interaction or saved walking state.

Three regression fixtures cover actual simulated traversal, switching/stopping, pointer-click deduplication, keyboard/pointer ownership, attack commitment and reset. Browser review verified Enter to start, Space to stop, opposite-direction activation and pause/resume clearing. At actual 390px width there was no horizontal overflow or console error. Proof: docs/soul-world-native-onboarding-2026-10-14/phone.png.

This turn also completed a native browser stage from a default fresh practice initializer on an isolated QA origin. No XP, HP, inventory, enemy clears, positions or rewards were assigned after initialization. Native controls accepted the oath, landed three training cuts, claimed The first cut, learned Soul Edge and crossed the academy gate into Frozen District. Wave and sword attacks defeated all three first-patrol enemies. Normal walking collected every patrol drop and E attuned the Frozen shrine. The frostbound watch was claimed and Frostweave Cloak equipped. Reload retained level 3, 52 fragments, one unspent skill point, the attuned shrine, the equipped cloak and no ground rewards. Three Healing Flasks remained; none was used. Earned Map DOM receipt: docs/soul-world-native-onboarding-2026-10-14/earned-map.txt.

Frequent pauses supported inspection. This verifies native onboarding, first patrol combat and earned save continuity; it does not close the uninterrupted human-feel, native elite/guardian/Temple campaign, physical multitouch or hosted-release gates. The finishing queue remains on Soul World.

Working-tree and clean staged-copy validation passed 255 arcade tests and 251 Soul World tests on October 14, 2026.

## Realm enemy timing meters and native elite clear — October 14, 2026

Ordinary realm enemies, elites and guardians now show their actual windup, released attack and counterattack window in the existing combat readout. The simulation and meter share the previous phase durations; no attack speed, damage or movement tuning changed. Stagger shows its remaining lock time rather than a frozen windup timer. Temple retains its specific attack names and tells. On phone, the readout was raised to clear the Domain button; a 390px browser check measured 15px between them, with no horizontal overflow or console errors. Final layout proof: docs/soul-world-native-elites-2026-10-14/phone.png (seeded visual fixture on a separate origin).

Three regression tests compare live simulation transitions for patrol, melee elite, caster and guardian in Frozen, Crimson and Void; cover stagger timing/presentation purity; and preserve Temple telegraph parity. Existing simulation-earned full oath and Temple tests still pass.

The native campaign continued the previous turn’s earned practice save without progress grants. Its earned skill point upgraded Soul Edge, and Wave casts cleared Frozen Approach II. One Healing Flask was used during the elite fight. Normal walking collected all three drops, bringing fragments from 52 to 67. Reload retained level 3, the cleared elite approach, the shrine and 67 fragments. Earned DOM receipt: docs/soul-world-native-elites-2026-10-14/earned-map.txt.

The same run then used its two remaining earned Healing Flasks and entered the Rime Warden arena. Manual movement, Warp and Wave attacks reduced the guardian from 210 to 30 HP. Later recovery-blocked inputs and damage ended the attempt in defeat; this was not a guardian victory. The new live windup meter appeared during that attempt (docs/soul-world-native-elites-2026-10-14/native-attempt.png, before the phone spacing adjustment). Native shrine revival and reload returned to cleared Approach II at 1360 with full 150 HP, level 3 and 67 fragments; the guardian attempt reset and no seal/reward was granted. Recovery receipt: docs/soul-world-native-elites-2026-10-14/recovery-map.txt.

Frequent inspection pauses mean this remains a native progression/recovery check, not uninterrupted human combat-feel approval. Native guardian victory, remaining realms/Temple, physical-device comfort and hosted behavior remain open finishing gates.

Working-tree and clean staged-copy validation passed 255 arcade tests and 254 Soul World tests on October 14, 2026.

## First-seal technique explanation and native Frozen completion — October 14, 2026

When a live session first earns the existing level-and-seal technique unlock, the status message now explains R for Soul Release, Jump + L for Kek Rift, and that grounded L remains Kek Wave. Skills retains costs and timing details. Nearby loot messages keep that explanation for its 6.5-second window instead of immediately replacing it. The notice does not pause play, add save fields, grant abilities or replay on loading an already-unlocked save. Tests cover actual seal pickup, a later level-three unlock from a quest claim, unchanged state and message expiry/loot handling.

The native campaign resumed the prior earned shrine recovery. Manual walking, two entry Warps, four Waves, a retreating Warp, a turn back and a final Wave defeated the Rime Warden on the retry. No progress values or encounter state were assigned. The run collected its Frost seal and Rime Fang, returned through the real portal, equipped Rime Fang and reloaded at the academy. Reload retained level 4, 87 fragments, one unspent skill point, the attuned Frozen shrine, recovered guardian reward, equipped Rime Fang and Frostweave Cloak. The Map receipt is docs/soul-world-native-frozen-2026-10-14/earned-map.txt; native screenshot: docs/soul-world-native-frozen-2026-10-14/native-earned.png.

This closes the native fresh-start-through-Frozen-realm stage, including the previous failed attempt and shrine recovery. Inspection pauses were used. Crimson, Void, the completed oath, Temple and sustained physical-device/human-feel review remain open; the finishing queue stays on Soul World.

First-seal notice QA used a separate seeded fixture so the earned campaign stayed intact. At 390px the explanation remained after both seal/weapon pickups, had no horizontal overflow, and did not replay after reload. No console errors were observed. Notice screenshot (seeded UI check): docs/soul-world-native-frozen-2026-10-14/phone.png.

Working-tree and clean staged-copy validation passed 255 arcade tests and 257 Soul World tests on October 14, 2026.

## Consistent session controls and native Crimson patrols — October 14, 2026

Jump, Slash and Talk previously stayed visually enabled during pause, journal and defeat while their handlers rejected input. All ten touch action/movement buttons now share one session lock covering loading, intro, pause, journal, pending travel confirmation and defeat. Healing/Spirit items and desktop guard/Domain controls use the same lock plus their existing readiness rules. Initial HUD/control state is applied before artwork loads. During active play unavailable techniques remain tappable to explain their requirements; costs, unlocks, combat timing and save format are unchanged.

Browser checks verified intro, journal and pause locking, re-enabled movement/Jump/Slash/Talk after resume, and disabled consumables at full health/Spirit. Desktop 1440px and phone 390px had no horizontal overflow or observed console errors. A separate seeded one-HP encounter on QA origin 4183 reached defeat through the actual simulation and verified all twelve phone controls disabled; it was a control-presentation check, not earned campaign evidence. Proof: docs/soul-world-native-crimson-2026-10-14/seeded-defeat.png and seeded-defeat.txt. The earned run stayed isolated on origin 4182.

The native campaign continued from the earned Frozen completion. At the academy it spent its earned point on Soul Edge rank 3, tempered Rime Fang once for 20 fragments and bought three Healing Flasks for 24. In Crimson Marsh, Jump + L successfully executed the earned airborne Rift; grounded Waves cleared the remaining outer patrol without damage. Walking collected its drops and E attuned the shrine. Claiming Ashes of the oath earned level 5 and Ashkeeper Robe; the robe was equipped and the new point learned Kek Wave rank 1. Four grounded Waves cleared the elite approach without damage. All three elite drops were collected and one Healing Flask restored 165/190 HP to full health.

The subsequent Ember Keeper approach ended in defeat after an input-observation wait expired with movement still active; the planned Release/sword combo was not executed or validated. Native shrine revival and reload retained the cleared Crimson elite approach at 1360, full 190 HP/100 Spirit, level 5 (69/180 XP), 101 fragments, no unspent points, three Healing Flasks, one Spirit Flask, the Frost seal and both equipped upgrades. No progression, encounter state or position was assigned during the earned run. Earned Map receipt: docs/soul-world-native-crimson-2026-10-14/earned-map.txt; paused phone proof: phone.png.

This advances native review through both Crimson patrols and its recovery path. Ember Keeper victory, remaining Void/oath/Temple review, uninterrupted combat feel, physical multitouch and hosted behavior remain open. The finishing queue stays on Soul World.

Working-tree and clean staged-copy validation passed 255 arcade tests and 257 Soul World tests on October 14, 2026.

## Hit recovery countdown and native Crimson completion — October 14, 2026

The combat cue now shows HIT RECOVERY, the remaining simulation lock rounded up to a tenth of a second, and Retry after recovery. It takes priority over ordinary attack/ability cues while the living player is hurt, then returns to the existing cue when the lock clears. This explains the same gate that rejects actions after a hit; it does not shorten recovery, buffer inputs, change combat rules or add saved state. Defeat retains revival guidance. The entry module and combat-cue import have refreshed cache versions.

Two regression tests cover an actual enemy hit, the decreasing countdown, unchanged state during presentation, rejected Release without Spirit cost or delayed casting, a successful retried Release after recovery, tiny positive timers and death guidance. A separate seeded encounter on origin 4183 verified the live phone countdown at 390px, the restored ready cue and a native R cast after recovery (45 Spirit, awakened blade). Phone proof: docs/soul-world-native-ember-2026-10-14/phone-recovery.png; post-recovery DOM: seeded-after-recovery.txt. Desktop 1440px and phone 390px had no horizontal overflow or observed console errors. This presentation fixture is separate from the earned campaign.

On origin 4182, the native campaign resumed the prior earned Crimson shrine checkpoint and crossed the cleared passage into the Ember Keeper arena. Native walking and Warp reached combat range. A sword hit dealt 64 damage, but the follow-up Release was rejected during hit recovery; the planned awakened combo was not completed. Three subsequent grounded Waves defeated the guardian. The victory ended at 127/190 HP without using another flask. Normal walking recovered the Ember seal, Ember Fang and 20 fragments, and the actual return portal restored health and Spirit at the academy. No progress, HP, enemy state, position or rewards were assigned in this run.

Ember Fang was equipped and tempered once for 20 earned fragments. Reload retained level 5 (124/180 XP), 101 fragments, no unspent points, three Healing Flasks, one Spirit Flask, Ember Fang +1, Ashkeeper Robe, two recovered seals, and both Frozen/Crimson shrine and guardian-reward receipts. Evidence: docs/soul-world-native-ember-2026-10-14/earned-map.txt, earned-gear.txt and native-earned.png.

The native fresh-through-Crimson stage is now verified with inspection pauses. Void, the completed oath and Temple remain the next campaign gates. Uninterrupted combat feel, physical-device multitouch and hosted behavior remain separate review work; the finishing queue stays on Soul World.

Working-tree and clean staged-copy validation passed 255 arcade tests and 259 Soul World tests on October 14, 2026.
