# Pepe Chess: PGN recovery and options pause

Match options now includes Import PGN beside the existing export action. Players
can restore the moves and resulting board from an exported standard-start game,
review its history, reload it from the existing local save, and continue using
the current opponent and takeback settings.

## Import contract

- Files are limited to 128 KiB and 2,048 half-moves.
- Parsing uses a temporary Chess instance with strict PGN validation. Every move
  is preflighted against the arcade's current game-ending rules before the live
  board is replaced.
- Nonstandard FEN starts are rejected because the existing save replays moves
  from the normal starting position.
- Invalid, empty, oversized and cancelled imports preserve the current match
  and save. A valid replacement asks for confirmation when the current match
  already contains moves.
- An asynchronous file read snapshots the board, move history, mode, takeback
  setting and review position. If those change while reading, import is rejected.
- User-provided PGN text is not rendered as HTML. Feedback uses textContent.

Import restores legal moves and position. Event/player/result tags do not add
new resignation or result-settlement rules, and imported header metadata is not
archived as a separate record. A checkmate PGN restores a terminal checkmate
board, while a nonterminal position can continue under existing rules. Chess
currently has no arcade reward/settlement calls; importing or reimporting a
finished PGN cannot grant new currency.

## Bot scheduling

Opening Match options cancels a pending bot reply. The bot does not move while
the dialog is open, including while a file picker/import is in progress. Closing
options resumes a legal pending bot turn. Review mode continues to suppress bot
play, and no-takebacks remains unchanged by import.

## Verification

The resumed implementation passed all eight new PGN browser cases and five
existing Chess regressions (13 total) on port 4231 with isolated output in
`test-results/chess-polish-resume`.

Coverage includes desktop/phone export-import roundtrip, review and reload;
malformed/custom-start/empty/oversized/cancelled imports; delayed-read staleness;
completed-game reimport and reload; bot/no-takeback preservation; existing
multi-tab save protection; keyboard selection recovery; and three viewport-fit
checks. These are Chromium checks, not physical-device or campaign-balance proof.

The prior agent's two bot cases were test-clock sequencing failures. The current
tests await the native dialog close event before advancing the fake clock; both
pass without weakening their assertions. `git diff --check` reports no whitespace
errors in the owned files. Changes remain uncommitted.
