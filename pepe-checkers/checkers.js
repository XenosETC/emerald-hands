import { analyzeHint, botMove, captureRoutes, isFinished, legalMoves, newGame, play, previewRepetition, repetitionCount, repetitionLimit } from "./engine.mjs?v=draw-2";
import { decodeMatch, encodeMatch, matchKey } from "./match-save.mjs?v=draw-2";

const $ = id => document.getElementById(id);
const pieces = { 1: "Emerald", "-1": "Crimson" };
const portraits = { 1: "../pepe-poker/avatars/emerald.webp", "-1": "../pepe-poker/avatars/fallen.webp" };
const board = $("board");
const settingsKey = "pepe-checkers:settings";
let game = newGame();
let selected = null;
let routePreview = null;
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
let draws = 0;
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
  return $("mode").value === "bot" && game.turn === -1 && !isFinished(game);
}

function playerName(side) {
  return side === -1 && $("mode").value === "bot" ? "Kekbot" : pieces[side];
}

function reviewLabel(position) {
  if (position.turn === 0) return "Starting position";
  const turn = "Turn " + position.turn;
  return position.jumps > 1 || position.game.chain !== null ? turn + " · Jump " + position.jumps : turn;
}

function renderRepetition(position, drawTargets) {
  const status = $("repetition-status");
  const { game: shownGame } = position;
  const occurrences = repetitionCount(shownGame);
  const label = shownGame.repetitionHistory === false ? "Original rules · Repetition draws start next game."
    : shownGame.chain !== null ? "Repetition is counted after the final jump."
    : shownGame.winner ? ""
    : "Position occurrences: " + occurrences + " of " + repetitionLimit;
  status.hidden = !label;
  if (status.textContent !== label) status.textContent = label;
  status.classList.toggle("near-draw", occurrences === repetitionLimit - 1);

  const warning = $("repetition-warning");
  const squares = [...drawTargets].map(index => coordinate(index).toUpperCase()).join(", ");
  const message = drawTargets.size ? "Draw by repetition if you move to " + squares + "." : "";
  warning.hidden = !message;
  if (warning.textContent !== message) warning.textContent = message;
}

function defeatReason() {
  const loser = -game.winner;
  const hasPieces = game.board.some(piece => Math.sign(piece) === loser);
  return playerName(loser) + (hasPieces ? " has no legal moves." : " has no pieces left.");
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
    guide = position.game.draw ? "Final position · Draw by repetition."
      : position.game.chain === null ? "Reviewing the match." : "Reviewing a jump in progress.";
    state = "review";
  } else if (game.winner) {
    title = playerName(game.winner) + " wins";
    guide = defeatReason();
    state = "result";
  } else if (game.draw) {
    title = "Draw by repetition";
    guide = "The same board and player to move occurred three times.";
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
    guide = selected === null ? "Only pieces marked in gold can move." : "Choose a capture ring. Red outlines pieces you can jump.";
    state = "capture";
  } else if (selected !== null) {
    guide = "Choose a marked destination for " + coordinate(selected).toUpperCase() + ".";
  }
  if (hint && reviewIndex === null) {
    const first = hint.path[0];
    const action = first.capture === null ? "move" : "jump";
    const from = coordinate(first.from).toUpperCase();
    const to = coordinate(first.to).toUpperCase();
    guide = "Suggested " + action + " from " + from + " to " + to + ". Read the full hint below the board.";
  }
  $("status").dataset.state = state;
  if ($("turn-title").textContent !== title) $("turn-title").textContent = title;
  if ($("turn-guide").textContent !== guide) $("turn-guide").textContent = guide;
}

const routeList = $("capture-routes");

function routeLabel(path) {
  return [path[0].from, ...path.map(move => move.to)]
    .map(index => coordinate(index).toUpperCase()).join(" × ");
}

function paintRoutePreview() {
  board.querySelectorAll(".route-marker").forEach(marker => marker.remove());
  for (const button of routeList.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button.dataset.route === routePreview?.label));
  }
  if (!routePreview) {
    $("route-preview-status").textContent = "";
    return;
  }
  const { path, label } = routePreview;
  const stepsBySquare = new Map([[path[0].from, ["Start"]]]);
  path.forEach(({ to }, index) => {
    const steps = stepsBySquare.get(to) ?? [];
    stepsBySquare.set(to, [...steps, String(index + 1)]);
  });
  for (const [square, steps] of stepsBySquare) {
    const marker = document.createElement("span");
    marker.className = "route-marker";
    marker.setAttribute("aria-hidden", "true");
    marker.textContent = steps.join(" · ");
    cells[square].append(marker);
  }
  const message = "Previewing " + label + ". The board position is unchanged.";
  if ($("route-preview-status").textContent !== message) $("route-preview-status").textContent = message;
}

function clearRoutePreview(event) {
  if (event.key !== "Escape" || !routePreview) return false;
  routePreview = null;
  paintRoutePreview();
  event.preventDefault();
  return true;
}

routeList.addEventListener("keydown", clearRoutePreview);

function renderCaptureRoutes(moves, waiting) {
  const panel = $("capture-panel");
  const forced = !waiting && moves[0]?.capture != null;
  panel.hidden = !forced;
  if (!forced) {
    routePreview = null;
    routeList.replaceChildren();
    return;
  }

  const routes = captureRoutes(game).filter(route => selected === null || route.path[0].from === selected);
  $("capture-description").textContent = game.chain !== null
    ? "Finish the turn with the same piece."
    : "Choose any listed route. Once you start, finish the jumps with that piece.";
  if (routePreview && (routePreview.game !== game || !routes.some(({ path }) => routeLabel(path) === routePreview.label))) {
    routePreview = null;
  }
  routeList.replaceChildren(...routes.map(({ path, crowns }) => {
    const route = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    const label = routeLabel(path);
    button.dataset.route = label;
    button.setAttribute("aria-controls", "board");
    button.addEventListener("click", () => {
      routePreview = routePreview?.label === label ? null : { path, label, game };
      paintRoutePreview();
    });
    const notation = document.createElement("strong");
    notation.textContent = label;
    const detail = document.createElement("span");
    detail.textContent = path.length + (path.length === 1 ? " jump" : " jumps") + (crowns ? " · crowns" : "");
    button.append(notation, detail);
    route.append(button);
    return route;
  }));
}

function clearHint() {
  if (hint && routePreview?.path === hint.path) routePreview = null;
  hint = null;
}

function renderHint(moves, waiting, reviewing) {
  const button = $("hint");
  button.hidden = $("mode").value === "local" || isFinished(game);
  button.disabled = reviewing || waiting || !moves.length;
  const visible = Boolean(hint) && !button.hidden && !button.disabled;
  button.setAttribute("aria-expanded", String(visible));
  button.textContent = visible ? "Hide hint" : "Show hint";
  $("hint-panel").hidden = !visible;
  if (!visible) return;

  const { path, crowns, draws, wins, recapturable, capturedKings } = hint;
  const [first] = path;
  const capture = first.capture !== null;
  const details = [];
  if (capture) {
    const captured = path.length + (path.length === 1 ? " piece" : " pieces");
    const kings = capturedKings ? ", including " + capturedKings + (capturedKings === 1 ? " king" : " kings") : "";
    details.push("Capturing is required. This route takes " + captured + kings + ".");
  }
  if (crowns) details.push("It crowns your piece.");
  if (wins) details.push("It wins the game this turn.");
  else if (draws) details.push("It repeats the position for the third time and draws the game.");
  else if (recapturable) details.push("The opponent can immediately jump your piece afterward.");
  else details.push("The opponent has no immediate jump over your piece afterward.");

  $("hint-path").textContent = capture ? routeLabel(path)
    : coordinate(first.from).toUpperCase() + " → " + coordinate(first.to).toUpperCase();
  $("hint-detail").textContent = details.join(" ");
}

function renderResult(reviewing) {
  const finished = isFinished(game);
  $("match-result").hidden = reviewing || !finished;
  $("restart").hidden = finished;
  $("review").hidden = finished;
  const drawLabel = draws + (draws === 1 ? " draw" : " draws");
  $("series-draws").hidden = !draws;
  $("series-draws").textContent = drawLabel + " in this series";
  if (!finished || reviewing) return;
  const games = wins[1] + wins[-1] + draws;
  const gamesLabel = games === 1 ? "1 game" : games + " games";
  const score = wins[1] + "–" + wins[-1];
  $("series-score").textContent = "Series after " + gamesLabel + " · Emerald " + score + " " + playerName(-1) + (draws ? " · " + drawLabel : "");
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
  renderResult(reviewing);
  $("reset-series").hidden = !wins[1] && !wins[-1] && !draws;
  const waiting = botTurn();
  const moves = reviewing ? [] : legalMoves(game);
  const selectedMoves = waiting ? [] : moves.filter(move => move.from === selected);
  const captureVictims = new Set(selectedMoves.map(move => move.capture));
  const drawTargets = new Set(selectedMoves
    .filter(({ from, to, capture }) => capture === null && previewRepetition(game, from, to) === repetitionLimit)
    .map(({ to }) => to));
  board.dataset.forcedCapture = String(!waiting && moves[0]?.capture != null);
  renderCaptureRoutes(moves, waiting);
  $("moves-help").hidden = moveNumber === 0;
  $("share-match").hidden = moveNumber === 0;
  renderHint(moves, waiting, reviewing);
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
  renderRepetition(position, drawTargets);
  $("crimson-name").textContent = playerName(-1);
  for (const side of [1, -1]) {
    const team = pieces[side].toLowerCase();
    const remaining = position.game.board.filter(piece => Math.sign(piece) === side);
    const kings = remaining.filter(piece => Math.abs(piece) === 2).length;
    const card = $(team + "-team");
    card.classList.toggle("active", !reviewing && !isFinished(game) && game.turn === side);
    card.classList.toggle("winner", !reviewing && game.winner === side);
    $(team + "-count").textContent = remaining.length + (remaining.length === 1 ? " piece" : " pieces") +
      (kings ? " · " + kings + (kings === 1 ? " king" : " kings") : "");
    $(team + "-wins").textContent = wins[side] + (wins[side] === 1 ? " win" : " wins");
  }
  if (!board.contains(document.activeElement)) focusIndex = selected ?? (!waiting ? moves[0]?.from : null) ?? lastMove?.to ?? 1;
  cells.forEach((square, index) => {
    if (square.disabled) return;
    const piece = position.game.board[index];
    const king = Math.abs(piece) === 2;
    const destination = selectedMoves.find(move => move.to === index);
    const selectable = !waiting && moves.some(move => move.from === index);
    const capture = destination && destination.capture !== null;
    square.tabIndex = index === focusIndex ? 0 : -1;
    const description = piece ? " " + playerName(Math.sign(piece)) + (king ? " king" : " piece") : ", empty";
    const victim = captureVictims.has(index);
    const action = destination ? capture ? ", capture destination" : ", legal destination"
      : selectable ? ", can move" : victim ? ", can be captured" : "";
    const suggested = !reviewing && hint?.path[0].to === index;
    const drawDestination = drawTargets.has(index);
    square.setAttribute("aria-label", coordinate(index) + description + action + (suggested ? ", suggested" : "") + (drawDestination ? ", draws by repetition" : ""));
    square.setAttribute("aria-pressed", String(!reviewing && index === selected));
    square.setAttribute("aria-disabled", String(!destination && !selectable));
    square.classList.toggle("target", Boolean(destination));
    square.classList.toggle("capture-target", Boolean(capture));
    square.classList.toggle("capture-victim", victim);
    square.classList.toggle("suggested-target", suggested);
    square.classList.toggle("draw-target", drawDestination);
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
  paintRoutePreview();
}

function makeMove(move, { restoring = false } = {}) {
  const previous = game;
  if (previous.chain === null && !botTurn()) {
    undoHistory.push({ game, lastMove, moveNumber, positionCount: positions.length });
  }
  game = play(game, move.from, move.to);
  if (game.winner) wins[game.winner]++;
  if (game.draw) draws++;
  const crowned = Math.abs(game.board[move.to]) > Math.abs(previous.board[move.from]);
  lastMove = { ...move, side: previous.turn, crowned };
  clearHint();
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
  if (!restoring) {
    list.scrollTop = list.scrollHeight;
    saveMatch();
  }
}

function selectSquare(index) {
  if (reviewIndex !== null || botTurn() || isFinished(game)) return;
  const moves = legalMoves(game);
  const move = moves.find(candidate => candidate.from === selected && candidate.to === index);
  if (move) {
    makeMove(move);
    selected = game.chain;
    render();
    scheduleBot();
    if (board.contains(document.activeElement)) cells[move.to].focus();
  } else if (moves.some(move => move.from === index)) {
    clearHint();
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
  if (index < 0 || clearRoutePreview(event)) return;
  if (event.key === "Escape" && reviewIndex === null && selected !== null && game.chain === null) {
    selected = null;
    clearHint();
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
  clearHint();
  lastMove = undefined;
  moveNumber = 0;
  positions.splice(0, positions.length, { game, lastMove, turn: 0, jumps: 0 });
  reviewIndex = null;
  $("move-log").replaceChildren();
  $("moves-empty").hidden = false;
  saveMatch();
  render();
}

$("undo").onclick = () => {
  const snapshot = undoHistory.pop();
  if (!snapshot) return;
  clearTimeout(botTimer);
  if (game.winner) wins[game.winner]--;
  if (game.draw) draws--;
  ({ game, lastMove, moveNumber } = snapshot);
  positions.length = snapshot.positionCount;
  selected = null;
  clearHint();
  const log = $("move-log");
  while (log.children.length > moveNumber) log.lastElementChild.remove();
  $("moves-empty").hidden = moveNumber > 0;
  saveMatch();
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
  if (focusControls) {
    const returnButton = $("review-live");
    if (matchMedia("(max-width: 660px)").matches) {
      board.scrollIntoView({ block: "start" });
      const { bottom } = returnButton.getBoundingClientRect();
      (bottom <= window.innerHeight ? returnButton : cells[focusIndex]).focus({ preventScroll: true });
    } else {
      returnButton.focus();
    }
  }
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
$("review-result").onclick = $("review").onclick;
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
  (isFinished(game) ? $("review-result") : cells[focusIndex])?.focus();
  scheduleBot();
}
$("review-live").onclick = returnToGame;
$("review-controls").addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  returnToGame();
});
$("hint").onclick = () => {
  if (botTurn() || isFinished(game)) return;
  if (hint) {
    clearHint();
    render();
    return;
  }
  hint = analyzeHint(game);
  if (!hint) return;
  const [first] = hint.path;
  if (first.capture !== null) {
    routePreview = { path: hint.path, label: routeLabel(hint.path), game };
  }
  selected = first.from;
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

function formatTranscript() {
  const opponent = playerName(-1);
  const mode = $("mode").value === "local" ? "Local two-player"
    : $("difficulty").selectedOptions[0].textContent + " difficulty";
  const turns = [];
  for (const { turn, lastMove: move } of positions.slice(1)) {
    const from = coordinate(move.from).toUpperCase();
    const to = coordinate(move.to).toUpperCase();
    const suffix = (move.capture === null ? " – " : " × ") + to + (move.crowned ? " (crowned)" : "");
    if (turn > turns.length) turns.push(turn + ". " + playerName(move.side) + " " + from + suffix);
    else turns[turn - 1] += suffix;
  }
  let result = "In progress. " + playerName(game.turn) + " to move.";
  if (game.winner) result = playerName(game.winner) + " wins. " + defeatReason();
  else if (game.draw) result = "Draw by repetition.";
  else if (game.chain !== null) {
    result = "In progress. " + playerName(game.turn) + " to continue the jump from " + coordinate(game.chain).toUpperCase() + ".";
  }
  return ["Pepe Checkers", "Emerald vs. " + opponent + " · " + mode, "", ...turns, "", "Result: " + result, ""].join("\n");
}

const transcriptDialog = $("transcript-dialog");
const transcriptText = $("transcript-text");
const transcriptFeedback = $("transcript-feedback");
const downloadTranscript = $("download-transcript");

$("share-match").onclick = () => {
  const text = formatTranscript();
  transcriptText.value = text;
  transcriptFeedback.textContent = "";
  downloadTranscript.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  transcriptDialog.showModal();
};

$("copy-transcript").onclick = async () => {
  const text = transcriptText.value;
  try {
    await navigator.clipboard.writeText(text);
    if (transcriptDialog.open && transcriptText.value === text) transcriptFeedback.textContent = "Copied.";
  } catch {
    if (!transcriptDialog.open || transcriptText.value !== text) return;
    transcriptText.focus();
    transcriptText.select();
    transcriptFeedback.textContent = "Copy the selected text, or choose Download text.";
  }
};

transcriptDialog.addEventListener("close", () => {
  URL.revokeObjectURL(downloadTranscript.href);
  downloadTranscript.removeAttribute("href");
});

function showSaveStatus(message) {
  const status = $("save-status");
  status.textContent = message;
  status.hidden = !message;
}

function saveMatch() {
  try {
    if (!moveNumber && !wins[1] && !wins[-1] && !draws) {
      localStorage.removeItem(matchKey);
      showSaveStatus("");
      return;
    }
    const moves = positions.slice(1).map(({ lastMove }) => [lastMove.from, lastMove.to]);
    const raw = encodeMatch({
      mode: $("mode").value, difficulty: $("difficulty").value, moves, wins, draws,
      repetition: game.repetitionHistory !== false,
    });
    if (raw === null) {
      localStorage.removeItem(matchKey);
      showSaveStatus("This match is too long to save.");
      return;
    }
    localStorage.setItem(matchKey, raw);
    showSaveStatus("Saved on this device.");
  } catch {
    showSaveStatus("Couldn’t update the local save.");
  }
}

function restoreMatch() {
  let saved;
  try {
    saved = decodeMatch(localStorage.getItem(matchKey), $("mode").value, $("difficulty").value);
  } catch {
    return;
  }
  if (!saved) return;
  game = newGame({ repetition: saved.repetition });
  positions[0].game = game;
  for (const move of saved.moves) makeMove(move, { restoring: true });
  const log = $("move-log");
  log.scrollTop = log.scrollHeight;
  wins[1] = saved.wins[1];
  wins[-1] = saved.wins[-1];
  draws = saved.draws;
  selected = game.chain;
  showSaveStatus(saved.moves.length ? "Match restored from this device." : "Series score restored from this device.");
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
$("rematch").onclick = () => {
  restart();
  cells[focusIndex]?.focus();
};
function resetSeries() {
  wins[1] = wins[-1] = 0;
  draws = 0;
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
restoreMatch();
render();
scheduleBot();
