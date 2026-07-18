const els = {
  hero: document.querySelector("#heroPet"),
  roster: document.querySelector("#petRoster"),
  name: document.querySelector("#petName"),
  title: document.querySelector("#petTitle"),
  mood: document.querySelector("#petMood"),
  hungerBar: document.querySelector("#hungerBar"),
  joyBar: document.querySelector("#joyBar"),
  auraBar: document.querySelector("#auraBar"),
  hunger: document.querySelector("#hungerLabel"),
  joy: document.querySelector("#joyLabel"),
  aura: document.querySelector("#auraLabel"),
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
  els.hungerBar.style.transform = `scaleX(${stats.hunger / 100})`;
  els.joyBar.style.transform = `scaleX(${stats.joy / 100})`;
  els.auraBar.style.transform = `scaleX(${Math.min(1, stats.aura / 100)})`;
  els.mood.textContent = stats.joy > 85
    ? "Maximum vibes. Ready to celebrate your next arcade win."
    : stats.hunger < 35
      ? "The aura is fading. Emergency snacks requested."
      : "Ready to farm aura across the arcade.";
  els.roster.innerHTML = window.ArcadePet.pets.map((item) => `
    <button type="button" class="pet-card${item.id === pet.id ? " is-selected" : ""}" data-pet="${item.id}">
      <i style="background-image:url('${item.sheet}');background-position:${window.ArcadePet.spritePosition(item.id)}"></i>
      <strong>${item.name}</strong><small>${item.title}</small>
    </button>
  `).join("");
}

function act(action) {
  if (!completedSession) {
    window.EmeraldArcade?.beginSession("pets", "etc-pets.html");
  }
  const stats = window.ArcadePet.updatePet(action);
  clearTimeout(celebrationTimer);
  render(true);
  celebrationTimer = setTimeout(() => render(false), 950);
  window.EmeraldArcade?.record("pets", {
    score: stats.aura,
    rank: rankForAura(stats.aura),
    aura: stats.aura,
    trained: stats.training,
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

els.roster.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pet]");
  if (!button) return;
  window.ArcadePet.select(button.dataset.pet);
  clearTimeout(celebrationTimer);
  render(true);
  celebrationTimer = setTimeout(() => render(false), 900);
});

window.addEventListener("arcadepet:change", () => render());
render();
