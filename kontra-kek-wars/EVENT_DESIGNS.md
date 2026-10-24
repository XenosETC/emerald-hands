# Realm events — Reactor Surge implemented; others proposed

The user approved **Reactor Surge**, its safe bypass and a weapon-upgrade choice carrying through the campaign. That authored optional event is implemented in Field Test 006. Flood Pulse, Gravity Bloom and Echo Grove remain proposals and have not been implemented.

Realm-clear rewards and ordinary boss attacks remain separate from realm events. Reactor Surge uses a fixed route offer, three timed conduits and a one-time reward. There is no random event scheduler or shared event economy.

| Realm / proposal | Type | Warning and world change | Counterplay | Proposed reward / consequence |
| --- | --- | --- | --- | --- |
| Occupied Swamp / Flood Pulse | Mandatory | A waterline and several seconds of rising-water cues precede temporary flooding of the low route. | Reach clearly marked high ground; every entrance has an accessible safe platform. No unavoidable damage or erased checkpoint. | Surviving advances the route; no power reward needed. |
| Stormforge / Reactor Surge | Implemented / optional | Inspect the gate near x=2500 with E or its button. The preview pauses combat and explains three charging conduits. | Bypass without activating hazards; accept and cross during safe windows or dash; withdraw anytime with damage retained. | Choose Piercing Rails (+1 enemy penetration) or Overclock Chamber (20% faster fire). The modifier applies to all weapons and carries through the remaining campaign. |
| Jade Rift / Gravity Bloom | Mandatory | Plants lean upward and a clear countdown precedes a short low-gravity traversal stretch. | Use longer jumps; hazard placements must be safe for both normal and changed gravity. No gravity change during an existing jump or boss attack. | Open the next traversal segment, with no compulsory combat penalty. |
| Jade Rift / Echo Grove | Optional | A crystal arch shows an alternate path and its risk before the player commits. | Take a wisp gauntlet for a reward, or bypass it. Exit and checkpoint behavior must be stated clearly. | Proposed: choose a weapon modifier, with no permanent stat stacking. |

Reactor Surge restores the ordinary route after withdrawal or success. Its reward and completion flag are committed to retry kits without committing post-checkpoint score or ordinary pickup progress. A claimed event cannot be replayed for another modifier. An unclaimed failed attempt can be tried again after checkpoint retry. Fresh deployment, RESTART or refresh resets the campaign reward.

## Decisions to agree before implementation

1. Which proposed event should follow Reactor Surge, if any?
2. Should mandatory events occur at fixed authored locations every run? Recommendation: yes for the first prototype, so warnings and counterplay can be learned and tested.

Each future event still needs explicit design agreement before implementation. Reactor Surge's tests cover its safe bypass, offer/pause/reward freeze, conduit completion and failure, withdrawal, both modifiers, reward farming guards, checkpoint rollback and campaign carryover.
