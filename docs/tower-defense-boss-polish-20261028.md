# Boss fight and mobile polish - 2026-10-28

Nova buttons now show each hero's living target count in reach, a cooldown countdown, no foes, or next wave. Empty casts are disabled in the UI. A ready Nova has a stronger jade background, with a gold border when a boss is in reach; text remains the primary cue. Both heroes use the same reach query as the actual attack. Damage, cooldown duration, armor interaction and rewards are unchanged.

H respects an explicitly selected Sunwarden. When no hero is selected, it chooses a ready hero with living targets in range, instead of stopping at the first ready hero with an empty radius. Explicit Nova 1/2 buttons retain their own slots. Pause, movement, build-phase and cooldown guards remain active; unsuccessful casts spend no cooldown.

The boss strip now remains visible after a major is defeated or breaches while any wave enemies remain. It names the outcome and shows remaining guards and total foes. It does not claim victory or discard the remaining queue. Outcomes derive from the current authored spawn index and recorded breach metrics, without another persistence key or save migration. Existing live boss HP and approach countdowns remain in place.

Validation: focused checks exercise both Nova buttons and H on all six maps; inclusive range boundary, dead-foe exclusion, boss cue, pause and no-spend behavior; and defeat/breach/remaining-wave transitions for all 18 map/major-wave combinations. The existing full six-map earned-fund campaigns and shared arcade regressions remain required. These automated checks establish behavior, not human balance or physical-phone performance.

Try it: deploy a Sunwarden and send a wave. Its button enables when living foes enter reach. With two heroes and a non-hero selected, H chooses a ready hero that can hit. During waves 20/35/50, defeating the boss leaves the outcome and cleanup count visible until every remaining foe is resolved.

Files: pepe-tower-defense.js, pepe-tower-defense.html, pepe-tower-command.css, scripts/tower-visual-art.test.cjs. Next gate: hands-on boss fights on the target phones, especially split-front Grove and eight-pad Harbor.

Browser evidence: a labeled seeded/fixed-position fixture exercised Nova 2 reach, native casting/cooldown and boss-defeated cleanup on all six maps. On Grove, native H selected Nova 2 while Nova 1 had no targets; a separate native fixture action caused the actual ten-HP Sovereign breach and displayed the breach/remaining-foe message. Native Nova tapping also worked at 320x568. At 390x844 both buttons were 44px high, boss health ended at y=750, and the live intelligence pane retained about 136px. At 844x390 the breach view retained about 112px of intelligence space. No horizontal overflow was observed at these three sizes, and no console warnings/errors were captured. Small portrait retains its established vertical-scroll layout. These fixtures are presentation/interaction evidence, not earned progression or physical-device tests.

Release checks: 451 tests passed in an isolated staged copy. Prepared earned-fund 50-wave campaigns defeated all three majors on every map with the prior HP outcomes: Classic 77, Delta 43, Quarry 100, Grove 66, Harbor 48, Hall 71. This confirms no balance drift for that policy; human control feel remains a hands-on gate.
