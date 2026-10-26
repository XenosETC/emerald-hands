# Tower Defense relic approach warning

Added a persistent count in the relic HP tile when living enemies reach the final 180 road units. Amber marks nearby enemies; rose marks combined potential breach damage at least equal to remaining relic HP. Text counts accompany color, without flashing or overlays. The Enemies arrival panel explains possible HP loss and upper/lower lane counts on Grove. These are conditional warnings, not guaranteed damage or defeat predictions.

The warning measures remaining road length along each enemy's own route, avoiding false warnings across bends. Dead enemies, queued arrivals, build phases and ended runs are excluded. Pausing holds enemy positions and warnings. The damage display and actual breach share the same existing damage rule. Combat stats, spawning, rewards, persistence and difficulty are unchanged.

Files: pepe-tower-defense.js, pepe-tower-defense.html, pepe-tower-command.css, scripts/tower-visual-art.test.cjs.

Automated checks cover every current map plus legacy courtyard, both Grove lanes, distance boundary, nearby dead foes, a boss near the relic but early in its road, conditional critical damage, pause, build/end/reset clearing, no combat/save/reward mutation, and actual breach deductions for seven enemy classes.

Try it: start a wave, open Enemies, and watch the relic HP tile as enemies reach the last part of the road. Next gate: human playtesting across all six battlegrounds; the warning does not establish balance or physical-device performance.

Browser checks: a normal Grove wave completed with 12 breaches and HP dropping from 100 to 88; a separate labeled fixed-position/HP fixture verified critical warning text, both lane counts, and the rose HP tile. Fixture progression is not earned campaign evidence. Small portrait screens retain the existing page-scroll layout so controls remain usable.
