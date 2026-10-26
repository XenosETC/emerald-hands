# Wave scouting - 2026-10-25

Assumption: players should be able to inspect actual wave-scaled starting enemy stats before committing upgrades. Enemies now shows an illustrated roster for the current wave, including exact starting HP, species counts, armor, slow resistance and relic breach damage. Existing generated enemy assets are reused to keep portraits coherent with combat.

The roster covers every scheduled enemy, including fixed boss guards. It stays a starting-stat reference during combat: damage, acid and slows do not rewrite it. The UI explicitly labels this distinction. It advances with the build break, derives from the resumed wave, hides after campaign victory and resets on a new defense. The roster is rebuilt only when the wave changes, rather than replacing its DOM every frame. Existing wave preview, recap, field guide and boss encounter controls remain available in the same scrollable panel.

Scouting and spawning share enemyStartingStats(kind, plan). This preserves the original health formula, Tyrant/Sovereign modifiers, capped speed growth, armor, resistance and breach values. No wave composition, rewards, saves, targeting, tower stats or difficulty changes are intended. No new art generation is needed for this information feature.

## Validation

Tests compare species counts and starting HP, maximum HP, speed, armor, slow resistance and breach damage against every actual spawn in all 50 authored waves, and separately assert the previous health/speed formulas. Further checks cover damaged/debuffed enemies, build transitions, victory/restart and wave-50 checkpoint resume. Full campaign controllers remain regression evidence rather than human balance approval.

Browser verification: the real opening wave showed 12 Crawlers at 83 HP. A labeled wave-35 QA fixture skipped the earlier campaign solely to inspect late-wave UI, then saved/refreshed/resumed through the normal checkpoint flow. Jade Tyrant appeared first at 33,573 HP, 25% armor, 25% slow resistance and 6 breach HP. All roster portraits loaded. At 390x844 and 320x568 there was no horizontal overflow and the intelligence panel remained scrollable; browser warnings/errors were empty. This is interface evidence, not physical-device performance or a human campaign playthrough.

Final isolated staged validation passed 401 arcade tests and 17 launch tests (418 total), plus smoke checks for 18 games. Existing mixed 1x/2x controllers still finish with 89 relic HP, and the early-new-defender order with 72 HP; each defeats all three major bosses. These unchanged outcomes support the intended absence of combat changes.
