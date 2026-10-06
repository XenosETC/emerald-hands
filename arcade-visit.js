(() => {
  const library = window.ArcadeLibrary;
  if (!library || !document.currentScript) return;
  const base = new URL(".", document.currentScript.src);
  const game = library.games.find(item => new URL(item.path, base).pathname === location.pathname);
  if (!game) return;
  try {
    // An opening is navigation history, never a completed run or a currency reward.
    library.write(localStorage, library.visit(library.read(localStorage), game.id));
  } catch { /* Storage can be unavailable; opening the game must still work. */ }
})();
