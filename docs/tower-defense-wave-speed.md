# Tower Defense wave-speed control - 2026-10-25

Assumption: the fifty-wave campaign benefits from optional fast-forward, while normal-speed play remains the default. The command row now includes Speed 1× / Speed 2×, available before and during waves. Build phases always advance at normal speed, even when 2× is selected for the next wave. Fresh and resumed defenses start at 1×; speed is not part of the saved build.

## Timing and gameplay

Fast mode runs two ordinary simulation substeps for each delivered animation frame. Enemy movement, arrivals, damage, attack intervals, thorn contact/expiry, acid/slows, Nova recharge and transient effects all advance together. The frame delta remains capped at 33ms per substep. The HUD refresh and canvas rendering run once per outer frame. This avoids doubling the timestep and skipping a bolt, trap contact or enemy breach.

The substep loop stops immediately when a wave clears or the relic is destroyed. It cannot auto-launch another wave, grant a second clear reward, or continue attacking after a result. Shared pause stops both simulation and the speed toggle. Build breaks give the same planning time and save normally. Tower costs, paths, health, rewards, formations and the checkpoint schema are unchanged.

2× is optional and requires more simulation work per frame. It does not guarantee twice the real-world throughput on a slow device or in a background tab. Physical low-end phone performance and player input comfort remain separate checks.

## Verification

The clean staged release passed 386 arcade tests plus 17 launch visual tests (403 total). Matching-substep tests produce identical enemy/tower/trap/currency state at 1× and 2×. The full earned-fund 2× campaign completed fifty waves in 31,784 outer controller frames versus 63,503 at 1× (30Hz controller), with 89 relic HP and all three major bosses defeated in both. These are controller results, not a physical-device throughput guarantee. Desktop and phone browser checks exercised speed changes during combat, pause protection, upgrades and checkpoint resume back at 1×. The control measured 44px high, fit its text at 320x568 and 844x390, and caused no horizontal overflow. No warning/error browser logs were captured. Matching-substep tests compare actual enemy/tower/trap/currency state at 1× and 2×. Additional regressions cover pause, normal-speed build breaks, checkpoint resume defaults, wave-clear and fatal-breach boundaries. The earned-fund campaign matrix includes a full 2× fifty-wave run using the new defenders.
