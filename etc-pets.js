const els = {
  roster: document.querySelector("#petRoster"),
  name: document.querySelector("#petName"),
  title: document.querySelector("#petTitle"),
  mood: document.querySelector("#petMood"),
  hungerBar: document.querySelector("#hungerBar"),
  joyBar: document.querySelector("#joyBar"),
  auraBar: document.querySelector("#auraBar"),
  strengthBar: document.querySelector("#strengthBar"),
  hunger: document.querySelector("#hungerLabel"),
  joy: document.querySelector("#joyLabel"),
  aura: document.querySelector("#auraLabel"),
  strength: document.querySelector("#strengthLabel"),
  shardBalance: document.querySelector("#arcadeShardBalance"),
  shootBalance: document.querySelector("#bambooShootBalance"),
  stickBalance: document.querySelector("#bambooStickBalance"),
  status: document.querySelector("#petActionStatus"),
  training: document.querySelector("#trainingProgress"),
  trainingGoal: document.querySelector("#trainingGoal"),
  rosterProgress: document.querySelector("#rosterProgress"),
  assist: document.querySelector("#assistReport"),
  history: document.querySelector("#careHistory"),
};

let completedSession = false;
let startedSession = false;
let celebrationTimer;
let showedUnreadableSave = false;
let rosterMarkup;
const panel = document.querySelector("#sanctuaryPanel");
const panelStatus = document.querySelector("#panelStatus");
let panelOrigin;
let pausedBeforePanel = false;
let shopMarkup;
const residents = window.PetSanctuary.create(document.querySelector("#sanctuaryResidents"), {
  onSelect: id => selectResident(id),
});

function showPanel(view) {
  document.querySelectorAll("[data-panel-view]").forEach(section => { section.hidden = section.dataset.panelView !== view; });
  document.querySelectorAll("[data-panel]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.panel === view)));
  document.querySelector("#panelTitle").textContent = { roster: "Your companions", shop: "Sanctuary shop", details: "Care & arcade assists" }[view];
  document.querySelector(".panel-content").scrollTop = 0;
  if (!panel.open) {
    panelOrigin = document.activeElement;
    pausedBeforePanel = Boolean(window.EmeraldArcade?.isPaused?.());
    window.EmeraldArcade?.setPaused?.(true);
    panel.showModal();
  }
}
for (const [id, view] of [["openRoster", "roster"], ["openShop", "shop"], ["openDetails", "details"]]) {
  document.querySelector(`#${id}`).addEventListener("click", () => showPanel(view));
}
document.querySelectorAll("[data-panel]").forEach(button => button.addEventListener("click", () => showPanel(button.dataset.panel)));
document.querySelector("#closePanel").addEventListener("click", () => panel.close());
panel.addEventListener("close", () => {
  if (!pausedBeforePanel) window.EmeraldArcade?.setPaused?.(false);
  panelOrigin?.focus({ preventScroll: true });
});

function renderHome(data, excited) {
  const home = data.sanctuary;
  const habitat = window.ArcadePet.habitats.find(item => item.id === home.habitat);
  document.querySelector(".sanctuary").dataset.habitat = habitat.id;
  document.querySelector("#habitatName").textContent = habitat.name;
  document.querySelector("#residentCount").textContent = `${data.unlocked.length} resident${data.unlocked.length === 1 ? "" : "s"} · a home for every companion`;
  const decorHost = document.querySelector("#sanctuaryDecorations");
  const decorKey = home.decorations.join(",");
  if (decorHost.dataset.items !== decorKey) {
    decorHost.dataset.items = decorKey;
    decorHost.innerHTML = home.decorations.map(id => `<div class="sanctuary-decoration decor-${id}" data-placed-decoration="${id}"><img src="assets/etc-pets/decoration-${id}-v1.webp" alt="" width="512" height="${id === "pond" ? 341 : 468}" decoding="async"></div>`).join("");
  }
  residents.update(data, { excited });
  const balance = window.EmeraldArcade.arcadeShardBalance();
  const blocked = actionPending || !window.ArcadePet.saveReadable();
  const descriptions = Object.fromEntries(window.ArcadePet.habitats.map(item => [item.id, item.description]));
  const nextShop = window.ArcadePet.habitats.map(item => {
    const owned = home.ownedHabitats.includes(item.id), equipped = home.habitat === item.id;
    return `<article class="shop-item"><div class="habitat-swatch" data-habitat="${item.id}" aria-hidden="true"></div><div><h4>${item.name}</h4><p>${descriptions[item.id]}</p><button type="button" data-habitat="${item.id}" ${blocked || equipped || (!owned && balance < item.cost) ? "disabled" : ""}>${equipped ? "Equipped" : owned ? "Equip" : `Buy · ${item.cost} shards`}</button></div></article>`;
  }).join("") + "|" + window.ArcadePet.decorations.map(item => {
    const owned = home.ownedDecorations.includes(item.id), placed = home.decorations.includes(item.id);
    return `<article class="shop-item"><div class="decor-preview" aria-hidden="true"><img src="assets/etc-pets/decoration-${item.id}-v1.webp" alt="" loading="lazy"></div><div><h4>${item.name}</h4><p>${owned ? "Owned permanently" : "Cosmetic furnishing"}</p><button type="button" data-decoration="${item.id}" ${blocked || (!owned && balance < item.cost) ? "disabled" : ""}>${placed ? "Store" : owned ? "Place" : `Buy · ${item.cost} shards`}</button></div></article>`;
  }).join("");
  if (nextShop !== shopMarkup) {
    const focused = document.activeElement;
    const focusKey = focused?.dataset.habitat ? ["habitat", focused.dataset.habitat] : focused?.dataset.decoration ? ["decoration", focused.dataset.decoration] : null;
    shopMarkup = nextShop;
    const [habitats, decorations] = nextShop.split("|");
    document.querySelector("#habitatShop").innerHTML = habitats;
    document.querySelector("#decorationShop").innerHTML = decorations;
    if (focusKey) {
      const replacement = panel.querySelector(`button[data-${focusKey[0]}="${focusKey[1]}"]`);
      if (replacement && !replacement.disabled) replacement.focus({ preventScroll: true });
      else document.querySelector('[data-panel="shop"]').focus({ preventScroll: true });
    }
  }
}

function render(excited = false) {
  const readable = window.ArcadePet.saveReadable();
  if (!readable) {
    els.status.textContent = "Your pet save cannot be read. Original data is kept; care and purchases are stopped until a valid save is restored.";
    panelStatus.textContent = els.status.textContent;
  } else if (showedUnreadableSave) {
    els.status.textContent = "Pet save is readable again. Your sanctuary has refreshed.";
    panelStatus.textContent = els.status.textContent;
  }
  showedUnreadableSave = !readable;
  const data = window.ArcadePet.load();
  const pet = window.ArcadePet.pets.find((item) => item.id === data.selected);
  const stats = data.stats[data.selected];
  els.history.replaceChildren();
  const entries = [...(data.careHistory || [])].reverse();
  if (!entries.length) {
    const row = document.createElement("li");
    row.textContent = "Your next care action will appear here.";
    els.history.append(row);
  }
  for (const entry of entries) {
    const row = document.createElement("li");
    const name = window.ArcadePet.pets.find(item => item.id === entry.pet).name;
    const action = entry.action === "train" ? "Trained · used 1 stick" : entry.action === "feed" ? "Fed · used 1 shoot" : "Played · no supplies used";
    row.textContent = `${name}: ${action} · Lv. ${Number(entry.strength) || 1} · ${Number(entry.shoots) || 0} shoots, ${Number(entry.sticks) || 0} sticks left`;
    els.history.append(row);
  }
  renderHome(data, excited);
  els.name.textContent = pet.name;
  els.title.textContent = pet.title;
  els.hunger.textContent = `${Math.round(stats.hunger)}%`;
  els.joy.textContent = `${Math.round(stats.joy)}%`;
  els.aura.textContent = Math.floor(stats.aura).toLocaleString();
  const progress = window.ArcadePet.trainingProgress(stats.strengthXp);
  els.training.value = progress.fraction;
  els.trainingGoal.textContent = progress.maxed ? "Strength Level 25 complete. Play and feed to keep your companion happy." : `${progress.remaining} XP to Level ${progress.level + 1} · ${progress.sticks} training stick${progress.sticks === 1 ? "" : "s"} needed · each training grants 10 XP.`;
  els.strength.textContent = `Lv. ${stats.strength}`;
  renderCount(els.shardBalance, window.EmeraldArcade.arcadeShardBalance(), "Arcade Shards");
  renderCount(els.shootBalance, data.inventory.bambooShoots, "bamboo shoots");
  renderCount(els.stickBalance, data.inventory.bambooSticks, "training sticks");
  document.querySelector('[data-action="feed"]').disabled = actionPending || !readable || data.inventory.bambooShoots < 1;
  document.querySelector('[data-action="play"]').disabled = actionPending || !readable;
  document.querySelector('[data-action="train"]').disabled = actionPending || !readable || data.inventory.bambooSticks < 1 || stats.hunger < 20 || progress.maxed;
  const balance = window.EmeraldArcade.arcadeShardBalance();
  document.querySelectorAll('[data-supply]').forEach(button => { button.disabled = actionPending || !readable || balance < window.ArcadePet.supplyPacks[button.dataset.supply].cost; });
  els.hungerBar.style.transform = `scaleX(${stats.hunger / 100})`;
  els.joyBar.style.transform = `scaleX(${stats.joy / 100})`;
  els.auraBar.style.transform = `scaleX(${Math.min(1, stats.aura / 100)})`;
  els.strengthBar.style.transform = `scaleX(${Math.min(1, stats.strength / 25)})`;
  document.body.dataset.petBonus = JSON.stringify({
    rush: window.ArcadePet.activeBonus("rush"),
    rocketSimulator: window.ArcadePet.activeBonus("rocketSimulator"),
    paradox: window.ArcadePet.activeBonus("paradox"),
  });
  const rush = window.ArcadePet.activeBonus("rush"), rocket = window.ArcadePet.activeBonus("rocketSimulator"), paradox = window.ArcadePet.activeBonus("paradox");
  els.assist.textContent = `Shard Rush: +${rush.magnetRadius}px pickup range · Paradox: +${paradox.collectibleRadius}px relic range · Rocket Simulator: +${Math.round((rocket.salvageMultiplier-1)*100)}% salvage. ${rush.careFactor < 1 ? "Low food or joy is reducing trained power by half. Feed and play to restore full care." : "Full care power active. Bonuses stay within each game’s assist cap."}`;
  els.mood.textContent = stats.joy > 85
    ? "Maximum vibes. Ready to celebrate your next arcade win."
    : stats.hunger < 35
      ? "The aura is fading. Emergency snacks requested."
      : "At home with the sanctuary crew.";
  els.rosterProgress.textContent = `${window.ArcadePet.pets.filter(p => data.unlocked.includes(p.id)).length} / ${window.ArcadePet.pets.length} companions unlocked · supplies are shared, strength is individual.`;
  const roster = window.ArcadePet.pets.map((item) => {
    const unlocked = data.unlocked.includes(item.id);
    return `
    <button type="button" class="pet-card${item.id === pet.id ? " is-selected" : ""}${unlocked ? "" : " is-locked"}" data-pet="${item.id}" ${actionPending || !readable || (!unlocked && balance < item.unlockCost) ? "disabled" : ""} aria-pressed="${item.id === pet.id}">
      <i style="background-image:url('${item.sheet}');background-position:${window.ArcadePet.spritePosition(item.id)}"></i>
      <strong>${item.name}</strong><small>${item.title}</small>
      <small class="pet-cost">${unlocked ? `Strength Lv. ${data.stats[item.id].strength}` : `${item.unlockCost} Arcade Shards`}</small>
    </button>
  `;
  }).join("");
  if (roster !== rosterMarkup) {
    const focusedPet = els.roster.contains(document.activeElement) ? document.activeElement.dataset.pet : null;
    rosterMarkup = roster;
    els.roster.innerHTML = roster;
    if (focusedPet) {
      const replacement = [...els.roster.querySelectorAll("[data-pet]:enabled")].find(button => button.dataset.pet === focusedPet);
      (replacement || els.roster.querySelector(".is-selected")).focus({ preventScroll: true });
    }
  }
}

function renderCount(element, value, label) {
  const full = value.toLocaleString();
  element.textContent = value < 10000 ? full : new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
  element.title = `${full} ${label}`;
  element.setAttribute("aria-label", element.title);
}

let actionPending = false;
async function sanctuaryAction(action, value) {
  if (actionPending) return { ok: false, message: "Please wait for your current sanctuary action." };
  const focusedPet = document.activeElement?.closest("#petRoster [data-pet]")?.dataset.pet;
  actionPending = true;
  els.status.textContent = "Saving sanctuary action…";
  panelStatus.textContent = "Saving sanctuary action…";
  render();
  try { return await window.ArcadePet.perform(action, value); }
  finally {
    actionPending = false;
    render();
    if (focusedPet && panel.open) els.roster.querySelector(`[data-pet="${focusedPet}"]:enabled`)?.focus({ preventScroll: true });
  }
}

async function act(action) {
  const result = await sanctuaryAction("care", action);
  els.status.textContent = result.message || `${action[0].toUpperCase()}${action.slice(1)} complete.`;
  panelStatus.textContent = els.status.textContent;
  if (!result.ok) return;
  const stats = result.stats;
  clearTimeout(celebrationTimer);
  render(true);
  celebrationTimer = setTimeout(() => render(false), 950);
  const recordPetProgress = window.EmeraldArcade?.recordAndNotify || window.EmeraldArcade?.record;
  try {
    if (!startedSession) {
      window.EmeraldArcade?.beginSession("pets", "etc-pets.html");
      startedSession = true;
    }
    recordPetProgress?.("pets", {
      score: stats.aura,
      rank: rankForAura(stats.aura),
      aura: stats.aura,
      trained: stats.strength,
      played: !completedSession,
    });
    completedSession = true;
  } catch {
    els.status.textContent += " Care was saved. Your arcade record could not be updated.";
  }
}

function rankForAura(aura) {
  if (aura >= 500) return "Mythic Meme";
  if (aura >= 200) return "Aura Farmer";
  if (aura >= 80) return "Emerald Companion";
  return "Pocket Meme";
}

document.querySelector(".pet-actions").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (button) act(button.dataset.action);
});

document.querySelector(".supply-shop").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-supply]");
  if (!button) return;
  const result = await sanctuaryAction("supply", button.dataset.supply);
  els.status.textContent = result.message;
  panelStatus.textContent = result.message;
  render(result.ok);
});

async function selectResident(id) {
  const data = window.ArcadePet.load();
  if (!data.unlocked.includes(id)) {
    const result = await sanctuaryAction("unlock", id);
    els.status.textContent = result.message;
    panelStatus.textContent = result.message;
    render(result.ok);
    return;
  }
  const selection = await sanctuaryAction("select", id);
  els.status.textContent = selection.message;
  panelStatus.textContent = selection.message;
  if (!selection.ok) return;
  clearTimeout(celebrationTimer);
  render(true);
  celebrationTimer = setTimeout(() => render(false), 900);
}
els.roster.addEventListener("click", event => {
  const button = event.target.closest("[data-pet]");
  if (button) selectResident(button.dataset.pet);
});
panel.addEventListener("click", async event => {
  const button = event.target.closest("button[data-habitat],button[data-decoration]");
  if (!button || button.disabled) return;
  const action = button.dataset.habitat ? "habitat" : "decoration";
  const result = await sanctuaryAction(action, button.dataset.habitat || button.dataset.decoration);
  els.status.textContent = result.message;
  panelStatus.textContent = result.message;
  render(result.ok);
});

window.addEventListener("arcadepet:change", () => render());
window.addEventListener("emeraldarcade:wallet", () => render());
render();
