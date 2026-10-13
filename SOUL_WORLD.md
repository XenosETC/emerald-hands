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
