(() => {
  const library = window.ArcadeLibrary;
  if (!library) return;
  let storage;
  try { storage = window.localStorage; } catch { /* Browsing works without storage. */ }
  let state = library.read(storage);
  const cards = new Map([...document.querySelectorAll(".game-card")].map(card => {
    const game = library.byPath(card.querySelector(".game-body > a").getAttribute("href"));
    return [game.id, card];
  }));
  const descriptions = Object.fromEntries([...cards].map(([id, card]) => [id,
    [...card.querySelectorAll(".game-body > p:not(.game-stat), .game-meta span")].map(node => node.textContent).join(" "),
  ]));
  const search = document.querySelector("#gameSearch");
  const favorites = document.querySelector("#favoritesOnly");
  const touch = document.querySelector("#touchOnly");
  const sort = document.querySelector("#gameSort");
  const notice = document.querySelector("#libraryNotice");
  const genreButtons = [...document.querySelectorAll("[data-filter]")];
  let genre = "all";
  let visibleGames = [];

  function persist(next) {
    state = next;
    notice.textContent = library.write(storage, state)
      ? "Saved on this device."
      : "Changes work in this tab. Browser storage is unavailable, so they cannot be saved.";
    render();
  }

  function readUrl() {
    const params = new URL(location.href).searchParams;
    genre = genreButtons.some(button => button.dataset.filter === params.get("genre")) ? params.get("genre") : "all";
    search.value = (params.get("q") || "").slice(0, 100);
    favorites.checked = params.get("favorites") === "1";
    touch.checked = params.get("touch") === "1";
    sort.value = ["title", "recent"].includes(params.get("sort")) ? params.get("sort") : "featured";
  }

  function updateUrl() {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries({ genre: genre === "all" ? "" : genre, q: search.value.trim(), favorites: favorites.checked ? "1" : "", touch: touch.checked ? "1" : "", sort: sort.value === "featured" ? "" : sort.value })) {
      if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    }
    try { history.replaceState(null, "", url); } catch { /* file preview fallback */ }
  }

  for (const game of library.games) {
    const card = cards.get(game.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "favorite-game";
    button.addEventListener("click", () => persist(library.toggleFavorite(state, game.id)));
    card.append(button);
    const controls = document.createElement("p");
    controls.className = "control-label";
    controls.textContent = game.controls;
    card.querySelector(".game-body > a").before(controls);
    if (["soulWorld", "feudalism", "templeRun"].includes(game.id)) {
      const summary = document.createElement("p");
      summary.className = "game-stat";
      summary.dataset.saveSummary = game.id;
      summary.hidden = true;
      controls.before(summary);
    }
  }

  function render() {
    const progress = window.ArcadeProgress?.read(storage) || {};
    visibleGames = library.select(state, { genre, query: search.value, favorites: favorites.checked, touch: touch.checked, sort: sort.value, descriptions });
    const visible = new Set(visibleGames.map(game => game.id));
    for (const [id, card] of cards) {
      card.hidden = !visible.has(id);
      const saved = state.favorites.includes(id);
      const button = card.querySelector(".favorite-game");
      button.textContent = saved ? "★ Saved" : "☆ Save";
      button.setAttribute("aria-pressed", String(saved));
      button.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${library.byId(id).title}${saved ? " from favorites" : " to favorites"}`);
      const summary = card.querySelector("[data-save-summary]");
      if (summary && progress[id]) {
        summary.hidden = false;
        summary.textContent = `${progress[id].label} · ${progress[id].summary}`;
      }
    }
    // DOM order keeps keyboard navigation aligned with the selected visual sort.
    const active = document.activeElement;
    const grid = document.querySelector(".game-grid");
    for (const game of visibleGames) grid.append(cards.get(game.id));
    if (active?.classList.contains("favorite-game")) {
      if (active.closest(".game-card").hidden) favorites.focus();
      else active.focus({ preventScroll: true });
    }
    for (const button of genreButtons) {
      const active = button.dataset.filter === genre;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    document.querySelector("#gameCount").textContent = String(visibleGames.length);
    document.querySelector("#filterResult").textContent = `${visibleGames.length} of ${library.games.length} games shown`;
    document.querySelector("#favoriteCount").textContent = String(state.favorites.length);
    document.querySelector("#emptyLibrary").hidden = visibleGames.length > 0;
    document.querySelector("#emptyMessage").textContent = favorites.checked && !state.favorites.length
      ? "Save a game with the star button to build your own collection." : "Try another search or clear your filters.";
    document.querySelector("#pickGame").disabled = visibleGames.length === 0;
    const recentList = document.querySelector("#recentGames");
    const scrollLeft = recentList.scrollLeft;
    const focusedId = active?.closest?.("[data-continue-id]")?.dataset.continueId;
    const continued = library.continuations(state, Object.keys(progress).filter(id => progress[id].status === "saved"));
    recentList.replaceChildren();
    for (const item of continued) {
      const game = library.byId(item.id);
      const link = document.createElement("a");
      link.href = library.destination(item);
      link.dataset.continueId = game.id;
      let info = progress[item.id] || { label: "Recently opened", summary: game.controls, goal: "Return to this game from your collection.", action: "Open game" };
      if (item.id === "rush" && item.mode === "daily") {
        const challenge = window.ShardRushChallenges;
        const best = challenge?.best(challenge.read(storage), challenge.dayKey());
        info = {label: "Daily Vault", summary: best ? `Today’s best ${best.score.toLocaleString()} · ${challenge.medal(best.score)}` : "A new course to learn today",
          goal: "Start a fresh attempt on today’s course. Your best ghost joins you when available.", action: "Play today’s vault"};
      }
      const art = document.createElement("span");
      art.className = "continue-art";
      art.setAttribute("aria-hidden", "true");
      const badge = document.createElement("small");
      badge.className = "continue-kind";
      badge.textContent = info.label;
      const name = document.createElement("strong");
      name.textContent = game.title;
      const summary = document.createElement("p");
      summary.className = "continue-summary";
      summary.textContent = info.summary;
      const goal = document.createElement("p");
      goal.className = "continue-goal";
      goal.textContent = info.goal;
      const label = document.createElement("span");
      label.className = "continue-action";
      label.textContent = `${info.action} ↗`;
      link.setAttribute("aria-label", `${info.action}: ${item.mode === "daily" ? "Shard Rush Daily Vault" : game.title}`);
      link.append(art, badge, name, summary, goal, label);
      recentList.append(link);
      if (focusedId === game.id) link.focus({ preventScroll: true });
    }
    recentList.scrollLeft = scrollLeft;
    document.querySelector("#recentSection").hidden = !continued.length;
    const recent = state.recent[0];
    const old = window.EmeraldArcade?.load().lastPlayed;
    const previous = Number.isSafeInteger(old?.at) && old.at > 0 ? library.byPath(old.path) : null;
    const latest = recent && (!previous || recent.at >= old.at) ? recent : previous ? {id: previous.id} : continued[0];
    const continueLink = document.querySelector("#continueGame");
    continueLink.href = library.destination(latest) || library.byId("hands").path;
    continueLink.textContent = latest ? `Return to ${latest.id === "rush" && latest.mode === "daily" ? "Daily Vault" : library.byId(latest.id).title}` : "Play Emerald Hands";
  }

  function change() { updateUrl(); render(); }
  search.addEventListener("input", change);
  for (const control of [favorites, touch, sort]) control.addEventListener("change", change);
  for (const button of genreButtons) button.addEventListener("click", () => { genre = button.dataset.filter; change(); });
  for (const shortcut of document.querySelectorAll("[data-collection]")) shortcut.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const collection = shortcut.dataset.collection;
    if (!genreButtons.some(button => button.dataset.filter === collection)) return;
    event.preventDefault();
    genre = collection; search.value = ""; favorites.checked = false; touch.checked = false; sort.value = "featured";
    change();
    const collectionSection = document.querySelector("#games");
    collectionSection.scrollIntoView({ block: "start" });
    collectionSection.focus({ preventScroll: true });
  });
  document.querySelector("#resetFilters").addEventListener("click", () => {
    genre = "all"; search.value = ""; favorites.checked = false; touch.checked = false; sort.value = "featured";
    change(); search.focus();
  });
  document.querySelector("#pickGame").addEventListener("click", () => {
    const game = visibleGames[Math.floor(Math.random() * visibleGames.length)];
    if (game) location.assign(game.path);
  });
  window.addEventListener("storage", event => {
    if (event.key === library.key || event.key === null) { state = library.read(storage); render(); }
    else if (Object.values(window.ArcadeProgress?.keys || {}).includes(event.key) || event.key === window.ShardRushChallenges?.key) render();
  });
  window.addEventListener("arcade:progress-ready", render);
  window.addEventListener("focus", render);
  window.addEventListener("pageshow", () => { state = library.read(storage); render(); });
  window.addEventListener("popstate", () => { readUrl(); render(); });
  readUrl();
  render();
})();
