(() => {
  const library = window.ArcadeLibrary;
  if (!library || !document.currentScript) return;
  const base = new URL(".", document.currentScript.src);
  const game = library.games.find(item => new URL(item.path, base).pathname === location.pathname);
  if (!game) return;
  function record() {
    try {
      // An opening/mode choice is navigation history, never completion or a reward.
      const mode = game.id === "rush" && new URLSearchParams(location.search || "").get("mode") === "daily" ? "daily" : undefined;
      library.write(localStorage, library.visit(library.read(localStorage), game.id, Date.now(), mode));
    } catch { /* Storage can be unavailable; opening the game must still work. */ }
  }
  if (game.id === "rush") window.addEventListener?.("arcade:modechange", record);
  record();
})();
