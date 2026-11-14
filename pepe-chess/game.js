(() => {
  "use strict";

  const game = new window.PepeChessRules.Chess();
  const board = document.querySelector(".board");
  const status = document.querySelector("#match-status");
  const promotion = document.querySelector("#promotion");
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

  function render() {
    const moves = selected ? game.moves({ square: selected, verbose: true }) : [];
    const targets = new Map(moves.map(move => [move.to, move]));
    const turn = sides[game.turn()];
    const check = game.isCheck();
    const mate = game.isCheckmate();
    const stalemate = game.isStalemate();
    const draw = game.isDraw();
    finished = mate || draw;
    status.textContent = mate ? `Checkmate. ${game.turn() === "w" ? "Black" : "White"} wins.`
      : stalemate ? "Draw by stalemate."
      : draw ? "Draw."
      : `${turn} to move.${check ? " Check." : ""}`;

    for (const button of squares) {
      const square = button.dataset.square;
      const piece = game.get(square);
      const move = targets.get(square);
      const label = piece ? `${sides[piece.color]} ${roles[piece.type]}` : "empty";
      button.setAttribute("aria-label", `${square}, ${label}${move ? ", legal destination" : ""}`);
      button.setAttribute("aria-pressed", String(square === selected));
      button.classList.toggle("legal", Boolean(move));
      button.classList.toggle("capture", Boolean(move?.captured));
      button.classList.toggle("in-check", check && piece?.type === "k" && piece.color === game.turn());
      if (piece) {
        const image = button.firstElementChild || document.createElement("img");
        const src = `assets/pieces-v1/${sides[piece.color].toLowerCase()}-${roles[piece.type]}.png`;
        if (image.getAttribute("src") !== src) image.src = src;
        image.alt = "";
        if (!image.parentNode) button.append(image);
      } else {
        button.replaceChildren();
      }
    }
  }

  function movePiece(move) {
    game.move(move);
    selected = null;
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
    render();
  });

  render();
})();
