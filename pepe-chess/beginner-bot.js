(() => {
  "use strict";

  const { Chess } = window.PepeChessRules;
  const values = { p: 100, n: 320, b: 330, r: 500, q: 900 };
  const mateScore = 10000;
  const baselineBudgetMs = 90;
  const clubBudgetMs = 180;

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

  function replyThreat(move) {
    return move.san.endsWith("#") ? mateScore : materialSwing(move);
  }

  function refineTactics(position, candidate, deadline) {
    const { move, threats, score } = candidate;
    if (!threats.length || threats[0].swing === mateScore) return score;
    position.move(move);
    let worstReply = 0;
    for (const [index, { reply, swing }] of threats.entries()) {
      if (swing <= worstReply) break;
      if (index >= 4 || performance.now() >= deadline) {
        worstReply = swing;
        break;
      }
      position.move(reply);
      const recapture = position.moves({ verbose: true }).reduce((best, answer) => {
        // Count immediate mate or a recapture on the square White just attacked.
        if (answer.san.endsWith("#")) return mateScore;
        return answer.to === reply.to ? Math.max(best, materialSwing(answer)) : best;
      }, 0);
      position.undo();
      worstReply = Math.max(worstReply, swing - recapture);
    }
    position.undo();
    return score + threats[0].swing - worstReply;
  }

  // Search a copy so the live match's history and repetition remain intact.
  function chooseMove(game, difficulty = "beginner") {
    const club = difficulty === "club";
    const start = performance.now();
    const position = new Chess(game.fen());
    const moves = position.moves({ verbose: true });
    const mate = moves.find(move => move.san.endsWith("#"));
    if (mate) return mate;
    if (!moves.length) return null;
    if (club) moves.sort((a, b) => materialSwing(b) + development(b) - materialSwing(a) - development(a));

    const candidates = [];
    for (const move of moves) {
      position.move(move);
      const drawn = position.isDraw();
      const replies = drawn ? [] : position.moves({ verbose: true });
      const threats = replies
        .map(reply => ({ reply, swing: replyThreat(reply) }))
        .filter(threat => threat.swing > 0)
        .sort((a, b) => b.swing - a.swing);
      const score = !replies.length ? 0
        : materialSwing(move) - (threats[0]?.swing ?? 0) + development(move);
      position.undo();
      candidates.push({ move, threats, score });
      if (club && performance.now() - start >= baselineBudgetMs) break;
    }

    candidates.sort((a, b) => b.score - a.score);
    let { move: bestMove, score: bestScore } = candidates[0];
    if (club) {
      const deadline = start + clubBudgetMs;
      for (const candidate of candidates.slice(0, 8)) {
        if (performance.now() >= deadline) break;
        const score = refineTactics(position, candidate, deadline);
        if (score > bestScore) {
          bestScore = score;
          bestMove = candidate.move;
        }
      }
    }
    return bestMove;
  }

  window.PepeChessBot = { chooseMove };
})();
