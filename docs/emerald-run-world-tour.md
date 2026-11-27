# Emerald Run: the Grand World Tour

Twelve new generated environments follow Volcanic Forge, beginning at world coordinate 50,400. Each lasts 8,400 units, or 840m in the game's distance display. The final Frog God world ends at 151,200; Beyond All Worlds then continues the endless road with that final sky. This extends the existing run, rather than introducing a separate mode or save.

| Order | World | Starts at | Visual identity |
| --- | --- | --- | --- |
| 1 | Jade Canopy | 50,400 | Primeval jungle, frog temples and orchids |
| 2 | Monsoon Kingdom | 58,800 | Waterfalls, flooded shrines and rainforest mist |
| 3 | Sunscar Dunes | 67,200 | Amber dunes, frog sphinxes and golden ruins |
| 4 | Glass Desert | 75,600 | Obsidian glass dunes, jade crystals and aurora |
| 5 | Starborne Expanse | 84,000 | Ringed emerald planet and orbital ruins |
| 6 | Solar Gardens | 92,400 | A solar system above celestial gardens |
| 7 | Nebula Ocean | 100,800 | Star-cloud seas and sanctuary islands |
| 8 | Singularity Throne | 109,200 | Black-hole halo and suspended jade temples |
| 9 | Time & Space | 117,600 | Astronomical clockwork and folded time |
| 10 | Dimension Weave | 126,000 | Impossible architecture and layered realities |
| 11 | Many Worlds | 134,400 | Branching universe tree and alternate kingdoms |
| 12 | The Cosmic Frog God | 142,800 | A majestic guardian cradling a galaxy |

Many Worlds and the dimensional scenes are fantasy illustrations inspired by the requested ideas, not scientific simulations. These are scenery regions: they retain the established terrain generation, collisions, pickup cadence, power timers, speed cap, scoring and independent best save. The existing low-gravity lunar region remains where it was; the new planets do not silently add gravity rules.

## Art and playback

Built-in imagegen produced twelve distinct 16:9 landscapes, each with a dark quiet lower third for readable road and hazards. Optimized backgrounds and 320px previews live in `assets/pepecoin-run/worlds-v1/`; exact prompts are in `prompts.json` there. The entire world/preview pack is approximately 2.9 MB. Original generated images remain in the Codex image output directory.

`pepecoin-route.js` is the world sequence registry. `pepecoin-world-tour.js` loads the current image and the next reveal, crossfades the previous image, and caps its retained image cache at four entries. Initial runs do not request all twelve full backgrounds. The first is prefetched near the frontier exit. A failed or late image leaves the last loaded sky visible and does not stop gameplay. Retry clears the loader and returns to Jade Valley. Volcanic embers fade away as the first new world covers the forge. Cosmetic transitions do not alter collision timing or rewards.

Game info contains a collapsed, keyboard-accessible preview gallery of all twelve worlds. It uses small lazy-loaded thumbnails, stays inside the existing bounded dialog and does not skip or unlock gameplay. The route HUD and results report Grand Tour progress independently of the completed frontier.

## Verification

`npm test` includes route boundaries, all twelve equal spans, loader crossfades, bounded cache, missing-art fallback, pause/reset and existing Runner physics/powers/retry regressions. `scripts/browser/emerald-run-world-tour.spec.cjs` renders all twelve real assets at phone and desktop sizes, checks pause, jump, final completion and retry, opens the preview gallery, and blocks an image to exercise fallback.

Browser region checks use isolated distance fixtures to inspect each environment through the native runtime. They do not establish the difficulty or satisfaction of surviving the entire extended run. New traversal mechanics, enemies and music for these biomes would be a separate gameplay pass.

Final checks: root `npm test` passed all 573 tests and the 21-game smoke check. All 60 focused Runner tests passed. The five new world-tour browser checks passed, alongside the ten existing Act Two/frontier checks. Gallery tests wait for the native dialog close event to finish restoring pause state. Evidence: `test-results/world-tour-final-core.log`, `test-results/world-tour-browser.log` and `test-results/world-tour-browser-final.log`. Scoped whitespace checks passed.
