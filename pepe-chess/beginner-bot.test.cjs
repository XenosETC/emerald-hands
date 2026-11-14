const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const { test } = require("node:test");
const assert = require("node:assert/strict");

function loadBot(now = () => 0) {
  const context = { window: {}, performance: { now } };
  for (const file of ["vendor/chess-1.4.0.js", "beginner-bot.js"]) {
    runInNewContext(readFileSync(join(__dirname, file), "utf8"), context);
  }
  return { Chess: context.window.PepeChessRules.Chess, chooseMove: context.window.PepeChessBot.chooseMove };
}

test("Club sees a favorable recapture and leaves the live position untouched", () => {
  const { Chess, chooseMove } = loadBot();
  const fen = "rnb1kbr1/pp1q3p/4p2n/P1ppNp2/1P1P1PP1/2P1K2p/R2BP2R/1NQ2B2 b - - 0 18";
  const game = new Chess(fen);

  assert.equal(chooseMove(game).san, "cxd4+");
  assert.equal(chooseMove(game, "club").san, "Nxg4+");
  assert.equal(game.fen(), fen);
  assert.equal(game.history().length, 0);
});

test("Club returns a legal fallback if the search budget is used", () => {
  let elapsed = 0;
  const { Chess, chooseMove } = loadBot(() => {
    elapsed += 200;
    return elapsed;
  });
  const game = new Chess();
  game.move("e4");
  assert.ok(game.moves().includes(chooseMove(game, "club").san));
  assert.equal(game.turn(), "b");
});

test("Both levels choose immediate mate", () => {
  const { Chess, chooseMove } = loadBot();
  const game = new Chess();
  for (const move of ["f3", "e5", "g4"]) game.move(move);
  assert.equal(chooseMove(game).san, "Qh4#");
  assert.equal(chooseMove(game, "club").san, "Qh4#");
});
