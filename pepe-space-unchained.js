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
  burst: document.querySelector("#burstButton"),
  finish: document.querySelector("#finishButton"),
  goal: document.querySelector("#flightGoal"),
  core: document.querySelector("#coreHealth"),
  rankProgress: document.querySelector("#rankProgress"),
  report: document.querySelector("#flightReport"),
};

const W = canvas.width;
const H = canvas.height;
const STORAGE_KEY = "pepe-space-unchained-best-v1";
function readBest() {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  } catch { return 0; }
}
const keys = new Set();
let activePointer = null;
let flightId = 0;
function resetInput() {
  keys.clear();
  if (activePointer !== null) {
    try { canvas.releasePointerCapture(activePointer); } catch { /* already released */ }
  }
  activePointer = null;
  player.vx = 0;
  player.vy = 0;
}
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
  nodesCleared: 0,
  shotHits: 0,
  hullHits: 0,
  shotDamage: 0,
  hullDamage: 0,
  burstsUsed: 0,
  best: readBest(),
  nextBossKills: 16,
  spawnClock: 0,
  waveClock: 0,
  shake: 0,
  flash: 0,
  boss: null,
  sound: true,
  lastFrame: null,
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
  if (state.mode === "playing" || window.EmeraldArcade?.isPaused?.()) return;
  flightId += 1;
  resetInput();
  window.EmeraldArcade?.beginSession("spaceUnchained", "pepe-space-unchained.html");
  Object.assign(state, {
    mode: "playing",
    elapsed: 0,
    score: 0,
    shards: 0,
    wave: 1,
    kills: 0,
  nodesCleared: 0,
  shotHits: 0,
  hullHits: 0,
  shotDamage: 0,
  hullDamage: 0,
  burstsUsed: 0,
    nextBossKills: 16,
    spawnClock: 0.2,
    waveClock: 0,
    shake: 0,
    flash: 0,
    boss: null,
    lastFrame: null,
  });
  Object.assign(player, { x: 190, y: H / 2, vx: 0, vy: 0, shield: 100, invuln: 0, fireClock: 0, burstClock: 0 });
  bullets.length = 0;
  enemyBullets.length = 0;
  enemies.length = 0;
  shards.length = 0;
  particles.length = 0;
  ui.overlay.classList.add("is-hidden");
  ui.report.textContent = "";
  canvas.focus();
  tone(360, 0.08, "triangle");
  updateHud();
}

function fire() {
  bullets.push({ x: player.x + 154, y: player.y - 25, vx: 820, vy: -24, life: 1.1, damage: 1 });
  bullets.push({ x: player.x + 154, y: player.y + 25, vx: 820, vy: 24, life: 1.1, damage: 1 });
  tone(720, 0.03, "square", 0.012);
}

function burstShot() {
  if (state.mode !== "playing" || window.EmeraldArcade?.isPaused?.() || player.burstClock > 0 || state.shards < 5) return;
  state.shards -= 5;
  state.burstsUsed += 1;
  player.burstClock = 2.2;
  for (let i = -2; i <= 2; i += 1) {
    bullets.push({ x: player.x + 118, y: player.y, vx: 900, vy: i * 105, life: 1, damage: 2 });
  }
  burst(player.x + 90, player.y, "#d8b45f", 18);
  tone(240, 0.08, "sawtooth", 0.02);
}

function spawnEnemy() {
  const bossSoon = state.kills >= state.nextBossKills && !state.boss;
  if (bossSoon) {
    state.nextBossKills += 16;
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
  // Exact drag integration keeps keyboard steering consistent across frame rates.
  const drag = -Math.log(.84) * 60;
  const decay = Math.exp(-drag * dt);
  const speed = 2100 / 60 * .84 / (1 - .84);
  const targetX = ax * speed;
  const targetY = ay * speed;
  player.x = clamp(player.x + targetX * dt + (player.vx - targetX) * (1 - decay) / drag, 80, W * .55);
  player.y = clamp(player.y + targetY * dt + (player.vy - targetY) * (1 - decay) / drag, 100, H - 100);
  player.vx = targetX + (player.vx - targetX) * decay;
  player.vy = targetY + (player.vy - targetY) * decay;
  for (const star of stars) {
    star.x -= star.s * dt;
    if (star.x < -5) { star.x = W + 5; star.y = Math.random() * H; }
  }

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
  if (state.mode !== "playing") { updateHud(); return; }
  updateEnemies(dt);
  if (state.mode !== "playing") { updateHud(); return; }
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
      damagePlayer(10, "shot");
      if (state.mode !== "playing") return;
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
      damagePlayer(e.boss ? 24 : 18, "hull");
      if (state.mode !== "playing") return;
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
          break;
        }
        // Other projectiles in this volley may also hit a surviving hull.
      }
    }
    if (e.hp > 0 && e.x < -120) enemies.splice(i, 1);
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
    state.nodesCleared += 1;
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

function damagePlayer(amount, source = "other") {
  if (state.mode !== "playing" || !Number.isFinite(amount) || amount <= 0) return;
  const lost = Math.min(player.shield, amount);
  if (source === "shot") { state.shotHits += 1; state.shotDamage += lost; }
  if (source === "hull") { state.hullHits += 1; state.hullDamage += lost; }
  player.shield = Math.max(0, player.shield - amount);
  player.invuln = 0.75;
  state.shake = 12;
  state.flash = 0.5;
  burst(player.x, player.y, "#ff4f70", 24);
  tone(120, 0.16, "sawtooth", 0.035);
  if (player.shield <= 0) endGame();
}

function endGame(reason = "shield") {
  if (state.mode !== "playing") return;
  resetInput();
  state.mode = "gameover";
  const finalScore = Math.floor(state.score);
  state.best = Math.max(state.best, finalScore);
  try { localStorage.setItem(STORAGE_KEY, state.best); } catch { /* session best remains playable */ }
  const rank = rankFor(finalScore, state.wave);
  window.EmeraldArcade?.recordAndNotify("spaceUnchained", {
    score: finalScore,
    rank,
    wave: state.wave,
    shards: state.shards,
    kills: state.kills,
    nodesCleared: state.nodesCleared,
    played: true,
  });
  const thisFlight = flightId;
  updateHud();
  window.setTimeout(() => {
    if (flightId !== thisFlight || state.mode !== "gameover") return;
    ui.title.textContent = `${rank} Flight`;
    ui.text.textContent = `${reason === "bank" ? "Flight banked" : "Shield depleted"} · ${finalScore.toLocaleString()} points - Wave ${state.wave} - ${state.shards} shards - ${state.kills} corrupt ships unchained - ${state.nodesCleared} vault nodes cleared.`;
    ui.report.textContent = flightAdvice(reason);
    ui.start.textContent = "Launch Again";
    ui.overlay.classList.remove("is-hidden");
    ui.start.focus();
  }, 500);
}

function flightAdvice(reason) {
  const seconds = Math.floor(state.elapsed);
  const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const summary = `${duration} flown · ${state.shotHits} enemy-shot hits · ${state.hullHits} hull collisions · ${state.burstsUsed} bursts used.`;
  let advice;
  if (state.hullDamage > state.shotDamage) advice = "Leave more space between your fighter and enemy hulls; steer before they reach you.";
  else if (state.shotDamage > 0) advice = "Watch the dashed aim warnings and change your flight line before the shot arrives.";
  else advice = reason === "bank" ? "Clean flight banked. Keep exploring longer when you’re ready." : "Keep moving and preserve room to dodge.";
  return `${summary} ${advice}`;
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
  const blink = player.invuln > 0 && Math.floor(state.elapsed / .08) % 2 === 0;
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

function shotWarning(enemy) {
  return state.mode === "playing" && enemy.hp > 0 && enemy.x >= 0 && enemy.x <= W && enemy.shoot > 0 && enemy.shoot <= .28;
}

function drawEnemies() {
  enemies.forEach((e) => {
    if (shotWarning(e)) {
      ctx.save();
      ctx.strokeStyle = e.boss ? "#ffe4a0" : "#ff9da9";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 12]);
      ctx.beginPath();
      ctx.moveTo(e.x - 54, e.y);
      ctx.lineTo(player.x, player.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(e.x - 54, e.y, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
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
    ctx.strokeStyle = "#fff2f4";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#ff4f70";
    ctx.shadowColor = "#ff4f70";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
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
  ui.mission.textContent = player.shield <= 30 ? (state.boss ? "Shield critical · vault node engaged" : "Shield critical") : state.boss ? "Vault node engaged" : "Explore the chain";
  ui.meta.textContent = state.boss
    ? `Core ${Math.max(0, state.boss.hp)} / ${state.boss.maxHp} · burst costs 5 shards`
    : `${Math.max(0, state.nextBossKills - state.kills)} kills to next vault node · auto-fire`;
  ui.core.hidden = !state.boss;
  ui.core.max = state.boss?.maxHp || 1;
  ui.core.value = Math.max(0, state.boss?.hp || 0);
  ui.core.setAttribute("aria-label", state.boss ? `Vault core health ${state.boss.hp} of ${state.boss.maxHp}` : "No active vault core");
  ui.rankProgress.value = Math.min(1, Math.max(state.score / 18000, (state.wave - 1) / 6));
  ui.rankProgress.setAttribute("aria-valuetext", `Wave ${state.wave} of 7 or ${Math.floor(state.score)} of 18000 points; ${state.nodesCleared} nodes cleared`);
  ui.finish.disabled = state.mode !== "playing" || Boolean(window.EmeraldArcade?.isPaused?.());
  ui.goal.textContent = rankFor(state.score, state.wave) === "Chainbreaker Ace" ? "Chainbreaker Ace reached. Bank your flight or keep exploring." : "Reach wave 7 or 18,000 points for Chainbreaker Ace. Flight continues until you bank or lose shield.";
  ui.burst.disabled = state.mode !== "playing" || Boolean(window.EmeraldArcade?.isPaused?.()) || state.shards < 5 || player.burstClock > 0;
  ui.burst.textContent = player.burstClock > 0 ? `Burst · ${player.burstClock.toFixed(1)}s` : `Burst · 5 shards (${state.shards})`;
}

function loop(now) {
  // Use the pause-adjusted RAF clock for both the baseline and later frames.
  const dt = state.lastFrame === null ? 0 : Math.max(0, Math.min(0.033, (now - state.lastFrame) / 1000));
  state.lastFrame = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (state.mode !== "playing" || window.EmeraldArcade?.isPaused?.() || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target?.closest?.("button, a, input, select, textarea, [contenteditable='true']")) return;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
  if (event.code === "Space" && !event.repeat) burstShot();
  if (/^(Arrow(Up|Down|Left|Right)|Key[WASD])$/.test(event.code)) keys.add(event.code);
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", resetInput);
window.addEventListener("emeraldarcade:pause", () => { resetInput(); updateHud(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) resetInput(); });

function movePointer(event) {
  if (state.mode !== "playing" || window.EmeraldArcade?.isPaused?.()) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  keys.clear();
  player.vx = 0;
  player.vy = 0;
  player.x = clamp(((event.clientX - rect.left) / rect.width) * W, 80, W * 0.55);
  player.y = clamp(((event.clientY - rect.top) / rect.height) * H, 100, H - 100);
}
canvas.addEventListener("pointermove", (event) => {
  if (event.pointerType === "mouse" || event.pointerId === activePointer) movePointer(event);
});
canvas.addEventListener("pointerdown", (event) => {
  if (state.mode !== "playing" || window.EmeraldArcade?.isPaused?.() || activePointer !== null || (event.button !== undefined && event.button !== 0)) return;
  event.preventDefault();
  activePointer = event.pointerId;
  canvas.setPointerCapture?.(event.pointerId);
  movePointer(event);
  if (event.pointerType === "mouse") burstShot();
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  canvas.addEventListener(type, (event) => { if (event.pointerId === activePointer) resetInput(); });
}
ui.burst.addEventListener("click", () => {
  burstShot();
  updateHud();
  if (state.mode === "playing" && !window.EmeraldArcade?.isPaused?.()) canvas.focus({ preventScroll: true });
});
ui.finish.addEventListener("click", () => { if (!window.EmeraldArcade?.isPaused?.()) endGame("bank"); });

ui.start.addEventListener("click", startGame);
ui.sound.addEventListener("click", () => {
  state.sound = !state.sound;
  ui.sound.textContent = `Sound: ${state.sound ? "on" : "off"}`;
  ui.sound.setAttribute("aria-pressed", String(state.sound));
});

updateHud();
draw();
requestAnimationFrame(loop);
