# Private eight-seat Poker tables

Pepe Poker supports up to eight seated players per table. A ninth join is rejected by the server. Existing betting, blinds, settlement, reconnect tokens, free emotes, and play-chip economy apply to every seat.

## Opening several tables

Use **Tables** in the game header to create another private table, open a known table, or paste an invite. Each link opens a separate browser tab so an active hand stays open. Each room has its own seat token in session storage and reconnect storage; opening one room never replaces another room's identity.

The table manager remembers up to twelve table links on this browser. It is not a public lobby: private room IDs are never published or enumerated by the server. The list updates between tabs. Browser storage failures do not prevent playing or watching, but remembered links may not persist.

## Spectating

The manager's **Watch table** link adds `watch=1` to a room URL. Watch mode deliberately ignores both session and local saved seat tokens, including the host's token in the same browser. It sends no authorization header and shows public cards, bets, stacks, board, and table activity. It cannot act, chat, deal, or send emotes. **Take a seat / restore my seat** exits watch mode, restoring an existing room-specific seat when available or presenting the join form.

Hole cards remain hidden until the normal public showdown. Folded cards are not revealed by spectating or historical recaps. Practice tables remain private to their controlling player and are not added to the table manager.

## Validation

`node --test pepe-poker/holdem.test.mjs pepe-poker/rooms.test.mjs`

`npx playwright test scripts/browser/poker-tables.spec.cjs scripts/browser/poker-emotes.spec.cjs scripts/browser/poker-polish-batch.spec.cjs`

The API tests play an eight-player hand through all streets and settlement, verify chip conservation, reject a ninth seat, verify unauthenticated spectator privacy, and exercise separate room tokens/state. Browser tests cover same-browser watch privacy, restoring a saved seat, multiple tabs and independent reconnects, and full-table layouts at 320×568, 390×844, 844×390, and 1440×900.

## Remaining boundaries

Rooms still live in this server process and expire after twelve hours. Server restarts lose rooms; this is not persistent multiplayer hosting. Remembered links may therefore outlive a room. There is no public matchmaking, shared account identity, spectator messaging, or cross-device seat recovery. Public discovery should be a separate explicit opt-in feature, with durable rooms and abuse controls, before opening tables broadly.
