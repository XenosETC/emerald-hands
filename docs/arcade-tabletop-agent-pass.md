# Tabletop agent pass: Poker, Chess and Checkers

This pass completes the three agents' scoped work and the requested universal
Poker emote access. The earlier Run, Relic Rumble, Galactic Heroes and Shard
Rush edits were preserved; hashes of the protected earlier source files match
the pre-agent snapshot. No commits or pushes were performed in this pass.

- Poker: clear street-total/additional-chip/remaining-stack preview, valid draft
  recovery and preservation through polling; all four existing illustrated
  emotes available from the main table to every seated user. See
  `poker-polish-batch.md` and `pepe-poker/REACTIONS.md` (from the repository root).
- Chess: restore standard-start PGNs after full validation; preserve the current
  game on invalid/cancelled/stale reads; pause bot replies while options is open.
  See `chess-polish-batch.md` for the 128KiB/2,048-ply limits and move/position
  semantics. Custom starting positions are explicitly rejected.
- Checkers: Capture routes shortcut during forced jumps; chosen previews close
  options and focus the first landing without moving or saving. Escape clears
  preview markers. See `checkers-polish-batch.md`.

## Integrated verification

All 559 core tests passed. The combined tabletop batch passed 32 browser cases:
new features, two-client Poker interaction,
invite/reconnect/card privacy, standard PGN roundtrips, rejected imports, bot
and takeback settings, multi-tab save protection, mandatory captures and
responsive tabletop screens. Server emote permissions for all seats are part
of the core suite; browser cases verify delivery between fresh host and guest.

A separate final shared arcade batch passed all 12 checks for hub behavior,
cabinet controls, scrolling/reduced-motion marquees and reset cancellation.
Whitespace and syntax checks passed. The four-emote phone picker was visually
reviewed at 390×844; geometry/error recovery cases also cover 320×568 and
844×390. This is browser/runtime evidence, not physical-device or balance proof.

The local development server with the Poker API is running on
`http://127.0.0.1:4194/`. Poker rooms remain process-local, so restarting the
server loses existing rooms. Changes remain local and uncommitted.
