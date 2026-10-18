# Wingman Beacon - 2026-10-17

Two original AI-generated transparent PNG assets, created for Space Unchained with the built-in image generation tool:
- `pepe-wingman-v1.png`: 1774 x 887, emerald/gold side-on fighter, Pepe pilot, cyan cockpit and exhaust. Faces right to match gameplay.
- `wingman-beacon-v1.png`: 1254 x 1254, emerald crystal signal beacon with gold wings and cyan energy ring.
Both images retain alpha (transparent and opaque pixels verified). Originals are preserved; these files are the first project versions.

The flight-only upgrade costs 20 flight shards for the first helper, 30 for the second, capped at two. Helpers follow behind the player and each fire one damage-1 cyan bolt every 0.65 seconds. They cannot take hits or shield the player. Purchases and helpers reset with each flight. Shared Arcade Shards are never debited. Prices and damage are provisional balance, not a permanent account unlock.

Validation: root npm test (265 passing, including five real-game VM tests for purchases, input guards, collision rewards, cadence, pause, reset and status); desktop and 390px browser checks. Purchases were exercised through a button and Q in a labeled fixture with 50 seeded flight shards. Clean game URL verified at zero shards with recruitment disabled. These fixture checks do not establish naturally earned purchase timing or long-session balance. Longer human playtesting is the next balance gate.
