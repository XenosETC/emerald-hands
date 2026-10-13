# Pepe Soul World finishing work — October 13, 2026

This pass builds on academy training, three seal realms, optional Temple, quests, equipment, skills and shrine retry, preserving guard ownership and independent saves.

Guardian guidance now distinguishes an uncollected seal, uncollected guardian gear, and both already recovered. Fixtures cover all twelve combinations across Frozen District, Crimson Marsh and Void Swamp and compare guidance to reconstructed drops. Temple behavior, combat, rewards and save schema are unchanged.

Remaining gates: natural oath progression, native desktop/phone review, save recovery and human combat pacing. This is not yet a local finishing candidate. Unrelated native projects, untracked art and tooling remain outside the browser release.


## Checkpoint storage boundary

The browser controller now uses a small checkpoint store with the existing core save validator. Unreadable saves are retained byte-for-byte; fallback play is temporary and cannot replace original data. Restoring valid data requires reload to clear the recovery latch. Write-only storage failures can recover on a later save, and page hide attempts a final checkpoint after earlier failures. A persistent gameplay warning explains unsaved progress. Fixtures cover damaged shapes, recovery, saved seal/loot preservation and practice-key isolation. The reward-preservation fixture is seeded, not an earned guardian playthrough. No schema, combat or reward rules change; backup reconstruction remains open.


## Recovery after guardian victory

An attuned run that dies after defeating its guardian now revives inside the cleared arena, keeping the victory and reconstructing only uncollected first rewards. The death control labels this destination accurately. Living-guardian death still retries from the approach; unattuned death still returns to Academy. Fixtures cover all four arenas, claimed/unclaimed rewards and snapshot reload. These are seeded checkpoint states, not new native guardian-clear evidence. Guard ownership, combat stats and reward amounts are unchanged.

A saved death after an attuned guardian victory also reloads at the cleared-arena recovery point, retaining the defeated guardian and pending drops. Other death-save destinations retain their existing Academy behavior. The same fixture covers death-before-retry reload and retry-after-death reload.
