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
