import assert from "node:assert/strict";
import test from "node:test";
import { botMove, legalMoves, newGame, play } from "./engine.mjs";

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
