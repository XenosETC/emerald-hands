import assert from "node:assert/strict";
import test from "node:test";
import { botMove, captureRoutes, legalMoves, newGame, play } from "./engine.mjs";
import { decodeMatch, encodeMatch } from "./match-save.mjs";

function position(pieces) {
  return { board: Object.assign(Array(64).fill(0), pieces), turn: 1, chain: null, winner: 0 };
}

test("each difficulty obeys forced captures and stops at game over", () => {
  const game = position({ 42: 1, 49: 1, 35: -1, 21: -1 });
  for (const difficulty of ["casual", "standard", "expert"]) {
    assert.deepEqual(botMove(game, difficulty), { from: 42, to: 28, capture: 35 });
    assert.equal(botMove({ ...game, winner: 1 }, difficulty), undefined);
  }
});

test("Expert avoids an immediate forced recapture when a safe move is available", () => {
  const game = position({ 42: 1, 26: -1 });
  assert.deepEqual(botMove(game, "expert"), { from: 42, to: 33, capture: null });
});

test("new game starts with 24 pieces and seven opening moves", () => {
  const game = newGame();
  assert.equal(game.board.filter(Boolean).length, 24);
  assert.equal(legalMoves(game).length, 7);
  const move = botMove(game);
  assert.ok(legalMoves(game).some(candidate => candidate.from === move.from && candidate.to === move.to));
});

test("a jump takes priority and locks the jumping piece until the chain ends", () => {
  const game = position({ 42: 1, 49: 1, 35: -1, 21: -1 });
  assert.deepEqual(legalMoves(game), [{ from: 42, to: 28, capture: 35 }]);
  assert.equal(play(game, 49, 40), game);
  const first = play(game, 42, 28);
  assert.equal(first.turn, 1);
  assert.deepEqual(legalMoves(first), [{ from: 28, to: 14, capture: 21 }]);
  assert.equal(play(first, 28, 14).winner, 1);
});

test("crowning ends a jump chain and kings can jump backward", () => {
  const game = position({ 17: 1, 10: -1, 12: -1 });
  const crowned = play(game, 17, 3);
  assert.equal(crowned.board[3], 2);
  assert.equal(crowned.turn, -1);
  assert.equal(crowned.chain, null);
  assert.deepEqual(legalMoves({ ...crowned, turn: 1 }), [{ from: 3, to: 21, capture: 12 }]);
});

test("a side with pieces but no legal move loses", () => {
  const game = position({ 42: 1, 56: -1 });
  assert.equal(play(game, 42, 33).winner, 1);
});

test("capture routes show both legal lengths and keep the same piece through a chain", () => {
  const game = position({ 42: 1, 44: 1, 35: -1, 37: -1, 21: -1, 7: -1 });
  const routes = captureRoutes(game);
  assert.deepEqual(routes.map(({ path }) => path.map(({ from, to }) => [from, to])), [
    [[42, 28], [28, 14]],
    [[44, 26]],
    [[44, 30], [30, 12]],
  ]);
  assert.deepEqual(captureRoutes(play(game, 42, 28)), [{ path: [{ from: 28, to: 14, capture: 21 }], crowns: false }]);
  assert.deepEqual(captureRoutes(newGame()), []);
});

test("a route ends on crowning even if the new king could jump backward", () => {
  const game = position({ 17: 1, 10: -1, 12: -1 });
  assert.deepEqual(captureRoutes(game), [{ path: [{ from: 17, to: 3, capture: 10 }], crowns: true }]);
});

test("match save restores a journal through the first jump of a forced chain", () => {
  const moves = [[40, 33], [17, 24], [44, 35], [19, 26], [33, 19], [12, 26]];
  const raw = encodeMatch({ mode: "local", difficulty: "standard", moves, wins: { 1: 0, "-1": 2 } });
  const restored = decodeMatch(raw, "local", "standard");
  assert.deepEqual(restored.moves.map(({ from, to }) => [from, to]), moves);
  assert.equal(restored.wins[-1], 2);
  const position = restored.moves.reduce((game, move) => play(game, move.from, move.to), newGame());
  assert.equal(position.chain, 26);
  assert.deepEqual(legalMoves(position).map(({ from, to }) => [from, to]), [[26, 44]]);
});

test("match save rejects stale settings, unknown versions, and illegal moves", () => {
  const raw = encodeMatch({ mode: "local", difficulty: "standard", moves: [[40, 33]], wins: { 1: 0, "-1": 0 } });
  assert.equal(decodeMatch(raw, "bot", "standard"), null);
  assert.equal(decodeMatch(raw, "local", "expert"), null);
  const record = JSON.parse(raw);
  for (const invalid of [
    "not JSON",
    JSON.stringify({ ...record, version: 2 }),
    JSON.stringify({ ...record, wins: { 1: -1, "-1": 0 } }),
    JSON.stringify({ ...record, moves: [[40, 33], [42, 35]] }),
  ]) {
    assert.equal(decodeMatch(invalid, "local", "standard"), null);
  }
});
