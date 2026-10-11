# Pepe Relic Rumble finishing pass — October 11, 2026

This pass covers the keyboard-only browser fighter, independently of native Unreal/Godot Rumble projects. The existing local PvP, three-bout AI tournament, character roster and KEK Domain final remain the game loop.

## Improvements

- Visible match score shows each player's round wins and the required target: three wins for PvP, two per tournament bout.
- Fair-draw assumption: equal-health timeouts and double knockouts award neither player a win. After the existing inter-round delay, both fighters return at full health for another round. Previously, equal-health timeouts favored Player 1 and double knockouts favored Player 2. These rules are stated in setup.
- Completed rounds are accepted only while combat is playing, preventing duplicated outcome/reward handling. Match replay focuses the launch action; KEK ceremony focuses its own action.
- Pausing, blur, hidden-page transitions, setup and round changes clear held keys and queued player actions. Input on focused controls, modifiers, setup or paused screens cannot become a combat command.
- Launch cannot replace active combat or bypass the locked Berserk selection. Setup closes an old domain ceremony and resets its input. Audio-constructor failure leaves combat and ceremony usable.
- Character cards expose their selected state, and earlier animation timestamps cannot produce negative simulation delta.

## Verification

Seven tests execute an in-memory copy of the actual controller with a test-only lexical gateway; that gateway is never written into the shipped game. Tests cover timeout/double-KO draws, full PvP match/replay, paused/setup input, active/locked launch, three tournament bouts and KEK completion, CPU victory without champion unlock, and unavailable audio.

The root check is `npm test`: sixteen-game smoke and 123 behavior tests. Browser checks use an isolated localhost origin. Tournament completion and fatal outcomes in tests are fixtures, not a manually won tournament. Physical-device comfort, full human combat balance and hosted verification remain separate gates. This game still requires a keyboard; responsive setup does not add touch combat.

Native roster controls drafted Bandit versus Mecha, launched the fight and accepted a punch input. Two naturally expired equal-health rounds advanced to Round 3 with both fighters still at zero wins and 100 health. Shared pause/resume worked, and opening a new fight card showed the tournament roster, simulated bracket and locked Berserk card. [Live match score](docs/relic-rumble-finish-2026-10-11/match-score-desktop.png) records the draw result. The controller tests separately verify match rewards, replay and final ceremony.

Tournament setup also fit a measured 390-pixel viewport with page width 375 and no horizontal overflow. [Phone-size draft](docs/relic-rumble-finish-2026-10-11/tournament-draft-phone.png) shows the explicit keyboard requirement. Both QA origins returned no browser warnings or errors. This verifies responsive browsing of setup, not touch combat or a physical keyboard on a phone.
