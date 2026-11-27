import assert from "node:assert/strict";
import test from "node:test";
import { act, evaluate, evaluateBest, livePotBreakdown, options, startHand } from "./holdem.mjs";
import { headsUpCallOdds, potRaiseTo, raiseCommitment } from "./bet-sizing.mjs";
import { replayStreetStarts } from "./hand-replay.mjs";

test("raise commitment distinguishes total from added chips and short all-ins", () => {
  assert.deepEqual(raiseCommitment("40", 10, 1990, {canRaise:true,min:40,max:2000}), {total:40,added:30,behind:1960,allIn:false});
  assert.deepEqual(raiseCommitment("2000", 10, 1990, {canRaise:true,min:40,max:2000}), {total:2000,added:1990,behind:0,allIn:true});
  assert.deepEqual(raiseCommitment("25", 20, 5, {canRaise:true,min:25,max:25}), {total:25,added:5,behind:0,allIn:true});
  for (const value of ["", " ", "39", "2001", "40.5", "bad", "Infinity"]) {
    assert.equal(raiseCommitment(value,10,1990,{canRaise:true,min:40,max:2000}),null);
  }
  assert.equal(raiseCommitment("40",10,1990,{canRaise:false,min:40,max:2000}),null);
});

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

test("heads-up call equity excludes uncalled chips from a short-stack all-in", () => {
  assert.deepEqual(headsUpCallOdds(30, 10, 20, 10),
    { potAfterCall: 40, uncalled: 0, breakEvenShare: .25 });
  assert.deepEqual(headsUpCallOdds(500, 0, 400, 100),
    { potAfterCall: 300, uncalled: 300, breakEvenShare: 1 / 3 });
});

test("live pots track side tiers, folded contributions and unmatched bets", () => {
  const players = [
    { total: 50, folded: false },
    { total: 100, folded: false },
    { total: 150, folded: false },
    { total: 75, folded: true },
  ];
  assert.deepEqual(livePotBreakdown(players), { matched: [200, 125], unmatched: 50 });
  players[1].total += 50;
  assert.deepEqual(livePotBreakdown(players), { matched: [200, 225], unmatched: 0 });
});

test("replay street starts use retained board counts and skip unrecorded rounds", () => {
  assert.deepEqual(replayStreetStarts([0, 0, 3, 3, 4, 5, 5]), [0, 2, 4, 5]);
  assert.deepEqual(replayStreetStarts([0, 0, 0]), [0, -1, -1, -1]);
  assert.deepEqual(replayStreetStarts([4, 4, 5]), [-1, -1, 0, 2]);
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
  const { actions, actionBoardCounts } = room.recentHands[0];
  assert.deepEqual(replayStreetStarts(actionBoardCounts).slice(1).map(index => actions[index].split(" ")[0]),
    ["Flop", "Turn", "River"]);
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
