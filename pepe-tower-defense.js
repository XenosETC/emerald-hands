(() => {
  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = document.querySelector("#gameOverlay");
  const startButton = document.querySelector("#startButton");
  const overlayTitle = document.querySelector("#overlayTitle");
  const overlayText = document.querySelector("#overlayText");
  const soundToggle = document.querySelector("#soundToggle");
  const waveButton = document.querySelector("#waveButton");
  const towerButtons = [...document.querySelectorAll(".tower-button")];
  const scoreLabel = document.querySelector("#scoreLabel");
  const shardLabel = document.querySelector("#shardLabel");
  const waveLabel = document.querySelector("#waveLabel");
  const vaultLabel = document.querySelector("#vaultLabel");
  const bestLabel = document.querySelector("#bestLabel");
  const statusLabel = document.querySelector("#statusLabel");
  const statusMeta = document.querySelector("#statusMeta");

  const W = canvas.width;
  const H = canvas.height;
  const STORAGE_KEY = "pepe-tower-defense-best-v1";
  const MASTERY_KEY = "pepe-tower-defense-mastery-v1";
  const pepe = new Image();
  pepe.src = "assets/pepecoin-run/pepecoin-classic.png";
  const flame = new Image();
  flame.src = "assets/pepe-relic-rumble/origin-flame.png";
  const towerSprites = {
    pepe: loadImage("assets/pepe-tower-defense/pepe-blaster-sprite.png"),
    shard: loadImage("assets/pepe-tower-defense/shard-slow-sprite.png"),
    relic: loadImage("assets/pepe-tower-defense/relic-cannon-sprite.png"),
    mage: loadImage("assets/pepe-tower-defense/pepe-mage-sprite.png"),
    archer: loadImage("assets/pepe-tower-defense/pepe-archer-sprite.png"),
  };
  const evolvedTowerSprites = {
    pepe: loadImage("assets/pepe-tower-defense/pepe-blaster-evolved-sprite.png"),
    shard: loadImage("assets/pepe-tower-defense/shard-slow-evolved-sprite.png"),
    relic: loadImage("assets/pepe-tower-defense/relic-cannon-evolved-sprite.png"),
    mage: loadImage("assets/pepe-tower-defense/pepe-mage-evolved-sprite.png"),
    archer: loadImage("assets/pepe-tower-defense/pepe-archer-evolved-sprite.png"),
  };
  const enemySprites = {
    grunt: loadImage("assets/pepe-tower-defense/enemy-crawler-sprite.png"),
    elite: loadImage("assets/pepe-tower-defense/enemy-crawler-sprite.png"),
    runner: loadImage("assets/pepe-tower-defense/enemy-runner-sprite.png"),
    boss: loadImage("assets/pepe-tower-defense/enemy-boss-sprite.png"),
  };

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
    { x: 1325, y: 404 },
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
  };
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

  function masteryRank(type) {
    const actions = mastery[type].placements + mastery[type].upgrades;
    if (actions >= 35) return "Legend";
    if (actions >= 15) return "Veteran";
    if (actions >= 5) return "Operator";
    return "Recruit";
  }

  function recordMastery(type, field) {
    mastery[type][field] += 1;
    localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery));
    updateMasteryLabels();
  }

  function updateMasteryLabels() {
    const roles = { pepe: "beam DPS", shard: "control field", relic: "splash burst", mage: "shard volley", archer: "emerald arrows" };
    towerButtons.forEach((button) => {
      const type = button.dataset.tower;
      const actions = mastery[type].placements + mastery[type].upgrades;
      button.querySelector("small").textContent = `${towerTypes[type].cost} shards - ${roles[type]} · ${masteryRank(type)} ${actions}`;
    });
  }

  let raf = 0;
  let last = performance.now();
  let selectedTower = "pepe";
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
    vault: 20,
    spawnLeft: 0,
    waveSpawnTotal: 0,
    spawnTimer: 0,
    best: Number(localStorage.getItem(STORAGE_KEY) || 0),
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
    shots.length = 0;
    bursts.length = 0;
    floaters.length = 0;
    motes.length = 0;
    state.playing = true;
    state.waveActive = false;
    state.wave = 1;
    state.score = 0;
    state.shards = 180;
    state.vault = 20;
    state.spawnLeft = 0;
    state.waveSpawnTotal = 0;
    state.spawnTimer = 0;
    overlay.classList.add("is-hidden");
    waveButton.textContent = "Start Wave";
    statusLabel.textContent = "Place defenders on empty pads";
    statusMeta.textContent = "1/2/3 select towers - click a pad to build";
    updateHud();
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function resetAndLaunch() {
    resetGame();
    startWave();
  }

  function endGame(title) {
    state.playing = false;
    state.waveActive = false;
    const score = Math.floor(state.score);
    const completedWave = Math.max(1, state.wave - 1);
    const rank = rankForRun(completedWave, score);
    if (score > state.best) {
      state.best = score;
      localStorage.setItem(STORAGE_KEY, String(score));
    }
    window.EmeraldArcade?.recordAndNotify("towerDefense", {
      played: true,
      score,
      rank,
      wave: completedWave,
      shards: state.shards,
    });
    overlayTitle.textContent = title;
    overlayText.textContent = `${format(score)} score - survived wave ${completedWave} - rank: ${rank}.`;
    startButton.textContent = "Rebuild Defense";
    overlay.classList.remove("is-hidden");
    updateHud();
  }

  function startWave() {
    if (!state.playing) resetGame();
    if (state.waveActive) return;
    state.waveActive = true;
    state.waveSpawnTotal = 9 + state.wave * 3;
    state.spawnLeft = state.waveSpawnTotal;
    spawnEnemy();
    state.spawnLeft -= 1;
    state.spawnTimer = 0.55;
    statusLabel.textContent = `Wave ${state.wave} incoming`;
    statusMeta.textContent = `${state.spawnLeft + enemies.length} corrupt units in this wave`;
    waveButton.textContent = "Wave Running";
  }

  function spawnEnemy() {
    const spawned = state.waveSpawnTotal - state.spawnLeft;
    const boss = state.wave >= 5 && state.wave % 5 === 0 && spawned === Math.floor(state.waveSpawnTotal * 0.55);
    const elite = state.wave >= 4 && Math.random() < 0.18;
    const runner = state.wave >= 3 && Math.random() < 0.22;
    const kind = boss ? "boss" : elite ? "elite" : runner ? "runner" : "grunt";
    const hpBase = boss ? 520 : elite ? 130 : 70;
    const hpScale = boss ? 72 : elite ? 24 : 13;
    enemies.push({
      x: path[0].x,
      y: path[0].y,
      pathIndex: 1,
      hp: hpBase + state.wave * hpScale,
      maxHp: hpBase + state.wave * hpScale,
      speed: (boss ? 36 : runner ? 92 : 58) + state.wave * (boss ? 1.1 : 2.4),
      reward: boss ? 120 : elite ? 28 : runner ? 18 : 13,
      radius: boss ? 31 : elite ? 19 : runner ? 15 : 14,
      slowTimer: 0,
      kind,
      spin: Math.random() * Math.PI * 2,
      hitFlash: 0,
    });
    if (boss) {
      statusLabel.textContent = "Boss shard entering";
      statusMeta.textContent = "focus fire the corrupted vault breaker";
      screenShake = Math.max(screenShake, 10);
    }
  }

  function updateHud() {
    scoreLabel.textContent = format(state.score);
    shardLabel.textContent = state.shards;
    waveLabel.textContent = state.wave;
    vaultLabel.textContent = state.vault;
    bestLabel.textContent = format(state.best);
  }

  function selectTower(type) {
    selectedTower = type;
    towerButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.tower === type));
    const tower = towerTypes[type];
    statusLabel.textContent = tower.name;
    statusMeta.textContent = `${tower.cost} shards - click an empty pad to place`;
  }

  function padAt(x, y) {
    return pads.find((pad) => distance(x, y, pad.x, pad.y) < 34);
  }

  function towerAtPad(pad) {
    return towers.find((tower) => tower.pad === pad);
  }

  function upgradeCost(tower) {
    if (tower.level >= 5) return Infinity;
    return 65 + tower.level * 55;
  }

  function portalHit(point) {
    return point.x < 120 && distance(point.x, point.y, path[0].x, path[0].y) < 70;
  }

  function buildOrUpgrade(pad) {
    const existing = towerAtPad(pad);
    if (existing) {
      const cost = upgradeCost(existing);
      if (!Number.isFinite(cost)) {
        statusLabel.textContent = `${existing.name} maxed`;
        statusMeta.textContent = `${upgradeName(existing)} is already online`;
        return;
      }
      if (state.shards < cost) {
        statusLabel.textContent = "Need more shards";
        statusMeta.textContent = `${cost} shards to upgrade ${existing.name}`;
        return;
      }
      state.shards -= cost;
      existing.level += 1;
      recordMastery(existing.type, "upgrades");
      applyUpgrade(existing);
      existing.upgradePulse = 1;
      if (existing.level === 5) {
        existing.evolved = true;
        existing.evolvePulse = 1.2;
        screenShake = Math.max(screenShake, 14);
      }
      statusLabel.textContent = `${existing.name} upgraded`;
      statusMeta.textContent = `LV ${existing.level}: ${upgradeName(existing)}`;
      bursts.push({ x: existing.x, y: existing.y, r: 0, max: existing.range * 0.42, color: existing.color, life: 0.34, fill: true });
      floaters.push({ x: existing.x, y: existing.y - 36, text: `LV ${existing.level}`, color: "#ffd86b", life: 0.85 });
      updateHud();
      return;
    }

    const type = towerTypes[selectedTower];
    if (state.shards < type.cost) {
      statusLabel.textContent = "Need more shards";
      statusMeta.textContent = `${type.cost} shards required for ${type.name}`;
      return;
    }
    state.shards -= type.cost;
    towers.push({
      ...type,
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
    recordMastery(selectedTower, "placements");
    statusLabel.textContent = `${type.name} placed`;
    statusMeta.textContent = "click it again later to upgrade";
    bursts.push({ x: pad.x, y: pad.y, r: 0, max: 58, color: type.color, life: 0.28, fill: true });
    floaters.push({ x: pad.x, y: pad.y - 34, text: "BUILT", color: type.color, life: 0.75 });
    updateHud();
  }

  function upgradeName(tower) {
    const names = {
      pepe: ["Base Blaster", "Twin Emitters", "Emerald Overclock", "Crown Lens", "Legend Beam"],
      shard: ["Slow Field", "Deep Freeze", "Chain Chill", "Crystal Prison", "Absolute Zero"],
      relic: ["Relic Shell", "Heavy Charge", "Vault Cracker", "Ancient Reactor", "Cataclysm Core"],
      mage: ["Shard Spell", "Triple Cast", "Arcane Splash", "Crown Sigil", "Shard Storm"],
      archer: ["Emerald Arrow", "Piercing Shot", "Rapid Quiver", "True Aim", "Legend Volley"],
    };
    return names[tower.type]?.[Math.min(tower.level - 1, 4)] || "Upgraded";
  }

  function applyUpgrade(tower) {
    tower.damage *= 1.22;
    tower.range += 8;
    if (tower.level === 3) {
      tower.damage *= 1.18;
      tower.range += 8;
      if (tower.type === "shard") tower.slow = Math.min(0.72, tower.slow + 0.12);
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
      const target = path[enemy.pathIndex];
      const speed = enemy.speed * (enemy.slowTimer > 0 ? 0.55 : 1);
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 5);
      enemy.spin += dt * (enemy.kind === "runner" ? 5 : 2.2);
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist < speed * dt) {
        enemy.x = target.x;
        enemy.y = target.y;
        enemy.pathIndex += 1;
        if (enemy.pathIndex >= path.length) {
          enemies.splice(i, 1);
          state.vault -= enemy.kind === "elite" ? 2 : 1;
          if (enemy.kind === "boss") state.vault -= 3;
          screenShake = Math.max(screenShake, enemy.kind === "boss" ? 16 : 8);
          statusLabel.textContent = "Vault breach";
          statusMeta.textContent = `${state.vault} integrity remaining`;
          if (state.vault <= 0) endGame("The vault got cracked");
          continue;
        }
      } else {
        enemy.x += (dx / dist) * speed * dt;
        enemy.y += (dy / dist) * speed * dt;
      }
    }
  }

  function targetFor(tower) {
    let best = null;
    let progress = -1;
    for (const enemy of enemies) {
      if (distance(tower.x, tower.y, enemy.x, enemy.y) > tower.range) continue;
      const enemyProgress = enemy.pathIndex * 1000 - distance(enemy.x, enemy.y, path[enemy.pathIndex]?.x || enemy.x, path[enemy.pathIndex]?.y || enemy.y);
      if (enemyProgress > progress) {
        best = enemy;
        progress = enemyProgress;
      }
    }
    return best;
  }

  function damageEnemy(enemy, damage, slow, splash) {
    enemy.hp -= damage;
    enemy.hitFlash = 1;
    floaters.push({
      x: enemy.x + (Math.random() - 0.5) * 18,
      y: enemy.y - enemy.radius - 10,
      text: String(Math.floor(damage)),
      color: slow ? "#9ee7ff" : splash ? "#ffd86b" : "#98ffd0",
      life: 0.42,
    });
    if (slow) enemy.slowTimer = Math.max(enemy.slowTimer, 1.6);
    if (splash) {
      bursts.push({ x: enemy.x, y: enemy.y, r: 0, max: splash, color: "#d8b45f", life: 0.32 });
      for (const other of enemies) {
        if (other !== enemy && distance(enemy.x, enemy.y, other.x, other.y) < splash) other.hp -= damage * 0.45;
      }
    }
  }

  function enemiesNear(x, y, range, exclude) {
    return enemies.filter((enemy) => enemy !== exclude && enemy.hp > 0 && distance(x, y, enemy.x, enemy.y) <= range);
  }

  function fireShot(tower, target) {
    const base = {
      x: tower.x,
      y: tower.y,
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
      tower.cooldown = Math.max(0, tower.cooldown - dt);
      if (tower.cooldown > 0) continue;
      const target = targetFor(tower);
      if (!target) continue;
      tower.cooldown = tower.rate / (1 + tower.level * 0.08);
      tower.attackPulse = 1;
      tower.aimAngle = Math.atan2(target.y - tower.y, target.x - tower.x);
      damageEnemy(target, tower.damage, tower.slow, tower.splash);
      applyMilestoneHit(tower, target);
      fireShot(tower, target);
    }

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      if (enemy.hp > 0) continue;
      enemies.splice(i, 1);
      state.score += 120 + enemy.reward * 12 + state.wave * 18;
      state.shards += enemy.reward;
      screenShake = Math.max(screenShake, enemy.kind === "boss" ? 18 : enemy.kind === "elite" ? 8 : 3);
      bursts.push({
        x: enemy.x,
        y: enemy.y,
        r: 0,
        max: enemy.kind === "boss" ? 88 : 38,
        color: enemy.kind === "boss" ? "#ffd86b" : enemy.kind === "elite" ? "#ff4d6d" : "#39ff9a",
        life: enemy.kind === "boss" ? 0.48 : 0.26,
        fill: true,
      });
      floaters.push({ x: enemy.x, y: enemy.y - 30, text: `+${enemy.reward}`, color: "#74ffc5", life: 0.7 });
    }
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
      target.slowTimer = Math.max(target.slowTimer, tower.level >= 5 ? 2.8 : 2.1);
      if (tower.level >= 5) {
        for (const enemy of enemiesNear(target.x, target.y, 62, target).slice(0, 4)) enemy.slowTimer = Math.max(enemy.slowTimer, 1.7);
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
      state.spawnTimer = clamp(0.75 - state.wave * 0.025, 0.35, 0.75);
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
      if (state.wave > 12) endGame("Vault defended");
    }
  }

  function updateEffects(dt) {
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
    updateTowers(dt);
    updateWave(dt);
    updateEffects(dt);
    updateHud();
  }

  function drawBackground() {
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
      ctx.strokeStyle = occupied ? "rgba(216, 180, 95, 0.8)" : hovered ? "rgba(116, 255, 197, 0.9)" : "rgba(116, 255, 197, 0.42)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, hovered ? 36 : 31, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
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
    ctx.fillText(isMax ? "LV 5 ultimate online" : `${cost} shards -> LV ${tower.level + 1}`, 0, 13);
    ctx.restore();
  }

  function drawTowers() {
    for (const tower of towers) {
      const sprite = tower.evolved ? evolvedTowerSprites[tower.type] : towerSprites[tower.type];
      const pulse = tower.attackPulse;
      const upgradePulse = tower.upgradePulse || 0;
      const evolvePulse = tower.evolvePulse || 0;
      const recoilX = Math.cos(tower.aimAngle) * -8 * pulse;
      const recoilY = Math.sin(tower.aimAngle) * -8 * pulse;
      ctx.save();
      ctx.translate(tower.x, tower.y);
      drawUpgradeAura(tower, Math.max(upgradePulse, evolvePulse));
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
      const scale = (tower.evolved ? 0.255 : 0.22) + tower.level * 0.012 + pulse * 0.025 + upgradePulse * 0.025 + evolvePulse * 0.05;
      if (sprite.complete) {
        ctx.shadowColor = tower.color;
        ctx.shadowBlur = 18 + pulse * 22;
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

      if (!tower.evolved) drawUpgradeDetails(tower, pulse, upgradePulse);
      else drawEvolvedCrown(tower, evolvePulse);

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
      ctx.fillText(`LV ${tower.level}`, 0, 44);
      ctx.restore();
    }
  }

  function drawEvolvedCrown(tower, evolvePulse) {
    ctx.save();
    ctx.globalAlpha = 0.72 + evolvePulse * 0.28;
    ctx.shadowColor = "#ffd86b";
    ctx.shadowBlur = 18 + evolvePulse * 34;
    ctx.strokeStyle = "#ffd86b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -8, 54 + evolvePulse * 20, 0, Math.PI * 2);
    ctx.stroke();
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

  function drawUpgradeAura(tower, upgradePulse) {
    if (tower.level <= 1 && upgradePulse <= 0) return;
    ctx.save();
    const rings = Math.min(3, tower.level - 1);
    for (let i = 0; i < rings; i += 1) {
      ctx.globalAlpha = 0.24 + upgradePulse * 0.35 - i * 0.04;
      ctx.strokeStyle = i % 2 ? "#d8b45f" : tower.color;
      ctx.lineWidth = 2 + i;
      ctx.beginPath();
      ctx.arc(0, 0, 34 + i * 9 + upgradePulse * 18, 0, Math.PI * 2);
      ctx.stroke();
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
      ctx.fillStyle = enemy.kind === "boss" ? "#f2b84b" : enemy.kind === "elite" ? "#ff4d6d" : enemy.kind === "runner" ? "#b25cff" : "#ff7a7a";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12 + enemy.hitFlash * 18;
      if (sprite.complete) {
        const size = enemy.kind === "boss" ? 112 : enemy.kind === "runner" ? 62 : enemy.kind === "elite" ? 66 : 54;
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
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
    ctx.save();
    ctx.translate(1185, 404);
    ctx.fillStyle = "rgba(2, 8, 6, 0.86)";
    ctx.strokeStyle = "rgba(216, 180, 95, 0.78)";
    ctx.lineWidth = 3;
    ctx.fillRect(-42, -52, 84, 104);
    ctx.strokeRect(-42, -52, 84, 104);
    ctx.fillStyle = "#39ff9a";
    ctx.shadowColor = "#39ff9a";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(18, 0);
    ctx.lineTo(0, 28);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();
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
    const dt = Math.min(0.033, (now - last) / 1000 || 0);
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
    if (event.key === "1") selectTower("pepe");
    if (event.key === "2") selectTower("shard");
    if (event.key === "3") selectTower("relic");
    if (event.key === "4") selectTower("mage");
    if (event.key === "5") selectTower("archer");
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
