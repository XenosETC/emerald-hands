import assert from "node:assert/strict";
import test from "node:test";
import { act, evaluate, evaluateBest, options, startHand } from "./holdem.mjs";
import { potRaiseTo } from "./bet-sizing.mjs";

test("best five includes a playing kicker and prefers the board when scores tie", () => {
  const board = ["As", "Ah", "9c", "7s", "3d"];
  const hand = evaluateBest([...board, "Kd", "2c"]);
  assert.deepEqual(hand.cards, ["As", "Ah", "9c", "7s", "Kd"]);
  assert.equal(hand.score, evaluate(hand.cards));
  const straight = ["As", "Kd", "Qc", "Jh", "Ts"];
  assert.deepEqual(evaluateBest([...straight, "Ac", "2s"]).cards, straight);
});

test("pot shortcuts account for the call and clamp to legal raise totals", () => {
  const allowed = { call: 20, min: 60, max: 300 };
  assert.equal(potRaiseTo(100, 20, allowed, .5), 100);
  assert.equal(potRaiseTo(100, 20, allowed, 1), 160);
  assert.equal(potRaiseTo(25, 0, allowed, .5), 60);
  assert.equal(potRaiseTo(400, 20, allowed, 1), 300);
  assert.equal(potRaiseTo(80, 0, { call: 0, min: 20, max: 300 }, .5), 40);
});

function table(...stacks) {
  const room = {
    players: stacks.map((stack, index) => ({ stack, name: "Seat " + index })),
    hand: 0, turn: -1, button: -1, history: []
  };
  startHand(room);
  return room;
}

function board(room, cards) {
  room.deck = ["6s", ...cards.slice(0, 3), "8s", cards[3], "Td", cards[4]].reverse();
}

function move(room, seat, action, amount) {
  assert.equal(room.turn, seat);
  act(room, seat, action, amount);
}

test("the big blind moves when a three-handed table becomes heads-up", () => {
  const room = table(200, 200, 200);
  assert.deepEqual([room.button, room.smallBlind, room.bigBlind], [0, 1, 2]);
  move(room, 0, "fold");
  move(room, 1, "fold");
  room.players[0].stack = 0;
  startHand(room);
  assert.deepEqual([room.button, room.smallBlind, room.bigBlind, room.turn], [2, 2, 1, 2]);
  assert.equal(room.players[0].cards.length, 0);
  assert.equal(new Set(room.players.flatMap(player => player.cards)).size, 4);
});

test("a short big blind does not force a lone opponent to overcall", () => {
  const room = table(100, 15);
  assert.equal(options(room, 0).call, 5);
  assert.equal(options(room, 0).canRaise, false);
  move(room, 0, "call");
  assert.equal(room.board.length, 5);
  assert.equal(room.turn, -1);
  assert.equal(room.players.reduce((sum, player) => sum + player.stack, 0), 115);
});

test("a single short all-in does not reopen betting for a prior aggressor", () => {
  const room = table(200, 50, 200, 200);
  move(room, 3, "raise", 40);
  move(room, 0, "call");
  assert.equal(options(room, 1).min, 50);
  move(room, 1, "raise", 50);
  move(room, 2, "call");
  assert.equal(options(room, 3).canRaise, false);
  assert.throws(() => act(room, 3, "raise", 70), /legal raise/);
  assert.equal(options(room, 3).call, 10);
});

test("cumulative short all-ins reopen betting at the last full increment", () => {
  const room = table(200, 50, 60, 200);
  move(room, 3, "raise", 40);
  move(room, 0, "call");
  move(room, 1, "raise", 50);
  move(room, 2, "raise", 60);
  assert.deepEqual(options(room, 3), { call: 20, max: 200, min: 80, canRaise: true });
});

test("all-in showdown settles main and side pots and returns the uncalled excess", () => {
  const room = table(70, 200, 150);
  room.players[0].cards = ["As", "Ah"];
  room.players[1].cards = ["Ks", "Kh"];
  room.players[2].cards = ["Qs", "Qh"];
  board(room, ["2c", "4h", "7d", "9s", "Jc"]);
  move(room, 0, "raise", 70);
  move(room, 1, "raise", 200);
  move(room, 2, "call");
  assert.equal(room.turn, -1);
  assert.equal(room.street, "Showdown");
  assert.deepEqual(room.players.map(player => player.stack), [210, 210, 0]);
  assert.ok(room.players.every(player => player.total === 0 && player.bet === 0));
  assert.ok(room.history.some(line => line.includes("50 uncalled chips")));
  assert.deepEqual(room.recentHands[0].pots, [
    { amount: 210, awards: [{ name: "Seat 0", amount: 210 }] },
    { amount: 160, awards: [{ name: "Seat 1", amount: 160 }] }
  ]);
  assert.deepEqual(room.recentHands[0].returned, [{ name: "Seat 1", amount: 50 }]);
});

test("split pots award an odd chip clockwise from the dealer", () => {
  const room = table(200, 200, 200);
  board(room, ["Ts", "Js", "Qs", "Ks", "As"]);
  move(room, 0, "raise", 41);
  move(room, 1, "call");
  move(room, 2, "call");
  move(room, 1, "call");
  move(room, 2, "fold");
  while (room.turn !== -1) act(room, room.turn, "call");
  assert.deepEqual(room.players.map(player => player.stack), [220, 221, 159]);
  assert.deepEqual(room.recentHands[0].pots, [{
    amount: 123, awards: [{ name: "Seat 1", amount: 62 }, { name: "Seat 0", amount: 61 }]
  }]);
});

test("the evaluator recognizes wheel straights and board kickers", () => {
  const wheel = ["As", "2h", "3d", "4c", "5s", "9h", "9c"];
  const sixHigh = ["2s", "3h", "4d", "5c", "6s", "9h", "9c"];
  assert.equal(Math.floor(evaluate(wheel) / 15 ** 5), 4);
  assert.ok(evaluate(sixHigh) > evaluate(wheel));
  const shared = ["As", "Ad", "Ks", "Kc", "Qh"];
  assert.equal(evaluate([...shared, "3c", "4c"]), evaluate([...shared, "2c", "7c"]));
});
