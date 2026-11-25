(function () {
  "use strict";
  const configurations = {
    rush: { shell: ".rush-shell", game: ".rush-game", stage: ".rush-stage", backdrop: "assets/shard-rush/arena-background.png", extras: [".rush-field-guide", ".rush-combo-target", "#classicRecord", "#dailyRecord", "#ghostPace"] },
    galaxy: { shell: ".galaxy-shell", game: ".galaxy-game", stage: ".galaxy-stage", backdrop: "assets/emerald-galactic-heroes/space-background.png", extras: [".asset-guide", "#flightObjective", "#flightBest"] },
    runner: { shell: ".game-shell", stage: ".stage-wrap", extras: [] },
    space: { shell: ".game-shell", stage: ".stage-wrap", backdrop: "assets/pepe-space-unchained/space-bg.jpg", extras: ["#flightGoal"] },
    paradox: { shell: ".paradox-shell", stage: ".paradox-stage", backdrop: "assets/pepes-paradox/bamboo-distant.png", extras: ["#recoveryStatus", ".trail-summary"] },
    rumble: { shell: ".rumble-shell", game: ".rumble-game", stage: ".rumble-stage", backdrop: "assets/pepe-relic-rumble/pepe-arena.png", extras: [] },
  };
  const configuration = configurations[document.body.dataset.game];
  if (!configuration) return;
  document.body.classList.add("canvas-screen");
  const shell = document.querySelector(configuration.shell);
  const game = configuration.game ? document.querySelector(configuration.game) : shell;
  const stage = document.querySelector(configuration.stage);
  const canvas = stage.querySelector("canvas");
  shell.classList.add("canvas-screen-shell");
  game.classList.add("canvas-screen-game");
  stage.classList.add("canvas-screen-stage");
  canvas.classList.add("canvas-screen-art");
  if (configuration.backdrop) stage.style.setProperty("--canvas-screen-backdrop", `url("${configuration.backdrop}")`);
  const topbar = document.querySelector(".arcade-topbar");
  const hubLink = topbar.querySelector('a[href="index.html"]');
  if (hubLink) { hubLink.textContent = "Hub"; hubLink.setAttribute("aria-label", "Arcade Hub"); }
  const navigation = topbar.querySelector("nav") || topbar;
  const info = document.createElement("button");
  info.type = "button";
  info.className = "canvas-screen-info";
  info.textContent = "Game info";
  info.setAttribute("aria-haspopup", "dialog");
  navigation.append(info);
  const menu = document.createElement("span");
  menu.setAttribute("data-arcade-inline-menu", "");
  navigation.append(menu);

  const dialog = document.createElement("dialog");
  dialog.id = "canvasGameInfo";
  dialog.setAttribute("aria-labelledby", "canvasGameInfoTitle");
  dialog.innerHTML = '<form method="dialog" class="canvas-info-heading"><h2 id="canvasGameInfoTitle">Game info</h2><button type="submit">Done</button></form><div class="canvas-info-content"></div>';
  const content = dialog.querySelector(".canvas-info-content");
  document.body.append(dialog);
  // Move existing nodes so the game keeps every listener, ID and live report.
  for (const selector of [...configuration.extras, ".game-guide"]) {
    const element = document.querySelector(selector);
    if (element) content.append(element);
  }
  const moreLinks = [...topbar.querySelectorAll("a")].filter(anchor => anchor.getAttribute("href") !== "index.html");
  if (moreLinks.length) {
    const links = document.createElement("nav");
    links.className = "canvas-info-links";
    links.setAttribute("aria-label", "Other arcade games");
    links.append(...moreLinks);
    content.append(links);
  }
  let wasPaused = false;
  info.addEventListener("click", () => {
    wasPaused = Boolean(window.EmeraldArcade?.isPaused?.());
    window.EmeraldArcade?.setPaused?.(true);
    dialog.showModal();
  });
  dialog.addEventListener("close", () => {
    if (!wasPaused) window.EmeraldArcade?.setPaused?.(false);
    info.focus({ preventScroll: true });
  });
  document.addEventListener("DOMContentLoaded", () => setTimeout(() => {
    const assist = stage.querySelector(".arcade-pet-assist");
    if (assist) content.prepend(assist);
  }, 0), { once: true });

  // CSS sets the viewport rows; this keeps the virtual camera's ratio and makes
  // pointer coordinates use the exact displayed art rectangle, without cropping.
  function fitCanvas() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const scale = Math.min(width / canvas.width, height / canvas.height);
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
  }
  new ResizeObserver(fitCanvas).observe(stage);
  fitCanvas();
})();
