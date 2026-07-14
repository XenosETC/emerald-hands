const canvas = document.querySelector("#rushCanvas");
const ctx = canvas.getContext("2d");

const els = {
  startButton: document.querySelector("#startButton"),
  score: document.querySelector("#scoreLabel"),
  time: document.querySelector("#timeLabel"),
  combo: document.querySelector("#comboLabel"),
  rank: document.querySelector("#rankLabel"),
  overlay: document.querySelector("#rushOverlay"),
  overlayTitle: document.querySelector("#overlayTitle"),
  overlayText: document.querySelector("#overlayText"),
  runStats: document.querySelector("#runStats"),
};

const background = new Image();
background.src = "assets/shard-rush/arena-background.png";

const sprites = new Image();
sprites.src = "assets/shard-rush/sprite-sheet.png";

const spriteMap = {
  collector: { col: 0, row: 0 },
  shard: { col: 1, row: 0 },
  liquidity: { col: 2, row: 0 },
  candle: { col: 3, row: 0 },
  deadlp: { col: 0, row: 1 },
  fud: { col: 1, row: 1 },
  bot: { col: 2, row: 1 },
  combo: { col: 3, row: 1 },
};

const drops = [];
const keys = new Set();
const pointer = { active: false, x: canvas.width / 2 };

const state = {
  running: false,
  score: 0,
  combo: 1,
  maxCombo: 1,
  streak: 0,
  cleanCatches: 0,
  hazardsHit: 0,
  timeLeft: 60,
  elapsed: 0,
  spawnTimer: 0,
  lastFrame: performance.now(),
  collectorX: canvas.width / 2,
};

function startGame() {
  window.EmeraldArcade?.beginSession("rush", "shard-rush.html");
  drops.length = 0;
  Object.assign(state, {
    running: true,
    score: 0,
    combo: 1,
    maxCombo: 1,
    streak: 0,
    cleanCatches: 0,
    hazardsHit: 0,
    timeLeft: 60,
    elapsed: 0,
    spawnTimer: 0,
    lastFrame: performance.now(),
    collectorX: canvas.width / 2,
  });
  els.overlay.classList.add("is-hidden");
  els.runStats.hidden = true;
  els.runStats.innerHTML = "";
  updateHud();
}

function endGame() {
  state.running = false;
  const rank = rankForScore(state.score);
  els.overlayTitle.textContent = `${rank} Run`;
  els.overlayText.textContent = `Final score: ${format(state.score)}. Max combo x${state.maxCombo}. Clean catches beat hazard hits every time.`;
  els.runStats.hidden = false;
  els.runStats.innerHTML = `
    <div><span>${format(state.score)}</span><small>score</small></div>
    <div><span>x${state.maxCombo}</span><small>max combo</small></div>
    <div><span>${state.cleanCatches}</span><small>clean catches</small></div>
    <div><span>${state.hazardsHit}</span><small>hazards hit</small></div>
  `;
  els.overlay.classList.remove("is-hidden");
  window.EmeraldArcade?.recordAndNotify("rush", { score: state.score, rank, combo: state.maxCombo, played: true });
  updateHud();
}

function rankForScore(score) {
  if (score >= 45000) return "Emerald Storm";
  if (score >= 30000) return "Market Sage";
  if (score >= 18000) return "Liquidity Runner";
  if (score >= 9000) return "Shard Stacker";
  if (score >= 3000) return "Retail Sprinter";
  return "Unranked";
}

function spawnDrop() {
  const roll = Math.random();
  let type = "shard";
  if (roll > 0.9) type = "combo";
  else if (roll > 0.78) type = "candle";
  else if (roll > 0.62) type = "liquidity";
  else if (roll > 0.49) type = "deadlp";
  else if (roll < 0.16) type = "fud";
  else if (roll < 0.27) type = "bot";

  const laneWidth = canvas.width / 5;
  const lane = Math.floor(Math.random() * 5);
  const x = laneWidth * lane + laneWidth * (0.25 + Math.random() * 0.5);
  const hazard = type === "fud" || type === "bot";
  drops.push({
    type,
    x,
    y: -70,
    size: hazard ? 70 : 62,
    speed: 170 + Math.random() * 120 + state.elapsed * 2.3,
    spin: Math.random() * Math.PI,
  });
}

function update(delta) {
  if (!state.running) return;

  state.elapsed += delta;
  state.timeLeft = Math.max(0, 60 - state.elapsed);
  state.spawnTimer -= delta;
  if (state.spawnTimer <= 0) {
    spawnDrop();
    state.spawnTimer = Math.max(0.18, 0.62 - state.elapsed * 0.006);
  }

  const moveSpeed = 760;
  if (keys.has("ArrowLeft") || keys.has("a")) state.collectorX -= moveSpeed * delta;
  if (keys.has("ArrowRight") || keys.has("d")) state.collectorX += moveSpeed * delta;
  if (pointer.active) state.collectorX += (pointer.x - state.collectorX) * Math.min(1, delta * 10);
  state.collectorX = clamp(state.collectorX, 105, canvas.width - 105);

  const collectorY = canvas.height - 88;
  for (let i = drops.length - 1; i >= 0; i -= 1) {
    const drop = drops[i];
    drop.y += drop.speed * delta;
    drop.spin += delta * 2.2;

    const dx = Math.abs(drop.x - state.collectorX);
    const dy = Math.abs(drop.y - collectorY);
    if (dx < 78 && dy < 58) {
      collect(drop);
      drops.splice(i, 1);
    } else if (drop.y > canvas.height + 90) {
      drops.splice(i, 1);
      if (!isHazard(drop.type)) breakCombo();
    }
  }

  if (state.timeLeft <= 0) endGame();
  updateHud();
}

function collect(drop) {
  if (isHazard(drop.type)) {
    state.score = Math.max(0, state.score - (drop.type === "bot" ? 900 : 650));
    state.hazardsHit += 1;
    breakCombo();
    return;
  }

  const values = { shard: 120, liquidity: 360, candle: 520, deadlp: 440, combo: 250 };
  state.score += Math.round(values[drop.type] * state.combo);
  state.streak += 1;
  state.cleanCatches += 1;
  if (drop.type === "combo" || drop.type === "candle" || state.streak % 6 === 0) {
    state.combo = Math.min(8, state.combo + 1);
    state.maxCombo = Math.max(state.maxCombo, state.combo);
  }
}

function breakCombo() {
  state.combo = 1;
  state.streak = 0;
}

function isHazard(type) {
  return type === "fud" || type === "bot";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCover(background, 0, 0, canvas.width, canvas.height);
  drawLaneGlow();

  for (const drop of drops) {
    drawSprite(drop.type, drop.x, drop.y, drop.size, drop.spin);
  }

  drawSprite("collector", state.collectorX, canvas.height - 80, 126, 0);
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

function drawLaneGlow() {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#23f09c";
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i += 1) {
    const x = (canvas.width / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, 90);
    ctx.lineTo(x, canvas.height - 120);
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
  ctx.rotate(rotation * 0.08);
  ctx.drawImage(sprites, sprite.col * cellW, sprite.row * cellH, cellW, cellH, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function updateHud() {
  els.score.textContent = format(state.score);
  els.time.textContent = Math.ceil(state.timeLeft);
  els.combo.textContent = `x${state.combo}`;
  els.rank.textContent = rankForScore(state.score);
}

function loop(now) {
  const delta = Math.min(0.033, (now - state.lastFrame) / 1000);
  state.lastFrame = now;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

function canvasX(clientX) {
  const rect = canvas.getBoundingClientRect();
  return ((clientX - rect.left) / rect.width) * canvas.width;
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
  keys.add(event.key);
  if (event.key === " " && !state.running) startGame();
});

window.addEventListener("keyup", (event) => keys.delete(event.key));

canvas.addEventListener("pointerdown", (event) => {
  pointer.active = true;
  pointer.x = canvasX(event.clientX);
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (pointer.active) pointer.x = canvasX(event.clientX);
});

canvas.addEventListener("pointerup", () => {
  pointer.active = false;
});

background.addEventListener("load", draw);
sprites.addEventListener("load", draw);
updateHud();
requestAnimationFrame(loop);
