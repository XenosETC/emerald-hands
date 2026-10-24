# Pepe Alchemist - playable support defender

Status: implemented in the Tower Defense shop, battlefield and inspector. Original concept and three generated upgrade forms retain the goggles, apron, acid vessels and jade/gold lab silhouette. Keyboard shortcut: 6.

Base: 135 defense shards, 15 damage, 150 range, 0.95s base interval (existing level speed modifier applies). A hit lowers ordinary armor by 10 percentage points for 2 seconds; bosses by 5. The strongest active coating refreshes without stacking, expires in simulation time and never lowers effective armor below zero. Native enemy armor is unchanged. Direct, splash and chain hits all use effective armor.

Paths share the existing 75/120/175/230/285 tier costs and 5/2/0 restrictions. Volatile Brews uses normal power damage/range scaling and adds 24/36/48 splash at tiers 3/4/5. Corrosive Catalyst uses normal special damage/range scaling and adds 2 armor points (1 boss point) and 0.4s duration per tier: max 20 points ordinary, 10 boss, 4s. Surveyor's Lab uses the normal utility range/speed scaling. Existing tier-3 and tier-5 general milestone bonuses apply.

All three tracks have five named tiers and exact stat/debuff previews. Base art is used through primary tier 2; tier-3 art for Volatile/Catalyst 3-4, evolved art for their tier 5, and Surveyor art for utility 3-5. Move/sell, refunds, pause, mastery and replay use shared rules. No income generation or permanent enemy-stat changes.

These values implement the earlier proposal as provisional game balance. Automated mechanics checks and browser interaction are not human campaign balance approval. Next: a human mixed-defense 20-wave playthrough to tune support value. Prompt manifest: assets/pepe-tower-defense/relic-alchemist-v1.json.
