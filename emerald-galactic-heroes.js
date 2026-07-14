const canvas = document.querySelector("#galaxyCanvas");
const ctx = canvas.getContext("2d");

const els = {
  startButton: document.querySelector("#startButton"),
  score: document.querySelector("#scoreLabel"),
  shields: document.querySelector("#shieldLabel"),
  armor: document.querySelector("#armorLabel"),
  wave: document.querySelector("#waveLabel"),
  rank: document.querySelector("#rankLabel"),
  weapon: document.querySelector("#weaponLabel"),
  allies: document.querySelector("#allyLabel"),
  overlay: document.querySelector("#galaxyOverlay"),
  overlayTitle: document.querySelector("#overlayTitle"),
  overlayText: document.querySelector("#overlayText"),
  runStats: document.querySelector("#runStats"),
};

const background = new Image();
background.src = "assets/emerald-galactic-heroes/space-background.png";

const sprites = new Image();
sprites.src = "assets/emerald-galactic-heroes/sprite-sheet.png";

const spriteMap = {
  hero: { sx: 0, sy: 96, sw: 374, sh: 560, dw: 1.18, dh: 1.58 },
  fighter: { sx: 360, sy: 140, sw: 250, sh: 500, dw: 1, dh: 1.5 },
  boss: { sx: 628, sy: 82, sw: 312, sh: 570, dw: 1.08, dh: 1.52 },
  meteor: { sx: 948, sy: 154, sw: 286, sh: 380, dw: 1.12, dh: 1 },
  heroLaser: { sx: 92, sy: 712, sw: 188, sh: 408, dw: 0.48, dh: 1.75 },
  enemyLaser: { sx: 440, sy: 716, sw: 112, sh: 376, dw: 0.55, dh: 1.85 },
  shield: { sx: 640, sy: 740, sw: 300, sh: 304, dw: 1, dh: 1 },
  bomb: { sx: 946, sy: 742, sw: 278, sh: 338, dw: 0.92, dh: 1.06 },
};

const keys = new Set();
const pointer = { active: false, x: canvas.width / 2, y: canvas.height - 105 };
const enemies = [];
const heroShots = [];
const enemyShots = [];
const pickups = [];
const particles = [];
const popups = [];

const state = {
  running: false,
  ended: false,
  score: 0,
  shieldCharge: 100,
  shieldCells: 3,
  wave: 1,
  weaponLevel: 1,
  kills: 0,
  bossKills: 0,
  pickupsCollected: 0,
  shieldCellsLost: 0,
  allyTimer: 0,
  wingmenDropCooldown: 0,
  pickupDropCooldown: 0,
  bossWarningShown: false,
  elapsed: 0,
  spawnTimer: 0,
  shotTimer: 0,
  bossSpawned: false,
  lastFrame: performance.now(),
  hero: { x: canvas.width / 2, y: canvas.height - 100, invuln: 0 },
};

function startGame() {
  window.EmeraldArcade?.beginSession("galaxy", "emerald-galactic-heroes.html");
  enemies.length = 0;
  heroShots.length = 0;
  enemyShots.length = 0;
  pickups.length = 0;
  particles.length = 0;
  Object.assign(state, {
    running: true,
    ended: false,
    score: 0,
    shieldCharge: 100,
    shieldCells: 3,
    wave: 1,
    weaponLevel: 1,
    kills: 0,
    bossKills: 0,
    pickupsCollected: 0,
    shieldCellsLost: 0,
    allyTimer: 0,
    wingmenDropCooldown: 0,
    pickupDropCooldown: 0,
    bossWarningShown: false,
    elapsed: 0,
    spawnTimer: 0,
    shotTimer: 0,
    bossSpawned: false,
    lastFrame: performance.now(),
  });
  Object.assign(state.hero, { x: canvas.width / 2, y: canvas.height - 100, invuln: 1.2 });
  els.overlay.classList.add("is-hidden");
  els.runStats.hidden = true;
  els.runStats.innerHTML = "";
  updateHud();
}

function endGame() {
  if (state.ended) return;
  state.ended = true;
  state.running = false;
  const rank = rankForScore(state.score, state.wave);
  els.overlayTitle.textContent = `${rank} Stand`;
  els.overlayText.textContent = `Final score: ${format(state.score)}. You held wave ${state.wave} against the Gas Empire.`;
  els.runStats.hidden = false;
  els.runStats.innerHTML = `
    <div><span>${format(state.score)}</span><small>score</small></div>
    <div><span>${state.wave}</span><small>wave held</small></div>
    <div><span>Mk ${roman(state.weaponLevel)}</span><small>weapon reached</small></div>
    <div><span>${state.kills}</span><small>ships cracked</small></div>
    <div><span>${state.bossKills}</span><small>bosses broken</small></div>
    <div><span>${state.pickupsCollected}</span><small>pickups used</small></div>
  `;
  els.overlay.classList.remove("is-hidden");
  window.EmeraldArcade?.recordAndNotify("galaxy", {
    score: state.score,
    rank,
    wave: state.wave,
    weapon: `Mk ${roman(state.weaponLevel)}`,
    played: true,
  });
  updateHud();
}

function spawnEnemy() {
  if (state.wave >= 3 && !state.bossSpawned) {
    notify("Boss Cruiser Incoming", canvas.width / 2, 118, "#d8b45f");
    enemies.push({ type: "boss", x: canvas.width / 2, y: -90, size: 150, hp: 34 + state.weaponLevel * 7, speed: 46, shotTimer: 1.2 });
    state.bossSpawned = true;
    return;
  }

  const isMeteor = Math.random() < 0.24;
  const hpScale = Math.max(0, state.weaponLevel - 1);
  enemies.push({
    type: isMeteor ? "meteor" : "fighter",
    x: 90 + Math.random() * (canvas.width - 180),
    y: -48,
    size: isMeteor ? 78 : 86,
    hp: isMeteor ? 3 + Math.floor(hpScale / 2) : 2 + Math.floor(state.wave / 2) + hpScale,
    speed: 90 + Math.random() * 70 + state.wave * 18,
    drift: (Math.random() - 0.5) * 55,
    shotTimer: 0.7 + Math.random() * 1.2,
  });
}

function update(delta) {
  if (!state.running) return;
  state.elapsed += delta;
  state.hero.invuln = Math.max(0, state.hero.invuln - delta);
  state.shieldCharge = Math.min(100, state.shieldCharge + delta * 4.5);
  state.allyTimer = Math.max(0, state.allyTimer - delta);
  state.wingmenDropCooldown = Math.max(0, state.wingmenDropCooldown - delta);
  state.pickupDropCooldown = Math.max(0, state.pickupDropCooldown - delta);

  state.wave = Math.min(5, 1 + Math.floor(state.elapsed / 24));
  updateWeaponLevel();
  state.spawnTimer -= delta;
  state.shotTimer -= delta;
  if (state.spawnTimer <= 0) {
    spawnEnemy();
    state.spawnTimer = Math.max(0.34, 1.08 - state.wave * 0.12);
  }
  if (state.shotTimer <= 0) {
    fireHeroShots();
    state.shotTimer = shotDelay();
  }

  moveHero(delta);
  updateShots(delta);
  updateEnemies(delta);
  updatePickups(delta);
  updateParticles(delta);
  updatePopups(delta);
  updateHud();
}

function moveHero(delta) {
  const speed = 560;
  if (keys.has("arrowleft") || keys.has("a")) state.hero.x -= speed * delta;
  if (keys.has("arrowright") || keys.has("d")) state.hero.x += speed * delta;
  if (keys.has("arrowup") || keys.has("w")) state.hero.y -= speed * delta;
  if (keys.has("arrowdown") || keys.has("s")) state.hero.y += speed * delta;
  if (pointer.active) {
    state.hero.x += (pointer.x - state.hero.x) * Math.min(1, delta * 10);
    state.hero.y += (pointer.y - state.hero.y) * Math.min(1, delta * 10);
  }
  state.hero.x = clamp(state.hero.x, 70, canvas.width - 70);
  state.hero.y = clamp(state.hero.y, canvas.height * 0.45, canvas.height - 70);
}

function updateShots(delta) {
  for (let i = heroShots.length - 1; i >= 0; i -= 1) {
    const shot = heroShots[i];
    shot.y -= shot.speed * delta;
    if (shot.y < -70) heroShots.splice(i, 1);
  }

  for (let i = enemyShots.length - 1; i >= 0; i -= 1) {
    const shot = enemyShots[i];
    shot.y += shot.speed * delta;
    if (distance(shot, state.hero) < 42) {
      hitShield();
      enemyShots.splice(i, 1);
    } else if (shot.y > canvas.height + 70) {
      enemyShots.splice(i, 1);
    }
  }
}

function updateEnemies(delta) {
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const enemy = enemies[i];
    enemy.y += enemy.speed * delta;
    enemy.x += (enemy.drift || 0) * delta;
    enemy.shotTimer -= delta;

    if (enemy.type !== "meteor" && enemy.shotTimer <= 0) {
      enemyShots.push({ x: enemy.x, y: enemy.y + enemy.size * 0.28, speed: enemy.type === "boss" ? 250 : 330, size: enemy.type === "boss" ? 52 : 44 });
      enemy.shotTimer = enemy.type === "boss" ? 0.55 : 1.5;
    }

    for (let j = heroShots.length - 1; j >= 0; j -= 1) {
      const shot = heroShots[j];
      if (distance(shot, enemy) < enemy.size * 0.36) {
        enemy.hp -= 1;
        heroShots.splice(j, 1);
        burst(enemy.x, enemy.y, "#23f09c", 4);
        if (enemy.hp <= 0) {
          destroyEnemy(enemy);
          enemies.splice(i, 1);
        }
        break;
      }
    }

    if (enemies[i] && distance(enemy, state.hero) < enemy.size * 0.45) {
      hitShip(enemy.type);
      if (enemy.type !== "boss") enemies.splice(i, 1);
    } else if (enemy.y > canvas.height + 110) {
      if (enemy.type === "boss") state.bossSpawned = false;
      enemies.splice(i, 1);
    }
  }
}

function destroyEnemy(enemy) {
  const boss = enemy.type === "boss";
  state.kills += 1;
  if (boss) state.bossKills += 1;
  state.score += boss ? 9000 : enemy.type === "meteor" ? 450 : 850;
  burst(enemy.x, enemy.y, boss ? "#d8b45f" : "#74ffc5", boss ? 22 : 10);
  maybeDropPickup(enemy);
  if (boss) {
    state.bossSpawned = false;
    state.wave = Math.min(5, state.wave + 1);
  }
}

function updatePickups(delta) {
  for (let i = pickups.length - 1; i >= 0; i -= 1) {
    const pickup = pickups[i];
    pickup.y += pickup.speed * delta;
    if (distance(pickup, state.hero) < 58) {
      state.pickupsCollected += 1;
      if (pickup.type === "shield") {
        state.shieldCharge = 100;
        state.shieldCells = Math.min(5, state.shieldCells + 1);
        notify("Shield Cell", pickup.x, pickup.y, "#8edcff");
      }
      if (pickup.type === "bomb") {
        state.score += enemies.length * 500;
        for (const enemy of enemies) burst(enemy.x, enemy.y, "#d8b45f", 8);
        state.bossSpawned = false;
        enemies.length = 0;
        enemyShots.length = 0;
        notify("Shard Bomb", pickup.x, pickup.y, "#d8b45f");
      }
      if (pickup.type === "wingmen") {
        state.allyTimer = 30;
        burst(state.hero.x, state.hero.y, "#74ffc5", 18);
        notify("Wingmen +30s", pickup.x, pickup.y, "#74ffc5");
      }
      pickups.splice(i, 1);
    } else if (pickup.y > canvas.height + 70) {
      pickups.splice(i, 1);
    }
  }
}

function updateParticles(delta) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.life -= delta;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function hitShield() {
  if (state.hero.invuln > 0) return;
  state.shieldCharge = Math.max(0, state.shieldCharge - 14);
  state.hero.invuln = 0.25;
  burst(state.hero.x, state.hero.y, "#8edcff", 8);
  notify("-14% shield", state.hero.x, state.hero.y - 76, "#8edcff");
  if (state.shieldCharge <= 0) breakShieldCell();
}

function hitShip(type) {
  if (state.hero.invuln > 0) return;
  const cellsLost = type === "boss" ? 2 : 1;
  state.shieldCells -= cellsLost;
  state.shieldCellsLost += cellsLost;
  state.shieldCharge = Math.max(0, state.shieldCharge - 28);
  state.hero.invuln = 1.2;
  burst(state.hero.x, state.hero.y, "#ff5975", 14);
  notify("Shield Cell Hit", state.hero.x, state.hero.y - 82, "#ff5975");
  if (state.shieldCells <= 0) endGame();
}

function breakShieldCell() {
  state.shieldCells -= 1;
  state.shieldCellsLost += 1;
  state.shieldCharge = state.shieldCells > 0 ? 45 : 0;
  state.hero.invuln = 1;
  burst(state.hero.x, state.hero.y, "#ffcc7a", 18);
  notify("Cell Broken", state.hero.x, state.hero.y - 92, "#ffcc7a");
  if (state.shieldCells <= 0) endGame();
}

function fireHeroShots() {
  const level = state.weaponLevel;
  const baseY = state.hero.y - 58;
  const patterns = {
    1: [0],
    2: [-18, 18],
    3: [-34, 0, 34],
    4: [-48, -16, 16, 48],
  };
  for (const offset of patterns[level]) {
    heroShots.push({ x: state.hero.x + offset, y: baseY, speed: 760 + level * 18, size: 46 });
  }
  if (state.allyTimer > 0) {
    const allyOffsets = [-108, 108];
    for (const offset of allyOffsets) {
      heroShots.push({ x: state.hero.x + offset, y: state.hero.y - 24, speed: 720, size: 38 });
    }
  }
}

function shotDelay() {
  if (state.weaponLevel >= 4) return 0.1;
  if (state.weaponLevel === 3) return 0.12;
  if (state.weaponLevel === 2) return 0.14;
  return 0.16;
}

function updateWeaponLevel() {
  let nextLevel = 1;
  if (state.wave >= 2 || state.score >= 5000) nextLevel = 2;
  if (state.wave >= 3 || state.score >= 16000) nextLevel = 3;
  if (state.wave >= 4 || state.score >= 36000) nextLevel = 4;
  if (nextLevel > state.weaponLevel) {
    state.weaponLevel = nextLevel;
    notify(`Weapon Mk ${roman(state.weaponLevel)}`, state.hero.x, state.hero.y - 110, "#74ffc5");
    burst(state.hero.x, state.hero.y, "#74ffc5", 24);
  }
}

function maybeDropPickup(enemy) {
  const boss = enemy.type === "boss";
  if (!boss && (state.pickupDropCooldown > 0 || pickups.length >= 2)) return;
  const wingmenAvailable = state.allyTimer <= 0 && state.wingmenDropCooldown <= 0;
  const wingmenChance = [0, 0.1, 0.055, 0.032, 0.018][state.weaponLevel] || 0.018;
  const utilityChance = [0, 0.12, 0.09, 0.07, 0.055][state.weaponLevel] || 0.055;
  let type = null;
  if (boss) {
    type = wingmenAvailable && Math.random() < 0.18 ? "wingmen" : Math.random() < 0.58 ? "bomb" : "shield";
  } else if (enemy.type === "fighter" && wingmenAvailable && Math.random() < wingmenChance) {
    type = "wingmen";
  } else if (enemy.y > 90 && Math.random() < utilityChance) {
    type = Math.random() < 0.5 ? "shield" : "bomb";
  }
  if (!type) return;
  if (type === "wingmen") state.wingmenDropCooldown = 22;
  state.pickupDropCooldown = type === "wingmen" ? 8 : 4.5;
  pickups.push({
    type,
    x: enemy.x,
    y: clamp(enemy.y, 150, canvas.height - 190),
    size: type === "wingmen" ? 62 : 56,
    speed: type === "wingmen" ? 118 : 132,
  });
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      color,
      vx: (Math.random() - 0.5) * 260,
      vy: (Math.random() - 0.5) * 260,
      life: 0.35 + Math.random() * 0.45,
    });
  }
}

function notify(text, x, y, color) {
  popups.push({ text, x, y, color, life: 1.25, vy: -42 });
}

function updatePopups(delta) {
  for (let i = popups.length - 1; i >= 0; i -= 1) {
    const popup = popups[i];
    popup.y += popup.vy * delta;
    popup.life -= delta;
    if (popup.life <= 0) popups.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCover(background, 0, 0, canvas.width, canvas.height);
  drawStars();

  for (const shot of heroShots) drawSprite("heroLaser", shot.x, shot.y, shot.size, 0);
  for (const shot of enemyShots) drawEnemyShot(shot);
  for (const pickup of pickups) drawPickup(pickup);
  for (const enemy of enemies) drawSprite(enemy.type, enemy.x, enemy.y, enemy.size, Math.PI);
  drawWingmen();

  ctx.save();
  if (state.hero.invuln > 0) ctx.globalAlpha = 0.58 + Math.sin(performance.now() * 0.02) * 0.25;
  drawSprite("hero", state.hero.x, state.hero.y, 112, 0);
  ctx.restore();

  drawParticles();
  drawPopups();
}

function drawPickup(pickup) {
  if (pickup.type !== "wingmen") {
    drawSprite(pickup.type, pickup.x, pickup.y, pickup.size, 0);
    return;
  }
  ctx.save();
  const glow = ctx.createRadialGradient(pickup.x, pickup.y, 4, pickup.x, pickup.y, pickup.size * 0.7);
  glow.addColorStop(0, "rgba(116, 255, 197, 0.44)");
  glow.addColorStop(1, "rgba(116, 255, 197, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(pickup.x, pickup.y, pickup.size * 0.66, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawSprite("hero", pickup.x - 16, pickup.y + 5, 28, 0);
  drawSprite("hero", pickup.x + 16, pickup.y + 5, 28, 0);
}

function drawWingmen() {
  if (state.allyTimer <= 0) return;
  const pulse = 0.78 + Math.sin(performance.now() * 0.008) * 0.08;
  ctx.save();
  ctx.globalAlpha = pulse;
  drawSprite("hero", state.hero.x - 108, state.hero.y + 22, 58, 0);
  drawSprite("hero", state.hero.x + 108, state.hero.y + 22, 58, 0);
  ctx.restore();
}

function drawCover(img, x, y, w, h) {
  if (!img.complete || img.naturalWidth === 0) return;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawStars() {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#74ffc5";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    const x = ((i * 173 + state.elapsed * 24) % canvas.width);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 60, canvas.height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSprite(type, x, y, size, rotation) {
  if (!sprites.complete || sprites.naturalWidth === 0) return;
  const sprite = spriteMap[type];
  if (!sprite) return;
  const dw = size * (sprite.dw || 1);
  const dh = size * (sprite.dh || 1);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(sprites, sprite.sx, sprite.sy, sprite.sw, sprite.sh, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function drawEnemyShot(shot) {
  ctx.save();
  const glow = ctx.createRadialGradient(shot.x, shot.y, 4, shot.x, shot.y, shot.size * 0.68);
  glow.addColorStop(0, "rgba(220, 190, 255, 0.92)");
  glow.addColorStop(0.45, "rgba(121, 73, 255, 0.44)");
  glow.addColorStop(1, "rgba(121, 73, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(shot.x, shot.y, shot.size * 0.42, shot.size * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawSprite("enemyLaser", shot.x, shot.y, shot.size, Math.PI);
}

function drawAssetGuide() {
  if (!sprites.complete || sprites.naturalWidth === 0) return;
  document.querySelectorAll("[data-sprite]").forEach((preview) => {
    const previewCtx = preview.getContext("2d");
    const type = preview.dataset.sprite;
    const size = type === "hero" || type === "boss" ? 54 : type === "fighter" ? 48 : 58;
    previewCtx.clearRect(0, 0, preview.width, preview.height);
    previewCtx.save();
    previewCtx.translate(preview.width / 2, preview.height / 2);
    if (type === "wingmen") {
      drawSpriteToContext(previewCtx, "hero", -18, 3, 28, 0);
      drawSpriteToContext(previewCtx, "hero", 18, 3, 28, 0);
    } else {
      drawSpriteToContext(previewCtx, type, 0, 0, size, type === "fighter" || type === "boss" ? Math.PI : 0);
    }
    previewCtx.restore();
  });
}

function drawSpriteToContext(targetCtx, type, x, y, size, rotation) {
  const sprite = spriteMap[type];
  if (!sprite) return;
  const dw = size * (sprite.dw || 1);
  const dh = size * (sprite.dh || 1);
  targetCtx.save();
  targetCtx.translate(x, y);
  targetCtx.rotate(rotation);
  targetCtx.drawImage(sprites, sprite.sx, sprite.sy, sprite.sw, sprite.sh, -dw / 2, -dh / 2, dw, dh);
  targetCtx.restore();
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPopups() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "900 28px Inter, system-ui, sans-serif";
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 10;
  for (const popup of popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, popup.life));
    ctx.fillStyle = popup.color;
    ctx.fillText(popup.text, popup.x, popup.y);
  }
  ctx.restore();
}

function rankForScore(score, wave) {
  if (score >= 70000 || wave >= 5) return "Emerald Ace";
  if (score >= 42000) return "Gasbreaker";
  if (score >= 22000) return "Star Guard";
  if (score >= 9000) return "Crystal Pilot";
  return "Cadet";
}

function updateHud() {
  els.score.textContent = format(state.score);
  els.shields.textContent = `${Math.round(state.shieldCharge)}%`;
  els.armor.textContent = state.shieldCells;
  els.wave.textContent = state.wave;
  els.rank.textContent = rankForScore(state.score, state.wave);
  els.weapon.textContent = `Mk ${roman(state.weaponLevel)}`;
  els.allies.textContent = state.allyTimer > 0 ? `${Math.ceil(state.allyTimer)}s` : "0s";
}

function loop(now) {
  const delta = Math.min(0.033, (now - state.lastFrame) / 1000);
  state.lastFrame = now;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function format(value) {
  if (value < 1000) return Math.round(value).toLocaleString();
  if (value < 1000000) return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}K`;
  return `${(value / 1000000).toFixed(1)}M`;
}

function roman(value) {
  return ["I", "II", "III", "IV"][value - 1] || "I";
}

els.startButton.addEventListener("click", startGame);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if (event.key === " ") {
    event.preventDefault();
    if (!state.running) startGame();
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

canvas.addEventListener("pointerdown", (event) => {
  pointer.active = true;
  Object.assign(pointer, canvasPoint(event));
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (pointer.active) Object.assign(pointer, canvasPoint(event));
});

canvas.addEventListener("pointerup", () => {
  pointer.active = false;
});

background.addEventListener("load", draw);
sprites.addEventListener("load", () => {
  draw();
  drawAssetGuide();
});
if (sprites.complete) drawAssetGuide();
updateHud();
requestAnimationFrame(loop);
