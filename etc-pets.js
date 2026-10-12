const els = {
  hero: document.querySelector("#heroPet"),
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
let celebrationTimer;
let showedUnreadableSave = false;

function render(excited = false) {
  const readable = window.ArcadePet.saveReadable();
  if (!readable) els.status.textContent = "Your pet save cannot be read. Original data is kept; care and purchases are stopped until a valid save is restored.";
  else if (showedUnreadableSave) els.status.textContent = "Pet save is readable again. Your sanctuary has refreshed.";
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
  els.hero.style.backgroundImage = `url("${pet.sheet}")`;
  els.hero.style.backgroundPosition = window.ArcadePet.spritePosition(pet.id, excited);
  els.name.textContent = pet.name;
  els.title.textContent = pet.title;
  els.hunger.textContent = `${Math.round(stats.hunger)}%`;
  els.joy.textContent = `${Math.round(stats.joy)}%`;
  els.aura.textContent = Math.floor(stats.aura).toLocaleString();
  const progress = window.ArcadePet.trainingProgress(stats.strengthXp);
  els.training.value = progress.fraction;
  els.trainingGoal.textContent = progress.maxed ? "Strength Level 25 complete. Play and feed to keep your companion happy." : `${progress.remaining} XP to Level ${progress.level + 1} · ${progress.sticks} training stick${progress.sticks === 1 ? "" : "s"} needed · each training grants 10 XP.`;
  els.strength.textContent = `Lv. ${stats.strength}`;
  els.shardBalance.textContent = window.EmeraldArcade.arcadeShardBalance().toLocaleString();
  els.shootBalance.textContent = data.inventory.bambooShoots.toLocaleString();
  els.stickBalance.textContent = data.inventory.bambooSticks.toLocaleString();
  document.querySelector('[data-action="feed"]').disabled = data.inventory.bambooShoots < 1;
  document.querySelector('[data-action="train"]').disabled = data.inventory.bambooSticks < 1 || stats.hunger < 20 || progress.maxed;
  const balance = window.EmeraldArcade.arcadeShardBalance();
  document.querySelectorAll('[data-supply]').forEach(button => { button.disabled = balance < window.ArcadePet.supplyPacks[button.dataset.supply].cost; });
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
      : "Ready to farm aura across the arcade.";
  els.rosterProgress.textContent = `${window.ArcadePet.pets.filter(p => data.unlocked.includes(p.id)).length} / ${window.ArcadePet.pets.length} companions unlocked · supplies are shared, strength is individual.`;
  els.roster.innerHTML = window.ArcadePet.pets.map((item) => {
    const unlocked = data.unlocked.includes(item.id);
    return `
    <button type="button" class="pet-card${item.id === pet.id ? " is-selected" : ""}${unlocked ? "" : " is-locked"}" data-pet="${item.id}" ${!unlocked && balance < item.unlockCost ? "disabled" : ""} aria-pressed="${item.id === pet.id}">
      <i style="background-image:url('${item.sheet}');background-position:${window.ArcadePet.spritePosition(item.id)}"></i>
      <strong>${item.name}</strong><small>${item.title}</small>
      <small class="pet-cost">${unlocked ? `Strength Lv. ${data.stats[item.id].strength}` : `${item.unlockCost} Arcade Shards`}</small>
    </button>
  `;
  }).join("");
}

let actionPending = false;
async function sanctuaryAction(action, value) {
  if (actionPending) return { ok: false, message: "Please wait for your current sanctuary action." };
  actionPending = true;
  els.status.textContent = "Saving sanctuary action…";
  try { return await window.ArcadePet.perform(action, value); }
  finally { actionPending = false; }
}

async function act(action) {
  const result = await sanctuaryAction("care", action);
  els.status.textContent = result.message || `${action[0].toUpperCase()}${action.slice(1)} complete.`;
  if (!result.ok) return;
  if (!completedSession) window.EmeraldArcade?.beginSession("pets", "etc-pets.html");
  const stats = result.stats;
  clearTimeout(celebrationTimer);
  render(true);
  celebrationTimer = setTimeout(() => render(false), 950);
  const recordPetProgress = window.EmeraldArcade?.recordAndNotify || window.EmeraldArcade?.record;
  recordPetProgress?.("pets", {
    score: stats.aura,
    rank: rankForAura(stats.aura),
    aura: stats.aura,
    trained: stats.strength,
    played: !completedSession,
  });
  completedSession = true;
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
  render(result.ok);
});

els.roster.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-pet]");
  if (!button) return;
  const data = window.ArcadePet.load();
  if (!data.unlocked.includes(button.dataset.pet)) {
    const result = await sanctuaryAction("unlock", button.dataset.pet);
    els.status.textContent = result.message;
    render(result.ok);
    return;
  }
  const selection = await sanctuaryAction("select", button.dataset.pet);
  els.status.textContent = selection.message;
  if (!selection.ok) return;
  clearTimeout(celebrationTimer);
  render(true);
  celebrationTimer = setTimeout(() => render(false), 900);
});

window.addEventListener("arcadepet:change", () => render());
window.addEventListener("emeraldarcade:wallet", () => render());
render();
