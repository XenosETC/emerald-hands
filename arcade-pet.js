(function () {
  const SCHEMA_VERSION = 2;
  const STORAGE_KEY = "emerald-arcade-pets-v1";
  const SPRITES = "assets/etc-pets/meme-pets.png";
  const PEPE_VARIANTS = "assets/etc-pets/pepe-variants.png";
  const pets = [
    { id: "pepe", name: "Emerald Pepe", title: "Shard Sniffer", col: 0, sheet: SPRITES, unlockCost: 0 },
    { id: "wojak", name: "Pocket Wojak", title: "Anxiety Sensor", col: 1, sheet: SPRITES, unlockCost: 90 },
    { id: "chad", name: "Mini Chad", title: "Aura Coach", col: 2, sheet: SPRITES, unlockCost: 160 },
    { id: "bogdanoff", name: "Cosmic Bog", title: "Market Oracle", col: 3, sheet: SPRITES, unlockCost: 260 },
    { id: "big-chain-pepe", name: "Big Chain Pepe", title: "Vault Heavyweight", col: 0, sheet: PEPE_VARIANTS, unlockCost: 400 },
    { id: "mecha-pepe", name: "Mini Mecha Pepe", title: "Reactor Buddy", col: 1, sheet: PEPE_VARIANTS, unlockCost: 560 },
    { id: "berserk-tadpole", name: "Berserk Tadpole", title: "Tiny Rage Engine", col: 2, sheet: PEPE_VARIANTS, unlockCost: 760 },
    { id: "fallen-crystal", name: "Fallen Crystal Pepe", title: "Red Shard Summoner", col: 3, sheet: PEPE_VARIANTS, unlockCost: 1000 },
  ];
  const supplyPacks = {
    shoot: { name: "Bamboo Shoot", shoots: 1, sticks: 0, cost: 8 },
    "shoot-bundle": { name: "Bamboo Basket", shoots: 5, sticks: 0, cost: 35 },
    stick: { name: "Training Stick", shoots: 0, sticks: 1, cost: 18 },
  };

  function defaults() {
    return {
      schemaVersion: SCHEMA_VERSION,
      selected: "pepe",
      unlocked: ["pepe"],
      x: 76,
      inventory: { bambooShoots: 2, bambooSticks: 1 },
      stats: Object.fromEntries(pets.map((pet) => [pet.id, {
        aura: 0,
        hunger: 78,
        joy: 72,
        training: 1,
        strength: 1,
        strengthXp: 0,
      }])),
    };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const base = defaults();
      const migrated = {
        ...base,
        ...saved,
        schemaVersion: SCHEMA_VERSION,
        inventory: { ...base.inventory, ...(saved?.inventory || {}) },
        unlocked: [...new Set([...base.unlocked, ...(Array.isArray(saved?.unlocked) ? saved.unlocked : [])])],
        stats: Object.fromEntries(pets.map((pet) => {
          const previous = saved?.stats?.[pet.id] || {};
          const strengthXp = Math.max(0, Number(previous.strengthXp ?? Math.max(0, Number(previous.training || 1) - 1) * 10));
          return [pet.id, {
            ...base.stats[pet.id],
            ...previous,
            strengthXp,
            strength: strengthForXp(strengthXp),
          }];
        })),
      };
      if (!migrated.unlocked.includes(migrated.selected)) migrated.selected = "pepe";
      if (saved?.schemaVersion !== SCHEMA_VERSION) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      return defaults();
    }
  }

  let data = load();
  let companion;
  let sprite;
  let picker;
  let dockToggle;
  let excitedTimer;

  function save() {
    data.schemaVersion = SCHEMA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("arcadepet:change", { detail: load() }));
  }

  function petById(id) {
    return pets.find((pet) => pet.id === id) || pets[0];
  }

  function spritePosition(petId, excited = false) {
    const pet = petById(petId);
    return `${(pet.col / 3) * 100}% ${excited ? 100 : 0}%`;
  }

  function injectStyles() {
    if (document.querySelector("#arcade-pet-styles")) return;
    const style = document.createElement("style");
    style.id = "arcade-pet-styles";
    style.textContent = `
      .arcade-pet-companion {
        position: fixed; left: 76%; bottom: 12px; z-index: 80;
        width: 96px; height: 118px; transform: translateX(-50%);
        border: 1px solid rgba(122,255,202,.38); border-radius: 48px 48px 15px 15px;
        background: radial-gradient(circle at 50% 74%,rgba(44,255,157,.24),rgba(0,9,5,.88) 70%);
        box-shadow: 0 12px 34px rgba(0,0,0,.58),0 0 24px rgba(44,255,157,.13);
        pointer-events:none; transition:left 3.4s ease-in-out,transform .2s ease; overflow:visible;
      }
      .arcade-pet-sprite {
        position:absolute; left:5px; top:5px; width:86px; height:86px; background-image:url("${SPRITES}");
        background-size:400% 200%; background-repeat:no-repeat;
        filter:drop-shadow(0 8px 8px rgba(0,0,0,.55)); animation:arcade-pet-bob 1.7s ease-in-out infinite alternate;
      }
      .arcade-pet-name { position:absolute; left:50%; bottom:4px; width:max-content; max-width:130px; transform:translateX(-50%); color:#dffff1; font:800 9px/1.1 Inter,system-ui,sans-serif; letter-spacing:.04em; text-shadow:0 2px 4px #000; }
      .arcade-pet-aura { position:absolute; inset:-10px; border:1px solid rgba(75,255,172,.2); border-radius:50%; animation:arcade-pet-aura 2.2s ease-in-out infinite; pointer-events:none; }
      .arcade-pet-picker {
        position:fixed; right:14px; bottom:142px; z-index:81; display:none; width:min(340px,calc(100vw - 28px));
        padding:12px; border:1px solid rgba(122,255,202,.38); border-radius:12px; color:#effff7;
        background:rgba(0,10,6,.94); box-shadow:0 20px 60px rgba(0,0,0,.7); backdrop-filter:blur(15px);
        font-family:Inter,system-ui,sans-serif;
      }
      .arcade-pet-dock-toggle {
        position:fixed; right:0; top:54%; z-index:82; width:30px; height:66px;
        border:1px solid rgba(122,255,202,.48); border-right:0; border-radius:10px 0 0 10px; color:#dffff1;
        background:rgba(0,18,11,.92); box-shadow:0 10px 28px rgba(0,0,0,.55);
        cursor:pointer; touch-action:manipulation; font:900 9px/1 Inter,system-ui,sans-serif; letter-spacing:.08em;
        writing-mode:vertical-rl; text-orientation:mixed;
      }
      .arcade-pet-picker.is-open { display:block; }
      .arcade-pet-picker header { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:9px; }
      .arcade-pet-picker header strong { font-size:14px; }
      .arcade-pet-picker header a { color:#8dffd1; font-size:11px; }
      .arcade-pet-picker .arcade-pet-balance { margin:-2px 0 9px; color:#e2bd6a; font-size:10px; font-weight:800; }
      .arcade-pet-options { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
      .arcade-pet-option { border:1px solid rgba(122,255,202,.2); border-radius:8px; color:#effff7; background:rgba(16,53,37,.58); cursor:pointer; padding:5px; }
      .arcade-pet-option.is-selected { border-color:#8dffd1; box-shadow:inset 0 0 14px rgba(44,255,157,.16); }
      .arcade-pet-option i { display:block; width:58px; max-width:100%; aspect-ratio:1; margin:auto; background-image:url("${SPRITES}"); background-size:400% 200%; background-repeat:no-repeat; }
      .arcade-pet-option span,.arcade-pet-option small { display:block; overflow:hidden; font-size:9px; font-weight:800; text-overflow:ellipsis; white-space:nowrap; }
      .arcade-pet-option small { margin-top:2px; color:#93b8a7; font-size:8px; }
      @keyframes arcade-pet-bob { to { transform:translateY(-5px) rotate(1deg); } }
      @keyframes arcade-pet-aura { 50% { transform:scale(1.08); border-color:rgba(75,255,172,.5); box-shadow:0 0 18px rgba(75,255,172,.2); } }
      @media(max-width:680px){ .arcade-pet-companion{width:76px;height:94px}.arcade-pet-sprite{width:66px;height:66px}.arcade-pet-picker{bottom:116px} }
    `;
    document.head.appendChild(style);
  }

  function renderPicker() {
    if (!picker) return;
    picker.querySelector(".arcade-pet-options").innerHTML = pets
      .filter((pet) => data.unlocked.includes(pet.id))
      .map((pet) => `
        <button class="arcade-pet-option${pet.id === data.selected ? " is-selected" : ""}" data-pet="${pet.id}" type="button">
          <i style="background-image:url('${pet.sheet}');background-position:${spritePosition(pet.id)}"></i><span>${pet.name}</span><small>Strength ${data.stats[pet.id].strength}</small>
        </button>
      `).join("");
    const balance = picker.querySelector(".arcade-pet-balance");
    if (balance) balance.textContent = `${window.EmeraldArcade?.arcadeShardBalance?.() || 0} Arcade Shards · ${data.inventory.bambooShoots} shoots · ${data.inventory.bambooSticks} sticks`;
  }

  function mount() {
    if (document.body.dataset.noArcadePet === "true" || companion) return;
    injectStyles();
    companion = document.createElement("div");
    companion.className = "arcade-pet-companion";
    companion.setAttribute("aria-hidden", "true");
    companion.innerHTML = `<i class="arcade-pet-aura"></i><i class="arcade-pet-sprite"></i><span class="arcade-pet-name"></span>`;
    sprite = companion.querySelector(".arcade-pet-sprite");
    picker = document.createElement("section");
    picker.className = "arcade-pet-picker";
    picker.innerHTML = `<header><strong>Arcade Pet Dock</strong><a href="etc-pets.html">Open sanctuary</a></header><div class="arcade-pet-balance"></div><div class="arcade-pet-options"></div>`;
    dockToggle = document.createElement("button");
    dockToggle.className = "arcade-pet-dock-toggle";
    dockToggle.type = "button";
    dockToggle.textContent = "PETS";
    dockToggle.setAttribute("aria-label", "Open pet switcher");
    dockToggle.setAttribute("aria-expanded", "false");
    document.body.append(companion, picker, dockToggle);
    dockToggle.addEventListener("click", () => {
      celebrate();
      picker.classList.toggle("is-open");
      dockToggle.setAttribute("aria-expanded", String(picker.classList.contains("is-open")));
    });
    picker.addEventListener("click", (event) => {
      const button = event.target.closest("[data-pet]");
      if (button) select(button.dataset.pet);
    });
    document.addEventListener("pointerdown", (event) => {
      if (!picker.classList.contains("is-open") || picker.contains(event.target) || dockToggle.contains(event.target)) return;
      picker.classList.remove("is-open");
      dockToggle.setAttribute("aria-expanded", "false");
    });
    refresh();
    setInterval(wander, 5200);
  }

  function refresh() {
    data = load();
    if (!companion) return;
    const pet = petById(data.selected);
    companion.style.left = `${clamp(data.x, 8, 92)}%`;
    sprite.style.backgroundImage = `url("${pet.sheet}")`;
    sprite.style.backgroundPosition = spritePosition(pet.id);
    companion.querySelector(".arcade-pet-name").textContent = pet.name;
    renderPicker();
  }

  function select(id) {
    if (!data.unlocked.includes(id)) return;
    data.selected = id;
    save();
    refresh();
    celebrate();
  }

  function wander() {
    if (!companion) return;
    data.x = 12 + Math.random() * 76;
    save();
    companion.style.left = `${data.x}%`;
  }

  function celebrate() {
    if (!sprite) return;
    clearTimeout(excitedTimer);
    sprite.style.backgroundPosition = spritePosition(data.selected, true);
    excitedTimer = setTimeout(() => { sprite.style.backgroundPosition = spritePosition(data.selected, false); }, 1100);
  }

  function updatePet(action) {
    data = load();
    const stats = data.stats[data.selected];
    if (action === "feed") {
      if (data.inventory.bambooShoots < 1) return { ok: false, stats, message: "Buy a bamboo shoot before feeding." };
      data.inventory.bambooShoots -= 1;
      stats.hunger = clamp(stats.hunger + 22, 0, 100);
      stats.joy = clamp(stats.joy + 2, 0, 100);
    }
    if (action === "play") {
      stats.joy = clamp(stats.joy + 20, 0, 100);
      stats.hunger = clamp(stats.hunger - 4, 0, 100);
    }
    if (action === "train") {
      if (data.inventory.bambooSticks < 1) return { ok: false, stats, message: "Training needs one bamboo stick." };
      if (stats.hunger < 20) return { ok: false, stats, message: "Feed your pet before training again." };
      data.inventory.bambooSticks -= 1;
      stats.training += 1;
      stats.strengthXp += 10;
      stats.strength = strengthForXp(stats.strengthXp);
      stats.hunger = clamp(stats.hunger - 8, 0, 100);
      stats.joy = clamp(stats.joy - 3, 0, 100);
    }
    stats.aura += action === "train" ? 8 : 4;
    data.stats[data.selected] = stats;
    save();
    celebrate();
    return { ok: true, stats, message: action === "train" ? `Strength reached Level ${stats.strength}.` : "" };
  }

  function purchaseSupply(packId) {
    const pack = supplyPacks[packId];
    if (!pack) return { ok: false, message: "Unknown bamboo supply." };
    if (!window.EmeraldArcade?.spendArcadeShards(pack.cost)) {
      return { ok: false, message: `You need ${pack.cost} Arcade Shards.` };
    }
    data = load();
    data.inventory.bambooShoots += pack.shoots;
    data.inventory.bambooSticks += pack.sticks;
    save();
    celebrate();
    return { ok: true, message: `${pack.name} added to your sanctuary.` };
  }

  function unlock(id) {
    data = load();
    const pet = petById(id);
    if (data.unlocked.includes(pet.id)) return { ok: true, message: `${pet.name} is already unlocked.` };
    if (!window.EmeraldArcade?.spendArcadeShards(pet.unlockCost)) {
      return { ok: false, message: `You need ${pet.unlockCost} Arcade Shards to unlock ${pet.name}.` };
    }
    data.unlocked.push(pet.id);
    data.selected = pet.id;
    save();
    refresh();
    celebrate();
    return { ok: true, message: `${pet.name} joined your arcade roster.` };
  }

  function strengthForXp(xp) {
    return Math.min(25, 1 + Math.floor(Math.sqrt(Math.max(0, Number(xp || 0)) / 10)));
  }

  function activeBonus(game) {
    data = load();
    const stats = data.stats[data.selected];
    const careFactor = stats.hunger < 20 || stats.joy < 20 ? 0.5 : 1;
    const trainedPower = Math.max(0, stats.strength - 1) * careFactor;
    const bonuses = {
      rush: { magnetRadius: Math.min(24, trainedPower * 2), label: "Shard magnet" },
      rocketSimulator: { salvageMultiplier: 1 + Math.min(0.15, trainedPower * 0.01), label: "Salvage assist" },
      paradox: { collectibleRadius: Math.min(24, trainedPower * 2), label: "Relic instinct" },
    };
    return {
      petId: data.selected,
      petName: petById(data.selected).name,
      strength: stats.strength,
      careFactor,
      ...(bonuses[game] || { label: "Companion aura" }),
    };
  }

  function addAura(amount) {
    data = load();
    data.stats[data.selected].aura += Math.max(0, Number(amount || 0));
    save();
    celebrate();
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  window.ArcadePet = {
    schemaVersion: SCHEMA_VERSION,
    pets,
    supplyPacks,
    load,
    select,
    unlock,
    updatePet,
    purchaseSupply,
    activeBonus,
    strengthForXp,
    addAura,
    celebrate,
    mount,
    spritePosition,
  };
  window.addEventListener("emeraldarcade:wallet", refresh);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
