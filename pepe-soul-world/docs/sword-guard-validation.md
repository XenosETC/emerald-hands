# Crown sword guard — 2026-10-06

## Implemented

Crown raises Ribbit Fang into a grounded, two-handed sword guard. Four new poses cover raise, held guard, braced contact and recovery. They were generated with the built-in image tool from the existing official Crown Warp and planted-Rift artwork, preserving his frog face, black robes, ivory scarf and curved blade. The selected source is preserved alongside the packed 1024 × 1024 transparent atlas. Measured sole anchors keep both facings on the surface.

- Hold **S / Down** to guard. **A / D** changes facing while guarding, without walking.
- The desktop **Sword guard** button toggles guard; touch has a **Hold guard** control. Input during a committed move queues guard until that move finishes.
- Release guard to attack or jump; **K** can Warp out directly.
- Frontal weapon strikes and hostile projectiles spend Spirit instead of HP after the blade is raised. Emerald/silver sparks, a brief impact pause and a metallic sound mark contact.
- Insufficient Spirit breaks guard. Rear attacks and ground eruptions bypass it.
- Pausing, opening the journal, death and travel clear held controls. Guard is transient and does not change the save format.

## Prototype tuning assumptions

Guard starts after 0.12 seconds. A blocked hit costs `max(8, ceil(raw damage × 0.8))` Spirit; regeneration stops while guarding. A break empties Spirit, applies the ordinary defended hit to HP, locks guard for 0.8 seconds and requires releasing guard before rearming. There is no air guard or perfect-parry bonus. Temple lotus and Frozen elite ground eruptions are explicitly unblockable. Reduced effects retain readable poses and smaller sparks while removing the block camera shake/impact pause.

## Evidence

- **143 automated tests pass**, including eight guard tests covering every realm and both facings, startup/rear hits, projectiles, unblockable hazards, break/rearm, movement, regeneration, committed-move recovery, Warp exit, pose blending and save/travel behavior.
- **Native game input:** in the isolated practice save, clicked the guard toggle in Academy, then used walking/Warp and Map controls to reach the Temple approach. The bounded captured exchange kept HP at **210** while blocking disciple sweeps at **10 Spirit per hit**. See [live impact](sword-block-temple-native.png) and [Academy stance](sword-guard-academy-native.png).
- An earlier prolonged live inspection exhausted Spirit and visibly broke guard, reducing HP from 240 to 210. That was a separate exchange, not part of the successful block capture. The practice character was returned to Academy with full HP/SP. The normal save was untouched.
- Native testing exposed the guard toggle being disabled during Warp recovery. It now accepts queued guard input, consistent with holding the keyboard control, without interrupting Warp.
- **Animation studio:** inspected held guard mirrored left with grounded boots. Scrubbed Rift and Domain after fixing their stale `blendCrown` calls to the current `blendPoses` renderer method. [Studio screenshot](sword-guard-studio-native.png). No warning/error console entries in the inspected native sessions.
- **Simulation/renderer preview:** [block → counter GIF](sword-guard-counter.gif), 3.6 seconds, 640 × 360, 108 frames, **4,187,767 bytes** after the flow follow-up below. The fixture blocks a guardian cleave for 20 Spirit with HP190 unchanged, then lands a normal counter (guardian HP210 → 164). See [machine-readable result](sword-guard-proof.json). This GIF is a deterministic renderer fixture, not a native screen recording.

## Assets and changed files

- Art: `assets/crown-guard-source-v1.png`, `assets/crown-guard-v1.png`, `guard-layout.js`; [contact sheet](crown-guard-contact.png), [exact generation prompt](sword-guard-prompt.json), [packing measurements](guard-packing.json).
- Asset preparation: `tools/pack-guard.mjs` preserves the generated source and packs connected sprite components with common scale and measured ground anchors.
- Combat: `sword-guard.js`, `core.js`, `temple-combat.js`, `combat-cues.js`.
- Presentation/input: `render.js`, `realm-art.js`, `audio.js`, `game.js`, `index.html`, `style.css`, `animation.js`, `animation.html`.
- Verification: `tests/sword-guard.test.mjs`, `tests/realm-art.test.mjs`, `tools/sword-guard-proof.mjs`, preview images/GIF/receipts in this folder and the README entry.

## Test and next review

Run `node --test pepe-soul-world/tests/*.test.mjs`. In the game, face a patrol and hold S, absorb a strike, release and press J to counter. Try K to escape, a rear strike, low Spirit, and a Temple lotus eruption. Open `animation.html`, choose Guard, pause, scrub and flip to inspect the drawings.

The native proof used the desktop toggle; sustained keyboard and mobile hold behavior have rule coverage but were not separately native-playtested. Block audio was added but not aurally reviewed. Human timing/balance, reference likeness, mobile layout and lower-powered-device performance remain review items. Next recommended pass: playtest guard → counter alongside Warp against a full Temple encounter before changing the prototype costs or adding a parry.

## Guard-to-counter flow follow-up — 2026-10-06

Two input issues were corrected. Releasing guard and pressing Slash before the next simulation tick could previously reject the slash because the player still had a guarding flag. Touch guard could also inherit a desktop click toggle, leaving guard on after the touch ended. `GuardControls` now releases the stance immediately after the last owning input releases, and keyboard/touch guard input takes over from the optional click toggle. Multiple guard keys or pointers still preserve each other's held input. A release/re-press between ticks also clears the break rearm requirement while retaining the recovery lock.

The last held/braced pose now blends into the opening cut over at most 60ms, anchored to Crown's feet. Reduced effects switches directly. This uses existing game assets and changes no attack damage, hit timing, guard costs, or save fields.

### Follow-up validation

- **149 tests pass.** Six additional tests cover same-tick keyboard release/counter, touch ownership, concurrent sources, click release, guard-break rearm, and the guard-to-cut pose handoff.
- **Native keyboard:** started from a toggled guard in Academy, tapped S to take over and release it, then J. The game showed `attack`, `CUT 1`, and guard off. [Screenshot](guard-keyboard-counter-native.png).
- **Phone-width UI (390 × 844):** started with the desktop guard toggled, then clicked the visible touch guard control and Slash. The guard cleared and Cut 1 started. Controls fit the inspected viewport. [Screenshot](guard-touch-counter-native.png). This verifies real pointer events at the responsive layout; it is not a physical touchscreen or sustained multitouch test.
- **Native Temple combat:** blocked a disciple sweep, released with S, and pressed J; repeated against the second disciple. Remaining enemies fell from 3 to 2 to 1, XP advanced from 194 to 216 to 238, and HP stayed **240**. Each observed block cost **10 Spirit**. The first capture initially waited for a surviving enemy's damaged HP, but the counter killed that enemy; the quest count and XP verified the result. The second capture explicitly waited for the remaining-enemy count. [Live counter result](guard-live-counter-native.png).
- Returned through the existing Map action to Academy at x420 with HP240/SP100. [Home screenshot](guard-flow-home-native.png). Practice progress gained the two kills and collected drops; normal save untouched. No warning/error logs in the inspected working game tab. Temporary phone viewport reset.
- Refreshed the full-speed [GIF](sword-guard-counter.gif). It now uses the same guard input controller and accepts the counter before any intervening simulation step at 1.1833s, following the block at 1.1167s. Inspected the grounded [handoff frame](guard-counter-handoff-preview.png). Guardian HP210 → 164; player HP190 unchanged.

### Files and remaining review

Added `guard-controls.js` and `tests/guard-controls.test.mjs`; updated `game.js`, `sword-guard.js`, `render.js`, `tools/sword-guard-proof.mjs`, README and the linked proof files. No new generated artwork.

Try holding S, block a hit, release and immediately tap J. Also switch from the desktop toggle to the touch guard control, release it, and tap Slash. The next review is sustained multitouch on a physical device and a full guardian encounter at a lower progression level; this pass's native combat covered two Temple disciples, while the Abbot counter was simulation-rendered. The 60ms blend remains a visual tuning choice.
