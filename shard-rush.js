const canvas = document.querySelector("#rushCanvas");
const ctx = canvas.getContext("2d");

const els = {
  playFrame: document.querySelector(".rush-game"),
  startButton: document.querySelector("#startButton"),
  overlayStartButton: document.querySelector("#overlayStartButton"),
  score: document.querySelector("#scoreLabel"),
  time: document.querySelector("#timeLabel"),
  combo: document.querySelector("#comboLabel"),
  rank: document.querySelector("#rankLabel"),
  rankTarget: document.querySelector("#rankTarget"),
  rankProgress: document.querySelector("#rankProgress"),
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
const feedback = [];
const keys = new Set();
const pointer = { active: false, id: null, x: canvas.width / 2 };
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const scoreRanks = [
  { at: 0, label: "Unranked" },
  { at: 3000, label: "Retail Sprinter" },
  { at: 9000, label: "Shard Stacker" },
  { at: 18000, label: "Liquidity Runner" },
  { at: 30000, label: "Market Sage" },
  { at: 45000, label: "Emerald Storm" },
];

const state = {
  running: false,
  score: 0,
  combo: 1,
  maxCombo: 1,
  petMagnet: 0,
  streak: 0,
  cleanCatches: 0,
  hazardsHit: 0,
  timeLeft: 60,
  elapsed: 0,
  spawnTimer: 0,
  lastFrame: null,
  collectorX: canvas.width / 2,
};

function startGame() {
  if (state.running) return;
  window.EmeraldArcade?.beginSession("rush", "shard-rush.html");
  const petBonus = window.ArcadePet?.activeBonus("rush");
  resetInput();
  drops.length = 0;
  feedback.length = 0;
  Object.assign(state, {
    running: true,
    score: 0,
    combo: 1,
    maxCombo: 1,
    petMagnet: Number(petBonus?.magnetRadius || 0),
    streak: 0,
    cleanCatches: 0,
    hazardsHit: 0,
    timeLeft: 60,
    elapsed: 0,
    spawnTimer: 0,
    lastFrame: null,
    collectorX: canvas.width / 2,
  });
  els.overlay.classList.add("is-hidden");
  els.runStats.hidden = true;
  els.runStats.innerHTML = "";
  els.startButton.disabled = true;
  els.startButton.textContent = "Sprint in progress";
  canvas.focus({ preventScroll: true });
  els.playFrame.scrollIntoView({ block: "start", behavior: "auto" });
  updateHud();
  window.ArcadePet?.showAssist("rush");
}

function endGame() {
  if (!state.running) return;
  state.running = false;
  resetInput();
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
  els.overlayStartButton.textContent = "Play again";
  els.startButton.disabled = false;
  els.startButton.textContent = "Play again";
  window.EmeraldArcade?.recordAndNotify("rush", { score: state.score, rank, combo: state.maxCombo, played: true });
  updateHud();
}

function rankForScore(score) {
  let label = scoreRanks[0].label;
  for (const rank of scoreRanks) {
    if (score < rank.at) break;
    label = rank.label;
  }
  return label;
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
  if (keys.has("arrowleft") || keys.has("a")) state.collectorX -= moveSpeed * delta;
  if (keys.has("arrowright") || keys.has("d")) state.collectorX += moveSpeed * delta;
  if (pointer.active) state.collectorX += (pointer.x - state.collectorX) * Math.min(1, delta * 10);
  state.collectorX = clamp(state.collectorX, 105, canvas.width - 105);

  const collectorY = canvas.height - 88;
  for (let i = drops.length - 1; i >= 0; i -= 1) {
    const drop = drops[i];
    drop.y += drop.speed * delta;
    drop.spin += delta * 2.2;

    const dx = Math.abs(drop.x - state.collectorX);
    const dy = Math.abs(drop.y - collectorY);
    const catchRadius = 78 + (isHazard(drop.type) ? 0 : state.petMagnet);
    if (dx < catchRadius && dy < 58 + (isHazard(drop.type) ? 0 : state.petMagnet * 0.35)) {
      if (!isHazard(drop.type) && state.petMagnet > 0 && (dx >= 78 || dy >= 58)) {
        window.ArcadePet?.showAssist("rush", true);
      }
      collect(drop);
      drops.splice(i, 1);
    } else if (drop.y > canvas.height + 90) {
      drops.splice(i, 1);
      if (!isHazard(drop.type)) {
        if (state.combo > 1) addFeedback("MISSED · COMBO RESET", state.collectorX, "miss");
        breakCombo();
      }
    }
  }

  if (state.timeLeft <= 0) endGame();
  updateHud();
}

function collect(drop) {
  if (isHazard(drop.type)) {
    const previousScore = state.score;
    state.score = Math.max(0, state.score - (drop.type === "bot" ? 900 : 650));
    state.hazardsHit += 1;
    const loss = previousScore - state.score;
    addFeedback(`${drop.type === "bot" ? "BOT" : "FUD"} HIT${loss ? ` −${loss}` : ""}`, drop.x, "hazard", "COMBO RESET");
    breakCombo();
    return;
  }

  const values = { shard: 120, liquidity: 360, candle: 520, deadlp: 440, combo: 250 };
  const gained = Math.round(values[drop.type] * state.combo);
  const previousCombo = state.combo;
  state.score += gained;
  state.streak += 1;
  state.cleanCatches += 1;
  if (drop.type === "combo" || drop.type === "candle" || state.streak % 6 === 0) {
    state.combo = Math.min(8, state.combo + 1);
    state.maxCombo = Math.max(state.maxCombo, state.combo);
  }
  addFeedback(`+${gained}`, drop.x, "catch", state.combo > previousCombo ? `COMBO x${state.combo}` : "");
}

function addFeedback(text, x, kind, detail = "") {
  feedback.push({ text, x: clamp(x, 170, canvas.width - 170), kind, detail, age: 0, duration: 1.1 });
  if (feedback.length > 12) feedback.shift();
}

function updateFeedback(delta) {
  for (let i = feedback.length - 1; i >= 0; i -= 1) {
    feedback[i].age += delta;
    if (feedback[i].age >= feedback[i].duration) feedback.splice(i, 1);
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
  drawFeedback();
}

function drawFeedback() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  for (const effect of feedback) {
    const progress = effect.age / effect.duration;
    const y = canvas.height - 175 - (motionPreference.matches ? 0 : progress * 52);
    const color = effect.kind === "hazard" ? "#ffaaa0" : effect.kind === "miss" ? "#ffe0a1" : "#b5ffd8";
    ctx.globalAlpha = motionPreference.matches ? 1 : Math.min(1, (1 - progress) * 3);
    ctx.strokeStyle = "#03110d";
    ctx.lineWidth = 6;
    ctx.fillStyle = color;
    ctx.font = "800 28px system-ui, sans-serif";
    ctx.strokeText(effect.text, effect.x, y);
    ctx.fillText(effect.text, effect.x, y);
    if (effect.detail) {
      ctx.font = "700 18px system-ui, sans-serif";
      ctx.strokeText(effect.detail, effect.x, y + 25);
      ctx.fillText(effect.detail, effect.x, y + 25);
    }
    if (!motionPreference.matches && effect.kind !== "miss" && progress < 0.45) {
      ctx.globalAlpha *= 1 - progress / 0.45;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, canvas.height - 88, 28 + progress * 100, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
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
  ctx.rotate(motionPreference.matches ? 0 : rotation * 0.08);
  ctx.drawImage(sprites, sprite.col * cellW, sprite.row * cellH, cellW, cellH, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function updateHud() {
  els.score.textContent = format(state.score);
  els.time.textContent = Math.ceil(state.timeLeft);
  els.combo.textContent = `x${state.combo}`;
  els.rank.textContent = rankForScore(state.score);
  const next = scoreRanks.find(rank => rank.at > state.score);
  const target = next || scoreRanks[scoreRanks.length - 1];
  els.rankTarget.textContent = next
    ? `${(next.at - state.score).toLocaleString()} to ${next.label}`
    : "Top rank reached · Emerald Storm";
  els.rankProgress.max = target.at;
  els.rankProgress.value = Math.min(state.score, target.at);
  els.rankProgress.setAttribute("aria-label", `Score toward ${target.label}`);
}

function loop(now) {
  // Shared pause removes suspended time from RAF timestamps. Keep the baseline
  // in that same clock, including when a new sprint starts after an earlier pause.
  const delta = state.lastFrame === null ? 0 : Math.max(0, Math.min(0.033, (now - state.lastFrame) / 1000));
  state.lastFrame = now;
  updateFeedback(delta);
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
els.overlayStartButton.addEventListener("click", startGame);

function releasePointer() {
  const id = pointer.id;
  pointer.active = false;
  pointer.id = null;
  if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
}

function resetInput() {
  keys.clear();
  releasePointer();
}

function isInteractiveTarget(target) {
  return target?.isContentEditable || target?.closest?.("button, a, input, textarea, select");
}

window.addEventListener("keydown", (event) => {
  if (isInteractiveTarget(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "a", "d"].includes(key) && state.running) {
    event.preventDefault();
    releasePointer();
    keys.add(key);
  }
  if (key === " " && !state.running && !event.repeat) {
    event.preventDefault();
    startGame();
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", resetInput);
window.addEventListener("emeraldarcade:pause", resetInput);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetInput();
});

canvas.addEventListener("pointerdown", (event) => {
  if (!state.running || event.isPrimary === false || event.button !== 0) return;
  event.preventDefault();
  keys.clear();
  canvas.focus({ preventScroll: true });
  pointer.active = true;
  pointer.id = event.pointerId;
  pointer.x = canvasX(event.clientX);
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (pointer.active && event.pointerId === pointer.id) pointer.x = canvasX(event.clientX);
});

for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  canvas.addEventListener(type, (event) => {
    if (event.pointerId === pointer.id) releasePointer();
  });
}

background.addEventListener("load", draw);
sprites.addEventListener("load", draw);
updateHud();
requestAnimationFrame(loop);
