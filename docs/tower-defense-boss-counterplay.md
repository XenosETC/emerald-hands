# Boss encounter counterplay - 2026-10-24

Assumption: major bosses should demand damage specialization while fixed, readable escorts require crowd control. A prepared mixed roster should be able to kill the bosses, rather than relying on the relic health pool to absorb them. Other build orders may still finish by surviving breaches. No invulnerability, healing, surprise extra spawns, reward inflation, or pay-to-win mechanics are added.

## Encounter rules

Major bosses on 20/35/50 now enter halfway through their existing wave count. Warboss has two brutes and two raiders, Tyrant two shieldbearers and two specters, Sovereign two shieldbearers, one brute and three specters. These replace existing slots; they do not increase total foe counts. A 2s gap precedes the boss, and guards arrive 1.1s apart, followed by a 1.1s recovery before ordinary arrivals resume. Guards have normal stats. Minor bosses retain their ordinary wave cadence.

Warboss health is unchanged. Tyrant health is 90% and Sovereign 75% of the prior formula. Armor, slow resistance, movement, breach damage and rewards stay the same. All bosses take damage normally. This offsets the dedicated guard formation and gives the player a kill window instead of extending a health sponge.

Direct-fire defenders have First / Strong targeting. First chooses the living in-range enemy furthest along the path; Strong chooses highest maximum health in range, with path progress breaking ties. This lets Ballista and acid focus a boss while rapid fire, splash, slow and thorns handle guards. Modes may be changed during combat, persist through moving/upgrading, and do not cost shards. Pause/move guards prevent accidental changes. Thornkeeper retains road contact behavior and exposes no misleading direct-target switch.

The Enemies preview discloses guard rosters, cadence and counterplay before launch. The command footer shows live boss HP and guards still alive or queued; it never counts ordinary foes as guards. A boss death alone cannot advance a wave while other foes remain.

## Balance evidence

Earned-fund 30Hz controller runs with the complete nine-defender roster: mixed First targeting and mixed Ballista/Alchemist Strong targeting both defeat all three majors and finish at 87 relic health. An alternative build recruiting the new defenders earlier finishes at 38 health, killing Warboss and Tyrant but letting Sovereign breach at 22% remaining HP. Without Nova, the baseline mixed controller finishes at 73 health. These are provisional controller comparisons, not human balance approval. Placement and target allocation still matter.

## Validation

Clean staged release: 375 arcade tests plus 17 launch visual tests passed (392 total). Regressions cover fixed guard queues, boss/guard cadence, Strong range filtering and mode persistence, HP/counter synchronization, no premature victory, and earned-fund campaigns with actual major-boss kill counts. Desktop checks used an explicitly seeded entrance fixture for waves 35 and 50; this skips the earlier half-wave only for visual review. The fixture verified changing targeting during combat, HP feedback, guard counts and the Enemies counterplay preview, with no warning/error console messages. Phone checks at 390x844 and 844x390 with both heroes retained 153px and 119px of scrollable inspector space, respectively, with both Nova buttons and boss HP visible. The disabled wave button is hidden during combat and returns for the next build break. Generated artwork is reused unchanged; no new art is required for these mechanics. Physical-phone performance and player difficulty feedback remain open.

Subsequent ordinary-wave spacing and current campaign outcomes are documented in tower-defense-wave-spacing.md. The major boss and guard gaps above remain fixed.
