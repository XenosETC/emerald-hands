# Emerald Run: Act Two

Act Two extends the existing run after the opening route. It requires no extra
menu, save slot, unlock payment or currency conversion. Same-road retry repeats
the authored events and seeded objects; both replay choices reset all event
timers, physics flags and world blends.

## Sequence

All starts are world coordinates: scrolling distance plus the coin's fixed x.

| Beat | World position | Behavior |
| --- | ---: | --- |
| Obsidian Starrail | 16,800 | Floating obsidian mountains and gold orbital rails; Act Two progress starts |
| Comet Express | 17,800 | One automatic eight-second protected hoverboard ride |
| Lunar Lotus Sea | 22,400 | Low-gravity jumps and wider hazard spacing |
| Eclipse Cathedral | 27,600 | Emerald stained glass, cosmic machinery and an eclipse |
| Emerald Eclipse | 28,400 | One seven-second wider magnet event |
| Cathedral Resonance Bells | 29,700 / 31,000 / 32,300 | Optional airborne targets; ringing all three awakens Eclipse Slingshot |
| Beyond the Eclipse | 33,600 | Act Two completion milestone; endless road continues |

The route registry owns these boundaries. `pepecoin-act-two.js` owns event
timers, world blends, rail lift/vaulting and the lunar spacing rule. The main
controller applies those outputs to the existing physics, rendering and normal
collection path. Events trigger once on reaching their authored marker. A
test/debug seek beyond an event's 1,000-unit entry window does not replay that
event in a different world.

## Ride and physics

Comet Express automatically boards the coin onto a generated obsidian/gold
hoverboard. It retains the current jump height on boarding and eases to an
85-unit hover over 0.5 seconds, with a 34-unit wave. Tapping Vault adds a
110-unit arc over 0.75 seconds. Repeated taps cannot refresh the ride timer.
Reduced motion removes the automatic wave and board banking.

The rail adds 20% speed, using the stronger of that multiplier and Cosmic
Disco's existing 35% boost. They never multiply. Landing takes 0.8 protected
seconds and eases the speed boost away. Royal Skyride and rail protection can
overlap; the greater lift controls the coin. A ride ending does not snap the
coin down while another ride remains active. Normal lethal collisions resume
after the last protection, with the existing one-shot exit clearance.

Lunar jumps use initial velocity -580 and gravity 1,250 instead of -690 and
1,750. The launch mode stays attached to the jump until landing, so crossing
a region boundary never changes gravity midair. The next jump uses the new
region's settings. Flying powers cancel the old jump and land normally.
Hazards are at least 780 units apart in the lunar region, including an 800-unit
margin on both sides; normal regions retain 550-unit spacing. This compensates
for the longer airborne time. The existing 650-before/210-after pickup
clearance remains in force. Market terrain stays fixed for each run.

Emerald Eclipse refreshes the existing Rush timer, pulses the existing green
eyes, and raises attraction range to 360 units for seven seconds. Collection
uses the normal shard/combo path. It grants no shield, speed or direct reward.
Its banner remains visible during overlaps, and fictional event pricing remains
exclusive to Cosmic Disco. Attraction already in progress can finish after the
timer ends, as with ordinary Rush.

## Cathedral Resonance finale

Three fixed airborne bells now give the cathedral a traversal challenge. Each
bell sits 135 units above its local terrain and uses a circular pickup radius
of the coin's radius plus 26. Rolling underneath cannot ring it. Players can
jump during Cosmic Disco, and flying powers can ring a bell through contact;
the emerald magnet does not pull bells in. Each bell rings only once. Passing
80 units beyond an uncollected bell marks it missed, so it cannot be claimed
retroactively. Missing a bell never blocks route completion.

Bell approaches reserve the same 650-unit takeoff and 210-unit exit clearance
as the other authored pickups, independent of generation cadence. Ringing all
three starts one 3.6-second Eclipse Slingshot, followed by the existing
0.8-second protected landing. No bell, completion or Slingshot directly awards
points or currency. The flight's benefit can still affect normal run rewards.

Slingshot is a second variant of the existing ride engine, with an arcing
125–195-unit hover, a smaller automatic wave and a 90-unit tap Surge. It uses
jade/gold orbital rings instead of Comet's board and rail. Its high arc keeps
the coin at least 145 pixels below the top of the authored camera. Speed uses
the existing single 20% ride multiplier, with the stronger Cosmic boost taking
precedence. Surge never extends duration. Pause freezes the ride and bell
feedback; both replay choices reset every collected/missed bell and unlock.

The chapter strip shows bell progress, local bell rings and ascending tones
mark hits, and results include bells rung and Slingshot activation. Reduced
motion stops bell sway, holds chime rings still and removes the small ride
wave; the protected traversal and landing remain playable.

`cathedral-bell-v1.webp` is a new transparent built-in imagegen asset in
`assets/pepecoin-run/`, with its exact prompt in
`cathedral-bell-prompts-v1.json`. Conversion preserves alpha; no background
rectangle is drawn behind the bell.

## World art and feedback

New built-in imagegen assets, copied into `assets/pepecoin-run/`:

- `obsidian-starrail-v1.webp`: orbital rails and jade space stations.
- `lunar-lotus-sea-v1.webp`: lunar mirror-water terraces and giant lotus flowers.
- `eclipse-cathedral-v1.webp`: an emerald gothic cathedral against a solar eclipse.
- `comet-board-v1.webp`: transparent obsidian/gold hoverboard with cyan engines.

Exact generation prompts are in `act-two-prompts-v1.json`. Backgrounds are
resized WebPs; board alpha is preserved. The original coin remains unchanged.
Backdrops crossfade behind the gameplay. Comet streaks, lunar bubbles and
eclipse orbitals are decorative and do not add collision hazards. Reduced
motion holds those layers still. The cathedral remains behind the endless
road after Act Two, rather than abruptly returning to the opening valley.

The HUD changes its chapter label, progress bar and accessible progress name
for Act Two. Ride status shows Vault, the timer and protected landing. Results
report the reached Act Two region, percentage or completion, and Comet rides.
No new shared reward formula or persistent save key is introduced.

## Validation and limits

Controller tests exercise event one-shot behavior, pause/reset, protection,
vaulting, boarding mid-jump, speed overlap, frame-independent expiry, lunar
spacing, jump-mode retention across a boundary and Eclipse attraction.
Browser cases cover rail, lunar and Eclipse sequences at 390px and 1,440px.

Separate native-input playthroughs started at a pre-Act-Two checkpoint at
world 16,600 with an earned-run speed. Only that checkpoint's initial landing
buffer was cleared; subsequent generated hazards and collectibles remained.
Both sizes reached world 33,650+, stayed running, triggered Comet Express once,
captured all three worlds and reported no browser errors. These are automated
browser runs, not evidence of physical-phone comfort or long-term balance.

Durations, jump settings and magnet range are initial playtest tuning. Flight
protection, attraction and wider spacing can improve survival/catches even
though currency formulas are unchanged. A longer multi-seed reward/difficulty
pass should precede adding a third act or more progression rewards.

Final checks: `npm test` passed all 548 core tests. The focused runner/action/
canvas browser batch passed all 50 cases. After the boarding-height correction,
the full core suite passed again and all six Act Two browser cases were
rechecked, including midair boarding and loading the generated hoverboard.
`git diff --check` found no whitespace errors. These Act Two changes remain
local and uncommitted.

Finale validation: all 553 core tests and 52 focused browser checks passed.
The bell-specific browser cases use native jump input at the authored bell
positions and cover Surge, pause, reduced motion, protected landing, results
and replay. A separate continuous checkpoint-to-endless run on the intact
generated road rang all three bells, activated Slingshot exactly once and
continued past its landing at both 390px and 1,440px, with no browser errors.
The checkpoint setup and balance limitations described above still apply.
