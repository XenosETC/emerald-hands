import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Readable } from "node:stream";
import test from "node:test";
import { AVATARS, DEFAULT_AVATAR_ID } from "./avatar-catalog.mjs";
import { evaluate, handCategory, labels, STARTING_STACK } from "./holdem.mjs";
import { formatHandExport } from "./hand-export.mjs";
import { pokerRequest } from "./rooms.mjs";
import { DEFAULT_TABLE, TABLE_PRESETS, TIME_BANK_SECONDS, TURN_SECONDS } from "./table-settings.mjs";
import { REACTIONS, REACTION_DURATION } from "./reaction-catalog.mjs";

const base = "/api/pepe-poker";

test("the avatar gallery has unique IDs and ships each portrait", () => {
  const ids = new Set(AVATARS.map(avatar => avatar.id));
  assert.equal(ids.size, AVATARS.length);
  assert.ok(ids.has(DEFAULT_AVATAR_ID));
  for (const { src } of AVATARS) {
    const bytes = readFileSync(new URL(src, import.meta.url));
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", src);
  }
});

async function request(path = "", { method = "GET", payload, token } = {}) {
  const req = Readable.from(payload === undefined ? [] : [JSON.stringify(payload)]);
  req.method = method;
  req.headers = token ? { authorization: "Bearer " + token } : {};
  let status, headers, body;
  await pokerRequest(req, {
    writeHead(code, values) {
      status = code;
      headers = values;
    },
    end(data) { body = JSON.parse(data); }
  }, base + path);
  assert.equal(headers["content-type"], "application/json");
  assert.equal(headers["cache-control"], "no-store");
  return { status, ...body };
}

function post(path, payload, token) {
  return request(path, { method: "POST", payload, token });
}

async function headsUp() {
  const host = await post("", { name: "Pepe" });
  assert.equal(host.status, 201);
  const path = "/" + host.state.id;
  const guest = await post(path + "/join", { name: "Kek" });
  assert.equal(guest.status, 200);
  return { host, guest, path, tokens: [host.token, guest.token] };
}

test("table presets set starting stacks, blinds and opening bets", async () => {
  assert.equal((await post("", { name: "Host", preset: "unknown" })).status, 400);
  for (const settings of TABLE_PRESETS) {
    const host = await post("", { name: "Host", preset: settings.id });
    assert.equal(host.status, 201);
    assert.deepEqual(host.state.settings, settings);
    const path = "/" + host.state.id;
    const guest = await post(path + "/join", { name: "Guest", preset: DEFAULT_TABLE.id });
    assert.deepEqual(guest.state.settings, settings);
    assert.ok(guest.state.players.every(player => player.stack === settings.startingStack));
    const tokens = [host.token, guest.token];
    let { state } = await post(path + "/deal", {}, host.token);
    assert.equal(state.players[state.smallBlind].bet, settings.smallBlind);
    assert.equal(state.players[state.bigBlind].bet, settings.bigBlind);
    assert.equal(state.options.min, settings.bigBlind * 2);
    while (state.street === "Preflop") {
      ({ state } = await post(path + "/act", { action: "call", revision: state.revision }, tokens[state.turn]));
    }
    assert.equal(state.street, "Flop");
    assert.equal(state.options.min, settings.bigBlind);
  }
});

function hidden(cards) {
  assert.deepEqual(cards, [null, null]);
}

test("the active player can extend one turn per hand", async t => {
  const { host, path, tokens } = await headsUp();
  const dealt = (await post(path + "/deal", {}, host.token)).state;
  let now = dealt.deadline - 1;
  t.mock.method(Date, "now", () => now);
  const actor = tokens[dealt.turn];
  const other = tokens[1 - dealt.turn];
  assert.equal((await post(path + "/time-bank", { revision: dealt.revision }, other)).status, 400);
  const { state } = await post(path + "/time-bank", { revision: dealt.revision }, actor);
  assert.equal(state.deadline, dealt.deadline + TIME_BANK_SECONDS * 1000);
  assert.equal(state.turnSeconds, TURN_SECONDS + TIME_BANK_SECONDS);
  assert.equal(state.canExtend, false);
  assert.equal((await post(path + "/time-bank", { revision: state.revision }, actor)).status, 400);
  now = dealt.deadline + 1;
  assert.equal((await request(path, { token: actor })).state.turn, dealt.turn);
  assert.equal((await post(path + "/act", { action: "fold", revision: state.revision }, actor)).status, 200);
  const next = (await post(path + "/deal", {}, host.token)).state;
  assert.equal(next.turnSeconds, TURN_SECONDS);
  const called = await post(path + "/act", { action: "call", revision: next.revision }, tokens[next.turn]);
  assert.equal(called.state.turn, dealt.turn);
  assert.equal((await request(path, { token: actor })).state.canExtend, true);
});

test("sitting out takes effect on the next deal and returning keeps the same seat", async () => {
  const { host, guest, path, tokens } = await headsUp();
  const dealt = (await post(path + "/deal", {}, host.token)).state;
  assert.equal((await post(path + "/presence", { sittingOut: true })).status, 403);
  const paused = await post(path + "/presence", { sittingOut: true }, guest.token);
  assert.equal(paused.state.players[1].sittingOut, true);
  assert.equal(paused.state.revision, dealt.revision);
  visible(paused.state.players[1].cards);
  assert.equal((await post(path + "/act", { action: "fold", revision: dealt.revision }, tokens[dealt.turn])).status, 200);
  assert.equal((await post(path + "/deal", {}, host.token)).status, 400);
  const third = await post(path + "/join", { name: "Third" });
  const next = (await post(path + "/deal", {}, host.token)).state;
  assert.deepEqual(next.players[1].cards, []);
  assert.notEqual(next.smallBlind, 1);
  assert.notEqual(next.bigBlind, 1);
  const activeTokens = [...tokens, third.token];
  assert.equal((await post(path + "/act", { action: "fold", revision: next.revision }, activeTokens[next.turn])).status, 200);
  const resumed = await post(path + "/presence", { sittingOut: false }, guest.token);
  assert.equal(resumed.state.index, 1);
  assert.equal(resumed.state.players[1].sittingOut, false);
  assert.equal((await post(path + "/deal", {}, host.token)).status, 200);
  visible((await request(path, { token: guest.token })).state.players[1].cards);
});

test("practice is private and the bot plays a complete hand without exposing its cards early", async t => {
  let now = Date.now();
  t.mock.method(Date, "now", () => now);
  const host = await post("", { name: "Solo", practice: true, preset: "quick" });
  assert.equal(host.status, 201);
  assert.equal(host.state.practice, true);
  assert.deepEqual(host.state.players.map(player => player.bot), [false, true]);
  const path = "/" + host.state.id;
  assert.equal((await request(path)).status, 403);
  assert.equal((await post(path + "/join", { name: "Guest" })).status, 403);
  let { state } = await post(path + "/deal", {}, host.token);
  hidden(state.players[1].cards);
  let botTurns = 0;
  for (let step = 0; state.turn !== -1 && step < 35; step++) {
    if (state.turn === 0) {
      ({ state } = await post(path + "/act", { action: "call", revision: state.revision }, host.token));
    } else {
      assert.equal((await request(path, { token: host.token })).state.revision, state.revision);
      now += 900;
      const previous = state.revision;
      ({ state } = await request(path, { token: host.token }));
      assert.equal(state.revision, previous + 1);
      botTurns++;
    }
    if (state.turn !== -1) hidden(state.players[1].cards);
  }
  assert.ok(botTurns > 0);
  assert.equal(state.turn, -1);
  assert.equal(state.street, "Showdown");
  assert.equal(state.pot, 0);
  assert.equal(state.players.reduce((sum, player) => sum + player.stack, 0), 3000);
});

test("table chat uses seat names, stays private to the room, and leaves betting intact", async t => {
  const { host, guest, path } = await headsUp();
  const { state } = await post(path + "/deal", {}, host.token);
  let now = Date.now();
  t.mock.method(Date, "now", () => now);
  assert.equal((await post(path + "/chat", { text: "spectator" })).status, 403);
  for (const text of [" ", "a".repeat(241), "first\nsecond"]) {
    assert.equal((await post(path + "/chat", { text }, host.token)).status, 400);
  }
  const sent = await post(path + "/chat", { text: "  Nice hand 🐸  ", name: "spoofed" }, host.token);
  assert.equal(sent.status, 201);
  assert.deepEqual(sent.message, { id: 1, name: state.players[0].name, text: "Nice hand 🐸" });
  assert.equal((await post(path + "/chat", { text: "again" }, host.token)).status, 429);
  assert.deepEqual((await request(path, { token: guest.token })).state.chat, [sent.message]);
  assert.deepEqual((await request(path)).state.chat, []);
  const action = await post(path + "/act", { action: "call", revision: state.revision }, host.token);
  assert.equal(action.status, 200);
  const other = await post("", { name: "Other host" });
  assert.deepEqual(other.state.chat, []);
  assert.equal((await post("/" + other.state.id + "/chat", { text: "wrong room" }, host.token)).status, 403);
  for (let id = 2; id <= 52; id++) {
    now += 750;
    assert.equal((await post(path + "/chat", { text: "Message " + id }, host.token)).message.id, id);
  }
  const chat = (await request(path, { token: guest.token })).state.chat;
  assert.equal(chat.length, 50);
  assert.equal(chat[0].id, 3);
  assert.equal(chat.at(-1).id, 52);
});

test("table reactions are public, expire, and preserve the betting revision", async t => {
  const { host, path } = await headsUp();
  const { state } = await post(path + "/deal", {}, host.token);
  const sent = Date.now();
  const clock = t.mock.method(Date, "now", () => sent);
  assert.equal((await post(path + "/react", { reaction: "rocket" })).status, 403);
  assert.equal((await post(path + "/react", { reaction: "unknown" }, host.token)).status, 400);
  const reaction = await post(path + "/react", { reaction: "rocket" }, host.token);
  assert.equal(reaction.status, 200);
  assert.equal(reaction.state.revision, state.revision);
  assert.deepEqual(reaction.state.history, state.history);
  assert.equal((await post(path + "/react", { reaction: "berserk" }, host.token)).status, 429);
  const publicState = (await request(path)).state;
  assert.equal(publicState.players[0].reaction, "rocket");
  hidden(publicState.players[0].cards);
  clock.mock.mockImplementation(() => sent + REACTION_DURATION);
  assert.equal((await request(path)).state.players[0].reaction, null);
  assert.equal((await post(path + "/act", { action: "call", revision: state.revision }, host.token)).status, 200);
});

test("each Pepe reaction has a shipped illustration", () => {
  for (const { id } of REACTIONS) {
    const bytes = readFileSync(new URL(`./reactions/${id}.webp`, import.meta.url));
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", id);
  }
});

function visible(cards) {
  assert.equal(cards.length, 2);
  for (const card of cards) assert.match(card, /^[2-9TJQKA][shdc]$/);
}

test("chosen and default avatars follow players across public room state and reconnection", async () => {
  const [hostAvatar, guestAvatar] = AVATARS.filter(avatar => avatar.id !== DEFAULT_AVATAR_ID);
  const host = await post("", { name: "Pepe", avatarId: hostAvatar.id });
  assert.equal(host.status, 201);
  assert.equal(host.state.players[0].avatarId, hostAvatar.id);
  const path = "/" + host.state.id;

  const guest = await post(path + "/join", { name: "Kek", avatarId: guestAvatar.id });
  assert.equal(guest.status, 200);
  assert.equal(guest.state.players[1].avatarId, guestAvatar.id);
  const fallback = await post(path + "/join", { name: "Emerald" });
  assert.equal(fallback.status, 200);
  assert.equal(fallback.state.players[2].avatarId, DEFAULT_AVATAR_ID);

  const deal = await post(path + "/deal", {}, host.token);
  assert.equal(deal.status, 200);
  const expected = [hostAvatar.id, guestAvatar.id, DEFAULT_AVATAR_ID];
  for (const token of [undefined, guest.token]) {
    const response = await request(path, { token });
    assert.equal(response.status, 200);
    assert.deepEqual(response.state.players.map(player => player.avatarId), expected);
  }
});

test("invalid avatar IDs are rejected without seating a player", async () => {
  const invalidIds = ["unknown-avatar", "", null, 0, { id: DEFAULT_AVATAR_ID }];
  const host = await post("", { name: "Pepe" });
  assert.equal(host.status, 201);
  assert.equal(host.state.players[0].avatarId, DEFAULT_AVATAR_ID);
  const path = "/" + host.state.id;
  for (const avatarId of invalidIds) {
    const invalidHost = await post("", { name: "Host", avatarId });
    assert.equal(invalidHost.status, 400);
    assert.match(invalidHost.error, /avatar/i);
    const invalidGuest = await post(path + "/join", { name: "Kek", avatarId });
    assert.equal(invalidGuest.status, 400);
    assert.match(invalidGuest.error, /avatar/i);
  }
  const unchanged = await request(path);
  assert.equal(unchanged.state.revision, host.state.revision);
  assert.deepEqual(unchanged.state.players.map(player => player.name), ["Pepe"]);
});

test("invite, reconnect, host authority, and private hands through showdown", async () => {
  const { host, guest, path, tokens } = await headsUp();
  assert.notEqual(host.token, guest.token);
  assert.deepEqual(guest.state.players.map(player => player.name), ["Pepe", "Kek"]);
  assert.equal((await post(path + "/join", { name: "  kek " })).status, 400);
  assert.equal((await post(path + "/deal", {})).status, 403);
  assert.match((await post(path + "/deal", {}, guest.token)).error, /host/i);

  const deal = await post(path + "/deal", {}, host.token);
  assert.equal(deal.status, 200);
  assert.equal(deal.state.street, "Preflop");
  assert.equal(deal.state.yourHand, null);
  assert.deepEqual(deal.state.players.map(player => player.stats), [
    { played: 0, won: 0, net: 0 }, { played: 0, won: 0, net: 0 }
  ]);
  assert.equal(deal.state.smallBlind, deal.state.button);
  assert.notEqual(deal.state.bigBlind, deal.state.smallBlind);
  visible(deal.state.players[0].cards);
  hidden(deal.state.players[1].cards);
  const joinedAgain = await request(path, { token: guest.token });
  assert.equal(joinedAgain.state.index, 1);
  hidden(joinedAgain.state.players[0].cards);
  visible(joinedAgain.state.players[1].cards);

  const spectator = await request(path);
  assert.equal(spectator.state.index, -1);
  assert.equal(spectator.state.options, null);
  for (const player of spectator.state.players) {
    hidden(player.cards);
    assert.equal("token" in player, false);
  }

  let state = deal.state;
  const first = tokens[state.turn];
  const firstAction = { action: "call", revision: state.revision };
  const advance = await post(path + "/act", firstAction, first);
  assert.equal(advance.status, 200);
  assert.deepEqual(advance.state.players[deal.state.turn].lastAction, { kind: "call", amount: 10, street: "Preflop" });
  const stale = await post(path + "/act", firstAction, first);
  assert.equal(stale.status, 400);
  assert.match(stale.error, /table moved on/i);
  state = advance.state;

  const boardSizes = new Set([state.board.length]);
  for (let count = 0; state.turn !== -1 && count < 10; count++) {
    const action = await post(path + "/act", { action: "call", revision: state.revision }, tokens[state.turn]);
    assert.equal(action.status, 200);
    state = action.state;
    boardSizes.add(state.board.length);
    if (state.turn !== -1 && state.board.length >= 3) {
      for (const [seat, token] of tokens.entries()) {
        const { state: view } = await request(path, { token });
        const expected = labels[handCategory(evaluate([...view.players[seat].cards, ...view.board]))];
        assert.equal(view.yourHand, expected);
        hidden(view.players[1 - seat].cards);
      }
      assert.equal((await request(path)).state.yourHand, null);
    }
  }
  assert.equal(state.turn, -1);
  assert.equal(state.street, "Showdown");
  assert.deepEqual([...boardSizes], [0, 3, 4, 5]);
  assert.equal(state.pot, 0);
  assert.equal(state.payouts.reduce((sum, payout) => sum + payout.amount, 0), 40);
  assert.equal(state.recap.length, 2);
  assert.equal(state.recap.reduce((sum, entry) => sum + entry.amount, 0), 40);
  assert.deepEqual(state.players.map((player, seat) => player.stats), state.players.map((player, seat) => ({
    played: 1, won: Number(state.payouts.some(payout => payout.seat === seat)), net: player.stack - STARTING_STACK
  })));
  assert.ok(state.recap.every(entry => typeof entry.hand === "string"));
  assert.ok(state.recap[0].amount >= state.recap[1].amount);
  for (const { seat, amount } of state.payouts) {
    assert.equal(state.players[seat].stack, STARTING_STACK - 20 + amount);
  }
  assert.equal(state.players.reduce((sum, player) => sum + player.stack, 0), 2 * STARTING_STACK);
  for (const player of state.players) visible(player.cards);
  assert.equal(new Set([...state.board, ...state.players.flatMap(player => player.cards)]).size, 9);
  const publicShowdown = await request(path);
  assert.deepEqual(publicShowdown.state.players, state.players);
  assert.deepEqual(publicShowdown.state.recap, state.recap);
  const reviewed = publicShowdown.state.recentHands[0];
  assert.match(reviewed.actions[1], /posts 10 small blind/);
  assert.match(reviewed.actions[2], /posts 20 big blind/);
  assert.deepEqual(reviewed.actions.filter(action => /^(Flop|Turn|River) ·/.test(action)).map(action => action.split(" ")[0]),
    ["Flop", "Turn", "River"]);
  assert.equal(reviewed.actions.at(-1), state.result);
  const exported = formatHandExport(reviewed);
  assert.ok(exported.includes("Board: " + state.board.join(" ")));
  assert.ok(exported.includes(state.result));
  assert.ok(exported.includes("Hand action"));
  for (const player of reviewed.players) assert.ok(exported.includes(player.cards.join(" ")));
  assert.equal(reviewed.actionBoardCounts.length, reviewed.actions.length);
  assert.deepEqual([...new Set(reviewed.actionBoardCounts)], [0, 3, 4, 5]);
  for (const [street, count] of [["Flop", 3], ["Turn", 4], ["River", 5]]) {
    const step = reviewed.actions.findIndex(action => action.startsWith(street + " ·"));
    assert.equal(reviewed.actionBoardCounts[step], count);
  }
  assert.equal(reviewed.actionsOmitted, 0);
  assert.ok(reviewed.actions.every(action => !action.includes("took a seat")));
  assert.deepEqual(reviewed.board, state.board);
  for (const player of reviewed.players) {
    assert.equal(player.bestFive.length, 5);
    assert.ok(player.bestFive.every(card => [...player.cards, ...reviewed.board].includes(card)));
    assert.equal(evaluate(player.bestFive), evaluate([...player.cards, ...reviewed.board]));
  }
  assert.deepEqual(reviewed.players.map(player => player.cards), state.recap.map(({ seat }) => state.players[seat].cards));
  const next = await post(path + "/deal", {}, host.token);
  assert.deepEqual(next.state.recentHands, [reviewed]);
  assert.deepEqual(next.state.board, []);
  assert.ok(next.state.players.every(player => player.lastAction === null));
  assert.deepEqual(next.state.players.map(player => player.stats), state.players.map(player => player.stats));
});

test("timeout facing a bet folds the player and preserves both players' privacy", async t => {
  const { host, path, tokens } = await headsUp();
  const dealt = (await post(path + "/deal", {}, host.token)).state;
  const turn = await request(path, { token: tokens[dealt.turn] });
  assert.ok(turn.state.options.call > 0);
  t.mock.method(Date, "now", () => dealt.deadline + 1);

  const expired = await request(path);
  assert.equal(expired.state.turn, -1);
  assert.equal(expired.state.street, "Hand complete");
  assert.equal(expired.state.players[dealt.turn].folded, true);
  assert.equal(expired.state.revision, dealt.revision + 1);
  assert.equal(expired.state.pot, 0);
  assert.deepEqual(expired.state.recap, [{ seat: 1 - dealt.turn, hand: null, amount: 20 }]);
  assert.deepEqual(expired.state.recentHands[0].players, [{
    name: dealt.players[1 - dealt.turn].name, hand: null, amount: 20, cards: []
  }]);
  const exported = formatHandExport(expired.state.recentHands[0]);
  assert.match(exported, /Board: No community cards dealt/);
  assert.match(exported, /\+20 chips/);
  assert.doesNotMatch(exported, /\b[2-9TJQKA][shdc]\b/);
  for (const player of expired.state.players) hidden(player.cards);
  const next = await post(path + "/deal", {}, host.token);
  assert.equal(next.status, 200);
  assert.equal(next.state.hand, dealt.hand + 1);
  assert.notEqual(next.state.button, dealt.button);
  assert.deepEqual(next.state.payouts, []);
  assert.deepEqual(next.state.recap, []);
});

test("an idle table expires even before another table is created", async t => {
  const { host, path } = await headsUp();
  const expiry = Date.now() + 12 * 60 * 60 * 1000 + 1000;
  t.mock.method(Date, "now", () => expiry);
  assert.equal((await request(path, { token: host.token })).status, 404);
  assert.equal((await post(path + "/join", { name: "Late" })).status, 404);
});

test("a player joining during a hand gets cards on the following deal", async () => {
  const { host, path, tokens } = await headsUp();
  const deal = await post(path + "/deal", {}, host.token);
  assert.equal(deal.status, 200);
  const join = await post(path + "/join", { name: "Emerald" });
  assert.equal(join.status, 200);
  assert.equal(join.state.index, 2);
  assert.deepEqual(join.state.players[2].cards, []);
  assert.equal(join.state.options, null);
  assert.equal(join.state.players[2].stack, STARTING_STACK);

  const fold = await post(path + "/act", { action: "fold", revision: join.state.revision }, tokens[join.state.turn]);
  assert.equal(fold.status, 200);
  assert.equal(fold.state.turn, -1);
  assert.deepEqual(fold.state.players[2].stats, { played: 0, won: 0, net: 0 });
  const next = await post(path + "/deal", {}, host.token);
  assert.equal(next.status, 200);
  const reconnect = await request(path, { token: join.token });
  visible(reconnect.state.players[2].cards);
  hidden(reconnect.state.players[0].cards);
  hidden(reconnect.state.players[1].cards);
});
