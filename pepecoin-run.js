const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const stage = document.querySelector(".stage-wrap");

const ui = {
  score: document.querySelector("#scoreLabel"),
  shards: document.querySelector("#shardLabel"),
  combo: document.querySelector("#comboLabel"),
  best: document.querySelector("#bestLabel"),
  overlay: document.querySelector("#gameOverlay"),
  title: document.querySelector("#overlayTitle"),
  text: document.querySelector("#overlayText"),
  start: document.querySelector("#startButton"),
  hint: document.querySelector("#tapHint"),
  market: document.querySelector("#marketPill"),
  marketLabel: document.querySelector("#marketLabel"),
  marketMeta: document.querySelector("#marketMeta"),
  sound: document.querySelector("#soundToggle"),
};

const coinImage = new Image();
coinImage.src = "assets/pepecoin-run/pepecoin-classic.png";

const W = canvas.width;
const H = canvas.height;
const STORAGE_KEY = "pepecoin-emerald-run-v1";
const player = { x: 245, y: 0, vy: 0, radius: 42, rotation: 0, grounded: true };
const state = {
  mode: "ready",
  elapsed: 0,
  distance: 0,
  speed: 310,
  score: 0,
  shards: 0,
  combo: 1,
  comboClock: 0,
  best: Number(localStorage.getItem(STORAGE_KEY) || 0),
  shake: 0,
  flash: 0,
  sound: true,
  lastFrame: performance.now(),
};

let audioContext;
let terrainSource = createFallbackSeries();
let terrainIsLive = false;
let marketPrice = null;
let marketChange = null;
let marketHudClock = 0;
const hazards = [];
const emeralds = [];
const particles = [];

function createFallbackSeries() {
  const values = [];
  let value = 20;
  for (let i = 0; i < 96; i += 1) {
    value += Math.sin(i * 0.43) * 0.12 + Math.sin(i * 0.11) * 0.18 + (Math.random() - 0.5) * 0.28;
    values.push(value);
  }
  return values;
}

async function loadEtcTerrain() {
  const cacheKey = "etc-road-cache-v1";
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached?.at > Date.now() - 30 * 60 * 1000 && cached.prices?.length > 24) {
      applyMarketSeries(cached.prices, true, "cached market tape");
      return;
    }
  } catch { /* continue to network */ }

  try {
    const response = await fetch("https://api.coingecko.com/api/v3/coins/ethereum-classic/market_chart?vs_currency=usd&days=1&precision=4", { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Market response ${response.status}`);
    const body = await response.json();
    const prices = body.prices?.map((point) => Number(point[1])).filter(Number.isFinite);
    if (!prices || prices.length < 24) throw new Error("Not enough market points");
    localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), prices }));
    applyMarketSeries(prices, true, "recent 24h price tape");
  } catch {
    applyMarketSeries(terrainSource, false, "offline market simulation");
  }
}

function applyMarketSeries(prices, isLive, meta) {
  terrainSource = prices;
  terrainIsLive = isLive;
  marketPrice = isLive ? prices[prices.length - 1] : null;
  marketChange = isLive && prices[0]
    ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
    : null;
  ui.market.classList.toggle("is-live", isLive);
  ui.market.classList.toggle("is-down", marketChange < 0);
  ui.marketLabel.textContent = isLive ? `ETC $${marketPrice.toFixed(2)}` : "ETC chart road";
  ui.marketMeta.textContent = isLive
    ? `${marketChange >= 0 ? "+" : ""}${marketChange.toFixed(2)}% · ${meta}`
    : meta;
}

function terrainAt(worldX) {
  // Compress the 24h tape so several real price observations are visible on-screen at once.
  const sample = Math.max(0, worldX / 76);
  const i = Math.floor(sample) % terrainSource.length;
  const next = (i + 1) % terrainSource.length;
  const t = sample - Math.floor(sample);
  const min = Math.min(...terrainSource);
  const max = Math.max(...terrainSource);
  const span = Math.max(0.001, max - min);
  const a = (terrainSource[i] - min) / span;
  const b = (terrainSource[next] - min) / span;
  const smooth = t * t * (3 - 2 * t);
  return 520 - (a + (b - a) * smooth) * 170;
}

function marketValueAt(worldX) {
  if (!terrainSource.length) return null;
  const sample = Math.max(0, worldX / 76);
  const i = Math.floor(sample) % terrainSource.length;
  const next = (i + 1) % terrainSource.length;
  const t = sample - Math.floor(sample);
  return terrainSource[i] + (terrainSource[next] - terrainSource[i]) * t;
}

function updateMarketPlayback(dt, force = false) {
  if (!terrainIsLive) return;
  marketHudClock -= dt;
  if (!force && marketHudClock > 0) return;
  marketHudClock = .08;
  const playbackPrice = marketValueAt(state.distance + player.x);
  if (!Number.isFinite(playbackPrice)) return;
  marketPrice = playbackPrice;
  marketChange = terrainSource[0]
    ? ((marketPrice - terrainSource[0]) / terrainSource[0]) * 100
    : 0;
  const direction = marketChange >= 0 ? "+" : "";
  ui.market.classList.toggle("is-down", marketChange < 0);
  ui.marketLabel.textContent = `ETC $${marketPrice.toFixed(2)}`;
  ui.marketMeta.textContent = `${direction}${marketChange.toFixed(2)}% · chart playback`;
}

function startGame() {
  Object.assign(state, { mode: "running", elapsed: 0, distance: 0, speed: 310, score: 0, shards: 0, combo: 1, comboClock: 0, shake: 0, flash: 0, lastFrame: performance.now() });
  hazards.length = 0;
  emeralds.length = 0;
  particles.length = 0;
  player.vy = 0;
  player.rotation = 0;
  player.grounded = true;
  player.y = terrainAt(player.x) - player.radius;
  buildCourse();
  updateMarketPlayback(0, true);
  ui.overlay.classList.add("is-hidden");
  ui.hint.classList.add("is-visible");
  window.setTimeout(() => ui.hint.classList.remove("is-visible"), 2100);
  updateHud();
  tone(280, .05, "sine");
}

function buildCourse() {
  for (let x = 760; x < 9000; x += 310 + Math.random() * 270) {
    const worldX = x + state.distance;
    if (Math.random() < .68) {
      hazards.push({ x: worldX, width: 42 + Math.random() * 26, height: 52 + Math.random() * 34, hit: false });
    }
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i += 1) {
      const shardX = worldX + 95 + i * 62;
      emeralds.push({ x: shardX, lift: 105 + Math.sin(i / Math.max(1, count - 1) * Math.PI) * 52, size: 22, spin: Math.random() * 6, collected: false });
    }
  }
}

function jump() {
  if (state.mode !== "running") return;
  if (player.grounded) {
    player.vy = -690;
    player.grounded = false;
    tone(420, .07, "triangle");
    burst(player.x - 10, player.y + player.radius, "#73ffac", 8);
  }
}

function update(dt) {
  if (state.mode !== "running") return;
  state.elapsed += dt;
  state.speed = Math.min(570, 310 + state.elapsed * 7.2);
  state.distance += state.speed * dt;
  updateMarketPlayback(dt);
  state.score += state.speed * dt * .045 * state.combo;
  state.comboClock = Math.max(0, state.comboClock - dt);
  if (!state.comboClock && state.combo > 1) state.combo = 1;
  state.shake = Math.max(0, state.shake - dt * 18);
  state.flash = Math.max(0, state.flash - dt * 3);

  const ground = terrainAt(state.distance + player.x) - player.radius;
  player.vy += 1750 * dt;
  player.y += player.vy * dt;
  if (player.y >= ground) {
    player.y = ground;
    player.vy = 0;
    player.grounded = true;
  }
  player.rotation += (state.speed / player.radius) * dt;

  for (const shard of emeralds) {
    if (shard.collected) continue;
    const sx = shard.x - state.distance;
    const sy = terrainAt(shard.x) - shard.lift;
    shard.spin += dt * 3.4;
    if (distance(player.x, player.y, sx, sy) < player.radius + shard.size) collectShard(shard, sx, sy);
  }

  for (const hazard of hazards) {
    if (hazard.hit) continue;
    const hx = hazard.x - state.distance;
    const base = terrainAt(hazard.x);
    if (circleTriangleCollision(player.x, player.y, player.radius * .72, hx, base, hazard.width, hazard.height)) crash(hazard);
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 520 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (hazards[hazards.length - 1]?.x - state.distance < 4500) buildCourse();
  updateHud();
}

function collectShard(shard, x, y) {
  shard.collected = true;
  state.shards += 1;
  state.combo = Math.min(8, state.combo + (state.shards % 3 === 0 ? 1 : 0));
  state.comboClock = 3.2;
  state.score += 125 * state.combo;
  state.flash = .45;
  burst(x, y, "#70ffb0", 16);
  tone(620 + state.combo * 55, .06, "sine");
}

function crash(hazard) {
  hazard.hit = true;
  state.mode = "gameover";
  state.shake = 16;
  burst(player.x, player.y, "#bf44ff", 30);
  tone(110, .28, "sawtooth");
  const finalScore = Math.floor(state.score);
  state.best = Math.max(state.best, finalScore);
  localStorage.setItem(STORAGE_KEY, state.best);
  const rank = rankFor(finalScore);
  window.EmeraldArcade?.recordAndNotify("pepeRun", { score: finalScore, rank, shards: state.shards, combo: state.combo, played: true });
  window.setTimeout(() => {
    ui.title.textContent = `${rank} Run`;
    ui.text.textContent = `${finalScore.toLocaleString()} points · ${state.shards} emeralds · ${Math.floor(state.distance / 10)}m ridden. ${terrainIsLive ? "ETC market road conquered." : "Offline road conquered."}`;
    ui.start.textContent = "Run It Back";
    ui.overlay.classList.remove("is-hidden");
    updateHud();
  }, 520);
}

function rankFor(score) {
  if (score >= 18000) return "Ancient Pepe";
  if (score >= 9000) return "Emerald Maxi";
  if (score >= 4500) return "Chart Surfer";
  if (score >= 1800) return "Shard Hopper";
  return "Fresh Frog";
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (state.shake) ctx.translate((Math.random() - .5) * state.shake, (Math.random() - .5) * state.shake);
  drawSky();
  drawRoad();
  drawObjects();
  drawPlayer();
  drawParticles();
  ctx.restore();
  if (state.flash) {
    ctx.fillStyle = `rgba(80,255,160,${state.flash * .13})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#080213");
  gradient.addColorStop(.58, "#160523");
  gradient.addColorStop(1, "#03100b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .55;
  for (let i = 0; i < 42; i += 1) {
    const x = ((i * 191 - state.distance * (.035 + (i % 4) * .012)) % (W + 80) + W + 80) % (W + 80) - 40;
    const y = 80 + (i * 83) % 300;
    ctx.fillStyle = i % 6 === 0 ? "#a842ff" : "#77ffc0";
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(89,255,169,.13)";
  ctx.lineWidth = 1;
  for (let y = 130; y < 470; y += 58) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.fillStyle = "rgba(69,255,154,.08)";
  ctx.font = "900 126px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("ETC", W * .68, 270);
}

function roadPoints() {
  const points = [];
  for (let x = -30; x <= W + 30; x += 18) points.push([x, terrainAt(state.distance + x)]);
  return points;
}

function drawRoad() {
  const points = roadPoints();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points) ctx.lineTo(x, y);
  ctx.lineTo(W + 30, H); ctx.lineTo(-30, H); ctx.closePath();
  const chartGlow = ctx.createLinearGradient(0, 350, 0, H);
  chartGlow.addColorStop(0, "rgba(72,255,157,.26)");
  chartGlow.addColorStop(.42, "rgba(19,96,59,.15)");
  chartGlow.addColorStop(1, "rgba(2,7,4,0)");
  ctx.fillStyle = chartGlow;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points) ctx.lineTo(x, y);
  ctx.lineTo(W + 30, H); ctx.lineTo(-30, H); ctx.closePath();
  const fill = ctx.createLinearGradient(0, 380, 0, H);
  fill.addColorStop(0, "#123624"); fill.addColorStop(1, "#020704");
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = "#65ffad"; ctx.lineWidth = 7; ctx.lineJoin = "round"; ctx.stroke();
  ctx.strokeStyle = "rgba(199,255,223,.75)"; ctx.lineWidth = 2; ctx.stroke();

  ctx.save();
  ctx.setLineDash([4, 10]);
  ctx.strokeStyle = "rgba(167,255,208,.28)";
  ctx.lineWidth = 1;
  const currentY = points[points.length - 8]?.[1] || 420;
  ctx.beginPath(); ctx.moveTo(0, currentY); ctx.lineTo(W, currentY); ctx.stroke();
  ctx.setLineDash([]);
  if (marketPrice) {
    const label = `ETC  $${marketPrice.toFixed(2)}`;
    ctx.font = "900 17px system-ui";
    const labelWidth = ctx.measureText(label).width + 24;
    ctx.fillStyle = "rgba(5,31,20,.92)";
    ctx.fillRect(W - labelWidth - 18, currentY - 16, labelWidth, 30);
    ctx.fillStyle = "#82ffc0";
    ctx.textAlign = "center";
    ctx.fillText(label, W - labelWidth / 2 - 18, currentY + 5);
  }
  ctx.restore();

  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "rgba(76,255,158,.12)";
  ctx.lineWidth = 1;
  for (let x = -(state.distance % 72); x < W + 100; x += 72) { ctx.beginPath(); ctx.moveTo(x, 410); ctx.lineTo(x - 120, H); ctx.stroke(); }
  for (let y = 540; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}

function drawObjects() {
  for (const shard of emeralds) {
    if (shard.collected) continue;
    const x = shard.x - state.distance;
    if (x < -60 || x > W + 60) continue;
    const y = terrainAt(shard.x) - shard.lift + Math.sin(state.elapsed * 5 + shard.x) * 5;
    drawEmerald(x, y, shard.size, shard.spin);
  }
  for (const hazard of hazards) {
    const x = hazard.x - state.distance;
    if (x < -100 || x > W + 100) continue;
    const y = terrainAt(hazard.x);
    ctx.save();
    ctx.shadowColor = "#b938ff"; ctx.shadowBlur = 22;
    const grad = ctx.createLinearGradient(x, y - hazard.height, x, y);
    grad.addColorStop(0, "#ee8cff"); grad.addColorStop(.4, "#a52bdb"); grad.addColorStop(1, "#39004d");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(x - hazard.width / 2, y); ctx.lineTo(x, y - hazard.height); ctx.lineTo(x + hazard.width / 2, y); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function drawEmerald(x, y, size, spin) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(spin) * .18); ctx.scale(.72 + Math.abs(Math.cos(spin)) * .28, 1);
  ctx.shadowColor = "#31ff91"; ctx.shadowBlur = 24;
  const grad = ctx.createLinearGradient(0, -size, 0, size);
  grad.addColorStop(0, "#d2ffe7"); grad.addColorStop(.3, "#56ffad"); grad.addColorStop(1, "#058a45");
  ctx.fillStyle = grad; ctx.strokeStyle = "#dcffeb"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -size); ctx.lineTo(size * .62, -size * .25); ctx.lineTo(size * .44, size * .58); ctx.lineTo(0, size); ctx.lineTo(-size * .44, size * .58); ctx.lineTo(-size * .62, -size * .25); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.rotation);
  ctx.beginPath(); ctx.arc(0, 0, player.radius + 5, 0, Math.PI * 2);
  ctx.shadowColor = player.grounded ? "rgba(84,255,164,.55)" : "rgba(154,255,205,.9)"; ctx.shadowBlur = player.grounded ? 20 : 36;
  ctx.fillStyle = "#102d1e"; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, player.radius, 0, Math.PI * 2); ctx.clip();
  if (coinImage.complete && coinImage.naturalWidth) ctx.drawImage(coinImage, -player.radius, -player.radius, player.radius * 2, player.radius * 2);
  else { ctx.fillStyle = "#46ca72"; ctx.fillRect(-player.radius, -player.radius, player.radius * 2, player.radius * 2); }
  ctx.restore();
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const speed = 90 + Math.random() * 260;
    particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 80, life: .35 + Math.random() * .45, maxLife: .8, color, size: 2 + Math.random() * 5 });
  }
}

function drawParticles() {
  for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / p.maxLife); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }
  ctx.globalAlpha = 1;
}

function circleTriangleCollision(cx, cy, radius, tx, base, width, height) {
  if (cx + radius < tx - width / 2 || cx - radius > tx + width / 2 || cy + radius < base - height || cy - radius > base) return false;
  const relative = 1 - Math.abs(cx - tx) / (width / 2 + radius);
  const spikeY = base - height * Math.max(0, relative);
  return cy + radius > spikeY;
}

function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

function updateHud() {
  ui.score.textContent = Math.floor(state.score).toLocaleString();
  ui.shards.textContent = state.shards;
  ui.combo.textContent = `x${state.combo}`;
  ui.best.textContent = state.best.toLocaleString();
}

function tone(frequency, duration, type) {
  if (!state.sound) return;
  try {
    audioContext ||= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  } catch { /* audio is optional */ }
}

function action(event) {
  if (event) event.preventDefault();
  if (state.mode === "running") jump();
}

function loop(now) {
  const dt = Math.min(.032, (now - state.lastFrame) / 1000);
  state.lastFrame = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

ui.start.addEventListener("click", startGame);
stage.addEventListener("pointerdown", (event) => { if (!event.target.closest("button, a")) action(event); });
window.addEventListener("keydown", (event) => { if ([" ", "ArrowUp", "w", "W"].includes(event.key)) action(event); });
ui.sound.addEventListener("click", () => { state.sound = !state.sound; ui.sound.textContent = `Sound: ${state.sound ? "on" : "off"}`; ui.sound.setAttribute("aria-pressed", String(state.sound)); });

player.y = terrainAt(player.x) - player.radius;
updateHud();
loadEtcTerrain();
requestAnimationFrame(loop);
