# Emerald Run: cosmic statue and material pass

The gold frog statue triggers a cosmic disco sky, slow cyan/magenta/gold light
sweeps, a gold shield ring, spike shattering and a 35% speed boost. Initial tuning
is eight seconds, followed by 0.8 seconds of protected deceleration. These are
playtest assumptions, not a measured balance result. Another statue refreshes
eight seconds rather than stacking duration. The first appears at 1,600 world
units, with later statues 7,500–8,700 units apart; a 210-unit clear approach keeps
spikes away from each statue.

Normal collisions resume after deceleration. Broken spikes disappear and count
once in the run result. There is no separate spike-break score award; the existing
distance scoring naturally runs faster during the boost. Shard/combo rewards,
rank thresholds and the existing local best-score key remain unchanged.

Pause freezes the countdown. Replay clears the power, transition and smash count.
The visible countdown and screen-reader announcements explain activation and
expiry. Reduced motion disables beam sweeping, streaks and camera shake and
reduces particles. Disco lighting uses slow low-opacity beams rather than strobe
flashes. Particles and the rolling course stay bounded.

## Rendering and assets

Fixed the road grid clipping to the current price-guide path: it now rebuilds
the closed road polygon before clipping. Removed full-screen shard flashes,
reduced gem/spike/coin bloom and stopped applying the coin shadow again when
drawing its image. The original coin's excess outer margin is excluded at draw
time, keeping the visible coin aligned with its gameplay radius.

The path now has generated jade masonry, brass edge trim and moving rail joints.
The original chart-shaped terrain still defines collision. Generated green
emerald collectibles and purple corrupt spikes replace the geometric fallback
shapes; alpha padding is excluded at draw time to align sprites with their
established gameplay footprints. Corrupt spikes remain hazards, not collectibles.

All eleven built-in imagegen assets live under `assets/pepecoin-run/`:

- `gold-frog-statue-v1.webp`: transparent collectible and HUD icon.
- `emerald-night-v1.webp`: calm jade valley background.
- `cosmic-disco-v1.webp`: temporary galaxy/disco background.
- `beyond-canon-v1.webp`: jade singularity, broken gold orbital rings and obsidian
  monoliths for the final event phase.
- `jade-track-v1.webp`: repeating stone material.
- `emerald-shard-v1.webp`: transparent green collectible.
- `corrupt-shard-v1.webp`: transparent purple spike.
- `celestial-crown-v1.webp`: transparent gold crown with a jade frog jewel.
- `royal-skyrealm-v1.webp`: floating jade islands, golden pagodas and auroras.
- `pepecoin-power-aura-v1.webp`: eight-frame transparent gold/jade power aura.
- `emerald-frog-statue-v1.webp`: crowned emerald sculpture for Emerald Rush.

Exact prompts are saved in `cosmic-prompts-v1.json`, `material-prompts-v1.json`
and `beyond-canon-prompt-v1.json`; `royal-prompts-v1.json` records the crown
and sky realm prompts. These images used the built-in image generation tool.
`animation-prompts-v1.json` and `emerald-rush-prompts-v1.json` record the new
aura and emerald statue prompts, reference role and animation layout.
Rendering retains simple fallbacks when optional art has not loaded.

## Verification

`npm test` covers the actual controller's pickup, one-time spike breaking,
protected expiry, restored lethal collisions, pause, refresh, replay and bounded
generation. Existing five-minute timing-controller fixtures now allow the
statue's higher speed cap; these are synthetic flat-road runs, not human balance
proof. `scripts/browser/emerald-run-cosmic.spec.cjs` exercises real RAF pickup,
collisions, pause, expiry and replay at phone and desktop sizes. The first natural
statue was also reached in a browser using timed jump input, then two real course
spikes were smashed. This used a deterministic flat market response; varied
curved-road balance and physical-device touch comfort still need playtesting.

## Feedback follow-up

The gold statue now gets a distance cue within 900 world units and a one-time
accessible approach announcement. At two seconds remaining, the power panel
switches to Shield Ending and plays one soft warning note. The panel tracks the
run's smashed spikes, while the gold ring continues to indicate protection.
Destroyed purple crystals break into rotating fragments sampled from the actual
corrupt-shard art. Effects stay capped and respect pause/reduced motion.

Fixed crash presentation: the fatal spike stays visible, and particles and camera
shake settle after impact while score, distance and the result remain frozen.
Previously the rendering loop kept drawing a permanently shaking frozen burst
and removed the fatal crystal. A soft ground contact shadow now helps separate
the rolling coin from the track.

A follow-up native browser run used seeded offline curved terrain and real
Space-key jumps. It reached the first statue, smashed five generated spikes,
completed the full burst and slowdown, and remained running after 17 seconds with
no browser errors. This is one automated input sequence, not a general human
balance claim. The follow-up core suite passed 517 tests; four focused browser
checks covered desktop/phone cosmic lifecycle and existing action controls.

## Parabolic event presentation

The eight-second burst now progresses through Cosmic Disco, Parabolic, and Beyond
Canon. A separately labeled **Simulated Event Price** starts from the current
road-playback price (or 20 for offline terrain) and accelerates on a cubic curve
to 40 times its anchor. That 40x is a visual tuning assumption. This is not a real
price quote, forecast, payout or currency. The original market display, market
tape, road collision geometry and scoring remain separately owned. A decorative
sky trail and small SVG sparkline visualize the parabola. The run result reports
the simulated peak; replay clears it. Refreshing an active statue anchors the
next curve at the current simulated value, capped for display stability.

A lightweight Web Audio groove accompanies the burst at 120 BPM. Voices have
short attack/release envelopes, a twelve-voice cap and end-of-note disconnection.
Local/global mute, pause, crash and replay stop active voices; late frames skip
missed beats instead of queuing a catch-up burst. Muting does not alter gameplay.
Colored light reflections on the jade masonry and small landing bursts strengthen
motion feedback. Reduced motion keeps the reflections still and reduces particles.

This event pass passed 519 core tests and five focused browser checks. The browser
sequence advanced the full eight-second event naturally, verified all three
phases, both mute controls and a simulated $800 peak from a $20 fixture anchor,
while the original market price stayed at $20. Desktop and phone screenshots
verified the event panel, chart and lighting. Browser audio checks establish Web
Audio lifecycle behavior; subjective mix quality still needs listening playtests.

## Portrait camera and readability

Emerald Run now uses a 720-by-720 camera surface on narrow portrait screens,
instead of shrinking all 1280 authored horizontal units into a small landscape
strip. The camera places the coin at 22% of the visible width; the player's
physics position, terrain and objects retain their authored coordinates. Desktop
and landscape retain the 1280-by-720 view. Resize changes only rendering and
letterboxing, so rotation does not teleport the player or move collisions. This
is an Emerald Run exception to the shared fixed-camera layout.

The combo HUD has a time-remaining bar for the existing 3.2-second collection
window. Emerald pickup detection now uses the same bobbing height as the visible
sprite. Reduced motion removes the gems' bob and spin. No scoring or rewards
were added by this readability pass.

Validation for this pass: 521 core tests and 31 browser checks passed, including
portrait-to-landscape-to-portrait rotation at 320/390 px with unchanged player and
course state, touch jumping, and cosmic lifecycle. A seeded curved-road touch-input
sequence completed the burst, smashed five spikes and was still running at 17
seconds. This is browser touch automation, not physical-device testing.

## Run report and shield handoff

Results now separate score, distance, peak combo, emeralds, smashed spikes and
distinct gold frogs into a stat grid, with a personal-best label and clearly
simulated event peak. Replay clears the report and counters. No new reward is
attached to these report fields.

A speed-cap spacing fixture reproduced a handoff trap at 600/610-unit spike gaps:
the next spike became lethal before a fresh post-shield jump could clear it.
The shield now emits one exit pulse when protected deceleration ends. It breaks
existing spikes from the coin's overlapping footprint to 210 world units ahead,
then normal danger resumes immediately. That 210-unit clearance is an initial
fairness tuning assumption, not extended invulnerability. The pulse reuses the
existing crystal-fragment effect and adds a low-opacity ring; reduced motion
keeps the ring static. Tests assert that later/new spikes remain lethal.

A 45-second seeded curved-road browser input sequence reached the 769.5 powered
speed cap, collected three statues, smashed sixteen spikes and completed three
slowdowns while remaining in play. A test-inserted final hazard then exercised
the results screen. This is automated timing evidence, not a human-won record.

Validation for the report/exit pass: 524 core tests and 34 browser checks passed.
The new report checks caught a clipped replay button in short landscape mode;
compact stat rows and heading spacing now keep title and replay reachable at
320×568, 390×844 and 844×390 without document scrolling. Browser replay clears
the new report and distinct-statue/smash counters.

## Realm transition and milestones

Beyond Canon now crossfades to its own generated realm artwork during the final
30% of the burst, then fades out through the existing exit. Its camera and road
collision coordinates are unchanged. The ordinary cosmic background remains the
fallback if the final realm asset has not loaded.

The existing goal strip briefly celebrates combo increases, rank changes and
3/6/10 spikes smashed within a burst. These are presentation milestones with no
extra score, currency, speed or duration. Shield/exit notices take priority over
phase messages, which take priority over ordinary celebrations. Notice timers
freeze on pause and clear on replay; reaching x8 does not repeatedly announce a
combo increase when another third emerald is collected.

This realm/milestone pass passed 526 core tests and 34 browser checks. A separate
40-second seeded curved-road touch-input sequence remained running with three
statues collected, twelve spikes smashed and a 769.5 maximum speed, with no
browser errors. The final-realm phone screenshot verifies actual asset crop,
contrast and status placement; this remains automated browser evidence.

## Retry the same road

Results offer Retry Same Road alongside Run It Back. Retry restores the route's
seed and a copy of its market terrain, clears run objects/counters/powers, and
increments the visible attempt number. A per-road best is retained for the
current route in memory. Run It Back chooses a new route and accepts the newest
waiting market tape. Late updates received during a run or its result screen
remain available after practicing the older route. Reloading/leaving clears this
temporary route snapshot; the existing saved global best remains unchanged.

Course generation now has separate seeded streams for object placement and
statue spacing. Particles, camera shake and other cosmetic randomness cannot
change future spikes. Statue-clearance reservations survive variable generation
batch sizes and are pruned when no longer relevant, independently of visible
statue cleanup. This also fixes clearance at section boundaries. Existing spawn
probabilities, spike spacing, combo rewards and currency formulas are retained.

This game's reward receipt is shown inline on the result screen; its shared
toast stack is hidden so earned-reward popups cannot cover either replay button.
Recording, wallet updates and badge unlocks still use the existing shared API.

Validation for the replay pass: the 529-test core suite and 36 browser checks
passed. Subsequent reward-receipt/newest-tape fixes were rechecked with the 29
runner controller tests, five report/replay browser cases, and a final two-case
same-road data check. Desktop and phone snapshots repeat the same generated
layout, and different course-build cadences reproduce the same future sections.

## Practice feedback

Same-road retries retain one previous result and one farthest-distance value in
memory. The report compares points and displayed meters against the immediately
previous attempt. The world marker targets the route's farthest point, which
does not move backward after a worse attempt. Passing it shows a brief distance
milestone; the marker is non-colliding and changes no rewards or physics. A new
route resets both comparisons, and no extra save key is written.

Crash hints use the coin's grounded/rising/falling state, or a recently faded
cosmic shield, to suggest a timing adjustment. These are contextual suggestions,
not guarantees for every slope. The expanded report is a keyboard-focusable,
bounded scroll region on short screens; replay controls remain outside it.

Validation for practice feedback: 531 core tests and 38 browser checks passed.
A separate phone-sized touch-input sequence first lost naturally at about 47m,
then retried the identical seed, passed its marker and remained running beyond
965m at 22 seconds without browser errors. This is automated browser input;
physical-device comfort and subjective coaching quality still need playtesting.

## Celestial Crown and Royal Skyride

The second majestic pickup lifts the coin above the road for six seconds.
Its floating jade-island realm blends in behind a cyan/gold trail and a crown
above the coin. Tapping the usual jump control, labeled Soar during the ride,
adds a brief upward arc. The first crown appears at 5,200 world units; subsequent
crowns are 14,000–16,000 units apart, with the same 210-unit pickup clearance as
the gold frog. A separate seeded stream preserves same-road retries.

Flight and protected landing are implemented in `pepecoin-royal.js`. Initial
tuning is a 110-unit hover, 22-unit gentle bob and a 48-unit tap arc over 0.65
seconds. Reduced motion removes the automatic bob. Flight eases in over 0.45
seconds and returns to the road over 0.8 seconds with protection throughout.
The existing one-shot exit clearance restores normal lethal collisions safely
when the final protection ends. Another crown refreshes flight without dropping
the coin. Pause freezes flight, and both replay choices clear its state.

Emeralds within 185 units are attracted to the coin and collected through the
normal shard/combo path; an attraction already in progress finishes after flight.
This can increase catches, so its reward impact needs longer balance playtests.
There is no separate crown currency award or new persistent save state.

Cosmic Disco and Skyride use independent clocks. Their effects can overlap, with
the existing single 35% cosmic speed boost. The crown adds no speed multiplier.
The simulated event-price panel belongs to Cosmic Disco and stays hidden for
crown-only flight. The HUD shows Soar, the flight/landing state and the remaining
disco time during overlap; results include the number of crowns caught.

Controller regressions cover first-frame pickup protection, soaring, normal
shard collection, landing back into lethal danger, duplicate pickup guards,
power overlap, pause, replay and frame-rate-independent expiry. Browser cases
exercise these transitions at 390 and 1,440 pixels using authored-pickup
positioning to isolate them from earlier jump timing. Separate automated runs
used jump inputs on the offline road without teleporting to the collectible:
both widths reached the first crown, soared and stayed running beyond 5,400
world units with no browser errors. These checks do not establish long-run
balance or physical-phone control quality.

Final validation for the Crown pass: `npm test` passed all 535 core tests;
the focused runner, action-game and canvas-layout browser batch passed all 40
checks. `git diff --check` reported no whitespace errors.

## Authored opening route, wild flight and Emerald Rush

`pepecoin-route.js` is the source of truth for the ordered opening chapters.
Their starts are world coordinates (the scrolling distance plus the coin's
fixed horizontal position), independent of incoming price tapes:

| Chapter | Starts | Beat |
| --- | ---: | --- |
| Jade Valley | 0 | Learn jumping and emerald collection |
| Cosmic Causeway | 1,600 | First gold frog and Cosmic Disco |
| Royal Skyway | 5,200 | First crown, swooping flight and three optional sky gates |
| Tempest Reach | 7,200 | Rain, distant thunder and blue spike auras |
| Stormbreak | 11,600 | Weather clears; keep reading the road |
| Emerald Grove | 13,200 | First emerald frog and Emerald Rush |
| Beyond the Valley | 16,800 | Continue the existing endless road |

The chapter strip previews distance to the next region. Chapter entry is tied
to position, while powers require actual pickup; missing an item does not
block progress. Pickups have 650 units of clear road before them and 210 after,
with matching lookahead beyond the generation horizon. This supersedes the
earlier symmetric 210-unit reservation and gives full-speed jumps room to land.
Each pickup type has its own seeded spacing stream. Same-road retries preserve
the resulting layout across different generation batch sizes.

Royal Skyride now bobs by 42 units, adds a 72-unit tap arc and gently banks the
coin. Its three gates follow the road, placed 650/1,350/2,050 units ahead of
pickup with vertical offsets of 135/170/115. Gates are optional style targets:
passing each counts once, three passes celebrate a Royal Grand Tour, and misses
carry no penalty. They grant no points, currency or speed. A three-color flight
trail follows at most 32 samples over 1.1 seconds. Reduced motion removes the
bank, automatic bob and moving trail. Protected landing stays unchanged.

`pepecoin-weather.js` fades the storm in from 7,200 to 8,000 and out from
10,400 to 11,600. Two fixed-size rain layers and three localized lightning
strikes create atmosphere without full-screen flashes. Muted games remain
silent. Reduced motion uses sparse static rain and disables lightning. Pause
freezes weather; retries reset it. Blue spike outlines retain the purple core
and the original collision dimensions and lethal behavior.

`pepecoin-rush.js` owns the independent seven-second Emerald Rush timer. The
emerald frog appears first at 13,200 and then every 18,000–22,000 units. Its
260-unit magnet uses the normal shard/combo collection path. Green eyes pulse
locally at 1.3 Hz and rotate with the retained coin face; reduced motion holds
them steady. Another pickup refreshes the timer, without stacking duration.
It grants no shield, speed or direct currency award. Independent timers let it
overlap the other powers; a separate green label remains visible during overlap.
Normal attraction already in progress may finish after the timer expires.

The generated aura plays eight 256px cells in a 4-by-2 sheet at 10 fps, with
one held frame for reduced motion. It decorates the original coin rather than
replacing its identity or changing its collision radius. Generated alpha is
preserved in both new WebP assets.

These are initial playtest values. Wider attraction and clearer pickup approaches
can raise catches and survival even though reward formulas are unchanged. A
native-input automated run on the offline road reached all three powers and
passed all three gates at both 390px and 1,440px, with no browser errors. This
does not establish campaign balance or physical-device comfort.

For expansion, add authored chapters and their event definitions to the route
registry, keeping environment rendering, pickup timers and shared rewards
separate. The next substantial development should be a second authored act
after 16,800 with its own landmark and traversal event, then a longer reward
balance pass. Beyond the Valley currently continues the existing endless road;
new second-act scenery or bosses are not implemented in this pass.

Final validation for this route/event pass: all 541 core tests passed, followed
by all 44 focused browser checks. Desktop/phone isolated fixtures cover storm
danger, reduced motion, power stacking and expiry, Rush magnet collection,
replay and the separate overlap banner. Syntax checks and `git diff --check`
passed. The generated assets and changes remain local and uncommitted.

## Release progression feedback

The chapter strip now includes a bounded progress bar for the authored opening
route. Entering Beyond the Valley announces opening-route completion once;
the endless road continues with the existing speed and reward rules. Results
show the reached region and opening-route percentage, or completion. Both
replay choices start a fresh route-progress display while preserving their
existing same-road/new-road semantics. This adds no persistent unlock or reward.

Release-candidate validation: 542 core tests and all 44 focused browser checks
passed, including small-screen reports and both replay controls. The staged
release contains the accumulated runner assets, route/event modules, camera,
practice features and their regressions; unrelated workspace projects are
excluded.
