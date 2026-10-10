(function (root) {
  "use strict";

  // Navigation metadata only. Game economies, rewards and saves stay in their runtimes.
  const games = [
    ["feudalism", "Pepe Feudalism", "pepe-feudalism/index.html", ["strategy", "adventure"], false, "Mouse + keyboard"],
    ["soulWorld", "Pepe Soul World", "pepe-soul-world/index.html", ["adventure", "arcade"], true, "Keyboard / touch"],
    ["templeRun", "Pepe Temple Run", "pepe-temple-run/index.html", ["arcade", "adventure"], true, "Keyboard / swipe"],
    ["satoshiSystem", "Satoshi System", "satoshi-system.html", ["idle"], true, "Click / tap"],
    ["unstableLaunch", "ETC: Unstable Launch", "etc-unstable-launch.html", ["arcade"], true, "Click / tap / Space"],
    ["rocketSimulator", "ETC Rocket Simulator", "etc-rocket-simulator.html", ["adventure", "idle"], true, "Click / tap"],
    ["pets", "ETC Pets: Meme Edition", "etc-pets.html", ["idle"], true, "Click / tap"],
    ["paradox", "Pepe's Paradox", "pepes-paradox.html", ["adventure"], false, "Keyboard required"],
    ["pepeRun", "PepeCoin Emerald Run", "pepecoin-run.html", ["arcade"], true, "Tap / Space"],
    ["towerDefense", "Pepe Tower Defense", "pepe-tower-defense.html", ["strategy"], true, "Click / tap / drag"],
    ["pepeWars", "Pepe Wars", "pepe-wars.html", ["strategy"], true, "Click / tap"],
    ["spaceUnchained", "Pepe: Space Unchained", "pepe-space-unchained.html", ["arcade"], true, "Keyboard / drag"],
    ["hands", "Emerald Hands", "emerald-hands.html", ["idle"], true, "Click / tap"],
    ["rush", "Shard Rush", "shard-rush.html", ["arcade"], true, "Keyboard / drag"],
    ["galaxy", "Emerald Galactic Heroes", "emerald-galactic-heroes.html", ["arcade"], true, "Keyboard / drag"],
    ["rumble", "Pepe Relic Rumble", "pepe-relic-rumble.html", ["arcade"], false, "Keyboard required"],
  ].map(([id, title, path, genres, touch, controls]) => Object.freeze({ id, title, path, genres: Object.freeze(genres), touch, controls }));
  const key = "emerald-library-v1";
  const byId = id => games.find(game => game.id === id);
  const byPath = path => games.find(game => game.path === path);

  function sanitize(value) {
    const favorites = [...new Set((Array.isArray(value?.favorites) ? value.favorites : []).filter(byId))];
    const seen = new Set();
    const recent = (Array.isArray(value?.recent) ? value.recent : [])
      .filter(item => byId(item?.id) && Number.isSafeInteger(item.at) && item.at > 0)
      .sort((a, b) => b.at - a.at)
      .filter(item => !seen.has(item.id) && seen.add(item.id))
      .slice(0, games.length).map(({ id, at, mode }) => ({ id, at, ...(id === "rush" && mode === "daily" ? { mode } : {}) }));
    return { version: 1, favorites, recent };
  }

  function read(storage) {
    try { return sanitize(JSON.parse(storage.getItem(key))); }
    catch { return sanitize(null); }
  }

  function write(storage, value) {
    try { storage.setItem(key, JSON.stringify(sanitize(value))); return true; }
    catch { return false; }
  }

  function visit(value, id, at = Date.now(), mode) {
    const state = sanitize(value);
    if (!byId(id) || !Number.isSafeInteger(at) || at <= 0) return state;
    state.recent = [{ id, at, mode }, ...state.recent.filter(item => item.id !== id)];
    return sanitize(state);
  }

  function toggleFavorite(value, id) {
    const state = sanitize(value);
    if (!byId(id)) return state;
    state.favorites = state.favorites.includes(id) ? state.favorites.filter(item => item !== id) : [...state.favorites, id];
    return state;
  }

  // Destinations are built from catalog IDs, never stored URLs or arbitrary queries.
  function destination(item) {
    const game = byId(item?.id);
    return game ? game.path + (game.id === "rush" && item.mode === "daily" ? "?mode=daily" : "") : null;
  }

  function continuations(value, savedIds = []) {
    const items = [...sanitize(value).recent];
    for (const id of savedIds) if (byId(id) && !items.some(item => item.id === id)) items.push({ id });
    return items.slice(0, 4);
  }

  function select(value, { genre = "all", query = "", favorites = false, touch = false, sort = "featured", descriptions = {} } = {}) {
    const state = sanitize(value);
    const words = String(query).trim().toLowerCase().split(/\s+/).filter(Boolean);
    const result = games.filter(game => (genre === "all" || game.genres.includes(genre))
      && (!favorites || state.favorites.includes(game.id)) && (!touch || game.touch)
      && words.every(word => `${game.title} ${game.genres.join(" ")} ${game.controls} ${descriptions[game.id] || ""}`.toLowerCase().includes(word)));
    if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "recent") {
      const times = new Map(state.recent.map(item => [item.id, item.at]));
      result.sort((a, b) => (times.get(b.id) || 0) - (times.get(a.id) || 0));
    }
    return result;
  }

  const api = Object.freeze({ games: Object.freeze(games), key, byId, byPath, sanitize, read, write, visit, toggleFavorite, select, destination, continuations });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ArcadeLibrary = api;
})(typeof window !== "undefined" ? window : globalThis);
