const canvas = document.querySelector("#galaxyCanvas");
const ctx = canvas.getContext("2d");

const els = {
  startButton: document.querySelector("#startButton"),
  score: document.querySelector("#scoreLabel"),
  shields: document.querySelector("#shieldLabel"),
  armor: document.querySelector("#armorLabel"),
  wave: document.querySelector("#waveLabel"),
  rank: document.querySelector("#rankLabel"),
  overlay: document.querySelector("#galaxyOverlay"),
  overlayTitle: document.querySelector("#overlayTitle"),
  overlayText: document.querySelector("#overlayText"),
};

const background = new Image();
background.src = "assets/emerald-galactic-heroes/space-background.png";

const sprites = new Image();
sprites.src = "assets/emerald-galactic-heroes/sprite-sheet.png";

const spriteMap = {
  hero: { col: 0, row: 0 },
  fighter: { col: 1, row: 0 },
  boss: { col: 2, row: 0 },
  meteor: { col: 3, row: 0 },
  heroLaser: { col: 0, row: 1 },
  enemyLaser: { col: 1, row: 1 },
  shield: { col: 2, row: 1 },
  bomb: { col: 3, row: 1 },
};

const keys = new Set();
const pointer = { active: false, x: canvas.width / 2, y: canvas.height - 105 };
const enemies = [];
const heroShots = [];
const enemyShots = [];
const pickups = [];
const particles = [];

const state = {
  running: false,
  score: 0,
  shieldCharge: 100,
  shieldCells: 3,
  wave: 1,
  elapsed: 0,
  spawnTimer: 0,
  shotTimer: 0,
  bossSpawned: false,
  lastFrame: performance.now(),
  hero: { x: canvas.width / 2, y: canvas.height - 100, invuln: 0 },
};

function startGame() {
  enemies.length = 0;
  heroShots.length = 0;
  enemyShots.length = 0;
  pickups.length = 0;
  particles.length = 0;
  Object.assign(state, {
    running: true,
    score: 0,
    shieldCharge: 100,
    shieldCells: 3,
    wave: 1,
    elapsed: 0,
    spawnTimer: 0,
    shotTimer: 0,
    bossSpawned: false,
    lastFrame: performance.now(),
  });
  Object.assign(state.hero, { x: canvas.width / 2, y: canvas.height - 100, invuln: 1.2 });
  els.overlay.classList.add("is-hidden");
  updateHud();
}

function endGame() {
  state.running = false;
  const rank = rankForScore(state.score, state.wave);
  els.overlayTitle.textContent = `${rank} Stand`;
  els.overlayText.textContent = `Final score: ${format(state.score)}. You held wave ${state.wave} against the Gas Empire.`;
  els.overlay.classList.remove("is-hidden");
  updateHud();
}

function spawnEnemy() {
  if (state.wave >= 3 && !state.bossSpawned) {
    enemies.push({ type: "boss", x: canvas.width / 2, y: -110, size: 150, hp: 34, speed: 46, shotTimer: 1.2 });
    state.bossSpawned = true;
    return;
  }

  const isMeteor = Math.random() < 0.24;
  enemies.push({
    type: isMeteor ? "meteor" : "fighter",
    x: 90 + Math.random() * (canvas.width - 180),
    y: -80,
    size: isMeteor ? 78 : 86,
    hp: isMeteor ? 3 : 2 + Math.floor(state.wave / 2),
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

  state.wave = Math.min(5, 1 + Math.floor(state.elapsed / 24));
  state.spawnTimer -= delta;
  state.shotTimer -= delta;
  if (state.spawnTimer <= 0) {
    spawnEnemy();
    state.spawnTimer = Math.max(0.34, 1.08 - state.wave * 0.12);
  }
  if (state.shotTimer <= 0) {
    heroShots.push({ x: state.hero.x, y: state.hero.y - 58, speed: 760, size: 46 });
    state.shotTimer = 0.16;
  }

  moveHero(delta);
  updateShots(delta);
  updateEnemies(delta);
  updatePickups(delta);
  updateParticles(delta);
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
      enemyShots.push({ x: enemy.x, y: enemy.y + enemy.size * 0.28, speed: enemy.type === "boss" ? 250 : 330, size: 38 });
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
  state.score += boss ? 9000 : enemy.type === "meteor" ? 450 : 850;
  burst(enemy.x, enemy.y, boss ? "#d8b45f" : "#74ffc5", boss ? 22 : 10);
  if (Math.random() < (boss ? 1 : 0.18)) {
    pickups.push({
      type: Math.random() < 0.5 ? "shield" : "bomb",
      x: enemy.x,
      y: enemy.y,
      size: 56,
      speed: 150,
    });
  }
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
      if (pickup.type === "shield") {
        state.shieldCharge = 100;
        state.shieldCells = Math.min(5, state.shieldCells + 1);
      }
      if (pickup.type === "bomb") {
        state.score += enemies.length * 500;
        for (const enemy of enemies) burst(enemy.x, enemy.y, "#d8b45f", 8);
        state.bossSpawned = false;
        enemies.length = 0;
        enemyShots.length = 0;
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
}

function hitShip(type) {
  if (state.hero.invuln > 0) return;
  state.shieldCells -= type === "boss" ? 2 : 1;
  state.shieldCharge = Math.max(0, state.shieldCharge - 28);
  state.hero.invuln = 1.2;
  burst(state.hero.x, state.hero.y, "#ff5975", 14);
  if (state.shieldCells <= 0) endGame();
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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCover(background, 0, 0, canvas.width, canvas.height);
  drawStars();

  for (const shot of heroShots) drawSprite("heroLaser", shot.x, shot.y, shot.size, 0);
  for (const shot of enemyShots) drawSprite("enemyLaser", shot.x, shot.y, shot.size, Math.PI);
  for (const pickup of pickups) drawSprite(pickup.type, pickup.x, pickup.y, pickup.size, 0);
  for (const enemy of enemies) drawSprite(enemy.type, enemy.x, enemy.y, enemy.size, Math.PI);

  ctx.save();
  if (state.hero.invuln > 0) ctx.globalAlpha = 0.58 + Math.sin(performance.now() * 0.02) * 0.25;
  drawSprite("hero", state.hero.x, state.hero.y, 112, 0);
  ctx.restore();

  drawParticles();
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
  const cellW = sprites.naturalWidth / 4;
  const cellH = sprites.naturalHeight / 2;
  const sprite = spriteMap[type];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(sprites, sprite.col * cellW, sprite.row * cellH, cellW, cellH, -size / 2, -size / 2, size, size);
  ctx.restore();
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
sprites.addEventListener("load", draw);
updateHud();
requestAnimationFrame(loop);
