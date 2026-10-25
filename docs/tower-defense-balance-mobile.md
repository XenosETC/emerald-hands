# Tower Defense balance and phone pass - 2026-10-24

Assumption: normal difficulty should permit several thoughtful build orders, make later waves demand upgrades and abilities, and preserve the forgiving first twenty waves. No difficulty selector, paywall, permanent power, or Arcade Shard reward change was added.

## Balance changes

The extension health term after wave 20 changes from `0.03e + 0.0005e²` to `0.06e + 0.0015e²`, where `e = wave - 20`. This raises the wave-50 health multiplier from 10.925 to 12.725 (about 16.5%). Counts, enemy speed caps, boss waves and escort rosters remain unchanged. Thornkeeper damage per consumed charge rises from 8 to 10; charge count, patch expiry, caps and one-hit-per-enemy rules stay intact.

Before tuning, a mixed controller finished with 87 relic health both with and without Nova; it lost no health after wave five. A deliberately stronger candidate failed around waves 42-43 and was rejected. With the selected curve and Thornkeeper improvement, the same automated controls finish all fifty waves: mixed/early heroes 77 HP, no Nova 57 HP, new defenders before heroes 18 HP. The new-defender opening retains 100 HP through wave 40, then takes late pressure. Runs use earned funds and 30 Hz simulation, roughly 34-36 minutes of active game time; this is controller evidence, not a substitute for human balance approval. The final boss can still breach for its normal damage if defenses fail to finish it.

## Phone changes

Portrait uses an undistorted 16:9 battlefield, five-column numbered pad controls in two rows, 44px or larger core action targets, a scrollable command bay, and larger shop labels. Short portrait screens may scroll vertically instead of clipping controls. Landscape uses a side bay, one row of nine pad buttons, and a contained battlefield; pointer conversion accounts for the letterbox so taps retain their actual world location.

Tower Defense starts the shared arcade menu collapsed on viewports at most 1000px wide. Every shared control remains available through Menu. Companion and Pets positions are scoped to this game so they clear the wave action row. Existing mastery and independent saves are preserved.

## Verification

The clean staged release passed 372 arcade tests plus 17 launch visual tests (389 total). The campaign regressions now exercise both early-hero and early-new-defender build orders; a pointer regression verifies centered letterbox mapping and actual pad placement. Desktop browser checks verified 390x844 portrait, 360x640 and 320x568 short portrait, and 844x390 / 667x375 landscape without horizontal overflow. Core pad targets measured at least 44px high; portrait widths exceed 56px. Normal-funds flows exercised build, move, sell, upgrade, wave start, pause and resume. A separately labeled seeded-funds fixture exercised Ballista upgrades on a 360px viewport. The final phone Pets position clears the wave row (top 798px versus wave bottom 767px at 390x844). No warning/error console entries were captured. Physical-device touch feel and low-end phone performance remain manual follow-up work; responsive desktop browser checks do not establish those.

The subsequent boss counterplay pass changes the major-boss formations and health; see tower-defense-boss-counterplay.md for current encounter results and two-hero phone layout checks.
