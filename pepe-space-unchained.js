const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  score: document.querySelector("#scoreLabel"),
  shards: document.querySelector("#shardLabel"),
  wave: document.querySelector("#waveLabel"),
  shield: document.querySelector("#shieldLabel"),
  best: document.querySelector("#bestLabel"),
  pill: document.querySelector("#missionPill"),
  mission: document.querySelector("#missionLabel"),
  meta: document.querySelector("#missionMeta"),
  overlay: document.querySelector("#gameOverlay"),
  title: document.querySelector("#overlayTitle"),
  text: document.querySelector("#overlayText"),
  start: document.querySelector("#startButton"),
  sound: document.querySelector("#soundToggle"),
};

const W = canvas.width;
const H = canvas.height;
const STORAGE_KEY = "pepe-space-unchained-best-v1";
const keys = new Set();
const bullets = [];
const enemyBullets = [];
const enemies = [];
const shards = [];
const particles = [];
const stars = Array.from({ length: 120 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  r: Math.random() * 1.8 + 0.4,
  s: Math.random() * 90 + 25,
}));

const art = {
  bg: new Image(),
  ship: new Image(),
  enemy: new Image(),
};
art.bg.src = "assets/pepe-space-unchained/space-bg.jpg";
art.ship.src = "assets/pepe-space-unchained/pepe-ship.png";
art.enemy.src = "assets/pepe-space-unchained/corrupt-ship.png";

const player = {
  x: 190,
  y: H / 2,
  vx: 0,
  vy: 0,
  shield: 100,
  invuln: 0,
  fireClock: 0,
  burstClock: 0,
};

const state = {
  mode: "ready",
  elapsed: 0,
  score: 0,
  shards: 0,
  wave: 1,
  kills: 0,
  best: Number(localStorage.getItem(STORAGE_KEY) || 0),
  spawnClock: 0,
  waveClock: 0,
  shake: 0,
  flash: 0,
  boss: null,
  sound: true,
  lastFrame: performance.now(),
};

let audioContext;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function format(value) {
  if (value < 1000) return Math.floor(value).toLocaleString();
  return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}K`;
}

function tone(freq, duration = 0.08, type = "sine", gain = 0.03) {
  if (!state.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const amp = audioContext.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, audioContext.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    osc.connect(amp).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch {
    state.sound = false;
  }
}

function startGame() {
  Object.assign(state, {
    mode: "playing",
    elapsed: 0,
    score: 0,
    shards: 0,
    wave: 1,
    kills: 0,
    spawnClock: 0.2,
    waveClock: 0,
    shake: 0,
    flash: 0,
    boss: null,
    lastFrame: performance.now(),
  });
  Object.assign(player, { x: 190, y: H / 2, vx: 0, vy: 0, shield: 100, invuln: 0, fireClock: 0, burstClock: 0 });
  bullets.length = 0;
  enemyBullets.length = 0;
  enemies.length = 0;
  shards.length = 0;
  particles.length = 0;
  ui.overlay.classList.add("is-hidden");
  tone(360, 0.08, "triangle");
  updateHud();
}

function fire() {
  bullets.push({ x: player.x + 154, y: player.y - 25, vx: 820, vy: -24, life: 1.1, damage: 1 });
  bullets.push({ x: player.x + 154, y: player.y + 25, vx: 820, vy: 24, life: 1.1, damage: 1 });
  tone(720, 0.03, "square", 0.012);
}

function burstShot() {
  if (player.burstClock > 0 || state.shards < 5) return;
  state.shards -= 5;
  player.burstClock = 2.2;
  for (let i = -2; i <= 2; i += 1) {
    bullets.push({ x: player.x + 118, y: player.y, vx: 900, vy: i * 105, life: 1, damage: 2 });
  }
  burst(player.x + 90, player.y, "#d8b45f", 18);
  tone(240, 0.08, "sawtooth", 0.02);
}

function spawnEnemy() {
  const bossSoon = state.kills > 0 && state.kills % 16 === 0 && !state.boss;
  if (bossSoon) {
    state.boss = { x: W + 160, y: H / 2, hp: 34 + state.wave * 5, maxHp: 34 + state.wave * 5, shoot: 0.8, t: 0, boss: true };
    enemies.push(state.boss);
    state.wave += 1;
    state.flash = 0.8;
    tone(140, 0.2, "sawtooth", 0.025);
    return;
  }
  const y = 95 + Math.random() * (H - 190);
  enemies.push({
    x: W + 90,
    y,
    hp: 3 + Math.floor(state.wave / 2),
    maxHp: 3 + Math.floor(state.wave / 2),
    speed: 120 + Math.random() * 85 + state.wave * 9,
    amp: Math.random() * 42 + 20,
    t: Math.random() * 6,
    shoot: 0.9 + Math.random() * 1.4,
    boss: false,
  });
}

function update(dt) {
  if (state.mode !== "playing") return;
  state.elapsed += dt;
  state.score += dt * (12 + state.wave * 2);
  state.shake = Math.max(0, state.shake - dt * 18);
  state.flash = Math.max(0, state.flash - dt * 2.8);
  player.invuln = Math.max(0, player.invuln - dt);
  player.burstClock = Math.max(0, player.burstClock - dt);

  const ax = (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
  const ay = (keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0);
  player.vx += ax * 2100 * dt;
  player.vy += ay * 2100 * dt;
  player.vx *= 0.84;
  player.vy *= 0.84;
  player.x = clamp(player.x + player.vx * dt, 80, W * 0.55);
  player.y = clamp(player.y + player.vy * dt, 100, H - 100);

  player.fireClock -= dt;
  if (player.fireClock <= 0) {
    fire();
    player.fireClock = Math.max(0.09, 0.18 - state.wave * 0.006);
  }

  state.spawnClock -= dt;
  if (state.spawnClock <= 0) {
    spawnEnemy();
    state.spawnClock = Math.max(0.36, 1.05 - state.wave * 0.05) + Math.random() * 0.35;
  }

  updateBullets(dt);
  updateEnemies(dt);
  updateShards(dt);
  updateParticles(dt);
  updateHud();
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x > W + 80 || b.y < -60 || b.y > H + 60) bullets.splice(i, 1);
  }
  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const b = enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (distance(b.x, b.y, player.x + 30, player.y) < 48 && player.invuln <= 0) {
      enemyBullets.splice(i, 1);
      damagePlayer(10);
      continue;
    }
    if (b.life <= 0 || b.x < -80 || b.y < -80 || b.y > H + 80) enemyBullets.splice(i, 1);
  }
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    e.t += dt;
    if (e.boss) {
      e.x += (W - 180 - e.x) * dt * 0.9;
      e.y = H / 2 + Math.sin(e.t * 1.8) * 135;
    } else {
      e.x -= e.speed * dt;
      e.y += Math.sin(e.t * 3) * e.amp * dt;
    }
    e.shoot -= dt;
    if (e.shoot <= 0) {
      shootEnemy(e);
      e.shoot = e.boss ? 0.45 : 1.2 + Math.random() * 1.3;
    }
    if (distance(e.x, e.y, player.x + 28, player.y) < (e.boss ? 110 : 64) && player.invuln <= 0) {
      damagePlayer(e.boss ? 24 : 18);
    }
    for (let j = bullets.length - 1; j >= 0; j -= 1) {
      const b = bullets[j];
      if (distance(b.x, b.y, e.x, e.y) < (e.boss ? 80 : 48)) {
        bullets.splice(j, 1);
        e.hp -= b.damage;
        burst(b.x, b.y, "#74ffc5", 5);
        if (e.hp <= 0) {
          killEnemy(e);
          enemies.splice(i, 1);
        }
        break;
      }
    }
    if (e.x < -120) enemies.splice(i, 1);
  }
}

function shootEnemy(e) {
  const angle = Math.atan2(player.y - e.y, player.x - e.x);
  const speed = e.boss ? 260 : 230;
  enemyBullets.push({ x: e.x - 54, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 3 });
  if (e.boss) {
    enemyBullets.push({ x: e.x - 54, y: e.y - 34, vx: -280, vy: -90, life: 3 });
    enemyBullets.push({ x: e.x - 54, y: e.y + 34, vx: -280, vy: 90, life: 3 });
  }
}

function killEnemy(e) {
  state.kills += 1;
  state.score += e.boss ? 1400 : 180 + state.wave * 15;
  if (e.boss) {
    state.boss = null;
    state.score += 900;
    state.shards += 10;
    state.flash = 0.8;
  }
  burst(e.x, e.y, e.boss ? "#d8b45f" : "#ff4f70", e.boss ? 42 : 18);
  for (let i = 0; i < (e.boss ? 10 : 2 + Math.floor(Math.random() * 3)); i += 1) {
    shards.push({ x: e.x + Math.random() * 60 - 30, y: e.y + Math.random() * 50 - 25, vx: -120 - Math.random() * 80, spin: Math.random() * 6 });
  }
  tone(e.boss ? 180 : 520, e.boss ? 0.18 : 0.05, e.boss ? "sawtooth" : "triangle", 0.022);
}

function updateShards(dt) {
  for (let i = shards.length - 1; i >= 0; i -= 1) {
    const s = shards[i];
    s.x += s.vx * dt;
    s.spin += dt * 5;
    if (distance(s.x, s.y, player.x, player.y) < 72) {
      state.shards += 1;
      state.score += 80;
      burst(s.x, s.y, "#d8b45f", 8);
      shards.splice(i, 1);
      continue;
    }
    if (s.x < -80) shards.splice(i, 1);
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function damagePlayer(amount) {
  player.shield -= amount;
  player.invuln = 0.75;
  state.shake = 12;
  state.flash = 0.5;
  burst(player.x, player.y, "#ff4f70", 24);
  tone(120, 0.16, "sawtooth", 0.035);
  if (player.shield <= 0) endGame();
}

function endGame() {
  state.mode = "gameover";
  const finalScore = Math.floor(state.score);
  state.best = Math.max(state.best, finalScore);
  localStorage.setItem(STORAGE_KEY, state.best);
  const rank = rankFor(finalScore, state.wave);
  window.EmeraldArcade?.recordAndNotify("spaceUnchained", {
    score: finalScore,
    rank,
    wave: state.wave,
    shards: state.shards,
    kills: state.kills,
    played: true,
  });
  window.setTimeout(() => {
    ui.title.textContent = `${rank} Flight`;
    ui.text.textContent = `${finalScore.toLocaleString()} points - Wave ${state.wave} - ${state.shards} shards - ${state.kills} corrupt ships unchained.`;
    ui.start.textContent = "Launch Again";
    ui.overlay.classList.remove("is-hidden");
  }, 500);
}

function rankFor(score, wave) {
  if (wave >= 7 || score >= 18000) return "Chainbreaker Ace";
  if (wave >= 5 || score >= 11000) return "Vault Starfighter";
  if (wave >= 3 || score >= 6200) return "Emerald Wing";
  if (score >= 2600) return "Space Runner";
  return "Fresh Pilot";
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 260;
    particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.25 + Math.random() * 0.45, color, size: 2 + Math.random() * 4 });
  }
}

function draw() {
  const shakeX = state.shake ? (Math.random() - 0.5) * state.shake : 0;
  const shakeY = state.shake ? (Math.random() - 0.5) * state.shake : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawBackground();
  drawBullets();
  drawShards();
  drawEnemies();
  drawPlayer();
  drawParticles();
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(116, 255, 197, ${state.flash * 0.1})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function drawBackground() {
  if (art.bg.complete && art.bg.naturalWidth) {
    const scroll = (state.elapsed * 24) % (W * 2);
    const offset = -scroll;
    drawBackgroundTile(offset, false);
    drawBackgroundTile(offset + W, true);
    drawBackgroundTile(offset + W * 2, false);
  } else {
    ctx.fillStyle = "#020806";
    ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, 0, W, H);
  stars.forEach((s) => {
    s.x -= s.s / 60;
    if (s.x < -5) {
      s.x = W + 5;
      s.y = Math.random() * H;
    }
    ctx.fillStyle = "rgba(186,255,221,0.75)";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBackgroundTile(x, mirrored) {
  ctx.save();
  if (mirrored) {
    ctx.translate(x + W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(art.bg, 0, 0, W, H);
  } else {
    ctx.drawImage(art.bg, x, 0, W, H);
  }
  ctx.restore();
}

function drawPlayer() {
  const blink = player.invuln > 0 && Math.floor(performance.now() / 80) % 2 === 0;
  if (blink) return;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(clamp(player.vy / 1200, -0.18, 0.18));
  ctx.shadowColor = "#74ffc5";
  ctx.shadowBlur = 18;
  if (art.ship.complete && art.ship.naturalWidth) {
    ctx.drawImage(art.ship, -132, -66, 264, 132);
  } else {
    ctx.fillStyle = "#74ffc5";
    ctx.beginPath();
    ctx.moveTo(78, 0);
    ctx.lineTo(-50, -34);
    ctx.lineTo(-28, 0);
    ctx.lineTo(-50, 34);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(116,255,197,0.25)";
  ctx.beginPath();
  ctx.ellipse(player.x - 98, player.y, 82, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemies() {
  enemies.forEach((e) => {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(-Math.PI / 2);
    ctx.shadowColor = e.boss ? "#d8b45f" : "#ff4f70";
    ctx.shadowBlur = e.boss ? 22 : 14;
    const w = e.boss ? 190 : 104;
    const h = e.boss ? 190 : 104;
    if (art.enemy.complete && art.enemy.naturalWidth) ctx.drawImage(art.enemy, -w / 2, -h / 2, w, h);
    else {
      ctx.fillStyle = "#ff4f70";
      ctx.fillRect(-36, -28, 72, 56);
    }
    ctx.restore();
    if (e.boss) {
      ctx.fillStyle = "rgba(0,0,0,0.58)";
      ctx.fillRect(W - 330, 78, 260, 10);
      ctx.fillStyle = "#d8b45f";
      ctx.fillRect(W - 330, 78, 260 * clamp(e.hp / e.maxHp, 0, 1), 10);
    }
  });
}

function drawBullets() {
  bullets.forEach((b) => {
    ctx.fillStyle = "#74ffc5";
    ctx.shadowColor = "#74ffc5";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  enemyBullets.forEach((b) => {
    ctx.fillStyle = "#ff4f70";
    ctx.shadowColor = "#ff4f70";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawShards() {
  shards.forEach((s) => {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin);
    ctx.fillStyle = "#d8b45f";
    ctx.strokeStyle = "rgba(239,255,247,0.8)";
    ctx.shadowColor = "#d8b45f";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.globalAlpha = clamp(p.life * 2.5, 0, 1);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function updateHud() {
  ui.score.textContent = format(state.score);
  ui.shards.textContent = state.shards.toLocaleString();
  ui.wave.textContent = state.wave;
  ui.shield.textContent = Math.max(0, Math.ceil(player.shield));
  ui.best.textContent = format(state.best);
  ui.pill.classList.toggle("is-danger", player.shield <= 30 || state.mode === "gameover");
  ui.pill.classList.toggle("is-boss", Boolean(state.boss));
  ui.mission.textContent = state.boss ? "Vault node engaged" : player.shield <= 30 ? "Shield critical" : "Explore the chain";
  ui.meta.textContent = state.boss ? "break the node core" : `Wave ${state.wave} - burst costs 5 shards`;
}

function loop(now) {
  const dt = Math.min(0.033, (now - state.lastFrame) / 1000 || 0);
  state.lastFrame = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
  if (event.code === "Space" && state.mode === "playing") burstShot();
  keys.add(event.code);
});

window.addEventListener("keyup", (event) => keys.delete(event.code));

canvas.addEventListener("pointermove", (event) => {
  if (state.mode !== "playing") return;
  const rect = canvas.getBoundingClientRect();
  player.x = clamp(((event.clientX - rect.left) / rect.width) * W, 80, W * 0.55);
  player.y = clamp(((event.clientY - rect.top) / rect.height) * H, 100, H - 100);
});

canvas.addEventListener("pointerdown", () => {
  if (state.mode === "playing") burstShot();
});

ui.start.addEventListener("click", startGame);
ui.sound.addEventListener("click", () => {
  state.sound = !state.sound;
  ui.sound.textContent = `Sound: ${state.sound ? "on" : "off"}`;
  ui.sound.setAttribute("aria-pressed", String(state.sound));
});

updateHud();
draw();
requestAnimationFrame(loop);
