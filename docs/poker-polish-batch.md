# Pepe Poker: bet clarity and universal emotes

This pass finishes the Poker agent's bet-entry work and makes the existing
four-emote pack directly accessible from the table. Betting rules, chip stakes,
room authentication and reward formulas remain unchanged.

## Bet entry

The commitment preview stays visible when mobile Bet sizing is collapsed. It
distinguishes the target street total, additional chips committed and remaining
stack. All-in buttons include the total; the preview explicitly shows what is
added after chips already committed, including blinds.

Empty, fractional and out-of-range amounts disable only the invalid Bet/Raise
action; valid Call/Fold controls remain usable. A decision-scoped draft key
preserves typed amounts through focused and blurred polling. A new decision
initializes the correct minimum instead of carrying the previous draft into
the next street. The pure `raiseCommitment` helper is presentation validation;
the existing server remains authoritative for legal betting.

## Emotes for everyone at the table

All four illustrations already matched the supplied art pack:

- Rocket Meltdown: `reactions/rocket.webp`.
- Berserk Pepe: `reactions/berserk.webp`.
- Royal Smug: `reactions/smug.webp`.
- Busted Pepe: `reactions/tears.webp`.

The existing API had no rank, wallet or unlock gate for reactions. The
discoverability problem was that the picker lived inside Table info. A main
header Emotes button now opens a dedicated four-choice dialog for every seated
player, including practice players and folded players. All art is reused.
Seating/token validation remains necessary to identify the sender; spectators
can see public reactions but cannot impersonate a seat.

Successful sending closes the picker and returns focus to Emotes so the player
can see the reaction at their seat. Other clients receive it through the
existing room polling. The 1.8-second anti-spam cooldown and 4.2-second seat
display remain unchanged. Reopening during cooldown shows disabled choices and
a clear message. A failed send leaves the picker usable for retry; successful
retry clears that reaction's stale error without discarding unrelated notices.
The picker fits narrow phones and short landscape screens. It does not pause
the online table or change the current hand's betting revision.

## Verification

Pure commitment tests cover blinds, short all-ins and invalid inputs. A room
test creates six fresh seats and confirms every one can send all four emotes
without losing chips, and that another seat receives each reaction. Existing
server tests retain unauthorized-seat, unknown-ID, cooldown, expiry, betting
revision and private-card checks.

Browser checks cover two-player bet-entry polling at 320px, 390px and 1,440px;
all four emotes sent by both a fresh host and guest; folded-player reactions;
practice picker geometry at 320×568 and 844×390; error recovery, Escape and
focus return. These are Chromium checks, not physical-device comfort proof.
Room state is still process-local and does not survive a server restart.
