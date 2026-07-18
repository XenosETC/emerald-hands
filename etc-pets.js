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
};

let completedSession = false;
let celebrationTimer;

function render(excited = false) {
  const data = window.ArcadePet.load();
  const pet = window.ArcadePet.pets.find((item) => item.id === data.selected);
  const stats = data.stats[data.selected];
  els.hero.style.backgroundImage = `url("${pet.sheet}")`;
  els.hero.style.backgroundPosition = window.ArcadePet.spritePosition(pet.id, excited);
  els.name.textContent = pet.name;
  els.title.textContent = pet.title;
  els.hunger.textContent = `${Math.round(stats.hunger)}%`;
  els.joy.textContent = `${Math.round(stats.joy)}%`;
  els.aura.textContent = Math.floor(stats.aura).toLocaleString();
  els.strength.textContent = `Lv. ${stats.strength}`;
  els.shardBalance.textContent = window.EmeraldArcade.arcadeShardBalance().toLocaleString();
  els.shootBalance.textContent = data.inventory.bambooShoots.toLocaleString();
  els.stickBalance.textContent = data.inventory.bambooSticks.toLocaleString();
  els.hungerBar.style.transform = `scaleX(${stats.hunger / 100})`;
  els.joyBar.style.transform = `scaleX(${stats.joy / 100})`;
  els.auraBar.style.transform = `scaleX(${Math.min(1, stats.aura / 100)})`;
  els.strengthBar.style.transform = `scaleX(${Math.min(1, stats.strength / 25)})`;
  document.body.dataset.petBonus = JSON.stringify({
    rush: window.ArcadePet.activeBonus("rush"),
    rocketSimulator: window.ArcadePet.activeBonus("rocketSimulator"),
    paradox: window.ArcadePet.activeBonus("paradox"),
  });
  els.mood.textContent = stats.joy > 85
    ? "Maximum vibes. Ready to celebrate your next arcade win."
    : stats.hunger < 35
      ? "The aura is fading. Emergency snacks requested."
      : "Ready to farm aura across the arcade.";
  els.roster.innerHTML = window.ArcadePet.pets.map((item) => {
    const unlocked = data.unlocked.includes(item.id);
    return `
    <button type="button" class="pet-card${item.id === pet.id ? " is-selected" : ""}${unlocked ? "" : " is-locked"}" data-pet="${item.id}">
      <i style="background-image:url('${item.sheet}');background-position:${window.ArcadePet.spritePosition(item.id)}"></i>
      <strong>${item.name}</strong><small>${item.title}</small>
      <small class="pet-cost">${unlocked ? `Strength Lv. ${data.stats[item.id].strength}` : `${item.unlockCost} Arcade Shards`}</small>
    </button>
  `;
  }).join("");
}

function act(action) {
  const result = window.ArcadePet.updatePet(action);
  els.status.textContent = result.message || `${action[0].toUpperCase()}${action.slice(1)} complete.`;
  if (!result.ok) return;
  if (!completedSession) window.EmeraldArcade?.beginSession("pets", "etc-pets.html");
  const stats = result.stats;
  clearTimeout(celebrationTimer);
  render(true);
  celebrationTimer = setTimeout(() => render(false), 950);
  window.EmeraldArcade?.record("pets", {
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

document.querySelector(".supply-shop").addEventListener("click", (event) => {
  const button = event.target.closest("[data-supply]");
  if (!button) return;
  const result = window.ArcadePet.purchaseSupply(button.dataset.supply);
  els.status.textContent = result.message;
  render(result.ok);
});

els.roster.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pet]");
  if (!button) return;
  const data = window.ArcadePet.load();
  if (!data.unlocked.includes(button.dataset.pet)) {
    const result = window.ArcadePet.unlock(button.dataset.pet);
    els.status.textContent = result.message;
    render(result.ok);
    return;
  }
  window.ArcadePet.select(button.dataset.pet);
  els.status.textContent = `${window.ArcadePet.pets.find((pet) => pet.id === button.dataset.pet).name} is now active.`;
  clearTimeout(celebrationTimer);
  render(true);
  celebrationTimer = setTimeout(() => render(false), 900);
});

window.addEventListener("arcadepet:change", () => render());
window.addEventListener("emeraldarcade:wallet", () => render());
render();
