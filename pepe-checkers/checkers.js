import { botMove, legalMoves, newGame, play } from "./engine.mjs?v=difficulty-1";

const $ = id => document.getElementById(id);
const pieces = { 1: "Emerald", "-1": "Crimson" };
const portraits = { 1: "../pepe-poker/avatars/emerald.webp", "-1": "../pepe-poker/avatars/fallen.webp" };
let game = newGame();
let selected = null;
let botTimer;
let lastMove;
let moveNumber = 0;
const undoHistory = [];
const wins = { 1: 0, "-1": 0 };
const coordinate = index => "abcdefgh"[index % 8] + (8 - Math.floor(index / 8));
const cells = Array.from({ length: 64 }, (_, index) => {
  const square = document.createElement("button");
  square.type = "button";
  square.className = (Math.floor(index / 8) + index % 8) % 2 ? "dark" : "light";
  square.onclick = () => selectSquare(index);
  return square;
});
$("board").append(...cells);

function botTurn() {
  return $("mode").value === "bot" && game.turn === -1 && !game.winner;
}

function render() {
  $("difficulty-setting").hidden = $("mode").value !== "bot";
  $("undo").disabled = !undoHistory.length;
  $("restart").textContent = game.winner ? "Rematch" : "Restart game";
  $("reset-series").hidden = !wins[1] && !wins[-1];
  const moves = legalMoves(game);
  const current = pieces[game.turn];
  const winner = game.winner === -1 && $("mode").value === "bot" ? "Kekbot" : pieces[game.winner];
  $("status").textContent = game.winner ? winner + " wins!" :
    botTurn() ? "Kekbot is thinking…" : game.chain !== null ? current + " must jump again" :
      moves[0]?.capture !== null ? current + " to move · Jump required" : current + " to move";
  $("crimson-name").textContent = $("mode").value === "bot" ? "Kekbot" : "Crimson";
  for (const side of [1, -1]) {
    const team = pieces[side].toLowerCase();
    const remaining = game.board.filter(piece => Math.sign(piece) === side);
    const kings = remaining.filter(piece => Math.abs(piece) === 2).length;
    $(team + "-team").classList.toggle("active", !game.winner && game.turn === side);
    $(team + "-count").textContent = remaining.length + " pieces" + (kings ? " · " + kings + (kings === 1 ? " king" : " kings") : "");
    $(team + "-wins").textContent = wins[side] + (wins[side] === 1 ? " win" : " wins");
  }
  cells.forEach((square, index) => {
    const piece = game.board[index];
    const king = Math.abs(piece) === 2;
    const destination = moves.some(move => move.from === selected && move.to === index);
    const selectable = moves.some(move => move.from === index);
    square.setAttribute("aria-label", coordinate(index) + (piece ? " " + pieces[Math.sign(piece)] + (king ? " king" : " piece") : "") +
      (destination ? ", legal destination" : ""));
    square.setAttribute("aria-pressed", String(index === selected));
    square.disabled = Boolean(game.winner) || botTurn() || (!destination && !selectable);
    square.classList.toggle("target", destination);
    square.classList.toggle("capture-target", destination && moves.some(move => move.from === selected && move.to === index && move.capture !== null));
    square.classList.toggle("last-move", lastMove?.from === index || lastMove?.to === index);
    square.classList.toggle("selectable", selectable && !botTurn());
    square.replaceChildren();
    if (piece) {
      const token = document.createElement("span");
      token.className = "piece " + (piece > 0 ? "emerald" : "crimson") + (king ? " king" : "");
      const image = document.createElement("img");
      image.src = portraits[Math.sign(piece)];
      image.alt = "";
      token.append(image);
      square.append(token);
    }
  });
}

function makeMove(move) {
  const previous = game;
  if (previous.chain === null && !botTurn()) undoHistory.push({ game, lastMove, moveNumber });
  game = play(game, move.from, move.to);
  if (game.winner) wins[game.winner]++;
  lastMove = move;
  const list = $("move-log");
  const notation = coordinate(move.from) + (move.capture === null ? "–" : "×") + coordinate(move.to) +
    (Math.abs(game.board[move.to]) > Math.abs(previous.board[move.from]) ? " ♛" : "");
  if (previous.chain !== null) {
    list.lastElementChild.lastElementChild.textContent += " " + notation;
  } else {
    const entry = document.createElement("li");
    entry.value = ++moveNumber;
    const team = document.createElement("strong");
    team.textContent = previous.turn === -1 && $("mode").value === "bot" ? "Kekbot" : pieces[previous.turn];
    const moveText = document.createElement("span");
    moveText.textContent = notation;
    entry.append(team, moveText);
    list.append(entry);
  }
  $("moves-empty").hidden = true;
  list.scrollTop = list.scrollHeight;
}

function selectSquare(index) {
  if (botTurn() || game.winner) return;
  const moves = legalMoves(game);
  const move = moves.find(candidate => candidate.from === selected && candidate.to === index);
  if (move) {
    makeMove(move);
    selected = game.chain;
    render();
    scheduleBot();
    const nextCell = selected === null ? cells.find(cell => !cell.disabled) : cells[selected];
    nextCell?.focus();
  } else if (moves.some(move => move.from === index)) {
    selected = index;
    render();
  }
}

function scheduleBot() {
  if (!botTurn()) return;
  botTimer = setTimeout(() => {
    const move = botMove(game, $("difficulty").value);
    if (!move) return;
    makeMove(move);
    render();
    scheduleBot();
  }, 450);
}

function restart() {
  clearTimeout(botTimer);
  undoHistory.length = 0;
  game = newGame();
  selected = null;
  lastMove = undefined;
  moveNumber = 0;
  $("move-log").replaceChildren();
  $("moves-empty").hidden = false;
  render();
}

$("undo").onclick = () => {
  const snapshot = undoHistory.pop();
  if (!snapshot) return;
  clearTimeout(botTimer);
  if (game.winner) wins[game.winner]--;
  ({ game, lastMove, moveNumber } = snapshot);
  selected = null;
  const log = $("move-log");
  while (log.children.length > moveNumber) log.lastElementChild.remove();
  $("moves-empty").hidden = moveNumber > 0;
  render();
  if ($("undo").disabled) cells.find(cell => !cell.disabled)?.focus();
};
$("restart").onclick = restart;
function resetSeries() {
  wins[1] = wins[-1] = 0;
  restart();
}
$("reset-series").onclick = resetSeries;
$("mode").addEventListener("change", resetSeries);
$("difficulty").addEventListener("change", resetSeries);
render();
