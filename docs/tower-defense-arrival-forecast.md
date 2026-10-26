# Tower Defense arrival forecast

The Enemies tab now shows the next four scheduled arrivals, approximate entry times, boss/guard labels, and Grove lane names. During combat it reports resolved arrivals, live enemies, and queued arrivals. Resolved includes defeats and breaches. The existing boss strip gives an approximate countdown until a queued boss enters, then returns to live boss health.

This reads the existing authored queues and spawn timer. It adds no enemies and changes no combat stats, rewards, wave timing, or saves. Times account for selected combat speed and remain approximate because spawning is frame scheduled. Pausing holds the simulation countdown.

Files: pepe-tower-defense.js, pepe-tower-defense.html, pepe-tower-command.css, scripts/tower-visual-art.test.cjs.

Validation: queue and lane checks across all 50 waves on all six maps; speed scaling, guard grouping, boss countdown, resolved progress, empty queue, pause label, and no save/reward writes. Browser checked normal wave 1 on Grove, opening and live queues, 390x844, 320x568, and 844x390 with no horizontal overflow or console warnings/errors. Browser checks are layout/runtime evidence, not human balance or physical-device performance proof.

Try it: start a defense, open Enemies, inspect the opening schedule, then send the wave. Toggle speed to compare ETAs. On Grove, watch the alternating lane labels. Next recommended step: player testing of the six maps and major boss preparation.
