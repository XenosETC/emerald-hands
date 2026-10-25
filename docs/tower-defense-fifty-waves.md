# Fifty-wave campaign

Implemented: 50 waves, two active Sunwardens with independent Novas, two new ordinary enemy roles and two new major bosses with authored escorts. The shared Arcade Shards reward cap is unchanged.

## Difficulty and encounters

Waves 1-20 keep their established rosters and health curve. After 20, base health growth uses wave 20 values; the October 24 balance pass adds 0.06 per extra wave plus 0.0015 times extra-wave squared. Density rises from 61 to 88 enemies; speed growth remains capped at wave 15 and spawn interval at 0.30s. This respects the existing tier-five upgrade ceiling.

Shieldbearers start on 21: 40% armor, three relic breach damage, slow movement. Alchemist acid reduces armor normally. Emerald specters start on 26: fast, 60% reduction in slow strength, one breach damage. They still take damage from all current defenders and remain partially slowable.

Minor bosses arrive every fifth wave. Major encounters: Goblin Warboss on 20, Jade Tyrant on 35, Relic Sovereign on 50. Waves 30 and 40 add a second minor boss. Tyrant has 25% armor, 25% slow resistance and six breach damage; its explicit entourage is two shieldbearers and two specters. Sovereign has 30% armor, 40% slow resistance and ten breach damage; its entourage is two shieldbearers, one brute and three specters. The wave also contains its regular authored enemies. The wave preview lists the actual full roster. Killing a boss never ends a wave until every remaining foe and spawn is cleared.

## Two Sunwardens

Each costs 400 run shards; maximum two active. Each keeps its own upgrade build, range, facing and Nova recharge. The command bay shows a separate button with pad and stats for each hero. H casts the selected Sunwarden's Nova; with another defender selected, it chooses a ready hero. Move preserves identity; sell/rebuy preserves that hero slot's cooldown to prevent reset exploits. New defenses reset both slots.

## Boundaries

Ballista and Thornkeeper are now playable as detailed in tower-defense-next-defenders.md. Nine playable defender types are available. Balance is provisional; automated earned-shard runs establish a viable strategy, not human difficulty approval.

## Release verification

Clean staged-copy npm test passed the 364-test main suite and 17-test launch suite (381 total), plus the 18-game smoke check. Full earned-shard controllers completed 50 waves at 30/60 Hz with 87/88 relic health and 128/130 Nova casts. Those are deterministic controller results, not human balance approval. Browser checks in a clearly labeled seeded fixture verified Tyrant/Sovereign portraits with lackeys, both independent Nova buttons, cooldowns and 35/50 and 50/50 wave labels; no console errors were logged. All 36 gallery images loaded. Mobile visual review remains open. Source prompts and six PNG/WebP asset pairs are retained in assets/pepe-tower-defense/fifty-waves-v1.json and its framing receipt.
