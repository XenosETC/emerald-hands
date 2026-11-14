const row = index => Math.floor(index / 8);
const column = index => index % 8;

export function newGame({ repetition = true } = {}) {
  const board = Array.from({ length: 64 }, (_, index) => {
    if ((row(index) + column(index)) % 2 === 0) return 0;
    return row(index) < 3 ? -1 : row(index) > 4 ? 1 : 0;
  });
  return { board, turn: 1, chain: null, winner: 0, repetitionHistory: repetition ? null : false };
}

function movesFrom(board, from) {
  const piece = board[from];
  const moves = [];
  for (const vertical of Math.abs(piece) === 2 ? [-1, 1] : [-Math.sign(piece)]) {
    for (const horizontal of [-1, 1]) {
      const y = row(from) + vertical;
      const x = column(from) + horizontal;
      if (y < 0 || y > 7 || x < 0 || x > 7) continue;
      const adjacent = y * 8 + x;
      if (!board[adjacent]) {
        moves.push({ from, to: adjacent, capture: null });
        continue;
      }
      const endY = y + vertical;
      const endX = x + horizontal;
      if (Math.sign(board[adjacent]) === Math.sign(piece) || endY < 0 || endY > 7 || endX < 0 || endX > 7) continue;
      const to = endY * 8 + endX;
      if (!board[to]) moves.push({ from, to, capture: adjacent });
    }
  }
  return moves;
}

export function isFinished(game) {
  return Boolean(game.winner || game.draw);
}

export function legalMoves(game) {
  if (isFinished(game)) return [];
  if (game.chain !== null) return movesFrom(game.board, game.chain).filter(move => move.capture !== null);
  const moves = game.board.flatMap((piece, index) => Math.sign(piece) === game.turn ? movesFrom(game.board, index) : []);
  const jumps = moves.filter(move => move.capture !== null);
  return jumps.length ? jumps : moves;
}

export function play(game, from, to) {
  const move = legalMoves(game).find(candidate => candidate.from === from && candidate.to === to);
  return move ? applyMove(game, move) : game;
}

function applyMove(game, move) {
  const { from, to } = move;
  const board = [...game.board];
  const piece = board[from];
  const repetitionHistory = game.repetitionHistory === false ? false : null;
  const crowned = Math.abs(piece) === 1 && row(to) === (game.turn === 1 ? 0 : 7);
  board[from] = 0;
  board[to] = crowned ? game.turn * 2 : piece;
  if (move.capture !== null) {
    board[move.capture] = 0;
    if (!crowned && movesFrom(board, to).some(next => next.capture !== null)) {
      return { board, turn: game.turn, chain: to, winner: 0, repetitionHistory };
    }
  }
  const next = { board, turn: -game.turn, chain: null, winner: 0, repetitionHistory };
  if (!legalMoves(next).length) next.winner = game.turn;
  else if (repetitionHistory !== false && Math.abs(piece) === 2 && move.capture === null) {
    recordRepetition(game, next);
  }
  return next;
}

function positionKey({ board, turn }) {
  return turn + ":" + board.join(",");
}

function recordRepetition(game, next) {
  // A capture or a forward man move cannot be undone by later play. Only
  // consecutive quiet king turns can revisit a completed position.
  const previous = game.repetitionHistory ?? { key: positionKey(game), previous: null };
  const key = positionKey(next);
  let occurrences = 1;
  for (let entry = previous; entry; entry = entry.previous) {
    if (entry.key === key && ++occurrences === 3) {
      next.draw = true;
      break;
    }
  }
  next.repetitionHistory = { key, previous };
}

function search(game, side, depth, alpha, beta) {
  if (game.winner) return game.winner === side ? 10000 + depth : -10000 - depth;
  if (game.draw) return 0;
  const moves = legalMoves(game);
  // Give forced exchanges up to three extra turns so a hanging piece is counted.
  const forced = moves[0]?.capture != null;
  if (depth <= 0 && game.chain === null && (!forced || depth <= -3)) {
    return game.board.reduce((score, piece, index) => {
      const color = Math.sign(piece);
      const progress = color === 1 ? 7 - row(index) : row(index);
      const value = Math.abs(piece) === 2 ? 180 : 100 + 3 * progress;
      return score + side * color * value;
    }, 0);
  }
  const maximizing = game.turn === side;
  let best = maximizing ? -Infinity : Infinity;
  for (const move of moves) {
    const next = applyMove(game, move);
    const score = search(next, side, depth - Number(next.turn !== game.turn), alpha, beta);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (alpha >= beta) break;
  }
  return best;
}

export function botMove(game, difficulty = "standard") {
  if (difficulty === "casual") {
    const moves = legalMoves(game);
    return moves[Math.floor(Math.random() * moves.length)];
  }
  const scored = legalMoves(game).map(move => {
    const next = applyMove(game, move);
    if (difficulty === "expert") {
      const depth = 4 - Number(next.turn !== game.turn);
      return { move, score: search(next, game.turn, depth, -Infinity, Infinity) };
    }
    const promotion = Math.abs(next.board[move.to]) > Math.abs(game.board[move.from]);
    const replyCapture = next.turn !== game.turn && legalMoves(next).some(reply => reply.capture === move.to);
    const score = (next.winner === game.turn ? 100 : 0) + (next.chain !== null ? 5 : 0)
      + (promotion ? 4 : 0) - (replyCapture ? 3 : 0) + Math.random();
    return { move, score };
  });
  return scored.sort((a, b) => b.score - a.score)[0]?.move;
}
export function captureRoutes(game) {
  function extend(position, moves) {
    return legalMoves(position).filter(move => move.capture !== null).flatMap(move => {
      const next = applyMove(position, move);
      const path = [...moves, move];
      if (next.chain !== null) return extend(next, path);
      return [{ path, crowns: Math.abs(next.board[move.to]) > Math.abs(position.board[move.from]) }];
    });
  }
  return extend(game, []);
}

export function analyzeHint(game) {
  const first = botMove(game, "expert");
  if (!first) return null;
  const path = [first];
  let next = applyMove(game, first);
  while (next.chain !== null) {
    const step = botMove(next, "expert");
    path.push(step);
    next = applyMove(next, step);
  }

  const { to } = path.at(-1);
  return {
    path,
    crowns: Math.abs(game.board[first.from]) < Math.abs(next.board[to]),
    wins: next.winner === game.turn,
    draws: Boolean(next.draw),
    recapturable: legalMoves(next).some(reply => reply.capture === to),
    capturedKings: path.filter(({ capture }) => capture !== null && Math.abs(game.board[capture]) === 2).length,
  };
}
