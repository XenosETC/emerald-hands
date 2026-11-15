import { legalMoves, newGame, play } from "./engine.mjs?v=draw-2";

export const matchKey = "pepe-checkers:match";
const legacyVersion = 1;
const version = 2;
const maxSteps = 4096;

export function encodeMatch({ mode, difficulty, moves, wins, draws = 0, repetition = true }) {
  if (moves.length > maxSteps) return null;
  const save = { version: repetition ? version : legacyVersion, mode, difficulty, moves, wins };
  if (repetition) save.draws = draws;
  return JSON.stringify(save);
}

export function decodeMatch(raw, mode, difficulty) {
  let save;
  try {
    save = JSON.parse(raw);
  } catch {
    return null;
  }
  if ((save?.version !== version && save?.version !== legacyVersion) ||
    save.mode !== mode || save.difficulty !== difficulty) return null;
  const repetition = save.version === version;
  const draws = repetition ? save.draws : 0;
  if (!Number.isSafeInteger(draws) || draws < 0) return null;
  if (!Array.isArray(save.moves) || save.moves.length > maxSteps) return null;
  if (![save.wins?.[1], save.wins?.[-1]].every(count => Number.isSafeInteger(count) && count >= 0)) return null;

  let game = newGame({ repetition });
  const moves = [];
  for (const step of save.moves) {
    if (!Array.isArray(step) || step.length !== 2) return null;
    const move = legalMoves(game).find(candidate => candidate.from === step[0] && candidate.to === step[1]);
    if (!move) return null;
    moves.push(move);
    game = play(game, move.from, move.to);
  }
  if (game.winner && save.wins[game.winner] === 0) return null;
  if (game.draw && draws === 0) return null;
  return { moves, wins: save.wins, draws, repetition };
}
