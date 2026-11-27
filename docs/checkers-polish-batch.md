# Checkers capture preview flow

Capture routes previously lived only in Match options. Choosing a preview left
that dialog open over the numbered board markers, so the preview's destination
could not be used without closing the dialog separately.

The board controls now show Capture routes with a count whenever a jump is
mandatory, including during a continuing chain. The shortcut opens the existing
route list at the top of Match options. Choosing a route selects its starting
piece, displays the numbered landings, closes the dialog and focuses the first
legal landing. It does not play a move or update the saved match. Enter, Space
or a click still confirms the actual jump. Escape clears the preview markers.

The route shortcut stays hidden on ordinary moves, during bot replies and in
review. The options heading remains sticky, keeping Done reachable while its
contents scroll. Normal options closure still restores its opener. Forced
jumps, same-piece continuation, crowning, repetition draws, save format and
the existing artwork are unchanged.

Validation:

- Reproduced the original modal-obscured preview with a legally replayed
  multi-jump match.
- Four new browser regressions passed, including 320×568, 844×390 and
  1440×900. They check unchanged save bytes during preview/Escape, focused
  first landing, native multi-jump completion and bounded controls/board.
- Five existing Checkers save, tabletop and screen checks passed.
- All 15 Checkers engine/save tests passed. `git diff --check` passed.

Browser fixtures restore legal moves through the existing save decoder, rather
than injecting arbitrary board state. These tests cover Chromium presentation
and interaction; physical-phone comfort and bot balance remain separate.
Changes remain uncommitted.

Resume verification: all 15 engine/save tests and nine browser checks passed
again: four capture-preview cases, stale-tab save protection, three existing
responsive-screen cases and the existing forced-capture/review case. The 320px
preview screenshot was visually reviewed. No additional implementation changes
were needed after resuming; only this verification note was added.
