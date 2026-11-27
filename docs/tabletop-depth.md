# Tactical previews

Chess adds an optional Show threats toggle. It rings the side-to-move's pieces currently attacked by the opponent, including defended pieces. The text explicitly describes the current position, not a guarantee that a destination is safe. It follows review and board flipping and does not modify the game or saved match. The vendored rules engine supplies attack detection; normal legal moves and check rules remain authoritative.

Checkers capture routes now list winning turns, crowns, kings taken and whether the landing can be captured on the opponent's next turn. The forecast follows every step of the opponent's possible mandatory jump chains, so a later recapture is not missed. It does not rate a route as globally best or change the live board. Existing hints use the same complete-reply-chain detection.

Verification includes pure forecast fixtures for a second-jump recapture and a crowning win, preserved immutable input, existing forced-jump gameplay tests, plus Chess phone/landscape/desktop interactions, review, move legality and save preservation.
