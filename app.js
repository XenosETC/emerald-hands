const saveCodec = window.EmeraldHandsSave;
const SAVE_KEY = saveCodec.key;
const RECOVERY_KEY = `${SAVE_KEY}-previous`;

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

const eventArt = {
  rage: { src: 'assets/emerald-hands-events/sage-of-rage.png', label: 'Emerald Sage of Rage' },
  corruption: { src: 'assets/emerald-hands-events/corrupted-shards.png', label: 'Corrupted Shards' },
  flush: { src: 'assets/emerald-hands-events/emerald-flush.png', label: 'Emerald Flush' },
  choice: { src: 'assets/scroll-choice-sage.png', label: "Sage's Due Diligence" },
};

const events = [
  { label: "Green Candle Blessing", body: "Momentum hits. Passive production gets a quick shard bonus.", effect: 0.18, art: eventArt.flush.src },
  { label: "Paper Hands Panic", body: "Weak hands shook out. You held the vault line.", effect: 0.08, art: upgradeArt.vault },
  { label: "Infra Flywheel", body: "Rails, servers, and workflows squeeze more yield from the machine.", effect: 0.14, art: 'assets/infra-core.png' },
  { label: "Business Roll-Up", body: "A tiny cash-flow asset joins the portfolio. Shards like discipline.", effect: 0.2, art: upgradeArt.business },
  { label: "Ancient Relic Found", body: "The OG vault hums. Your shard engine gets blessed.", effect: 0.25, art: 'assets/prestige-sage.png' },
  { label: "IP Run-Up", body: "The media studio minted attention while you were stacking.", effect: 0.22, art: upgradeArt.media },
  { label: "Deal Flow Hit", body: "The acquisition desk found a clean little operator.", effect: 0.28, art: upgradeArt.acquisition },
];

let saveBlocked = false;
let originalSave = null;
let saveMessage = '';
let pendingAction = null;
let pendingRestore = null;
let lastHistory = '';
const state = loadState();
let handsPlayRecorded = false;
let lastRankName = currentRank().name;
let rageTimer = 0;
let rageCooldown = 55;
let corruptionTimer = 0;
let corruptionCooldown = 92;
let flushTimer = 0;
let flushCooldown = 38;
let flushBoost = 1;
let flushDrop = 0;
let choiceTimer = 0;
let choiceCooldown = 70;
let choiceBoost = 1;
let choiceLabel = "";
let choiceResult = "";
let scrollChoiceOpen = false;
let specialEventStreak = 0;
let signalArt = null;
let signalTimer = 0;

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
  prestigeRankMeta: document.querySelector("#prestigeRankMeta"),
  rankLabel: document.querySelector("#rankLabel"),
  nextRankLabel: document.querySelector("#nextRankLabel"),
  rankProgress: document.querySelector("#rankProgress"),
  eventCard: document.querySelector("#eventCard"),
  empireArt: document.querySelector("#empireArt"),
  eventArtLabel: document.querySelector('#eventArtLabel'),
  rankProgressShell: document.querySelector("#rankProgressShell"),
  buyButtons: document.querySelectorAll("[data-buy]"),
  prestigeModal: document.querySelector("#prestigeModal"),
  prestigeMessage: document.querySelector("#prestigeMessage"),
  prestigeReward: document.querySelector("#prestigeReward"),
  prestigeTotal: document.querySelector("#prestigeTotal"),
  prestigeBoost: document.querySelector("#prestigeBoost"),
  prestigeRank: document.querySelector("#prestigeRank"),
  prestigeRankPath: document.querySelector("#prestigeRankPath"),
  prestigeLadder: document.querySelector("#prestigeLadder"),
  prestigeClosers: document.querySelectorAll("[data-close-prestige]"),
  scrollModal: document.querySelector("#scrollModal"),
  scrollChoices: document.querySelectorAll("[data-scroll-choice]"),
  confirmModal: document.querySelector('#confirmModal'),
  saveModal: document.querySelector('#saveModal'),
  saveCode: document.querySelector('#saveCode'),
  savePreview: document.querySelector('#savePreview'),
  restoreSave: document.querySelector('#restoreSave'),
  saveStatus: document.querySelector('#saveStatus'),
  buyAmount: document.querySelector('#buyAmount'),
};

let lastTick = performance.now();
let eventCooldown = 0;
let audioContext;

function loadState() {
  try {
    originalSave = localStorage.getItem(SAVE_KEY);
    const loaded = saveCodec.decode(originalSave);
    saveBlocked = loaded.status === 'unavailable';
    saveMessage = saveBlocked ? 'Save unreadable. Autosaving is paused; open Save vault to recover it.' : 'Autosaves on this browser. Back up in Save vault.';
    return loaded.state;
  } catch {
    saveMessage = 'Browser storage is unavailable. Use Save vault to copy your progress.';
    return saveCodec.fresh();
  }
}

function saveState() {
  if (saveBlocked) return false;
  state.lastSaved = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    saveMessage = 'Saved on this browser. Back up in Save vault.';
  } catch {
    saveMessage = 'Could not save. Keep this tab open and copy your code from Save vault.';
    els.saveStatus.textContent = saveMessage;
    return false;
  }
  els.saveStatus.textContent = saveMessage;
  recordArcadeProgress();
  return true;
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

function corruptionMultiplier() {
  return corruptionTimer > 0 ? 0.8 : 1;
}

function flushMultiplier() {
  return flushTimer > 0 ? flushBoost : 1;
}

function choiceMultiplier() {
  return choiceTimer > 0 ? choiceBoost : 1;
}

function researchMultiplier() {
  return upgrades.research.getValue(state.levels.research);
}

function perClick() {
  return (
    (upgrades.click.getValue(state.levels.click) + state.levels.media * 0.7) *
    vaultMultiplier() *
    rageMultiplier() *
    corruptionMultiplier()
  );
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
  return (
    (infra + business + media + acquisition + market) *
    synergy *
    vaultMultiplier() *
    rageMultiplier() *
    corruptionMultiplier() *
    flushMultiplier() *
    choiceMultiplier()
  );
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
  if (state.lifetimePrestiges === 0 && state.ogPoints === 0) return 1;
  return Math.max(1, Math.floor(Math.sqrt(state.totalEarned / 400000)) + Math.floor(state.levels.vault / 3));
}

function prestigeRankFor(points) {
  return prestigeRanks.reduce((best, rank) => (points >= rank.at ? rank : best), prestigeRanks[0]);
}

function nextPrestigeRankFor(points) {
  return prestigeRanks.find((rank) => rank.at > points) || null;
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
  if (!canPlay() || !upgrades[type]) return;
  const {cost, quantity} = purchaseQuote(type);
  if (!quantity || !Number.isFinite(cost) || state.shards < cost) return;
  state.shards -= cost;
  state.levels[type] += quantity;
  if (upgradeArt[type]) {
    state.featuredUpgrade = type;
  }
  chime(220 + state.levels[type] * 22, 0.08);
  announce(`${labelFor(type)} acquired`, `${quantity} ${quantity === 1 ? 'level' : 'levels'} · ${format(cost)} shards spent.`);
  render();
  saveState();
}

function purchaseQuote(type) {
  const wanted = els.buyAmount.value === 'max' ? Infinity : Number(els.buyAmount.value) || 1;
  let cost = 0;
  let quantity = 0;
  // Increasing costs eventually exceed any finite balance; the cap also bounds UI work.
  while (quantity < wanted && quantity < 1000) {
    const next = Math.floor(upgrades[type].baseCost * upgrades[type].growth ** (state.levels[type] + quantity));
    if (wanted === Infinity && cost + next > state.shards) break;
    cost += next;
    quantity += 1;
  }
  return {cost, quantity};
}

function canPlay() {
  return !window.EmeraldArcade?.isPaused?.() && !document.querySelector('dialog[open]');
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
  els.perClick.textContent = formatRate(perClick());
  els.perSecond.textContent = formatRate(perSecond());
  els.empireValue.textContent = format(empireValue());
  els.ogPoints.textContent = format(state.ogPoints);
  els.prestigeRankLabel.textContent = prestigeRankFor(state.ogPoints).name;
  const nextPrestigeRank = nextPrestigeRankFor(state.ogPoints);
  els.prestigeRankMeta.textContent = nextPrestigeRank
    ? `Next: ${nextPrestigeRank.name} at ${format(nextPrestigeRank.at)} OG`
    : "Max prestige rank";
  els.rankLabel.textContent = rank.name;
  els.nextRankLabel.textContent = next ? `Next: ${next.name}` : "Max rank reached";

  const progressStart = rank.at;
  const progressEnd = next ? next.at : rank.at;
  const progress = next ? (state.totalEarned - progressStart) / (progressEnd - progressStart) : 1;
  els.rankProgress.style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;
  els.rankProgressShell.classList.toggle("is-rage", rageTimer > 0);
  els.rankProgressShell.classList.toggle("is-corrupted", corruptionTimer > 0 && rageTimer <= 0);
  els.eventCard.classList.toggle("is-rage", rageTimer > 0);
  els.eventCard.classList.toggle("is-corrupted", corruptionTimer > 0 && rageTimer <= 0);
  els.eventCard.classList.toggle("is-flush", flushTimer > 0 && rageTimer <= 0 && corruptionTimer <= 0);
  els.eventCard.classList.toggle("is-choice", choiceTimer > 0 && rageTimer <= 0 && corruptionTimer <= 0 && flushTimer <= 0);
  if (rageTimer > 0) {
    announce(
      "Emerald Sage of Rage",
      `Orange lightning floods the vault. 2x clicks and passive shards for ${Math.ceil(rageTimer)}s.`
    );
  } else if (corruptionTimer > 0) {
    announce(
      "Corrupted Shards",
      `Dark galaxy lightning contaminates the rails. Clicks and shards/sec run at 80% efficiency for ${Math.ceil(
        corruptionTimer
      )}s.`
    );
  } else if (flushTimer > 0) {
    announce(
      "Emerald Flush",
      `Regenerative shard mine acquired. +${Math.round((flushBoost - 1) * 100)}% shards/sec for ${Math.ceil(
        flushTimer
      )}s. Mine payout: +${format(flushDrop)} shards.`
    );
  } else if (choiceTimer > 0) {
    announce(choiceLabel, `${choiceResult} +${Math.round((choiceBoost - 1) * 100)}% shards/sec for ${Math.ceil(choiceTimer)}s.`);
  }

  for (const button of els.buyButtons) {
    const type = button.dataset.buy;
    button.id = `buy-${type}`;
    const {cost, quantity} = purchaseQuote(type);
    button.textContent = `${quantity ? `Buy ${quantity} · ${format(cost)}` : `Need ${format(costFor(type))}`} | Lv ${state.levels[type]}`;
    button.setAttribute('aria-label', `${labelFor(type)}: ${button.textContent} shards`);
    button.disabled = quantity === 0 || !Number.isFinite(cost) || state.shards < cost;
  }

  const reward = prestigeReward();
  els.prestigeButton.textContent =
    reward > 0 ? `Prestige for ${format(reward)} OG Points` : "Reach Ancient OG to prestige";
  els.prestigeButton.disabled = reward === 0;

  renderEmpireArt(rank);
  renderJourney();
}

function activeEventArt() {
  if (rageTimer > 0) return {...eventArt.rage, kind: 'rage', seconds: rageTimer};
  if (corruptionTimer > 0) return {...eventArt.corruption, kind: 'corruption', seconds: corruptionTimer};
  if (flushTimer > 0) return {...eventArt.flush, kind: 'flush', seconds: flushTimer};
  if (choiceTimer > 0 || scrollChoiceOpen) return {...eventArt.choice, kind: 'choice', label: choiceTimer > 0 ? choiceLabel : eventArt.choice.label, seconds: choiceTimer};
  if (signalTimer > 0 && signalArt) return {...signalArt, kind: 'signal', seconds: signalTimer};
  return null;
}

function renderEmpireArt(rank) {
  const featured = selectedArtUpgrade(rank);
  const businessImage = upgradeArt[featured] || 'assets/infra-core.png';
  const active = activeEventArt();
  // A second background keeps the owned scene visible if event art is still
  // loading. Transient presentation never changes the saved featured upgrade.
  els.empireArt.style.backgroundImage = active ? `url("${active.src}"), url("${businessImage}")` : `url("${businessImage}")`;
  els.empireArt.dataset.event = active?.kind || '';
  els.empireArt.setAttribute('aria-label', active ? `${active.label} event artwork` : `${featured ? labelFor(featured) : 'Emerald infrastructure'} artwork`);
  els.eventArtLabel.hidden = !active;
  els.eventArtLabel.textContent = active ? `${active.label}${active.seconds > 0 ? ` · ${Math.ceil(active.seconds)}s` : ''}` : '';
}

function renderJourney() {
  const objective = saveCodec.objective(state);
  document.querySelector('#journeyLabel').textContent = objective.complete ? 'Journey complete · Endless play unlocked' : 'Your next move';
  document.querySelector('#journeyTitle').textContent = objective.title;
  document.querySelector('#journeyBody').textContent = objective.body;
  const action = document.querySelector('#journeyAction');
  action.hidden = !objective.target;
  action.textContent = objective.target === 'prestigeButton' ? 'View cycle goal' : 'Go to upgrade';
  document.querySelector('#careerProgress').textContent = `${format(state.ogPoints)} / 60 OG points · +${Math.round(state.ogPoints * 12)}% permanent production`;
  document.querySelector('#careerMeter').value = Math.min(60, state.ogPoints);
  document.querySelector('#cycleProgress').textContent = `${format(state.totalEarned)} / 400K shards earned this cycle`;
  els.saveStatus.textContent = saveMessage;
  els.resetButton.disabled = saveBlocked;
  document.querySelector('#cycleCount').textContent = `${state.lifetimePrestiges} completed`;
  const history = JSON.stringify(state.history);
  if (history !== lastHistory) {
    lastHistory = history;
    const list = document.querySelector('#cycleHistory');
    list.replaceChildren();
    for (const row of [...state.history].reverse()) {
      const entry = document.createElement('li');
      entry.textContent = `Cycle ${row.cycle} · ${format(row.totalEarned)} earned · +${row.reward} OG · ${row.ogPoints} total OG`;
      list.append(entry);
    }
    if (!state.history.length) {
      const entry = document.createElement('li');
      entry.textContent = 'Your next prestige will appear here. Earlier cycles keep their OG points and completion count.';
      list.append(entry);
    }
  }
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

function formatRate(value) {
  return value < 1000 ? Number(value.toFixed(2)).toLocaleString() : format(value);
}

function announce(label, body) {
  els.eventCard.innerHTML = `<span>${label}</span><strong>${body}</strong>`;
}

function maybeEvent(deltaSeconds) {
  eventCooldown -= deltaSeconds;
  rageCooldown = Math.max(0, rageCooldown - deltaSeconds);
  corruptionCooldown = Math.max(0, corruptionCooldown - deltaSeconds);
  flushCooldown = Math.max(0, flushCooldown - deltaSeconds);
  choiceCooldown = Math.max(0, choiceCooldown - deltaSeconds);
  if (eventCooldown > 0 || state.totalEarned < 90 || scrollChoiceOpen) return;

  eventCooldown = nextEventDelay();
  const eventType = chooseEventType();
  if (eventType === "rage") return triggerSageOfRage();
  if (eventType === "corruption") return triggerCorruptedShards();
  if (eventType === "flush") return triggerEmeraldFlush();
  if (eventType === "choice") return openScrollChoice();

  const event = events[Math.floor(Math.random() * events.length)];
  const bonus = Math.max(10, perSecond() * 6, state.totalEarned * event.effect * 0.015);
  earn(bonus);
  signalArt = {src: event.art, label: event.label};
  signalTimer = 6;
  announce(event.label, `${event.body} +${format(bonus)} shards.`);
  specialEventStreak = 0;
}

function nextEventDelay() {
  const empire = empireValue();
  if (empire >= 180000) return 20 + Math.random() * 13;
  if (empire >= 35000) return 22 + Math.random() * 15;
  return 26 + Math.random() * 16;
}

function chooseEventType() {
  const candidates = [{ type: "standard", weight: specialEventStreak > 0 ? 78 : 62 }];
  const quiet = rageTimer <= 0 && corruptionTimer <= 0 && flushTimer <= 0 && choiceTimer <= 0;
  const streakPenalty = specialEventStreak > 0 ? 0.45 : 1;

  if (quiet && rageCooldown <= 0 && state.totalEarned >= 650) {
    candidates.push({ type: "rage", weight: 7 * streakPenalty });
  }
  if (quiet && corruptionCooldown <= 0 && state.totalEarned >= 950) {
    candidates.push({ type: "corruption", weight: 11 * streakPenalty });
  }
  if (quiet && flushCooldown <= 0 && state.totalEarned >= 1200) {
    candidates.push({ type: "flush", weight: 22 * streakPenalty });
  }
  if (quiet && choiceCooldown <= 0 && state.totalEarned >= 2400) {
    candidates.push({ type: "choice", weight: 12 * streakPenalty });
  }

  const totalWeight = candidates.reduce((sum, event) => sum + event.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const event of candidates) {
    roll -= event.weight;
    if (roll <= 0) return event.type;
  }
  return "standard";
}

function openScrollChoice() {
  scrollChoiceOpen = true;
  specialEventStreak += 1;
  eventCooldown = 30 + Math.random() * 12;
  choiceCooldown = 150 + Math.random() * 70;
  announce("Sage's Due Diligence", "The Emerald Sage offers two scrolls. Choose volatility or stewardship.");
  els.scrollModal.showModal();
  document.body.classList.add("scroll-open");
  window.EmeraldArcade?.toast("Sage's Due Diligence", "Choose a scroll allocation", "assets/badges/market-sage.png");
}

function closeScrollChoice() {
  scrollChoiceOpen = false;
  els.scrollModal.close();
  document.body.classList.remove("scroll-open");
}

function chooseScroll(type) {
  if (!scrollChoiceOpen || !['risk', 'safe'].includes(type)) return;
  const empire = empireValue();
  if (type === "risk") {
    const success = Math.random() < 0.65;
    if (success) {
      const payout = Math.floor(Math.max(120, Math.min(empire * 0.028, state.totalEarned * 0.06)));
      earn(payout);
      choiceLabel = "Scroll of Volatile Dominion";
      choiceResult = `Acquisition hits. +${format(payout)} shards deployed.`;
      choiceBoost = 1.35;
      choiceTimer = 40;
      window.EmeraldArcade?.toast("Dominion Hit", `+${format(payout)} shards, risky boost live`, "assets/badges/gasbreaker.png");
      chime(260, 0.08);
      setTimeout(() => chime(880, 0.14), 110);
    } else {
      const cost = Math.floor(Math.min(state.shards * 0.12, empire * 0.008));
      state.shards = Math.max(0, state.shards - cost);
      choiceLabel = "Volatile Integration Drag";
      choiceResult = `Deal got messy. -${format(cost)} shards, but operators salvaged a smaller boost.`;
      choiceBoost = 1.12;
      choiceTimer = 20;
      window.EmeraldArcade?.toast("Messy Integration", "Risk scroll bit the treasury", "assets/badges/lp-reviver.png");
      chime(180, 0.12);
    }
  } else {
    const payout = Math.floor(Math.max(90, Math.min(empire * 0.012, state.totalEarned * 0.03)));
    earn(payout);
    choiceLabel = "Scroll of Steward's Yield";
    choiceResult = `Clean allocation secured. +${format(payout)} shards banked.`;
    choiceBoost = 1.12;
    choiceTimer = 30;
    window.EmeraldArcade?.toast("Steward's Yield", `+${format(payout)} shards, clean boost`, "assets/badges/shard-stacker.png");
    chime(520, 0.08);
    setTimeout(() => chime(720, 0.1), 110);
  }
  closeScrollChoice();
  announce(choiceLabel, choiceResult);
  render();
  saveState();
}

function triggerSageOfRage() {
  rageTimer = 30;
  specialEventStreak += 1;
  rageCooldown = 145 + Math.random() * 75;
  eventCooldown = 34 + Math.random() * 12;
  window.EmeraldArcade?.toast("Emerald Sage of Rage", "30s 2x shard frenzy", "assets/badges/market-sage.png");
  chime(180, 0.1);
  setTimeout(() => chime(540, 0.1), 90);
  setTimeout(() => chime(920, 0.16), 190);
}

function triggerCorruptedShards() {
  corruptionTimer = 30;
  specialEventStreak += 1;
  corruptionCooldown = 120 + Math.random() * 70;
  eventCooldown = 28 + Math.random() * 12;
  announce("Corrupted Shards", "Dark galaxy-purple lightning leaks into the shard rails. Efficiency drops by 20%.");
  window.EmeraldArcade?.toast("Corrupted Shards", "30s 80% shard efficiency", "assets/badges/boss-challenger.png");
  chime(130, 0.14);
  setTimeout(() => chime(220, 0.12), 120);
}

function triggerEmeraldFlush() {
  const empire = empireValue();
  const baseline = Math.max(75, empire * 0.006, perSecond() * 10);
  const cap = Math.max(120, Math.min(empire * 0.02, state.totalEarned * 0.05));
  flushDrop = Math.floor(Math.min(baseline, cap));
  flushBoost = 1.1 + Math.random() * 0.1;
  flushTimer = 45;
  specialEventStreak += 1;
  flushCooldown = 105 + Math.random() * 65;
  eventCooldown = 28 + Math.random() * 10;
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
  if (reward === 0 || !canPlay() || saveBlocked) return;
  requestConfirmation('Seal this cycle?', `${format(state.totalEarned)} earned this cycle → +${format(reward)} OG points. Your ${format(state.shards)} unspent shards and all shop levels reset. Keep ${format(state.ogPoints + reward)} total OG points, a +${Math.round((state.ogPoints + reward) * 12)}% permanent boost, and your sealed-cycle records.`, 'Seal cycle', sealCycle);
}

function sealCycle() {
  const reward = prestigeReward();
  if (!reward || saveBlocked) return;

  const summary = {
    reward,
    totalEarned: state.totalEarned,
    empireValue: empireValue(),
    oldPoints: state.ogPoints,
    newPoints: state.ogPoints + reward,
    runRank: currentRank().name,
  };

  const previousRun = saveCodec.restart(state);
  Object.assign(state, previousRun);
  state.ogPoints += reward;
  state.lifetimePrestiges += 1;
  state.history.push({cycle: state.lifetimePrestiges, reward, ogPoints: state.ogPoints,
    totalEarned: summary.totalEarned, empireValue: summary.empireValue, at: Date.now()});
  state.history = state.history.slice(-10);
  resetEvents();
  announce("OG Prestige Locked", `${format(reward)} OG Points secured. New runs start stronger.`);
  chime(740, 0.16);
  setTimeout(() => chime(980, 0.12), 120);
  setTimeout(() => chime(1240, 0.18), 260);
  render();
  showPrestigeModal(summary);
  saveState();
  recordArcadeProgress(false, true);
}

function resetEvents() {
  rageTimer = 0;
  corruptionTimer = 0;
  flushTimer = 0;
  flushBoost = 1;
  choiceTimer = 0;
  choiceBoost = 1;
  rageCooldown = 55;
  corruptionCooldown = 92;
  flushCooldown = 38;
  choiceCooldown = 70;
  eventCooldown = 0;
  specialEventStreak = 0;
  signalArt = null;
  signalTimer = 0;
  lastRankName = currentRank().name;
  closeScrollChoice();
}

function showPrestigeModal(summary) {
  const boostPercent = Math.round((1 + summary.newPoints * 0.12 - 1) * 100);
  const rank = prestigeRankFor(summary.newPoints);
  const oldRank = prestigeRankFor(summary.oldPoints);
  els.prestigeReward.textContent = `+${format(summary.reward)}`;
  els.prestigeTotal.textContent = format(summary.newPoints);
  els.prestigeBoost.textContent = `+${boostPercent}%`;
  els.prestigeRank.textContent = rank.name;
  els.prestigeRankPath.textContent =
    oldRank.name === rank.name ? `${rank.name} strengthened` : `${oldRank.name} to ${rank.name}`;
  renderPrestigeLadder(summary.oldPoints, summary.newPoints);
  els.prestigeMessage.textContent =
    `The Emerald Sage seals ${format(summary.totalEarned)} shards and ${format(summary.empireValue)} empire value from your ${summary.runRank} run. ` +
    `Your next cycle begins with ${format(summary.newPoints)} OG Points.`;
  const completed = summary.newPoints >= 60;
  document.querySelector('#prestigeModalTitle').textContent = completed ? 'Emerald Sovereign — Journey Complete' : 'The Vault Recognizes You';
  document.querySelector('#prestigeContinue').textContent = completed ? 'Continue in endless play' : 'Begin Next Cycle';
  els.prestigeModal.showModal();
  document.body.classList.add("prestige-open");
}

function renderPrestigeLadder(oldPoints, newPoints) {
  els.prestigeLadder.innerHTML = prestigeRanks
    .map((rank) => {
      const current = oldPoints >= rank.at;
      const landing = newPoints >= rank.at;
      const next = oldPoints < rank.at && newPoints < rank.at;
      const className = [
        "prestige-ladder__item",
        current ? "is-current" : "",
        !current && landing ? "is-earned" : "",
        next ? "is-locked" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `
        <div class="${className}">
          <span>${format(rank.at)} OG</span>
          <strong>${rank.name}</strong>
        </div>
      `;
    })
    .join("");
}

function closePrestigeModal() {
  els.prestigeModal.close();
  document.body.classList.remove("prestige-open");
}

function requestConfirmation(title, body, label, action) {
  pendingAction = action;
  document.querySelector('#confirmTitle').textContent = title;
  document.querySelector('#confirmBody').textContent = body;
  document.querySelector('#confirmAction').textContent = label;
  els.confirmModal.showModal();
}

function reviewBackup() {
  const result = saveCodec.decode(els.saveCode.value);
  pendingRestore = result.status === 'saved' ? result.state : null;
  els.restoreSave.hidden = !pendingRestore;
  els.savePreview.textContent = pendingRestore
    ? `${format(pendingRestore.shards)} shards · ${pendingRestore.ogPoints} OG points · ${pendingRestore.lifetimePrestiges} sealed cycles. Restoring replaces only this game's progress. Your previous save is kept for recovery.`
    : 'This is not a supported Emerald Hands save. Nothing has been replaced.';
}

function restoreBackup() {
  if (!pendingRestore) return;
  // Commit storage before changing the playable state. A failed recovery write
  // leaves the current run intact and keeps the dialog available for copying.
  try {
    const previous = localStorage.getItem(SAVE_KEY);
    if (previous !== null) localStorage.setItem(RECOVERY_KEY, previous);
    localStorage.setItem(SAVE_KEY, JSON.stringify(pendingRestore));
  } catch {
    els.savePreview.textContent = 'Restore could not be saved. Current progress is unchanged. Copy your code and free browser storage before retrying.';
    return;
  }
  Object.assign(state, pendingRestore);
  pendingRestore = null;
  originalSave = null;
  saveBlocked = false;
  resetEvents();
  saveMessage = 'Backup restored on this browser. Previous save kept in Save vault.';
  els.saveModal.close();
  render();
  recordArcadeProgress();
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
  try {
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
  } catch { /* Audio must never prevent a purchase, save, or new cycle. */ }
}

function loop(now) {
  const deltaSeconds = Math.max(0, Math.min(1, (now - lastTick) / 1000));
  lastTick = now;
  if (!canPlay()) { requestAnimationFrame(loop); return; }
  const hadBoost = rageTimer > 0 || corruptionTimer > 0 || flushTimer > 0 || choiceTimer > 0;
  rageTimer = Math.max(0, rageTimer - deltaSeconds);
  corruptionTimer = Math.max(0, corruptionTimer - deltaSeconds);
  flushTimer = Math.max(0, flushTimer - deltaSeconds);
  choiceTimer = Math.max(0, choiceTimer - deltaSeconds);
  signalTimer = Math.max(0, signalTimer - deltaSeconds);
  if (hadBoost && rageTimer === 0 && corruptionTimer === 0 && flushTimer === 0 && choiceTimer === 0) {
    announce('Steady production', 'The event has ended. Your permanent upgrades are still working.');
  }
  const passive = perSecond() * deltaSeconds;
  if (passive > 0) earn(passive);
  maybeEvent(deltaSeconds);
  render();
  requestAnimationFrame(loop);
}

els.shardButton.addEventListener("click", (event) => {
  if (!canPlay()) return;
  if (!handsPlayRecorded) {
    handsPlayRecorded = true;
    window.EmeraldArcade?.beginSession("hands", "emerald-hands.html");
    recordArcadeProgress(true, true);
  }
  const amount = perClick();
  earn(amount);
  const bounds = els.shardButton.getBoundingClientRect();
  pop(amount, event.detail === 0 ? bounds.left + bounds.width / 2 : event.clientX,
    event.detail === 0 ? bounds.top + bounds.height / 2 : event.clientY);
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

for (const choice of els.scrollChoices) {
  choice.addEventListener("click", () => chooseScroll(choice.dataset.scrollChoice));
}

els.resetButton.addEventListener("click", () => {
  if (!canPlay() || saveBlocked) return;
  requestConfirmation('Restart this cycle?', `Lose ${format(state.shards)} unspent shards, this cycle's earned total, and all shop levels. Keep your ${format(state.ogPoints)} OG points, permanent boost, and ${state.lifetimePrestiges} sealed cycles. No prestige reward is awarded.`, 'Restart cycle', () => {
    Object.assign(state, saveCodec.restart(state));
    resetEvents();
    announce('Cycle restarted', 'Your OG points and sealed-cycle records are preserved.');
    render();
    saveState();
  });
});

els.buyAmount.addEventListener('change', render);
window.addEventListener('keydown', event => {
  const dialog = document.querySelector('dialog[open]');
  if (!dialog) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    pendingAction = null;
    dialog.close();
  } else if (event.key === 'Tab') {
    const controls = [...dialog.querySelectorAll('button:not([disabled]):not([hidden]), textarea, select, summary')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault(); first?.focus();
    }
  }
});
document.querySelector('#journeyAction').addEventListener('click', () => {
  const target = document.getElementById(saveCodec.objective(state).target);
  target?.scrollIntoView({block: 'center', behavior: 'smooth'});
  if (!target?.disabled) target?.focus({preventScroll: true});
});
document.querySelector('#confirmAction').addEventListener('click', () => {
  const action = pendingAction;
  pendingAction = null;
  els.confirmModal.close();
  action?.();
});
document.querySelector('#cancelAction').addEventListener('click', () => { pendingAction = null; els.confirmModal.close(); });
els.confirmModal.addEventListener('cancel', () => { pendingAction = null; });
els.prestigeModal.addEventListener('close', () => document.body.classList.remove('prestige-open'));
els.scrollModal.addEventListener('close', () => { scrollChoiceOpen = false; document.body.classList.remove('scroll-open'); });
document.querySelector('#skipScroll').addEventListener('click', closeScrollChoice);
document.querySelector('#saveVaultButton').addEventListener('click', () => {
  pendingRestore = null;
  els.restoreSave.hidden = true;
  els.saveCode.value = saveBlocked ? originalSave : JSON.stringify(state);
  els.savePreview.textContent = saveBlocked ? 'The original unreadable save is preserved here. Copy it before trying a valid backup.' : 'This is your current save code. Copy it to keep a backup.';
  els.saveModal.showModal();
});
document.querySelector('#closeSave').addEventListener('click', () => els.saveModal.close());
document.querySelector('#copySave').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(els.saveCode.value); els.savePreview.textContent = 'Save code copied. Keep it somewhere safe.'; }
  catch { els.saveCode.focus(); els.saveCode.select(); els.savePreview.textContent = 'Code selected. Press Ctrl+C (or Copy on your device) to copy it.'; }
});
els.saveCode.addEventListener('input', () => { pendingRestore = null; els.restoreSave.hidden = true; els.savePreview.textContent = 'Review this code before restoring.'; });
document.querySelector('#previewSave').addEventListener('click', reviewBackup);
els.restoreSave.addEventListener('click', restoreBackup);
document.querySelector('#previousSave').addEventListener('click', () => {
  pendingRestore = null;
  els.restoreSave.hidden = true;
  try {
    const previous = localStorage.getItem(RECOVERY_KEY);
    if (previous === null) { els.savePreview.textContent = 'No previous restore is stored on this browser.'; return; }
    els.saveCode.value = previous;
    reviewBackup();
  } catch { els.savePreview.textContent = 'Browser storage is unavailable.'; }
});

setInterval(saveState, 2500);
window.addEventListener("beforeunload", saveState);
window.addEventListener('pagehide', saveState);
// The explicitly confirmed arcade-wide erase must not be undone by exit autosave.
window.addEventListener('emeraldarcade:reset', () => { saveBlocked = true; });
render();
recordArcadeProgress();
requestAnimationFrame(loop);
