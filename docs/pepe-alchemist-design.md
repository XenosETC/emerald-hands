# Pepe Alchemist - new defender proposal

Status: reviewable design and generated sprite only; not a recruitable or implemented combat tower.

Role: temporary anti-armor support. It fills the roster gap between direct damage, slowing, artillery splash and multi-target magic. Visual language: recognizable Pepe face, brass goggles, leather apron, amber/green acid vessels, brass condenser, dark jade-and-gold laboratory turret. No hood/staff silhouette, ground aura or yellow ring.

Provisional base values: 135 defense shards, 15 damage, 150 range, 0.95 seconds per attack. Proposed debuff: lower ordinary armor by 10 percentage points for 2 seconds, with a 5-point boss limit; refresh duration without adding stacks; floor effective armor at zero. There is no income generation or permanent enemy-stat change. These are design assumptions, not shipped business logic or verified balance.

Proposed paths: Volatile Brews (impact/splash), Corrosive Catalyst (armor weakening/duration), Surveyor's Lab (range/uptime). Each follows the existing 5/2/0 crosspath constraint and the normal move/sell rules. The illustrated design sheet includes five tier names per path.

Files: assets/pepe-tower-defense/alchemist-concept-v1.png (generated original); alchemist-concept-v1.webp (optimized review sprite); docs/tower-defense-visual-review.html (visual comparison and design sheet). Generation prompt and framing refinement are recorded in assets/pepe-tower-defense/visual-upgrades-v1.json.

Next implementation gate: a small playable support slice with a visible acid debuff, consistent direct/splash/chain armor handling, non-stacking refresh, boss caps, pause/reset behavior and normal build/upgrade/refund guards. Test brute/warboss interactions and a naturally earned mixed-defense campaign before tuning or exposing it in the live shop.
