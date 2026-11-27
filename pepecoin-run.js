const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const stage = document.querySelector(".stage-wrap");
const royal = window.EmeraldRoyal;
const weather = window.EmeraldWeather;
const route = window.EmeraldRoute;
const rush = window.EmeraldRush;
const actTwo = window.EmeraldActTwo;

const ui = {
  score: document.querySelector("#scoreLabel"),
  shards: document.querySelector("#shardLabel"),
  combo: document.querySelector("#comboLabel"),
  comboMeter: document.querySelector("#comboMeter"),
  best: document.querySelector("#bestLabel"),
  overlay: document.querySelector("#gameOverlay"),
  title: document.querySelector("#overlayTitle"),
  text: document.querySelector("#overlayText"),
  start: document.querySelector("#startButton"),
  retry: document.querySelector("#retryRoadButton"),
  hint: document.querySelector("#tapHint"),
  market: document.querySelector("#marketPill"),
  marketLabel: document.querySelector("#marketLabel"),
  marketMeta: document.querySelector("#marketMeta"),
  sound: document.querySelector("#soundToggle"),
  jump: document.querySelector("#jumpButton"),
  goal: document.querySelector("#runGoal"),
  cosmic: document.querySelector("#cosmicStatus"),
  cosmicTitle: document.querySelector("#cosmicTitle"),
  powerIcon: document.querySelector("#powerIcon"),
  route: document.querySelector("#routeStatus"),
  routeTitle: document.querySelector("#routeTitle"),
  routeDetail: document.querySelector("#routeDetail"),
  routeProgress: document.querySelector("#routeProgress"),
  resultRoute: document.querySelector("#resultRoute"),
  rushBanner: document.querySelector("#rushBanner"),
  cosmicTime: document.querySelector("#cosmicTime"),
  cosmicMeter: document.querySelector("#cosmicMeter"),
  announcement: document.querySelector("#powerAnnouncement"),
  event: document.querySelector("#cosmicEvent"),
  eventName: document.querySelector("#eventName"),
  eventPrice: document.querySelector("#eventPrice"),
  eventCurve: document.querySelector("#eventCurve"),
  results: document.querySelector("#runResults"),
  resultBadge: document.querySelector("#resultBadge"),
  resultScore: document.querySelector("#resultScore"),
  resultDistance: document.querySelector("#resultDistance"),
  resultCombo: document.querySelector("#resultCombo"),
  resultShards: document.querySelector("#resultShards"),
  resultSmashes: document.querySelector("#resultSmashes"),
  resultStatues: document.querySelector("#resultStatues"),
  resultPeak: document.querySelector("#resultPeak"),
  resultCompare: document.querySelector("#resultCompare"),
  crashTip: document.querySelector("#crashTip"),
};

const coinImage = new Image();
coinImage.src = "assets/pepecoin-run/pepecoin-classic.png";
const statueImage = new Image();
statueImage.src = "assets/pepecoin-run/gold-frog-statue-v1.webp";
const nightImage = new Image();
nightImage.src = "assets/pepecoin-run/emerald-night-v1.webp";
const cosmicImage = new Image();
cosmicImage.src = "assets/pepecoin-run/cosmic-disco-v1.webp";
const beyondImage = new Image();
beyondImage.src = "assets/pepecoin-run/beyond-canon-v1.webp";
const crownImage = new Image();
crownImage.src = "assets/pepecoin-run/celestial-crown-v1.webp";
const skyrealmImage = new Image();
skyrealmImage.src = "assets/pepecoin-run/royal-skyrealm-v1.webp";
const auraImage = new Image();
auraImage.src = "assets/pepecoin-run/pepecoin-power-aura-v1.webp";
const rushImage = new Image();
rushImage.src = "assets/pepecoin-run/emerald-frog-statue-v1.webp";
const starrailImage = new Image(); starrailImage.src = "assets/pepecoin-run/obsidian-starrail-v1.webp";
const lunarImage = new Image(); lunarImage.src = "assets/pepecoin-run/lunar-lotus-sea-v1.webp";
const cathedralImage = new Image(); cathedralImage.src = "assets/pepecoin-run/eclipse-cathedral-v1.webp";
const cometBoardImage = new Image(); cometBoardImage.src = "assets/pepecoin-run/comet-board-v1.webp";
const bellImage = new Image(); bellImage.src = "assets/pepecoin-run/cathedral-bell-v1.webp";
const corruptWorldImage = new Image(); corruptWorldImage.src = "assets/pepecoin-run/corrupt-frontier-v1.webp";
const volcanicWorldImage = new Image(); volcanicWorldImage.src = "assets/pepecoin-run/volcanic-forge-v1.webp";
const roadImage = new Image();
roadImage.src = "assets/pepecoin-run/jade-track-v1.webp";
const shardImage = new Image();
shardImage.src = "assets/pepecoin-run/emerald-shard-v1.webp";
const corruptImage = new Image();
corruptImage.src = "assets/pepecoin-run/corrupt-shard-v1.webp";
let roadPattern;
const CRYSTAL_CROPS = { emerald: [35, 8, 63, 181], corrupt: [21, 17, 114, 189] };
const COSMIC_SECONDS = 8;
const COSMIC_SPEED = 1.35;
const BOOST_COOLDOWN = .8;
const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

const W = canvas.width;
const H = canvas.height;
const STORAGE_KEY = "pepecoin-emerald-run-v1";
function readBest() {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  } catch { return 0; }
}
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
  jumpBuffer: 0,
  peakCombo: 1,
  best: readBest(),
  shake: 0,
  flash: 0,
  sound: true,
  lastFrame: null,
  cosmicTime: 0,
  boost: 0,
  cosmicBlend: 0,
  smashed: 0,
  cosmicWarned: false,
  cosmicBeat: -1,
  eventAnchor: 20,
  eventPrice: 0,
  eventPeak: 0,
  eventStage: "",
  statuesCaught: 0,
  exitPulse: 0,
  beyondBlend: 0,
  burstSmashes: 0,
  noticeText: "",
  noticeTime: 0,
  noticePriority: 0,
  lastRank: "Fresh Frog",
  passedFarthest: false,
};
royal.reset(state);
weather.reset(state);
rush.reset(state);
actTwo.reset(state);

let audioContext;
const audioVoices = new Set();
let terrainSource = createFallbackSeries();
let terrainMin = Math.min(...terrainSource);
let terrainSpan = Math.max(.001, Math.max(...terrainSource) - terrainMin);
let terrainIsLive = false;
let pendingMarket = null;
let courseEnd = 760;
let lastHazardX = -Infinity;
let runId = 0;
let marketPrice = null;
let marketChange = null;
let marketHudClock = 0;
const hazards = [];
const emeralds = [];
const particles = [];
const statues = [];
const statueClearances = [];
const crowns = [];
const crownClearances = [];
const rushStatues = [];
const rushClearances = [];
let nextRushX = route.opening.rush;
let nextCrownX = route.opening.crown;
let nextStatueX = route.opening.statue;
let currentRoad = null;
let terrainMeta = "offline market simulation";
let courseRandom = seededRandom(1);

function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

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
    if (cached?.at > Date.now() - 30 * 60 * 1000 && validMarketSeries(cached.prices) && cached.prices.length >= 24) {
      applyMarketSeries(cached.prices, true, "cached market tape");
      return;
    }
  } catch { /* continue to network */ }

  try {
    const response = await fetch("https://api.coingecko.com/api/v3/coins/ethereum-classic/market_chart?vs_currency=usd&days=1&precision=4", { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Market response ${response.status}`);
    const body = await response.json();
    const prices = body.prices?.map((point) => Number(point[1])).filter(Number.isFinite);
    if (!validMarketSeries(prices) || prices.length < 24) throw new Error("Not enough market points");
    try { localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), prices })); } catch { /* usable data does not depend on cache writes */ }
    applyMarketSeries(prices, true, "recent 24h price tape");
  } catch {
    applyMarketSeries(terrainSource, false, "offline market simulation");
  }
}

function validMarketSeries(prices) {
  return Array.isArray(prices) && prices.length >= 2 && prices.length <= 10000 && prices.every(value => Number.isFinite(value) && value > 0);
}

function applyMarketSeries(prices, isLive, meta, restoreSnapshot = false) {
  if (!validMarketSeries(prices)) return false;
  if (state.mode === "running") {
    pendingMarket = { prices: prices.slice(), isLive, meta };
    return;
  }
  if (!restoreSnapshot) pendingMarket = null;
  terrainSource = prices.slice();
  terrainMin = Math.min(...terrainSource);
  terrainSpan = Math.max(.001, Math.max(...terrainSource) - terrainMin);
  terrainIsLive = isLive;
  terrainMeta = meta;
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
  const a = (terrainSource[i] - terrainMin) / terrainSpan;
  const b = (terrainSource[next] - terrainMin) / terrainSpan;
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

function startGame({ sameRoad = false } = {}) {
  if (state.mode === "running" || window.EmeraldArcade?.isPaused?.()) return;
  const repeating = sameRoad && currentRoad !== null;
  if (repeating) {
    // Data can arrive while the result screen is open. Preserve that newer tape
    // for New Road before restoring the practiced road's snapshot.
    if (!pendingMarket && (terrainIsLive !== currentRoad.isLive || terrainSource.length !== currentRoad.prices.length || terrainSource.some((price, i) => price !== currentRoad.prices[i]))) {
      pendingMarket = { prices: terrainSource.slice(), isLive: terrainIsLive, meta: terrainMeta };
    }
    applyMarketSeries(currentRoad.prices, currentRoad.isLive, currentRoad.meta, true);
    currentRoad.attempt += 1;
  } else if (pendingMarket) {
    const next = pendingMarket;
    pendingMarket = null;
    applyMarketSeries(next.prices, next.isLive, next.meta);
  }
  if (!repeating) {
    const seed = ((Math.floor(Math.random() * 4294967296) >>> 0) ^ Math.imul(runId + 1, 0x9e3779b9)) >>> 0;
    currentRoad = { seed, prices: terrainSource.slice(), isLive: terrainIsLive, meta: terrainMeta, attempt: 1, best: 0, farthestDistance: 0, lastResult: null };
  }
  courseRandom = seededRandom(currentRoad.seed);
  courseEnd = 760;
  lastHazardX = -Infinity;
  nextStatueX = route.opening.statue;
  nextCrownX = route.opening.crown;
  nextRushX = route.opening.rush;
  const thisRun = ++runId;
  stopAudio();
  window.EmeraldArcade?.beginSession("pepeRun", "pepecoin-run.html");
  Object.assign(state, { mode: "running", elapsed: 0, distance: 0, speed: 310, score: 0, shards: 0, combo: 1, comboClock: 0, jumpBuffer: 0, peakCombo: 1, shake: 0, flash: 0, lastFrame: null, cosmicTime: 0, boost: 0, cosmicBlend: 0, smashed: 0, cosmicWarned: false, cosmicBeat: -1, eventAnchor: 20, eventPrice: 0, eventPeak: 0, eventStage: "", statuesCaught: 0, exitPulse: 0, beyondBlend: 0, burstSmashes: 0, noticeText: "", noticeTime: 0, noticePriority: 0, lastRank: "Fresh Frog", passedFarthest: false });
  ui.results.hidden = true;
  royal.reset(state);
  weather.reset(state);
  rush.reset(state);
  actTwo.reset(state);
  state.corruptWorldBlend = 0; state.volcanicWorldBlend = 0;
  state.routeId = "valley";
  ui.retry.hidden = true;
  ui.overlay.classList.remove("is-results");
  hazards.length = 0;
  emeralds.length = 0;
  particles.length = 0;
  statues.length = 0;
  statueClearances.length = 0;
  crowns.length = 0;
  crownClearances.length = 0;
  rushStatues.length = 0;
  rushClearances.length = 0;
  ui.announcement.textContent = "";
  player.vy = 0;
  player.rotation = 0;
  player.grounded = true;
  player.y = terrainAt(player.x) - player.radius;
  buildCourse();
  if (repeating) showMilestone(`SAME ROAD · Attempt ${currentRoad.attempt}`, 2, 1);
  updateMarketPlayback(0, true);
  ui.overlay.classList.add("is-hidden");
  ui.hint.classList.add("is-visible");
  window.setTimeout(() => { if (runId === thisRun) ui.hint.classList.remove("is-visible"); }, 2100);
  updateHud();
  canvas.focus();
  tone(280, .05, "sine");
}

function buildCourse() {
  const horizon = state.distance + 9000;
  // Reserve a full landing approach before each ground-level reward. Plan the
  // same lead beyond the horizon so generation batches cannot break clearance.
  while (nextStatueX < horizon + 650) {
    statueClearances.push(nextStatueX);
    if (nextStatueX >= state.distance - 120) statues.push({ x: nextStatueX, collected: false });
    nextStatueX += route.pickupSpacing.statue;
  }
  while (nextCrownX < horizon + 650) {
    crownClearances.push(nextCrownX);
    if (nextCrownX >= state.distance - 120) crowns.push({ x: nextCrownX, collected: false });
    nextCrownX += route.pickupSpacing.crown;
  }
  while (nextRushX < horizon + 650) {
    rushClearances.push(nextRushX);
    if (nextRushX >= state.distance - 120) rushStatues.push({ x: nextRushX, collected: false });
    nextRushX += route.pickupSpacing.rush;
  }
  for (; courseEnd < horizon; courseEnd += 310 + courseRandom() * 270) {
    const worldX = courseEnd;
    // At 570 units/s, the 690 / 1750 jump takes ~450 units to land.
    // Reserve another 100 units for a fresh tap before the next spike.
    if (courseRandom() < .68 && worldX - lastHazardX >= actTwo.hazardGap(worldX) && !pickupApproach(worldX, statueClearances) && !pickupApproach(worldX, crownClearances) && !pickupApproach(worldX, rushClearances) && !pickupApproach(worldX, route.actTwo.bells)) {
      lastHazardX = worldX;
      hazards.push({ x: worldX, width: 42 + courseRandom() * 26, height: 52 + courseRandom() * 34, hit: false });
    }
    const count = 1 + Math.floor(courseRandom() * 3);
    for (let i = 0; i < count; i += 1) {
      const shardX = worldX + 95 + i * 62;
      emeralds.push({ x: shardX, lift: 105 + Math.sin(i / Math.max(1, count - 1) * Math.PI) * 52, size: 22, spin: courseRandom() * 6, collected: false });
    }
  }
  while (statueClearances.length && statueClearances[0] < courseEnd - 210) statueClearances.shift();
  while (crownClearances.length && crownClearances[0] < courseEnd - 210) crownClearances.shift();
  while (rushClearances.length && rushClearances[0] < courseEnd - 210) rushClearances.shift();
}

function pickupApproach(worldX, reservations) {
  return reservations.some(x => worldX >= x - 650 && worldX <= x + 210);
}

function jump() {
  if (state.mode !== "running") return;
  if (actTwo.vault(state)) { tone(740, .1, "triangle"); return; }
  if (royal.soar(state)) { tone(660, .1, "sine"); return; }
  state.jumpBuffer = .12;
  performJump();
}

function performJump() {
  if (player.grounded && state.jumpBuffer > 0) {
    state.jumpBuffer = 0;
    state.moonJump = actTwo.isLunar(state.distance + player.x);
    player.vy = state.moonJump ? -580 : -690;
    player.grounded = false;
    tone(420, .07, "triangle");
    burst(player.x - 10, player.y + player.radius, "#73ffac", 8);
  }
}

function update(dt) {
  if (window.EmeraldArcade?.isPaused?.()) return;
  updateEffects(dt);
  if (state.mode !== "running") return;
  state.elapsed += dt;
  const comet = actTwo.step(state, dt, state.distance + player.x, reducedMotion?.matches);
  if (comet.launch) {
    state.railEntryLift = Math.max(0, terrainAt(state.distance + player.x) - player.radius - player.y);
    state.railLift = state.railEntryLift;
    showMilestone("COMET EXPRESS · Tap to vault on the starrail!", 2);
    ui.announcement.textContent = "Comet Express! Eight seconds of protected rail riding. Tap to vault; landing stays protected.";
    tone(620, .2, "triangle");
  }
  if (comet.eclipse) {
    rush.collect(state);
    showMilestone("EMERALD ECLIPSE · Cathedral magnet awakened!", 2);
    ui.announcement.textContent = "Emerald Eclipse! Seven seconds of wider emerald attraction. Keep jumping unless another power protects you.";
    tone(990, .2, "sine");
  }
  if (comet.warn) {
    showMilestone(`${state.railKind === "slingshot" ? "ECLIPSE" : "COMET"} LANDING · Returning to the road`, 3);
    ui.announcement.textContent = "Ride landing soon. Prepare to jump when protection ends.";
  }
  if (rush.step(state, dt)) {
    ui.announcement.textContent = "Two seconds of Emerald Rush attraction left. Purple spikes remain dangerous.";
  }
  const wasCosmic = state.cosmicTime > 0;
  state.cosmicTime = Math.max(0, state.cosmicTime - dt);
  if (wasCosmic) {
    updateCosmicEvent();
    updateCosmicMusic();
  }
  if (state.cosmicTime > 0 && state.cosmicTime <= 2 && !state.cosmicWarned) {
    state.cosmicWarned = true;
    const riding = royal.active(state) || actTwo.active(state);
    ui.announcement.textContent = riding ? "Cosmic burst ending; your ride still protects you." : "Two seconds of cosmic shield left. Get ready to jump again.";
    showMilestone(riding ? "COSMIC BURST ENDING · Ride active" : "SHIELD ENDING · Get ready to jump", 3);
    tone(440, .12, "sine");
  }
  if (wasCosmic && !state.cosmicTime) {
    stopAudio();
    ui.announcement.textContent = royal.active(state) || actTwo.active(state) ? "Cosmic burst ended. Your ride still protects you." : "Cosmic burst ending. Shield fading as you slow down.";
  }
  // Protection remains through the short deceleration, preventing an abrupt
  // speed change and an unavoidable collision at the last powered frame.
  const previousBoost = state.boost;
  state.boost = state.cosmicTime > 0 ? 1 : Math.max(0, state.boost - dt / BOOST_COOLDOWN);
  if (previousBoost > 0 && !state.boost && !royal.active(state) && !actTwo.active(state)) clearCosmicExit();
  const ride = royal.step(state, dt, reducedMotion?.matches);
  if ((ride.landed || comet.landed) && !state.boost && !royal.active(state) && !actTwo.active(state)) clearCosmicExit();
  if (ride.warn) {
    showMilestone("SKYRIDE LANDING · Returning to the road", 3);
    ui.announcement.textContent = state.boost > 0 ? "Skyride landing soon. Cosmic shield remains active." : "Skyride landing soon. Prepare to jump after landing.";
    tone(520, .12, "sine");
  }
  state.cosmicBlend += (state.boost - state.cosmicBlend) * Math.min(1, dt * 4);
  const beyondTarget = state.boost > 0 && state.cosmicTime <= COSMIC_SECONDS * .3 ? 1 : 0;
  state.beyondBlend += (beyondTarget - state.beyondBlend) * Math.min(1, dt * 5);
  state.speed = Math.min(570, 310 + state.elapsed * 7.2) * Math.max(1 + (COSMIC_SPEED - 1) * state.boost, actTwo.speedMultiplier(state));
  state.distance += state.speed * dt;
  const worldX = state.distance + player.x;
  state.corruptWorldBlend += ((worldX >= route.frontier.start && worldX < route.frontier.volcanic ? 1 : 0) - state.corruptWorldBlend) * Math.min(1, dt * 3);
  state.volcanicWorldBlend += ((worldX >= route.frontier.volcanic ? 1 : 0) - state.volcanicWorldBlend) * Math.min(1, dt * 3);
  const chapter = route.chapterAt(worldX);
  if (chapter.id !== state.routeId) {
    state.routeId = chapter.id;
    if (chapter.id !== "tempest") {
      const milestone = chapter.id === "beyond" ? "OPENING ROUTE COMPLETE · ACT II: OBSIDIAN STARRAIL!"
        : chapter.id === "corrupt" ? "ACT II COMPLETE · CORRUPT FRONTIER AWAKENS!"
        : chapter.id === "endless" ? "FRONTIER COMPLETE · Beyond the Forge!" : `${chapter.name.toUpperCase()} · Keep rolling`;
      showMilestone(milestone, ["beyond", "corrupt", "volcanic", "endless"].includes(chapter.id) ? 2 : 1);
      ui.announcement.textContent = chapter.id === "lunar" ? "Lunar Lotus Sea. Lower gravity starts with your next jump; spikes have wider spacing." : milestone;
    }
  }
  const storm = weather.step(state, dt, worldX, reducedMotion?.matches);
  if (storm.entered) {
    showMilestone("TEMPEST REACH · The opening valley gives way to rain", 2);
    ui.announcement.textContent = "Tempest Reach. Rain and distant thunder ahead. Blue auras surround the same dangerous purple spikes.";
  }
  if (storm.strike) playSynth(48, .7, "triangle", .018);
  updateMarketPlayback(dt);
  state.score += state.speed * dt * .045 * state.combo;
  state.comboClock = Math.max(0, state.comboClock - dt);
  if (!state.comboClock && state.combo > 1) state.combo = 1;

  const ground = terrainAt(state.distance + player.x) - player.radius;
  state.jumpBuffer = Math.max(0, state.jumpBuffer - dt);
  const wasGrounded = player.grounded;
  if (royal.active(state) || actTwo.active(state)) {
    let lift = Math.max(royal.active(state) ? state.rideLift : 0, actTwo.active(state) ? state.railLift : 0);
    if (actTwo.active(state) && state.railKind === "slingshot") lift = Math.min(lift, Math.max(0, ground - 145));
    player.y = ground - lift;
    state.moonJump = false;
    player.vy = 0;
    player.grounded = false;
    state.jumpBuffer = 0;
  } else {
    if (ride.landed || comet.landed) { player.y = ground; player.vy = 0; }
    player.grounded = false;
    player.vy += (state.moonJump ? 1250 : 1750) * dt;
    player.y += player.vy * dt;
    if (player.y >= ground) {
      if (!wasGrounded && player.vy > 180) burst(player.x, ground + player.radius, state.boost ? "#ffdc87" : "#96d9bb", 6);
      player.y = ground;
      player.vy = 0;
      player.grounded = true;
      state.moonJump = false;
    }
    performJump();
  }
  player.rotation += (state.speed / player.radius) * dt;

  for (const bell of state.bells) {
    if (bell.collected || bell.missed) continue;
    const x = bell.x - state.distance, y = terrainAt(bell.x) - bell.lift;
    if (distance(player.x, player.y, x, y) < player.radius + 26) ringCathedralBell(bell, x, y);
  }

  for (const statue of statues) {
    if (statue.collected) continue;
    const sx = statue.x - state.distance;
    const sy = terrainAt(statue.x) - 48;
    if (!statue.announced && sx > player.x && sx - player.x <= 900 && !protectedRide()) {
      statue.announced = true;
      ui.announcement.textContent = "Gold frog ahead. Roll into it for cosmic speed and spike smashing.";
    }
    if (distance(player.x, player.y, sx, sy) < player.radius + 34) collectStatue(statue, sx, sy);
  }

  for (const crown of crowns) {
    if (crown.collected) continue;
    const x = crown.x - state.distance;
    const y = terrainAt(crown.x) - 48;
    if (!crown.announced && x > player.x && x - player.x <= 900 && !protectedRide()) {
      crown.announced = true;
      ui.announcement.textContent = "Celestial Crown ahead. Collect it for a Royal Skyride; tap to soar.";
    }
    if (distance(player.x, player.y, x, y) < player.radius + 38) collectCrown(crown, x, y);
  }

  updateSkyride(dt);

  for (const statue of rushStatues) {
    if (statue.collected) continue;
    const x = statue.x - state.distance;
    const y = terrainAt(statue.x) - 48;
    if (distance(player.x, player.y, x, y) < player.radius + 34) collectRush(statue, x, y);
  }

  const magnetRadius = state.eclipseTime > 0 ? 360 : state.rushTime > 0 ? rush.magnetRadius : royal.active(state) ? 185 : 0;
  for (const shard of emeralds) {
    if (shard.collected) continue;
    let sx = shard.x - state.distance;
    let sy = shardHeight(shard);
    if (shard.attracted || magnetRadius > 0 && distance(player.x, player.y, sx, sy) < magnetRadius) {
      if (!shard.attracted) { shard.magnetX = sx; shard.magnetY = sy; shard.attracted = true; }
      shard.magnetX += (player.x - shard.magnetX) * Math.min(1, dt * 9);
      shard.magnetY += (player.y - shard.magnetY) * Math.min(1, dt * 9);
      sx = shard.magnetX; sy = shard.magnetY;
    }
    shard.spin += dt * 3.4;
    if (distance(player.x, player.y, sx, sy) < player.radius + shard.size) collectShard(shard, sx, sy);
  }

  for (const hazard of hazards) {
    if (hazard.hit) continue;
    const hx = hazard.x - state.distance;
    const base = terrainAt(hazard.x);
    if (circleTriangleCollision(player.x, player.y, player.radius * .72, hx, base, hazard.width, hazard.height)) {
      if (protectedRide()) smashSpike(hazard, hx, base);
      else { crash(hazard); break; }
    }
  }

  // Keep a bounded rolling course; append beyond the last generated position.
  while (hazards.length && hazards[0].x < state.distance - 120) hazards.shift();
  while (emeralds.length && emeralds[0].x < state.distance - 120) emeralds.shift();
  while (statues.length && statues[0].x < state.distance - 120) statues.shift();
  while (crowns.length && crowns[0].x < state.distance - 120) crowns.shift();
  while (rushStatues.length && rushStatues[0].x < state.distance - 120) rushStatues.shift();
  if (state.mode === "running" && courseEnd - state.distance < 4500) buildCourse();
  if (state.mode === "running") {
    if (currentRoad?.attempt > 1 && currentRoad.farthestDistance > 0 && !state.passedFarthest && state.distance > currentRoad.farthestDistance) {
      state.passedFarthest = true;
      showMilestone("NEW DISTANCE BEST · Keep rolling", 1);
    }
    const rank = rankFor(state.score);
    if (rank !== state.lastRank) {
      state.lastRank = rank;
      showMilestone(`RANK UP · ${rank}`, 1);
    }
  }
  updateHud();
}

function updateEffects(dt) {
  state.noticeTime = Math.max(0, state.noticeTime - dt);
  state.exitPulse = Math.max(0, state.exitPulse - dt);
  state.shake = Math.max(0, state.shake - dt * 32);
  state.flash = Math.max(0, state.flash - dt * 3);
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 520 * dt;
    if (p.kind === "crystal") p.rotation += p.turn * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function protectedRide() { return state.boost > 0 || royal.active(state) || actTwo.active(state); }

function collectCrown(crown, x, y) {
  if (crown.collected || state.mode !== "running") return;
  crown.collected = true;
  royal.collect(state);
  state.rideGateChain = 0;
  // Optional style targets follow this road's terrain; they never add hazards,
  // currency or a second speed multiplier.
  state.rideGates = [650, 1350, 2050].map((gap, i) => ({
    x: state.distance + player.x + gap, lift: [135, 170, 115][i], passed: false, missed: false,
  }));
  showMilestone("ROYAL SKYRIDE · Tap to soar, draw in emeralds", 2);
  ui.announcement.textContent = "Royal Skyride! Float above the road for six seconds, attract emeralds, and tap to soar. Protected landing follows.";
  burst(x, y, "#ffe1a1", 20);
  tone(1046.5, .22, "sine");
}

function collectRush(statue, x, y) {
  if (statue.collected || state.mode !== "running") return;
  statue.collected = true;
  rush.collect(state);
  showMilestone("EMERALD RUSH · Green eyes, stronger emerald attraction!", 2);
  ui.announcement.textContent = "Emerald Rush! Green eyes and seven seconds of wider emerald attraction. Keep jumping: spikes are still dangerous.";
  burst(x, y, "#71ff99", 20);
  tone(880, .2, "sine");
}

function ringCathedralBell(bell, x, y) {
  const lift = terrainAt(state.distance + player.x) - player.radius - player.y;
  if (!actTwo.ringBell(state, bell, lift)) return;
  const finale = state.bellsRung === route.actTwo.bells.length;
  showMilestone(finale ? "ECLIPSE SLINGSHOT · Three bells awaken the cathedral!" : `CATHEDRAL BELL ${state.bellsRung}/3 · Jump to ring the next`, 2);
  ui.announcement.textContent = finale ? "All three cathedral bells! Eclipse Slingshot launches you into a protected arc. Tap Surge for more lift; landing stays protected."
    : `Cathedral bell ${state.bellsRung} of three. Ring all three to awaken Eclipse Slingshot.`;
  burst(x, y, "#a8ffc2", 16);
  tone([660, 825, 990][state.bellsRung - 1], .3, "sine");
}

function updateSkyride(dt) {
  if (royal.active(state)) {
    state.rideTrailClock += dt;
    if (state.rideTrailClock >= .035) {
      state.rideTrailClock %= .035;
      state.rideTrail.push({ x: state.distance + player.x, y: player.y + player.radius + 14, age: 0 });
    }
    for (const gate of state.rideGates) {
      if (gate.passed || gate.missed) continue;
      const x = gate.x - state.distance;
      const y = terrainAt(gate.x) - player.radius - gate.lift;
      if (distance(player.x, player.y, x, y) < 65) {
        gate.passed = true;
        state.rideGateChain += 1;
        state.skyGates += 1;
        burst(x, y, "#a2f4ff", 10);
        tone(660 + state.rideGateChain * 110, .12, "triangle");
        showMilestone(state.rideGateChain === 3 ? "ROYAL GRAND TOUR · All three sky gates!" : `SKY GATE ${state.rideGateChain}/3 · Keep soaring`, 1);
      } else if (x < player.x - 65) gate.missed = true;
    }
  } else state.rideGates.length = 0;
  for (const point of state.rideTrail) point.age += dt;
  state.rideTrail = state.rideTrail.filter(point => point.age < 1.1).slice(-32);
}

function showMilestone(text, priority = 1, duration = 2.2) {
  if (state.noticeTime > 0 && state.noticePriority > priority) return;
  state.noticeText = text;
  state.noticeTime = duration;
  state.noticePriority = priority;
}

function clearCosmicExit() {
  state.exitPulse = .45;
  const before = state.smashed;
  for (const hazard of hazards) {
    const x = hazard.x - state.distance;
    if (!hazard.hit && x >= player.x - player.radius - hazard.width / 2 && x <= player.x + 210) {
      smashSpike(hazard, x, terrainAt(hazard.x));
    }
  }
  ui.announcement.textContent = state.smashed > before
    ? "Exit pulse cleared nearby spikes. Shield ended; prepare to jump again."
    : "Shield ended. Prepare to jump purple spikes again.";
  showMilestone("EXIT CLEAR · Jump purple shards again", 3);
}

function collectStatue(statue, x, y) {
  if (statue.collected || state.mode !== "running") return;
  statue.collected = true;
  state.statuesCaught += 1;
  state.burstSmashes = 0;
  state.eventAnchor = state.boost > 0 && state.eventPrice > 0 ? Math.min(1e9, state.eventPrice) : Math.min(1e9, Math.max(.01, marketPrice || 20));
  state.cosmicTime = COSMIC_SECONDS; // Refresh, never stack unbounded duration.
  state.boost = 1;
  state.cosmicWarned = false;
  state.cosmicBeat = -1;
  state.eventStage = "";
  updateCosmicEvent();
  ui.announcement.textContent = "Cosmic disco! Speed boosted 35 percent. Smash through spikes for eight seconds.";
  showMilestone("COSMIC DISCO · Smash through purple shards", 2);
  burst(x, y, "#ffdc75", 24);
  tone(880, .18, "sine");
}

function smashSpike(hazard, x, y) {
  if (hazard.hit) return;
  hazard.hit = true;
  hazard.destroyed = true;
  state.smashed += 1;
  state.burstSmashes += 1;
  if ([3, 6, 10].includes(state.burstSmashes)) showMilestone(`CRYSTAL BREAKER · ${state.burstSmashes} spikes this burst`, 1);
  const pieces = reducedMotion?.matches ? 2 : 7;
  for (let i = 0; i < pieces && particles.length < 160; i += 1) {
    particles.push({ kind: "crystal", x, y: y - hazard.height / 2,
      vx: (Math.random() - .65) * 250, vy: -100 - Math.random() * 210,
      life: .75, maxLife: .75, size: 12 + Math.random() * 14,
      rotation: i, turn: (Math.random() - .5) * 12, facet: i % 3 });
  }
  burst(x, y - hazard.height / 2, "#ffda73", 7);
  tone(220 + state.smashed % 4 * 80, .07, "triangle");
}

function collectShard(shard, x, y) {
  shard.collected = true;
  state.shards += 1;
  const previousCombo = state.combo;
  state.combo = Math.min(8, state.combo + (state.shards % 3 === 0 ? 1 : 0));
  if (state.combo > previousCombo) showMilestone(`${state.combo === 8 ? "MAX COMBO" : "COMBO UP"} · x${state.combo}`, 1, 1.4);
  state.peakCombo = Math.max(state.peakCombo, state.combo);
  state.comboClock = 3.2;
  state.score += 125 * state.combo;
  state.flash = .45;
  burst(x, y, "#70ffb0", 16);
  tone(620 + state.combo * 55, .06, "sine");
}

function crash(hazard) {
  if (state.mode !== "running") return;
  hazard.hit = true;
  state.mode = "gameover";
  stopAudio();
  state.shake = 16;
  burst(player.x, player.y, "#bf44ff", 30);
  tone(110, .28, "sawtooth");
  const finalScore = Math.floor(state.score);
  const previousResult = currentRoad?.lastResult;
  const tip = crashAdvice();
  if (currentRoad) {
    currentRoad.farthestDistance = Math.max(currentRoad.farthestDistance, state.distance);
    currentRoad.lastResult = { score: finalScore, distance: Math.floor(state.distance / 10) };
  }
  const newBest = finalScore > state.best;
  const newRoadBest = currentRoad && finalScore > currentRoad.best;
  if (currentRoad) currentRoad.best = Math.max(currentRoad.best, finalScore);
  state.best = Math.max(state.best, finalScore);
  try { localStorage.setItem(STORAGE_KEY, state.best); } catch { /* session best still works */ }
  const rank = rankFor(finalScore);
  let recordNotice = "";
  let rewardReceipt = "";
  try {
    const result = window.EmeraldArcade?.recordAndNotify("pepeRun", { score: finalScore, rank, shards: state.shards, combo: state.peakCombo, played: true });
    const receipt = [];
    if (Number.isFinite(result?.arcadeShardReward) && result.arcadeShardReward > 0) receipt.push(`+${result.arcadeShardReward} Arcade Shards`);
    if (Array.isArray(result?.unlockedBadges) && result.unlockedBadges.length) receipt.push(`${result.unlockedBadges.length} badge${result.unlockedBadges.length === 1 ? "" : "s"} earned`);
    if (receipt.length) rewardReceipt = `${receipt.join(" · ")}. `;
  } catch {
    recordNotice = " Arcade progress could not be saved.";
  }
  const thisRun = runId;
  window.setTimeout(() => {
    if (runId !== thisRun || state.mode !== "gameover") return;
    ui.title.textContent = `${rank} Run`;
    ui.text.textContent = `${rewardReceipt}${finalScore >= 18000 ? "Ancient Pepe reached. Run it back for a new best." : nextGoal(finalScore)}${recordNotice}`;
    ui.resultBadge.textContent = `${newBest ? "NEW PERSONAL BEST" : newRoadBest ? "NEW ROAD BEST" : "RUN COMPLETE"} · TRY ${currentRoad.attempt}`;
    ui.resultScore.textContent = finalScore.toLocaleString();
    ui.resultDistance.textContent = `${Math.floor(state.distance / 10).toLocaleString()}m`;
    ui.resultCombo.textContent = `x${state.peakCombo}`;
    ui.resultShards.textContent = state.shards.toLocaleString();
    ui.resultSmashes.textContent = state.smashed.toLocaleString();
    ui.resultStatues.textContent = state.statuesCaught.toLocaleString();
    const reached = route.chapterAt(state.distance + player.x);
    ui.resultRoute.textContent = state.distance + player.x >= route.frontier.end ? "Frontier complete · Beyond the Forge"
      : state.distance + player.x >= route.frontier.start ? `Act Two complete · ${reached.name} · ${Math.floor(route.frontierProgress(state.distance + player.x) * 100)}% of frontier`
      : state.distance + player.x >= route.openingEnd ? `Opening route complete · Act Two: ${reached.name} · ${Math.floor(route.actTwoProgress(state.distance + player.x) * 100)}%`
      : `Region ${reached.index + 1}/${route.chapters.length}: ${reached.name} · ${Math.floor(route.progressAt(state.distance + player.x) * 100)}% of opening route`;
    const crownResult = state.crownsCaught ? ` · ${state.crownsCaught} crown${state.crownsCaught === 1 ? "" : "s"} caught` : "";
    ui.resultPeak.textContent = (state.eventPeak ? `Simulated event peak: $${state.eventPeak.toLocaleString(undefined, { maximumFractionDigits: 2 })} · game effect` : "Catch a gold frog to start a cosmic event.") + crownResult + (state.skyGates ? ` · ${state.skyGates} sky gates` : "") + (state.rushCaught ? ` · ${state.rushCaught} emerald rushes` : "") + (state.railRuns ? ` · ${state.railRuns} Comet Express ride` : "") + (state.bellsRung ? ` · bells ${state.bellsRung}/3` : "") + (state.slingshots ? " · Eclipse Slingshot awakened" : "");
    ui.resultCompare.hidden = !previousResult;
    ui.resultCompare.textContent = previousResult
      ? `Vs previous try: ${signed(finalScore - previousResult.score)} points · ${signed(Math.floor(state.distance / 10) - previousResult.distance)}m`
      : "";
    ui.crashTip.textContent = tip;
    ui.results.hidden = false;
    ui.overlay.classList.add("is-results");
    ui.start.textContent = "Run It Back";
    ui.retry.hidden = false;
    ui.retry.title = `Road ${currentRoad.seed.toString(36).toUpperCase()} · best ${currentRoad.best.toLocaleString()} · next attempt ${currentRoad.attempt + 1}`;
    ui.overlay.classList.remove("is-hidden");
    updateHud();
    ui.start.focus();
  }, 520);
}

function signed(value) { return `${value >= 0 ? "+" : ""}${value.toLocaleString()}`; }

function crashAdvice() {
  if (!state.boost && state.cosmicBlend > .1) return "The shield had ended. Jump purple shards after the exit pulse.";
  if (player.grounded) return "Purple shard impact. Jump before the crystal reaches your coin.";
  return player.vy < 0
    ? "Clipped a shard while rising. Try starting the jump a little earlier."
    : "Landed on a shard. Try jumping a little later to land beyond it.";
}

function nextGoal(score) {
  const ranks = [[1800, "Shard Hopper"], [4500, "Chart Surfer"], [9000, "Emerald Maxi"], [18000, "Ancient Pepe"]];
  const next = ranks.find(([target]) => score < target);
  return next ? `${Math.ceil(next[0] - score).toLocaleString()} points to ${next[1]}.` : "Ancient Pepe reached. Keep riding for a new best.";
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
  if (state.shake && !reducedMotion?.matches) ctx.translate((Math.random() - .5) * state.shake, (Math.random() - .5) * state.shake);
  drawSky();
  ctx.save();
  ctx.translate(-runnerViewOffset(), 0);
  drawRoad();
  drawCometRail();
  drawSkyride();
  drawObjects();
  drawCathedralBells();
  drawFarthestMarker();
  drawPlayer();
  drawParticles();
  ctx.restore();
  ctx.restore();
  // Pickup feedback stays local; full-screen flashes washed out the road.
}

function drawFarthestMarker() {
  if (!currentRoad || currentRoad.attempt < 2 || currentRoad.farthestDistance <= 0) return;
  const worldX = currentRoad.farthestDistance + player.x;
  const x = worldX - state.distance;
  const left = runnerViewOffset();
  if (x < left - 140 || x > left + canvas.width + 140) return;
  const y = terrainAt(worldX);
  const flagX = x > left + canvas.width - 145 ? x - 140 : x;
  ctx.save();
  ctx.strokeStyle = "#9cc8dc"; ctx.lineWidth = 2;
  ctx.setLineDash([4, 5]);
  ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y - 104); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#0a1b29e8"; ctx.fillRect(flagX, y - 110, 140, 28);
  ctx.strokeStyle = "#9cc8dc"; ctx.strokeRect(flagX, y - 110, 140, 28);
  ctx.font = "800 16px system-ui"; ctx.textAlign = "left"; ctx.fillStyle = "#d9edff";
  ctx.fillText("FARTHEST POINT", flagX + 6, y - 91);
  ctx.restore();
}

function runnerViewOffset() {
  // Camera-only crop. Never move player.x or the authored world on resize.
  return canvas.width < W ? player.x - canvas.width * .22 : 0;
}

function fitRunnerView() {
  const width = stage.clientWidth, height = stage.clientHeight;
  if (!width || !height) return;
  const portrait = width < 600 && height > width * 1.05;
  const targetWidth = portrait ? 720 : W;
  if (canvas.width !== targetWidth) canvas.width = targetWidth;
  const scale = Math.min(width / canvas.width, height / H);
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${H * scale}px`;
}

function drawSky() {
  const viewWidth = canvas.width;
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#071725");
  gradient.addColorStop(.58, "#102a30");
  gradient.addColorStop(1, "#071b18");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  drawBackdrop(nightImage, 1);
  drawBackdrop(cosmicImage, state.cosmicBlend);
  drawBackdrop(beyondImage, state.beyondBlend * state.cosmicBlend);
  drawBackdrop(skyrealmImage, state.rideBlend * .88);
  drawBackdrop(starrailImage, state.starrailBlend);
  drawBackdrop(lunarImage, state.lunarBlend);
  drawBackdrop(cathedralImage, state.cathedralBlend);
  drawBackdrop(corruptWorldImage, state.corruptWorldBlend);
  drawBackdrop(volcanicWorldImage, state.volcanicWorldBlend);
  // A stable exposure veil keeps both skies behind the gameplay contrast.
  const veil = ctx.createLinearGradient(0, 0, 0, H);
  veil.addColorStop(0, "rgba(3,9,22,.12)");
  veil.addColorStop(1, "rgba(3,10,18,.65)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, W, H);
  if (state.cosmicBlend > .01) drawDiscoLights();
  if (state.stormBlend > .01) drawStorm();
  drawActTwoAtmosphere();
  drawFrontierAtmosphere();
  ctx.globalAlpha = .45;
  for (let i = 0; i < 42; i += 1) {
    const x = ((i * 191 - state.distance * (.035 + (i % 4) * .012)) % (viewWidth + 80) + viewWidth + 80) % (viewWidth + 80) - 40;
    const y = 80 + (i * 83) % 300;
    ctx.fillStyle = i % 6 === 0 ? "#a842ff" : "#77ffc0";
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
  ctx.globalAlpha = 1;
}

function drawStorm() {
  const calm = reducedMotion?.matches;
  const viewWidth = canvas.width;
  ctx.save();
  ctx.globalAlpha = state.stormBlend;
  const clouds = ctx.createLinearGradient(0, 0, 0, H);
  clouds.addColorStop(0, "rgba(4,15,40,.85)");
  clouds.addColorStop(.65, "rgba(19,63,102,.42)");
  clouds.addColorStop(1, "rgba(22,86,120,.1)");
  ctx.fillStyle = clouds; ctx.fillRect(0, 0, viewWidth, H);
  // Two bounded depth layers; reduced motion retains quiet static rain.
  for (let layer = 0; layer < 2; layer += 1) {
    ctx.strokeStyle = layer ? "rgba(171,225,255,.36)" : "rgba(98,177,225,.23)";
    ctx.lineWidth = layer ? 1.4 : 1;
    ctx.beginPath();
    const time = calm ? 0 : state.elapsed;
    const count = calm ? 22 : 60;
    for (let i = 0; i < count; i += 1) {
      const x = ((i * 113 - time * (70 + layer * 50)) % (viewWidth + 100) + viewWidth + 100) % (viewWidth + 100) - 30;
      const y = (i * 157 + time * (350 + layer * 210)) % (H + 50) - 30;
      ctx.moveTo(x, y); ctx.lineTo(x - 7 - layer * 4, y + 18 + layer * 10);
    }
    ctx.stroke();
  }
  if (state.stormGlow > 0 && !calm) {
    ctx.globalAlpha *= state.stormGlow;
    ctx.strokeStyle = "#a8dfff"; ctx.lineWidth = 2;
    const x = viewWidth * .68;
    ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x - 20, 102); ctx.lineTo(x + 3, 97); ctx.lineTo(x - 28, 159); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 13, 112); ctx.lineTo(x + 24, 136); ctx.lineTo(x + 12, 155); ctx.stroke();
  }
  ctx.restore();
}

function drawFrontierAtmosphere() {
  const volcanic = state.volcanicWorldBlend || 0, corrupt = state.corruptWorldBlend || 0;
  if (volcanic < .01 && corrupt < .01) return;
  const time = reducedMotion?.matches ? 0 : state.elapsed;
  ctx.save();
  ctx.globalAlpha = Math.max(volcanic, corrupt) * .35;
  for (let i = 0; i < 24; i += 1) {
    const x = ((i * 149 + time * (volcanic > corrupt ? 9 : -6)) % canvas.width + canvas.width) % canvas.width;
    const y = 110 + ((i * 73 - time * (volcanic > corrupt ? 30 : 12)) % 380 + 380) % 380;
    ctx.fillStyle = volcanic > corrupt ? ['#ffbc67','#fb805b','#ffd890'][i%3] : ['#d3a3ff','#9d74e3','#a6f2d1'][i%3];
    ctx.beginPath(); ctx.arc(x, y, 1.5 + i % 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawDiscoMotes() {
  const calm = reducedMotion?.matches;
  const time = calm ? 0 : state.elapsed;
  ctx.save();
  for (let i = 0; i < 8; i += 1) {
    const x = -55 - i * 20 + (calm ? 0 : Math.sin(time * 2 + i) * 8);
    const y = Math.sin(i * 1.7 + time * 2.4) * 24;
    const hue = (i * 47 + time * 38) % 360;
    ctx.save(); ctx.translate(x,y); ctx.rotate(calm ? .3 : time * .8 + i);
    ctx.fillStyle = `hsla(${hue},85%,72%,${.6-i*.045})`;
    ctx.shadowColor = `hsl(${hue},85%,65%)`; ctx.shadowBlur = 9;
    const size = 5 + i % 3 * 2;
    if (i % 2) {ctx.beginPath();ctx.arc(0,0,size,0,Math.PI*2);ctx.fill();}
    else ctx.fillRect(-size,-size,size*2,size*2);
    ctx.restore();
  }
  ctx.restore();
}

function drawActTwoAtmosphere() {
  const time = reducedMotion?.matches ? 0 : state.elapsed;
  const width = canvas.width;
  ctx.save();
  if (state.starrailBlend > .01) {
    ctx.globalAlpha = state.starrailBlend * .32;
    ctx.strokeStyle = "#e7bcff"; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      const x = ((i * 251 - time * 90) % (width + 140) + width + 140) % (width + 140) - 70;
      const y = 115 + (i * 61) % 210;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 45, y - 18); ctx.stroke();
    }
  }
  if (state.lunarBlend > .01) {
    ctx.globalAlpha = state.lunarBlend * .3;
    ctx.strokeStyle = "#a8e8ff"; ctx.lineWidth = 1;
    for (let i = 0; i < 12; i += 1) {
      const x = (i * 157 + 40) % width;
      const y = 125 + ((i * 53 - time * 14) % 250 + 250) % 250;
      ctx.beginPath(); ctx.arc(x, y, 4 + i % 4 * 3, 0, Math.PI * 2); ctx.stroke();
    }
  }
  if (state.eclipseTime > 0) {
    ctx.globalAlpha = .22;
    ctx.strokeStyle = "#83ffbb"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(width * .64, 215, 125, 43, -.2, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 5; i += 1) {
      const angle = time * .5 + i * Math.PI * 2 / 5;
      ctx.fillStyle = "#c2ffb1";
      ctx.fillRect(width * .64 + Math.cos(angle) * 125 - 2, 215 + Math.sin(angle) * 43 - 2, 4, 4);
    }
  }
  ctx.restore();
}

function drawCometRail() {
  if (!actTwo.active(state) || state.railKind !== "comet") return;
  ctx.save();
  ctx.globalAlpha = state.railTime > 0 ? .8 : state.railLanding / actTwo.landingSeconds * .8;
  ctx.beginPath();
  for (let x = -80; x <= W + 80; x += 30) {
    const y = terrainAt(state.distance + x) - state.railLift + 15;
    if (x === -80) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#453346"; ctx.lineWidth = 13; ctx.stroke();
  ctx.strokeStyle = "#d0ae68"; ctx.lineWidth = 7; ctx.stroke();
  ctx.strokeStyle = "#9af4ff"; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}

function drawCathedralBells() {
  for (const [index, bell] of state.bells.entries()) {
    const x = bell.x - state.distance;
    if (x < -100 || x > W + 100 || bell.collected && !bell.ringTime) continue;
    const y = terrainAt(bell.x) - bell.lift;
    ctx.save(); ctx.translate(x, y);
    if (bell.collected) {
      const life = bell.ringTime / .8;
      ctx.globalAlpha = life * .7;
      ctx.strokeStyle = "#a5ffd0"; ctx.lineWidth = 3;
      const radius = reducedMotion?.matches ? 48 : 35 + (1 - life) * 70;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.globalAlpha = bell.missed ? .3 : 1;
      ctx.strokeStyle = "#a5ffd077"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, 46, 54, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.save();
      if (!reducedMotion?.matches) ctx.rotate(Math.sin(state.elapsed * 2 + index) * .06);
      if (bellImage.complete && bellImage.naturalWidth) ctx.drawImage(bellImage, -42, -46, 84, 92);
      else { ctx.fillStyle = "#e6c784"; ctx.fillRect(-24, -30, 48, 60); }
      ctx.restore();
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = i === index ? "#b5ffd4" : "#7d957e";
        ctx.fillRect(-13 + i * 11, 62, 5, 5);
      }
    }
    ctx.restore();
  }
}

function drawBackdrop(image, alpha) {
  if (!alpha || !image.complete || !image.naturalWidth) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const scale = Math.max(canvas.width / image.naturalWidth, H / image.naturalHeight);
  const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
  ctx.drawImage(image, (canvas.width - width) / 2, (H - height) / 2, width, height);
  ctx.restore();
}

function drawSkyride() {
  const calm = reducedMotion?.matches;
  if (!calm && state.rideTrail.length > 1) {
    ctx.save();
    ctx.lineJoin = "round";
    for (let band = 0; band < 3; band += 1) {
      ctx.beginPath();
      state.rideTrail.forEach((point, i) => {
        const x = point.x - state.distance, y = point.y + band * 8;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.globalAlpha = Math.max(0, 1 - state.rideTrail[state.rideTrail.length - 1].age / 1.1) * .6 * (band === 1 ? 1 : .5);
      ctx.strokeStyle = ["#a2f4ff", "#ffe09d", "#dbaaff"][band];
      ctx.lineWidth = band === 1 ? 2 : 4;
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const gate of state.rideGates) {
    const x = gate.x - state.distance;
    if (gate.missed || x < player.x - 180 || x > W + 100) continue;
    const y = terrainAt(gate.x) - player.radius - gate.lift;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = gate.passed ? .25 : .85;
    ctx.strokeStyle = gate.passed ? "#ffe09d" : "#a2f4ff";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, 29, 65, -.12, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#ffe09d"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, 36, 73, -.12, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 5; i += 1) {
      const angle = i * Math.PI * 2 / 5 + (calm ? 0 : state.rideAge * .7);
      ctx.fillStyle = i % 2 ? "#ffe09d" : "#c7fbff";
      ctx.fillRect(Math.cos(angle) * 36 - 2, Math.sin(angle) * 73 - 2, 4, 4);
    }
    ctx.restore();
  }
}

function drawDiscoLights() {
  const viewWidth = canvas.width;
  const time = reducedMotion?.matches ? 0 : state.elapsed;
  ctx.save();
  const surge = Math.max(0, (COSMIC_SECONDS - state.cosmicTime) / COSMIC_SECONDS);
  ctx.globalAlpha = state.cosmicBlend * (.65 + surge * .35);
  // Slow broad beams; no strobe, white flash or full-screen hue filter.
  for (let i = 0; i < 3; i += 1) {
    const x = viewWidth * (.15 + i * .35);
    const sway = Math.sin(time * .45 + i * 2) * 150;
    const colors = ["rgba(98,231,255,.09)", "rgba(228,112,255,.09)", "rgba(255,214,105,.09)"];
    const beam = ctx.createLinearGradient(x, 0, x + sway, H);
    beam.addColorStop(0, colors[i]); beam.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = beam;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + sway - 190, H); ctx.lineTo(x + sway + 190, H); ctx.closePath(); ctx.fill();
  }
  // A price trail rises into the sky as the fictional event goes parabolic.
  // Its coordinates are decorative: the stable chart road still owns physics.
  ctx.strokeStyle = "rgba(255,222,135,.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 40; i += 1) {
    const t = i / 40;
    const x = viewWidth * .45 + t * viewWidth * .48;
    const y = 300 - Math.pow(t, 3) * 250 * surge;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function roadPoints() {
  const points = [];
  for (let x = -30; x <= W + 30; x += 18) points.push([x, terrainAt(state.distance + x)]);
  return points;
}

function traceRoad(points, closed = false) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points) ctx.lineTo(x, y);
  if (closed) { ctx.lineTo(W + 30, H); ctx.lineTo(-30, H); ctx.closePath(); }
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
  if (roadImage.complete && roadImage.naturalWidth) {
    roadPattern ||= ctx.createPattern(roadImage, "repeat");
    if (roadPattern) {
      ctx.save();
      traceRoad(points, true); ctx.clip();
      ctx.translate(-(state.distance % 256), 0);
      ctx.globalAlpha = .68;
      ctx.fillStyle = roadPattern; ctx.fillRect(0, 0, W + 256, H);
      ctx.restore();
    }
  }
  if (state.cosmicBlend > .01) {
    ctx.save(); traceRoad(points, true); ctx.clip();
    ctx.globalAlpha = state.cosmicBlend;
    const time = reducedMotion?.matches ? 0 : state.elapsed;
    for (let i = 0; i < 3; i += 1) {
      const x = 180 + i * 430 + Math.sin(time * .35 + i) * 100;
      const y = terrainAt(state.distance + x) + 65;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 230);
      glow.addColorStop(0, ["rgba(73,217,255,.15)", "rgba(199,91,255,.15)", "rgba(255,196,91,.13)"][i]);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(x - 230, y - 230, 460, 460);
    }
    ctx.restore();
  }
  traceRoad(points);
  ctx.strokeStyle = "#173831"; ctx.lineWidth = 19; ctx.lineJoin = "round"; ctx.stroke();
  ctx.strokeStyle = "#b99a55"; ctx.lineWidth = 11; ctx.stroke();
  traceRoad(points);
  ctx.strokeStyle = state.boost > 0 ? "#ffda78" : "#65ffad"; ctx.lineWidth = 5; ctx.lineJoin = "round"; ctx.stroke();
  ctx.strokeStyle = "rgba(199,255,223,.75)"; ctx.lineWidth = 2; ctx.stroke();
  for (let x = -(state.distance % 110); x < W + 110; x += 110) {
    const y = terrainAt(state.distance + x);
    const slope = (terrainAt(state.distance + x + 4) - terrainAt(state.distance + x - 4)) / 8;
    ctx.save(); ctx.translate(x, y + 10); ctx.rotate(Math.atan(slope));
    ctx.fillStyle = "#bba467"; ctx.fillRect(-3, 0, 6, 13);
    ctx.fillStyle = "#e4d193"; ctx.fillRect(-2, 1, 4, 3); ctx.restore();
  }

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
  // The price guide above changes the current path. Rebuild the closed road
  // polygon before clipping the grid rather than clipping to that guide line.
  traceRoad(points, true);
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
    const x = shard.attracted ? shard.magnetX : shard.x - state.distance;
    if (x < -60 || x > W + 60) continue;
    const y = shard.attracted ? shard.magnetY : shardHeight(shard);
    drawEmerald(x, y, shard.size, shard.spin);
  }
  for (const hazard of hazards) {
    if (hazard.destroyed) continue;
    const x = hazard.x - state.distance;
    if (x < -100 || x > W + 100) continue;
    const y = terrainAt(hazard.x);
    ctx.save();
    if (state.stormBlend > .01) {
      ctx.save();
      ctx.globalAlpha = state.stormBlend * .65;
      ctx.strokeStyle = "#63bfff"; ctx.lineWidth = 4;
      ctx.shadowColor = "#327bff"; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(x - hazard.width / 2 - 4, y - 2); ctx.lineTo(x, y - hazard.height - 7); ctx.lineTo(x + hazard.width / 2 + 4, y - 2); ctx.stroke();
      ctx.restore();
    }
    ctx.shadowColor = "#b938ff"; ctx.shadowBlur = 10;
    if (corruptImage.complete && corruptImage.naturalWidth) {
      drawCrystal(corruptImage, x - hazard.width / 2, y - hazard.height, hazard.width, hazard.height);
      ctx.restore();
      continue;
    }
    const grad = ctx.createLinearGradient(x, y - hazard.height, x, y);
    grad.addColorStop(0, "#ee8cff"); grad.addColorStop(.4, "#a52bdb"); grad.addColorStop(1, "#39004d");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(x - hazard.width / 2, y); ctx.lineTo(x, y - hazard.height); ctx.lineTo(x + hazard.width / 2, y); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  for (const statue of statues) {
    if (statue.collected) continue;
    const x = statue.x - state.distance;
    if (x < -90 || x > W + 90) continue;
    const y = terrainAt(statue.x) - 48;
    ctx.save();
    const halo = ctx.createRadialGradient(x, y, 8, x, y, 68);
    halo.addColorStop(0, "rgba(255,211,99,.28)"); halo.addColorStop(1, "rgba(255,211,99,0)");
    ctx.fillStyle = halo; ctx.fillRect(x - 68, y - 68, 136, 136);
    if (statueImage.complete && statueImage.naturalWidth) ctx.drawImage(statueImage, x - 49, y - 53, 98, 106);
    else { ctx.fillStyle = "#ffd775"; ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  for (const crown of crowns) {
    if (crown.collected) continue;
    const x = crown.x - state.distance;
    if (x < -100 || x > W + 100) continue;
    const y = terrainAt(crown.x) - 48;
    ctx.save();
    const halo = ctx.createRadialGradient(x, y, 4, x, y, 72);
    halo.addColorStop(0, "rgba(138,235,255,.25)"); halo.addColorStop(1, "rgba(138,235,255,0)");
    ctx.fillStyle = halo; ctx.fillRect(x - 72, y - 72, 144, 144);
    if (crownImage.complete && crownImage.naturalWidth) ctx.drawImage(crownImage, x - 50, y - 43, 100, 86);
    else { ctx.fillStyle = "#ffe2a3"; ctx.fillRect(x - 25, y - 20, 50, 35); }
    ctx.restore();
  }
  for (const statue of rushStatues) {
    if (statue.collected) continue;
    const x = statue.x - state.distance;
    if (x < -90 || x > W + 90) continue;
    const y = terrainAt(statue.x) - 48;
    ctx.save();
    const halo = ctx.createRadialGradient(x, y, 6, x, y, 66);
    halo.addColorStop(0, "rgba(74,255,140,.28)"); halo.addColorStop(1, "rgba(74,255,140,0)");
    ctx.fillStyle = halo; ctx.fillRect(x - 66, y - 66, 132, 132);
    if (rushImage.complete && rushImage.naturalWidth) ctx.drawImage(rushImage, x - 49, y - 53, 98, 106);
    else { ctx.fillStyle = "#62ff9d"; ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}

function shardHeight(shard) {
  return terrainAt(shard.x) - shard.lift + (reducedMotion?.matches ? 0 : Math.sin(state.elapsed * 5 + shard.x) * 5);
}

function drawEmerald(x, y, size, spin) {
  ctx.save(); ctx.translate(x, y);
  ctx.rotate(reducedMotion?.matches ? 0 : Math.sin(spin) * .18);
  ctx.scale(reducedMotion?.matches ? 1 : .72 + Math.abs(Math.cos(spin)) * .28, 1);
  ctx.shadowColor = "#31ff91"; ctx.shadowBlur = 9;
  if (shardImage.complete && shardImage.naturalWidth) {
    drawCrystal(shardImage, -size * .7, -size, size * 1.4, size * 2);
    ctx.restore();
    return;
  }
  const grad = ctx.createLinearGradient(0, -size, 0, size);
  grad.addColorStop(0, "#d2ffe7"); grad.addColorStop(.3, "#56ffad"); grad.addColorStop(1, "#058a45");
  ctx.fillStyle = grad; ctx.strokeStyle = "#dcffeb"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -size); ctx.lineTo(size * .62, -size * .25); ctx.lineTo(size * .44, size * .58); ctx.lineTo(0, size); ctx.lineTo(-size * .44, size * .58); ctx.lineTo(-size * .62, -size * .25); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawCrystal(image, x, y, width, height) {
  // Generated sprites include transparent padding; crop only at draw time so
  // visible crystal edges match their established gameplay footprint.
  const crop = image === corruptImage ? CRYSTAL_CROPS.corrupt : CRYSTAL_CROPS.emerald;
  ctx.drawImage(image, ...crop, x, y, width, height);
}

function drawPlayer() {
  ctx.save();
  const ground = terrainAt(state.distance + player.x);
  const height = Math.max(0, ground - player.y - player.radius);
  ctx.globalAlpha = .32 * Math.max(.15, 1 - height / 220);
  ctx.fillStyle = "#000b0a";
  ctx.beginPath(); ctx.ellipse(player.x, ground + 3, Math.max(12, 35 - height * .06), 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(player.x, player.y);
  if (actTwo.active(state)) {
    ctx.save();
    const bank = reducedMotion?.matches ? 0 : Math.sin(state.railAge * 4) * .12;
    ctx.rotate(bank);
    if (state.railKind === "slingshot") {
      for (let i = 0; i < 3; i += 1) {
        ctx.strokeStyle = ["#adffd0", "#e7ce88", "#a5eaff"][i]; ctx.lineWidth = i === 1 ? 3 : 2;
        ctx.beginPath(); ctx.ellipse(0, player.radius + 9, 45 + i * 10, 10 + i * 5, i * .12 - .12, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (cometBoardImage.complete && cometBoardImage.naturalWidth) {
      ctx.drawImage(cometBoardImage, -72, player.radius - 8, 144, 48);
    } else {
      ctx.fillStyle = "#151c32"; ctx.strokeStyle = "#e7c480"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, player.radius + 14, 52, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (state.railKind !== "slingshot") {
      ctx.fillStyle = "#8ef4ff";
      ctx.beginPath(); ctx.moveTo(-40, player.radius + 12); ctx.lineTo(-95 - state.railVault * 40, player.radius + 22); ctx.lineTo(-40, player.radius + 20); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  ctx.rotate(state.rideBank);
  if (royal.active(state)) {
    ctx.save();
    if (reducedMotion?.matches) {
      ctx.strokeStyle = "#a2f4ff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-75, player.radius + 15); ctx.lineTo(15, player.radius + 15); ctx.stroke();
    }
    if (crownImage.complete && crownImage.naturalWidth) ctx.drawImage(crownImage, -36, -player.radius - 58, 72, 60);
    ctx.restore();
  }
  if (state.exitPulse > 0) {
    ctx.save();
    const life = state.exitPulse / .45;
    ctx.globalAlpha = life * .35;
    ctx.strokeStyle = "#ffe7a8"; ctx.lineWidth = 2;
    const radius = reducedMotion?.matches ? player.radius + 20 : player.radius + (1 - life) * 210;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (protectedRide() || state.rushTime > 0) {
    if (auraImage.complete && auraImage.naturalWidth) {
      const calm = reducedMotion?.matches;
      const frame = calm ? 3 : Math.floor(state.elapsed * 10) % 8;
      ctx.save();
      ctx.globalAlpha = .8;
      const size = player.radius * 3.25;
      ctx.drawImage(auraImage, frame % 4 * 256, Math.floor(frame / 4) * 256, 256, 256, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
    if (protectedRide()) {
      ctx.strokeStyle = royal.active(state) ? "#a2f4ff" : "#ffe292"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, player.radius + 12, 0, Math.PI * 2); ctx.stroke();
    }
    drawDiscoMotes();
  }
  ctx.rotate(player.rotation);
  ctx.beginPath(); ctx.arc(0, 0, player.radius + 5, 0, Math.PI * 2);
  ctx.shadowColor = player.grounded ? "rgba(84,255,164,.55)" : "rgba(154,255,205,.7)"; ctx.shadowBlur = player.grounded ? 10 : 15;
  ctx.fillStyle = "#102d1e"; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(0, 0, player.radius, 0, Math.PI * 2); ctx.clip();
  if (coinImage.complete && coinImage.naturalWidth) ctx.drawImage(coinImage, 94, 94, 838, 838, -player.radius, -player.radius, player.radius * 2, player.radius * 2);
  else { ctx.fillStyle = "#46ca72"; ctx.fillRect(-player.radius, -player.radius, player.radius * 2, player.radius * 2); }
  if (state.rushTime > 0) {
    // Eye positions match the retained coin artwork and rotate with its face.
    const glow = reducedMotion?.matches ? .8 : .55 + .35 * (1 + Math.sin(state.rushAge * Math.PI * 2 * 1.3)) / 2;
    ctx.save(); ctx.globalAlpha = glow;
    ctx.shadowColor = "#8bff41"; ctx.shadowBlur = 12;
    ctx.fillStyle = "#a4ff5c";
    for (const x of [-.15, .18]) {
      ctx.beginPath(); ctx.ellipse(player.radius * x, -player.radius * .17, player.radius * .09, player.radius * .055, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function burst(x, y, color, count) {
  count = Math.min(reducedMotion?.matches ? 4 : count, Math.max(0, 160 - particles.length));
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const speed = 90 + Math.random() * 260;
    particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 80, life: .35 + Math.random() * .45, maxLife: .8, color, size: 2 + Math.random() * 5 });
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    if (p.kind === "crystal") {
      ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
      if (corruptImage.complete && corruptImage.naturalWidth) {
        const [sx, sy, width, height] = CRYSTAL_CROPS.corrupt;
        ctx.drawImage(corruptImage, sx + width * (.2 + p.facet * .15), sy + height * .4, width * .3, height * .4,
          -p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.fillStyle = "#eaa5ff";
        ctx.beginPath(); ctx.moveTo(0, -p.size / 2); ctx.lineTo(p.size / 2, p.size / 2); ctx.lineTo(-p.size / 2, 0); ctx.closePath(); ctx.fill();
      }
    } else { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }
    ctx.restore();
  }
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
  ui.comboMeter.value = state.combo > 1 ? state.comboClock : 0;
  ui.best.textContent = state.best.toLocaleString();
  const farthestGap = currentRoad?.attempt > 1 ? currentRoad.farthestDistance - state.distance : Infinity;
  const approachingFarthest = farthestGap > 0 && farthestGap <= 450;
  ui.goal.textContent = state.mode === "gameover" ? "Run complete. Choose a replay option." : state.noticeTime > 0 ? state.noticeText
    : approachingFarthest ? `FARTHEST POINT · ${Math.ceil(farthestGap / 10)}m ahead` : nextGoal(state.score);
  ui.goal.classList.toggle("has-milestone", state.mode === "running" && state.noticeTime > 0);
  ui.jump.disabled = state.mode !== "running" || Boolean(window.EmeraldArcade?.isPaused?.());
  const cosmicPowered = state.mode === "running" && state.boost > 0;
  const cometPowered = state.mode === "running" && actTwo.active(state);
  const slingshot = cometPowered && state.railKind === "slingshot";
  const chapter = route.chapterAt(state.distance + player.x);
  const inActTwo = state.distance + player.x >= route.actTwo.start;
  const inFrontier = state.distance + player.x >= route.frontier.start;
  ui.route.hidden = state.mode !== "running";
  ui.routeProgress.value = inFrontier ? route.frontierProgress(state.distance + player.x) : inActTwo ? route.actTwoProgress(state.distance + player.x) : route.progressAt(state.distance + player.x);
  ui.routeProgress.setAttribute("aria-label", inFrontier ? "Frontier route progress" : inActTwo ? "Act Two route progress" : "Opening route progress");
  ui.routeTitle.textContent = `${inFrontier ? "FRONTIER" : inActTwo ? "ACT II" : chapter.index + 1} · ${chapter.name.toUpperCase()}`;
  ui.routeDetail.textContent = chapter.id === "tempest" ? "Rain · blue-aura spikes"
    : chapter.id === "lunar" ? "Low gravity · longer jumps"
    : chapter.id === "eclipse" ? `Bells ${state.bellsRung}/3 · ${state.slingshots ? "slingshot awakened" : "jump to ring"}`
    : chapter.id === "corrupt" ? "Act Two complete · violet crystal kingdom"
    : chapter.id === "volcanic" ? "Molten forge · next region ahead"
    : chapter.id === "endless" ? "Frontier complete · endless road"
    : chapter.next ? `Next region · ${Math.ceil(Math.max(0, chapter.next.start - state.distance - player.x) / 10)}m`
    : "Opening route complete · endless road";
  const royalPowered = state.mode === "running" && royal.active(state);
  const rushPowered = state.mode === "running" && state.rushTime > 0;
  const powered = cosmicPowered || royalPowered || rushPowered || cometPowered;
  ui.jump.textContent = slingshot ? "Surge ↑" : cometPowered ? "Vault ↑" : royalPowered ? "Soar ↑" : "Jump ↑";
  const nextStatue = statues.find(s => !s.collected && s.x >= state.distance + player.x - 40);
  const nextCrown = crowns.find(c => !c.collected && c.x >= state.distance + player.x - 40);
  const nextRush = rushStatues.find(s => !s.collected && s.x >= state.distance + player.x - 40);
  const nextPickup = [nextStatue, nextCrown, nextRush].filter(Boolean).sort((a, b) => a.x - b.x)[0];
  const crownAhead = nextCrown && nextPickup === nextCrown;
  const rushAhead = nextRush && nextPickup === nextRush;
  const gap = nextPickup ? Math.max(0, nextPickup.x - state.distance - player.x) : Infinity;
  const approaching = state.mode === "running" && !powered && gap <= 900;
  const showCrown = royalPowered || approaching && crownAhead;
  const showRush = !royalPowered && !cosmicPowered && (rushPowered || approaching && rushAhead);
  const icon = cometPowered ? coinImage.src : showCrown ? crownImage.src : showRush ? rushImage.src : statueImage.src;
  if (ui.powerIcon.src !== icon) ui.powerIcon.src = icon;
  ui.cosmic.hidden = !powered && !approaching;
  ui.cosmic.classList.toggle("is-ending", cometPowered ? state.railTime <= 2 : royalPowered ? state.rideTime <= 2 : cosmicPowered ? state.cosmicTime <= 2 : rushPowered && state.rushTime <= 2);
  ui.cosmicTitle.textContent = approaching ? crownAhead ? "CELESTIAL CROWN AHEAD" : rushAhead ? "EMERALD FROG AHEAD" : "GOLD FROG AHEAD"
    : cometPowered ? state.railTime > 0 ? slingshot ? "ECLIPSE SLINGSHOT" : "COMET EXPRESS" : slingshot ? "ECLIPSE LANDING" : "COMET LANDING"
    : royalPowered ? state.rideTime > 0 ? "ROYAL SKYRIDE" : "ROYAL LANDING" : cosmicPowered ? state.cosmicTime <= 2 ? "SHIELD ENDING" : "COSMIC DISCO" : state.eclipseTime > 0 ? "EMERALD ECLIPSE" : "EMERALD RUSH";
  ui.cosmicTime.textContent = approaching ? `${Math.ceil(gap / 10)}m · roll into the ${crownAhead ? "crown" : "statue"}`
    : cometPowered ? state.railTime > 0 ? `${state.railTime.toFixed(1)}s · tap to ${slingshot ? "surge" : "vault"} · shielded${cosmicPowered ? ` · disco ${state.cosmicTime.toFixed(1)}s` : ""}` : "Protected landing · prepare to jump"
    : royalPowered ? state.rideTime > 0 ? `${state.rideTime.toFixed(1)}s · gates ${state.rideGateChain}/3${cosmicPowered ? ` · disco ${state.cosmicTime.toFixed(1)}s` : " · attract emeralds"}` : "Protected landing · prepare to jump"
    : cosmicPowered ? state.cosmicTime > 0 ? `${state.cosmicTime.toFixed(1)}s · +35% speed · ${state.smashed} smashed` : "Shield fading · prepare to jump"
    : `${state.rushTime.toFixed(1)}s · emerald magnet · keep jumping`;
  ui.cosmic.classList.toggle("has-rush", rushPowered);
  ui.rushBanner.hidden = !rushPowered || !(royalPowered || cosmicPowered || cometPowered);
  ui.rushBanner.textContent = `${state.eclipseTime > 0 ? "EMERALD ECLIPSE" : "EMERALD RUSH"} · ${state.rushTime.toFixed(1)}s magnet`;
  ui.cosmicMeter.hidden = !powered;
  ui.cosmicMeter.max = cometPowered ? actTwo.rideSeconds(state) : royalPowered ? royal.seconds : cosmicPowered ? COSMIC_SECONDS : rush.seconds;
  ui.cosmicMeter.value = cometPowered ? state.railTime : royalPowered ? state.rideTime : cosmicPowered ? state.cosmicTime : state.rushTime;
  ui.cosmicMeter.setAttribute("aria-label", cometPowered ? `${slingshot ? "Eclipse Slingshot" : "Comet Express"} time remaining` : royalPowered ? "Royal Skyride time remaining" : cosmicPowered ? "Cosmic burst time remaining" : "Emerald Rush time remaining");
  ui.event.hidden = !cosmicPowered;
  ui.eventName.textContent = eventPhase();
  ui.eventPrice.textContent = `$${state.eventPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function eventPhase() {
  const progress = (COSMIC_SECONDS - state.cosmicTime) / COSMIC_SECONDS;
  return progress < .35 ? "COSMIC DISCO" : progress < .7 ? "PARABOLIC" : "BEYOND CANON";
}

function updateCosmicEvent() {
  const progress = Math.max(0, Math.min(1, (COSMIC_SECONDS - state.cosmicTime) / COSMIC_SECONDS));
  state.eventPrice = state.eventAnchor * (1 + 39 * progress ** 3);
  state.eventPeak = Math.max(state.eventPeak, state.eventPrice);
  const phase = eventPhase();
  if (phase !== state.eventStage) {
    state.eventStage = phase;
    if (progress > 0) {
      ui.announcement.textContent = `${phase}. Simulated event price surging. Cosmic shield remains active.`;
      showMilestone(`${phase} · Simulated price surging`, 2);
    }
  }
  const points = [];
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24 * progress;
    points.push(`${i ? "L" : "M"}${(t * 120).toFixed(1)},${(32 - t ** 3 * 29).toFixed(1)}`);
  }
  ui.eventCurve.setAttribute("d", points.join(" "));
}

function updateCosmicMusic() {
  if (state.cosmicTime <= 0) return;
  const beat = Math.floor((COSMIC_SECONDS - state.cosmicTime) / .25);
  if (beat === state.cosmicBeat) return;
  state.cosmicBeat = beat; // Drop missed beats; never queue a catch-up burst.
  if (beat % 2 === 0) playSynth(120, .12, "sine", .025, 42);
  const bass = [110, 110, 146.83, 130.81, 110, 164.81, 146.83, 130.81];
  playSynth(bass[beat % bass.length], .16, "triangle", .018);
  if (beat % 2) playSynth([440, 587.33, 659.25, 523.25][Math.floor(beat / 2) % 4], .1, "sine", .013);
}

function playSynth(frequency, duration, type, volume, endFrequency) {
  if (!state.sound || window.EmeraldArcade?.isPaused?.() || window.EmeraldArcade?.isMuted?.() || audioVoices.size >= 12) return;
  try {
    audioContext ||= new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, audioContext.currentTime + duration);
    gain.gain.setValueAtTime(.001, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + .008);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    audioVoices.add(oscillator);
    oscillator.onended = () => { audioVoices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  } catch { /* audio is optional */ }
}

function stopAudio() {
  for (const voice of audioVoices) { try { voice.stop(); } catch { /* already ended */ } }
  audioVoices.clear();
}

function tone(frequency, duration, type) { playSynth(frequency, duration, type, .035); }

function setSound(enabled) {
  state.sound = Boolean(enabled);
  if (!state.sound) stopAudio();
  ui.sound.textContent = `Sound: ${state.sound ? "on" : "off"}`;
  ui.sound.setAttribute("aria-pressed", String(state.sound));
}

function action(event) {
  if (window.EmeraldArcade?.isPaused?.() || state.mode !== "running") return;
  if (event?.repeat || event?.ctrlKey || event?.metaKey || event?.altKey) return;
  if (event?.target?.closest?.("button, a, input, select, textarea, [contenteditable='true']")) return;
  if (event) event.preventDefault();
  if (state.mode === "running") jump();
}

function loop(now) {
  // Use the pause-adjusted RAF clock for both the baseline and later frames.
  const dt = state.lastFrame === null ? 0 : Math.max(0, Math.min(.032, (now - state.lastFrame) / 1000));
  state.lastFrame = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function isPrimaryJumpPress(event) {
  return event.isPrimary !== false && event.button === 0;
}

ui.start.addEventListener("click", startGame);
ui.retry.addEventListener("click", () => startGame({ sameRoad: true }));
ui.jump.addEventListener("pointerdown", (event) => {
  if (!isPrimaryJumpPress(event)) return;
  event.preventDefault();
  if (!window.EmeraldArcade?.isPaused?.()) jump();
});
ui.jump.addEventListener("click", (event) => {
  // Pointer activation already jumped; keyboard and assistive clicks use this path.
  if (event.detail === 0 && !window.EmeraldArcade?.isPaused?.()) jump();
});
window.addEventListener("emeraldarcade:pause", () => { state.jumpBuffer = 0; if (window.EmeraldArcade?.isPaused?.()) stopAudio(); updateHud(); });
window.addEventListener("emeraldarcade:mute", () => { if (window.EmeraldArcade?.isMuted?.()) stopAudio(); });
window.addEventListener("blur", () => { state.jumpBuffer = 0; });
stage.addEventListener("pointerdown", (event) => {
  if (isPrimaryJumpPress(event)) action(event);
});
window.addEventListener("keydown", (event) => { if ([" ", "ArrowUp", "w", "W"].includes(event.key)) action(event); });
ui.sound.addEventListener("click", () => setSound(!state.sound));

player.y = terrainAt(player.x) - player.radius;
if (typeof ResizeObserver !== "undefined") new ResizeObserver(fitRunnerView).observe(stage);
fitRunnerView();
updateHud();
loadEtcTerrain();
requestAnimationFrame(loop);
