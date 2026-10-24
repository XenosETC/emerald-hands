(() => {
  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = document.querySelector("#gameOverlay");
  const startButton = document.querySelector("#startButton");
  const overlayTitle = document.querySelector("#overlayTitle");
  const overlayText = document.querySelector("#overlayText");
  const soundToggle = document.querySelector("#soundToggle");
  const waveButton = document.querySelector("#waveButton");
  const heroAbility = document.querySelector("#heroAbility");
  const heroNovaButton = document.querySelector("#heroNovaButton");
  const heroNovaHint = document.querySelector("#heroNovaHint");
  const padButtons = [...document.querySelectorAll("[data-pad]")];
  const towerButtons = [...document.querySelectorAll(".tower-button")];
  const scoreLabel = document.querySelector("#scoreLabel");
  const shardLabel = document.querySelector("#shardLabel");
  const waveLabel = document.querySelector("#waveLabel");
  const vaultLabel = document.querySelector("#vaultLabel");
  const bestLabel = document.querySelector("#bestLabel");
  const statusLabel = document.querySelector("#statusLabel");
  const statusMeta = document.querySelector("#statusMeta");
  const campaignProgress = document.querySelector("#campaignProgress");
  const campaignLabel = document.querySelector("#campaignLabel");
  const commandTabs = [...document.querySelectorAll("[data-command-tab]")];
  const commandViews = { build: document.querySelector("#buildView"), manage: document.querySelector("#manageView"), intel: document.querySelector("#intelView") };
  const commandHint = document.querySelector("#commandHint");
  const nextWaveHint = document.querySelector("#nextWaveHint");
  const padHint = document.querySelector("#padHint");
  const padControls = document.querySelector(".pad-controls");
  const manageEmpty = document.querySelector("#manageEmpty");
  const selectedPortrait = document.querySelector("#selectedPortrait");
  const towerPanelTitle = document.querySelector("#towerPanelTitle");
  function setCommandView(view) {
    if (!commandViews[view]) return;
    for (const [key,node] of Object.entries(commandViews)) node.hidden = key !== view;
    commandTabs.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.commandTab === view)));
  }
  const towerPanel = document.querySelector("#towerPanel");
  const towerDetails = document.querySelector("#towerDetails");
  const pathButtons = [...document.querySelectorAll("[data-upgrade-path]")];
  const moveButton = document.querySelector("#moveTowerButton");
  const sellButton = document.querySelector("#sellTowerButton");
  const cancelMoveButton = document.querySelector("#cancelMoveButton");
  const wavePreview = document.querySelector("#wavePreview");
  const towerGuide = document.querySelector("#towerGuide");

  const W = canvas.width;
  const H = canvas.height;
  const STORAGE_KEY = "pepe-tower-defense-best-v1";
  const MASTERY_KEY = "pepe-tower-defense-mastery-v1";
  const pepe = new Image();
  pepe.src = "assets/pepecoin-run/pepecoin-classic.png";
  const courtyard = loadImage("assets/pepe-tower-defense/emerald-vault-courtyard-v1.png");
  courtyard.addEventListener("load", () => { if (!state.playing) draw(); });
  const relicBaseSprite = loadImage("assets/pepe-tower-defense/relic-base-v1.webp");
  relicBaseSprite.addEventListener("load", () => { if (!state.playing) draw(); });
  const flame = new Image();
  flame.src = "assets/pepe-relic-rumble/origin-flame.png";
  const towerSprites = {
    pepe: loadImage("assets/pepe-tower-defense/pepe-blaster-sprite.png"),
    shard: loadImage("assets/pepe-tower-defense/shard-slow-sprite.png"),
    relic: loadImage("assets/pepe-tower-defense/relic-cannon-sprite.png"),
    mage: loadImage("assets/pepe-tower-defense/pepe-mage-sprite.png"),
    archer: loadImage("assets/pepe-tower-defense/pepe-archer-sprite.png"),
    alchemist: loadImage("assets/pepe-tower-defense/alchemist-concept-v1.webp"),
    hero: loadImage("assets/pepe-tower-defense/hero-base-v1.webp"),
  };
  const evolvedTowerSprites = {
    pepe: loadImage("assets/pepe-tower-defense/pepe-blaster-evolved-sprite.png"),
    shard: loadImage("assets/pepe-tower-defense/shard-slow-evolved-sprite.png"),
    relic: loadImage("assets/pepe-tower-defense/relic-cannon-evolved-sprite.png"),
    mage: loadImage("assets/pepe-tower-defense/pepe-mage-evolved-sprite.png"),
    archer: loadImage("assets/pepe-tower-defense/pepe-archer-evolved-sprite.png"),
    alchemist: loadImage("assets/pepe-tower-defense/alchemist-evolved-v1.webp"),
    hero: loadImage("assets/pepe-tower-defense/hero-evolved-v1.webp"),
  };
  const tierThreeSprites = Object.fromEntries(Object.keys(towerSprites).map(type => [type, loadImage(`assets/pepe-tower-defense/${type}-tier3-v1.webp`)]));
  const longWatchSprites = Object.fromEntries(Object.keys(towerSprites).map(type => [type, loadImage(`assets/pepe-tower-defense/${type}-long-watch-v1.webp`)]));
  function towerVisualStage(tower) {
    if ((tower.tiers?.utility || 0) >= 3) return "longWatch";
    if (tower.evolved) return "evolved";
    if (tower.level >= 3) return "tierThree";
    return "base";
  }
  function towerVisualSprite(tower) {
    const stages = { base: towerSprites, tierThree: tierThreeSprites, evolved: evolvedTowerSprites, longWatch: longWatchSprites };
    return stages[towerVisualStage(tower)][tower.type];
  }
  function loadedTowerSprite(tower) {
    const selected = towerVisualSprite(tower);
    if (selected.complete && selected.naturalWidth) return selected;
    const fallback = tower.evolved ? evolvedTowerSprites[tower.type] : towerSprites[tower.type];
    return fallback.complete && fallback.naturalWidth ? fallback : towerSprites[tower.type];
  }
  const goblinBrute = loadImage("assets/pepe-tower-defense/goblin-brute-v1.webp");
  const enemySprites = {
    goblin: loadImage("assets/pepe-tower-defense/goblin-raider-v1.webp"),
    brute: goblinBrute,
    warboss: goblinBrute,
    grunt: loadImage("assets/pepe-tower-defense/enemy-crawler-sprite.png"),
    elite: loadImage("assets/pepe-tower-defense/enemy-crawler-sprite.png"),
    runner: loadImage("assets/pepe-tower-defense/enemy-runner-sprite.png"),
    boss: loadImage("assets/pepe-tower-defense/enemy-boss-sprite.png"),
  };

  const RELIC_MAX_HEALTH = 100;
  const relicBase = { x: 1185, y: 404 };
  let relicHitFlash = 0;

  const path = [
    { x: 34, y: 345 },
    { x: 170, y: 345 },
    { x: 170, y: 170 },
    { x: 440, y: 170 },
    { x: 440, y: 468 },
    { x: 755, y: 468 },
    { x: 755, y: 238 },
    { x: 1035, y: 238 },
    { x: 1035, y: 404 },
    relicBase,
  ];

  const pads = [
    { x: 230, y: 260 }, { x: 310, y: 430 }, { x: 515, y: 285 },
    { x: 585, y: 552 }, { x: 720, y: 366 }, { x: 850, y: 155 },
    { x: 910, y: 334 }, { x: 1085, y: 314 }, { x: 1120, y: 500 },
  ];

  const towerTypes = {
    pepe: { name: "Pepe Blaster", cost: 75, range: 150, damage: 22, rate: 0.45, color: "#39ff9a", splash: 0, slow: 0 },
    shard: { name: "Shard Slow", cost: 95, range: 135, damage: 12, rate: 0.65, color: "#74c7ff", splash: 0, slow: 0.48 },
    relic: { name: "Relic Cannon", cost: 140, range: 165, damage: 38, rate: 1.05, color: "#d8b45f", splash: 54, slow: 0 },
    mage: { name: "Pepe Mage", cost: 125, range: 170, damage: 18, rate: 0.78, color: "#a855ff", splash: 32, slow: 0.12 },
    archer: { name: "Pepe Archer", cost: 105, range: 220, damage: 30, rate: 0.72, color: "#9cff6b", splash: 0, slow: 0 },
    alchemist: { name: "Pepe Alchemist", cost: 135, range: 150, damage: 15, rate: .95, color: "#b6f34d", splash: 0, slow: 0 },
    hero: { name: "Pepe Sunwarden", cost: 400, range: 220, damage: 18, rate: .15, color: "#57ff8b", splash: 0, slow: 0 },
  };
  const CAMPAIGN_WAVES = 20;
  const enemyTypes = {
    grunt: { name: "Crawler", hp: 70, growth: 13, speed: 58, acceleration: 2.4, reward: 13, radius: 14, size: 54, breachDamage: 1, armor: 0 },
    runner: { name: "Shard runner", hp: 70, growth: 13, speed: 92, acceleration: 2.4, reward: 18, radius: 15, size: 62, breachDamage: 1, armor: 0 },
    elite: { name: "Elite crawler", hp: 130, growth: 24, speed: 58, acceleration: 2.4, reward: 28, radius: 19, size: 66, breachDamage: 2, armor: 0 },
    boss: { name: "Vault breaker", hp: 520, growth: 72, speed: 36, acceleration: 1.1, reward: 120, radius: 31, size: 112, breachDamage: 4, armor: 0, boss: true },
    goblin: { name: "Goblin raider", hp: 50, growth: 11, speed: 104, acceleration: 2, reward: 18, radius: 17, size: 76, breachDamage: 1, armor: 0 },
    brute: { name: "Goblin brute", hp: 170, growth: 27, speed: 42, acceleration: 1.5, reward: 32, radius: 23, size: 94, breachDamage: 2, armor: .2 },
    warboss: { name: "Goblin warboss", hp: 850, growth: 115, speed: 35, acceleration: 1.2, reward: 220, radius: 35, size: 138, breachDamage: 5, armor: .25, boss: true },
  };
  // Authored compositions are deterministic; late pressure grows without raising speeds without bound.
  function buildWavePlan(wave) {
    const count = wave <= 12 ? 9 + wave * 3 : 45 + (wave - 12) * 2;
    const rush = [6, 9, 14, 18].includes(wave);
    const siege = [8, 13, 17].includes(wave);
    const kinds = Array.from({ length: count }, (_, index) => {
      if (wave % 5 === 0 && index === (wave === CAMPAIGN_WAVES ? count - 1 : Math.floor(count * .55))) return wave === CAMPAIGN_WAVES ? "warboss" : "boss";
      if (wave >= 7 && index % (siege ? 3 : wave >= 16 ? 4 : 7) === 2) return "brute";
      if (wave >= 3 && index % (rush ? 2 : wave >= 10 ? 3 : 5) === 1) return "goblin";
      if (wave >= 4 && index % 6 === 3) return "elite";
      if (wave >= 3 && index % 7 === 4) return "runner";
      return "grunt";
    });
    const late = Math.max(0, wave - 5);
    const endgame = Math.max(0, wave - 12);
    return { wave, kinds, count, interval: Math.max(.3, .75 - wave * .025), hpScale: 1 + late * .055 + late * late * .006 + endgame * endgame * .10,
      name: wave === CAMPAIGN_WAVES ? "Warboss assault" : wave % 5 === 0 ? "Vault breaker" : rush ? "Raider rush" : siege ? "Brute siege" : wave <= 2 ? "First defenses" : "Mixed assault" };
  }
  const wavePlans = Array.from({ length: CAMPAIGN_WAVES }, (_, i) => buildWavePlan(i + 1));
  function currentWavePlan() { return wavePlans[Math.min(CAMPAIGN_WAVES - 1, Math.max(0, state.wave - 1))]; }
  function waveBrief(plan) {
    const counts = {};
    for (const kind of plan.kinds) counts[kind] = (counts[kind] || 0) + 1;
    return `Wave ${plan.wave}/${CAMPAIGN_WAVES}: ${plan.name} - ${Object.entries(counts).map(([kind,count]) => `${count} ${enemyTypes[kind].name}${count === 1 ? "" : "s"}`).join(", ")}. Enemy health x${plan.hpScale.toFixed(2)}; arrivals every ${plan.interval.toFixed(2)}s. Inspect, upgrade or move your towers before sending it.`;
  }
  const mastery = loadMastery();

  function loadMastery() {
    try {
      const saved = JSON.parse(localStorage.getItem(MASTERY_KEY));
      return Object.fromEntries(Object.keys(towerTypes).map((type) => [type, {
        placements: Number(saved?.[type]?.placements || 0),
        upgrades: Number(saved?.[type]?.upgrades || 0),
      }]));
    } catch {
      return Object.fromEntries(Object.keys(towerTypes).map((type) => [type, { placements: 0, upgrades: 0 }]));
    }
  }

  function readBest() {
    try { const value = Number(localStorage.getItem(STORAGE_KEY)); return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0; }
    catch { return 0; }
  }

  function masteryRank(type) {
    const actions = mastery[type].placements + mastery[type].upgrades;
    if (actions >= 35) return "Legend";
    if (actions >= 15) return "Veteran";
    if (actions >= 5) return "Operator";
    return "Recruit";
  }

  function recordMastery(type, field) {
    mastery[type][field] += 1;
    try { localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery)); } catch { /* tab mastery remains usable */ }
    updateMasteryLabels();
  }

  function updateMasteryLabels() {
    const roles = { pepe: "beam DPS", shard: "control field", relic: "splash burst", mage: "shard volley", archer: "emerald arrows", alchemist: "armor solvent", hero: "hero · rapid green lasers · one active" };
    towerButtons.forEach((button) => {
      const type = button.dataset.tower;
      const actions = mastery[type].placements + mastery[type].upgrades;
      button.querySelector("small").textContent = `${towerTypes[type].cost} shards - ${roles[type]} · ${masteryRank(type)} ${actions}`;
    });
  }

  let raf = 0;
  let last = null;
  let selectedTower = "pepe";
  let inspectedTower = null;
  let movingTower = null;
  let soundOn = true;
  let screenShake = 0;
  const enemies = [];
  const towers = [];
  const shots = [];
  const bursts = [];
  const floaters = [];
  const motes = [];
  const pointer = { x: W / 2, y: H / 2, active: false };

  const state = {
    playing: false,
    waveActive: false,
    wave: 1,
    score: 0,
    shards: 180,
    vault: RELIC_MAX_HEALTH,
    heroNovaCooldown: 0,
    spawnLeft: 0,
    waveSpawnTotal: 0,
    spawnTimer: 0,
    best: readBest(),
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    return image;
  }

  function distance(a, b, c, d) {
    return Math.hypot(a - c, b - d);
  }

  function format(value) {
    if (value < 1000) return Math.floor(value).toLocaleString();
    return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}K`;
  }

  function rankForRun(wave, score) {
    if (wave >= 12 || score >= 22000) return "Vault Architect";
    if (wave >= 9 || score >= 13000) return "Relic Warden";
    if (wave >= 6 || score >= 6500) return "Shard Sentinel";
    if (wave >= 3 || score >= 2200) return "Pad Builder";
    return "Fresh Defender";
  }

  function resetGame() {
    window.EmeraldArcade?.beginSession("towerDefense", "pepe-tower-defense.html");
    cancelAnimationFrame(raf);
    enemies.length = 0;
    towers.length = 0;
    inspectedTower = null;
    movingTower = null;
    shots.length = 0;
    bursts.length = 0;
    floaters.length = 0;
    motes.length = 0;
    setCommandView("build");
    state.playing = true;
    state.waveActive = false;
    state.wave = 1;
    state.score = 0;
    state.shards = 180;
    state.vault = RELIC_MAX_HEALTH;
    state.heroNovaCooldown = 0;
    relicHitFlash = 0;
    state.spawnLeft = 0;
    state.waveSpawnTotal = 0;
    state.spawnTimer = 0;
    overlay.classList.add("is-hidden");
    waveButton.textContent = "Start Wave";
    statusLabel.textContent = "Place defenders on empty pads";
    statusMeta.textContent = `Build with 180 shards, then press Start Wave. Survive all ${CAMPAIGN_WAVES} waves.`;
    updateHud();
    last = null;
    raf = requestAnimationFrame(loop);
  }

  function resetAndLaunch() {
    if (state.playing || window.EmeraldArcade?.isPaused?.()) return;
    resetGame();
    canvas.focus();
  }

  function endGame(title) {
    if (!state.playing) return;
    state.playing = false;
    state.waveActive = false;
    const score = Math.floor(state.score);
    const completedWave = Math.max(0, state.wave - 1);
    const rank = rankForRun(completedWave, score);
    if (score > state.best) {
      state.best = score;
      try { localStorage.setItem(STORAGE_KEY, String(score)); } catch { /* session best is retained */ }
    }
    window.EmeraldArcade?.recordAndNotify("towerDefense", {
      played: true,
      score,
      rank,
      wave: completedWave,
      shards: state.shards,
    });
    overlayTitle.textContent = title;
    overlayText.textContent = `${format(score)} score · ${completedWave} / ${CAMPAIGN_WAVES} waves cleared · ${state.vault} relic health · ${rank}.`;
    startButton.textContent = "Rebuild Defense";
    overlay.classList.remove("is-hidden");
    startButton.focus();
    updateHud();
  }

  function startWave() {
    if (window.EmeraldArcade?.isPaused?.()) return;
    if (!state.playing) resetGame();
    if (state.waveActive) return;
    movingTower = null;
    state.waveActive = true;
    state.waveSpawnTotal = currentWavePlan().count;
    state.spawnLeft = state.waveSpawnTotal;
    spawnEnemy();
    state.spawnLeft -= 1;
    state.spawnTimer = currentWavePlan().interval;
    statusLabel.textContent = `Wave ${state.wave}: ${currentWavePlan().name}`;
    statusMeta.textContent = `${state.spawnLeft + enemies.length} corrupt units in this wave`;
    waveButton.textContent = "Wave Running";
    updateHud();
  }

  function spawnEnemy() {
    const plan = currentWavePlan();
    const spawned = state.waveSpawnTotal - state.spawnLeft;
    const kind = plan.kinds[spawned];
    if (!kind) return;
    const spec = enemyTypes[kind];
    const hp = Math.round((spec.hp + state.wave * spec.growth) * plan.hpScale);
    enemies.push({ ...spec, x: path[0].x, y: path[0].y, pathIndex: 1, hp, maxHp: hp,
      speed: spec.speed + Math.min(15, state.wave) * spec.acceleration,
      slowTimer: 0, slowStrength: 0, kind, spin: Math.random() * Math.PI * 2, hitFlash: 0 });
    const boss = spec.boss;

    if (boss) {
      statusLabel.textContent = kind === "warboss" ? "Goblin warboss entering" : "Boss shard entering";
      statusMeta.textContent = "focus fire the corrupted vault breaker";
      screenShake = Math.max(screenShake, 10);
    }
  }

  function updateHud() {
    scoreLabel.textContent = format(state.score);
    shardLabel.textContent = state.shards;
    waveLabel.textContent = Math.min(CAMPAIGN_WAVES, state.wave);
    const cleared = Math.min(CAMPAIGN_WAVES, Math.max(0, state.wave - 1));
    campaignProgress.max = CAMPAIGN_WAVES;
    const brief = state.wave > CAMPAIGN_WAVES ? "Campaign complete - all 20 waves defended." : waveBrief(currentWavePlan());
    if (wavePreview.textContent !== brief) wavePreview.textContent = brief;
    campaignProgress.value = cleared;
    campaignLabel.textContent = `${cleared} / ${CAMPAIGN_WAVES} waves cleared · ${state.vault} relic health`;
    campaignProgress.setAttribute("aria-valuetext", campaignLabel.textContent);
    vaultLabel.textContent = state.vault;
    bestLabel.textContent = format(state.best);
    const deployedHero = towers.find(tower => tower.type === "hero");
    heroAbility.hidden = !deployedHero;
    if (deployedHero) {
      heroNovaButton.disabled = !state.playing || !state.waveActive || state.heroNovaCooldown > 0 || Boolean(movingTower) || Boolean(window.EmeraldArcade?.isPaused?.());
      heroNovaButton.textContent = state.heroNovaCooldown > 0 ? `Emerald Nova · ${Math.ceil(state.heroNovaCooldown)}s` : "Emerald Nova · ready (H)";
      heroNovaHint.textContent = `${(deployedHero.damage * 5).toFixed(0)} damage in ${Math.round(deployedHero.range)} range · ${novaRecharge(deployedHero)}s recharge${state.waveActive ? "" : " · available during waves"}`;
    }
    towerButtons.forEach(button => { if (button.dataset.tower === "hero") { button.disabled = Boolean(deployedHero); button.title = deployedHero ? "One hero at a time: select its pad to manage it" : "400 shards · one hero at a time"; } });
    const spec = towerTypes[selectedTower];
    const roles = { pepe: "Direct beam damage", shard: "48% slow for 1.6 seconds", relic: "54-unit splash radius", mage: "32-unit splash and 12% slow", archer: "Long-range direct damage", alchemist: "Weakens armor by 10 points for 2s (bosses: 5); refreshes without stacking", hero: "Rapid green lasers. One hero at a time. Press H or tap Emerald Nova during a wave for area damage" };
    const guide = `${spec.name} · Level 1: ${spec.damage} damage, ${spec.range} range, ${(spec.rate / 1.08).toFixed(2)} seconds per attack. ${roles[selectedTower]}. Tier 3 milestone: ${upgradeName({type:selectedTower,level:3})}. Tier 5 evolution: ${upgradeName({type:selectedTower,level:5})}.`;
    if (towerGuide.textContent !== guide) towerGuide.textContent = guide;
    padButtons.forEach(button => {
      const pad = pads[Number(button.dataset.pad)];
      const tower = towerAtPad(pad);
      const cost = towerTypes[selectedTower].cost;
      const label = `Pad ${Number(button.dataset.pad) + 1} - ${tower ? `${tower.name} ${tierCode(tower)}` : movingTower ? "Move here" : `Build - ${cost}`}`;
      const number = String(Number(button.dataset.pad) + 1);
      if (button.textContent !== number) button.textContent = number;
      button.title = label;
      button.disabled = !state.playing || Boolean(window.EmeraldArcade?.isPaused?.()) || (movingTower ? Boolean(tower) : !tower && (state.shards < cost || selectedTower === "hero" && Boolean(deployedHero)));
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", String(Boolean(tower && tower === inspectedTower)));
    });
    const plan = currentWavePlan();
    nextWaveHint.textContent = state.wave > CAMPAIGN_WAVES ? "20/20 waves defended" : `Wave ${plan.wave}/${CAMPAIGN_WAVES} - ${plan.name} - ${plan.count} foes`;
    commandHint.textContent = movingTower ? "Moving: choose an empty numbered pad. Cancel in Tower controls." : state.waveActive ? `${state.spawnLeft + enemies.length} enemies remaining. Moving unlocks after the wave.` : "Build, upgrade or reposition before sending the wave.";
    padHint.textContent = movingTower ? "Move" : "Build pads";
    padControls.setAttribute("data-moving", String(Boolean(movingTower)));
    updateTowerPanel();
    waveButton.disabled = !state.playing || state.waveActive || Boolean(window.EmeraldArcade?.isPaused?.());
  }

  function selectTower(type) {
    if (!towerTypes[type]) return;
    inspectedTower = null;
    movingTower = null;
    setCommandView("build");
    selectedTower = type;
    towerButtons.forEach((button) => { button.classList.toggle("is-selected", button.dataset.tower === type); button.setAttribute("aria-pressed", String(button.dataset.tower === type)); });
    const tower = towerTypes[type];
    statusLabel.textContent = tower.name;
    statusMeta.textContent = `${tower.cost} shards - click an empty pad to place`;
    updateHud();
  }

  function padAt(x, y) {
    return pads.find((pad) => distance(x, y, pad.x, pad.y) < 34);
  }

  function towerAtPad(pad) {
    return towers.find((tower) => tower.pad === pad);
  }

  const PATH_KEYS = ["power", "special", "utility"];
  const PATH_COSTS = [75, 120, 175, 230, 285];
  function pathLockReason(tower, choice) {
    if (!PATH_KEYS.includes(choice)) return "Unknown path";
    const tier = tower.tiers[choice];
    if (tier >= 5) return "Tier 5 complete";
    if (!tier && PATH_KEYS.filter(key => tower.tiers[key] > 0).length >= 2) return "Third path locked";
    if (tier >= 2 && PATH_KEYS.some(key => key !== choice && tower.tiers[key] > 2)) return "Secondary path capped at tier 2";
    return "";
  }
  function upgradeCost(tower, choice = tower.path || "power") {
    return pathLockReason(tower, choice) ? Infinity : PATH_COSTS[tower.tiers[choice]];
  }
  function tierCode(tower) { return PATH_KEYS.map(key => tower.tiers[key]).join(" / "); }


  function portalHit(point) {
    return point.x < 120 && distance(point.x, point.y, path[0].x, path[0].y) < 70;
  }

  function buildOrUpgrade(pad) {
    if (!state.playing || window.EmeraldArcade?.isPaused?.()) return;
    const existing = towerAtPad(pad);
    if (movingTower) {
      if (existing) {
        statusLabel.textContent = "Choose an empty destination";
        return;
      }
      movingTower.pad = pad;
      movingTower.x = pad.x;
      movingTower.y = pad.y;
      inspectedTower = movingTower;
      movingTower = null;
      statusLabel.textContent = "Tower moved - no shards spent";
      updateHud();
      return;
    }
    if (existing) {
      inspectedTower = existing;
      setCommandView("manage");
      statusLabel.textContent = `${existing.name} selected`;
      statusMeta.textContent = "Use Tower controls to choose upgrades, move or sell";
      updateHud();
      return;
    }

    const type = towerTypes[selectedTower];
    if (selectedTower === "hero" && towers.some(tower => tower.type === "hero")) {
      statusLabel.textContent = "Sunwarden already deployed";
      statusMeta.textContent = "One hero at a time. Select his pad to upgrade or move him.";
      return;
    }
    if (state.shards < type.cost) {
      statusLabel.textContent = "Need more shards";
      statusMeta.textContent = `${type.cost} shards required for ${type.name}`;
      return;
    }
    state.shards -= type.cost;
    towers.push({
      ...type,
      invested: type.cost,
      path: null,
      tiers: { power: 0, special: 0, utility: 0 },
      pad,
      x: pad.x,
      y: pad.y,
      type: selectedTower,
      cooldown: 0,
      attackPulse: 0,
      upgradePulse: 0,
      evolvePulse: 0,
      evolved: false,
      aimAngle: -Math.PI / 5,
      level: 1,
    });
    inspectedTower = towers[towers.length - 1];
    if (inspectedTower.type === "alchemist") Object.assign(inspectedTower, { armorBreak: .10, bossArmorBreak: .05, acidDuration: 2 });
    setCommandView("manage");
    recordMastery(selectedTower, "placements");
    statusLabel.textContent = `${type.name} placed`;
    statusMeta.textContent = "select it to choose upgrades, move or sell";
    bursts.push({ x: pad.x, y: pad.y, r: 0, max: 58, color: type.color, life: 0.28, fill: true });
    floaters.push({ x: pad.x, y: pad.y - 34, text: "BUILT", color: type.color, life: 0.75 });
    updateHud();
  }

  // Provisional balance: relocation is free between waves; selling returns 70%.
  const specialPaths = {
    pepe: { name: "Rapid Emitters", detail: "14% shorter attack interval per upgrade" },
    shard: { name: "Deep Freeze", detail: "+6 slow percentage points (cap 82%) and +10 range per upgrade" },
    relic: { name: "Siege Radius", detail: "+14 splash radius and +8 range per upgrade" },
    mage: { name: "Arcane Field", detail: "+10 splash radius and +10 range per upgrade" },
    archer: { name: "Rapid Quiver", detail: "14% shorter attack interval per upgrade" },
    alchemist: { name: "Corrosive Catalyst", detail: "+2 armor points (+1 boss) and +0.4s duration per tier" },
    hero: { name: "Emerald Barrage", detail: "14% faster laser interval per tier" },
  };

  function canManageTower() {
    return state.playing && !window.EmeraldArcade?.isPaused?.() && towers.includes(inspectedTower);
  }

  const powerTierNames = ["Charged Strike", "Double Charge", "Overcharged Core", "Crown Amplifier", "Cataclysm Power"];
  const utilityTierNames = ["Rangefinder", "Vault Optics", "Horizon Sight", "Farwatch Array", "Emerald Observatory"];
  const specialTierNames = {
    pepe: ["Quick Trigger", "Twin Emitters", "Emerald Overclock", "Crown Cycler", "Legend Beam"],
    shard: ["Cold Current", "Deep Freeze", "Chain Chill", "Crystal Prison", "Absolute Zero"],
    relic: ["Wide Shell", "Heavy Charge", "Vault Cracker", "Ancient Reactor", "Cataclysm Core"],
    mage: ["Shard Volley", "Triple Cast", "Arcane Splash", "Crown Sigil", "Shard Storm"],
    archer: ["Swift Nock", "Split Shaft", "Rapid Quiver", "True Aim", "Legend Volley"],
    alchemist: ["Etching Agent", "Acid Bath", "Armor Solvent", "Royal Reagent", "Philosopher's Venom"],
    hero: ["Focused Palm", "Twin Pulse", "Emerald Barrage", "Jade Tempest", "Endless Dawn"],
  };
  const alchemistTierNames = { power: ["Hot Mixture", "Concentrated Acid", "Shatter Flask", "Crown Retort", "Dragonfire Tonic"], utility: ["Measuring Glass", "Distant Delivery", "Surveyor's Retort", "Farwatch Lab", "Emerald Observatory"] };
  const heroTierNames = { power: ["Sunlit Strike", "Bright Core", "Solar Burst", "Sunforged Fists", "Emerald Ascendant"], utility: ["Far Sight", "Relic Sentinel", "Horizon Warden", "Sky Guardian", "Eternal Vigil"] };
  function novaRecharge(tower) { return 20 - tower.tiers.utility * 2; }
  function pathTitle(tower, choice) { if(tower.type === "hero") return { power: "Solar Might", special: "Emerald Barrage", utility: "Sky Guardian" }[choice]; if(tower.type === "alchemist") return { power: "Volatile Brews", special: "Corrosive Catalyst", utility: "Surveyor's Lab" }[choice]; return choice === "power" ? "Firepower" : choice === "utility" ? "Long Watch" : specialPaths[tower.type].name; }
  function tierName(tower, choice, tier) { if(tower.type === "hero" && choice !== "special") return heroTierNames[choice][tier - 1]; if(tower.type === "alchemist" && choice !== "special") return alchemistTierNames[choice][tier - 1]; return (choice === "power" ? powerTierNames : choice === "utility" ? utilityTierNames : specialTierNames[tower.type])[tier - 1]; }

  // Rebuild from the base spec so purchasing the same crosspath in a different order gives identical stats.
  function rebuildTowerStats(tower) {
    const spec = towerTypes[tower.type];
    for (const stat of ["damage", "range", "rate", "slow", "splash"]) tower[stat] = spec[stat];
    for (let i = 0; i < tower.tiers.power; i++) { tower.damage *= 1.35; tower.range += 8; }
    for (let i = 0; i < tower.tiers.special; i++) {
      tower.damage *= 1.18; tower.range += 8;
      if (tower.type === "pepe" || tower.type === "archer" || tower.type === "hero") tower.rate *= .86;
      else if (tower.type === "shard") { tower.slow = Math.min(.82, tower.slow + .06); tower.range += 10; }
      else if (tower.type === "relic") { tower.splash += 14; tower.range += 8; }
      else if (tower.type === "mage") { tower.splash += 10; tower.range += 10; }
    }
    for (let i = 0; i < tower.tiers.utility; i++) { tower.damage *= 1.12; tower.range += 25; tower.rate *= .97; }
    const primaryTier = Math.max(...Object.values(tower.tiers));
    tower.path = PATH_KEYS.find(key => tower.tiers[key] === primaryTier) || null;
    tower.level = Math.max(1, primaryTier);
    // Preserve existing level-three combat abilities and level-five evolution.
    if (primaryTier >= 3) { const level = tower.level; tower.level = 3; applyUpgrade(tower); tower.level = level; }
    if (primaryTier >= 5) { const level = tower.level; tower.level = 5; applyUpgrade(tower); tower.level = level; }
    tower.evolved = primaryTier >= 5;
    if (tower.type === "hero") tower.splash = tower.tiers.power >= 3 ? 28 + (tower.tiers.power - 3) * 14 : 0;
    if (tower.type === "alchemist") {
      tower.armorBreak = .10 + tower.tiers.special * .02;
      tower.bossArmorBreak = .05 + tower.tiers.special * .01;
      tower.acidDuration = 2 + tower.tiers.special * .4;
      tower.splash = tower.tiers.power >= 3 ? 24 + (tower.tiers.power - 3) * 12 : 0;
    }
  }

  function updateTowerPanel() {
    towerPanel.hidden = !inspectedTower;
    manageEmpty.hidden = Boolean(inspectedTower);
    if (!inspectedTower) return;
    const tower = inspectedTower;
    towerPanelTitle.textContent = `${tower.name} - ${tierCode(tower)}`;
    const portrait = towerVisualSprite(tower).src;
    if (selectedPortrait.src !== portrait) selectedPortrait.src = portrait;
    const visualLabels = { base: "Base defender", tierThree: "Tier 3 reinforced form", evolved: "Tier 5 evolution", longWatch: "Long Watch form" };
    document.querySelector("#towerFormLabel").textContent = tower.type === "alchemist" && towerVisualStage(tower) === "longWatch" ? "Surveyor's Lab form" : visualLabels[towerVisualStage(tower)];
    const acidDetails = tower.type === "alchemist" ? ` Acid: ${Math.round(tower.armorBreak * 100)} armor points (${Math.round(tower.bossArmorBreak * 100)} boss), ${tower.acidDuration.toFixed(1)}s; refreshes, no stacks.` : "";
    const heroDetails = tower.type === "hero" ? ` Nova: ${(tower.damage * 5).toFixed(0)} damage, ${Math.round(tower.range)} range, ${novaRecharge(tower)}s recharge. One active hero.` : "";
    towerDetails.textContent = `Pad ${pads.indexOf(tower.pad) + 1}: ${tower.damage.toFixed(1)} damage, ${Math.round(tower.range)} range, ${(tower.rate / (1 + tower.level * .08)).toFixed(2)}s attack, ${Math.round(tower.slow * 100)}% slow, ${Math.round(tower.splash)} splash. ${movingTower ? "Choose an empty pad to move, or cancel." : "Crosspath limit: 5 / 2 / 0."}${acidDetails}${heroDetails}`;
    pathButtons.forEach(button => {
      const choice = button.dataset.upgradePath;
      const tier = tower.tiers[choice];
      const reason = pathLockReason(tower, choice);
      const cost = upgradeCost(tower, choice);
      let nextStats = "";
      if (!reason) {
        const preview = { ...tower, tiers: { ...tower.tiers, [choice]: tier + 1 } };
        rebuildTowerStats(preview);
        nextStats = ` Next: ${preview.damage.toFixed(1)} dmg / ${Math.round(preview.range)} range / ${(preview.rate / (1 + preview.level * .08)).toFixed(2)}s / ${Math.round(preview.slow * 100)}% slow / ${Math.round(preview.splash)} splash.${tower.type === "alchemist" ? ` Acid: ${Math.round(preview.armorBreak * 100)} points (${Math.round(preview.bossArmorBreak * 100)} boss), ${preview.acidDuration.toFixed(1)}s.` : ""}`;
      }
      if (!reason && tower.type === "hero") {
        const preview = { ...tower, tiers: { ...tower.tiers, [choice]: tier + 1 } }; rebuildTowerStats(preview);
        nextStats += ` Nova: ${(preview.damage * 5).toFixed(0)} damage / ${Math.round(preview.range)} range / ${novaRecharge(preview)}s recharge.`;
      }
      const label = `${pathTitle(tower, choice)} ${tier}/5 - ${reason || `T${tier + 1}: ${tierName(tower, choice, tier + 1)} - ${cost} shards`}.${nextStats}`;
      const text = button.querySelector(".path-text");
      if (text.textContent !== label) text.textContent = label;
      button.setAttribute("aria-label", label);
      button.querySelectorAll("[data-tier]").forEach(pip => pip.classList.toggle("is-earned", Number(pip.dataset.tier) <= tier));
      button.disabled = !canManageTower() || Boolean(movingTower) || Boolean(reason) || state.shards < cost;
      button.setAttribute("aria-pressed", String(tier > 0));
    });
    moveButton.disabled = !canManageTower() || state.waveActive || Boolean(movingTower);
    moveButton.textContent = state.waveActive ? "Move - available between waves" : "Move tower - free";
    sellButton.disabled = !canManageTower() || Boolean(movingTower);
    sellButton.textContent = `Sell tower - ${Math.floor(tower.invested * .7)} shards (70%)`;
    cancelMoveButton.hidden = !movingTower;
    cancelMoveButton.disabled = !canManageTower();
  }

  function upgradeSelected(choice) {
    if (!canManageTower() || movingTower || !PATH_KEYS.includes(choice)) return false;
    const tower = inspectedTower;
    const cost = upgradeCost(tower, choice);
    if (!Number.isFinite(cost) || state.shards < cost) return false;
    const wasEvolved = tower.evolved;
    state.shards -= cost;
    tower.invested += cost;
    tower.tiers[choice] += 1;
    rebuildTowerStats(tower);
    tower.upgradePulse = 1;
    if (tower.evolved && !wasEvolved) { tower.evolvePulse = 1.2; screenShake = Math.max(screenShake, 14); }
    recordMastery(tower.type, "upgrades");
    statusLabel.textContent = `${tower.name} - ${tierCode(tower)}`;
    statusMeta.textContent = tierName(tower, choice, tower.tiers[choice]);
    bursts.push({ x: tower.x, y: tower.y, r: 0, max: tower.range * .42, color: tower.color, life: .34, fill: true });
    updateHud();
    return true;
  }

  function beginMove() {
    if (!canManageTower() || state.waveActive || movingTower) return false;
    movingTower = inspectedTower;
    statusLabel.textContent = "Choose an empty pad to move your tower";
    updateHud();
    return true;
  }

  function sellSelected() {
    if (!canManageTower() || movingTower) return false;
    const tower = inspectedTower;
    const refund = Math.floor(tower.invested * .7);
    towers.splice(towers.indexOf(tower), 1);
    state.shards += refund;
    inspectedTower = null;
    statusLabel.textContent = `${tower.name} sold`;
    statusMeta.textContent = `${refund} defense shards refunded (70% of ${tower.invested} invested)`;
    updateHud();
    return true;
  }

  function upgradeName(tower) {
    const names = {
      pepe: ["Base Blaster", "Twin Emitters", "Emerald Overclock", "Crown Lens", "Legend Beam"],
      shard: ["Slow Field", "Deep Freeze", "Chain Chill", "Crystal Prison", "Absolute Zero"],
      relic: ["Relic Shell", "Heavy Charge", "Vault Cracker", "Ancient Reactor", "Cataclysm Core"],
      mage: ["Shard Spell", "Triple Cast", "Arcane Splash", "Crown Sigil", "Shard Storm"],
      hero: ["Jade Laser", "Bright Core", "Solar Burst", "Sunforged Fists", "Emerald Ascendant"],
      alchemist: ["Acid Flask", "Concentrated Acid", "Armor Solvent", "Royal Reagent", "Philosopher's Venom"],
      archer: ["Emerald Arrow", "Piercing Shot", "Rapid Quiver", "True Aim", "Legend Volley"],
    };
    return names[tower.type]?.[Math.min(tower.level - 1, 4)] || "Upgraded";
  }

  function applyUpgrade(tower) {
    if (tower.level === 3) {
      tower.damage *= 1.18;
      tower.range += 8;
      if (tower.type === "shard") tower.slow = Math.min(0.82, tower.slow + 0.12);
      if (tower.type === "relic") tower.splash += 24;
      if (tower.type === "mage") tower.splash += 18;
      if (tower.type === "archer") tower.rate *= 0.82;
      if (tower.type === "pepe") tower.rate *= 0.86;
    }
    if (tower.level === 5) {
      tower.damage *= 1.28;
      tower.range += 12;
      if (tower.type === "shard") tower.slow = 0.82;
      if (tower.type === "relic") tower.splash += 36;
      if (tower.type === "mage") tower.splash += 26;
      if (tower.type === "archer") tower.rate *= 0.76;
      if (tower.type === "pepe") tower.rate *= 0.78;
    }
  }

  function placeFromPoint(point, forcedTower = selectedTower) {
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.active = true;
    if (portalHit(point)) {
      startWave();
      return;
    }
    if (!state.playing) return;
    const pad = padAt(point.x, point.y);
    if (!pad) {
      statusLabel.textContent = "No build pad there";
      statusMeta.textContent = "drop or click on one of the circular vault pads";
      return;
    }
    const previous = selectedTower;
    if (forcedTower && forcedTower !== selectedTower) selectTower(forcedTower);
    buildOrUpgrade(pad);
    if (forcedTower && previous !== forcedTower) selectTower(forcedTower);
  }

  function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      enemy.acidTimer = Math.max(0, (enemy.acidTimer || 0) - dt);
      if (!enemy.acidTimer) enemy.armorBreak = 0;
      const slowedTime = Math.min(dt, enemy.slowTimer);
      let travel = enemy.speed * (dt - slowedTime * (enemy.slowStrength || 0));
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      if (!enemy.slowTimer) enemy.slowStrength = 0;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 5);
      enemy.spin += dt * (enemy.kind === "runner" ? 5 : 2.2);
      // Preserve movement remaining after a corner rather than dropping it.
      while (enemy.pathIndex < path.length) {
        const target = path[enemy.pathIndex];
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        if (dist > travel) {
          enemy.x += (dx / dist) * travel;
          enemy.y += (dy / dist) * travel;
          break;
        }
        enemy.x = target.x;
        enemy.y = target.y;
        travel -= dist;
        enemy.pathIndex += 1;
        if (enemy.pathIndex >= path.length) {
          enemies.splice(i, 1);
          const damage = enemy.breachDamage ?? ((enemy.boss || enemy.kind === "boss") ? 4 : enemy.kind === "elite" ? 2 : 1);
          state.vault = Math.max(0, state.vault - damage);
          relicHitFlash = 1;
          screenShake = Math.max(screenShake, (enemy.boss || enemy.kind === "boss") ? 16 : 8);
          statusLabel.textContent = "Relic base hit";
          statusMeta.textContent = `-${damage} health · Relic ${state.vault} / ${RELIC_MAX_HEALTH} HP`;
          if (!state.vault) { endGame("The relic base was destroyed"); return; }
          break;
        }
      }
    }
  }

  function targetFor(tower) {
    let best = null;
    let progress = -1;
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      if (distance(tower.x, tower.y, enemy.x, enemy.y) > tower.range) continue;
      const enemyProgress = enemy.pathIndex * 1000 - distance(enemy.x, enemy.y, path[enemy.pathIndex]?.x || enemy.x, path[enemy.pathIndex]?.y || enemy.y);
      if (enemyProgress > progress) {
        best = enemy;
        progress = enemyProgress;
      }
    }
    return best;
  }

  function applySlow(enemy, strength, duration) {
    enemy.slowStrength = Math.max(enemy.slowTimer > 0 ? (enemy.slowStrength || 0) : 0, clamp(strength, 0, .9));
    enemy.slowTimer = Math.max(enemy.slowTimer, duration);
  }

  function effectiveArmor(enemy) {
    return Math.max(0, (enemy.armor || 0) - (enemy.acidTimer > 0 ? enemy.armorBreak || 0 : 0));
  }
  function applyAcid(enemy, tower) {
    const strength = enemy.boss || enemy.kind === "boss" || enemy.kind === "warboss" ? tower.bossArmorBreak : tower.armorBreak;
    // Preserve the strongest active coating; never add strengths together.
    enemy.armorBreak = Math.max(enemy.acidTimer > 0 ? enemy.armorBreak || 0 : 0, strength);
    enemy.acidTimer = Math.max(enemy.acidTimer || 0, tower.acidDuration);
  }

  function damageEnemy(enemy, damage, slow, splash) {
    const dealt = damage * (1 - effectiveArmor(enemy));
    enemy.hp -= dealt;
    enemy.hitFlash = 1;
    floaters.push({
      x: enemy.x + (Math.random() - 0.5) * 18,
      y: enemy.y - enemy.radius - 10,
      text: String(Math.floor(dealt)),
      color: slow ? "#9ee7ff" : splash ? "#ffd86b" : "#98ffd0",
      life: 0.42,
    });
    if (slow) applySlow(enemy, slow, 1.6);
    if (splash) {
      bursts.push({ x: enemy.x, y: enemy.y, r: 0, max: splash, color: "#d8b45f", life: 0.32 });
      for (const other of enemies) {
        if (other !== enemy && distance(enemy.x, enemy.y, other.x, other.y) < splash) other.hp -= damage * 0.45 * (1 - effectiveArmor(other));
      }
    }
  }

  function enemiesNear(x, y, range, exclude) {
    return enemies.filter((enemy) => enemy !== exclude && enemy.hp > 0 && distance(x, y, enemy.x, enemy.y) <= range);
  }

  function towerRenderScale(tower) {
    return ((tower.evolved ? .255 : .22) + tower.level * .012 + tower.attackPulse * .025 + (tower.upgradePulse || 0) * .025 + (tower.evolvePulse || 0) * .05) * (tower.type === "hero" ? 1.12 : 1);
  }
  function heroFacing(tower) { return Math.cos(tower.aimAngle) < 0 ? -1 : 1; }
  function heroMuzzle(tower) {
    // Palm anchors in the normalized 512px art; mirror only horizontally to keep the plinth grounded.
    const anchors = { base: [397,187], tierThree: [415,184], evolved: [413,180], longWatch: [408,191] };
    const [x,y] = anchors[towerVisualStage(tower)], scale = towerRenderScale(tower);
    return { x: tower.x + heroFacing(tower) * (x - 256) * scale - Math.cos(tower.aimAngle) * 8 * tower.attackPulse,
      y: tower.y + (y - 292) * scale - Math.sin(tower.aimAngle) * 8 * tower.attackPulse };
  }

  function fireShot(tower, target) {
    const muzzle = tower.type === "hero" ? heroMuzzle(tower) : tower;
    const base = {
      x: muzzle.x,
      y: muzzle.y,
      tx: target.x,
      ty: target.y,
      color: tower.color,
      type: tower.type,
    };
    if (tower.type === "mage") {
      for (let i = 0; i < 3; i += 1) {
        shots.push({
          ...base,
          tx: target.x + (i - 1) * 12,
          ty: target.y + Math.sin(i) * 10,
          life: 0.3 + i * 0.03,
          max: 0.3 + i * 0.03,
          shard: i,
        });
      }
      return;
    }
    shots.push({
      ...base,
      life: tower.type === "relic" ? 0.24 : tower.type === "archer" ? 0.28 : 0.18,
      max: tower.type === "relic" ? 0.24 : tower.type === "archer" ? 0.28 : 0.18,
    });
  }

  function updateTowers(dt) {
    for (const tower of towers) {
      // Carry fractional attack time forward so tier previews remain meaningful across frame rates.
      tower.cooldown = Math.max(-dt, tower.cooldown - dt);
      if (tower.cooldown > 0) continue;
      const target = targetFor(tower);
      if (!target) { tower.cooldown = 0; continue; }
      tower.cooldown += tower.rate / (1 + tower.level * 0.08);
      tower.attackPulse = 1;
      tower.aimAngle = Math.atan2(target.y - tower.y, target.x - tower.x);
      if (tower.type === "alchemist") {
        applyAcid(target, tower);
        if (tower.splash) for(const other of enemiesNear(target.x, target.y, tower.splash, target)) applyAcid(other, tower);
        bursts.push({ x: target.x, y: target.y, r: 0, max: Math.max(20, tower.splash), color: tower.color, life: .24 });
      }
      damageEnemy(target, tower.damage, tower.slow, tower.splash);
      applyMilestoneHit(tower, target);
      fireShot(tower, target);
    }

    collectDefeatedEnemies();
  }

  function collectDefeatedEnemies() {
    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      if (enemy.hp > 0) continue;
      enemies.splice(i, 1);
      state.score += 120 + enemy.reward * 12 + state.wave * 18;
      state.shards += enemy.reward;
      screenShake = Math.max(screenShake, (enemy.boss || enemy.kind === "boss") ? 18 : enemy.kind === "elite" ? 8 : 3);
      bursts.push({
        x: enemy.x,
        y: enemy.y,
        r: 0,
        max: (enemy.boss || enemy.kind === "boss") ? 88 : 38,
        color: (enemy.boss || enemy.kind === "boss") ? "#ffd86b" : enemy.kind === "elite" ? "#ff4d6d" : "#39ff9a",
        life: (enemy.boss || enemy.kind === "boss") ? 0.48 : 0.26,
        fill: true,
      });
      floaters.push({ x: enemy.x, y: enemy.y - 30, text: `+${enemy.reward}`, color: "#74ffc5", life: 0.7 });
    }
  }

  function activateHeroNova() {
    const hero = towers.find(tower => tower.type === "hero");
    if (!hero || !state.playing || !state.waveActive || movingTower || state.heroNovaCooldown > 0 || window.EmeraldArcade?.isPaused?.()) return false;
    const targets = enemies.filter(enemy => enemy.hp > 0 && distance(hero.x, hero.y, enemy.x, enemy.y) <= hero.range);
    if (!targets.length) { statusLabel.textContent = "Nova ready - no enemies in reach"; return false; }
    state.heroNovaCooldown = novaRecharge(hero);
    for(const enemy of targets) damageEnemy(enemy, hero.damage * 5, 0, 0);
    collectDefeatedEnemies();
    hero.aimAngle = Math.atan2(targets[0].y - hero.y, targets[0].x - hero.x);
    hero.attackPulse = 1; screenShake = Math.max(screenShake, 10);
    bursts.push({x:hero.x,y:hero.y,r:0,max:hero.range,color:hero.color,life:.65});
    const muzzle = heroMuzzle(hero);
    shots.push(...targets.map(enemy=>({x:muzzle.x,y:muzzle.y,tx:enemy.x,ty:enemy.y,color:hero.color,type:"hero",life:.3,max:.3})));
    statusLabel.textContent = "EMERALD NOVA";
    statusMeta.textContent = targets.length + " foes hit · " + novaRecharge(hero) + "s recharge";
    updateHud(); return true;
  }

  function applyMilestoneHit(tower, target) {
    if (tower.level < 3) return;
    if (tower.type === "pepe") {
      const chained = enemiesNear(target.x, target.y, tower.level >= 5 ? 105 : 74, target).slice(0, tower.level >= 5 ? 3 : 1);
      for (const enemy of chained) {
        damageEnemy(enemy, tower.damage * (tower.level >= 5 ? 0.48 : 0.32), 0, 0);
        shots.push({ x: target.x, y: target.y, tx: enemy.x, ty: enemy.y, life: 0.12, max: 0.12, color: "#74ffc5", type: "pepe" });
      }
    }
    if (tower.type === "shard") {
      applySlow(target, tower.slow, tower.level >= 5 ? 2.8 : 2.1);
      if (tower.level >= 5) {
        for (const enemy of enemiesNear(target.x, target.y, 62, target).slice(0, 4)) applySlow(enemy, tower.slow, 1.7);
      }
    }
    if (tower.type === "mage" && tower.level >= 3) {
      for (const enemy of enemiesNear(target.x, target.y, tower.level >= 5 ? 92 : 62, target).slice(0, tower.level >= 5 ? 4 : 2)) {
        damageEnemy(enemy, tower.damage * 0.36, tower.level >= 5 ? 0.18 : 0, 0);
      }
    }
    if (tower.type === "archer" && tower.level >= 3) {
      const pierce = enemiesNear(tower.x, tower.y, tower.range, target)
        .sort((a, b) => distance(target.x, target.y, a.x, a.y) - distance(target.x, target.y, b.x, b.y))
        .slice(0, tower.level >= 5 ? 2 : 1);
      for (const enemy of pierce) {
        damageEnemy(enemy, tower.damage * 0.42, 0, 0);
        shots.push({ x: target.x, y: target.y, tx: enemy.x, ty: enemy.y, life: 0.16, max: 0.16, color: "#9cff6b", type: "archer" });
      }
    }
  }

  function updateWave(dt) {
    if (!state.waveActive) return;
    state.spawnTimer -= dt;
    if (state.spawnLeft > 0 && state.spawnTimer <= 0) {
      spawnEnemy();
      state.spawnLeft -= 1;
      state.spawnTimer = currentWavePlan().interval;
      statusMeta.textContent = `${state.spawnLeft + enemies.length} corrupt units in this wave`;
    }
    if (state.spawnLeft <= 0 && enemies.length === 0) {
      state.waveActive = false;
      state.score += 500 + state.wave * 100;
      state.shards += 55 + state.wave * 12;
      state.wave += 1;
      statusLabel.textContent = "Wave cleared";
      statusMeta.textContent = "build upgrades before starting the next wave";
      waveButton.textContent = "Start Next Wave";
      if (state.wave > CAMPAIGN_WAVES) endGame("Vault defended");
    }
  }

  function updateEffects(dt) {
    state.heroNovaCooldown = Math.max(0, state.heroNovaCooldown - dt);
    relicHitFlash = Math.max(0, relicHitFlash - dt * 2.5);
    screenShake = Math.max(0, screenShake - dt * 28);
    for (const tower of towers) {
      tower.attackPulse = Math.max(0, tower.attackPulse - dt * 4.6);
      tower.upgradePulse = Math.max(0, tower.upgradePulse - dt * 1.9);
      tower.evolvePulse = Math.max(0, (tower.evolvePulse || 0) - dt * 1.35);
    }
    for (let i = shots.length - 1; i >= 0; i -= 1) {
      shots[i].life -= dt;
      if (shots[i].life <= 0) shots.splice(i, 1);
    }
    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      const burst = bursts[i];
      burst.life -= dt;
      burst.r += dt * 210;
      if (burst.life <= 0) bursts.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i -= 1) {
      const floater = floaters[i];
      floater.life -= dt;
      floater.y -= dt * 34;
      if (floater.life <= 0) floaters.splice(i, 1);
    }
    if (motes.length < 72) {
      motes.push({
        x: Math.random() * W,
        y: 86 + Math.random() * (H - 150),
        vx: -8 - Math.random() * 18,
        life: 5 + Math.random() * 5,
        color: Math.random() > 0.82 ? "#d8b45f" : "#39ff9a",
      });
    }
    for (let i = motes.length - 1; i >= 0; i -= 1) {
      const mote = motes[i];
      mote.life -= dt;
      mote.x += mote.vx * dt;
      if (mote.life <= 0 || mote.x < -20) motes.splice(i, 1);
    }
  }

  function update(dt) {
    updateEnemies(dt);
    if (!state.playing) { updateHud(); return; }
    updateTowers(dt);
    updateWave(dt);
    updateEffects(dt);
    updateHud();
  }

  function drawBackground() {
    if (courtyard.complete && courtyard.naturalWidth) {
      ctx.drawImage(courtyard, 0, 0, W, H);
      // Let the live path, pads and bright combat sprites lead the eye.
      ctx.fillStyle = "rgba(2, 8, 6, .16)";
      ctx.fillRect(0, 0, W, H);
      return;
    }
    const gradient = ctx.createRadialGradient(W * 0.52, H * 0.42, 0, W * 0.52, H * 0.42, W * 0.72);
    gradient.addColorStop(0, "#073022");
    gradient.addColorStop(0.48, "#03120d");
    gradient.addColorStop(1, "#020806");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    if (flame.complete) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.drawImage(flame, 0, 0, W, H);
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = "rgba(116, 255, 197, 0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 78);
      ctx.lineTo(x - 120, H);
      ctx.stroke();
    }
    for (let y = 90; y <= H; y += 58) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    for (const mote of motes) {
      ctx.globalAlpha = clamp(mote.life / 5, 0, 0.55);
      ctx.fillStyle = mote.color;
      ctx.shadowColor = mote.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    drawRelicPillars();
  }

  function drawRelicPillars() {
    const pillars = [
      { x: 92, y: 148, h: 128 }, { x: 1185, y: 130, h: 150 },
      { x: 92, y: 560, h: 120 }, { x: 1190, y: 585, h: 110 },
    ];
    ctx.save();
    for (const pillar of pillars) {
      ctx.fillStyle = "rgba(5, 16, 12, 0.86)";
      ctx.strokeStyle = "rgba(216, 180, 95, 0.38)";
      ctx.lineWidth = 2;
      ctx.fillRect(pillar.x - 28, pillar.y - pillar.h / 2, 56, pillar.h);
      ctx.strokeRect(pillar.x - 28, pillar.y - pillar.h / 2, 56, pillar.h);
      ctx.fillStyle = "rgba(57, 255, 154, 0.8)";
      ctx.shadowColor = "#39ff9a";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(pillar.x, pillar.y - 24);
      ctx.lineTo(pillar.x + 14, pillar.y);
      ctx.lineTo(pillar.x, pillar.y + 24);
      ctx.lineTo(pillar.x - 14, pillar.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawPath() {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(216, 180, 95, 0.32)";
    ctx.lineWidth = 58;
    ctx.beginPath();
    path.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
    ctx.stroke();
    ctx.strokeStyle = "rgba(57, 255, 154, 0.46)";
    ctx.lineWidth = 25;
    ctx.stroke();
    ctx.strokeStyle = "rgba(216, 180, 95, 0.5)";
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 18]);
    ctx.lineDashOffset = -performance.now() * 0.028;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(2, 8, 6, 0.88)";
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.restore();
  }

  function drawPortal() {
    const hovered = pointer.active && portalHit(pointer);
    ctx.save();
    ctx.translate(path[0].x, path[0].y);
    ctx.strokeStyle = state.waveActive ? "rgba(255, 77, 109, 0.88)" : hovered ? "rgba(216, 180, 95, 0.9)" : "rgba(116, 255, 197, 0.44)";
    ctx.fillStyle = "rgba(2, 8, 6, 0.72)";
    ctx.lineWidth = 4;
    ctx.shadowColor = state.waveActive ? "#ff4d6d" : hovered ? "#d8b45f" : "#39ff9a";
    ctx.shadowBlur = hovered ? 28 : 18;
    ctx.beginPath();
    ctx.arc(0, 0, (hovered ? 38 : 32) + Math.sin(performance.now() * 0.008) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = state.waveActive ? "#ff4d6d" : "#39ff9a";
    ctx.beginPath();
    ctx.moveTo(-11, -14);
    ctx.lineTo(16, 0);
    ctx.lineTo(-11, 14);
    ctx.closePath();
    ctx.fill();
    if (!state.waveActive) {
      ctx.fillStyle = hovered ? "#fff5ce" : "#dfffee";
      ctx.font = "900 12px Arial";
      ctx.textAlign = "left";
      ctx.fillText("START", 46, 4);
    }
    ctx.restore();
  }

  function drawPads() {
    for (const pad of pads) {
      const occupied = towerAtPad(pad);
      const hovered = distance(pointer.x, pointer.y, pad.x, pad.y) < 34 && pointer.active;
      ctx.save();
      ctx.translate(pad.x, pad.y);
      ctx.fillStyle = occupied ? "rgba(57, 255, 154, 0.18)" : hovered ? "rgba(116, 255, 197, 0.16)" : "rgba(116, 255, 197, 0.08)";
      ctx.strokeStyle = occupied && occupied === inspectedTower ? "#ffffff" : movingTower && !occupied ? "#74c7ff" : occupied ? "rgba(216, 180, 95, 0.8)" : hovered ? "rgba(116, 255, 197, 0.9)" : "rgba(116, 255, 197, 0.42)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, hovered ? 36 : 31, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (!occupied) {
        ctx.fillStyle = "#dfffee"; ctx.font = "900 18px Arial"; ctx.textAlign = "center"; ctx.fillText(String(pads.indexOf(pad) + 1), 0, 6);
      }
      if (!occupied && hovered) {
        const type = towerTypes[selectedTower];
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = type.color;
        ctx.beginPath();
        ctx.arc(0, 0, type.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = "rgba(116, 255, 197, 0.24)";
      ctx.beginPath();
      ctx.arc(0, 0, 21, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTowerHoverInfo() {
    if (!pointer.active) return;
    const pad = padAt(pointer.x, pointer.y);
    if (!pad) return;
    const tower = towerAtPad(pad);
    if (!tower) return;
    const cost = upgradeCost(tower);
    const isMax = !Number.isFinite(cost);
    ctx.save();
    ctx.translate(tower.x, tower.y - 78);
    ctx.fillStyle = "rgba(1, 8, 6, 0.88)";
    ctx.strokeStyle = isMax ? "rgba(216, 180, 95, 0.82)" : state.shards >= cost ? "rgba(116, 255, 197, 0.72)" : "rgba(255, 77, 109, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-78, -21, 156, 42, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#effff7";
    ctx.font = "900 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(isMax ? `${tower.name} maxed` : upgradeName({ ...tower, level: tower.level + 1 }), 0, -4);
    ctx.fillStyle = isMax ? "#ffd86b" : state.shards >= cost ? "#74ffc5" : "#ff9cab";
    ctx.fillText("Select to manage tower", 0, 13);
    ctx.restore();
  }

  function drawTowers() {
    for (const tower of towers) {
      const sprite = loadedTowerSprite(tower);
      const pulse = tower.attackPulse;
      const upgradePulse = tower.upgradePulse || 0;
      const evolvePulse = tower.evolvePulse || 0;
      const recoilX = Math.cos(tower.aimAngle) * -8 * pulse;
      const recoilY = Math.sin(tower.aimAngle) * -8 * pulse;
      ctx.save();
      ctx.translate(tower.x, tower.y);
      ctx.save();
      ctx.globalAlpha = 0.18 + pulse * 0.22;
      ctx.strokeStyle = tower.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, tower.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(recoilX, recoilY);
      const scale = towerRenderScale(tower);
      if (sprite.complete && sprite.naturalWidth) {
        ctx.shadowColor = tower.color;
        ctx.shadowBlur = 18 + pulse * 22;
        if (tower.type === "hero") ctx.scale(heroFacing(tower), 1);
        ctx.drawImage(sprite, -256 * scale, -292 * scale, 512 * scale, 512 * scale);
      } else {
        ctx.fillStyle = tower.color;
        ctx.shadowColor = tower.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Let the generated silhouette carry tier-3 and Long Watch identity without extra orbiting clutter.
      if (towerVisualStage(tower) === "base") drawUpgradeDetails(tower, pulse, upgradePulse);
      else if (towerVisualStage(tower) === "evolved") drawEvolvedCrown(tower, evolvePulse);

      if (pulse > 0) {
        ctx.save();
        ctx.rotate(tower.aimAngle);
        ctx.translate(42 + tower.level * 2, 0);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = tower.type === "relic" ? "#ffd86b" : tower.color;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(0, 0, tower.type === "relic" ? 14 : 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = tower.level >= 3 ? "#ffd86b" : "#effff7";
      ctx.font = "900 13px Arial";
      ctx.textAlign = "center";
      ctx.shadowColor = tower.level >= 3 ? "#ffd86b" : tower.color;
      ctx.shadowBlur = 8;
      ctx.fillText(tierCode(tower), 0, 44);
      ctx.restore();
    }
  }

  function drawEvolvedCrown(tower, evolvePulse) {
    ctx.save();
    ctx.globalAlpha = 0.72 + evolvePulse * 0.28;
    ctx.shadowColor = "#ffd86b";
    ctx.shadowBlur = 18 + evolvePulse * 34;
    const count = 5;
    for (let i = 0; i < count; i += 1) {
      const a = performance.now() * 0.0015 + (Math.PI * 2 * i) / count;
      ctx.save();
      ctx.translate(Math.cos(a) * 58, Math.sin(a) * 34 - 8);
      ctx.rotate(a + Math.PI / 4);
      ctx.fillStyle = i % 2 ? tower.color : "#ffd86b";
      drawTinyDiamond(0, 0, 10, 16);
      ctx.restore();
    }
    if (evolvePulse > 0) {
      ctx.globalAlpha = evolvePulse * 0.45;
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(0, -8, 80 + evolvePulse * 24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawUpgradeDetails(tower, pulse, upgradePulse) {
    if (tower.level <= 1 && upgradePulse <= 0) return;
    ctx.save();
    ctx.shadowBlur = 14 + upgradePulse * 18;
    drawLevelGems(tower, upgradePulse);
    if (tower.type === "pepe") {
      ctx.shadowColor = "#39ff9a";
      drawOrbitingDiamonds(tower, Math.min(4, tower.level + 1), 46 + pulse * 4, 0.0018, ["#39ff9a", "#d8b45f"]);
    } else if (tower.type === "shard") {
      ctx.shadowColor = "#74c7ff";
      const count = Math.min(6, tower.level + 2);
      for (let i = 0; i < count; i += 1) {
        const a = performance.now() * 0.002 + (Math.PI * 2 * i) / count;
        const r = 38 + tower.level * 5 + upgradePulse * 10;
        ctx.save();
        ctx.translate(Math.cos(a) * r, Math.sin(a) * r * 0.72);
        ctx.rotate(a + Math.PI / 4);
        ctx.fillStyle = i % 2 ? "#74c7ff" : "#dff7ff";
        drawTinyDiamond(0, 0, 8, 14);
        ctx.restore();
      }
    } else if (tower.type === "relic") {
      ctx.shadowColor = "#ffd86b";
      drawOrbitingDiamonds(tower, Math.min(5, tower.level + 1), 50 + upgradePulse * 8, -0.0014, ["#ffd86b", "#ff7a3d"]);
    } else if (tower.type === "mage") {
      ctx.shadowColor = "#a855ff";
      const count = Math.min(7, tower.level + 3);
      for (let i = 0; i < count; i += 1) {
        const a = -performance.now() * 0.0025 + (Math.PI * 2 * i) / count;
        ctx.save();
        ctx.translate(Math.cos(a) * 42, Math.sin(a) * 25 - 18);
        ctx.rotate(a);
        ctx.fillStyle = i % 2 ? "#a855ff" : "#39ff9a";
        drawTinyDiamond(0, 0, 8, 18);
        ctx.restore();
      }
    } else if (tower.type === "archer") {
      ctx.shadowColor = "#9cff6b";
      drawArrowHalo(tower, upgradePulse);
    }
    ctx.restore();
  }

  function drawLevelGems(tower, upgradePulse) {
    const count = Math.min(5, tower.level);
    ctx.save();
    ctx.shadowColor = tower.level >= 5 ? "#ffd86b" : tower.color;
    ctx.shadowBlur = 10 + upgradePulse * 14;
    for (let i = 0; i < count; i += 1) {
      ctx.save();
      ctx.translate(-24 + i * 12, 48 + Math.sin(performance.now() * 0.006 + i) * 1.5);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = i === 4 ? "#ffd86b" : tower.color;
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawTinyDiamond(x, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(x, y - height / 2);
    ctx.lineTo(x + width / 2, y);
    ctx.lineTo(x, y + height / 2);
    ctx.lineTo(x - width / 2, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawOrbitingDiamonds(tower, count, radius, speed, colors) {
    for (let i = 0; i < count; i += 1) {
      const a = performance.now() * speed + (Math.PI * 2 * i) / count;
      ctx.save();
      ctx.translate(Math.cos(a) * radius, Math.sin(a) * radius * 0.56 - 12);
      ctx.rotate(a + Math.PI / 4);
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawArrowHalo(tower, upgradePulse) {
    const count = Math.min(6, tower.level + 1);
    for (let i = 0; i < count; i += 1) {
      const a = -0.8 + (1.6 * i) / Math.max(1, count - 1);
      const r = 46 + upgradePulse * 8;
      ctx.save();
      ctx.translate(Math.sin(a) * r, -24 - Math.cos(a) * 18);
      ctx.rotate(a);
      ctx.fillStyle = i % 2 ? "#9cff6b" : "#d8b45f";
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(5, 2);
      ctx.lineTo(0, 8);
      ctx.lineTo(-5, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const enemy of enemies) {
      const hp = clamp(enemy.hp / enemy.maxHp, 0, 1);
      const sprite = enemySprites[enemy.kind] || enemySprites.grunt;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.fillStyle = (enemy.boss || enemy.kind === "boss") ? "#f2b84b" : enemy.kind === "elite" ? "#ff4d6d" : enemy.kind === "runner" ? "#b25cff" : "#ff7a7a";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12 + enemy.hitFlash * 18;
      if (sprite.complete && sprite.naturalWidth) {
        const size = enemy.size || ((enemy.boss || enemy.kind === "boss") ? 112 : enemy.kind === "runner" ? 62 : enemy.kind === "elite" ? 66 : 54);
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      if (enemy.armor) {
        ctx.strokeStyle = "#ffd86b"; ctx.lineWidth = enemy.boss ? 3 : 2;
        ctx.beginPath(); ctx.ellipse(0, 8, enemy.radius + 8, enemy.radius * .55, 0, 0, Math.PI * 2); ctx.stroke();
      }
      if (enemy.acidTimer > 0) {
        ctx.fillStyle = "#caff64"; ctx.font = "bold 11px Arial"; ctx.textAlign = "center";
        const reduction = Math.round(Math.min(enemy.armor || 0, enemy.armorBreak) * 100);
        ctx.fillText(reduction ? "ACID -" + reduction : "ACID", 0, -enemy.radius - 23);
        ctx.fillRect(-12, enemy.radius + 10, 24, 3);
      }
      if (enemy.kind === "warboss") {
        ctx.fillStyle = "#ffd86b"; ctx.font = "bold 13px Arial"; ctx.textAlign = "center";
        ctx.fillText("WARBOSS", 0, -75);
      }
      if (enemy.hitFlash > 0) {
        ctx.globalAlpha = enemy.hitFlash * 0.65;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "rgba(2,8,6,0.86)";
      ctx.fillRect(-enemy.radius - 8, -enemy.radius - 14, (enemy.radius + 8) * 2, 5);
      ctx.fillStyle = "#39ff9a";
      ctx.fillRect(-enemy.radius - 8, -enemy.radius - 14, (enemy.radius + 8) * 2 * hp, 5);
      ctx.restore();
    }
  }

  function drawEffects() {
    ctx.save();
    for (const shot of shots) {
      const alpha = clamp(shot.life / shot.max, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = shot.color;
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = 14;
      if (shot.type === "pepe") {
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(shot.x, shot.y);
        ctx.lineTo(shot.tx, shot.ty);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.stroke();
      } else if (shot.type === "shard") {
        const midX = (shot.x + shot.tx) / 2;
        const midY = (shot.y + shot.ty) / 2;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 7]);
        ctx.beginPath();
        ctx.moveTo(shot.x, shot.y);
        ctx.quadraticCurveTo(midX, midY - 28, shot.tx, shot.ty);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(shot.tx, shot.ty, 24 * (1.1 - alpha), 0, Math.PI * 2);
        ctx.stroke();
      } else if (shot.type === "relic") {
        const progress = 1 - alpha;
        const x = shot.x + (shot.tx - shot.x) * progress;
        const y = shot.y + (shot.ty - shot.y) * progress;
        ctx.fillStyle = "#ffd86b";
        ctx.beginPath();
        ctx.arc(x, y, 9 + progress * 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(shot.x, shot.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (shot.type === "mage") {
        const progress = 1 - alpha;
        const x = shot.x + (shot.tx - shot.x) * progress;
        const y = shot.y + (shot.ty - shot.y) * progress + Math.sin(progress * Math.PI + shot.shard) * 18;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(progress * 8 + shot.shard);
        ctx.fillStyle = shot.shard % 2 ? "#a855ff" : "#39ff9a";
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 14);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (shot.type === "hero") {
        ctx.strokeStyle = "#32ff73"; ctx.lineWidth = 6; ctx.shadowColor = "#32ff73"; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.moveTo(shot.x, shot.y); ctx.lineTo(shot.tx, shot.ty); ctx.stroke();
        ctx.strokeStyle = "#d4ffe1"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(shot.x, shot.y); ctx.lineTo(shot.tx, shot.ty); ctx.stroke();
      } else if (shot.type === "alchemist") {
        const progress = 1 - alpha;
        const x = shot.x + (shot.tx - shot.x) * progress;
        const y = shot.y + (shot.ty - shot.y) * progress - Math.sin(progress * Math.PI) * 35;
        ctx.save(); ctx.translate(x, y); ctx.rotate(progress * 5);
        ctx.fillStyle = "#b6f34d"; ctx.beginPath(); ctx.arc(0, 2, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e3be6c"; ctx.fillRect(-3, -9, 6, 7); ctx.restore();
      } else if (shot.type === "archer") {
        const progress = 1 - alpha;
        const x = shot.x + (shot.tx - shot.x) * progress;
        const y = shot.y + (shot.ty - shot.y) * progress;
        const a = Math.atan2(shot.ty - shot.y, shot.tx - shot.x);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = "#9cff6b";
        ctx.shadowColor = "#9cff6b";
        ctx.shadowBlur = 18;
        ctx.fillRect(-3, -20, 6, 38);
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(10, -12);
        ctx.lineTo(-10, -12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    for (const burst of bursts) {
      ctx.globalAlpha = clamp(burst.life / 0.32, 0, 1);
      ctx.strokeStyle = burst.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = burst.color;
      ctx.shadowBlur = 16;
      if (burst.fill) {
        ctx.fillStyle = burst.color;
        ctx.globalAlpha *= 0.16;
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, Math.min(burst.r, burst.max), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = clamp(burst.life / 0.32, 0, 1);
      }
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, Math.min(burst.r, burst.max), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloaters() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "900 18px Arial";
    for (const floater of floaters) {
      ctx.globalAlpha = clamp(floater.life / 0.55, 0, 1);
      ctx.fillStyle = floater.color;
      ctx.shadowColor = floater.color;
      ctx.shadowBlur = 10;
      ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.restore();
  }

  function drawVault() {
    const ratio = clamp(state.vault / RELIC_MAX_HEALTH, 0, 1);
    const color = relicHitFlash > 0 ? "#ff9a82" : ratio <= .25 ? "#ff826f" : "#61ffbd";
    ctx.save();
    ctx.translate(relicBase.x, relicBase.y);
    if (relicBaseSprite.complete && relicBaseSprite.naturalWidth) {
      ctx.shadowColor = relicHitFlash > 0 ? "#ff7055" : "#39ff9a";
      ctx.shadowBlur = relicHitFlash * 28;
      ctx.filter = state.vault === 0 ? "grayscale(1) brightness(.45)" : ratio <= .25 ? "saturate(.6) brightness(.8)" : "none";
      ctx.drawImage(relicBaseSprite, -72, -78, 144, 144);
      ctx.filter = "none"; ctx.shadowBlur = 0;
    } else {
    // Stone foundation and gold bands keep the objective in the jade courtyard's visual language.
    ctx.fillStyle = "rgba(0, 0, 0, .45)";
    ctx.beginPath(); ctx.ellipse(0, 39, 55, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#102c25"; ctx.strokeStyle = "#c1a25b"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-48, 24); ctx.lineTo(0, 43); ctx.lineTo(48, 24);
    ctx.lineTo(48, 40); ctx.lineTo(0, 59); ctx.lineTo(-48, 40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#234b3b";
    ctx.beginPath(); ctx.moveTo(-48, 24); ctx.lineTo(0, 5); ctx.lineTo(48, 24); ctx.lineTo(0, 43); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const x of [-37, 37]) {
      ctx.fillStyle = "#183d30"; ctx.fillRect(x - 7, -24, 14, 52);
      ctx.strokeStyle = "#b49950"; ctx.strokeRect(x - 7, -24, 14, 52);
      ctx.fillStyle = "#d7b963"; ctx.fillRect(x - 9, -28, 18, 7);
    }
    ctx.fillStyle = state.vault > 0 ? color : "#3d4943";
    ctx.shadowColor = color; ctx.shadowBlur = state.vault > 0 ? 18 + relicHitFlash * 20 : 0;
    ctx.beginPath(); ctx.moveTo(0, -45); ctx.lineTo(24, -9); ctx.lineTo(0, 24); ctx.lineTo(-24, -9); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = "#d0ffe4"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -45); ctx.lineTo(0, 24); ctx.moveTo(-24, -9); ctx.lineTo(24, -9); ctx.stroke();
    }
    if (ratio < .5) {
      ctx.strokeStyle = "#163328"; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(5, -28); ctx.lineTo(-6, -12); ctx.lineTo(7, 0); ctx.lineTo(-3, 13); ctx.stroke();
    }
    ctx.fillStyle = "rgba(3, 12, 9, .94)"; ctx.fillRect(-72, -92, 144, 39);
    ctx.textAlign = "center"; ctx.fillStyle = "#f1df9c"; ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText("RELIC BASE", 0, -77);
    ctx.fillStyle = color; ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillText(state.vault + " / " + RELIC_MAX_HEALTH + " HP", 0, -60);
    ctx.fillStyle = "#14271e"; ctx.fillRect(-54, -52, 108, 7);
    ctx.fillStyle = color; ctx.fillRect(-54, -52, 108 * ratio, 7);
    ctx.restore();
  }

  function draw() {
    ctx.save();
    if (screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }
    drawBackground();
    drawPath();
    drawPortal();
    drawVault();
    drawPads();
    drawTowers();
    drawEnemies();
    drawEffects();
    drawFloaters();
    drawTowerHoverInfo();
    ctx.restore();
  }

  function loop(now) {
    // Use the pause-adjusted RAF clock for both the baseline and later frames.
    const dt = last === null ? 0 : Math.max(0, Math.min(0.033, (now - last) / 1000));
    last = now;
    if (state.playing) update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function scalePointer(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    };
  }

  canvas.addEventListener("click", (event) => {
    const point = scalePointer(event);
    placeFromPoint(point);
  });
  canvas.addEventListener("dragover", (event) => {
    event.preventDefault();
    const point = scalePointer(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.active = true;
  });
  canvas.addEventListener("drop", (event) => {
    event.preventDefault();
    const type = event.dataTransfer?.getData("text/plain") || selectedTower;
    if (!towerTypes[type]) return;
    placeFromPoint(scalePointer(event), type);
  });
  canvas.addEventListener("pointermove", (event) => {
    const point = scalePointer(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.active = true;
  });
  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("keydown", (event) => {
    if (window.EmeraldArcade?.isPaused?.() || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target?.closest?.("button, a, input, select, textarea, [contenteditable]")) return;
    if (event.key === "Escape") { movingTower = null; updateHud(); }
    if (event.key === "1") selectTower("pepe");
    if (event.key === "2") selectTower("shard");
    if (event.key === "3") selectTower("relic");
    if (event.key === "4") selectTower("mage");
    if (event.key === "5") selectTower("archer");
    if (event.key === "6") selectTower("alchemist");
    if (event.key === "7") selectTower("hero");
    if (event.key.toLowerCase() === "h") activateHeroNova();
    if (event.key.toLowerCase() === "w") startWave();
    if (event.key === "Enter" && !state.playing) resetGame();
  });

  towerButtons.forEach((button) => {
    button.addEventListener("click", () => selectTower(button.dataset.tower));
    button.addEventListener("dragstart", (event) => {
      selectTower(button.dataset.tower);
      event.dataTransfer?.setData("text/plain", button.dataset.tower);
      event.dataTransfer.effectAllowed = "copy";
      statusLabel.textContent = `Dragging ${towerTypes[button.dataset.tower].name}`;
      statusMeta.textContent = "drop it on a glowing build pad";
    });
  });
  window.addEventListener("emeraldarcade:pause", () => { pointer.active = false; updateHud(); });
  padButtons.forEach(button => button.addEventListener("click", () => buildOrUpgrade(pads[Number(button.dataset.pad)])));
  commandTabs.forEach(button => button.addEventListener("click", () => setCommandView(button.dataset.commandTab)));
  pathButtons.forEach(button => button.addEventListener("click", () => upgradeSelected(button.dataset.upgradePath)));
  moveButton.addEventListener("click", beginMove);
  sellButton.addEventListener("click", sellSelected);
  cancelMoveButton.addEventListener("click", () => { if (!window.EmeraldArcade?.isPaused?.()) { movingTower = null; updateHud(); } });
  heroNovaButton.addEventListener("click", activateHeroNova);
  waveButton.addEventListener("click", startWave);
  startButton.addEventListener("click", resetAndLaunch);
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.textContent = `Sound: ${soundOn ? "on" : "off"}`;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
  });

  updateMasteryLabels();
  updateHud();
  draw();
})();
