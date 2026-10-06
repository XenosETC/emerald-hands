const SAVE_KEY = "satoshi-system-save-v1";
const STATE_VERSION = 2;
const MAX_SUPPLY = 2_100_000_000_000_000;
const START_ISSUED = 1_500_000_000_000_000;
const PRICE_ANCHOR = 40_000;
const FIRST_CONTRACTION_TICK = 120;
const MARKET_REVIEW_TICKS = 60;
const MAINTENANCE_CYCLE_TICKS = 20;

const WORLD_DEFS = {
  relay: { name: "Relay Moon", cost: 64, growth: 1.36, max: 25, output: 1, cadence: 4, load: 1, requires: null },
  merchant: { name: "Merchant Planet", cost: 240, growth: 1.42, max: 20, output: 2, cadence: 3, load: 2, requires: "relay" },
  forge: { name: "Forge World", cost: 720, growth: 1.5, max: 15, output: 5, cadence: 2, load: 4, requires: "expansion" },
};

const ROUTING_DEF = { name: "Routing Efficiency", cost: 40, growth: 1.32, max: 25, bonus: 2 };
const RESILIENCE_COSTS = [160, 480];
const EXPANSION_COST = 420;

const SYSTEM_RANKS = [
  { name: "Genesis Observer", score: 0 },
  { name: "Sat Router", score: 120 },
  { name: "Relay Operator", score: 500 },
  { name: "World Builder", score: 1_400 },
  { name: "Systems Allocator", score: 3_500 },
  { name: "Monetary Architect", score: 8_000 },
];

const MARKET_REGIMES = {
  bull: { name: "Bull", drift: 0.0008, noise: 0.0015, commerce: 1.15 },
  balanced: { name: "Balanced", drift: 0, noise: 0.0015, commerce: 1 },
  bear: { name: "Bear", drift: -0.0007, noise: 0.0015, commerce: 0.75 },
};

const REGIME_TRANSITIONS = {
  bull: [
    { regime: "bull", probability: 0.6 },
    { regime: "balanced", probability: 0.3 },
    { regime: "bear", probability: 0.1 },
  ],
  balanced: [
    { regime: "bull", probability: 0.4 },
    { regime: "balanced", probability: 0.2 },
    { regime: "bear", probability: 0.4 },
  ],
  bear: [
    { regime: "bull", probability: 0.1 },
    { regime: "balanced", probability: 0.3 },
    { regime: "bear", probability: 0.6 },
  ],
};

const els = {
  genesisStar: document.querySelector("#genesisStar"),
  satParticles: document.querySelector("#satParticles"),
  supplyHalo: document.querySelector("#supplyHalo"),
  allocationRing: document.querySelector("#allocationRing"),
  treasuryBalance: document.querySelector("#treasuryBalance"),
  perClickStat: document.querySelector("#perClickStat"),
  commerceStat: document.querySelector("#commerceStat"),
  loadStat: document.querySelector("#loadStat"),
  coverageStat: document.querySelector("#coverageStat"),
  epochStat: document.querySelector("#epochStat"),
  epochBadge: document.querySelector("#epochBadge"),
  epochProgressLabel: document.querySelector("#epochProgressLabel"),
  epochProgressBar: document.querySelector("#epochProgressBar"),
  remainingSupplyShort: document.querySelector("#remainingSupplyShort"),
  simulatedPrice: document.querySelector("#simulatedPrice"),
  priceMove: document.querySelector("#priceMove"),
  regimeName: document.querySelector("#regimeName"),
  regimeMeta: document.querySelector("#regimeMeta"),
  regimeOdds: document.querySelector("#regimeOdds"),
  sparkline: document.querySelector("#sparkline"),
  issuedLedger: document.querySelector("#issuedLedger"),
  circulationLedger: document.querySelector("#circulationLedger"),
  treasuryLedger: document.querySelector("#treasuryLedger"),
  ledgerCheck: document.querySelector("#ledgerCheck"),
  maturityLevel: document.querySelector("#maturityLevel"),
  maturityProgress: document.querySelector("#maturityProgress"),
  maturityNext: document.querySelector("#maturityNext"),
  maturityRules: document.querySelector("#maturityRules"),
  reserveAllocation: document.querySelector("#reserveAllocation"),
  productiveAllocation: document.querySelector("#productiveAllocation"),
  resilienceAllocation: document.querySelector("#resilienceAllocation"),
  growthAllocation: document.querySelector("#growthAllocation"),
  postureLabel: document.querySelector("#postureLabel"),
  rankLabel: document.querySelector("#rankLabel"),
  nextRankLabel: document.querySelector("#nextRankLabel"),
  statusCard: document.querySelector("#statusCard"),
  statusTitle: document.querySelector("#statusTitle"),
  statusText: document.querySelector("#statusText"),
  goalTitle: document.querySelector("#goalTitle"),
  goalText: document.querySelector("#goalText"),
  goalCard: document.querySelector(".goal-card"),
  gateNode: document.querySelector("#gateNode"),
  buildCards: [...document.querySelectorAll("[data-build-card]")],
  buyButtons: [...document.querySelectorAll("[data-buy]")],
  resetButton: document.querySelector("#resetButton"),
};

function defaultState() {
  return {
    version: STATE_VERSION,
    ticks: 0,
    treasury: 0,
    globalIssued: START_ISSUED,
    circulation: START_ISSUED,
    totalRouted: 0,
    commerceTransferred: 0,
    totalSpent: 0,
    maintenancePaid: 0,
    productiveAllocated: 0,
    resilienceAllocated: 0,
    growthAllocated: 0,
    routing: 0,
    worlds: { relay: 0, merchant: 0, forge: 0 },
    resilience: 0,
    expansion: false,
    stallTicks: 0,
    price: PRICE_ANCHOR,
    lastReturn: 0,
    priceHistory: [PRICE_ANCHOR],
    regime: "balanced",
    rng: 0x05a71c05,
    goalComplete: false,
    arcadeRecorded: false,
    lastEvent: {
      title: "Genesis system ready",
      text: "Route the first sats, then decide what to keep liquid and what to deploy.",
      tone: "neutral",
    },
  };
}

function whole(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || typeof saved !== "object") return defaultState();
    const next = defaultState();
    next.ticks = whole(saved.ticks);
    next.globalIssued = Math.min(MAX_SUPPLY, Math.max(START_ISSUED, whole(saved.globalIssued, START_ISSUED)));
    next.treasury = Math.min(next.globalIssued, whole(saved.treasury));
    next.circulation = next.globalIssued - next.treasury;
    next.totalRouted = whole(saved.totalRouted);
    next.commerceTransferred = whole(saved.commerceTransferred);
    next.totalSpent = whole(saved.totalSpent);
    next.maintenancePaid = whole(saved.maintenancePaid);
    next.routing = Math.min(ROUTING_DEF.max, whole(saved.routing));
    next.worlds = Object.fromEntries(Object.entries(WORLD_DEFS).map(([key, world]) => {
      const savedLevel = saved.worlds?.[key];
      const migratedLevel = typeof savedLevel === "boolean" ? Number(savedLevel) : whole(savedLevel);
      return [key, Math.min(world.max, migratedLevel)];
    }));
    next.resilience = Math.min(2, whole(saved.resilience));
    next.expansion = Boolean(saved.expansion);
    const reconstructedProductive = Object.entries(WORLD_DEFS).reduce((sum, [key, world]) => {
      let allocated = 0;
      for (let level = 0; level < next.worlds[key]; level += 1) allocated += Math.round(world.cost * world.growth ** level);
      return sum + allocated;
    }, 0) + Array.from({ length: next.routing }, (_, level) => Math.round(ROUTING_DEF.cost * ROUTING_DEF.growth ** level)).reduce((sum, cost) => sum + cost, 0);
    const reconstructedResilience = RESILIENCE_COSTS.slice(0, next.resilience).reduce((sum, cost) => sum + cost, 0);
    next.productiveAllocated = whole(saved.productiveAllocated, reconstructedProductive);
    next.resilienceAllocated = whole(saved.resilienceAllocated, reconstructedResilience);
    next.growthAllocated = whole(saved.growthAllocated, next.expansion ? EXPANSION_COST : 0);
    next.stallTicks = Math.min(10, whole(saved.stallTicks));
    next.price = Math.min(PRICE_ANCHOR * 4, Math.max(PRICE_ANCHOR * 0.25, Number(saved.price) || PRICE_ANCHOR));
    next.lastReturn = Number.isFinite(Number(saved.lastReturn)) ? Number(saved.lastReturn) : 0;
    next.priceHistory = Array.isArray(saved.priceHistory)
      ? saved.priceHistory.map(Number).filter(Number.isFinite).slice(-36)
      : [next.price];
    if (!next.priceHistory.length) next.priceHistory = [next.price];
    next.regime = MARKET_REGIMES[saved.regime] ? saved.regime : "balanced";
    next.rng = whole(saved.rng, next.rng) >>> 0;
    next.goalComplete = Boolean(saved.goalComplete);
    next.arcadeRecorded = Boolean(saved.arcadeRecorded);
    if (saved.lastEvent && typeof saved.lastEvent === "object") {
      next.lastEvent = {
        title: String(saved.lastEvent.title || next.lastEvent.title),
        text: String(saved.lastEvent.text || next.lastEvent.text),
        tone: ["neutral", "good", "warning"].includes(saved.lastEvent.tone) ? saved.lastEvent.tone : "neutral",
      };
    }
    return next;
  } catch {
    return defaultState();
  }
}

let state = loadState();
let sessionStarted = false;
let audioContext;

function saveState() {
  state.version = STATE_VERSION;
  state.circulation = state.globalIssued - state.treasury;
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function epochForTick(tick = state.ticks) {
  if (tick < FIRST_CONTRACTION_TICK) {
    return { index: 0, name: "Epoch I", reward: 8, globalBatch: 1_000_000_000_000 };
  }
  return { index: 1, name: "Epoch II", reward: 4, globalBatch: 500_000_000_000 };
}

function clickReward() {
  if (state.globalIssued >= MAX_SUPPLY) return state.circulation > 0 ? 1 : 0;
  return epochForTick().reward + state.routing * ROUTING_DEF.bonus;
}

function systemScore() {
  return state.totalSpent + state.treasury + state.ticks * 2;
}

function currentRank() {
  const score = systemScore();
  return [...SYSTEM_RANKS].reverse().find((rank) => score >= rank.score) || SYSTEM_RANKS[0];
}

function nextRank() {
  return SYSTEM_RANKS.find((rank) => rank.score > systemScore()) || null;
}

function networkMaturity() {
  if (state.ticks >= FIRST_CONTRACTION_TICK && state.worlds.merchant) {
    return { level: 2, name: "Mature", progress: 1 };
  }
  if (state.ticks >= 60 && state.worlds.relay) {
    const progress = 0.5 + Math.min(0.5, Math.max(0, state.ticks - 60) / 120);
    return { level: 1, name: "Networked", progress };
  }
  return { level: 0, name: "Foundation", progress: Math.min(0.5, state.ticks / 120) };
}

function rawWorldCost(key) {
  const world = WORLD_DEFS[key];
  if (!world) return 0;
  return Math.round(world.cost * world.growth ** state.worlds[key]);
}

function effectiveWorldCost(key) {
  const world = WORLD_DEFS[key];
  if (!world) return 0;
  const baseCost = rawWorldCost(key);
  const maturity = networkMaturity().level;
  if (key === "merchant" && maturity >= 1) return Math.round(baseCost * 0.9);
  if (key === "forge" && maturity >= 2) return Math.round(baseCost * 0.85);
  return baseCost;
}

function routingCost() {
  return Math.round(ROUTING_DEF.cost * ROUTING_DEF.growth ** state.routing);
}

function nextRandom() {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function chooseNextRegime() {
  const transitions = REGIME_TRANSITIONS[state.regime];
  const roll = nextRandom();
  let cumulative = 0;
  for (const transition of transitions) {
    cumulative += transition.probability;
    if (roll <= cumulative) return transition.regime;
  }
  return transitions.at(-1).regime;
}

function advanceMarket() {
  if (state.ticks > 0 && state.ticks % MARKET_REVIEW_TICKS === 0) {
    const previous = state.regime;
    state.regime = chooseNextRegime();
    if (previous !== state.regime) {
      setEvent(
        `${MARKET_REGIMES[state.regime].name} weather entered the system`,
        "The saved market model changed regimes at its scheduled review. Your click only advanced the clock.",
        state.regime === "bear" ? "warning" : state.regime === "bull" ? "good" : "neutral",
      );
    }
  }

  const regime = MARKET_REGIMES[state.regime];
  const triangularNoise = (nextRandom() + nextRandom() - 1) * regime.noise;
  const meanReversion = Math.log(PRICE_ANCHOR / state.price) * 0.0001;
  state.lastReturn = clamp(regime.drift + triangularNoise + meanReversion, -0.0025, 0.0025);
  state.price = clamp(state.price * Math.exp(state.lastReturn), PRICE_ANCHOR * 0.25, PRICE_ANCHOR * 4);
  state.priceHistory.push(state.price);
  state.priceHistory = state.priceHistory.slice(-36);
}

function routeIssuance() {
  const epoch = epochForTick();
  const remaining = MAX_SUPPLY - state.globalIssued;
  const issuedBatch = Math.min(remaining, epoch.globalBatch);
  let playerReward = Math.min(clickReward(), issuedBatch);

  if (issuedBatch > 0) {
    state.globalIssued += issuedBatch;
    state.treasury += playerReward;
    state.circulation += issuedBatch - playerReward;
  } else if (state.circulation > 0) {
    playerReward = 1;
    state.circulation -= 1;
    state.treasury += 1;
  }

  state.totalRouted += playerReward;
  return playerReward;
}

function transferFromCirculation(amount) {
  const transfer = Math.min(state.circulation, Math.max(0, Math.floor(amount)));
  state.circulation -= transfer;
  state.treasury += transfer;
  state.commerceTransferred += transfer;
  return transfer;
}

function sendToCirculation(amount, maintenance = false) {
  const spend = Math.min(state.treasury, Math.max(0, Math.floor(amount)));
  state.treasury -= spend;
  state.circulation += spend;
  if (maintenance) state.maintenancePaid += spend;
  else state.totalSpent += spend;
  return spend;
}

function baseOperatingLoad() {
  let load = state.resilience;
  for (const [key, world] of Object.entries(WORLD_DEFS)) {
    load += state.worlds[key] * world.load;
  }
  if (state.expansion) load += 3;
  return load;
}

function operatingLoad() {
  const base = baseOperatingLoad();
  if (!base) return 0;
  if (state.regime === "bull") return Math.ceil(base * 1.1);
  if (state.regime === "bear") return Math.ceil(base * (1 + Math.max(0, 0.2 - state.resilience * 0.1)));
  return base;
}

function reserveCoverage() {
  const load = operatingLoad();
  return load ? Math.floor(state.treasury / load) : Infinity;
}

function isOverloaded() {
  return state.expansion && (state.resilience < 1 || reserveCoverage() < 3);
}

function commerceMultiplier() {
  let multiplier = MARKET_REGIMES[state.regime].commerce;
  if (state.regime === "bear") {
    multiplier = 1 - 0.25 * (1 - Math.min(0.6, state.resilience * 0.3));
  }
  if (state.stallTicks > 0) multiplier *= 0.25;
  if (isOverloaded()) multiplier *= 0.65;
  else if (state.expansion) multiplier *= 1.1;
  return multiplier;
}

function baseCommercePerCycle() {
  return Object.entries(WORLD_DEFS).reduce((sum, [key, world]) => sum + state.worlds[key] * world.output, 0);
}

function runProductivity() {
  let baseTransfer = 0;
  const producing = [];
  for (const [key, world] of Object.entries(WORLD_DEFS)) {
    if (state.worlds[key] > 0 && state.ticks % world.cadence === 0) {
      baseTransfer += world.output * state.worlds[key];
      producing.push(key);
    }
  }
  if (!baseTransfer) return { amount: 0, producing };
  const adjusted = Math.max(1, Math.round(baseTransfer * commerceMultiplier()));
  return { amount: transferFromCirculation(adjusted), producing };
}

function settleMaintenance() {
  if (state.ticks % MAINTENANCE_CYCLE_TICKS !== 0) return 0;
  const due = operatingLoad();
  if (!due) return 0;
  const paid = sendToCirculation(due, true);
  if (paid < due) {
    state.stallTicks = 10;
    setEvent(
      "Network Stall · recovery is available",
      `The system could not cover its ${due}-sat operating cycle. Direct clicks still route sats; rebuild the reserve to restore full commerce.`,
      "warning",
    );
  } else {
    setEvent(
      "Operating cycle settled",
      `${paid} sats returned to circulation for system load. Treasury coverage now spans ${reserveCoverage()} cycle${reserveCoverage() === 1 ? "" : "s"}.`,
      "neutral",
    );
  }
  return paid;
}

function setEvent(title, text, tone = "neutral") {
  state.lastEvent = { title, text, tone };
}

function beginSession() {
  if (sessionStarted) return;
  sessionStarted = true;
  window.EmeraldArcade?.beginSession("satoshiSystem", "satoshi-system.html");
}

function advanceTick(event) {
  if (window.EmeraldArcade?.isPaused()) return;
  beginSession();
  const priorEpoch = epochForTick().index;
  const priorMaturity = networkMaturity().level;
  const priorRank = currentRank().name;
  state.ticks += 1;
  if (state.stallTicks > 0) state.stallTicks -= 1;
  advanceMarket();
  const routed = routeIssuance();
  const productivity = runProductivity();
  const maintenance = settleMaintenance();

  if (priorMaturity !== networkMaturity().level) {
    const maturity = networkMaturity();
    setEvent(
      `Network Maturity · ${maturity.name}`,
      maturity.level === 1
        ? "Current and future Merchant Planet levels now cost 10% fewer fictional sats. Simulated price never enters this rule."
        : "Current and future Forge World levels now cost 15% fewer fictional sats. Growth curves and operating load remain.",
      "good",
    );
  } else if (priorEpoch !== epochForTick().index) {
    setEvent(
      "Emission contraction · Epoch II",
      "The scaled issuance reward declined from 8 to 4 sats per click. Productive commerce still transfers already-issued sats.",
      "warning",
    );
  } else if (productivity.amount > 0 && maintenance === 0) {
    setEvent(
      `+${productivity.amount} commerce sat${productivity.amount === 1 ? "" : "s"}`,
      `${productivity.producing.map((key) => WORLD_DEFS[key].name).join(" + ")} completed a productivity cycle.`,
      "good",
    );
  } else if (priorRank !== currentRank().name) {
    setEvent(`System Rank · ${currentRank().name}`, "Your routed sats, reserves, and committed capital advanced the system rank.", "good");
  }

  pulseStar();
  spawnSatParticle(routed, event);
  pulseWorlds(productivity.producing);
  checkGoal();
  saveState();
  render();
  playTone(360 + Math.min(260, routed * 20), 0.045);
}

function unlockState(key) {
  if (key === "routing" || key === "relay") return { unlocked: true, reason: "" };
  if (key === "merchant") return { unlocked: state.worlds.relay > 0, reason: "Requires Relay Moon" };
  if (key === "forge") return { unlocked: state.expansion, reason: "Requires Expansion Gate" };
  if (key === "resilience") return { unlocked: state.worlds.relay > 0, reason: "Requires Relay Moon" };
  if (key === "expansion") return { unlocked: state.worlds.merchant > 0, reason: "Requires Merchant Planet" };
  return { unlocked: false, reason: "Unavailable" };
}

function costFor(key) {
  if (key === "routing") return routingCost();
  if (WORLD_DEFS[key]) return effectiveWorldCost(key);
  if (key === "resilience") return RESILIENCE_COSTS[state.resilience] ?? 0;
  if (key === "expansion") return EXPANSION_COST;
  return 0;
}

function isCompleteBuild(key) {
  if (key === "routing") return state.routing >= ROUTING_DEF.max;
  if (WORLD_DEFS[key]) return state.worlds[key] >= WORLD_DEFS[key].max;
  if (key === "resilience") return state.resilience >= RESILIENCE_COSTS.length;
  if (key === "expansion") return state.expansion;
  return true;
}

function buy(key) {
  if (window.EmeraldArcade?.isPaused()) return;
  const unlock = unlockState(key);
  const cost = costFor(key);
  if (!unlock.unlocked || isCompleteBuild(key) || !cost || state.treasury < cost) return;
  const priorMaturity = networkMaturity().level;
  const priorRank = currentRank().name;
  sendToCirculation(cost);

  if (key === "routing") {
    state.routing += 1;
    state.productiveAllocated += cost;
    setEvent(`Routing Efficiency · Level ${state.routing}`, `Each click now routes ${clickReward()} fictional sats. Clicks advance time; they never control market direction.`, "good");
  } else if (WORLD_DEFS[key]) {
    state.worlds[key] += 1;
    state.productiveAllocated += cost;
    const verb = state.worlds[key] === 1 ? "connected" : `upgraded to Level ${state.worlds[key]}`;
    setEvent(`${WORLD_DEFS[key].name} ${verb}`, `${cost} sats returned to circulation. Its output and operating load both increased.`, "good");
  } else if (key === "resilience") {
    state.resilience += 1;
    state.resilienceAllocated += cost;
    setEvent(`Resilience Grid · Level ${state.resilience}`, "The shield lattice now absorbs more bear-regime drag and supports a larger network.", "good");
  } else if (key === "expansion") {
    state.expansion = true;
    state.growthAllocated += cost;
    setEvent("Expansion Gate opened", "Forge World is available. Add resilience and preserve at least three cycles of coverage to avoid overload.", "neutral");
  }

  if (priorMaturity !== networkMaturity().level) {
    setEvent(
      `Network Maturity · ${networkMaturity().name}`,
      networkMaturity().level === 1
        ? "Merchant Planet levels now cost 10% fewer fictional sats. Simulated price never enters this rule."
        : "Forge World levels now cost 15% fewer fictional sats. Load and level growth remain unchanged.",
      "good",
    );
  } else if (priorRank !== currentRank().name) {
    setEvent(`System Rank · ${currentRank().name}`, "Your allocation decisions advanced the system rank.", "good");
  }

  checkGoal();
  saveState();
  render();
  playTone(620, 0.1);
}

function connectedWorlds() {
  return Object.values(state.worlds).filter((level) => level > 0).length;
}

function allocationTotals() {
  return {
    reserve: state.treasury,
    productive: state.productiveAllocated,
    resilience: state.resilienceAllocated,
    growth: state.growthAllocated,
  };
}

function postureForAllocation() {
  const allocation = allocationTotals();
  const entries = Object.entries(allocation);
  const [largest] = entries.sort((a, b) => b[1] - a[1])[0];
  if (connectedWorlds() === 0) return "Liquid Observer";
  return {
    reserve: "Reserve Steward",
    productive: "World Builder",
    resilience: "System Guardian",
    growth: "Orbit Explorer",
  }[largest];
}

function checkGoal() {
  const complete = connectedWorlds() === 3 && epochForTick().index >= 1 && state.expansion && state.resilience >= 1 && !isOverloaded();
  if (!complete || state.goalComplete) return;
  state.goalComplete = true;
  setEvent("Genesis Orbit stabilized", "Three productive worlds are connected beyond the first contraction with supported expansion.", "good");
  if (!state.arcadeRecorded) {
    state.arcadeRecorded = true;
    window.EmeraldArcade?.recordAndNotify("satoshiSystem", arcadePayload(true));
  }
}

function arcadePayload(played) {
  return {
    score: state.ticks + connectedWorlds() * 500 + state.resilience * 250 + (state.expansion ? 300 : 0),
    rank: currentRank().name,
    ticks: state.ticks,
    connectedPlanets: connectedWorlds(),
    treasurySats: state.treasury,
    epoch: epochForTick().index + 1,
    played,
  };
}

function formatWhole(value) {
  return Math.floor(value).toLocaleString();
}

function formatCompact(value) {
  const absolute = Math.abs(value);
  if (absolute >= 1e15) return `${(value / 1e15).toFixed(2)}Q`;
  if (absolute >= 1e12) return `${(value / 1e12).toFixed(value >= 1e14 ? 0 : 1)}T`;
  if (absolute >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (absolute >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (absolute >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return formatWhole(value);
}

function nextRegimeOddsText() {
  return REGIME_TRANSITIONS[state.regime]
    .map((item) => `${Math.round(item.probability * 100)}% ${MARKET_REGIMES[item.regime].name}`)
    .join(" / ");
}

function ticksUntilRegimeReview() {
  const remainder = state.ticks % MARKET_REVIEW_TICKS;
  return remainder === 0 ? MARKET_REVIEW_TICKS : MARKET_REVIEW_TICKS - remainder;
}

function renderMarket() {
  const regime = MARKET_REGIMES[state.regime];
  document.body.dataset.regime = state.regime;
  els.simulatedPrice.textContent = `$${Math.round(state.price).toLocaleString()}`;
  const movePercent = state.lastReturn * 100;
  els.priceMove.textContent = state.ticks ? `${movePercent >= 0 ? "▲" : "▼"} ${Math.abs(movePercent).toFixed(2)}% this tick` : "Clock not started";
  els.regimeName.textContent = regime.name;
  els.regimeMeta.textContent = `${regime.drift >= 0 ? "+" : ""}${(regime.drift * 100).toFixed(2)}% drift · ±${(regime.noise * 100).toFixed(2)}% noise`;
  els.regimeOdds.textContent = `Regime review in ${ticksUntilRegimeReview()} ticks · next odds: ${nextRegimeOddsText()}`;

  const prices = state.priceHistory;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(1, max - min);
  els.sparkline.innerHTML = prices.map((price) => `<i style="--height:${22 + ((price - min) / range) * 72}%"></i>`).join("");
}

function renderAllocation() {
  const allocation = allocationTotals();
  const total = Math.max(1, Object.values(allocation).reduce((sum, amount) => sum + amount, 0));
  const reserveStop = allocation.reserve / total * 100;
  const productiveStop = reserveStop + allocation.productive / total * 100;
  const resilienceStop = productiveStop + allocation.resilience / total * 100;
  els.allocationRing.style.setProperty("--reserve-stop", `${reserveStop}%`);
  els.allocationRing.style.setProperty("--productive-stop", `${productiveStop}%`);
  els.allocationRing.style.setProperty("--resilience-stop", `${resilienceStop}%`);
  els.reserveAllocation.textContent = `${formatWhole(allocation.reserve)} sats`;
  els.productiveAllocation.textContent = `${formatWhole(allocation.productive)} sats`;
  els.resilienceAllocation.textContent = `${formatWhole(allocation.resilience)} sats`;
  els.growthAllocation.textContent = `${formatWhole(allocation.growth)} sats`;
  els.postureLabel.textContent = postureForAllocation();
}

function renderMaturity() {
  const maturity = networkMaturity();
  els.maturityLevel.textContent = maturity.name;
  els.maturityProgress.style.width = `${maturity.progress * 100}%`;
  if (maturity.level === 0) {
    const missing = [];
    if (state.ticks < 60) missing.push(`${60 - state.ticks} ticks`);
    if (!state.worlds.relay) missing.push("Relay Moon");
    els.maturityNext.textContent = `Networked requires ${missing.join(" + ") || "the next tick"}`;
  } else if (maturity.level === 1) {
    const missing = [];
    if (state.ticks < FIRST_CONTRACTION_TICK) missing.push(`Epoch II in ${FIRST_CONTRACTION_TICK - state.ticks} ticks`);
    if (!state.worlds.merchant) missing.push("Merchant Planet");
    els.maturityNext.textContent = `Mature requires ${missing.join(" + ") || "the next tick"}`;
  } else {
    els.maturityNext.textContent = "Mature affordability unlocked";
  }
  els.maturityRules.textContent = maturity.level >= 2
    ? "Mature applies a 10% Merchant and 15% Forge affordability adjustment to the next level. Exponential level costs, availability, and operating load remain."
    : maturity.level === 1
      ? "Networked applies a 10% affordability adjustment to the next Merchant level. Mature will apply 15% to Forge levels."
      : "Networked will adjust Merchant levels by 10%; Mature will adjust Forge levels by 15%. These are fixed game rules, not price forecasts.";
}

function renderBuilds() {
  for (const card of els.buildCards) {
    const key = card.dataset.buildCard;
    const button = card.querySelector("button");
    const unlock = unlockState(key);
    const complete = isCompleteBuild(key);
    const cost = costFor(key);
    const level = key === "routing" ? state.routing : WORLD_DEFS[key] ? state.worlds[key] : key === "resilience" ? state.resilience : Number(state.expansion);
    card.classList.toggle("is-built", level > 0);
    card.classList.toggle("is-maxed", complete);
    card.classList.toggle("is-locked", !unlock.unlocked);

    const levelChip = card.querySelector("[data-level-chip]");
    if (levelChip) {
      if (key === "resilience") levelChip.textContent = `Level ${state.resilience} / ${RESILIENCE_COSTS.length}`;
      else if (key === "expansion") levelChip.textContent = state.expansion ? "Gate Online" : "One-time unlock";
      else {
        const maximum = key === "routing" ? ROUTING_DEF.max : WORLD_DEFS[key].max;
        levelChip.textContent = `Level ${level} / ${maximum}`;
      }
    }

    if (complete) button.textContent = key === "expansion" ? "Gate Online" : `Maxed · Level ${level}`;
    else if (!unlock.unlocked) button.textContent = unlock.reason;
    else if (key === "resilience") button.textContent = `Reinforce L${state.resilience + 1} · ${formatWhole(cost)} sats`;
    else if (key === "routing") button.textContent = `Upgrade L${state.routing + 1} · ${formatWhole(cost)} sats`;
    else {
      const discounted = WORLD_DEFS[key] && cost < rawWorldCost(key);
      const action = key === "expansion" ? "Open" : state.worlds[key] > 0 ? `Upgrade L${state.worlds[key] + 1}` : "Build";
      button.textContent = `${action} · ${formatWhole(cost)} sats${discounted ? " · maturity" : ""}`;
    }
    button.disabled = complete || !unlock.unlocked || state.treasury < cost;
  }

  for (const [key, level] of Object.entries(state.worlds)) {
    document.querySelector(`[data-world-node="${key}"]`)?.classList.toggle("is-built", level > 0);
    const nodeLevel = document.querySelector(`[data-world-level="${key}"]`);
    if (nodeLevel) nodeLevel.textContent = `L${level}`;
  }
  els.gateNode.classList.toggle("is-open", state.expansion);
}

function renderStatus() {
  let event = state.lastEvent;
  if (state.stallTicks > 0) {
    event = {
      title: `Network Stall · ${state.stallTicks} recovery ticks`,
      text: "Commerce is operating at 25%. Direct clicks still route sats, so rebuild the reserve without restarting.",
      tone: "warning",
    };
  } else if (isOverloaded()) {
    event = {
      title: "Orbit Overload",
      text: state.resilience < 1
        ? "Expansion is online without a Resilience Grid. Reinforce the network to remove the productivity cap."
        : "Reserve coverage is below three operating cycles. Hold more sats to support the expanded orbit.",
      tone: "warning",
    };
  }
  els.statusTitle.textContent = event.title;
  els.statusText.textContent = event.text;
  els.statusCard.classList.toggle("is-warning", event.tone === "warning");
  els.statusCard.classList.toggle("is-good", event.tone === "good");

  const worlds = connectedWorlds();
  els.goalTitle.textContent = `Connect ${worlds} / 3 productive worlds`;
  const remaining = [];
  if (epochForTick().index < 1) remaining.push("pass the first contraction");
  if (!state.expansion) remaining.push("open the Expansion Gate");
  if (state.resilience < 1) remaining.push("build Resilience Level 1");
  if (isOverloaded() && state.resilience >= 1) remaining.push("hold three cycles of reserve coverage");
  if (worlds < 3) remaining.push(`connect ${3 - worlds} more world${3 - worlds === 1 ? "" : "s"}`);
  els.goalText.textContent = state.goalComplete ? "Genesis Orbit complete. Grow your worlds and explore later fictional market cycles." : `Next: ${remaining[0] || "stabilize the system"}.`;
  els.goalCard.classList.toggle("is-complete", state.goalComplete);
}

function render() {
  const epoch = epochForTick();
  const load = operatingLoad();
  const coverage = reserveCoverage();
  const remainingSupply = MAX_SUPPLY - state.globalIssued;
  const issuedPercent = state.globalIssued / MAX_SUPPLY * 100;

  els.treasuryBalance.textContent = formatWhole(state.treasury);
  els.perClickStat.textContent = clickReward();
  els.commerceStat.textContent = formatWhole(Math.round(baseCommercePerCycle() * commerceMultiplier()));
  els.loadStat.textContent = `${load} / ${MAINTENANCE_CYCLE_TICKS} ticks`;
  els.coverageStat.textContent = Number.isFinite(coverage) ? `${coverage} cycle${coverage === 1 ? "" : "s"}` : "No load";
  els.epochStat.textContent = epoch.index === 0 ? "I" : "II";
  els.epochBadge.textContent = `${epoch.name} · ${epoch.reward} base / ${clickReward()} routed`;
  els.remainingSupplyShort.textContent = `${formatCompact(remainingSupply)} sats remain unissued`;
  els.supplyHalo.style.setProperty("--issued", `${issuedPercent}%`);

  const firstEpochProgress = Math.min(1, state.ticks / FIRST_CONTRACTION_TICK);
  els.epochProgressBar.style.width = `${firstEpochProgress * 100}%`;
  els.epochProgressLabel.textContent = state.ticks < FIRST_CONTRACTION_TICK
    ? `${FIRST_CONTRACTION_TICK - state.ticks} ticks until the first contraction`
    : `First contraction passed at tick ${FIRST_CONTRACTION_TICK}`;

  els.issuedLedger.textContent = formatCompact(state.globalIssued);
  els.circulationLedger.textContent = formatCompact(state.circulation);
  els.treasuryLedger.textContent = formatWhole(state.treasury);
  const invariantHolds = state.globalIssued === state.circulation + state.treasury && state.globalIssued <= MAX_SUPPLY;
  els.ledgerCheck.textContent = invariantHolds ? "Balanced" : "Invariant warning";
  els.ledgerCheck.classList.toggle("is-warning", !invariantHolds);

  const rank = currentRank();
  const upcoming = nextRank();
  els.rankLabel.textContent = rank.name;
  els.nextRankLabel.textContent = upcoming ? `Next: ${upcoming.name} · ${formatWhole(upcoming.score - systemScore())} score` : "Highest system rank reached";

  renderMarket();
  renderAllocation();
  renderMaturity();
  renderBuilds();
  renderStatus();
}

function pulseStar() {
  els.genesisStar.classList.remove("is-pulsing");
  void els.genesisStar.offsetWidth;
  els.genesisStar.classList.add("is-pulsing");
  window.setTimeout(() => els.genesisStar.classList.remove("is-pulsing"), 120);
}

function spawnSatParticle(amount, event) {
  const particle = document.createElement("span");
  particle.className = "sat-particle";
  particle.textContent = `+${amount}`;
  const targetRect = els.genesisStar.getBoundingClientRect();
  const systemRect = els.satParticles.getBoundingClientRect();
  const clickX = Number.isFinite(event?.clientX) && event.clientX > 0 ? event.clientX : targetRect.left + targetRect.width / 2;
  particle.style.left = `${clickX - systemRect.left}px`;
  particle.style.top = `${targetRect.top + targetRect.height / 2 - systemRect.top}px`;
  particle.style.setProperty("--drift-x", `${Math.round((Math.random() - 0.5) * 90)}px`);
  els.satParticles.appendChild(particle);
  particle.addEventListener("animationend", () => particle.remove(), { once: true });
  // Reduced-motion settings can suppress animationend entirely.
  window.setTimeout(() => particle.remove(), 1_200);
}

function pulseWorlds(keys) {
  for (const key of keys) {
    const node = document.querySelector(`[data-world-node="${key}"]`);
    node?.classList.add("is-producing");
    window.setTimeout(() => node?.classList.remove("is-producing"), 240);
  }
}

function playTone(frequency, duration) {
  if (window.EmeraldArcade?.isMuted()) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audioContext ||= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.025, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

els.genesisStar.addEventListener("click", advanceTick);
for (const button of els.buyButtons) button.addEventListener("click", () => buy(button.dataset.buy));

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat || ["INPUT", "TEXTAREA", "BUTTON"].includes(document.activeElement?.tagName)) return;
  event.preventDefault();
  advanceTick(event);
});

els.resetButton.addEventListener("click", () => {
  if (!confirm("Reset this fictional Satoshi System simulation?")) return;
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  sessionStarted = false;
  saveState();
  render();
});

window.addEventListener("beforeunload", saveState);
window.__satoshiSystemDebug = {
  snapshot: () => JSON.parse(JSON.stringify(state)),
  invariantHolds: () => state.globalIssued === state.circulation + state.treasury && state.globalIssued <= MAX_SUPPLY,
  epochReward: () => epochForTick().reward,
  clickReward,
  currentRank: () => currentRank().name,
  operatingLoad,
  reserveCoverage,
};

saveState();
render();
