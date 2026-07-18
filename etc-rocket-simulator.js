const canvas = document.querySelector("#rocketCanvas");
const ctx = canvas.getContext("2d");
const SAVE_KEY = "etc-rocket-simulator-v1";

const els = {
  launch: document.querySelector("#launchButton"),
  upgrades: document.querySelector("#upgradeList"),
  shards: document.querySelector("#shardBalance"),
  rocketClass: document.querySelector("#rocketClass"),
  distance: document.querySelector("#distanceLabel"),
  zone: document.querySelector("#zoneLabel"),
  speed: document.querySelector("#speedLabel"),
  record: document.querySelector("#recordLabel"),
  fuelBar: document.querySelector("#fuelBar"),
  heatBar: document.querySelector("#heatBar"),
  hullBar: document.querySelector("#hullBar"),
  fuel: document.querySelector("#fuelLabel"),
  heat: document.querySelector("#heatLabel"),
  hull: document.querySelector("#hullLabel"),
  missionEyebrow: document.querySelector("#missionEyebrow"),
  missionTitle: document.querySelector("#missionTitle"),
  missionText: document.querySelector("#missionText"),
  missionReward: document.querySelector("#missionReward"),
  sectorTransition: document.querySelector("#sectorTransition"),
  sectorTransitionName: document.querySelector("#sectorTransitionName"),
};

const upgradeDefs = {
  engine: { name: "Emerald Engine", copy: "More thrust and distance speed.", base: 90 },
  fuel: { name: "Fuel Lattice", copy: "Extends expedition duration.", base: 75 },
  frame: { name: "Obsidian Frame", copy: "Supports higher velocity and mass.", base: 105 },
  cooling: { name: "Void Cooling", copy: "Controls reactor heat buildup.", base: 95 },
  nav: { name: "Ancient Guidance", copy: "Improves distance efficiency.", base: 120 },
  magnet: { name: "Shard Magnet", copy: "Multiplies automatic salvage.", base: 110 },
};

const zones = [
  { at: 0, name: "Low Orbit", asset: "sector-low-orbit.webp" },
  { at: 800, name: "Emerald Belt", asset: "sector-emerald-belt.webp" },
  { at: 3000, name: "Ancient Satellite Field", asset: "sector-ancient-satellite-field.webp" },
  { at: 9000, name: "Crystal Moon", asset: "sector-crystal-moon.webp" },
  { at: 22000, name: "Chain Nebula", asset: "sector-chain-nebula.webp" },
  { at: 50000, name: "KEK Constellation", asset: "sector-kek-constellation.webp" },
  { at: 100000, name: "Origin Flame Star", asset: "sector-origin-flame-star.webp" },
  { at: 250000, name: "Emerald Singularity", asset: "sector-emerald-singularity.webp" },
  { at: 750000, name: "Beyond Canon", asset: "sector-beyond-canon.webp" },
];

const background = new Image();
background.src = "assets/etc-rocket-simulator/deep-space.png";
const sectorBackgrounds = Array(zones.length).fill(null);
const requestedSectorQa = Number(new URLSearchParams(location.search).get("sectorqa"));
const sectorQaIndex = Number.isInteger(requestedSectorQa) && requestedSectorQa >= 0 && requestedSectorQa < zones.length
  ? requestedSectorQa
  : -1;
let sectorTransitionTimer;
const rockets = new Image();
rockets.src = "assets/etc-rocket-simulator/rocket-tiers.png";
const salvage = new Image();
salvage.src = "assets/etc-rocket-simulator/salvage.png";
const explosion = new Image();
explosion.src = "assets/etc-unstable-launch/emerald-explosion-sheet.png";

const save = loadSave();
const stars = Array.from({ length: 60 }, () => makeStar(true));
const rewardDrops = [];
const state = {
  mode: "ready",
  distance: 0,
  velocity: 0,
  fuel: 100,
  heat: 0,
  hull: 100,
  elapsed: 0,
  scroll: 0,
  failureTime: 0,
  failureReason: "",
  zoneIndex: 0,
  lastFrame: performance.now(),
};

function ensureSectorBackground(index) {
  if (index < 0 || index >= zones.length) return null;
  if (!sectorBackgrounds[index]) {
    const image = new Image();
    image.decoding = "async";
    image.src = `assets/etc-rocket-simulator/${zones[index].asset}`;
    sectorBackgrounds[index] = image;
  }
  return sectorBackgrounds[index];
}

ensureSectorBackground(0);
ensureSectorBackground(1);

function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    return {
      shards: Number(saved?.shards || 180),
      bestDistance: Number(saved?.bestDistance || 0),
      runs: Number(saved?.runs || 0),
      upgrades: Object.fromEntries(Object.keys(upgradeDefs).map((key) => [key, Math.max(1, Number(saved?.upgrades?.[key] || 1))])),
    };
  } catch {
    return { shards: 180, bestDistance: 0, runs: 0, upgrades: Object.fromEntries(Object.keys(upgradeDefs).map((key) => [key, 1])) };
  }
}

function persist() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function upgradeCost(key) {
  return Math.round(upgradeDefs[key].base * Math.pow(1.52, save.upgrades[key] - 1));
}

function buyUpgrade(key) {
  if (state.mode === "flying") return;
  const cost = upgradeCost(key);
  if (save.shards < cost) return;
  save.shards -= cost;
  save.upgrades[key] += 1;
  persist();
  renderHangar();
  playTone(620, 0.12);
  window.ArcadePet?.celebrate();
}

function renderHangar() {
  els.upgrades.innerHTML = "";
  for (const [key, def] of Object.entries(upgradeDefs)) {
    const cost = upgradeCost(key);
    const card = document.createElement("article");
    card.className = "upgrade-card";
    card.innerHTML = `
      <div><h3>${def.name}</h3><span class="level">Level ${save.upgrades[key]}</span></div>
      <button type="button" data-upgrade="${key}" ${state.mode === "flying" || save.shards < cost ? "disabled" : ""}>${cost} ◆</button>
      <p>${def.copy}</p>
    `;
    els.upgrades.appendChild(card);
  }
  els.shards.textContent = Math.floor(save.shards).toLocaleString();
  els.rocketClass.textContent = rocketClass();
  els.record.textContent = distanceText(save.bestDistance);
}

function rocketClass() {
  const total = Object.values(save.upgrades).reduce((sum, level) => sum + level, 0);
  if (total >= 42) return "Origin Ark IV";
  if (total >= 27) return "Relic Cruiser III";
  if (total >= 16) return "Vault Strider II";
  return "Pathfinder I";
}

function rocketTier() {
  const total = Object.values(save.upgrades).reduce((sum, level) => sum + level, 0);
  return total >= 42 ? 3 : total >= 27 ? 2 : total >= 16 ? 1 : 0;
}

function launch() {
  if (state.mode === "flying") return;
  window.EmeraldArcade?.beginSession("rocketSimulator", "etc-rocket-simulator.html");
  Object.assign(state, {
    mode: "flying",
    distance: 0,
    velocity: 0,
    fuel: 100,
    heat: 0,
    hull: 100,
    elapsed: 0,
    failureTime: 0,
    failureReason: "",
    zoneIndex: 0,
  });
  rewardDrops.length = 0;
  els.launch.disabled = true;
  els.launch.innerHTML = "<span>EXPEDITION ACTIVE</span><small>Telemetry is automatic</small>";
  els.missionEyebrow.textContent = "Live Expedition";
  els.missionTitle.textContent = "The stars are getting closer.";
  els.missionText.textContent = "Fuel, cooling, and structural support determine where this build reaches its limit.";
  els.missionReward.hidden = true;
  renderHangar();
  playTone(110, 0.4, "sawtooth", 0.06);
}

function updateFlight(delta) {
  if (state.mode !== "flying") return;
  state.elapsed += delta;
  const u = save.upgrades;
  const thrust = 120 + u.engine * 42;
  const efficiency = 1 + u.nav * 0.12;
  const support = 900 + u.frame * 760;
  const cooling = 4.8 + u.cooling * 1.3;
  const capacity = 20 + u.fuel * 7.5;
  state.velocity += (thrust / 85) * delta;
  state.velocity = Math.min(state.velocity, 65 + u.engine * 38);
  state.distance += state.velocity * efficiency * delta * 10;
  const reachedZone = zoneIndexFor(state.distance);
  if (reachedZone !== state.zoneIndex) {
    state.zoneIndex = reachedZone;
    ensureSectorBackground(reachedZone + 1);
    showSectorTransition(zones[reachedZone].name);
  }
  state.fuel -= (100 / capacity) * delta;
  state.heat += Math.max(0.1, state.velocity / (75 + cooling * 4)) * delta * 5.2;
  state.heat = Math.max(0, state.heat - cooling * delta * 0.24);
  const stress = Math.max(0, state.velocity * state.velocity - support);
  state.hull -= stress / Math.max(1200, support * 1.35) * delta * 8;

  if (state.fuel <= 0) endFlight("Fuel lattice exhausted");
  else if (state.heat >= 100) endFlight("Reactor heat exceeded cooling");
  else if (state.hull <= 0) endFlight("Frame could not support velocity");
}

function endFlight(reason) {
  state.mode = "destroyed";
  state.failureReason = reason;
  state.failureTime = 0;
  const newRecord = state.distance > save.bestDistance;
  save.bestDistance = Math.max(save.bestDistance, state.distance);
  save.runs += 1;
  const base = 35 + Math.sqrt(state.distance) * 3.5;
  const petBonus = window.ArcadePet?.activeBonus("rocketSimulator");
  const petMultiplier = Number(petBonus?.salvageMultiplier || 1);
  const reward = Math.max(25, Math.round(base * (1 + save.upgrades.magnet * 0.13) * petMultiplier));
  save.shards += reward;
  persist();
  for (let i = 0; i < Math.min(42, 12 + Math.floor(Math.sqrt(reward))); i += 1) rewardDrops.push(makeRewardDrop(i));
  const rank = rankForDistance(state.distance);
  const score = Math.round(state.distance);
  window.EmeraldArcade?.recordAndNotify("rocketSimulator", { score, rank, distance: state.distance, shards: reward, played: true });
  window.ArcadePet?.addAura(Math.max(1, Math.floor(Math.log10(Math.max(10, state.distance)) * 2)));
  if (petMultiplier > 1) window.ArcadePet?.showAssist("rocketSimulator", true);
  els.launch.disabled = false;
  els.launch.innerHTML = "<span>LAUNCH UPGRADED ROCKET</span><small>Spend salvage, then go farther</small>";
  els.missionEyebrow.textContent = newRecord ? "New Expedition Record" : "Salvage Secured";
  els.missionTitle.textContent = `${reason} at ${distanceText(state.distance)}.`;
  els.missionText.textContent = "The recovery drones banked every shard. Upgrade the weakest system and launch again.";
  els.missionReward.hidden = false;
  els.missionReward.innerHTML = `
    <div><strong>+${reward} ◆</strong><small>salvaged</small></div>
    <div><strong>${rank}</strong><small>expedition rank</small></div>
    <div><strong>${zoneFor(state.distance)}</strong><small>furthest sector</small></div>
    ${petMultiplier > 1 ? `<div><strong>+${Math.round((petMultiplier - 1) * 100)}%</strong><small>${petBonus.petName} assist</small></div>` : ""}
  `;
  renderHangar();
  playTone(70, 0.8, "sawtooth", 0.11);
}

function update(delta) {
  updateFlight(delta);
  const scrollSpeed = state.mode === "flying" ? 90 + state.velocity * 4 : 28;
  state.scroll = (state.scroll + scrollSpeed * delta) % canvas.height;
  stars.forEach((star) => {
    star.y += scrollSpeed * star.depth * delta;
    if (star.y > canvas.height + 20) Object.assign(star, makeStar(false));
  });
  rewardDrops.forEach((drop) => {
    drop.y += drop.speed * delta;
    drop.spin += delta * 2;
  });
  if (state.mode === "destroyed") state.failureTime += delta;
  updateHud();
}

function updateHud() {
  els.distance.textContent = distanceText(state.distance);
  els.zone.textContent = zoneFor(state.distance);
  els.speed.textContent = `${state.velocity.toFixed(1)} km/s`;
  els.fuel.textContent = `${Math.max(0, Math.round(state.fuel))}%`;
  els.heat.textContent = `${Math.min(100, Math.round(state.heat))}%`;
  els.hull.textContent = `${Math.max(0, Math.round(state.hull))}%`;
  els.fuelBar.style.transform = `scaleX(${clamp(state.fuel / 100, 0, 1)})`;
  els.heatBar.style.transform = `scaleX(${clamp(state.heat / 100, 0, 1)})`;
  els.hullBar.style.transform = `scaleX(${clamp(state.hull / 100, 0, 1)})`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSpace();
  drawStars();
  drawRocket();
  drawRewards();
  drawVignette();
}

function drawSpace() {
  const visualDistance = sectorQaIndex >= 0 ? zones[sectorQaIndex].at : state.distance;
  const currentIndex = sectorQaIndex >= 0 ? sectorQaIndex : zoneIndexFor(visualDistance);
  const currentBackground = ensureSectorBackground(currentIndex);
  const nextBackground = ensureSectorBackground(currentIndex + 1);
  const currentReady = currentBackground?.complete && currentBackground.naturalWidth;
  const fallbackReady = background.complete && background.naturalWidth;
  if (!currentReady && !fallbackReady) {
    ctx.fillStyle = "#010806";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  drawScrollingBackground(currentReady ? currentBackground : background, 1);
  const blend = sectorBlendFor(visualDistance, currentIndex);
  if (blend > 0 && nextBackground?.complete && nextBackground.naturalWidth) {
    drawScrollingBackground(nextBackground, blend);
  }
  ctx.fillStyle = "rgba(0,8,5,.22)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawScrollingBackground(image, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = -1; i <= 1; i += 1) {
    drawCover(image, 0, i * canvas.height + state.scroll, canvas.width, canvas.height);
  }
  ctx.restore();
}

function sectorBlendFor(distance, index) {
  const current = zones[index];
  const next = zones[index + 1];
  if (!current || !next) return 0;
  const progress = clamp((distance - current.at) / Math.max(1, next.at - current.at), 0, 1);
  const transition = clamp((progress - 0.72) / 0.28, 0, 1);
  return transition * transition * (3 - 2 * transition);
}

function drawRocket() {
  if (!rockets.complete || !rockets.naturalWidth) return;
  if (state.mode === "destroyed" && state.failureTime > 0.08) {
    drawExplosion();
    return;
  }
  const frame = rocketTier();
  const cw = rockets.naturalWidth / 2;
  const ch = rockets.naturalHeight / 2;
  const col = frame % 2;
  const row = Math.floor(frame / 2);
  const bob = Math.sin(performance.now() / 90) * (state.mode === "flying" ? 5 : 2);
  const size = 280 + frame * 18;
  ctx.save();
  ctx.shadowColor = "#36f2a1";
  ctx.shadowBlur = 30;
  ctx.drawImage(rockets, col * cw, row * ch, cw, ch, canvas.width / 2 - size / 2, canvas.height * .53 - size / 2 + bob, size, size);
  ctx.restore();
}

function drawExplosion() {
  if (!explosion.complete || !explosion.naturalWidth) return;
  const frame = Math.min(3, Math.floor(state.failureTime / .13));
  const cw = explosion.naturalWidth / 2;
  const ch = explosion.naturalHeight / 2;
  const size = 260 + frame * 75;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(explosion, (frame % 2) * cw, Math.floor(frame / 2) * ch, cw, ch, canvas.width / 2 - size / 2, canvas.height * .53 - size / 2, size, size);
  ctx.restore();
}

function drawRewards() {
  if (!salvage.complete || !salvage.naturalWidth) return;
  const cw = salvage.naturalWidth / 3;
  const ch = salvage.naturalHeight / 2;
  for (const drop of rewardDrops) {
    const frame = drop.frame;
    ctx.save();
    ctx.globalAlpha = clamp(1 - Math.max(0, drop.y - canvas.height * .78) / 180, 0, 1);
    ctx.translate(drop.x, drop.y);
    ctx.rotate(drop.spin);
    ctx.drawImage(salvage, (frame % 3) * cw, Math.floor(frame / 3) * ch, cw, ch, -drop.size / 2, -drop.size / 2, drop.size, drop.size);
    ctx.restore();
  }
}

function makeStar(initial) {
  return { x: Math.random() * canvas.width, y: initial ? Math.random() * canvas.height : -20, depth: .3 + Math.random() * 1.5, size: 1 + Math.random() * 3 };
}

function makeRewardDrop(index) {
  return { x: canvas.width * .5 + (Math.random() - .5) * 520, y: canvas.height * .36 + Math.random() * 120, speed: 30 + Math.random() * 95, spin: Math.random() * Math.PI, size: 38 + Math.random() * 42, frame: index % 6 };
}

function drawStars() {
  ctx.fillStyle = "#aaffdb";
  for (const star of stars) {
    ctx.globalAlpha = .25 + star.depth * .35;
    ctx.fillRect(star.x, star.y, star.size, star.size * (state.mode === "flying" ? 3 + state.velocity * .05 : 1));
  }
  ctx.globalAlpha = 1;
}

function drawCover(image, x, y, w, h) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function drawVignette() {
  const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 180, canvas.width / 2, canvas.height / 2, 760);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,.72)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function zoneFor(distance) {
  return zones[zoneIndexFor(distance)].name;
}

function zoneIndexFor(distance) {
  return zones.reduce((current, zone, index) => distance >= zone.at ? index : current, 0);
}

function showSectorTransition(name) {
  if (!els.sectorTransition) return;
  els.sectorTransitionName.textContent = name;
  els.sectorTransition.classList.remove("is-visible");
  void els.sectorTransition.offsetWidth;
  els.sectorTransition.classList.add("is-visible");
  clearTimeout(sectorTransitionTimer);
  sectorTransitionTimer = setTimeout(() => els.sectorTransition.classList.remove("is-visible"), 2100);
}

function rankForDistance(distance) {
  if (distance >= 750000) return "Beyond Canon";
  if (distance >= 250000) return "Singularity Architect";
  if (distance >= 100000) return "Origin Flame Voyager";
  if (distance >= 22000) return "Chain Navigator";
  if (distance >= 3000) return "Relic Pilot";
  return "Launch Engineer";
}

function distanceText(value) {
  if (value < 1000) return `${Math.round(value).toLocaleString()} km`;
  if (value < 1000000) return `${(value / 1000).toFixed(value < 10000 ? 2 : 1)}K km`;
  return `${(value / 1000000).toFixed(2)}M km`;
}

let audioContext;
function playTone(frequency, duration, type = "sine", volume = .07) {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + .02);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
  osc.connect(gain).connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + duration + .03);
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function loop(now) {
  const delta = Math.min(.033, (now - state.lastFrame) / 1000);
  state.lastFrame = now;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

els.launch.addEventListener("click", launch);
els.upgrades.addEventListener("click", (event) => {
  const button = event.target.closest("[data-upgrade]");
  if (button) buyUpgrade(button.dataset.upgrade);
});
renderHangar();
updateHud();
requestAnimationFrame(loop);
