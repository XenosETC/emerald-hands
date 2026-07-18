(function () {
  const auraQaMode = new URLSearchParams(location.search).has("auraqa");
  const canvas = document.querySelector("#rumbleCanvas");
  const ctx = canvas.getContext("2d");
  const startButton = document.querySelector("#startButton");
  const overlay = document.querySelector("#rumbleOverlay");
  const overlayTitle = document.querySelector("#overlayTitle");
  const overlayText = document.querySelector("#overlayText");
  const p1Health = document.querySelector("#p1Health");
  const p2Health = document.querySelector("#p2Health");
  const p1Meter = document.querySelector("#p1Meter");
  const p2Meter = document.querySelector("#p2Meter");
  const roundLabel = document.querySelector("#roundLabel");
  const timerLabel = document.querySelector("#timerLabel");
  const stateLabel = document.querySelector("#stateLabel");
  const p1Name = document.querySelector("#p1Name");
  const p2Name = document.querySelector("#p2Name");
  const p1Controls = document.querySelector("#p1Controls");
  const p2Controls = document.querySelector("#p2Controls");
  const rumbleSetup = document.querySelector("#rumbleSetup");
  const modeStep = document.querySelector("#modeStep");
  const rosterStep = document.querySelector("#rosterStep");
  const backToModes = document.querySelector("#backToModes");
  const characterCards = document.querySelector("#characterCards");
  const draftModeKicker = document.querySelector("#draftModeKicker");
  const draftInstruction = document.querySelector("#draftInstruction");
  const draftTable = document.querySelector(".draft-table");
  const p1DraftSlot = document.querySelector("#p1DraftSlot");
  const p2DraftSlot = document.querySelector("#p2DraftSlot");
  const p1PreviewImage = document.querySelector("#p1PreviewImage");
  const p2PreviewImage = document.querySelector("#p2PreviewImage");
  const p1PreviewName = document.querySelector("#p1PreviewName");
  const p2PreviewName = document.querySelector("#p2PreviewName");
  const p2DraftLabel = document.querySelector("#p2DraftLabel");
  const p2PreviewMeta = document.querySelector("#p2PreviewMeta");
  const tournamentBoard = document.querySelector("#tournamentBoard");
  const p1Character = document.querySelector("#p1Character");
  const p2Character = document.querySelector("#p2Character");
  const tournamentStatus = document.querySelector("#tournamentStatus");
  const launchButton = document.querySelector("#launchButton");
  const p2ControlCard = document.querySelector("#p2ControlCard");
  const modeButtons = [...document.querySelectorAll("[data-mode]")];
  const domainCeremony = document.querySelector("#domainCeremony");
  const domainCeremonyKicker = document.querySelector("#domainCeremonyKicker");
  const domainCeremonyTitle = document.querySelector("#domainCeremonyTitle");
  const domainCeremonyLore = document.querySelector("#domainCeremonyLore");
  const domainCeremonyOath = document.querySelector("#domainCeremonyOath");
  const domainCeremonyButton = document.querySelector("#domainCeremonyButton");

  const W = canvas.width;
  const H = canvas.height;
  const floorY = 566;
  const gravity = 0.9;
  const keys = new Set();
  const pressed = new Set();
  let lastTime = performance.now();
  let lastRenderTime = performance.now();
  let perfFrames = 0;
  let perfSince = performance.now();
  let perfFps = 0;
  let gameState = "idle";
  let round = 1;
  let roundTime = 60;
  let pauseTimer = 0;
  let winner = null;
  let selectedMode = "pvp";
  let firstTo = 3;
  let tournamentOpponents = [];
  let tournamentIndex = 0;
  let tournamentBracket = null;
  let activeDraftSlot = "p1";
  const sparks = [];
  const afterImages = [];
  const shardBlasts = [];
  const arenaImage = new Image();
  arenaImage.src = "assets/pepe-relic-rumble/pepe-arena.png";
  const kekDomainImage = new Image();
  kekDomainImage.src = "assets/pepe-relic-rumble/kek-domain-arena.png?v=1";
  let cachedArena = null;
  let cachedKekDomainArena = null;
  let kekDomainActive = false;
  let kekDomainClock = 0;
  let kekDomainIntroTime = 0;
  const KEK_DOMAIN_INTRO_DURATION = 3.25;
  let cachedKekDomainFx = null;
  let domainCeremonyMode = "entry";
  let domainAudioContext = null;
  let domainMusicTimer = null;
  let domainDroneNodes = [];
  const shieldSprites = {
    1: new Image(),
    2: new Image(),
  };
  shieldSprites[1].src = "assets/pepe-relic-rumble/shard-shield-green.png";
  shieldSprites[2].src = "assets/pepe-relic-rumble/shard-shield-red.png";
  const auraSprites = {
    1: new Image(),
    2: new Image(),
  };
  auraSprites[1].src = "assets/pepe-relic-rumble/shard-aura-green-game.png";
  auraSprites[2].src = "assets/pepe-relic-rumble/shard-aura-corrupt-game.png";
  Object.values(auraSprites).forEach((image) => {
    image.addEventListener("load", () => buildAuraDrawCache());
  });
  const premiumAuraAtlas = new Image();
  premiumAuraAtlas.src = "assets/pepe-relic-rumble/premium-aura-atlas-v2-alpha.png";
  let auraDrawCache = {};
  const spriteSources = {
    idle: "assets/pepe-relic-rumble/pepe-brawler.png",
    punch: "assets/pepe-relic-rumble/pepe-punch.png",
    kick: "assets/pepe-relic-rumble/pepe-kick.png",
    block: "assets/pepe-relic-rumble/pepe-block.png",
    hurt: "assets/pepe-relic-rumble/pepe-hurt.png",
    special: "assets/pepe-relic-rumble/pepe-special.png",
    ko: "assets/pepe-relic-rumble/pepe-ko.png",
  };
  const pepeSprites = Object.fromEntries(
    Object.entries(spriteSources).map(([state, src]) => {
      const image = new Image();
      image.src = src;
      image.addEventListener("load", () => buildSpriteDrawCache());
      return [state, image];
    })
  );
  const customSpritePaths = {
    fallen: "assets/pepe-relic-rumble/fallen-pepe.png",
    emerald: "assets/pepe-relic-rumble/emerald-pepe.png",
    bandit: "assets/pepe-relic-rumble/bandit-pepe.png",
    ninja: "assets/pepe-relic-rumble/ninja-pepe.png",
    mecha: "assets/pepe-relic-rumble/mecha-pepe.png",
    berserk: "assets/pepe-relic-rumble/berserk-pepe.png",
  };
  const premiumSpriteStates = ["idle", "walk", "jump", "punch", "kick", "block", "hurt", "special", "ko"];
  const premiumSpritePaths = Object.fromEntries(
    Object.keys(customSpritePaths).map((id) => [
      id,
      Object.fromEntries(premiumSpriteStates.map((state) => [state, `assets/pepe-relic-rumble/${id}-${state}.png?v=2`])),
    ])
  );
  const stateRenderScales = {
    fallen: { special: 0.96 },
    ninja: { walk: 0.78, jump: 0.9, hurt: 0.88 },
    berserk: { walk: 0.86, punch: 0.94, kick: 0.92, hurt: 0.86, special: 0.94 },
  };
  const customSprites = {};
  const customSpriteCache = {};

  function makeCroppedSprite(image, targetHeight = 320) {
    const source = document.createElement("canvas");
    source.width = image.naturalWidth;
    source.height = image.naturalHeight;
    const sourceContext = source.getContext("2d", { willReadFrequently: true });
    sourceContext.drawImage(image, 0, 0);
    const pixels = sourceContext.getImageData(0, 0, source.width, source.height).data;
    let minX = source.width;
    let minY = source.height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < source.height; y += 2) {
      for (let x = 0; x < source.width; x += 2) {
        if (pixels[(y * source.width + x) * 4 + 3] < 10) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    if (maxX <= minX || maxY <= minY) return makeSizedSprite(image, targetHeight, targetHeight, null);
    const padding = 4;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(source.width, maxX + padding);
    maxY = Math.min(source.height, maxY + padding);
    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;
    const targetWidth = Math.max(1, Math.round(targetHeight * cropWidth / cropHeight));
    const buffer = document.createElement("canvas");
    buffer.width = targetWidth;
    buffer.height = targetHeight;
    buffer.getContext("2d").drawImage(source, minX, minY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
    return buffer;
  }

  function ensureCustomSprite(id, state = "idle") {
    const path = premiumSpritePaths[id]?.[state] || customSpritePaths[id];
    if (!path) return null;
    customSprites[id] ||= {};
    customSpriteCache[id] ||= {};
    if (customSprites[id][state]) return customSprites[id][state];
    const image = new Image();
    image.addEventListener("load", () => {
      customSpriteCache[id][state] = makeCroppedSprite(image);
    });
    image.src = path;
    customSprites[id][state] = image;
    return image;
  }

  function ensureCharacterSprites(id) {
    if (!premiumSpritePaths[id]) return;
    premiumSpriteStates.forEach((state) => ensureCustomSprite(id, state));
  }
  let spriteDrawCache = {};
  const spriteProfiles = {
    idle: { w: 218, h: 218, y: 8 },
    walk: { w: 218, h: 218, y: 8 },
    jump: { w: 224, h: 224, y: 6 },
    punch: { w: 236, h: 236, y: 10 },
    kick: { w: 254, h: 254, y: 20 },
    block: { w: 226, h: 226, y: 10 },
    hurt: { w: 242, h: 242, y: 18 },
    special: { w: 264, h: 264, y: 22 },
    ko: { w: 268, h: 268, y: 34 },
  };
  const actionDurations = { punch: 0.3, kick: 0.44, special: 0.58 };
  const animationProfiles = {
    crown: { idleRate: 2.3, idleAmp: 2.4, stride: 1, lunge: 18, kickDrive: 15, specialLift: 7, shake: 4, trail: 0.09 },
    corrupt: { idleRate: 1.9, idleAmp: 2.8, stride: 0.94, lunge: 22, kickDrive: 18, specialLift: 9, shake: 5, trail: 0.075 },
    fallen: { idleRate: 1.45, idleAmp: 2, stride: 0.82, lunge: 20, kickDrive: 16, specialLift: 6, shake: 4, trail: 0.085 },
    emerald: { idleRate: 1.8, idleAmp: 2.2, stride: 0.9, lunge: 17, kickDrive: 14, specialLift: 10, shake: 3, trail: 0.095 },
    bandit: { idleRate: 2.55, idleAmp: 2.5, stride: 1.08, lunge: 21, kickDrive: 18, specialLift: 5, shake: 4, trail: 0.07 },
    ninja: { idleRate: 2.8, idleAmp: 1.8, stride: 1.22, lunge: 28, kickDrive: 24, specialLift: 12, shake: 3, trail: 0.045 },
    mecha: { idleRate: 1.15, idleAmp: 1.35, stride: 0.72, lunge: 15, kickDrive: 12, specialLift: 4, shake: 2, trail: 0.11 },
    berserk: { idleRate: 1.25, idleAmp: 3, stride: 0.78, lunge: 26, kickDrive: 22, specialLift: 8, shake: 6, trail: 0.08 },
  };

  const characterRoster = {
    crown: {
      name: "Crown Pepe",
      variant: "normal",
      palette: { body: "#35be5f", light: "#80ffb7", dark: "#12351d", trim: "#d8b45f" },
    },
    corrupt: {
      name: "Corrupt Pepe",
      variant: "corrupt",
      renderScaleX: 1.12,
      renderScaleY: 1.08,
      palette: { body: "#f0379d", light: "#ff78ca", dark: "#481333", trim: "#ff9be0" },
    },
    fallen: {
      name: "Fallen Pepe",
      variant: "fallen",
      renderHeight: 212,
      shieldStyle: "obsidian",
      specialStyle: "rift",
      palette: { body: "#332f27", light: "#ff343f", dark: "#100d0b", trim: "#ff766f" },
    },
    emerald: {
      name: "Emerald Pepe",
      variant: "emerald",
      renderHeight: 212,
      shieldStyle: "faceted",
      specialStyle: "prism",
      palette: { body: "#137a4b", light: "#72ffbd", dark: "#063522", trim: "#e2c35e" },
    },
    bandit: {
      name: "Bandit Pepe",
      variant: "bandit",
      renderHeight: 212,
      shieldStyle: "bounty",
      specialStyle: "ricochet",
      palette: { body: "#527d35", light: "#72ffbd", dark: "#241b13", trim: "#e0b34e" },
    },
    ninja: {
      name: "Ninja Pepe",
      variant: "ninja",
      renderHeight: 210,
      shieldStyle: "smoke",
      specialStyle: "shuriken",
      palette: { body: "#295f3b", light: "#59ffc2", dark: "#080d0b", trim: "#19c989" },
    },
    mecha: {
      name: "Mecha Pepe",
      variant: "mecha",
      renderHeight: 216,
      shieldStyle: "reactor",
      specialStyle: "railgun",
      palette: { body: "#24483b", light: "#55ff9c", dark: "#111a19", trim: "#dfb64e" },
    },
    berserk: {
      name: "Berserk Pepe",
      variant: "berserk",
      renderHeight: 248,
      shieldStyle: "war-rune",
      specialStyle: "rage-wave",
      palette: { body: "#418d32", light: "#55ffad", dark: "#171b17", trim: "#9fb8aa" },
    },
  };
  const auraProfiles = {
    crown: { cell: 0, width: 1.35, height: 1.56, baseline: 15, orbitX: 0.55, orbitY: 0.62, alpha: 0.9 },
    corrupt: { cell: 1, width: 1.4, height: 1.54, baseline: 15, orbitX: 0.57, orbitY: 0.62, alpha: 0.94 },
    fallen: { cell: 1, width: 1.25, height: 1.48, baseline: 13, orbitX: 0.51, orbitY: 0.59, alpha: 0.82 },
    emerald: { cell: 0, width: 1.3, height: 1.52, baseline: 14, orbitX: 0.53, orbitY: 0.6, alpha: 0.86 },
    bandit: { cell: 0, width: 1.2, height: 1.46, baseline: 12, orbitX: 0.49, orbitY: 0.57, alpha: 0.8 },
    ninja: { cell: 2, width: 1.05, height: 1.4, baseline: 10, orbitX: 0.43, orbitY: 0.54, alpha: 0.78 },
    mecha: { cell: 3, width: 1.4, height: 1.5, baseline: 15, orbitX: 0.57, orbitY: 0.59, alpha: 0.88 },
    berserk: { cell: 3, width: 1.55, height: 1.58, baseline: 18, orbitX: 0.64, orbitY: 0.64, alpha: 1 },
  };

  const VAULT_CHAMPION_BADGE = "vault-champion";
  const characterRoles = {
    crown: "Relic Vanguard",
    corrupt: "Void Bruiser",
    fallen: "Rift Brawler",
    emerald: "Prism Guardian",
    bandit: "Ricochet Rogue",
    ninja: "Shard Assassin",
    mecha: "Reactor Tank",
    berserk: "Tournament Champion",
  };

  function previewPath(characterId) {
    return customSpritePaths[characterId]
      ? `assets/pepe-relic-rumble/${characterId}-idle.png?v=1`
      : "assets/pepe-relic-rumble/pepe-brawler.png";
  }

  function berserkUnlocked() {
    return auraQaMode || Boolean(window.EmeraldArcade?.load()?.badges?.includes(VAULT_CHAMPION_BADGE));
  }

  function shuffled(values) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  }

  function applyPreview(image, characterId) {
    image.src = previewPath(characterId);
    image.classList.toggle("preview-corrupt", characterId === "corrupt");
  }

  function updateDraftPreviews() {
    applyPreview(p1PreviewImage, p1Character.value);
    applyPreview(p2PreviewImage, p2Character.value);
    p1PreviewName.textContent = characterRoster[p1Character.value].name;
    p2PreviewName.textContent = characterRoster[p2Character.value].name;
    p1DraftSlot.classList.toggle("is-active", activeDraftSlot === "p1");
    p2DraftSlot.classList.toggle("is-active", activeDraftSlot === "p2" && selectedMode === "pvp");
    draftInstruction.textContent = selectedMode === "tournament"
      ? `Fight as ${characterRoster[p1Character.value].name}`
      : `Choose ${activeDraftSlot === "p1" ? "Player 1" : "Player 2"}`;
  }

  function buildTournamentBracket(playerId) {
    const allIds = Object.keys(characterRoster);
    const bossId = playerId === "berserk" ? "corrupt" : "berserk";
    const pool = shuffled(allIds.filter((id) => id !== playerId && id !== bossId));
    const opponents = [pool[0], pool[1], bossId];
    const entrants = [playerId, pool[0], pool[2], pool[1], pool[3], pool[4], pool[5], bossId];
    tournamentBracket = { playerId, opponents, entrants };
    tournamentOpponents = opponents;
    tournamentIndex = 0;
    p2Character.value = opponents[0];
    renderTournamentBoard();
    updateDraftPreviews();
  }

  function bracketMatch(a, b, className = "") {
    return `<div class="bracket-match ${className}">${characterRoster[a].name}<br><span>vs</span> ${characterRoster[b].name}</div>`;
  }

  function renderTournamentBoard() {
    if (!tournamentBracket) {
      tournamentBoard.hidden = true;
      return;
    }
    const { playerId, opponents, entrants } = tournamentBracket;
    const current = Math.min(tournamentIndex, 2);
    tournamentBoard.hidden = false;
    tournamentBoard.innerHTML = `
      <header>
        <div><span class="mode-kicker">Vault Tournament Board</span><strong>${characterRoster[playerId].name}'s road to champion</strong></div>
        <small>AI bouts resolve automatically</small>
      </header>
      <div class="bracket-grid">
        <div class="bracket-round">
          <strong>Quarterfinals</strong>
          ${bracketMatch(entrants[0], entrants[1], `is-player ${current === 0 ? "is-current" : ""}`)}
          ${bracketMatch(entrants[2], entrants[3])}
          ${bracketMatch(entrants[4], entrants[5])}
          ${bracketMatch(entrants[6], entrants[7])}
        </div>
        <div class="bracket-round">
          <strong>Semifinals</strong>
          ${bracketMatch(playerId, opponents[1], `is-player ${current === 1 ? "is-current" : ""}`)}
          ${bracketMatch(entrants[4], opponents[2])}
        </div>
        <div class="bracket-round">
          <strong>Championship</strong>
          ${bracketMatch(playerId, opponents[2], `is-player is-domain-final ${current === 2 ? "is-current" : ""}`)}
        </div>
      </div>
    `;
  }

  function renderCharacterCards() {
    const unlock = berserkUnlocked();
    const selectedId = activeDraftSlot === "p2" ? p2Character.value : p1Character.value;
    characterCards.innerHTML = Object.entries(characterRoster).map(([id, character]) => {
      const locked = id === "berserk" && !unlock;
      const corruptClass = id === "corrupt" ? "preview-corrupt" : "";
      return `
        <button class="character-card ${selectedId === id ? "is-selected" : ""} ${locked ? "is-locked" : ""}" type="button" data-character="${id}" ${locked ? "disabled" : ""}>
          <img class="${corruptClass}" src="${previewPath(id)}" alt="">
          <strong>${character.name}</strong>
          <small>${locked ? "Beat Tournament" : characterRoles[id]}</small>
        </button>
      `;
    }).join("");
    characterCards.querySelectorAll("[data-character]").forEach((card) => {
      card.addEventListener("click", () => chooseDraftCharacter(card.dataset.character));
    });
  }

  function chooseDraftCharacter(characterId) {
    if (selectedMode === "tournament") {
      if (characterId === "berserk" && !berserkUnlocked()) return;
      p1Character.value = characterId;
      activeDraftSlot = "p1";
      buildTournamentBracket(characterId);
    } else {
      const select = activeDraftSlot === "p2" ? p2Character : p1Character;
      select.value = characterId;
      if (activeDraftSlot === "p1") activeDraftSlot = "p2";
    }
    updateDraftPreviews();
    renderCharacterCards();
  }

  function showModeStep() {
    selectedMode = null;
    modeStep.hidden = false;
    rosterStep.hidden = true;
    tournamentBoard.hidden = true;
    modeButtons.forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
    overlayTitle.textContent = "Choose your fight format.";
    overlayText.textContent = "Play a direct 1v1 draft, or climb an AI tournament board to unlock Berserk Pepe.";
  }

  function showRosterStep(mode) {
    selectedMode = mode;
    modeStep.hidden = true;
    rosterStep.hidden = false;
    const tournament = mode === "tournament";
    activeDraftSlot = "p1";
    if (!berserkUnlocked()) {
      if (p1Character.value === "berserk") p1Character.value = "crown";
      if (p2Character.value === "berserk") p2Character.value = "corrupt";
    }
    p2DraftSlot.hidden = tournament;
    draftTable.classList.toggle("is-tournament", tournament);
    tournamentStatus.hidden = !tournament;
    p2DraftLabel.textContent = tournament ? "CPU Rival" : "Player 2";
    p2PreviewMeta.textContent = tournament ? "AI controlled" : "Arrow controls";
    draftModeKicker.textContent = tournament ? "Tournament Entrant" : "Versus Draft";
    launchButton.textContent = tournament ? "Enter Tournament" : "Launch 1v1 Fight";
    p2ControlCard.querySelector("strong").textContent = tournament ? "CPU Rival" : "Player 2";
    p2ControlCard.querySelector("span").textContent = tournament
      ? "Other bracket fights resolve automatically between your bouts."
      : "Arrow keys, J punch, K kick, L block or special";
    if (tournament) buildTournamentBracket(p1Character.value);
    else {
      tournamentBracket = null;
      tournamentBoard.hidden = true;
      updateDraftPreviews();
    }
    renderCharacterCards();
    overlayTitle.textContent = tournament ? "Draft your tournament legend." : "Build the 1v1 fight card.";
    overlayText.textContent = tournament
      ? "Choose one fighter. The board draws a random first rival and simulates the other AI matches."
      : "Select a player slot, then click a character card to preview and assign that fighter.";
  }

  function buildSpriteDrawCache() {
    const nextCache = {};
    for (const [state, image] of Object.entries(pepeSprites)) {
      const profile = spriteProfiles[state] || spriteProfiles.idle;
      if (!image.complete || !image.naturalWidth) return;
      nextCache[state] = {
        normal: makeSizedSprite(image, profile.w, profile.h, null),
        corrupt: makeSizedSprite(image, profile.w, profile.h, "hue-rotate(250deg) saturate(2.05) brightness(1.08) contrast(1.06)"),
      };
    }
    spriteDrawCache = nextCache;
  }

  function makeSizedSprite(image, width, height, filter) {
    const buffer = document.createElement("canvas");
    buffer.width = width;
    buffer.height = height;
    const bctx = buffer.getContext("2d");
    if (filter) bctx.filter = filter;
    bctx.drawImage(image, 0, 0, width, height);
    if (filter) {
      bctx.filter = "none";
      bctx.globalCompositeOperation = "source-atop";
      bctx.fillStyle = "rgba(255, 36, 166, 0.16)";
      bctx.fillRect(0, 0, width, height);
      bctx.globalCompositeOperation = "source-over";
    }
    return buffer;
  }

  function buildAuraDrawCache() {
    const nextCache = {};
    for (const [id, image] of Object.entries(auraSprites)) {
      if (!image.complete || !image.naturalWidth) return;
      nextCache[id] = makeAuraSprite(image, 320, 480);
    }
    auraDrawCache = nextCache;
  }

  function makeAuraSprite(image, width, height) {
    const buffer = document.createElement("canvas");
    buffer.width = width;
    buffer.height = height;
    const bctx = buffer.getContext("2d");
    bctx.drawImage(image, 0, 0, width, height);
    return buffer;
  }

  function makeFighter(id, x, controls, characterId) {
    const character = characterRoster[characterId];
    return {
      id,
      x,
      y: floorY,
      vx: 0,
      vy: 0,
      facing: id === 1 ? 1 : -1,
      health: 100,
      wins: 0,
      energy: 35,
      grounded: true,
      state: "idle",
      action: null,
      actionTime: 0,
      cooldown: 0,
      invuln: 0,
      hurtTime: 0,
      walkTime: 0,
      moveDir: 0,
      moveMode: "idle",
      jumpTime: 0,
      landSquash: 0,
      animationClock: Math.random() * 4,
      visualState: "idle",
      visualStateTime: 0,
      chargeTime: 0,
      blockTime: 0,
      afterimageCooldown: 0,
      charging: false,
      block: false,
      specialReady: true,
      controls,
      characterId,
      palette: { ...character.palette },
      isAI: false,
      domainEmpowered: false,
      ai: { think: 0, action: null, move: 0, block: false, charge: false },
      hitIds: new Set(),
    };
  }

  const fighters = [
    makeFighter(1, 390, { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS", punch: "KeyF", kick: "KeyG", block: "KeyH" }, "crown"),
    makeFighter(2, 890, { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown", punch: "KeyJ", kick: "KeyK", block: "KeyL" }, "corrupt"),
  ];

  function setCharacter(fighter, characterId) {
    const character = characterRoster[characterId] || characterRoster.crown;
    fighter.characterId = characterId in characterRoster ? characterId : "crown";
    fighter.palette = { ...character.palette };
    ensureCharacterSprites(fighter.characterId);
  }

  function fighterName(fighter) {
    return characterRoster[fighter.characterId]?.name || "Vault Fighter";
  }

  function effectVariant(fighter) {
    const variant = characterRoster[fighter.characterId]?.variant;
    return variant === "corrupt" || variant === "fallen" ? 2 : 1;
  }

  function fighterVisualHeight(fighter) {
    const profile = characterRoster[fighter.characterId] || characterRoster.crown;
    return profile.renderHeight || 218 * (profile.renderScaleY || 1);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function prepareDomainAudio() {
    if (!domainAudioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      domainAudioContext = new AudioContextClass();
    }
    if (domainAudioContext.state === "suspended") domainAudioContext.resume().catch(() => {});
    return domainAudioContext;
  }

  function playDomainNote(frequency, duration, type = "sine", volume = 0.035, delay = 0) {
    const audio = prepareDomainAudio();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  }

  function stopDomainMusic() {
    if (domainMusicTimer) clearInterval(domainMusicTimer);
    domainMusicTimer = null;
    const audio = domainAudioContext;
    domainDroneNodes.forEach(({ oscillator, gain }) => {
      if (audio) gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.22);
      try { oscillator.stop((audio?.currentTime || 0) + 0.24); } catch (_) {}
    });
    domainDroneNodes = [];
  }

  function startDomainMusic() {
    stopDomainMusic();
    const audio = prepareDomainAudio();
    if (!audio) return;

    [55, 82.41].forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = index ? "triangle" : "sawtooth";
      oscillator.frequency.value = frequency;
      gain.gain.value = index ? 0.018 : 0.026;
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      domainDroneNodes.push({ oscillator, gain });
    });

    const bassPattern = [55, 55, 65.41, 49, 55, 73.42, 65.41, 49];
    const sigilPattern = [220, 261.63, 293.66, 329.63, 293.66, 261.63, 246.94, 196];
    let step = 0;
    const tick = () => {
      const bass = bassPattern[step % bassPattern.length];
      playDomainNote(bass, 0.21, "square", step % 4 === 0 ? 0.065 : 0.042);
      if (step % 2 === 0) playDomainNote(sigilPattern[step % sigilPattern.length], 0.32, "triangle", 0.025, 0.035);
      if (step % 4 === 3) playDomainNote(880, 0.08, "sine", 0.018);
      step += 1;
    };
    tick();
    domainMusicTimer = setInterval(tick, 240);
  }

  function deactivateKekDomain() {
    kekDomainActive = false;
    kekDomainIntroTime = 0;
    document.body.classList.remove("kek-domain-active");
    fighters.forEach((fighter) => { fighter.domainEmpowered = false; });
    stopDomainMusic();
    domainCeremony.hidden = true;
  }

  function showDomainCeremony(mode = "entry") {
    domainCeremonyMode = mode;
    const completion = mode === "completion";
    domainCeremony.classList.toggle("is-completion", completion);
    domainCeremonyKicker.textContent = completion ? "Origin Archive · Champion Record" : "Championship Threshold";
    domainCeremonyTitle.textContent = completion ? "The Domain remembers your name." : "The Domain answers.";
    domainCeremonyLore.textContent = completion
      ? "The Origin Flame records a challenger who crossed the green void, silenced its champion, and returned carrying the Unbroken Sigil. Berserk Pepe now recognizes your claim."
      : "The last champion has invoked the Origin Sigil. Beyond this gate, the arena itself judges the challenger. Its stone remembers every defeat.";
    domainCeremonyOath.textContent = completion
      ? "SIGIL CLAIMED · BERSERK AWAKENED · THE VAULT BEARS WITNESS"
      : "BREAK THE DOMAIN · CLAIM THE CROWN · RETURN WITH THE SIGIL";
    domainCeremonyButton.textContent = completion ? "Seal the Champion Record" : "Enter KEK Domain";
    domainCeremony.hidden = false;
  }

  function activateKekDomainFinal() {
    kekDomainActive = true;
    kekDomainClock = 0;
    kekDomainIntroTime = KEK_DOMAIN_INTRO_DURATION;
    document.body.classList.add("kek-domain-active");
    fighters[1].domainEmpowered = true;
    fighters[1].energy = 100;
    fighters[1].specialReady = true;
    overlay.hidden = true;
    gameState = "domain-ceremony";
    startDomainMusic();
    burst(W / 2, floorY - 130, 72, "#9dff35");
    showDomainCeremony("entry");
  }

  function buildKekDomainFxCache() {
    const buffer = document.createElement("canvas"); buffer.width = W; buffer.height = H;
    const bctx = buffer.getContext("2d");
    const prior = ctx; // Static layer is drawn once with simple arena geometry.
    bctx.fillStyle = "rgba(0,18,3,.18)"; bctx.fillRect(0,0,W,H);
    bctx.strokeStyle = "rgba(181,255,83,.48)"; bctx.lineWidth = 3;
    bctx.beginPath(); bctx.ellipse(W/2,floorY+30,478,86,0,0,Math.PI*2); bctx.stroke();
    bctx.strokeStyle = "rgba(232,213,111,.55)"; bctx.lineWidth = 5;
    bctx.beginPath(); bctx.moveTo(70,floorY+42); bctx.lineTo(W-70,floorY+42); bctx.stroke();
    for (const x of [92,W-92]) { bctx.fillStyle="rgba(3,18,6,.9)"; bctx.fillRect(x-28,260,56,330); bctx.strokeStyle="rgba(174,255,79,.6)"; bctx.strokeRect(x-28,260,56,330); bctx.fillStyle="#aaff4e"; bctx.beginPath(); bctx.arc(x,272,13,0,Math.PI*2); bctx.fill(); }
    bctx.fillStyle="rgba(7,20,7,.88)"; bctx.fillRect(0,floorY+44,W,H-floorY-44);
    bctx.strokeStyle="rgba(139,255,64,.22)"; bctx.lineWidth=2;
    for(let x=80;x<W;x+=80){bctx.beginPath();bctx.moveTo(W/2,floorY+44);bctx.lineTo(x,H);bctx.stroke();}
    return buffer;
  }

  function buildArenaCache() {
    if (!arenaImage.complete || !arenaImage.naturalWidth) return null;
    const buffer = document.createElement("canvas");
    buffer.width = W;
    buffer.height = H;
    const bctx = buffer.getContext("2d");
    const imgRatio = arenaImage.naturalWidth / arenaImage.naturalHeight;
    const canvasRatio = W / H;
    let sx = 0;
    let sy = 0;
    let sw = arenaImage.naturalWidth;
    let sh = arenaImage.naturalHeight;

    if (imgRatio > canvasRatio) {
      sw = arenaImage.naturalHeight * canvasRatio;
      sx = (arenaImage.naturalWidth - sw) / 2;
    } else {
      sh = arenaImage.naturalWidth / canvasRatio;
      sy = (arenaImage.naturalHeight - sh) * 0.44;
    }

    bctx.drawImage(arenaImage, sx, sy, sw, sh, 0, 0, W, H);
    const topShade = bctx.createLinearGradient(0, 0, 0, H);
    topShade.addColorStop(0, "rgba(0, 0, 0, 0.22)");
    topShade.addColorStop(0.55, "rgba(0, 0, 0, 0)");
    topShade.addColorStop(1, "rgba(0, 0, 0, 0.2)");
    bctx.fillStyle = topShade;
    bctx.fillRect(0, 0, W, H);
    return buffer;
  }

  function buildKekDomainArenaCache() {
    if (!kekDomainImage.complete || !kekDomainImage.naturalWidth) return null;
    const buffer = document.createElement("canvas");
    buffer.width = W;
    buffer.height = H;
    const bctx = buffer.getContext("2d");
    const imageRatio = kekDomainImage.naturalWidth / kekDomainImage.naturalHeight;
    const canvasRatio = W / H;
    let sx = 0;
    let sy = 0;
    let sw = kekDomainImage.naturalWidth;
    let sh = kekDomainImage.naturalHeight;
    if (imageRatio > canvasRatio) {
      sw = kekDomainImage.naturalHeight * canvasRatio;
      sx = (kekDomainImage.naturalWidth - sw) / 2;
    } else {
      sh = kekDomainImage.naturalWidth / canvasRatio;
      sy = (kekDomainImage.naturalHeight - sh) * 0.48;
    }
    bctx.drawImage(kekDomainImage, sx, sy, sw, sh, 0, 0, W, H);
    const grade = bctx.createLinearGradient(0, 0, 0, H);
    grade.addColorStop(0, "rgba(0, 8, 2, 0.2)");
    grade.addColorStop(0.5, "rgba(17, 58, 5, 0.02)");
    grade.addColorStop(1, "rgba(0, 5, 1, 0.38)");
    bctx.fillStyle = grade;
    bctx.fillRect(0, 0, W, H);
    return buffer;
  }

  function resetRound() {
    fighters[0].x = 390;
    fighters[1].x = 890;
    fighters.forEach((f, index) => {
      f.y = floorY;
      f.vx = 0;
      f.vy = 0;
      f.facing = index === 0 ? 1 : -1;
      f.health = 100;
      f.energy = Math.max(35, f.energy);
      f.grounded = true;
      f.state = "idle";
      f.action = null;
      f.actionTime = 0;
      f.cooldown = 0;
      f.invuln = 0;
      f.hurtTime = 0;
      f.walkTime = 0;
      f.moveDir = 0;
      f.moveMode = "idle";
      f.jumpTime = 0;
      f.landSquash = 0;
      f.animationClock = Math.random() * 4;
      f.visualState = "idle";
      f.visualStateTime = 0;
      f.chargeTime = 0;
      f.blockTime = 0;
      f.afterimageCooldown = 0;
      f.charging = false;
      f.block = false;
      f.specialReady = true;
      f.domainEmpowered = kekDomainActive && f.id === 2;
      f.ai = { think: 0, action: null, move: 0, block: false, charge: false };
      f.hitIds.clear();
    });
    sparks.length = 0;
    afterImages.length = 0;
    shardBlasts.length = 0;
    roundTime = 60;
    winner = null;
  }

  function startFight() {
    deactivateKekDomain();
    round = 1;
    fighters.forEach((f) => {
      f.wins = 0;
      f.energy = 35;
    });
    resetRound();
    gameState = "playing";
    overlay.hidden = true;
    startButton.textContent = "Restart Fight";
    window.EmeraldArcade?.beginSession("rumble", "pepe-relic-rumble.html");
  }

  function launchSelectedFight() {
    prepareDomainAudio();
    setCharacter(fighters[0], p1Character.value);
    setCharacter(fighters[1], p2Character.value);
    selectedMode ||= "pvp";
    firstTo = selectedMode === "tournament" ? 2 : 3;
    fighters[0].isAI = false;
    fighters[1].isAI = selectedMode === "tournament";
    tournamentIndex = 0;
    if (selectedMode === "tournament") {
      if (!tournamentBracket || tournamentBracket.playerId !== p1Character.value) buildTournamentBracket(p1Character.value);
      tournamentOpponents = [...tournamentBracket.opponents];
      p2Character.value = tournamentOpponents[0];
      setCharacter(fighters[1], tournamentOpponents[0]);
      renderTournamentBoard();
    } else {
      tournamentOpponents = [];
      tournamentBracket = null;
    }
    startFight();
  }

  function openSetup() {
    deactivateKekDomain();
    gameState = "idle";
    rumbleSetup.hidden = false;
    overlay.hidden = false;
    showModeStep();
    startButton.textContent = "Choose Fighters";
  }

  function showOverlay(title, text) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlay.hidden = false;
  }

  function codeDown(code) {
    return keys.has(code);
  }

  function justPressed(code) {
    return pressed.has(code);
  }

  function beginAction(f, action) {
    if (f.cooldown > 0 || f.action) return;
    f.action = action;
    f.actionTime = 0;
    f.visualState = action;
    f.visualStateTime = 0;
    f.hitIds.clear();
    if (action === "punch") f.cooldown = 0.28;
    if (action === "kick") f.cooldown = 0.42;
    if (action === "special") {
      f.cooldown = 0.72;
      f.energy = 0;
      f.specialReady = false;
      burst(f.x + f.facing * 62, f.y - 76, 34, f.palette.light);
      shardBlast(f, f.x + f.facing * 96, f.y - 134);
    }
  }

  function inputForFighter(f, opponent, dt) {
    if (!f.isAI) {
      return {
        left: codeDown(f.controls.left),
        right: codeDown(f.controls.right),
        up: justPressed(f.controls.up),
        block: codeDown(f.controls.block),
        charge: codeDown(f.controls.down),
        punch: justPressed(f.controls.punch),
        kick: justPressed(f.controls.kick),
        special: justPressed(f.controls.block) && f.energy >= 100,
      };
    }

    const ai = f.ai;
    const distance = Math.abs(opponent.x - f.x);
    const domainBoost = f.domainEmpowered;
    ai.think -= dt;
    ai.action = null;
    if (ai.think <= 0) {
      ai.think = (domainBoost ? 0.065 : 0.1) + Math.random() * (domainBoost ? 0.075 : 0.12);
      ai.move = distance > 175 ? Math.sign(opponent.x - f.x) : distance < 92 ? -Math.sign(opponent.x - f.x) : 0;
      ai.block = Boolean(opponent.action && distance < 225 && Math.random() < (domainBoost ? 0.68 : 0.52));
      ai.charge = !ai.block && distance > 255 && f.energy < 96;
      if (f.energy >= 100 && distance < (domainBoost ? 430 : 360) && Math.random() < (domainBoost ? 0.78 : 0.62)) ai.action = "special";
      else if (!ai.block && distance < 178 && Math.random() < (domainBoost ? 0.7 : 0.58)) ai.action = Math.random() < 0.56 ? "punch" : "kick";
      else if (distance > 260 && Math.random() < 0.06) ai.action = "jump";
    }
    return {
      left: ai.move < 0,
      right: ai.move > 0,
      up: ai.action === "jump",
      block: ai.block,
      charge: ai.charge,
      punch: ai.action === "punch",
      kick: ai.action === "kick",
      special: ai.action === "special",
    };
  }

  function updateFighter(f, opponent, dt) {
    const input = inputForFighter(f, opponent, dt);
    const left = input.left;
    const right = input.right;
    const up = input.up;
    const wantsBlock = input.block;
    const wantsCharge = input.charge;
    const move = (right ? 1 : 0) - (left ? 1 : 0);
    const canMove = !f.action || f.action === "block";
    const wasGrounded = f.grounded;

    f.facing = opponent.x > f.x ? 1 : -1;
    f.cooldown = Math.max(0, f.cooldown - dt);
    f.invuln = Math.max(0, f.invuln - dt);
    f.hurtTime = Math.max(0, f.hurtTime - dt);
    f.landSquash = Math.max(0, (f.landSquash || 0) - dt * 5.6);
    f.animationClock = (f.animationClock || 0) + dt;
    f.afterimageCooldown = Math.max(0, (f.afterimageCooldown || 0) - dt);
    f.energy = clamp(f.energy + dt * (f.domainEmpowered ? 8.5 : 5.5), 0, 100);
    if (f.energy >= 100) f.specialReady = true;
    f.moveDir = move;
    f.moveMode = move
      ? (Math.sign(move) === f.facing ? "run" : "retreat")
      : "idle";

    if (canMove) {
      const domainSpeed = f.domainEmpowered ? 1.08 : 1;
      f.vx += move * (f.grounded ? 1.38 : 0.74) * domainSpeed;
      f.vx = clamp(f.vx, -13.5 * domainSpeed, 13.5 * domainSpeed);
      if (move) {
        f.state = f.grounded ? f.moveMode : "jump";
        f.walkTime += dt * (f.moveMode === "run" ? 1.45 : 0.92);
      }
    }

    if (up && f.grounded && !f.action) {
      f.vy = -18.9;
      f.grounded = false;
      f.state = "jump";
      f.jumpTime = 0;
      burst(f.x - f.facing * 24, f.y - 8, 8, "rgba(116, 255, 197, 0.85)");
    }

    if (input.punch) beginAction(f, "punch");
    if (input.kick) beginAction(f, "kick");
    if (input.special && f.energy >= 100 && Math.abs(opponent.x - f.x) < 380) beginAction(f, "special");

    f.charging = wantsCharge && !f.action && f.grounded && !wantsBlock;
    f.chargeTime = f.charging ? Math.min(1.5, (f.chargeTime || 0) + dt) : Math.max(0, (f.chargeTime || 0) - dt * 4);
    if (f.charging) {
      f.state = "block";
      f.energy = clamp(f.energy + dt * 24, 0, 100);
      f.vx *= 0.62;
      if (Math.random() < 0.1) {
        sparks.push({
          x: f.x + (Math.random() - 0.5) * 118,
          y: f.y - 40 - Math.random() * 150,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -2.6 - Math.random() * 3.2,
          life: 0.38 + Math.random() * 0.36,
          color: f.palette.light,
          size: 2 + Math.random() * 4,
        });
      }
    }

    f.block = wantsBlock && !f.action && f.grounded;
    f.blockTime = f.block ? Math.min(1, (f.blockTime || 0) + dt) : Math.max(0, (f.blockTime || 0) - dt * 6);
    if (f.block) {
      f.state = "block";
      f.vx *= 0.5;
    }

    if (f.action) {
      f.actionTime += dt;
      f.state = f.action;
      if (f.actionTime >= actionDurations[f.action]) f.action = null;
    }

    f.vy += gravity;
    f.x += f.vx;
    f.y += f.vy;
    if (!f.grounded) f.jumpTime += dt;
    f.vx *= f.grounded ? 0.82 : 0.94;
    f.x = clamp(f.x, 88, W - 88);

    if (f.y >= floorY) {
      f.y = floorY;
      f.vy = 0;
      f.grounded = true;
      if (!wasGrounded) {
        f.landSquash = 1;
        burst(f.x - f.facing * 18, f.y - 4, 5, "rgba(216, 180, 95, 0.65)");
      }
      if (move && !f.action && !f.block && !f.charging) f.state = f.moveMode;
      if (!move && !f.action && !f.block && !f.charging) f.state = "idle";
    }

    const visualState = spriteStateFor(f);
    if (f.visualState !== visualState) {
      f.visualState = visualState;
      f.visualStateTime = 0;
    } else {
      f.visualStateTime = (f.visualStateTime || 0) + dt;
    }

    const animation = animationProfiles[f.characterId] || animationProfiles.crown;
    const trailState = f.action === "special" || f.action === "kick" || (f.action === "punch" && f.actionTime > 0.055);
    if (trailState && f.afterimageCooldown <= 0) {
      afterImages.push({
        ...f,
        x: f.x - f.facing * (f.action === "special" ? 18 : 10),
        palette: { ...f.palette },
        hitIds: new Set(),
        charging: false,
        block: false,
        ttl: f.action === "special" ? 0.22 : 0.15,
        maxTtl: f.action === "special" ? 0.22 : 0.15,
      });
      f.afterimageCooldown = animation.trail;
    }

    if (f.action === "punch" && f.actionTime > 0.07 && f.actionTime < 0.22) {
      tryHit(f, opponent, "punch", f.x + f.facing * 112, f.y - 118, 132, 76, 10);
    }
    if (f.action === "kick" && f.actionTime > 0.12 && f.actionTime < 0.34) {
      tryHit(f, opponent, "kick", f.x + f.facing * 132, f.y - 112, 150, 118, 15);
    }
    if (f.action === "special" && f.actionTime > 0.12 && f.actionTime < 0.48) {
      tryHit(f, opponent, "special", f.x + f.facing * 300, f.y - 130, 520, 150, 24);
    }
  }

  function tryHit(attacker, defender, attack, hx, hy, hw, hh, damage) {
    const hitKey = `${attack}-${defender.id}`;
    if (attacker.hitIds.has(hitKey) || defender.invuln > 0) return;
    const defenderBox = { x: defender.x - 82, y: defender.y - 222, w: 164, h: 222 };
    const hitBox = { x: hx - hw / 2, y: hy - hh / 2, w: hw, h: hh };
    const overlaps =
      hitBox.x < defenderBox.x + defenderBox.w &&
      hitBox.x + hitBox.w > defenderBox.x &&
      hitBox.y < defenderBox.y + defenderBox.h &&
      hitBox.y + hitBox.h > defenderBox.y;
    if (!overlaps) return;

    attacker.hitIds.add(hitKey);
    const blocked = defender.block && Math.sign(attacker.x - defender.x) === defender.facing;
    const empoweredDamage = attacker.domainEmpowered ? Math.ceil(damage * 1.12) : damage;
    const finalDamage = blocked ? Math.ceil(empoweredDamage * 0.28) : empoweredDamage;
    defender.health = clamp(defender.health - finalDamage, 0, 100);
    defender.invuln = 0.18;
    defender.hurtTime = blocked ? 0.12 : attack === "special" ? 0.42 : 0.28;
    defender.vx += attacker.facing * (blocked ? 4 : attack === "special" ? 13 : 8);
    defender.vy += blocked ? -2 : attack === "kick" ? -8 : -5;
    attacker.energy = clamp(attacker.energy + (blocked ? 4 : 10), 0, 100);
    burst(defender.x, defender.y - 80, attack === "special" ? 18 : 8, blocked ? "#d8b45f" : attacker.palette.light);
  }

  function burst(x, y, count, color) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.32 + Math.random() * 0.42,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  function updateSparks(dt) {
    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const s = sparks[i];
      s.life -= dt;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.18;
      if (s.life <= 0) sparks.splice(i, 1);
    }
    for (let i = afterImages.length - 1; i >= 0; i -= 1) {
      afterImages[i].ttl -= dt;
      if (afterImages[i].ttl <= 0) afterImages.splice(i, 1);
    }
  }

  function shardBlast(f, x, y) {
    shardBlasts.push({
      x,
      y,
      facing: f.facing,
      color: f.palette.light,
      trim: f.palette.trim,
      life: 0.34,
      maxLife: 0.34,
      id: f.id,
      characterId: f.characterId,
    });
  }

  function updateShardBlasts(dt) {
    for (let i = shardBlasts.length - 1; i >= 0; i -= 1) {
      const blast = shardBlasts[i];
      blast.life -= dt;
      blast.x += blast.facing * 560 * dt;
      if (blast.life <= 0) shardBlasts.splice(i, 1);
    }
  }

  function endRound(roundWinner) {
    roundWinner.wins += 1;
    winner = roundWinner;
    pauseTimer = 2.2;
    gameState = "round-over";
    if (roundWinner.wins >= firstTo) {
      const rank = roundWinner.health > 60 ? "Vault Champion" : "Relic Bruiser";
      const winnerName = fighterName(roundWinner);
      if (selectedMode === "tournament" && roundWinner.id === 1 && tournamentIndex < tournamentOpponents.length - 1) {
        tournamentIndex += 1;
        gameState = "bout-over";
        pauseTimer = 2.8;
        rumbleSetup.hidden = true;
        renderTournamentBoard();
        const stageName = tournamentIndex === 1 ? "Semifinal" : "Championship";
        const domainFinal = tournamentIndex === tournamentOpponents.length - 1;
        showOverlay(
          domainFinal ? "The Championship Gate is opening" : `${winnerName} advances to the ${stageName}`,
          domainFinal
            ? `${characterRoster[tournamentOpponents[tournamentIndex]].name} has invoked the KEK Domain. The normal arena will not survive the transformation.`
            : `${characterRoster[tournamentOpponents[tournamentIndex]].name} survived the simulated AI bracket and waits in the arena.`
        );
        startButton.textContent = "Tournament Running";
      } else {
        const tournamentWon = selectedMode === "tournament" && roundWinner.id === 1;
        const result = window.EmeraldArcade?.recordAndNotify("rumble", {
          played: true,
          wins: roundWinner.id === 1 ? roundWinner.wins : 0,
          rank: tournamentWon ? "Vault Tournament Champion" : rank,
          rounds: round,
          mode: selectedMode,
          character: fighters[0].characterId,
          tournamentWon,
        });
        if (tournamentWon) {
          renderCharacterCards();
          renderTournamentBoard();
        }
        rumbleSetup.hidden = false;
        if (tournamentWon) {
          overlay.hidden = true;
          showDomainCeremony("completion");
        } else {
          showOverlay(`${winnerName} wins the rumble`, `${rank}. Adjust the fight card or run it back.`);
        }
        launchButton.textContent = selectedMode === "tournament" ? "Run New Tournament" : "Run It Back";
        startButton.textContent = "New Fight Card";
        gameState = "match-over";
        stopDomainMusic();
      }
    } else {
      stateLabel.textContent = `${fighterName(roundWinner)} takes the round`;
    }
  }

  function update(dt) {
    if (kekDomainActive) kekDomainClock += dt;
    if (gameState === "playing") {
      roundTime = Math.max(0, roundTime - dt);
      updateFighter(fighters[0], fighters[1], dt);
      updateFighter(fighters[1], fighters[0], dt);
      updateSparks(dt);
      updateShardBlasts(dt);
      if (fighters[0].health <= 0 || fighters[1].health <= 0) {
        endRound(fighters[0].health > fighters[1].health ? fighters[0] : fighters[1]);
      } else if (roundTime <= 0) {
        endRound(fighters[0].health >= fighters[1].health ? fighters[0] : fighters[1]);
      }
    } else if (gameState === "round-over") {
      pauseTimer -= dt;
      updateSparks(dt);
      updateShardBlasts(dt);
      if (pauseTimer <= 0) {
        round += 1;
        resetRound();
        gameState = "playing";
      }
    } else if (gameState === "bout-over") {
      pauseTimer -= dt;
      updateSparks(dt);
      updateShardBlasts(dt);
      if (pauseTimer <= 0) {
        setCharacter(fighters[1], tournamentOpponents[tournamentIndex]);
        fighters.forEach((fighter) => {
          fighter.wins = 0;
          fighter.energy = 35;
        });
        round = 1;
        resetRound();
        overlay.hidden = true;
        if (tournamentIndex === tournamentOpponents.length - 1) activateKekDomainFinal();
        else gameState = "playing";
      }
    } else if (gameState === "domain-intro") {
      kekDomainIntroTime = Math.max(0, kekDomainIntroTime - dt);
      fighters.forEach((fighter) => {
        fighter.animationClock = (fighter.animationClock || 0) + dt;
        fighter.visualStateTime = (fighter.visualStateTime || 0) + dt;
      });
      updateSparks(dt);
      updateShardBlasts(dt);
      if (kekDomainIntroTime <= 0) gameState = "playing";
    } else {
      updateSparks(dt);
      updateShardBlasts(dt);
    }
    pressed.clear();
  }

  function drawBackground() {
    if (kekDomainActive) {
      drawKekDomainBackground();
      return;
    }
    if (arenaImage.complete && arenaImage.naturalWidth > 0) {
      drawArenaBackground();
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#06120e");
    gradient.addColorStop(0.58, "#030806");
    gradient.addColorStop(1, "#010302");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = "#1be894";
    ctx.lineWidth = 1;
    for (let r = 110; r <= 540; r += 70) {
      ctx.beginPath();
      ctx.ellipse(W / 2, floorY + 16, r, r * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.28;
    for (let x = 100; x < W; x += 120) {
      drawPillar(x, 130, x % 240 === 100 ? 260 : 310);
    }
    ctx.restore();

    ctx.fillStyle = "#08110d";
    ctx.fillRect(0, floorY + 36, W, H - floorY);
    ctx.strokeStyle = "rgba(216, 180, 95, 0.46)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, floorY + 36);
    ctx.lineTo(W, floorY + 36);
    ctx.stroke();

    ctx.save();
    ctx.translate(W / 2, floorY + 34);
    ctx.strokeStyle = "rgba(116, 255, 197, 0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i += 1) {
      ctx.rotate((Math.PI * 2) / 18);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(440, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDomainRuneRing(x, y, radius, rotation, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#a9ff3f";
    ctx.shadowColor = "#79ff32";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    for (let index = 0; index < 18; index += 1) {
      const angle = index * Math.PI * 2 / 18;
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(radius * 0.91, 0);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-5, -5, 10, 10);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawKekDomainBackground() {
    if (!cachedKekDomainArena) cachedKekDomainArena = buildKekDomainArenaCache();
    if (cachedKekDomainArena) {
      ctx.drawImage(cachedKekDomainArena, 0, 0);
    } else {
      const fallback = ctx.createRadialGradient(W / 2, 230, 30, W / 2, 260, 760);
      fallback.addColorStop(0, "#2a8a16");
      fallback.addColorStop(0.35, "#0a2d0d");
      fallback.addColorStop(1, "#010503");
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, W, H);
    }

    if (!cachedKekDomainFx) cachedKekDomainFx = buildKekDomainFxCache();
    ctx.drawImage(cachedKekDomainFx,0,0);
    const pulse = 0.74 + Math.sin(kekDomainClock * 2.8) * 0.18;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let index = 0; index < 10; index += 1) {
      const phase = kekDomainClock * (0.45 + index % 5 * 0.08) + index * 1.73;
      const x = (index * 211 + Math.sin(phase) * 85) % W;
      const y = 100 + ((index * 97 - kekDomainClock * (18 + index % 4 * 7)) % 520 + 520) % 520;
      const size = 1.5 + index % 4;
      ctx.globalAlpha = 0.22 + (index % 3) * 0.12;
      ctx.fillStyle = index % 5 === 0 ? "#e8ff9b" : "#78ff36";
      ctx.fillRect(x, y, size, size * 2.4);
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = `rgba(175, 255, 72, ${0.36 + pulse * 0.18})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(W / 2, floorY + 28, 475, 84, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const vignette = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.2, W / 2, H * 0.5, W * 0.72);
    vignette.addColorStop(0.42, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,5,0,0.62)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function drawKekDomainIntro() {
    if (gameState !== "domain-intro") return;
    const progress = clamp(1 - kekDomainIntroTime / KEK_DOMAIN_INTRO_DURATION, 0, 1);
    const reveal = Math.sin(clamp(progress / 0.88, 0, 1) * Math.PI);
    const ringRadius = 70 + progress * 510;

    ctx.save();
    ctx.fillStyle = `rgba(0, 3, 0, ${clamp(0.86 - progress * 0.62, 0.18, 0.86)})`;
    ctx.fillRect(0, 0, W, H);
    drawDomainRuneRing(W / 2, H / 2, ringRadius, -progress * 1.8, 0.5 * reveal);
    drawDomainRuneRing(W / 2, H / 2, ringRadius * 0.67, progress * 2.4, 0.72 * reveal);

    if (progress > 0.12) {
      const titleAlpha = clamp((progress - 0.12) * 4, 0, 1) * clamp((1 - progress) * 5, 0, 1);
      ctx.globalAlpha = titleAlpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#7dff2d";
      ctx.shadowBlur = 28;
      ctx.fillStyle = "#eaffbd";
      ctx.font = "900 82px Georgia, serif";
      ctx.fillText("KEK DOMAIN", W / 2, H / 2 - 24);
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#9dff45";
      ctx.font = "900 20px Inter, sans-serif";
      ctx.letterSpacing = "6px";
      ctx.fillText("THE CHAMPIONSHIP REALM", W / 2, H / 2 + 52);
      ctx.font = "800 14px Inter, sans-serif";
      ctx.fillStyle = "#f1ffdb";
      ctx.fillText("FINAL BOUT • DOMAIN CHAMPION EMPOWERED", W / 2, H / 2 + 86);
    }
    ctx.restore();
  }

  function drawArenaBackground() {
    if (!cachedArena) cachedArena = buildArenaCache();
    if (cachedArena) ctx.drawImage(cachedArena, 0, 0);

    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.strokeStyle = "rgba(116, 255, 197, 0.46)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(W / 2, floorY + 30, 455, 86, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "rgba(216, 180, 95, 0.56)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, floorY + 36);
    ctx.lineTo(W, floorY + 36);
    ctx.stroke();
  }

  function drawPillar(x, y, height) {
    ctx.fillStyle = "rgba(7, 18, 14, 0.8)";
    ctx.strokeStyle = "rgba(216, 180, 95, 0.26)";
    ctx.lineWidth = 2;
    ctx.fillRect(x - 28, y, 56, height);
    ctx.strokeRect(x - 28, y, 56, height);
    ctx.fillRect(x - 40, y + height, 80, 18);
    ctx.strokeRect(x - 40, y + height, 80, 18);
    ctx.strokeStyle = "rgba(35, 240, 156, 0.28)";
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 40 + i * 42);
      ctx.lineTo(x + 12, y + 60 + i * 42);
      ctx.stroke();
    }
  }

  function drawPepe(f, ghostAlpha) {
    if (pepeSprites.idle.complete && pepeSprites.idle.naturalWidth > 0) {
      drawSpritePepe(f, ghostAlpha);
      return;
    }

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.facing, 1);
    ctx.globalAlpha = ghostAlpha || 1;
    const pose = poseFor(f);

    drawLimb(pose.legBack, f.palette.dark, 20);
    drawLimb(pose.legFront, f.palette.body, 22);

    ctx.fillStyle = f.block ? "#1d6e40" : f.palette.body;
    roundRect(-27, -104, 54, 78, 25);
    ctx.fill();
    ctx.strokeStyle = f.palette.trim;
    ctx.lineWidth = 3;
    ctx.stroke();

    drawLimb(pose.armBack, f.palette.dark, 18);
    drawLimb(pose.armFront, f.palette.body, 20);

    ctx.fillStyle = f.palette.light;
    ctx.beginPath();
    ctx.ellipse(0, -148, 48, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = f.palette.dark;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#dfffe9";
    ctx.beginPath();
    ctx.ellipse(-18, -158, 15, 9, -0.08, 0, Math.PI * 2);
    ctx.ellipse(17, -158, 15, 9, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = f.palette.dark;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#08140d";
    ctx.beginPath();
    ctx.arc(-14, -158, 4, 0, Math.PI * 2);
    ctx.arc(21, -158, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#07130c";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-28, -138);
    ctx.quadraticCurveTo(-2, -126, 32, -137);
    ctx.stroke();

    ctx.strokeStyle = f.palette.trim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -149, 39, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();

    if (f.energy >= 100) {
      ctx.strokeStyle = "rgba(116, 255, 197, 0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -92, 58, 88, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawSpritePepe(f, ghostAlpha) {
    const alpha = ghostAlpha || 1;
    const action = spriteStateFor(f);
    const spriteKey = action === "run" || action === "retreat" || action === "jump" ? "idle" : action;
    const premiumState = action === "run" || action === "retreat" ? "walk" : action;
    const variant = characterRoster[f.characterId]?.variant || "normal";
    const isCustomSprite = Boolean(customSpritePaths[f.characterId]);
    const cachedSprite = isCustomSprite ? null : spriteDrawCache[spriteKey]?.[variant === "corrupt" ? "corrupt" : "normal"];
    const customSprite = customSpriteCache[f.characterId]?.[premiumState] || customSpriteCache[f.characterId]?.idle;
    let sprite = customSprite || ensureCustomSprite(f.characterId, premiumState) || cachedSprite || pepeSprites[spriteKey] || pepeSprites.idle;
    const spriteReady = sprite instanceof HTMLCanvasElement
      ? sprite.width > 0 && sprite.height > 0
      : sprite.complete && sprite.naturalWidth > 0;
    if (!spriteReady) sprite = pepeSprites.idle;
    const profile = spriteProfiles[action] || spriteProfiles.idle;
    const isGhost = alpha < 1;
    const animation = animationProfiles[f.characterId] || animationProfiles.crown;
    const runCycle = Math.sin((f.walkTime || 0) * 14 * animation.stride);
    const retreatCycle = Math.sin((f.walkTime || 0) * 10 * animation.stride);
    const jumpProgress = clamp((f.jumpTime || 0) / 0.62, 0, 1);
    const jumpPose =
      action === "jump" && f.vy < -6 ? "takeoff" :
      action === "jump" && f.vy > 7 ? "fall" :
      action === "jump" ? "float" :
      "ground";
    const land = f.landSquash || 0;
    const breath = Math.sin((f.animationClock || 0) * Math.PI * animation.idleRate);
    const actionProgress = f.action && actionDurations[f.action]
      ? clamp(f.actionTime / actionDurations[f.action], 0, 1)
      : 0;
    const actionPulse = Math.sin(actionProgress * Math.PI);
    const stateProgress = clamp((f.visualStateTime || 0) / (action === "ko" ? 0.62 : 0.3), 0, 1);
    let bob =
      action === "run" ? Math.abs(runCycle) * -4 :
      action === "retreat" ? Math.abs(retreatCycle) * -2 :
      action === "idle" ? breath * animation.idleAmp :
      0;
    const jumpLift =
      jumpPose === "takeoff" ? -24 - jumpProgress * 8 :
      jumpPose === "float" ? -34 :
      jumpPose === "fall" ? -18 :
      0;
    let motionX = 0;
    let motionY = 0;
    let rotation = 0;
    let scaleX = 1;
    let scaleY = 1;

    if (action === "run") {
      motionX = 8 + runCycle * 1.8;
      rotation = 0.018 + runCycle * 0.006;
    } else if (action === "retreat") {
      motionX = -7 + retreatCycle * 1.4;
      rotation = -0.016 + retreatCycle * 0.004;
    } else if (action === "jump") {
      motionX = clamp(f.vy * 0.34, -9, 9);
      rotation = clamp(f.vy / 170, -0.085, 0.1);
      motionY = jumpPose === "float" ? -4 : 0;
    } else if (action === "punch") {
      motionX = animation.lunge * actionPulse;
      motionY = -2 * actionPulse;
      rotation = -0.035 * actionPulse;
      scaleX = 1 + 0.025 * actionPulse;
    } else if (action === "kick") {
      motionX = animation.kickDrive * actionPulse;
      motionY = -5 * actionPulse;
      rotation = 0.055 * actionPulse;
      scaleX = 1 + 0.02 * actionPulse;
    } else if (action === "special") {
      motionX = animation.lunge * 0.45 * actionPulse;
      motionY = -animation.specialLift * actionPulse;
      rotation = -0.02 * actionPulse;
      scaleX = 1 + 0.025 * actionPulse;
      scaleY = 1 + 0.025 * actionPulse;
    } else if (action === "block") {
      const guardPulse = Math.sin((f.blockTime || f.chargeTime || 0) * 15);
      motionX = f.charging ? 0 : -4;
      motionY = f.charging ? -2 - Math.abs(guardPulse) * 2 : Math.abs(guardPulse) * -1.2;
      rotation = f.charging ? Math.sin((f.animationClock || 0) * 28) * 0.006 : -0.015;
    } else if (action === "hurt") {
      const recoil = 1 - stateProgress;
      motionX = -animation.shake * 2.2 * recoil + Math.sin(stateProgress * Math.PI * 5) * animation.shake * recoil;
      motionY = -3 * recoil;
      rotation = 0.055 * recoil;
    } else if (action === "ko") {
      motionY = 5 * stateProgress;
      rotation = 0.035 * stateProgress;
    } else {
      rotation = breath * 0.004;
    }

    if (land) {
      motionY += land * 3;
      scaleX += land * 0.035;
    }
    const rosterProfile = characterRoster[f.characterId] || characterRoster.crown;
    const stateRenderScale = stateRenderScales[f.characterId]?.[premiumState] || 1;
    const customHeight = (rosterProfile.renderHeight || 198) * stateRenderScale * (action === "ko" ? 0.52 : 1);
    const height = customSprite ? customHeight : profile.h * (rosterProfile.renderScaleY || 1);
    const width = customSprite ? height * (customSprite.width / customSprite.height) : profile.w * (rosterProfile.renderScaleX || 1);
    const verticalOffset = customSprite ? (action === "ko" ? 8 : 4) : profile.y;

    ctx.save();
    ctx.translate(f.x + motionX * (f.facing || 1), f.y + verticalOffset + bob + jumpLift + motionY);
    ctx.rotate(rotation * (f.facing || 1));
    ctx.scale((f.facing || 1) * scaleX, scaleY);
    ctx.globalAlpha = alpha;
    const darkEffect = effectVariant(f) === 2;
    ctx.shadowColor = f.energy >= 100 && !isGhost
      ? (darkEffect ? "rgba(255, 74, 74, 0.9)" : "rgba(116, 255, 197, 0.85)")
      : (darkEffect ? "rgba(255, 74, 74, 0.42)" : "rgba(35, 240, 156, 0.35)");
    ctx.shadowBlur = f.energy >= 100 && !isGhost ? 8 : 0;
    if (!isGhost && (auraQaMode || f.charging || action === "special" || f.domainEmpowered)) drawShardAura(f, action);
    ctx.drawImage(sprite, -width / 2, -height, width, height);

    if (!isGhost && f.block && !customSprite) drawShardShield(f);

    if (!isGhost && action === "run") {
      drawMotionDust(-58 - Math.abs(runCycle) * 6, -8, f.palette.light, runCycle);
    }
    if (!isGhost && action === "retreat") {
      drawRetreatDust(-40 - Math.abs(retreatCycle) * 8, -8, f.palette.trim, retreatCycle);
    }
    if (!isGhost && action === "jump") drawJumpTrail(-22, -16, f.palette.light, jumpPose);
    if (!isGhost && action === "punch") drawAttackArc(116, -160, 34, f.palette.light, actionProgress, 0.78);
    if (!isGhost && action === "kick") drawAttackArc(118, -132, 50, f.palette.trim, actionProgress, 1.02);
    if (!isGhost && action === "special") drawActionAccent(f, actionProgress);
    ctx.restore();
  }

  function spriteStateFor(f) {
    if (typeof f.health === "number" && f.health <= 0) return "ko";
    if ((f.hurtTime || 0) > 0) return "hurt";
    if (f.action === "special") return "special";
    if (f.action === "kick") return "kick";
    if (f.action === "punch") return "punch";
    if (f.block || f.state === "block") return "block";
    if (f.grounded === false || f.state === "jump") return "jump";
    if (f.state === "run") return "run";
    if (f.state === "retreat") return "retreat";
    if (f.state === "walk") return "walk";
    return "idle";
  }

  function drawMotionDust(x, y, color, cycle = 0) {
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.abs(cycle) * 0.1;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 3;
    for (let i = 0; i < 3; i += 1) {
      const puff = 7 - i * 1.4;
      const px = x - i * 18 + Math.sin(cycle + i) * 3;
      const py = y + i * 3;
      ctx.beginPath();
      ctx.ellipse(px, py, puff * 1.35, puff * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRetreatDust(x, y, color, cycle) {
    ctx.save();
    ctx.globalAlpha = 0.12 + Math.abs(cycle) * 0.08;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 3;
    for (let i = 0; i < 2; i += 1) {
      const puff = 5 - i;
      ctx.beginPath();
      ctx.ellipse(x - i * 14, y + i * 5, puff * 1.2, puff * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawJumpTrail(x, y, color, pose) {
    ctx.save();
    ctx.globalAlpha = pose === "takeoff" ? 0.28 : pose === "fall" ? 0.18 : 0.14;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    if (pose === "takeoff") {
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.ellipse(x - 24 + i * 18, y + 42 + i * 3, 9 - i, 4.5 - i * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (pose === "fall") {
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.ellipse(x - 12 + i * 16, y + 28 + i * 5, 6 - i, 3.4 - i * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(x + 8, y + 34, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAttackArc(x, y, radius, color, progress = 0.5, sweepScale = 1) {
    const visibility = Math.sin(clamp((progress - 0.08) / 0.76, 0, 1) * Math.PI);
    if (visibility <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = visibility * 0.92;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5 + visibility * 4;
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 + visibility * 8;
    ctx.beginPath();
    const lead = -0.95 + progress * 0.5;
    ctx.arc(x, y, radius, lead, lead + 1.45 * sweepScale);
    ctx.stroke();
    ctx.globalAlpha *= 0.42;
    ctx.lineWidth *= 0.55;
    ctx.beginPath();
    ctx.arc(x - 12, y + 7, radius * 0.78, lead - 0.15, lead + 1.2 * sweepScale);
    ctx.stroke();
    ctx.restore();
  }

  function drawActionAccent(f, progress) {
    const pulse = Math.sin(clamp(progress, 0, 1) * Math.PI);
    if (pulse <= 0.01) return;
    const now = performance.now();
    const style = characterRoster[f.characterId]?.specialStyle || (f.characterId === "corrupt" ? "corrupt" : "crown");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.25 + pulse * 0.58;
    ctx.strokeStyle = f.palette.light;
    ctx.fillStyle = `${f.palette.light}44`;
    ctx.shadowColor = f.palette.light;
    ctx.shadowBlur = 8 + pulse * 14;
    ctx.lineWidth = style === "rage-wave" ? 8 : 4;

    if (style === "shuriken") {
      for (let i = 0; i < 3; i += 1) {
        ctx.save();
        ctx.translate(54 + i * 26, -142 + (i - 1) * 18);
        ctx.rotate(now / 70 + i * 1.7);
        ctx.strokeRect(-10, -10, 20, 20);
        ctx.restore();
      }
    } else if (style === "railgun") {
      ctx.strokeRect(42, -168, 82 + pulse * 42, 54);
      ctx.beginPath();
      ctx.moveTo(54, -141); ctx.lineTo(178 + pulse * 34, -141);
      ctx.stroke();
    } else if (style === "ricochet") {
      ctx.setLineDash([13, 8]);
      ctx.lineDashOffset = -now / 18;
      ctx.beginPath();
      ctx.moveTo(24, -154); ctx.lineTo(82, -184); ctx.lineTo(136, -132);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (style === "rage-wave") {
      ctx.beginPath();
      ctx.arc(18, -88, 78 + pulse * 32, -1.28, 1.18);
      ctx.stroke();
    } else if (style === "faceted" || style === "prism") {
      for (let i = 0; i < 4; i += 1) drawMiniShard(48 + i * 25, -154 + (i % 2 ? 18 : -10), 9 + pulse * 5, f.palette.trim, now / 260 + i);
    } else if (style === "rift" || style === "corrupt") {
      ctx.beginPath();
      ctx.ellipse(76, -142, 42 + pulse * 35, 76 + pulse * 18, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(68, -142, 34 + pulse * 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShardAura(f, action) {
    const charge = auraQaMode ? 1 : clamp(f.energy / 100, 0, 1);
    if (!auraQaMode && !f.charging && action !== "special" && !f.domainEmpowered) return;
    const now = performance.now();
    const pulse = 0.72 + Math.sin(now / 115) * 0.28;
    const darkEffect = effectVariant(f) === 2;
    const flameColor = darkEffect ? "255, 74, 74" : "116, 255, 197";
    const lightningColor = darkEffect ? "196, 84, 255" : "116, 255, 197";
    const isCharging = f.charging || auraQaMode;
    const auraAlpha = f.domainEmpowered ? 0.88 : isCharging || charge >= 1 ? 0.78 : 0.2 + charge * 0.34;
    const visualHeight = fighterVisualHeight(f);
    const auraProfile = auraProfiles[f.characterId] || auraProfiles.crown;
    const radiusX = visualHeight * auraProfile.orbitX * (0.82 + charge * 0.18) + pulse * 5;
    const radiusY = visualHeight * auraProfile.orbitY * (0.82 + charge * 0.18) + pulse * 7;

    ctx.save();
    ctx.strokeStyle = `rgba(${flameColor}, ${auraAlpha})`;
    ctx.lineWidth = isCharging ? 5 : 3 + charge * 2;
    ctx.shadowColor = `rgba(${lightningColor}, 0.95)`;
    ctx.shadowBlur = isCharging ? 12 : 5 + charge * 7;

    if (drawGeneratedShardAura(f, charge, now, auraAlpha, isCharging, auraProfile)) {
      ctx.shadowBlur = 5;
    } else {
      drawShardKiFlame(flameColor, lightningColor, charge, now, isCharging);
    }

    const shardCount = isCharging ? 7 : 4;
    for (let i = 0; i < shardCount; i += 1) {
      const spin = now / (720 + i * 80);
      const angle = spin + (i / shardCount) * Math.PI * 2;
      const x = Math.cos(angle) * (radiusX * 0.84);
      const y = -visualHeight * 0.58 + Math.sin(angle) * (radiusY * 0.84);
      drawMiniShard(x, y, (7 + charge * 6) * (visualHeight / 218), f.palette.light, angle);
    }
    ctx.restore();
  }

  function drawGeneratedShardAura(f, charge, now, auraAlpha, isCharging, auraProfile) {
    const visualHeight = fighterVisualHeight(f);
    const breathe = 1 + Math.sin(now / 105) * (isCharging ? 0.035 : 0.018);
    const surge = isCharging ? 1 : 0.82 + charge * 0.18;
    const chargeScale = 0.92 + charge * 0.08;
    const width = visualHeight * auraProfile.width * breathe * chargeScale;
    const height = visualHeight * auraProfile.height * breathe * chargeScale;
    const alpha = clamp((isCharging ? auraProfile.alpha : auraProfile.alpha * (0.34 + charge * 0.34)) * surge, 0.12, 0.76);
    const xJitter = Math.sin(now / 62) * (isCharging ? 2.5 : 1.2);
    const yJitter = Math.cos(now / 78) * (isCharging ? 2.5 : 1.1);

    if (premiumAuraAtlas.complete && premiumAuraAtlas.naturalWidth > 0) {
      const cellWidth = premiumAuraAtlas.naturalWidth / 2;
      const cellHeight = premiumAuraAtlas.naturalHeight / 2;
      const sourceX = auraProfile.cell % 2 * cellWidth;
      const sourceY = Math.floor(auraProfile.cell / 2) * cellHeight;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        premiumAuraAtlas,
        sourceX,
        sourceY,
        cellWidth,
        cellHeight,
        -width / 2 + xJitter,
        -height + auraProfile.baseline + yJitter,
        width,
        height
      );
      ctx.globalAlpha = alpha * 0.22;
      ctx.drawImage(
        premiumAuraAtlas,
        sourceX,
        sourceY,
        cellWidth,
        cellHeight,
        -width * 0.46 - xJitter,
        -height * 0.96 + auraProfile.baseline - yJitter,
        width * 0.92,
        height * 0.96
      );
      ctx.restore();
      return true;
    }

    const variant = effectVariant(f);
    const aura = auraDrawCache[variant] || auraSprites[variant];
    if (!aura || !aura.complete && !aura.width) return false;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = alpha;
    ctx.drawImage(aura, -width / 2 + xJitter, -height + 18 + yJitter, width, height);
    ctx.globalAlpha = alpha * 0.42;
    ctx.drawImage(aura, -width * 0.44 - xJitter, -height * 0.94 + 16 - yJitter, width * 0.88, height * 0.94);
    ctx.restore();

    return true;
  }

  function drawShardShield(f) {
    const shieldStyle = characterRoster[f.characterId]?.shieldStyle;
    if (shieldStyle) {
      drawCustomShield(f, shieldStyle);
      return;
    }
    const shield = shieldSprites[effectVariant(f)];
    const pulse = 0.96 + Math.sin(performance.now() / 80) * 0.04;
    const shieldScale = fighterVisualHeight(f) / 218;
    const w = 142 * shieldScale;
    const h = 142 * shieldScale;
    ctx.save();
    ctx.translate(76, -130);
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = 0.88;
    if (shield.complete && shield.naturalWidth > 0) {
      ctx.drawImage(shield, -w * 0.28, -h / 2, w, h);
    } else {
      ctx.strokeStyle = f.palette.light;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(48, 0, 58, 88, 0, -1.25, 1.25);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCustomShield(f, style) {
    const now = performance.now();
    const pulse = 1 + Math.sin(now / 90) * 0.035;
    const spin = now / 520;
    ctx.save();
    ctx.translate(82, -128);
    ctx.scale(pulse, pulse);
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = f.palette.light;
    ctx.shadowBlur = style === "war-rune" ? 16 : 10;
    ctx.lineWidth = style === "war-rune" ? 7 : 5;
    ctx.strokeStyle = f.palette.light;
    ctx.fillStyle = `${f.palette.dark}aa`;

    if (style === "faceted" || style === "reactor") {
      const sides = style === "reactor" ? 8 : 6;
      const radius = style === "reactor" ? 76 : 70;
      ctx.beginPath();
      for (let i = 0; i < sides; i += 1) {
        const angle = -Math.PI / 2 + i * Math.PI * 2 / sides;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 1.18;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 0.55;
      for (let i = 0; i < sides; i += 1) {
        const angle = spin + i * Math.PI * 2 / sides;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius * 1.18);
        ctx.stroke();
      }
    } else if (style === "smoke") {
      ctx.setLineDash([15, 9]);
      ctx.lineDashOffset = -now / 24;
      ctx.beginPath();
      ctx.ellipse(0, 0, 70, 88, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 4; i += 1) {
        const angle = spin + i * Math.PI / 2;
        drawMiniShard(Math.cos(angle) * 58, Math.sin(angle) * 72, 10, f.palette.trim, angle);
      }
    } else if (style === "bounty") {
      ctx.beginPath();
      ctx.ellipse(0, 0, 68, 86, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = f.palette.trim;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-34, -58); ctx.lineTo(34, 58);
      ctx.moveTo(34, -58); ctx.lineTo(-34, 58);
      ctx.stroke();
      drawMiniShard(0, 0, 24, f.palette.trim, spin);
    } else {
      const points = style === "war-rune" ? 10 : 8;
      const outer = style === "war-rune" ? 88 : 72;
      ctx.beginPath();
      for (let i = 0; i < points; i += 1) {
        const angle = -Math.PI / 2 + i * Math.PI * 2 / points;
        const radius = i % 2 ? outer * 0.72 : outer;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 1.08;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = f.palette.trim;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-38, -52); ctx.lineTo(4, -12); ctx.lineTo(-18, 18); ctx.lineTo(42, 56);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShardKiFlame(color, lightningColor, charge, now, isCharging) {
    const height = 170 + charge * 76;
    const width = 82 + charge * 42;
    const flicker = Math.sin(now / 72) * 8;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let layer = 0; layer < 2; layer += 1) {
      const layerWidth = width * (1 - layer * 0.28);
      const layerHeight = height * (1 - layer * 0.18);
      const licks = 8 - layer;
      const gradient = ctx.createLinearGradient(0, -28, 0, -layerHeight);
      gradient.addColorStop(0, `rgba(${color}, ${0.03 + layer * 0.02})`);
      gradient.addColorStop(0.3, `rgba(${color}, ${0.22 + charge * 0.2 - layer * 0.04})`);
      gradient.addColorStop(0.78, `rgba(${color}, ${0.12 + charge * 0.12})`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(-layerWidth, -24);
      for (let i = 0; i <= licks; i += 1) {
        const t = i / licks;
        const wave = Math.sin(now / (80 + layer * 22) + i * 1.7) * (12 - layer * 3);
        const taper = Math.sin(t * Math.PI);
        const lickHeight = layerHeight * (0.58 + taper * 0.48 + (i % 2) * 0.18);
        const x = -layerWidth + t * layerWidth * 2 + wave;
        const y = -48 - taper * lickHeight - Math.sin(now / 115 + i) * 14 - flicker;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(layerWidth, -24);
      ctx.quadraticCurveTo(0, 20, -layerWidth, -24);
      ctx.fill();
    }

    ctx.strokeStyle = `rgba(${color}, ${0.38 + charge * 0.28})`;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-width * 0.75, -40);
    ctx.quadraticCurveTo(-width * 0.42, -height * 0.5, -width * 0.22, -height - flicker);
    ctx.moveTo(width * 0.68, -42);
    ctx.quadraticCurveTo(width * 0.32, -height * 0.52, width * 0.16, -height * 0.92 + flicker);
    ctx.stroke();

    drawAuraLightning(lightningColor, charge, now, isCharging);
    ctx.restore();
  }

  function drawAuraLightning(color, charge, now, isCharging) {
    const boltCount = isCharging ? 5 : 3;
    const alpha = isCharging ? 0.62 : 0.34 + charge * 0.18;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = `rgba(${color}, 0.9)`;
    ctx.shadowBlur = isCharging ? 12 : 7;
    for (let i = 0; i < boltCount; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const phase = now / (88 + i * 15) + i * 2.1;
      const startX = side * (42 + i * 8 + Math.sin(phase) * 10);
      const startY = -64 - i * 10;
      const segments = 4;
      ctx.strokeStyle = `rgba(${color}, ${alpha * (1 - i * 0.08)})`;
      ctx.lineWidth = i === 0 ? 3.4 : 2.2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      for (let s = 1; s <= segments; s += 1) {
        const t = s / segments;
        const arc = Math.sin(t * Math.PI);
        const x = startX + side * arc * (18 + charge * 18) + Math.sin(phase + s * 1.8) * 12;
        const y = startY - t * (92 + charge * 90) + Math.cos(phase + s) * 9;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMiniShard(x, y, size, color, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(239, 255, 247, 0.78)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.58, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.58, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawShardBlasts() {
    shardBlasts.forEach((blast) => {
      const progress = 1 - blast.life / blast.maxLife;
      const alpha = clamp(blast.life / blast.maxLife, 0, 1);
      const length = 130 + progress * 110;
      const color = blast.id === 2 ? "255, 74, 74" : "116, 255, 197";
      const specialStyle = characterRoster[blast.characterId]?.specialStyle;

      ctx.save();
      ctx.translate(blast.x, blast.y);
      ctx.scale(blast.facing, 1);
      ctx.globalAlpha = alpha;
      ctx.shadowColor = specialStyle ? blast.color : `rgba(${color}, 0.95)`;
      ctx.shadowBlur = 10;

      if (specialStyle) {
        drawCustomSpecialBlast(blast, specialStyle, progress, alpha, length);
        ctx.restore();
        return;
      }

      const gradient = ctx.createLinearGradient(0, 0, length, 0);
      gradient.addColorStop(0, `rgba(239, 255, 247, ${0.92 * alpha})`);
      gradient.addColorStop(0.34, `rgba(${color}, ${0.84 * alpha})`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(length, 0);
      ctx.lineTo(0, 34);
      ctx.quadraticCurveTo(28, 0, 0, -34);
      ctx.fill();

      for (let i = 0; i < 5; i += 1) {
        drawMiniShard(18 + i * 24, (i - 2) * 12, 10 - i * 0.7, blast.color, progress * 5 + i);
      }
      ctx.restore();
    });
  }

  function drawCustomSpecialBlast(blast, style, progress, alpha, length) {
    const now = performance.now();
    const color = blast.color;
    const trim = blast.trim;
    ctx.globalCompositeOperation = "screen";

    if (style === "railgun") {
      const beamHeight = 20 + progress * 14;
      ctx.fillStyle = color;
      ctx.fillRect(0, -beamHeight / 2, length * 1.22, beamHeight);
      ctx.fillStyle = "rgba(239,255,247,0.92)";
      ctx.fillRect(0, -4, length * 1.3, 8);
      ctx.strokeStyle = trim;
      ctx.lineWidth = 4;
      ctx.strokeRect(-8, -beamHeight, 32, beamHeight * 2);
      for (let i = 0; i < 4; i += 1) {
        ctx.strokeRect(34 + i * 42, -beamHeight * 0.72, 22, beamHeight * 1.44);
      }
      return;
    }

    if (style === "shuriken") {
      for (let i = 0; i < 5; i += 1) {
        const x = 24 + i * 39 + progress * 30;
        const y = (i - 2) * 17;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(now / 65 + i);
        ctx.fillStyle = i % 2 ? trim : color;
        ctx.beginPath();
        for (let point = 0; point < 8; point += 1) {
          const angle = point * Math.PI / 4;
          const radius = point % 2 ? 5 : 18;
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          if (point === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    if (style === "ricochet") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(length * 0.34, -28);
      ctx.lineTo(length * 0.68, 24);
      ctx.lineTo(length, -8);
      ctx.stroke();
      for (let i = 0; i < 5; i += 1) {
        const x = 16 + i * length / 5;
        ctx.fillStyle = trim;
        ctx.beginPath();
        ctx.arc(x, Math.sin(i * 2.4) * 23, 10 - i, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (style === "rage-wave") {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-12, 52);
      ctx.quadraticCurveTo(length * 0.42, -116, length * 1.1, -38);
      ctx.lineTo(length * 0.88, 8);
      ctx.quadraticCurveTo(length * 0.4, -54, 0, 76);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = trim;
      ctx.lineWidth = 9;
      ctx.stroke();
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, length, 0);
    gradient.addColorStop(0, "rgba(239,255,247,0.94)");
    gradient.addColorStop(0.28, color);
    gradient.addColorStop(1, `${color}00`);
    ctx.fillStyle = gradient;
    if (style === "prism") {
      ctx.beginPath();
      ctx.moveTo(0, -42);
      ctx.lineTo(length, 0);
      ctx.lineTo(0, 42);
      ctx.lineTo(24, 0);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 5; i += 1) drawMiniShard(28 + i * 34, (i % 2 ? 1 : -1) * 18, 12, trim, progress * 4 + i);
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-10, -42);
      for (let i = 0; i < 7; i += 1) {
        ctx.lineTo(24 + i * 32, (i % 2 ? 1 : -1) * (34 + i * 3));
      }
      ctx.lineTo(length, 0);
      ctx.lineTo(-10, 42);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = trim;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  function poseFor(f) {
    const t = performance.now() / 120;
    const walk = f.state === "walk" ? Math.sin(t) * 10 : 0;
    const pose = {
      legBack: [[-10, -32], [-27 - walk, -4], [-36 - walk, 0]],
      legFront: [[12, -32], [25 + walk, -2], [36 + walk, 0]],
      armBack: [[-22, -90], [-50, -66], [-58, -42]],
      armFront: [[22, -88], [50, -65], [58, -42]],
    };

    if (f.state === "punch") {
      const reach = f.actionTime < 0.16 ? 92 : 56;
      pose.armFront = [[23, -90], [56, -98], [reach, -96]];
      pose.armBack = [[-20, -88], [-42, -70], [-52, -48]];
    }
    if (f.state === "kick") {
      const reach = f.actionTime < 0.28 ? 96 : 52;
      pose.legFront = [[13, -32], [52, -28], [reach, -38]];
      pose.armFront = [[20, -88], [38, -66], [48, -48]];
    }
    if (f.state === "block") {
      pose.armFront = [[24, -92], [44, -112], [34, -134]];
      pose.armBack = [[-18, -92], [18, -112], [26, -136]];
    }
    if (f.state === "special") {
      pose.armFront = [[20, -92], [72, -84], [112, -82]];
      pose.armBack = [[-20, -90], [-58, -112], [-74, -136]];
    }
    if (!f.grounded) {
      pose.legBack = [[-10, -32], [-34, -12], [-22, 10]];
      pose.legFront = [[12, -32], [38, -16], [24, 12]];
    }
    return pose;
  }

  function drawLimb(points, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    ctx.quadraticCurveTo(points[1][0], points[1][1], points[2][0], points[2][1]);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(points[2][0], points[2][1], width * 0.48, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawSparks() {
    sparks.forEach((s) => {
      ctx.save();
      ctx.globalAlpha = clamp(s.life * 2, 0, 1);
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawWins() {
    fighters.forEach((f, idx) => {
      const startX = idx === 0 ? 42 : W - 128;
      for (let i = 0; i < firstTo; i += 1) {
        ctx.fillStyle = i < f.wins ? f.palette.light : "rgba(149, 180, 166, 0.22)";
        ctx.strokeStyle = "rgba(216, 180, 95, 0.5)";
        ctx.beginPath();
        ctx.arc(startX + i * 34, 142, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });
  }

  function render() {
    const introShake = gameState === "domain-intro" ? Math.max(0, kekDomainIntroTime - 0.7) / KEK_DOMAIN_INTRO_DURATION : 0;
    const combatShake = kekDomainActive && fighters[1].action === "special" ? 2.4 : 0;
    const shake = introShake * 8 + combatShake;
    ctx.save();
    if (shake) ctx.translate(Math.sin(kekDomainClock * 63) * shake, Math.cos(kekDomainClock * 47) * shake * 0.55);
    drawBackground();
    afterImages.forEach((ghost) => drawPepe(ghost, clamp(ghost.ttl / ghost.maxTtl, 0, 1) * 0.22));
    drawPepe(fighters[0]);
    drawPepe(fighters[1]);
    drawShardBlasts();
    drawSparks();
    drawWins();
    ctx.restore();
    drawKekDomainIntro();
  }

  function syncHud() {
    p1Name.textContent = fighterName(fighters[0]);
    p2Name.textContent = kekDomainActive ? `Domain Champion • ${fighterName(fighters[1])}` : fighterName(fighters[1]);
    p1Health.textContent = Math.ceil(fighters[0].health);
    p2Health.textContent = Math.ceil(fighters[1].health);
    p1Meter.value = fighters[0].health;
    p2Meter.value = fighters[1].health;
    roundLabel.textContent = kekDomainActive ? `KEK Final • Round ${round}` : `Round ${round}`;
    timerLabel.textContent = Math.ceil(roundTime);
    if (gameState === "playing") {
      const bout = selectedMode === "tournament" ? ` | bout ${tournamentIndex + 1}/${tournamentOpponents.length}` : "";
      const domain = kekDomainActive ? " | domain champion empowered" : "";
      stateLabel.textContent = `first to ${firstTo} rounds${bout}${domain} | P1 energy ${Math.floor(fighters[0].energy)} | P2 energy ${Math.floor(fighters[1].energy)}`;
    } else if (gameState === "domain-intro") {
      stateLabel.textContent = "domain expansion in progress";
    } else if (gameState === "idle") {
      stateLabel.textContent = "choose fighters and mode";
    } else if (gameState === "domain-ceremony") {
      stateLabel.textContent = "championship threshold · enter when ready";
    } else if (gameState === "match-over") {
      stateLabel.textContent = "match complete";
    }
    p1Controls.textContent = "WASD move | S charge | F punch | G kick | H shield/special";
    p2Controls.textContent = fighters[1].isAI
      ? "CPU rival | adaptive movement, blocks, charge, and relic bursts"
      : "Arrows move | Down charge | J punch | K kick | L shield/special";
    canvas.dataset.debugState = JSON.stringify({
      gameState,
      kekDomainActive,
      tournamentIndex,
      fighters: fighters.map((fighter) => ({
        characterId: fighter.characterId,
        x: Math.round(fighter.x),
        facing: fighter.facing,
        state: fighter.state,
        action: fighter.action,
        visualState: fighter.visualState,
        visualStateTime: Number((fighter.visualStateTime || 0).toFixed(2)),
        renderHeight: fighterVisualHeight(fighter),
      })),
      activeBlasts: shardBlasts.map((blast) => ({ characterId: blast.characterId, facing: blast.facing })),
      afterimages: afterImages.length,
      fps: perfFps,
    });
  }

  function loop(now) {
    if (now - lastRenderTime < 1000 / 60) {
      requestAnimationFrame(loop);
      return;
    }
    // Preserve real combat speed when a device cannot sustain the 60 FPS render target.
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastRenderTime = now;
    lastTime = now;
    perfFrames += 1;
    if (now - perfSince >= 1000) {
      perfFps = Math.round(perfFrames * 1000 / (now - perfSince));
      perfFrames = 0;
      perfSince = now;
    }
    update(dt);
    render();
    syncHud();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (event) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
    if (!keys.has(event.code)) pressed.add(event.code);
    keys.add(event.code);
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      modeButtons.forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle("is-selected", selected);
        candidate.setAttribute("aria-pressed", String(selected));
      });
      showRosterStep(button.dataset.mode);
    });
  });

  backToModes.addEventListener("click", showModeStep);
  p1DraftSlot.addEventListener("click", () => {
    activeDraftSlot = "p1";
    updateDraftPreviews();
    renderCharacterCards();
  });
  p2DraftSlot.addEventListener("click", () => {
    if (selectedMode !== "pvp") return;
    activeDraftSlot = "p2";
    updateDraftPreviews();
    renderCharacterCards();
  });
  startButton.addEventListener("click", openSetup);
  launchButton.addEventListener("click", launchSelectedFight);
  domainCeremonyButton.addEventListener("click", () => {
    domainCeremony.hidden = true;
    if (domainCeremonyMode === "completion") { openSetup(); return; }
    kekDomainIntroTime = KEK_DOMAIN_INTRO_DURATION;
    gameState = "domain-intro";
  });

  window.__relicRumbleDebug = {
    getState: () => ({
      gameState,
      kekDomainActive,
      tournamentIndex,
      fighters: fighters.map((fighter) => ({
        characterId: fighter.characterId,
        x: Math.round(fighter.x),
        y: Math.round(fighter.y),
        facing: fighter.facing,
        state: fighter.state,
        action: fighter.action,
        visualState: fighter.visualState,
        visualStateTime: Number((fighter.visualStateTime || 0).toFixed(2)),
        renderHeight: fighterVisualHeight(fighter),
      })),
      activeBlasts: shardBlasts.map((blast) => ({ characterId: blast.characterId, facing: blast.facing })),
      afterimages: afterImages.length,
    }),
    enterKekDomain: () => {
      prepareDomainAudio();
      selectedMode = "tournament";
      tournamentOpponents = ["fallen", "mecha", "berserk"];
      tournamentIndex = tournamentOpponents.length - 1;
      setCharacter(fighters[1], tournamentOpponents[tournamentIndex]);
      resetRound();
      activateKekDomainFinal();
      syncHud();
      return window.__relicRumbleDebug.getState();
    },
    exitKekDomain: () => {
      deactivateKekDomain();
      openSetup();
      return window.__relicRumbleDebug.getState();
    },
  };

  resetRound();
  showModeStep();
  const previewParams = new URLSearchParams(window.location.search);
  if (previewParams.has("kek-domain-preview")) {
    window.__relicRumbleDebug.enterKekDomain();
  }
  if (previewParams.has("kek-domain-completion")) {
    kekDomainActive = true;
    document.body.classList.add("kek-domain-active");
    overlay.hidden = true;
    showDomainCeremony("completion");
  }
  buildSpriteDrawCache();
  render();
  syncHud();
  requestAnimationFrame(loop);
})();
