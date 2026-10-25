# Tower combat records - 2026-10-25

Goal: give players evidence for their next upgrade or placement without changing tower strength or campaign economy. Every active defender now shows damage and defeats beneath its name/form in the inspector.

## Attribution

Damage is actual enemy health removed after armor, including acid and Ballista piercing effects, capped at the enemy's health immediately before each hit. Overkill and hits on already-defeated foes add nothing. One lethal transition credits one defeat to its source; collecting that enemy still awards the existing run score and shards exactly once.

The source propagates through ordinary attacks, cannon/mage/Alchemist splash, Ballista line hits, Blaster chains, Mage volleys, Archer extra hits, each Sunwarden's laser/Nova and Thornkeeper's road patches. Patch damage belongs to the original planter. Acid and slowing effects do not manufacture damage/defeat credit; their direct damage still counts. The inspector explains that control and armor weakening help other towers and are not represented by these totals. These records are not a ranking of tower usefulness.

Records stay with a moved or upgraded defender. Selling removes that defender's record, and a newly recruited tower starts at zero. New defenses reset records. Build-phase checkpoints preserve the active towers' records; interrupted-wave records roll back together with health, currency and the rest of that build. Older checkpoints remain valid and start records at zero because historical damage was not stored. The validator permits only nonnegative finite damage and nonnegative integer defeats. No records alter Arcade Shards, mastery or rewards.

## Verification

Clean staged release passed 391 arcade tests plus 17 launch visual tests (408 total). Earned-fund campaigns retain the exact preceding-release outcomes: 89 relic HP for the mixed roster at 1× and 2×, 72 HP for the earlier-new-defender order, and all three majors defeated. A normal-funds Blaster browser run showed live totals rising with actual attacks. A separate explicitly seeded single-foe fixture verified Ballista records exactly 83 health removed and one defeat from a 95-damage hit, saves the cleared-wave record, and restores it after refresh. Inspector text fit 390x844 and 320x568 with no horizontal overflow; captured warning/error logs were empty. This fixture is persistence/UI evidence, not campaign balance proof. Focused tests cover armor/overkill, splash, dead/out-of-range foes, real multi-hit abilities, trap ownership, separate hero Novas, support attribution, checkpoint migration and rollback. The 1×/2× state equivalence check includes the new records. Full earned-fund campaigns and browser inspector checks remain the release gate.
