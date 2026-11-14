import { botMove, legalMoves, newGame, play } from "./engine.mjs?v=difficulty-1";

const $ = id => document.getElementById(id);
const pieces = { 1: "Emerald", "-1": "Crimson" };
const portraits = { 1: "../pepe-poker/avatars/emerald.webp", "-1": "../pepe-poker/avatars/fallen.webp" };
const board = $("board");
const settingsKey = "pepe-checkers:settings";
let game = newGame();
let selected = null;
let hint = null;
let flipped = false;
let focusIndex = null;
let botTimer;
let lastMove;
let moveNumber = 0;
const undoHistory = [];
const positions = [{ game, lastMove, turn: 0, jumps: 0 }];
let reviewIndex = null;
let replayTimer = null;
const replayInterval = 750;
const replaySpeed = $("review-speed");
const wins = { 1: 0, "-1": 0 };
const coordinate = index => "abcdefgh"[index % 8] + (8 - Math.floor(index / 8));
const cells = Array.from({ length: 64 }, (_, index) => {
  const square = document.createElement("button");
  square.type = "button";
  square.className = (Math.floor(index / 8) + index % 8) % 2 ? "dark" : "light";
  if (square.className === "light") {
    square.disabled = true;
    square.setAttribute("aria-hidden", "true");
  }
  square.tabIndex = -1;
  square.onclick = () => selectSquare(index);
  return square;
});
board.append(...cells);

function botTurn() {
  return $("mode").value === "bot" && game.turn === -1 && !game.winner;
}

function playerName(side) {
  return side === -1 && $("mode").value === "bot" ? "Kekbot" : pieces[side];
}

function reviewLabel(position) {
  if (position.turn === 0) return "Starting position";
  const turn = "Turn " + position.turn;
  return position.jumps > 1 || position.game.chain !== null ? turn + " · Jump " + position.jumps : turn;
}

function renderStatus(moves, waiting, position) {
  const capture = moves.length > 0 && moves[0].capture !== null;
  const continuing = game.chain !== null;
  const activePlayer = playerName(game.turn);
  let title = activePlayer + " to move";
  let guide = "Select a highlighted piece to see its moves.";
  let state = "turn";
  if (reviewIndex !== null) {
    title = reviewLabel(position);
    guide = position.game.chain === null ? "Reviewing the match." : "Reviewing a jump in progress.";
    state = "review";
  } else if (game.winner) {
    title = playerName(game.winner) + " wins";
    guide = "Start a rematch or review the move log.";
    state = "result";
  } else if (waiting) {
    title = "Kekbot is thinking…";
    guide = "Your turn resumes after its move.";
    state = "thinking";
  } else if (continuing) {
    title = "Jump again";
    guide = "Continue with " + coordinate(game.chain).toUpperCase() + " by choosing a capture ring.";
    state = "capture";
  } else if (capture) {
    title = activePlayer + " must capture";
    guide = selected === null ? "Select a highlighted piece to jump." : "Choose a capture ring to jump.";
    state = "capture";
  } else if (selected !== null) {
    guide = "Choose a marked destination for " + coordinate(selected).toUpperCase() + ".";
  }
  if (hint && reviewIndex === null) {
    const from = coordinate(hint.from).toUpperCase();
    const to = coordinate(hint.to).toUpperCase();
    const action = hint.capture === null ? "move" : "jump";
    guide = "Suggested " + action + ": " + from + " to " + to + ".";
  }
  $("status").dataset.state = state;
  if ($("turn-title").textContent !== title) $("turn-title").textContent = title;
  if ($("turn-guide").textContent !== guide) $("turn-guide").textContent = guide;
}

function render() {
  const reviewing = reviewIndex !== null;
  const position = reviewing ? positions[reviewIndex] : { game, lastMove };
  $("review-controls").hidden = !reviewing;
  $("review").disabled = positions.length < 2 || reviewing;
  $("review-prev").setAttribute("aria-disabled", String(!reviewing || reviewIndex === 0));
  $("review-next").setAttribute("aria-disabled", String(!reviewing || reviewIndex === positions.length - 1));
  $("review-position").textContent = reviewing ? reviewIndex + " of " + (positions.length - 1) : "";
  if (reviewing) {
    const play = $("review-play");
    const label = replayTimer !== null ? "Pause replay" : reviewIndex === positions.length - 1 ? "Replay from start" : "Play replay";
    if (play.textContent !== label) play.textContent = label;
    $("status").setAttribute("aria-live", replayTimer === null ? "polite" : "off");
    const scrubber = $("review-scrubber");
    scrubber.max = positions.length - 1;
    scrubber.value = reviewIndex;
    scrubber.setAttribute("aria-valuetext", reviewLabel(position) + ", position " + $("review-position").textContent);
  }
  if (!reviewing) $("status").setAttribute("aria-live", "polite");
  for (const id of ["mode", "difficulty", "restart", "reset-series"]) $(id).disabled = reviewing;
  Array.from($("move-log").children).forEach((entry, index) => {
    const link = entry.firstElementChild;
    if (reviewing && position.turn === index + 1) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
  $("difficulty-setting").hidden = $("mode").value !== "bot";
  $("undo").disabled = reviewing || !undoHistory.length;
  $("restart").textContent = game.winner ? "Rematch" : "Restart game";
  $("reset-series").hidden = !wins[1] && !wins[-1];
  const waiting = botTurn();
  const moves = reviewing ? [] : legalMoves(game);
  $("hint").hidden = $("mode").value === "local";
  $("hint").disabled = reviewing || waiting || !moves.length || Boolean(hint);
  const shownMove = position.lastMove;
  $("last-play").hidden = !shownMove;
  if (shownMove) {
    const from = coordinate(shownMove.from).toUpperCase();
    const to = coordinate(shownMove.to).toUpperCase();
    const action = shownMove.capture === null ? " moved " : " jumped ";
    $("last-play").textContent = playerName(shownMove.side) + action + from + " → " + to +
      (shownMove.crowned ? " · Crowned" : "");
  }
  renderStatus(moves, waiting, position);
  $("crimson-name").textContent = playerName(-1);
  for (const side of [1, -1]) {
    const team = pieces[side].toLowerCase();
    const remaining = position.game.board.filter(piece => Math.sign(piece) === side);
    const kings = remaining.filter(piece => Math.abs(piece) === 2).length;
    $(team + "-team").classList.toggle("active", !reviewing && !game.winner && game.turn === side);
    $(team + "-count").textContent = remaining.length + (remaining.length === 1 ? " piece" : " pieces") +
      (kings ? " · " + kings + (kings === 1 ? " king" : " kings") : "");
    $(team + "-wins").textContent = wins[side] + (wins[side] === 1 ? " win" : " wins");
  }
  if (!board.contains(document.activeElement)) focusIndex = selected ?? (!waiting ? moves[0]?.from : null) ?? lastMove?.to ?? 1;
  cells.forEach((square, index) => {
    if (square.disabled) return;
    const piece = position.game.board[index];
    const king = Math.abs(piece) === 2;
    const destination = !waiting && moves.find(move => move.from === selected && move.to === index);
    const selectable = !waiting && moves.some(move => move.from === index);
    const capture = destination && destination.capture !== null;
    square.tabIndex = index === focusIndex ? 0 : -1;
    const description = piece ? " " + playerName(Math.sign(piece)) + (king ? " king" : " piece") : ", empty";
    const action = destination ? capture ? ", capture destination" : ", legal destination" : selectable ? ", can move" : "";
    const suggested = !reviewing && hint?.to === index;
    square.setAttribute("aria-label", coordinate(index) + description + action + (suggested ? ", suggested" : ""));
    square.setAttribute("aria-pressed", String(!reviewing && index === selected));
    square.setAttribute("aria-disabled", String(!destination && !selectable));
    square.classList.toggle("target", Boolean(destination));
    square.classList.toggle("capture-target", Boolean(capture));
    square.classList.toggle("suggested-target", suggested);
    square.classList.toggle("last-move", shownMove?.from === index || shownMove?.to === index);
    square.classList.toggle("selectable", selectable);
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
  if (previous.chain === null && !botTurn()) {
    undoHistory.push({ game, lastMove, moveNumber, positionCount: positions.length });
  }
  game = play(game, move.from, move.to);
  if (game.winner) wins[game.winner]++;
  const crowned = Math.abs(game.board[move.to]) > Math.abs(previous.board[move.from]);
  lastMove = { ...move, side: previous.turn, crowned };
  hint = null;
  const list = $("move-log");
  const notation = coordinate(move.from) + (move.capture === null ? "–" : "×") + coordinate(move.to) +
    (crowned ? " ♛" : "");
  if (previous.chain !== null) {
    list.lastElementChild.querySelector("span").textContent += " " + notation;
  } else {
    const entry = document.createElement("li");
    entry.value = ++moveNumber;
    const team = document.createElement("strong");
    team.textContent = playerName(previous.turn);
    const moveText = document.createElement("span");
    moveText.textContent = notation;
    const review = document.createElement("button");
    review.type = "button";
    const turn = moveNumber;
    review.onclick = () => showPosition(positions.findLastIndex(position => position.turn === turn), true);
    review.append(team, moveText);
    entry.append(review);
    list.append(entry);
  }
  const jumps = move.capture === null ? 0 : previous.chain === null ? 1 : positions.at(-1).jumps + 1;
  positions.push({ game, lastMove, turn: moveNumber, jumps });
  $("moves-empty").hidden = true;
  list.scrollTop = list.scrollHeight;
}

function selectSquare(index) {
  if (reviewIndex !== null || botTurn() || game.winner) return;
  const moves = legalMoves(game);
  const move = moves.find(candidate => candidate.from === selected && candidate.to === index);
  if (move) {
    makeMove(move);
    selected = game.chain;
    render();
    scheduleBot();
    if (board.contains(document.activeElement)) cells[move.to].focus();
  } else if (moves.some(move => move.from === index)) {
    hint = null;
    selected = selected === index && game.chain === null ? null : index;
    render();
  }
}

board.addEventListener("focusin", event => {
  const index = cells.indexOf(event.target);
  if (index < 0 || index === focusIndex) return;
  cells[focusIndex]?.setAttribute("tabindex", "-1");
  focusIndex = index;
  cells[index].tabIndex = 0;
});

board.addEventListener("keydown", event => {
  const index = cells.indexOf(event.target);
  if (index < 0) return;
  if (event.key === "Escape" && reviewIndex === null && selected !== null && game.chain === null) {
    selected = null;
    hint = null;
    render();
    event.preventDefault();
    return;
  }
  const row = Math.floor(index / 8);
  const column = index % 8;
  const direction = { ArrowLeft: -2, ArrowRight: 2, ArrowUp: -8, ArrowDown: 8 }[event.key];
  if (direction === undefined) return;
  const offset = flipped ? -direction : direction;
  event.preventDefault();
  const next = Math.abs(offset) === 8
    ? (row + offset / 8) * 8 + (column ^ 1)
    : column + offset >= 0 && column + offset < 8 ? index + offset : -1;
  if (next >= 0 && next < cells.length) cells[next].focus();
});

function scheduleBot() {
  if (reviewIndex !== null || !botTurn()) return;
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
  stopReplay();
  undoHistory.length = 0;
  game = newGame();
  selected = null;
  hint = null;
  lastMove = undefined;
  moveNumber = 0;
  positions.splice(0, positions.length, { game, lastMove, turn: 0, jumps: 0 });
  reviewIndex = null;
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
  positions.length = snapshot.positionCount;
  selected = null;
  hint = null;
  const log = $("move-log");
  while (log.children.length > moveNumber) log.lastElementChild.remove();
  $("moves-empty").hidden = moveNumber > 0;
  render();
  if ($("undo").disabled) cells[legalMoves(game)[0]?.from]?.focus();
};

function showPosition(index, focusControls = false) {
  stopReplay();
  if (index < 0 || index >= positions.length) {
    render();
    return;
  }
  clearTimeout(botTimer);
  reviewIndex = index;
  render();
  if (focusControls) $("review-live").focus();
}

function stopReplay() {
  clearTimeout(replayTimer);
  replayTimer = null;
}

function advanceReplay() {
  reviewIndex++;
  if (reviewIndex === positions.length - 1) stopReplay();
  else queueReplayStep();
  render();
}

function queueReplayStep() {
  clearTimeout(replayTimer);
  replayTimer = setTimeout(advanceReplay, replayInterval / Number(replaySpeed.value));
}

$("review").onclick = () => showPosition(positions.length - 1, true);
$("review-prev").onclick = () => showPosition(reviewIndex - 1);
$("review-next").onclick = () => showPosition(reviewIndex + 1);
const reviewScrubber = $("review-scrubber");
reviewScrubber.oninput = event => showPosition(event.target.valueAsNumber);
reviewScrubber.addEventListener("pointerdown", () => {
  if (replayTimer === null) return;
  stopReplay();
  render();
});
$("review-play").onclick = () => {
  if (reviewIndex === null || document.hidden) return;
  if (replayTimer !== null) stopReplay();
  else {
    if (reviewIndex === positions.length - 1) reviewIndex = 0;
    queueReplayStep();
  }
  render();
};
replaySpeed.addEventListener("change", () => {
  if (replayTimer !== null) queueReplayStep();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && replayTimer !== null) {
    stopReplay();
    render();
  }
});
function returnToGame() {
  stopReplay();
  reviewIndex = null;
  render();
  cells[focusIndex]?.focus();
  scheduleBot();
}
$("review-live").onclick = returnToGame;
$("review-controls").addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  returnToGame();
});
$("hint").onclick = () => {
  if (botTurn() || game.winner) return;
  hint = botMove(game, "expert") ?? null;
  if (!hint) return;
  selected = hint.from;
  render();
  cells[selected].focus();
};
function setOrientation(value) {
  if (flipped === value) return;
  flipped = value;
  $("flip").setAttribute("aria-pressed", String(flipped));
  board.append(...(flipped ? cells.slice().reverse() : cells));
  for (const label of document.querySelectorAll(".board-ranks, .board-files")) {
    label.append(...Array.from(label.children).reverse());
  }
}

function saveSettings() {
  try {
    localStorage.setItem(settingsKey, JSON.stringify({
      mode: $("mode").value,
      difficulty: $("difficulty").value,
      flipped
    }));
  } catch { /* Play still works when storage is blocked. */ }
}

function restoreSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(settingsKey));
    for (const id of ["mode", "difficulty"]) {
      if (Array.from($(id).options).some(option => option.value === settings?.[id])) {
        $(id).value = settings[id];
      }
    }
    setOrientation(settings?.flipped === true);
  } catch { /* Keep the default settings if the saved settings cannot be read. */ }
}

$("flip").onclick = () => {
  setOrientation(!flipped);
  saveSettings();
};
$("restart").onclick = restart;
function resetSeries() {
  wins[1] = wins[-1] = 0;
  restart();
}
$("reset-series").onclick = resetSeries;
for (const id of ["mode", "difficulty"]) {
  $(id).addEventListener("change", () => {
    saveSettings();
    resetSeries();
  });
}
restoreSettings();
render();
