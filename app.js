const SAVE_KEY = "emerald-hands-v1";

const upgrades = {
  click: {
    baseCost: 15,
    growth: 1.62,
    getValue: (level) => 1 + level,
  },
  infra: {
    baseCost: 65,
    growth: 1.76,
    getValue: (level) => level * 2.4,
  },
  business: {
    baseCost: 420,
    growth: 1.82,
    getValue: (level) => level * 13,
  },
  vault: {
    baseCost: 3200,
    growth: 2.2,
    getValue: (level) => 1 + level * 0.18,
  },
  media: {
    baseCost: 9500,
    growth: 1.9,
    getValue: (level) => level * 38,
  },
  acquisition: {
    baseCost: 18000,
    growth: 1.96,
    getValue: (level) => level * 76,
  },
  research: {
    baseCost: 42000,
    growth: 2.05,
    getValue: (level) => 1 + level * 0.06,
  },
  market: {
    baseCost: 86000,
    growth: 2.08,
    getValue: (level) => level * 145,
  },
};

const ranks = [
  { name: "Noob Retail", at: 0 },
  { name: "Bag Holder", at: 120 },
  { name: "Shard Stacker", at: 650 },
  { name: "Infra Operator", at: 2200 },
  { name: "Business Buyer", at: 8500 },
  { name: "Emerald Capitalist", at: 26000 },
  { name: "Studio Operator", at: 65000 },
  { name: "Acquisition Lord", at: 160000 },
  { name: "Ancient OG", at: 400000 },
];

const prestigeRanks = [
  { name: "Retail Ghost", at: 0 },
  { name: "Emerald Initiate", at: 1 },
  { name: "Vault Disciple", at: 3 },
  { name: "Market Sage", at: 7 },
  { name: "Ancient Allocator", at: 15 },
  { name: "Mythic Operator", at: 30 },
  { name: "Emerald Sovereign", at: 60 },
];

const upgradeArt = {
  business: "assets/business-district.png",
  vault: "assets/og-vault.png",
  media: "assets/media-studio.png",
  acquisition: "assets/acquisition-desk.png",
  research: "assets/research-lab.png",
  market: "assets/market-building.png",
};

const events = [
  { label: "Green Candle Blessing", body: "Momentum hits. Passive production gets a quick shard bonus.", effect: 0.18 },
  { label: "Paper Hands Panic", body: "Weak hands shook out. You held the vault line.", effect: 0.08 },
  { label: "Infra Flywheel", body: "Rails, servers, and workflows squeeze more yield from the machine.", effect: 0.14 },
  { label: "Business Roll-Up", body: "A tiny cash-flow asset joins the portfolio. Shards like discipline.", effect: 0.2 },
  { label: "Ancient Relic Found", body: "The OG vault hums. Your shard engine gets blessed.", effect: 0.25 },
  { label: "IP Run-Up", body: "The media studio minted attention while you were stacking.", effect: 0.22 },
  { label: "Deal Flow Hit", body: "The acquisition desk found a clean little operator.", effect: 0.28 },
];

const state = loadState();
let handsPlayRecorded = false;
let lastRankName = currentRank().name;
let rageTimer = 0;
let rageCooldown = 55;
let flushTimer = 0;
let flushCooldown = 38;
let flushBoost = 1;
let flushDrop = 0;

const els = {
  shardButton: document.querySelector("#shardButton"),
  resetButton: document.querySelector("#resetButton"),
  prestigeButton: document.querySelector("#prestigeButton"),
  shardCount: document.querySelector("#shardCount"),
  perClick: document.querySelector("#perClick"),
  perSecond: document.querySelector("#perSecond"),
  empireValue: document.querySelector("#empireValue"),
  ogPoints: document.querySelector("#ogPoints"),
  prestigeRankLabel: document.querySelector("#prestigeRankLabel"),
  rankLabel: document.querySelector("#rankLabel"),
  nextRankLabel: document.querySelector("#nextRankLabel"),
  rankProgress: document.querySelector("#rankProgress"),
  eventCard: document.querySelector("#eventCard"),
  empireArt: document.querySelector("#empireArt"),
  rankProgressShell: document.querySelector("#rankProgressShell"),
  buyButtons: document.querySelectorAll("[data-buy]"),
  prestigeModal: document.querySelector("#prestigeModal"),
  prestigeMessage: document.querySelector("#prestigeMessage"),
  prestigeReward: document.querySelector("#prestigeReward"),
  prestigeTotal: document.querySelector("#prestigeTotal"),
  prestigeBoost: document.querySelector("#prestigeBoost"),
  prestigeRank: document.querySelector("#prestigeRank"),
  prestigeClosers: document.querySelectorAll("[data-close-prestige]"),
};

let lastTick = performance.now();
let eventCooldown = 0;
let audioContext;

function loadState() {
  const fallback = {
    shards: 0,
    totalEarned: 0,
    ogPoints: 0,
    lifetimePrestiges: 0,
    levels: { click: 0, infra: 0, business: 0, vault: 0, media: 0, acquisition: 0, research: 0, market: 0 },
    featuredUpgrade: null,
    lastSaved: Date.now(),
  };

  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    return {
      ...fallback,
      ...saved,
      levels: { ...fallback.levels, ...saved?.levels },
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  state.lastSaved = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  recordArcadeProgress();
}

function costFor(type) {
  const upgrade = upgrades[type];
  return Math.floor(upgrade.baseCost * upgrade.growth ** state.levels[type]);
}

function vaultMultiplier() {
  return upgrades.vault.getValue(state.levels.vault) * prestigeMultiplier() * researchMultiplier();
}

function prestigeMultiplier() {
  return 1 + state.ogPoints * 0.12;
}

function rageMultiplier() {
  return rageTimer > 0 ? 2 : 1;
}

function flushMultiplier() {
  return flushTimer > 0 ? flushBoost : 1;
}

function researchMultiplier() {
  return upgrades.research.getValue(state.levels.research);
}

function perClick() {
  return (upgrades.click.getValue(state.levels.click) + state.levels.media * 0.7) * vaultMultiplier() * rageMultiplier();
}

function perSecond() {
  const infra = upgrades.infra.getValue(state.levels.infra);
  const business = upgrades.business.getValue(state.levels.business);
  const media = upgrades.media.getValue(state.levels.media);
  const acquisition = upgrades.acquisition.getValue(state.levels.acquisition);
  const market = upgrades.market.getValue(state.levels.market);
  const synergy =
    1 +
    state.levels.business * 0.035 +
    state.levels.infra * 0.012 +
    state.levels.acquisition * 0.025 +
    state.levels.market * 0.03;
  return (infra + business + media + acquisition + market) * synergy * vaultMultiplier() * rageMultiplier() * flushMultiplier();
}

function empireValue() {
  return Math.floor(
    state.totalEarned +
      state.levels.infra * 220 +
      state.levels.business * 1450 +
      state.levels.vault * 8400 +
      state.levels.media * 12400 +
      state.levels.acquisition * 27500 +
      state.levels.research * 52000 +
      state.levels.market * 94000 +
      state.ogPoints * 100000
  );
}

function prestigeReward() {
  if (state.totalEarned < 400000) return 0;
  return Math.max(1, Math.floor(Math.sqrt(state.totalEarned / 400000)) + state.levels.vault);
}

function prestigeRankFor(points) {
  return prestigeRanks.reduce((best, rank) => (points >= rank.at ? rank : best), prestigeRanks[0]);
}

function currentRank() {
  return ranks.reduce((best, rank) => (state.totalEarned >= rank.at ? rank : best), ranks[0]);
}

function nextRank() {
  return ranks.find((rank) => rank.at > state.totalEarned) || null;
}

function earn(amount) {
  state.shards += amount;
  state.totalEarned += amount;
}

function buy(type) {
  const cost = costFor(type);
  if (state.shards < cost) return;
  state.shards -= cost;
  state.levels[type] += 1;
  if (upgradeArt[type]) {
    state.featuredUpgrade = type;
  }
  chime(220 + state.levels[type] * 22, 0.08);
  announce(`${labelFor(type)} acquired`, `${format(cost)} shards deployed. The machine gets cleaner.`);
  render();
  saveState();
}

function labelFor(type) {
  return {
    click: "Sharper Hands",
    infra: "Emerald Rails",
    business: "Shard Business",
    vault: "OG Vault",
    media: "Media Studio",
    acquisition: "Acquisition Desk",
    research: "Research Lab",
    market: "Market Building",
  }[type];
}

function render() {
  const next = nextRank();
  const rank = currentRank();
  if (rank.name !== lastRankName) {
    announce("Rank Up", `${rank.name} unlocked. The shard stack is getting serious.`);
    window.EmeraldArcade?.toast("Emerald Hands Rank", rank.name, "assets/badges/lp-reviver.png");
    lastRankName = rank.name;
  }

  els.shardCount.textContent = format(state.shards);
  els.perClick.textContent = format(perClick());
  els.perSecond.textContent = format(perSecond());
  els.empireValue.textContent = format(empireValue());
  els.ogPoints.textContent = format(state.ogPoints);
  els.prestigeRankLabel.textContent = prestigeRankFor(state.ogPoints).name;
  els.rankLabel.textContent = rank.name;
  els.nextRankLabel.textContent = next ? `Next: ${next.name}` : "Max rank reached";

  const progressStart = rank.at;
  const progressEnd = next ? next.at : rank.at;
  const progress = next ? (state.totalEarned - progressStart) / (progressEnd - progressStart) : 1;
  els.rankProgress.style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;
  els.rankProgressShell.classList.toggle("is-rage", rageTimer > 0);
  els.eventCard.classList.toggle("is-rage", rageTimer > 0);
  els.eventCard.classList.toggle("is-flush", flushTimer > 0 && rageTimer <= 0);
  if (rageTimer > 0) {
    announce(
      "Emerald Sage of Rage",
      `Orange lightning floods the vault. 2x clicks and passive shards for ${Math.ceil(rageTimer)}s.`
    );
  } else if (flushTimer > 0) {
    announce(
      "Emerald Flush",
      `Regenerative shard mine acquired. +${Math.round((flushBoost - 1) * 100)}% shards/sec for ${Math.ceil(
        flushTimer
      )}s. Mine payout: +${format(flushDrop)} shards.`
    );
  }

  for (const button of els.buyButtons) {
    const type = button.dataset.buy;
    const cost = costFor(type);
    button.textContent = `Buy ${format(cost)} | Lv ${state.levels[type]}`;
    button.disabled = state.shards < cost;
  }

  const reward = prestigeReward();
  els.prestigeButton.textContent =
    reward > 0 ? `Prestige for ${format(reward)} OG Points` : "Reach Ancient OG to prestige";
  els.prestigeButton.disabled = reward === 0;

  const featuredUpgrade = selectedArtUpgrade(rank);
  els.empireArt.style.backgroundImage = `url("${upgradeArt[featuredUpgrade] || "assets/infra-core.png"}")`;
}

function selectedArtUpgrade(rank) {
  if (state.featuredUpgrade && state.levels[state.featuredUpgrade] > 0) {
    return state.featuredUpgrade;
  }

  const fallbackOrder = ["market", "research", "acquisition", "media", "vault", "business"];
  const ownedUpgrade = fallbackOrder.find((type) => state.levels[type] > 0);
  if (ownedUpgrade) return ownedUpgrade;
  if (rank.name === "Ancient OG") return "vault";
  return null;
}

function format(value) {
  if (value < 1000) return Math.floor(value).toLocaleString();
  if (value < 1000000) return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}K`;
  return `${(value / 1000000).toFixed(value < 10000000 ? 1 : 0)}M`;
}

function announce(label, body) {
  els.eventCard.innerHTML = `<span>${label}</span><strong>${body}</strong>`;
}

function maybeEvent(deltaSeconds) {
  eventCooldown -= deltaSeconds;
  rageCooldown = Math.max(0, rageCooldown - deltaSeconds);
  flushCooldown = Math.max(0, flushCooldown - deltaSeconds);
  if (eventCooldown > 0 || state.totalEarned < 90) return;

  eventCooldown = 18 + Math.random() * 16;
  if (rageTimer <= 0 && rageCooldown <= 0 && state.totalEarned >= 650 && Math.random() < 0.18) {
    triggerSageOfRage();
    return;
  }

  if (rageTimer <= 0 && flushTimer <= 0 && flushCooldown <= 0 && state.totalEarned >= 1200 && Math.random() < 0.24) {
    triggerEmeraldFlush();
    return;
  }

  const event = events[Math.floor(Math.random() * events.length)];
  const bonus = Math.max(10, perSecond() * 6, state.totalEarned * event.effect * 0.015);
  earn(bonus);
  announce(event.label, `${event.body} +${format(bonus)} shards.`);
}

function triggerSageOfRage() {
  rageTimer = 30;
  rageCooldown = 105 + Math.random() * 55;
  eventCooldown = 22 + Math.random() * 8;
  window.EmeraldArcade?.toast("Emerald Sage of Rage", "30s 2x shard frenzy", "assets/badges/market-sage.png");
  chime(180, 0.1);
  setTimeout(() => chime(540, 0.1), 90);
  setTimeout(() => chime(920, 0.16), 190);
}

function triggerEmeraldFlush() {
  const empire = empireValue();
  const baseline = Math.max(75, empire * 0.006, perSecond() * 10);
  const cap = Math.max(120, Math.min(empire * 0.02, state.totalEarned * 0.05));
  flushDrop = Math.floor(Math.min(baseline, cap));
  flushBoost = 1.1 + Math.random() * 0.1;
  flushTimer = 45;
  flushCooldown = 85 + Math.random() * 55;
  eventCooldown = 18 + Math.random() * 8;
  earn(flushDrop);
  announce(
    "Emerald Flush",
    `A magical regenerative shard mine joins the empire. +${format(flushDrop)} shards and +${Math.round(
      (flushBoost - 1) * 100
    )}% shards/sec.`
  );
  window.EmeraldArcade?.toast("Emerald Flush", `+${format(flushDrop)} shards, mine boost online`, "assets/badges/shard-stacker.png");
  chime(420, 0.08);
  setTimeout(() => chime(680, 0.1), 110);
}

function prestige() {
  const reward = prestigeReward();
  if (reward === 0) return;
  const confirmed = confirm(`Reset this run for ${format(reward)} OG Points?`);
  if (!confirmed) return;

  const summary = {
    reward,
    totalEarned: state.totalEarned,
    empireValue: empireValue(),
    oldPoints: state.ogPoints,
    newPoints: state.ogPoints + reward,
    runRank: currentRank().name,
  };

  state.shards = 0;
  state.totalEarned = 0;
  state.ogPoints += reward;
  state.lifetimePrestiges += 1;
  state.levels = { click: 0, infra: 0, business: 0, vault: 0, media: 0, acquisition: 0, research: 0, market: 0 };
  state.featuredUpgrade = null;
  rageTimer = 0;
  flushTimer = 0;
  flushBoost = 1;
  announce("OG Prestige Locked", `${format(reward)} OG Points secured. New runs start stronger.`);
  chime(740, 0.16);
  setTimeout(() => chime(980, 0.12), 120);
  setTimeout(() => chime(1240, 0.18), 260);
  render();
  showPrestigeModal(summary);
  saveState();
  recordArcadeProgress(false, true);
}

function showPrestigeModal(summary) {
  const boostPercent = Math.round((1 + summary.newPoints * 0.12 - 1) * 100);
  const rank = prestigeRankFor(summary.newPoints);
  els.prestigeReward.textContent = `+${format(summary.reward)}`;
  els.prestigeTotal.textContent = format(summary.newPoints);
  els.prestigeBoost.textContent = `+${boostPercent}%`;
  els.prestigeRank.textContent = rank.name;
  els.prestigeMessage.textContent =
    `The Emerald Sage seals ${format(summary.totalEarned)} shards and ${format(summary.empireValue)} empire value from your ${summary.runRank} run. ` +
    `Your next cycle begins with ${format(summary.newPoints)} OG Points.`;
  els.prestigeModal.hidden = false;
  document.body.classList.add("prestige-open");
}

function closePrestigeModal() {
  els.prestigeModal.hidden = true;
  document.body.classList.remove("prestige-open");
}

function recordArcadeProgress(played = false, notify = false) {
  const recorder = notify ? window.EmeraldArcade?.recordAndNotify : window.EmeraldArcade?.record;
  recorder?.("hands", {
    prestigeRank: prestigeRankFor(state.ogPoints).name,
    ogPoints: state.ogPoints,
    empireValue: empireValue(),
    totalEarned: state.totalEarned,
    played,
  });
}

function pop(amount, x, y) {
  const node = document.createElement("div");
  node.className = "float-pop";
  node.textContent = `+${format(amount)}`;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  document.body.append(node);
  node.addEventListener("animationend", () => node.remove(), { once: true });
}

function chime(frequency, duration) {
  audioContext ||= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function loop(now) {
  const deltaSeconds = Math.min(1, (now - lastTick) / 1000);
  lastTick = now;
  rageTimer = Math.max(0, rageTimer - deltaSeconds);
  flushTimer = Math.max(0, flushTimer - deltaSeconds);
  const passive = perSecond() * deltaSeconds;
  if (passive > 0) earn(passive);
  maybeEvent(deltaSeconds);
  render();
  requestAnimationFrame(loop);
}

els.shardButton.addEventListener("click", (event) => {
  if (!handsPlayRecorded) {
    handsPlayRecorded = true;
    recordArcadeProgress(true, true);
  }
  const amount = perClick();
  earn(amount);
  pop(amount, event.clientX, event.clientY);
  chime(520 + Math.random() * 80, 0.05);
  render();
});

for (const button of els.buyButtons) {
  button.addEventListener("click", () => buy(button.dataset.buy));
}

els.prestigeButton.addEventListener("click", prestige);

for (const closer of els.prestigeClosers) {
  closer.addEventListener("click", closePrestigeModal);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.prestigeModal.hidden) {
    closePrestigeModal();
  }
});

els.resetButton.addEventListener("click", () => {
  const confirmed = confirm("Reset this Emerald Hands run?");
  if (!confirmed) return;
  localStorage.removeItem(SAVE_KEY);
  Object.assign(state, loadState());
  announce("Fresh Run", "Back to retail. The path to OG is open again.");
  render();
  saveState();
});

setInterval(saveState, 2500);
window.addEventListener("beforeunload", saveState);
render();
recordArcadeProgress();
requestAnimationFrame(loop);
