# Pepe Sunwarden

Playable hero defender with rapid green palm lasers and an emerald cape. Generated base, reinforced tier-3, crowned tier-5 and Sky Guardian sprites preserve the same face, stance, cape, camera and jade/gold materials. Original artwork and prompts are in assets/pepe-tower-defense/sunwarden-v1.json.

Provisional balance: 400 defense shards, one active Sunwarden, 18 damage, 220 range and 0.15s base attack interval (the shared level speed modifier applies). Uses normal pads, 70% sell refunds, mastery and 5/2/0 crosspaths. Key 7 selects him. Selling permits a new hero but does not reset Nova cooldown.

- Solar Might: shared power damage/range scaling; tiers 3/4/5 add 28/42/56 splash.
- Emerald Barrage: shared special damage/range scaling plus 14% shorter laser interval per tier.
- Sky Guardian: shared utility range/damage/speed scaling; each tier reduces the next Nova recharge by two seconds, from 20 to 10.

Each path has five named upgrades and exact next-stat previews. Solar/Barrage tiers 3-4 use the reinforced form and tier 5 the crowned form; Sky Guardian tiers 3-5 use the constellation cape. Secondary upgrades never replace the primary visual. The hero renders slightly larger than ordinary defenders.

Emerald Nova: tap the command-bay button or press H during a wave. Deals five times the hero's current damage to each living enemy within his current range, using normal armor/acid rules. No enemies in reach means no cooldown is spent. Casts are blocked during pause, relocation, build breaks, results or recharge. Cooldown uses simulation time, persists across move/sell/rebuy and resets with a new defense. Nova kills are collected immediately once so dead foes cannot breach or pay twice.

Automated earned-shard mixed-defense controller recruited the hero, cast 20 Novas and completed wave 20 with 63 relic health at 30 Hz. This establishes viability for that controller, not human balance approval. Desktop browser checks in a labeled seeded fixture verified Nova activation/recharge, left-facing base attacks and right-facing evolved attacks. An earlier approval-service usage block was resolved before those checks. A human campaign balance pass and mobile visual review remain open.

Facing: Sunwarden mirrors left/right toward his target while the plinth stays upright. Laser and Nova rays originate from per-form palm anchors with the same scale, facing and recoil as the sprite. These are two facing directions; vertical aim uses the laser direction.
