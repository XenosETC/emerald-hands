(() => {
  "use strict";

  const { Chess, DEFAULT_POSITION } = window.PepeChessRules;
  const saveKey = "emerald-pepe-chess-match-v1";
  const game = new Chess();
  const board = document.querySelector(".board");
  const flipButton = document.querySelector("#flip-board");
  const undoButton = document.querySelector("#undo");
  const boardMove = document.querySelector("#board-move");
  const threatButton = document.querySelector("#show-threats");
  const threatNote = document.querySelector("#threat-note");
  let showThreats = false;
  const status = document.querySelector("#match-status");
  const promotion = document.querySelector("#promotion");
  const moveList = document.querySelector("#move-list");
  const moveScroll = document.querySelector("#move-scroll");
  const emptyHistory = document.querySelector("#empty-history");
  const exportButton = document.querySelector("#export");
  const importButton = document.querySelector("#import");
  const pgnFile = document.querySelector("#pgn-file");
  const importNote = document.querySelector("#import-note");
  const saveNote = document.querySelector("#save-note");
  const reviewControls = document.querySelector("#review-controls");
  const reviewStatus = document.querySelector("#review-status");
  const reviewHelp = document.querySelector("#review-help");
  const reviewStart = document.querySelector("#review-start");
  const reviewPrev = document.querySelector("#review-prev");
  const reviewNext = document.querySelector("#review-next");
  const reviewLive = document.querySelector("#review-live");
  const resetButton = document.querySelector("#reset");
  const modeSelect = document.querySelector("#match-mode");
  const takebackOption = document.querySelector("#no-takebacks");
  const blackSeatName = document.querySelector("#black-seat-name");
  const seats = { w: document.querySelector("#white-seat"), b: document.querySelector("#black-seat") };
  const captures = { w: document.querySelector("#white-captures"), b: document.querySelector("#black-captures") };
  const materialBadges = { w: document.querySelector("#white-material"), b: document.querySelector("#black-material") };
  const materialValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const roles = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
  const sides = { w: "White", b: "Black" };
  const squares = [...board.querySelectorAll("td")].map(cell => {
    const square = cell.getAttribute("aria-label");
    cell.removeAttribute("aria-label");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.square = square;
    button.tabIndex = square === "e2" ? 0 : -1;
    const image = cell.querySelector("img");
    if (image) button.append(image);
    cell.prepend(button);
    return button;
  });

  let selected = null;
  let pendingPromotion = null;
  let finished = false;
  let history = [];
  let result = "*";
  let reviewPly = null;
  let mode = "local";
  let noTakebacks = false;
  let savedMatch = null;
  let saveConflict = false;
  let botTimer;
  let flipped = false;
  let importAttempt = 0;

  function flipBoard() {
    flipped = !flipped;
    flipButton.setAttribute("aria-pressed", String(flipped));
    board.setAttribute("aria-label", `Chessboard, viewed from ${flipped ? "Black" : "White"}'s side`);
    board.before(seats[flipped ? "w" : "b"]);
    board.after(seats[flipped ? "b" : "w"]);

    const body = board.tBodies[0];
    for (const row of [...body.rows].reverse()) {
      row.append(...[...row.cells].reverse());
      body.append(row);
    }

    // Arrow keys and coordinate labels follow the displayed row and column order.
    const rankLabels = [...board.querySelectorAll(".rank")];
    const fileLabels = [...board.querySelectorAll(".file")];
    squares.reverse();
    for (const [index, square] of squares.entries()) {
      const [file, rank] = square.dataset.square;
      if (index % 8 === 0) {
        const label = rankLabels[index / 8];
        label.textContent = rank;
        square.parentElement.append(label);
      }
      if (index >= 56) {
        const label = fileLabels[index - 56];
        label.textContent = file;
        square.parentElement.append(label);
      }
    }
  }

  function isBotTurn() {
    return mode !== "local" && game.turn() === "b" && !finished;
  }

  function botName() {
    return mode === "club" ? "Club Kekbot" : "Kekbot";
  }

  function pieceSource(color, type) {
    return `assets/pieces-v1/${sides[color].toLowerCase()}-${roles[type]}.png`;
  }

  function restoreMatch() {
    try {
      savedMatch = window.localStorage.getItem(saveKey);
      if (savedMatch === null) return;
      const value = JSON.parse(savedMatch);
      const moves = Array.isArray(value) ? value : value.moves;
      const savedMode = Array.isArray(value) ? "local" : value.mode;
      if (!Array.isArray(moves)) throw new Error("Invalid move list");
      if (!["local", "bot", "club"].includes(savedMode)) throw new Error("Invalid match mode");
      for (const san of moves) {
        if (typeof san !== "string" || game.isGameOver()) throw new Error("Invalid saved move");
        history.push(game.move(san, { strict: true }));
      }
      mode = savedMode;
      noTakebacks = value.noTakebacks === true;
      saveNote.textContent = history.length ? "Match restored on this device." : "Matches save on this device.";
    } catch {
      game.reset();
      history = [];
      saveNote.textContent = "No saved match could be restored.";
    }
  }

  function showSaveConflict() {
    saveConflict = true;
    saveNote.textContent = history.length
      ? "Another tab changed the saved match. Download this tab’s PGN to keep its moves, then reload to resume the saved match."
      : "Another tab changed the saved match. Reload to resume the saved match.";
  }

  function saveMatch() {
    try {
      const storage = window.localStorage;
      if (saveConflict || storage.getItem(saveKey) !== savedMatch) {
        showSaveConflict();
        return;
      }
      if (history.length || mode !== "local" || noTakebacks) {
        const snapshot = JSON.stringify({ mode, noTakebacks, moves: history.map(move => move.san) });
        storage.setItem(saveKey, snapshot);
        savedMatch = snapshot;
      } else {
        storage.removeItem(saveKey);
        savedMatch = null;
      }
      saveNote.textContent = history.length ? "Match saved on this device." : "Matches save on this device.";
    } catch {
      saveNote.textContent = "Storage is unavailable. Download PGN to keep a record.";
    }
  }

  function renderMatchRecord() {
    const rows = [];
    for (const [index, move] of history.entries()) {
      const number = Math.floor(index / 2);
      if (index % 2 === 0) {
        const row = document.createElement("tr");
        row.insertCell().textContent = String(number + 1);
        row.insertCell();
        row.insertCell().textContent = "—";
        rows.push(row);
      }
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.ply = index + 1;
      button.textContent = move.san;
      button.setAttribute("aria-label", `Review move ${number + 1}, ${sides[move.color]} ${move.san}`);
      rows[number].cells[move.color === "w" ? 1 : 2].replaceChildren(button);
    }
    moveList.replaceChildren(...rows);
    const empty = history.length === 0;
    moveScroll.hidden = exportButton.disabled = reviewControls.hidden = reviewHelp.hidden = empty;
    emptyHistory.hidden = !empty;
    moveScroll.scrollTop = moveScroll.scrollHeight;
  }

  function renderCaptures(ply) {
    const capturedPieces = { w: [], b: [] };
    for (const move of history.slice(0, ply)) {
      if (move.captured) {
        const opponent = move.color === "w" ? "b" : "w";
        const image = document.createElement("img");
        image.src = pieceSource(opponent, move.captured);
        image.alt = `${sides[opponent]} ${roles[move.captured]}`;
        image.title = image.alt;
        capturedPieces[move.color].push(image);
      }
    }
    captures.w.replaceChildren(...capturedPieces.w);
    captures.b.replaceChildren(...capturedPieces.b);
  }

  function showPosition(ply) {
    if (pendingPromotion || (ply !== null && (ply === reviewPly || ply < 0 || ply > history.length))) return;
    reviewPly = ply;
    selected = null;
    const reviewing = ply !== null;
    const move = reviewing ? history[ply - 1] : null;
    const outcomes = [];
    if (move?.captured) outcomes.push(`Captured ${sides[move.color === "w" ? "b" : "w"]} ${roles[move.captured]}`);
    if (move?.promotion) outcomes.push(`Promoted to ${roles[move.promotion]}`);
    if (move?.san.endsWith("#")) outcomes.push("Checkmate");
    else if (move?.san.endsWith("+")) outcomes.push("Check");
    reviewStatus.textContent = move
      ? [`Review · Move ${Math.ceil(ply / 2)} · ${sides[move.color]} ${move.san}`, ...outcomes].join(" · ")
      : reviewing ? "Review · Starting position" : "Live position";
    reviewStart.setAttribute("aria-disabled", String(ply === 0));
    reviewPrev.setAttribute("aria-disabled", String(ply === 0));
    reviewNext.setAttribute("aria-disabled", String(!reviewing || ply === history.length));
    reviewLive.setAttribute("aria-disabled", String(!reviewing));
    resetButton.disabled = reviewing;
    undoButton.disabled = noTakebacks || reviewing || !history.length;
    undoButton.hidden = noTakebacks;
    undoButton.textContent = mode === "local" ? "Undo move" : "Undo turn";
    takebackOption.checked = noTakebacks;
    takebackOption.disabled = history.length > 0;
    for (const button of moveList.querySelectorAll("[data-ply]")) {
      if (Number(button.dataset.ply) === (ply ?? history.length)) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    }
    renderCaptures(ply ?? history.length);
    render();
    scheduleBot();
  }

  function render() {
    const reviewing = reviewPly !== null;
    const lastMove = reviewing ? history[reviewPly - 1] : history.at(-1);
    boardMove.hidden = !lastMove;
    boardMove.textContent = lastMove
      ? `${reviewing ? "Reviewed move" : "Last move"} · ${lastMove.from} → ${lastMove.to}`
      : "";
    const position = reviewing ? new Chess(lastMove?.after ?? DEFAULT_POSITION) : game;
    const threatened = new Set(showThreats ? squares.filter(button => {
      const square = button.dataset.square;
      const piece = position.get(square);
      return piece?.color === position.turn() && position.isAttacked(square, piece.color === "w" ? "b" : "w");
    }).map(button => button.dataset.square) : []);
    threatNote.hidden = !showThreats;
    threatNote.textContent = showThreats ? `${sides[position.turn()]}: ${threatened.size} ${threatened.size === 1 ? "piece is" : "pieces are"} attacked in this position. Rings show attacks, including defended pieces; they do not predict a safe move.` : "";
    const moves = selected ? game.moves({ square: selected, verbose: true }) : [];
    const targets = new Map(moves.map(move => [move.to, move]));
    const turn = sides[game.turn()];
    const check = game.isCheck();
    const mate = game.isCheckmate();
    const stalemate = game.isStalemate();
    const draw = game.isDraw();
    finished = mate || draw;
    result = mate ? (game.turn() === "w" ? "0-1" : "1-0") : draw ? "1/2-1/2" : "*";
    status.textContent = mate ? `Checkmate. ${game.turn() === "w" ? "Black" : "White"} wins.`
      : stalemate ? "Draw by stalemate."
      : game.isThreefoldRepetition() ? "Draw by threefold repetition."
      : game.isInsufficientMaterial() ? "Draw by insufficient material."
      : game.isDrawByFiftyMoves() ? "Draw by the fifty-move rule."
      : draw ? "Draw."
      : isBotTurn() ? `${botName()} to move.${check ? " Check." : ""}`
      : `${turn} to move.${check ? " Check." : ""}`;
    blackSeatName.textContent = mode === "local" ? "Black" : `Black · ${botName()}`;
    const positionCheck = reviewing ? position.isCheck() : check;
    const material = { w: 0, b: 0 };
    for (const [color, seat] of Object.entries(seats)) {
      seat.classList.toggle("is-active", !reviewing && !finished && game.turn() === color);
    }

    for (const button of squares) {
      const square = button.dataset.square;
      const piece = position.get(square);
      const move = targets.get(square);
      const label = piece ? `${sides[piece.color]} ${roles[piece.type]}` : "empty";
      button.setAttribute("aria-label", `${square}, ${label}${move ? ", legal destination" : ""}${threatened.has(square) ? ", under attack" : ""}`);
      button.classList.toggle("under-attack", threatened.has(square));
      button.setAttribute("aria-pressed", String(square === selected));
      button.setAttribute("aria-disabled", String(reviewing || finished || isBotTurn()));
      button.classList.toggle("legal", Boolean(move));
      button.classList.toggle("capture", Boolean(move?.captured));
      button.classList.toggle("last-move", lastMove?.from === square || lastMove?.to === square);
      button.classList.toggle("in-check", positionCheck && piece?.type === "k" && piece.color === position.turn());
      if (piece) {
        material[piece.color] += materialValues[piece.type];
        const image = button.firstElementChild || document.createElement("img");
        const src = pieceSource(piece.color, piece.type);
        if (image.getAttribute("src") !== src) image.src = src;
        image.alt = "";
        if (!image.parentNode) button.append(image);
      } else {
        button.replaceChildren();
      }
    }

    for (const [color, badge] of Object.entries(materialBadges)) {
      const advantage = material[color] - material[color === "w" ? "b" : "w"];
      badge.hidden = advantage <= 0;
      if (advantage > 0) {
        badge.firstElementChild.textContent = `+${advantage}`;
        badge.lastElementChild.textContent = `${sides[color]} leads by ${advantage} material ${advantage === 1 ? "point" : "points"}`;
      }
    }
  }

  function commitPosition() {
    saveMatch();
    renderMatchRecord();
    showPosition(null);
  }

  function movePiece(move) {
    history.push(game.move(move));
    commitPosition();
  }

  function scheduleBot() {
    clearTimeout(botTimer);
    if (!isBotTurn() || reviewPly !== null || document.querySelector("#match-options-dialog")?.open) return;
    botTimer = setTimeout(() => {
      if (!isBotTurn() || reviewPly !== null || document.querySelector("#match-options-dialog")?.open) return;
      const move = window.PepeChessBot.chooseMove(game, mode === "club" ? "club" : "beginner");
      if (move) movePiece(move);
    }, 360);
  }

  board.addEventListener("click", event => {
    const button = event.target.closest("[data-square]");
    if (!button || finished || pendingPromotion || reviewPly !== null || isBotTurn()) return;
    const square = button.dataset.square;
    const moves = selected ? game.moves({ square: selected, verbose: true }).filter(move => move.to === square) : [];
    if (moves[0]?.promotion) {
      pendingPromotion = { from: selected, to: square };
      promotion.returnValue = "cancel";
      promotion.showModal();
    } else if (moves.length) {
      movePiece(moves[0]);
    } else {
      selected = square !== selected && game.get(square)?.color === game.turn() ? square : null;
      render();
    }
  });

  promotion.addEventListener("close", () => {
    const move = pendingPromotion;
    pendingPromotion = null;
    if (move && ["q", "r", "b", "n"].includes(promotion.returnValue)) {
      movePiece({ ...move, promotion: promotion.returnValue });
    }
  });

  board.addEventListener("focusin", event => {
    if (!squares.includes(event.target)) return;
    for (const button of squares) button.tabIndex = button === event.target ? 0 : -1;
  });

  board.addEventListener("keydown", event => {
    const index = squares.indexOf(event.target);
    if (index < 0) return;
    if (event.key === "Escape" && selected !== null && !pendingPromotion) {
      event.preventDefault();
      selected = null;
      render();
      return;
    }
    const row = Math.floor(index / 8);
    const column = index % 8;
    const offsets = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const nextRow = Math.max(0, Math.min(7, row + offset[0]));
    const nextColumn = Math.max(0, Math.min(7, column + offset[1]));
    squares[nextRow * 8 + nextColumn].focus();
  });

  moveList.addEventListener("click", event => {
    const button = event.target.closest("[data-ply]");
    if (!button) return;
    showPosition(Number(button.dataset.ply));
    if (matchMedia("(max-width: 700px)").matches) {
      reviewLive.focus({ preventScroll: true });
      board.scrollIntoView({ block: "start" });
    }
  });
  flipButton.addEventListener("click", flipBoard);
  threatButton.addEventListener("click", () => {
    showThreats = !showThreats;
    threatButton.setAttribute("aria-pressed", String(showThreats));
    threatButton.textContent = showThreats ? "Hide threats" : "Show threats";
    render();
  });
  undoButton.addEventListener("click", () => {
    if (undoButton.disabled || pendingPromotion) return;
    clearTimeout(botTimer);
    // A bot reply and the move that prompted it are one human decision.
    const plies = mode !== "local" && history.at(-1).color === "b" ? 2 : 1;
    for (let count = 0; count < plies; count++) {
      game.undo();
      history.pop();
    }
    commitPosition();
  });
  reviewStart.addEventListener("click", () => showPosition(0));
  reviewPrev.addEventListener("click", () => showPosition((reviewPly ?? history.length) - 1));
  reviewNext.addEventListener("click", () => {
    if (reviewPly !== null) showPosition(reviewPly + 1);
  });
  reviewLive.addEventListener("click", () => {
    if (reviewPly !== null) showPosition(null);
  });

  function resetMatch() {
    clearTimeout(botTimer);
    game.reset();
    history = [];
    commitPosition();
  }

  resetButton.addEventListener("click", () => {
    if (reviewPly !== null) return;
    if (history.length && !window.confirm("Reset this board and clear the saved match?")) return;
    resetMatch();
  });

  modeSelect.addEventListener("change", () => {
    if (history.length && !window.confirm("Change opponent and start a new match?")) {
      modeSelect.value = mode;
      return;
    }
    mode = modeSelect.value;
    resetMatch();
  });

  takebackOption.addEventListener("change", () => {
    if (history.length) {
      takebackOption.checked = noTakebacks;
      return;
    }
    noTakebacks = takebackOption.checked;
    commitPosition();
  });

  exportButton.addEventListener("click", () => {
    const eventName = { local: "Pepe Chess local match", bot: "Pepe Chess vs. Beginner Kekbot", club: "Pepe Chess vs. Club Kekbot" };
    game.setHeader("Event", eventName[mode]);
    game.setHeader("White", "White");
    game.setHeader("Black", mode === "local" ? "Black" : botName());
    game.setHeader("Result", result);
    const blob = new Blob([game.pgn({ maxWidth: 80 }) + "\n"], { type: "application/x-chess-pgn" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "pepe-chess-match.pgn";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });

  function importSnapshot() {
    return JSON.stringify([game.fen(), history.map(move => move.san), mode, noTakebacks, reviewPly]);
  }

  importButton.addEventListener("click", () => pgnFile.click());
  pgnFile.addEventListener("change", async () => {
    const file = pgnFile.files?.[0];
    pgnFile.value = "";
    if (!file) return;
    const attempt = ++importAttempt;
    const snapshot = importSnapshot();
    importButton.disabled = true;
    importNote.textContent = "Checking PGN…";
    try {
      if (file.size > 131072) throw new Error("Use a PGN smaller than 128 KB.");
      const text = await file.text();
      if (attempt !== importAttempt) return;
      if (!text.trim()) throw new Error("The selected PGN is empty.");
      const candidate = new Chess();
      try { candidate.loadPgn(text, { strict: true }); }
      catch { throw new Error("This PGN could not be read as a legal chess game."); }
      const moves = candidate.history({ verbose: true });
      const start = moves[0]?.before ?? candidate.fen();
      const fenHeader = Object.entries(candidate.getHeaders()).find(([key]) => key.toLowerCase() === "fen")?.[1];
      if (start !== DEFAULT_POSITION || fenHeader && fenHeader !== DEFAULT_POSITION) {
        throw new Error("Only PGNs from the standard starting position can be restored here.");
      }
      if (moves.length > 2048) throw new Error("Use a PGN with no more than 2,048 half-moves.");
      // Validate the complete replacement before touching the live board or save.
      const verified = new Chess();
      for (const move of moves) {
        if (verified.isGameOver()) throw new Error("The PGN continues after this arcade's game-ending rules.");
        verified.move(move.san, { strict: true });
      }
      if (pendingPromotion || snapshot !== importSnapshot()) {
        throw new Error("The board changed while reading. Select the PGN again when ready.");
      }
      if (history.length && !window.confirm("Import this PGN and replace the current match? Opponent and takeback settings stay the same.")) {
        importNote.textContent = "Import cancelled. Current match unchanged.";
        return;
      }
      clearTimeout(botTimer);
      game.reset(); history = []; selected = null;
      for (const move of moves) history.push(game.move(move.san, { strict: true }));
      commitPosition();
      importNote.textContent = `Loaded ${moves.length} half-move${moves.length === 1 ? "" : "s"}. Opponent and takeback rules are unchanged. Review the moves or close Match options to continue.`;
    } catch (error) {
      importNote.textContent = `${error.message} Current match unchanged.`;
    } finally {
      if (attempt === importAttempt) importButton.disabled = false;
    }
  });
  document.addEventListener("pepechess:optionschange", scheduleBot);

  restoreMatch();
  window.addEventListener("storage", event => {
    if ((event.key === saveKey || event.key === null) && event.storageArea === window.localStorage &&
        event.newValue !== savedMatch) showSaveConflict();
  });
  modeSelect.value = mode;
  renderMatchRecord();
  showPosition(null);
})();
