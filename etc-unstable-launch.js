const canvas = document.querySelector("#launchCanvas");
const ctx = canvas.getContext("2d");

const els = {
  button: document.querySelector("#launchButton"),
  price: document.querySelector("#priceLabel"),
  velocity: document.querySelector("#velocityLabel"),
  stability: document.querySelector("#stabilityLabel"),
  stabilityBar: document.querySelector("#stabilityBar"),
  status: document.querySelector("#flightStatus"),
  resultEyebrow: document.querySelector("#resultEyebrow"),
  resultTitle: document.querySelector("#resultTitle"),
  resultText: document.querySelector("#resultText"),
  resultStats: document.querySelector("#resultStats"),
  timeline: document.querySelector("#timeline"),
  timelineProgress: document.querySelector("#timelineProgress"),
  bestPrice: document.querySelector("#bestPrice"),
  bestRank: document.querySelector("#bestRank"),
};

const START_PRICE = 22.5;
const milestones = [
  { price: 25, label: "$25", lore: "Ignition" },
  { price: 50, label: "$50", lore: "Classic Orbit" },
  { price: 100, label: "$100", lore: "Emerald Century" },
  { price: 500, label: "$500", lore: "Vault Escape" },
  { price: 1000, label: "$1K", lore: "Chainbreaker" },
  { price: 5000, label: "$5K", lore: "Deep Space" },
  { price: 10000, label: "$10K", lore: "Ancient Range" },
  { price: 30000, label: "$30K", lore: "Lore Horizon" },
  { price: 100000, label: "$100K", lore: "Singularity" },
  { price: 1000000, label: "$1M", lore: "Beyond Canon" },
];

const background = new Image();
background.src = "assets/etc-unstable-launch/emerald-space.png";
const rocketSource = new Image();
rocketSource.src = "assets/etc-unstable-launch/etc-rocket-sheet.png";
const explosionSource = new Image();
explosionSource.src = "assets/etc-unstable-launch/emerald-explosion-sheet.png";

let rocketSheet;
let explosionSheet;
let audioContext;
let engineOscillator;
let engineGain;

const shards = Array.from({ length: 54 }, (_, index) => makeShard(index, true));
const particles = [];
const state = {
  mode: "ready",
  price: START_PRICE,
  lockedPrice: 0,
  peakPrice: 0,
  crashPrice: 0,
  elapsed: 0,
  stability: 100,
  velocity: 0,
  backgroundOffset: 0,
  explosionTime: 0,
  lastFrame: performance.now(),
  screenShake: 0,
};

function buildTimeline() {
  for (const milestone of milestones) {
    const item = document.createElement("div");
    item.className = "milestone";
    item.dataset.price = milestone.price;
    item.innerHTML = `<strong>${milestone.label}</strong><small>${milestone.lore}</small>`;
    els.timeline.appendChild(item);
  }
}

function loadBest() {
  const best = window.EmeraldArcade?.load()?.best?.unstableLaunch;
  els.bestPrice.textContent = money(best?.lockedPrice || 0);
  els.bestRank.textContent = best?.rank || "Ground Crew";
}

function chooseCrashPrice() {
  const roll = Math.random();
  let min;
  let max;
  if (roll < 0.42) [min, max] = [55, 650];
  else if (roll < 0.69) [min, max] = [650, 7000];
  else if (roll < 0.84) [min, max] = [7000, 30000];
  else if (roll < 0.94) [min, max] = [30000, 125000];
  else if (roll < 0.99) [min, max] = [125000, 1000000];
  else [min, max] = [1000000, 5000000];
  const logValue = Math.log(min) + Math.random() * (Math.log(max) - Math.log(min));
  return Math.exp(logValue);
}

function startLaunch() {
  window.EmeraldArcade?.beginSession("unstableLaunch", "etc-unstable-launch.html");
  Object.assign(state, {
    mode: "launching",
    price: START_PRICE,
    lockedPrice: 0,
    peakPrice: START_PRICE,
    crashPrice: chooseCrashPrice(),
    elapsed: 0,
    stability: 100,
    velocity: 1,
    explosionTime: 0,
    screenShake: 0,
  });
  particles.length = 0;
  els.button.classList.remove("is-critical");
  els.button.innerHTML = "<span>LOCK PRICE</span><small>Before the reactor breaks</small>";
  els.resultEyebrow.textContent = "Flight Active";
  els.resultTitle.textContent = "Velocity is climbing.";
  els.resultText.textContent = "Lock whenever your nerve says the lore has gone far enough.";
  els.resultStats.hidden = true;
  startEngine();
  updateHud();
}

function lockPrice() {
  if (state.mode !== "launching") return;
  state.mode = "locked";
  state.lockedPrice = state.price;
  state.peakPrice = state.price;
  stopEngine();
  playLockSound();
  finishRun(true);
}

function explode() {
  if (state.mode !== "launching") return;
  state.mode = "exploded";
  state.peakPrice = state.price;
  state.explosionTime = 0;
  state.screenShake = 24;
  spawnExplosionParticles();
  stopEngine();
  playExplosionSound();
  finishRun(false);
}

function finishRun(success) {
  const price = success ? state.lockedPrice : state.peakPrice;
  const rank = rankForPrice(success ? state.lockedPrice : 0);
  const score = success ? Math.round(Math.log10(Math.max(1, state.lockedPrice / START_PRICE)) * 5000 + state.stability * 20) : 0;
  els.button.classList.remove("is-critical");
  els.button.innerHTML = "<span>LAUNCH AGAIN</span><small>New instability seed</small>";
  els.resultEyebrow.textContent = success ? "Price Locked // Flight Preserved" : "Reactor Lost // Lore Survives";
  els.resultTitle.textContent = success ? `${rank}: ${money(state.lockedPrice)}` : `Unstable at ${money(state.peakPrice)}`;
  els.resultText.textContent = success
    ? state.lockedPrice >= 30000
      ? "You crossed the $30K lore horizon and brought the reactor home. Absolute emerald aura."
      : "A clean lock. The rocket lives to chase a higher stratum."
    : "Velocity won this round. The launch price was simulated, the explosion was extremely real to the crew.";
  els.resultStats.hidden = false;
  els.resultStats.innerHTML = `
    <div><strong>${money(price)}</strong><small>${success ? "locked" : "peak"}</small></div>
    <div><strong>${state.velocity.toFixed(2)}x</strong><small>velocity</small></div>
    <div><strong>${formatScore(score)}</strong><small>score</small></div>
  `;
  window.EmeraldArcade?.recordAndNotify("unstableLaunch", {
    score,
    rank,
    lockedPrice: success ? state.lockedPrice : 0,
    peakPrice: state.peakPrice,
    played: true,
  });
  loadBest();
}

function update(delta) {
  const speed = state.mode === "launching" ? 190 + Math.log10(Math.max(1, state.price)) * 95 : 55;
  state.backgroundOffset = (state.backgroundOffset + speed * delta) % canvas.height;
  updateShards(delta, speed);

  if (state.mode === "launching") {
    state.elapsed += delta;
    const growth = 0.72 + Math.min(0.19, state.elapsed * 0.009);
    state.price = START_PRICE * Math.exp(state.elapsed * growth);
    state.peakPrice = Math.max(state.peakPrice, state.price);
    state.velocity = 1 + Math.log10(state.price / START_PRICE) * 2.45;
    const progress = Math.log(state.price / START_PRICE) / Math.log(state.crashPrice / START_PRICE);
    const warningNoise = Math.sin(state.elapsed * 11) * Math.max(0, progress - 0.62) * 8;
    state.stability = clamp(104 - progress * 100 + warningNoise, 0, 100);
    if (state.price >= state.crashPrice) explode();
  }

  if (state.mode === "exploded") {
    state.explosionTime += delta;
    state.screenShake *= Math.pow(0.04, delta);
  }
  updateParticles(delta);
  updateHud();
}

function updateHud() {
  els.price.textContent = money(state.price);
  els.velocity.textContent = `${state.velocity.toFixed(2)}x launch velocity`;
  els.stability.textContent = `${Math.round(state.stability)}%`;
  els.stabilityBar.style.transform = `scaleX(${state.stability / 100})`;
  const critical = state.mode === "launching" && state.stability < 34;
  els.button.classList.toggle("is-critical", critical);
  if (state.mode === "ready") els.status.textContent = "Reactor standing by.";
  else if (state.mode === "locked") els.status.textContent = "Flight stabilized. Price capsule secured.";
  else if (state.mode === "exploded") els.status.textContent = "Critical fracture. Reactor signal lost.";
  else if (state.stability < 18) els.status.textContent = "EVACUATE OR LOCK. CORE FRACTURE IMMINENT.";
  else if (state.stability < 42) els.status.textContent = "Warning: launch velocity is violently unstable.";
  else if (state.price >= 30000) els.status.textContent = "$30K lore horizon breached. Aura levels unmeasurable.";
  else if (state.price >= 1000) els.status.textContent = "Deep-chain trajectory. Reactor pressure climbing.";
  else els.status.textContent = "Emerald corridor nominal.";
  updateTimeline();
}

function updateTimeline() {
  const nodes = [...els.timeline.querySelectorAll(".milestone")];
  let crossed = 0;
  nodes.forEach((node, index) => {
    const active = state.price >= Number(node.dataset.price);
    node.classList.toggle("is-crossed", active);
    node.classList.toggle("is-current", active && (index === nodes.length - 1 || state.price < Number(nodes[index + 1].dataset.price)));
    if (active) crossed = index + 1;
  });
  els.timelineProgress.style.height = `${nodes.length ? (crossed / nodes.length) * 96 : 0}%`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  if (state.screenShake > 0.2) {
    ctx.translate((Math.random() - 0.5) * state.screenShake, (Math.random() - 0.5) * state.screenShake);
  }
  drawInfiniteSpace();
  drawSpeedLines();
  drawShards();
  drawRocket();
  drawParticles();
  drawVignette();
  ctx.restore();
}

function drawInfiniteSpace() {
  if (!background.complete || !background.naturalWidth) {
    ctx.fillStyle = "#010b07";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  for (let i = -1; i <= 1; i += 1) {
    const y = i * canvas.height + state.backgroundOffset;
    drawCover(background, 0, y, canvas.width, canvas.height);
  }
  const veil = ctx.createLinearGradient(0, 0, canvas.width, 0);
  veil.addColorStop(0, "rgba(0,0,0,.2)");
  veil.addColorStop(0.5, "rgba(0,8,5,.38)");
  veil.addColorStop(1, "rgba(0,0,0,.2)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawRocket() {
  if (state.mode === "exploded" && state.explosionTime > 0.08) {
    drawExplosion();
    return;
  }
  if (!rocketSheet) return;
  let frame = 0;
  if (state.mode === "launching") frame = state.stability < 32 ? 2 : 1;
  if (state.mode === "locked") frame = 3;
  const cellW = rocketSheet.width / 2;
  const cellH = rocketSheet.height / 2;
  const col = frame % 2;
  const row = Math.floor(frame / 2);
  const bob = Math.sin(performance.now() / 90) * (state.mode === "launching" ? 5 : 2);
  const scale = state.mode === "launching" ? 1 + Math.min(0.1, state.velocity * 0.005) : 1;
  const w = 245 * scale;
  const h = 245 * scale;
  ctx.save();
  ctx.shadowColor = state.stability < 32 ? "#ff6c58" : "#2aff9d";
  ctx.shadowBlur = 28;
  ctx.drawImage(rocketSheet, col * cellW, row * cellH, cellW, cellH, canvas.width / 2 - w / 2, canvas.height * 0.52 - h / 2 + bob, w, h);
  ctx.restore();
}

function drawExplosion() {
  if (!explosionSheet) return;
  const frame = Math.min(3, Math.floor(state.explosionTime / 0.13));
  const cellW = explosionSheet.width / 2;
  const cellH = explosionSheet.height / 2;
  const col = frame % 2;
  const row = Math.floor(frame / 2);
  const size = 220 + frame * 75;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(explosionSheet, col * cellW, row * cellH, cellW, cellH, canvas.width / 2 - size / 2, canvas.height * 0.52 - size / 2, size, size);
  ctx.restore();
}

function drawCover(image, x, y, w, h) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function drawSpeedLines() {
  if (state.mode !== "launching") return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.42, state.velocity * 0.045);
  ctx.strokeStyle = "#a0ffda";
  ctx.lineWidth = 2;
  for (let i = 0; i < 20; i += 1) {
    const x = (i * 211 + state.elapsed * 190) % canvas.width;
    const y = (i * 97 + state.backgroundOffset * 2) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 35 + state.velocity * 7);
    ctx.stroke();
  }
  ctx.restore();
}

function makeShard(index, initial = false) {
  return {
    x: Math.random() * canvas.width,
    y: initial ? Math.random() * canvas.height : -80,
    size: 5 + Math.random() * 18,
    speed: 0.3 + Math.random() * 1.7,
    drift: (Math.random() - 0.5) * 32,
    spin: Math.random() * Math.PI,
    tone: index % 7 === 0 ? "gold" : "green",
  };
}

function updateShards(delta, worldSpeed) {
  shards.forEach((shard, index) => {
    shard.y += worldSpeed * shard.speed * delta;
    shard.x += shard.drift * delta;
    shard.spin += delta * (1 + shard.speed);
    if (shard.y > canvas.height + 90 || shard.x < -80 || shard.x > canvas.width + 80) Object.assign(shard, makeShard(index));
  });
}

function drawShards() {
  for (const shard of shards) {
    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(shard.spin);
    ctx.globalAlpha = 0.28 + shard.speed * 0.28;
    ctx.fillStyle = shard.tone === "gold" ? "#e9c369" : "#39ffa5";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = shard.size;
    ctx.beginPath();
    ctx.moveTo(0, -shard.size);
    ctx.lineTo(shard.size * 0.48, 0);
    ctx.lineTo(0, shard.size);
    ctx.lineTo(-shard.size * 0.48, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function spawnExplosionParticles() {
  for (let i = 0; i < 70; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 360;
    particles.push({
      x: canvas.width / 2,
      y: canvas.height * 0.52,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.7 + Math.random() * 0.9,
      size: 2 + Math.random() * 8,
    });
  }
}

function updateParticles(delta) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.vy += 35 * delta;
    p.life -= delta;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life);
    ctx.fillStyle = Math.random() > 0.25 ? "#42ffa8" : "#ffd47b";
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.restore();
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 140, canvas.width / 2, canvas.height / 2, 720);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,.72)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function rankForPrice(price) {
  if (price >= 1000000) return "Beyond Canon";
  if (price >= 100000) return "Emerald Singularity";
  if (price >= 30000) return "Lore Horizon";
  if (price >= 10000) return "Ancient Navigator";
  if (price >= 1000) return "Chainbreaker";
  if (price >= 100) return "Emerald Pilot";
  if (price > 0) return "Reactor Cadet";
  return "Ground Crew";
}

function money(value) {
  if (!value) return "$0.00";
  if (value < 1000) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value < 1000000) return `$${(value / 1000).toFixed(value < 10000 ? 2 : 1)}K`;
  return `$${(value / 1000000).toFixed(2)}M`;
}

function formatScore(value) {
  return Math.max(0, value).toLocaleString();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ensureAudio() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function startEngine() {
  const audio = ensureAudio();
  stopEngine();
  engineOscillator = audio.createOscillator();
  engineGain = audio.createGain();
  engineOscillator.type = "sawtooth";
  engineOscillator.frequency.setValueAtTime(48, audio.currentTime);
  engineOscillator.frequency.exponentialRampToValueAtTime(130, audio.currentTime + 12);
  engineGain.gain.setValueAtTime(0.0001, audio.currentTime);
  engineGain.gain.exponentialRampToValueAtTime(0.055, audio.currentTime + 0.18);
  engineOscillator.connect(engineGain).connect(audio.destination);
  engineOscillator.start();
}

function stopEngine() {
  if (!engineOscillator || !audioContext) return;
  engineGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.08);
  engineOscillator.stop(audioContext.currentTime + 0.1);
  engineOscillator = null;
}

function playTone(frequency, duration, type = "sine", volume = 0.08, delay = 0) {
  const audio = ensureAudio();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, audio.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(volume, audio.currentTime + delay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + delay + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(audio.currentTime + delay);
  osc.stop(audio.currentTime + delay + duration + 0.03);
}

function playLockSound() {
  playTone(392, 0.3, "sine", 0.08);
  playTone(587, 0.38, "sine", 0.07, 0.08);
  playTone(784, 0.5, "triangle", 0.06, 0.16);
}

function playExplosionSound() {
  playTone(90, 0.7, "sawtooth", 0.12);
  playTone(46, 0.95, "square", 0.08, 0.06);
}

function handleAction() {
  if (state.mode === "launching") lockPrice();
  else startLaunch();
}

function loop(now) {
  const delta = Math.min(0.033, (now - state.lastFrame) / 1000);
  state.lastFrame = now;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

els.button.addEventListener("click", handleAction);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    handleAction();
  }
});

rocketSource.addEventListener("load", () => { rocketSheet = rocketSource; });
explosionSource.addEventListener("load", () => { explosionSheet = explosionSource; });
buildTimeline();
loadBest();
updateHud();
requestAnimationFrame(loop);
