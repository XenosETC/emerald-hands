# Tower Defense management - 2026-10-17

Selecting a placed tower (canvas or numbered pad) opens its controls without spending defense shards. Occupied pads remain selectable at zero funds and at level five.

- Move: free to an empty pad between waves. Keeps the same tower object, level, path, investment and attack cooldown. Moving does not grant mastery. Cancel via the button or Escape; starting a wave cancels an unfinished move.
- Upgrade: choose Overcharged (+18% damage per upgrade) or a type-specific alternative: Rapid Emitters / Rapid Quiver (14% shorter interval), Deep Freeze (+6 slow percentage points and +10 range), Siege Radius (+14 splash and +8 range), Arcane Field (+10 splash and +10 range). Bonuses stack with existing level milestones. Slow caps at 82%. The first paid upgrade locks the path; sell and rebuild to change it. Both options preview next-level stats and exact costs.
- Sell: immediately refund floor(70% of original cost plus all paid upgrade costs), once. Available during waves; unavailable while moving. Score and shared Arcade Shards are not credited by selling.

These are provisional balance assumptions. The game still stores only best score and mastery, not an in-progress defense save. New defenses clear tower selection and relocation state. Existing storage keys and campaign completion rewards are unchanged.

Verification: root npm test (270 tests); frame-clock suite (85 tests) covers selection, both path guards, all five alternative paths hitting enemies, refunds, relocation identity/cooldown, pause/results/replay, and existing campaign checks. Three deterministic controllers complete all twelve waves using earned shards and explicit Overcharged upgrades; these are not human balance approval. Browser: normal 180-shard start, real build/move/sell controls; upgrade choices and path locking in a clearly labeled 1,000-shard QA fixture; 390px layout and upgrade input checked. Longer human playtesting remains the balance gate.
