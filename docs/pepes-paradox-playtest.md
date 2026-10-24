# Pepe’s Paradox — mountain and touch update

Updated 23 October 2026.

## Shipped changes

- Independent pointer ownership for Move, Jump, Dash and Realm; releasing one finger cannot release another. Pointer cancellation, pause and focus loss clear the appropriate input.
- Hold Jump repeats on landing. Held movement and Jump survive dialogue and fall recovery. Keyboard state remains separate from fingers.
- Recovery preserves collectibles, grants brief protection and refreshes dash. A lower stone at the post-dialogue ravine prevents the repeated miss-and-reset pattern seen during browser testing.
- Gate completion resolves on landing before buffered or held jumps. This fixes the discovered endless-bounce-at-gate bug.
- Bounded wisp patrols, dash dispersal, timed reformation and contact protection. Fallen now fully exits instead of remaining frozen in view.
- Stone seams, moss, shrine lanterns, route signs and a temple gate. Touch layouts hide overlapping arcade/pet overlays and provide a local Pause button; portrait and landscape styling are scoped to this game.

## Verified on the final code

`node --test --test-name-pattern=Paradox scripts/frame-clock.test.cjs`

24 Paradox checks passed, including three full-stage **headless pointer-event** runs using the shipped game loop, controls and physics. These are not native-touch browser or device rendering proof.

| Frame delivery | Realm | Deliberate recovery | Result | Falls |
| --- | --- | --- | --- | --- |
| 30 Hz | Jade | No | Gate completed, replay worked | 0 |
| 60 Hz | Echo | Yes | Recovered, gate completed, replay worked | 1 |
| 120 Hz | Jade | Yes | Recovered, gate completed, replay worked | 1 |

Each run advanced all three dialogue lines while fingers remained held, paused/resumed, reached the gate, recorded completion once and replayed. Separate checks cover release/cancel ownership, wisp protection/dispersal, realm collision, safe checkpoints and frame-rate consistency.

## Final mobile browser evidence

The final code passed two complete Edge browser runs with mobile viewport emulation and native browser multi-touch events. Browser RAF and shipped physics ran normally; only read-only game telemetry was inspected. There was no teleportation or injected physics.

| Mobile viewport | Route | Result | Falls | Wisp dispersals |
| --- | --- | --- | --- | --- |
| 390×844 portrait | Jade, Move + Jump held | Dialogue, pause/resume, gate and replay passed | 0 | 0 |
| 844×390 landscape | Intentional fall, recovery, Echo, Move + Jump held | Dialogue, pause/resume, gate and replay passed | 1 intentional | 1 |

Both runs completed all three dialogue lines without re-pressing movement, checked that pause froze position, reached the gate while Jump was held and replayed on the same page. The landscape route recovered while Move stayed held, kept its collectibles and used Realm and Dash with other fingers held. All tested controls stayed within the viewport. No browser errors or repeated falling loops occurred. Both routes recovered two Origin Relics and the hidden frog. The full repository suite passed **292 tests**.

The retry exposed a cropped landscape Pause target and the need to handle UI activation directly on secondary touch release. Continue, Pause, Start and Sound now handle touch/pen release with duplicate-click suppression and preserve keyboard activation. The runner also had a finger-release bug: it sent the remaining contacts as the fingers to release. It now releases only the ended contact, so multi-touch tests faithfully preserve held movement/jump fingers.

Evidence is in `output/paradox/stage-playtest.json`, the portrait/landscape dialogue and completion screenshots, and `output/paradox/test-results.txt`. Earlier failed screenshots and browser-check artifacts may still exist; the JSON report's final `status: passed` and its two named runs describe this acceptance run.

This is browser mobile emulation, not a physical Android/iOS device or human balance certification. It establishes the two tested complete input routes, not a guarantee about every possible input sequence.

## Repeatable mobile browser check

With Playwright available to Node and an installed Edge browser on Windows:

```text
node scripts/pepes-paradox-playtest.cjs
```

The runner starts a temporary local-only server and closes it afterward. By default it tests desktop keyboard, Echo/recovery, 390×844 portrait touch and 844×390 landscape touch, using native browser touch events and read-only telemetry. It checks dialogue with held fingers, intentional recovery, pause/resume, gate completion, replay, control bounds, errors and repeated falls. It writes `output/paradox/stage-playtest.json` plus screenshots. No teleportation or injected physics is used.

For only the two mobile routes set `PARADOX_RUN=mobile` before running it; use `touch-stage` or `touch-recovery-landscape` to isolate one route. Playwright must be installed or exposed through `NODE_PATH`; no dependency is downloaded by the runner. Physical-device spot checks are the next recommended validation.
