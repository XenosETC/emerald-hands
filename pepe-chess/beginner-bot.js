(() => {
  "use strict";

  const { Chess } = window.PepeChessRules;
  const values = { p: 100, n: 320, b: 330, r: 500, q: 900 };

  function materialSwing(move) {
    const capture = values[move.captured] ?? 0;
    const promotion = move.promotion ? values[move.promotion] - values.p : 0;
    return capture + promotion;
  }

  function development(move) {
    const file = move.to.charCodeAt(0) - 97;
    const rank = Number(move.to[1]) - 1;
    const center = 7 - Math.abs(file - 3.5) - Math.abs(rank - 3.5);
    const home = move.color === "b" ? "8" : "1";
    const develops = ["n", "b"].includes(move.piece) && move.from.endsWith(home);
    const castles = move.isKingsideCastle() || move.isQueensideCastle();
    return (["p", "n", "b"].includes(move.piece) ? center * 4 : 0)
      + (develops ? 16 : 0) + (castles ? 28 : 0);
  }

  // Look one reply ahead for immediate captures, promotion threats, and mate.
  // A fresh position keeps the displayed game's clock, history, and repetition intact.
  function chooseMove(game) {
    const position = new Chess(game.fen());
    let bestMove = null;
    let bestScore = -Infinity;
    for (const move of position.moves({ verbose: true })) {
      if (move.san.endsWith("#")) return move;
      position.move(move);
      const replies = position.moves({ verbose: true });
      const replySwing = replies.reduce((worst, reply) => {
        return Math.max(worst, reply.san.endsWith("#") ? 10000 : materialSwing(reply));
      }, 0);
      const score = position.isDraw() ? 0 : materialSwing(move) - replySwing + development(move);
      position.undo();
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  window.PepeChessBot = { chooseMove };
})();
