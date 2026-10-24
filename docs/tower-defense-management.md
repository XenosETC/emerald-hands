# Tower Defense: integrated commands and crosspaths

Updated 2026-10-23. The battlefield and command bay share a bounded game screen. Build / Tower / Enemies switch only the command bay, while numbered pads, campaign progress and wave start remain available. Only the selected command view scrolls. Selecting or building a defender opens its inspector without buying an upgrade. The phone layout keeps the battlefield above the command bay; it does not require page scrolling. Existing mastery and best-score keys remain in use; there is no saved in-progress defense.

## Three upgrade paths

Every tower has Firepower, a type-specific role path, and Long Watch. Each has five tiers. At most two paths may be purchased; only one can exceed tier two, giving a maximum 5/2/0 crosspath in any permutation. A 2/2 start may choose either path as the primary. The third path locks as soon as two have been started. Sell and rebuild to reset the choice. Tier costs, per path, are 75 / 120 / 175 / 230 / 285 defense shards. These are provisional balance settings.

Firepower increases damage and range. Role paths specialize in attack speed (Blaster / Archer), slowing (Shard), or splash (Relic / Mage). Long Watch extends range with smaller damage and speed bonuses. The inspector shows named next-tier upgrades, exact resulting stats, five tier markers per track, and explicit lock reasons. Stats rebuild from the base tower so equivalent crosspaths have identical effects regardless of purchase order. Tier-three combat abilities and tier-five evolution are retained. Attack cooldown carries fractional time forward rather than discarding it at each shot.

Moving is free between waves and preserves the tower object, cooldown, tiers and investment. Choose an empty battlefield pad or cancel. Selling immediately returns floor(0.70 * total build-and-upgrade investment), once, without increasing score or shared Arcade Shards. New defenses clear selection and relocation state.

## Expanded campaign

Twenty authored waves replace twelve. Raiders arrive from wave 3 and brutes from wave 7. Raiders are fast with lower health. Brutes resist 20% of direct and splash damage but remain susceptible to slows. Bosses arrive on 5, 10, 15 and 20; the final warboss resists 25% damage and breaches for five vault integrity. The brute and warboss share the generated armored goblin character; size and the boss label distinguish the warboss.

Health increases gradually and ramps more strongly after wave 12. Enemy speed growth caps at wave 15, and spawn intervals bottom out at 0.30 seconds. Wave previews disclose the authored roster, health multiplier and interval before launch. Every clear gives a build break. Campaign results/progress and the arcade front-page description now reflect twenty waves. Existing rank thresholds and shared reward caps remain unchanged.

## Verification and next gate

277 root tests passed, including a 92-test frame/game suite. Checks cover crosspath caps in every permutation, order-independent stats, affordability, preview immutability, real attacks and armor, moving/selling, pause/results/replay, twenty-wave transitions and earned-shard campaigns at 30/60 Hz plus a mixed-defense controller. These simulations establish viability, not human balance approval. A longer human playtest is the next balance gate.

Browser verification: normal 180-shard start and a native tier-one purchase; phone tower relocation; in-game enemy portraits; page remains one viewport at 390x844; full 5/2/0 upgrades, lock states and displayed refund verified through native controls in a clearly labeled seeded-funds QA fixture. Seeded fixtures and screenshots remain local under releases/ and are excluded from the web commit. Generated image prompts, originals and optimized runtime assets are documented in assets/pepe-tower-defense/GENERATED_ASSETS.md.

## Visual upgrades - October 23, 2026

Five generated tier-3 forms and five Long Watch forms now appear in the battlefield and selected-tower portrait. Primary tiers 0-2 retain base art; Firepower/role tiers 3-4 use reinforced art and tier 5 retains the original evolution; Long Watch primary tiers 3-5 use its range-specialist art. Secondary tiers never change the primary form. No combat stats or purchases changed. Runtime WebP sprites share a 512px frame and bottom anchor; original PNGs and prompts are retained.

The visual review at docs/tower-defense-visual-review.html compares all forms and presents the proposed Pepe Alchemist. The Alchemist is a design/concept only, not recruitable. Browser checks loaded all 21 review images, verified both five-tower forms in a labeled seeded fixture, matched the selected Archer portrait through native pad selection, and found no horizontal overflow at 390x844. These checks establish visual integration, not human campaign balance.

Clean staged release validation: 279 root tests passed, including two dedicated visual-selection and rendering checks. Unrelated Soul World and Paradox working changes were excluded.

## Relic base health - October 23, 2026

The visible relic base is now the final path waypoint (1185, 404), replacing the offscreen exit. Each run starts with 100 HP. Crossing enemies are removed once and subtract their existing breach damage: crawler/runner/raider 1, elite/brute 2, boss 4, warboss 5. Health clamps at zero and destruction ends the defense once. Replay restores 100 HP. The jade-and-gold base has an attached numeric health bar, hit flash, low-health color and a cracked crystal below half health; HUD and results use relic health. More starting health makes the campaign more forgiving; no enemy or reward values were changed.

Validation: 281 tests passed in a clean staged copy. A live, unseeded browser wave with no towers let all 12 first-wave enemies reach the relic; health fell from 100 to 88. Screenshot: releases/relic-base-88hp-20261023.png (local QA only).

## Generated relic and playable Alchemist - October 23, 2026

The generated emerald shrine now replaces the procedural relic when its transparent sprite loads; the existing drawing remains an offline fallback. The 100-HP objective, health bar, hit flash, low-health cracks and zero-health destruction remain functional. The Alchemist is now the sixth recruitable defender with all three five-tier paths, 5/2/0 restrictions, shared move/sell/mastery/pause/replay behavior, acid projectile visuals and enemy debuff labels. See pepe-alchemist-design.md for explicit provisional balance rules. The front-page card and visual gallery reflect the playable roster.

Release verification: 288 root tests passed in a clean staged copy, including all six visual form transitions, acid direct/splash/chain damage, expiry, pause-adjusted timing, every Alchemist 5/2/0 purchase order, caps, relocation/refund and relic rendering. Native browser flow bought the Alchemist with 180 starting shards, played wave 1, purchased Catalyst tier 1 using earned funds, moved it with the upgrade intact, then sold for 147 (70% of 210). No browser errors were logged. All 26 gallery images loaded. Seeded art fixtures separately verified upgraded roster visuals and tier-five Surveyor purchases; these are not earned campaign proof. Mobile viewport override did not apply reliably in this browser session, so no new phone verification is claimed. A human full-campaign balance pass remains open.

## Sunwarden hero - October 24, 2026

The seventh shop defender is a single-active hero with an emerald cape and rapid green lasers. Three named five-tier paths, 5/2/0 restrictions, generated upgrade art, mastery, move/sell, green laser rendering and a command-bay Emerald Nova button are integrated. Keyboard 7 selects him; H casts. See pepe-sunwarden.md for provisional stats, cooldown rules and verification limits. Nova kills reuse the existing reward collector immediately; the cooldown persists through selling and rebuying. The front-page card and visual gallery now include the hero.

Sunwarden facing follows enemy left/right position. Green laser and Nova origins use per-form palm anchors matched to the sprite scale, recoil and horizontal mirroring. A labeled seeded browser fixture verified both facing directions and Nova activation/recharge; mobile visual review remains open.

Final Sunwarden release: 297 root tests passed in a clean staged copy. Headless checks include both facing directions with palm-origin rays for base/evolved/Sky forms, one-active-hero and Nova guards, cooldown persistence, armor/acid compatibility, render/portrait transitions and a 20-wave earned-shard controller (63 relic health, 20 Novas). Seeded desktop browser checks verified Nova button activation/recharge and visible left/right facing; no browser errors were logged. Screenshots remain local under releases/. Human campaign balance and mobile visual review remain open.

## Fifty waves and two heroes - October 24, 2026

Current campaign rules are in tower-defense-fifty-waves.md. Major bosses are on 20/35/50, with generated Jade Tyrant/Sovereign art and explicit lackey formations on 35/50. Shieldbearers and slow-resistant specters join the late-wave roster. Two Sunwardens now have independent slot-preserved Nova cooldowns and separate buttons. First-twenty-wave regression controllers remain; full earned-shard 50-wave controllers exercise the expanded roster at 30/60 Hz. Two further tower designs are documented and pictured in the gallery but are not recruitable.
