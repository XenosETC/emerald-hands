# Compact tower artwork - 2026-10-29

Fixed tower growth reported for Sunwarden on Floodgate Delta pad 2. All defenders now render in a fixed 102.4-world-unit sprite frame, including base, tier-three, Long Watch and evolved forms. Level, evolution and attack/upgrade pulses no longer enlarge that frame; Sunwarden has no extra size multiplier. Placement previews and palm-based hero laser origins use the same scale.

Removed the extra orbiting evolution crown and contained base-form upgrade ornaments within the compact silhouette. Sprite glow is reduced. Upgraded artwork, firing recoil, upgrade paths and attack effects remain. Tower positions, costs, damage, range, rates, targeting, hit detection and wave balance are unchanged.

Checks cover fixed rendered dimensions through all tower types and levels with maximum pulses, the actual Delta pad 2 evolved Sunwarden sprite, and mirrored palm/laser alignment. Full arcade regression tests remain required. Browser inspection is a visual check; physical-phone playtesting remains separate.

Files: pepe-tower-defense.js, pepe-tower-defense.html, scripts/tower-visual-art.test.cjs. To inspect: place Sunwarden on Delta pad 2 and compare its base and upgraded forms while enemies pass along the nearby road.

Browser verification used a clearly labeled seeded-funds fixture on Delta pad 2: base, evolved Firepower and Long Watch forms were visually checked. A 390x844 Long Watch check showed no horizontal overflow or console warnings/errors. The fixture does not represent earned progression. All 454 tests passed in the staged release copy, including hero palm alignment and the six full-map campaign regressions.
