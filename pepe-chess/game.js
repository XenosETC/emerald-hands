(() => {
  "use strict";

  const { Chess } = window.PepeChessRules;
  const saveKey = "emerald-pepe-chess-match-v1";
  const game = new Chess();
  const board = document.querySelector(".board");
  const status = document.querySelector("#match-status");
  const promotion = document.querySelector("#promotion");
  const moveList = document.querySelector("#move-list");
  const moveScroll = document.querySelector("#move-scroll");
  const emptyHistory = document.querySelector("#empty-history");
  const exportButton = document.querySelector("#export");
  const saveNote = document.querySelector("#save-note");
  const seats = { w: document.querySelector("#white-seat"), b: document.querySelector("#black-seat") };
  const captures = { w: document.querySelector("#white-captures"), b: document.querySelector("#black-captures") };
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

  function pieceSource(color, type) {
    return `assets/pieces-v1/${sides[color].toLowerCase()}-${roles[type]}.png`;
  }

  function restoreMatch() {
    try {
      const saved = window.localStorage.getItem(saveKey);
      if (saved === null) return;
      const moves = JSON.parse(saved);
      if (!Array.isArray(moves)) throw new Error("Invalid move list");
      for (const san of moves) {
        if (typeof san !== "string" || game.isGameOver()) throw new Error("Invalid saved move");
        history.push(game.move(san, { strict: true }));
      }
      saveNote.textContent = history.length ? "Match restored on this device." : "Matches save on this device.";
    } catch {
      game.reset();
      history = [];
      saveNote.textContent = "No saved match could be restored.";
    }
  }

  function saveMatch() {
    try {
      if (history.length) window.localStorage.setItem(saveKey, JSON.stringify(history.map(move => move.san)));
      else window.localStorage.removeItem(saveKey);
      saveNote.textContent = history.length ? "Match saved on this device." : "Matches save on this device.";
    } catch {
      saveNote.textContent = "Storage is unavailable. Download PGN to keep a record.";
    }
  }

  function renderMatchRecord() {
    const rows = [];
    const capturedPieces = { w: [], b: [] };
    for (const [index, move] of history.entries()) {
      const number = Math.floor(index / 2);
      if (index % 2 === 0) {
        const row = document.createElement("tr");
        row.insertCell().textContent = String(number + 1);
        row.insertCell().textContent = move.san;
        row.insertCell().textContent = "—";
        rows.push(row);
      } else {
        rows[number].cells[2].textContent = move.san;
      }
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
    moveList.replaceChildren(...rows);
    moveScroll.hidden = exportButton.disabled = history.length === 0;
    emptyHistory.hidden = history.length > 0;
    moveScroll.scrollTop = moveScroll.scrollHeight;
  }

  function render() {
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
      : `${turn} to move.${check ? " Check." : ""}`;
    const lastMove = history.at(-1);
    for (const [color, seat] of Object.entries(seats)) {
      seat.classList.toggle("is-active", !finished && game.turn() === color);
    }

    for (const button of squares) {
      const square = button.dataset.square;
      const piece = game.get(square);
      const move = targets.get(square);
      const label = piece ? `${sides[piece.color]} ${roles[piece.type]}` : "empty";
      button.setAttribute("aria-label", `${square}, ${label}${move ? ", legal destination" : ""}`);
      button.setAttribute("aria-pressed", String(square === selected));
      button.classList.toggle("legal", Boolean(move));
      button.classList.toggle("capture", Boolean(move?.captured));
      button.classList.toggle("last-move", lastMove?.from === square || lastMove?.to === square);
      button.classList.toggle("in-check", check && piece?.type === "k" && piece.color === game.turn());
      if (piece) {
        const image = button.firstElementChild || document.createElement("img");
        const src = pieceSource(piece.color, piece.type);
        if (image.getAttribute("src") !== src) image.src = src;
        image.alt = "";
        if (!image.parentNode) button.append(image);
      } else {
        button.replaceChildren();
      }
    }
  }

  function movePiece(move) {
    history.push(game.move(move));
    selected = null;
    saveMatch();
    renderMatchRecord();
    render();
  }

  board.addEventListener("click", event => {
    const button = event.target.closest("[data-square]");
    if (!button || finished || pendingPromotion) return;
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

  document.querySelector("#reset").addEventListener("click", () => {
    selected = null;
    game.reset();
    history = [];
    saveMatch();
    renderMatchRecord();
    render();
  });

  exportButton.addEventListener("click", () => {
    game.setHeader("Event", "Pepe Chess local match");
    game.setHeader("White", "White");
    game.setHeader("Black", "Black");
    game.setHeader("Result", result);
    const blob = new Blob([game.pgn({ maxWidth: 80 }) + "\n"], { type: "application/x-chess-pgn" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "pepe-chess-match.pgn";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });

  restoreMatch();
  renderMatchRecord();
  render();
})();
