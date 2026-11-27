import assert from "node:assert/strict";
import test from "node:test";
import { analyzeCaptureRoute, analyzeHint, botMove, captureRoutes, isFinished, legalMoves, newGame, play, previewRepetition, repetitionCount } from "./engine.mjs";
import { decodeMatch, encodeMatch } from "./match-save.mjs";

function position(pieces) {
  return { board: Object.assign(Array(64).fill(0), pieces), turn: 1, chain: null, winner: 0 };
}

test("capture forecasts inspect an entire reply chain and preserve the match", () => {
  const game = position({ 51: 1, 42: -1, 17: 1, 10: -1 });
  const before = structuredClone(game);
  const route = captureRoutes(game).find(route => route.path[0].from === 51);
  const forecast = analyzeCaptureRoute(game, route.path);
  assert.equal(forecast.recapturable, true);
  assert.equal(forecast.wins, false);
  assert.deepEqual(game, before);
});

test("capture forecasts explain crowning, kings taken and a winning route", () => {
  const game = position({ 17: 1, 10: -2 });
  const forecast = analyzeCaptureRoute(game, captureRoutes(game)[0].path);
  assert.deepEqual(forecast, { crowns: true, wins: true, draws: false, recapturable: false, capturedKings: 1 });
});

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
    JSON.stringify({ ...record, version: 9 }),
    JSON.stringify({ ...record, wins: { 1: -1, "-1": 0 } }),
    JSON.stringify({ ...record, moves: [[40, 33], [42, 35]] }),
  ]) {
    assert.equal(decodeMatch(invalid, "local", "standard"), null);
  }
});

test("Expert hint explains a complete chain and counts a captured king", () => {
  const game = position({ 42: 1, 49: 1, 35: -1, 21: -2 });
  assert.deepEqual(analyzeHint(game), {
    path: [{ from: 42, to: 28, capture: 35 }, { from: 28, to: 14, capture: 21 }],
    crowns: false,
    wins: true,
    draws: false,
    recapturable: false,
    capturedKings: 1,
  });
});

test("Expert hint distinguishes crowning and a legal immediate recapture", () => {
  const crown = analyzeHint(position({ 17: 1, 10: -1, 12: -1 }));
  assert.equal(crown.crowns, true);
  assert.equal(crown.path.length, 1);
  const exposed = analyzeHint(position({ 42: 1, 14: 1, 35: -1, 21: -1 }));
  assert.equal(exposed.recapturable, true);
  assert.equal(analyzeHint({ ...newGame(), winner: -1 }), null);
});

test("third repeated king position ends play after a complete turn", () => {
  const initial = position({ 56: 2, 7: -2 });
  const cycle = [[56, 49], [7, 14], [49, 56], [14, 7]];
  const advance = (game, [from, to]) => {
    const next = play(game, from, to);
    assert.notEqual(next, game);
    return next;
  };
  assert.equal(repetitionCount(initial), 1);
  assert.equal(repetitionCount(newGame({ repetition: false })), null);
  assert.equal(previewRepetition(initial, 56, 63), null);
  const secondOccurrence = cycle.reduce(advance, initial);
  assert.equal(repetitionCount(secondOccurrence), 2);
  assert.equal(isFinished(secondOccurrence), false);
  const beforeDraw = cycle.slice(0, -1).reduce(advance, secondOccurrence);
  assert.equal(isFinished(beforeDraw), false);
  assert.equal(repetitionCount(beforeDraw), 2);
  assert.equal(previewRepetition(beforeDraw, ...cycle.at(-1)), 3);
  assert.equal(repetitionCount(beforeDraw), 2);
  const drawn = advance(beforeDraw, cycle.at(-1));
  assert.equal(repetitionCount(drawn), 3);
  assert.equal(drawn.draw, true);
  assert.equal(drawn.winner, 0);
  assert.deepEqual(drawn.board, initial.board);
  assert.equal(drawn.turn, initial.turn);
  assert.equal(drawn.chain, null);
  assert.deepEqual(legalMoves(drawn), []);
  for (const difficulty of ["casual", "standard", "expert"]) {
    assert.equal(botMove(drawn, difficulty), undefined);
  }
  assert.equal(analyzeHint(drawn), null);
  assert.equal(play(drawn, 56, 49), drawn);
  // Returning to a previous immutable position restores its repetition count.
  assert.equal(advance(beforeDraw, cycle.at(-1)).draw, true);
});

test("an irreversible jump clears repetition history and a partial chain is never recorded", () => {
  const game = {
    ...position({ 42: 1, 49: 1, 35: -1, 21: -1, 7: -2 }),
    repetitionHistory: { key: "earlier position", previous: null },
  };
  assert.equal(previewRepetition(game, 42, 28), null);
  const first = play(game, 42, 28);
  assert.equal(first.chain, 28);
  assert.equal(repetitionCount(first), null);
  assert.equal(first.repetitionHistory, null);
  assert.equal(isFinished(first), false);
  const complete = play(first, 28, 14);
  assert.equal(complete.chain, null);
  assert.equal(complete.repetitionHistory, null);
  assert.equal(isFinished(complete), false);
  assert.equal(repetitionCount(complete), 1);
});

test("saved repetition draw is replayed and legacy saves keep play beyond that point", () => {
  const opening = [[42, 33], [19, 28], [51, 42], [17, 26], [33, 19], [12, 26],
    [58, 51], [5, 12], [46, 39], [12, 19], [44, 35], [26, 44], [44, 58], [39, 30],
    [21, 39], [53, 46], [39, 53], [62, 44], [19, 26], [42, 33], [10, 19], [44, 37],
    [28, 46], [55, 37], [26, 35], [60, 53], [19, 26], [33, 19], [3, 12], [19, 5]];
  const cycle = [[58, 51], [5, 12], [51, 58], [12, 5]];
  const moves = [...opening, ...cycle, ...cycle];
  const record = { mode: "local", difficulty: "standard", moves, wins: { 1: 1, "-1": 0 } };
  assert.equal(decodeMatch(encodeMatch(record), "local", "standard"), null);
  const restored = decodeMatch(encodeMatch({ ...record, draws: 1 }), "local", "standard");
  assert.equal(restored.draws, 1);
  assert.equal(restored.repetition, true);
  assert.equal(restored.moves.length, moves.length);
  assert.equal(restored.wins[1], 1);
  const beyondDraw = [...moves, cycle[0]];
  assert.equal(decodeMatch(encodeMatch({ ...record, moves: beyondDraw, draws: 1 }), "local", "standard"), null);
  const legacy = decodeMatch(encodeMatch({ ...record, moves: beyondDraw, repetition: false }), "local", "standard");
  assert.equal(legacy.moves.length, beyondDraw.length);
  assert.equal(legacy.repetition, false);
  assert.equal(legacy.draws, 0);
  assert.equal(legacy.wins[1], 1);
});
