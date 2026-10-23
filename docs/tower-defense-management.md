# Tower Defense: integrated commands and crosspaths

Updated 2026-10-23. The battlefield and command bay share a bounded game screen. Build / Tower / Enemies switch only the command bay, while numbered pads, campaign progress and wave start remain available. Only the selected command view scrolls. Selecting or building a defender opens its inspector without buying an upgrade. The phone layout keeps the battlefield above the command bay; it does not require page scrolling. Existing mastery and best-score keys remain in use; there is no saved in-progress defense.

## Three upgrade paths

Every tower has Firepower, a type-specific role path, and Long Watch. Each has five tiers. At most two paths may be purchased; only one can exceed tier two, giving a maximum 5/2/0 crosspath in any permutation. A 2/2 start may choose either path as the primary. The third path locks as soon as two have been started. Sell and rebuild to reset the choice. Tier costs, per path, are 75 / 120 / 175 / 230 / 285 defense shards. These are provisional balance settings.

Firepower increases damage and range. Role paths specialize in attack speed (Blaster / Archer), slowing (Shard), or splash (Relic / Mage). Long Watch extends range with smaller damage and speed bonuses. The inspector shows named next-tier upgrades, exact resulting stats, five tier markers per track, and explicit lock reasons. Stats rebuild from the base tower so equivalent crosspaths have identical effects regardless of purchase order. Tier-three combat abilities and tier-five evolution are retained. Attack cooldown carries fractional time forward rather than discarding it at each shot.

Moving is free between waves and preserves the tower object, cooldown, tiers and investment. Choose an empty battlefield pad or cancel. Selling immediately returns floor(0.70 * total build-and-upgrade investment), once, without increasing score or shared Arcade Shards. New defenses clear selection and relocation state.

## Expanded campaign

Twenty authored waves replace twelve. Raiders arrive from wave 3 and brutes from wave 7. Raiders are fast with lower health. Brutes resist 20% of direct and splash damage but remain susceptible to slows. Bosses arrive on 5, 10, 15 and 20; the final warboss resists 25% damage and breaches for five vault integrity. The brute and warboss share the generated armored goblin character; size, boss label and armor ring distinguish the warboss.

Health increases gradually and ramps more strongly after wave 12. Enemy speed growth caps at wave 15, and spawn intervals bottom out at 0.30 seconds. Wave previews disclose the authored roster, health multiplier and interval before launch. Every clear gives a build break. Campaign results/progress and the arcade front-page description now reflect twenty waves. Existing rank thresholds and shared reward caps remain unchanged.

## Verification and next gate

277 root tests passed, including a 92-test frame/game suite. Checks cover crosspath caps in every permutation, order-independent stats, affordability, preview immutability, real attacks and armor, moving/selling, pause/results/replay, twenty-wave transitions and earned-shard campaigns at 30/60 Hz plus a mixed-defense controller. These simulations establish viability, not human balance approval. A longer human playtest is the next balance gate.

Browser verification: normal 180-shard start and a native tier-one purchase; phone tower relocation; in-game enemy portraits; page remains one viewport at 390x844; full 5/2/0 upgrades, lock states and displayed refund verified through native controls in a clearly labeled seeded-funds QA fixture. Seeded fixtures and screenshots remain local under releases/ and are excluded from the web commit. Generated image prompts, originals and optimized runtime assets are documented in assets/pepe-tower-defense/GENERATED_ASSETS.md.
