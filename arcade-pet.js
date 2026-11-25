(function () {
  const SCHEMA_VERSION = 3;
  const STORAGE_KEY = "emerald-arcade-pets-v1";
  const SPRITES = "assets/etc-pets/meme-pets.png";
  const PEPE_VARIANTS = "assets/etc-pets/pepe-variants.png";
  const RUMBLE_COMPANIONS = "assets/etc-pets/rumble-companions.webp";
  const pets = [
    { id: "pepe", name: "Emerald Pepe", title: "Shard Sniffer", col: 0, sheet: SPRITES, unlockCost: 0 },
    { id: "wojak", name: "Pocket Wojak", title: "Anxiety Sensor", col: 1, sheet: SPRITES, unlockCost: 90 },
    { id: "chad", name: "Mini Chad", title: "Aura Coach", col: 2, sheet: SPRITES, unlockCost: 160 },
    { id: "bogdanoff", name: "Cosmic Bog", title: "Market Oracle", col: 3, sheet: SPRITES, unlockCost: 260 },
    { id: "big-chain-pepe", name: "Big Chain Pepe", title: "Vault Heavyweight", col: 0, sheet: PEPE_VARIANTS, unlockCost: 400 },
    { id: "mecha-pepe", name: "Mini Mecha Pepe", title: "Reactor Buddy", col: 1, sheet: PEPE_VARIANTS, unlockCost: 560 },
    { id: "berserk-tadpole", name: "Berserk Tadpole", title: "Tiny Rage Engine", col: 2, sheet: PEPE_VARIANTS, unlockCost: 760 },
    { id: "fallen-crystal", name: "Fallen Crystal Pepe", title: "Red Shard Summoner", col: 3, sheet: PEPE_VARIANTS, unlockCost: 1000 },
    { id: "rumble-monkey", name: "Monkey", title: "Jade Scout", col: 0, sheet: RUMBLE_COMPANIONS, unlockCost: 260 },
    { id: "rumble-croakhound", name: "Croakhound", title: "Marsh Guardian", col: 1, sheet: RUMBLE_COMPANIONS, unlockCost: 260 },
    { id: "rumble-frenix", name: "Frenix", title: "Rumble Skywatch", col: 2, sheet: RUMBLE_COMPANIONS, unlockCost: 260 },
  ];
  const supplyPacks = {
    shoot: { name: "Bamboo Shoot", shoots: 1, sticks: 0, cost: 8 },
    "shoot-bundle": { name: "Bamboo Basket", shoots: 5, sticks: 0, cost: 35 },
    stick: { name: "Training Stick", shoots: 0, sticks: 1, cost: 18 },
  };
  // Starter prices for cosmetic sanctuary items; these never change pet assists.
  const habitats = [
    { id: "bamboo", name: "Emerald Den", cost: 0, description: "Your original sanctuary, always free." },
    { id: "moonlit", name: "Moonlit Marsh", cost: 80, description: "Cool moonlight and a quiet waterside retreat." },
    { id: "sunset", name: "Sunset Garden", cost: 120, description: "A warm golden-hour home for your whole roster." },
  ];
  const decorations = [
    { id: "lantern", name: "Amber Lantern", cost: 20, description: "A welcoming glow beside the garden path." },
    { id: "pond", name: "Lily Pond", cost: 35, description: "A little pool for a peaceful afternoon." },
    { id: "crystals", name: "Crystal Cluster", cost: 50, description: "A sparkling garden centerpiece." },
  ];

  function sanctuaryState(saved = {}) {
    const known = (items, catalog) => [...new Set((Array.isArray(items) ? items : []).filter(id => catalog.some(item => item.id === id)))];
    const ownedHabitats = [...new Set(["bamboo", ...known(saved?.ownedHabitats, habitats)])];
    const ownedDecorations = known(saved?.ownedDecorations, decorations);
    return {
      habitat: ownedHabitats.includes(saved?.habitat) ? saved.habitat : "bamboo",
      ownedHabitats,
      decorations: known(saved?.decorations, decorations).filter(id => ownedDecorations.includes(id)),
      ownedDecorations,
    };
  }

  function defaults() {
    return {
      schemaVersion: SCHEMA_VERSION,
      selected: "pepe",
      unlocked: ["pepe"],
      x: 76,
      inventory: { bambooShoots: 2, bambooSticks: 1 },
      sanctuary: sanctuaryState(),
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

  function safeCount(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(number))) : fallback;
  }

  function careValue(value, fallback) {
    return value == null || !Number.isFinite(Number(value)) ? fallback : clamp(Number(value), 0, 100);
  }

  function readableStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return true;
      const saved = JSON.parse(raw);
      return saved !== null && typeof saved === "object" && !Array.isArray(saved);
    } catch { return false; }
  }

  function load() {
    if (!readableStore()) return defaults();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const base = defaults();
      const migrated = {
        ...base,
        ...saved,
        schemaVersion: SCHEMA_VERSION,
        sanctuary: sanctuaryState(saved?.sanctuary),
        inventory: {
          bambooShoots: safeCount(saved?.inventory?.bambooShoots ?? base.inventory.bambooShoots),
          bambooSticks: safeCount(saved?.inventory?.bambooSticks ?? base.inventory.bambooSticks),
        },
        unlocked: [...new Set([...base.unlocked, ...(Array.isArray(saved?.unlocked) ? saved.unlocked.filter(id => pets.some(pet => pet.id === id)) : [])])],
        careHistory: (Array.isArray(saved?.careHistory) ? saved.careHistory : []).filter(entry => entry && ["feed", "play", "train"].includes(entry.action) && pets.some(pet => pet.id === entry.pet)).slice(-8),
        stats: Object.fromEntries(pets.map((pet) => {
          const previous = saved?.stats?.[pet.id] || {};
          const strengthXp = safeCount(previous.strengthXp ?? Math.max(0, safeCount(previous.training, 1) - 1) * 10);
          return [pet.id, {
            ...base.stats[pet.id],
            ...previous,
            aura: safeCount(previous.aura),
            hunger: careValue(previous.hunger, base.stats[pet.id].hunger),
            joy: careValue(previous.joy, base.stats[pet.id].joy),
            training: Math.max(1, safeCount(previous.training, 1)),
            strengthXp,
            strength: strengthForXp(strengthXp),
          }];
        })),
      };
      const ledger = window.EmeraldArcade?.petPurchaseLedger?.();
      if (ledger) {
        const applied = { shoots: safeCount(migrated.purchaseTotals?.shoots), sticks: safeCount(migrated.purchaseTotals?.sticks) };
        migrated.inventory.bambooShoots += Math.max(0, ledger.shoots - applied.shoots);
        migrated.inventory.bambooSticks += Math.max(0, ledger.sticks - applied.sticks);
        migrated.purchaseTotals = { shoots: ledger.shoots, sticks: ledger.sticks };
        for (const id of ledger.unlocked) {
          if (pets.some(pet => pet.id === id) && !migrated.unlocked.includes(id)) {
            migrated.unlocked.push(id);
            migrated.selected = id;
          }
        }
        for (const id of ledger.habitats || []) {
          if (habitats.some(item => item.id === id) && !migrated.sanctuary.ownedHabitats.includes(id)) migrated.sanctuary.ownedHabitats.push(id);
        }
        for (const id of ledger.decorations || []) {
          if (decorations.some(item => item.id === id) && !migrated.sanctuary.ownedDecorations.includes(id)) migrated.sanctuary.ownedDecorations.push(id);
        }
      }
      if (!migrated.unlocked.includes(migrated.selected)) migrated.selected = "pepe";
      if (saved?.schemaVersion !== SCHEMA_VERSION) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch { /* Keep readable legacy progress when migration storage is blocked. */ }
      }
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
  let pickerMarkup;
  let assistNode;
  let assistTimer;
  let excitedTimer;
  let walkTimer;
  let petX = null;
  let motionPreference;
  let excited = false;

  function save() {
    if (!readableStore()) throw new Error("Pet save is unreadable; original data preserved.");
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
        position:fixed; left:clamp(60px,var(--pet-x,76%),calc(100vw - 140px)); bottom:max(12px,env(safe-area-inset-bottom)); z-index:80;
        width: 96px; height: 118px; transform: translateX(-50%);
        border:0; background:none; box-shadow:none;
        pointer-events:none; transition:left var(--pet-walk-time,3s) linear; overflow:visible;
      }
      .arcade-pet-sprite {
        position:absolute; left:5px; top:5px; width:86px; height:86px; background-image:url("${SPRITES}");
        background-size:400% 200%; background-repeat:no-repeat;
        --pet-facing:1; transform-origin:50% 88%;
        filter:drop-shadow(0 5px 4px rgba(0,0,0,.38)); animation:arcade-pet-idle 3.2s ease-in-out infinite;
      }
      .arcade-pet-companion.is-walking .arcade-pet-sprite { animation:arcade-pet-walk .38s ease-in-out infinite; }
      .arcade-pet-companion.is-excited .arcade-pet-sprite { animation:arcade-pet-hop .48s ease-in-out infinite; }
      .arcade-pet-name { position:absolute; left:50%; bottom:4px; width:max-content; max-width:130px; transform:translateX(-50%); color:#dffff1; font:800 9px/1.1 Inter,system-ui,sans-serif; letter-spacing:.04em; text-shadow:0 2px 4px #000; }
      .arcade-pet-picker {
        position:fixed; right:max(12px,env(safe-area-inset-right)); bottom:max(58px,calc(env(safe-area-inset-bottom) + 46px)); z-index:2147483003; display:none; width:min(340px,calc(100vw - 24px));
        max-height:calc(100dvh - 76px); overflow:auto; overscroll-behavior:contain;
        padding:12px; border:1px solid rgba(122,255,202,.38); border-radius:12px; color:#effff7;
        background:rgba(0,10,6,.94); box-shadow:0 20px 60px rgba(0,0,0,.7); backdrop-filter:blur(15px);
        font-family:Inter,system-ui,sans-serif;
      }
      .arcade-pet-dock-toggle {
        position:fixed; right:max(12px,env(safe-area-inset-right)); bottom:max(14px,env(safe-area-inset-bottom)); z-index:2147483003; width:72px; height:34px;
        border:1px solid rgba(122,255,202,.48); border-radius:999px; color:#dffff1;
        background:rgba(0,18,11,.92); box-shadow:0 10px 28px rgba(0,0,0,.55);
        cursor:pointer; touch-action:manipulation; font:900 9px/1 Inter,system-ui,sans-serif; letter-spacing:.08em;
      }
      .arcade-pet-picker.is-open { display:block; }
      .arcade-pet-picker header { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:9px; }
      .arcade-pet-picker header strong { font-size:14px; }
      .arcade-pet-picker header a { color:#8dffd1; font-size:11px; }
      .arcade-pet-picker .arcade-pet-balance { margin:-2px 0 9px; color:#e2bd6a; font-size:10px; font-weight:800; }
      .arcade-pet-picker .arcade-pet-status { margin:8px 0 0; color:#dffff1; font-size:11px; }
      .arcade-pet-picker .arcade-pet-status:empty { margin:0; }
      .arcade-pet-options { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
      .arcade-pet-option { border:1px solid rgba(122,255,202,.2); border-radius:8px; color:#effff7; background:rgba(16,53,37,.58); cursor:pointer; padding:5px; }
      .arcade-pet-option.is-selected { border-color:#8dffd1; box-shadow:inset 0 0 14px rgba(44,255,157,.16); }
      .arcade-pet-option i { display:block; width:58px; max-width:100%; aspect-ratio:1; margin:auto; background-image:url("${SPRITES}"); background-size:400% 200%; background-repeat:no-repeat; }
      .arcade-pet-option span,.arcade-pet-option small { display:block; overflow:hidden; font-size:9px; font-weight:800; text-overflow:ellipsis; white-space:nowrap; }
      .arcade-pet-option small { margin-top:2px; color:#93b8a7; font-size:8px; }
      .arcade-pet-assist {
        position:absolute; top:92px; right:14px; z-index:14; display:grid; grid-template-columns:auto 1fr; column-gap:8px;
        min-width:190px; max-width:min(290px,calc(100% - 28px)); padding:8px 10px;
        border:1px solid rgba(122,255,202,.34); border-radius:10px; color:#effff7;
        background:linear-gradient(110deg,rgba(0,10,6,.9),rgba(15,54,36,.84)); box-shadow:0 12px 34px rgba(0,0,0,.46);
        backdrop-filter:blur(12px); pointer-events:none; font-family:Inter,system-ui,sans-serif;
        transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;
      }
      .arcade-pet-assist::before { content:"PET"; grid-row:1/4; align-self:center; padding:7px 5px; border:1px solid rgba(226,189,106,.34); border-radius:7px; color:#ffe3a0; font-size:8px; font-weight:950; letter-spacing:.1em; }
      .arcade-pet-assist span,.arcade-pet-assist strong,.arcade-pet-assist small { grid-column:2; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .arcade-pet-assist span { color:#8dffd1; font-size:8px; font-weight:950; letter-spacing:.12em; text-transform:uppercase; }
      .arcade-pet-assist strong { font-size:11px; }
      .arcade-pet-assist small { color:#b8d4c7; font-size:9px; }
      .arcade-pet-assist.is-active { border-color:#ffe09a; box-shadow:0 0 34px rgba(77,255,174,.34); transform:scale(1.05); }
      .arcade-pet-assist[data-game="rocketSimulator"] { top:155px; }
      .arcade-pet-assist[data-game="paradox"] { top:78px; }
      @keyframes arcade-pet-idle { 0%,100% { transform:scaleX(var(--pet-facing)) scaleY(1); } 50% { transform:scaleX(var(--pet-facing)) scaleY(1.025); } }
      @keyframes arcade-pet-walk { 0%,100% { transform:scaleX(var(--pet-facing)) translateY(0) rotate(-2deg); } 50% { transform:scaleX(var(--pet-facing)) translateY(-3px) rotate(2deg); } }
      @keyframes arcade-pet-hop { 0%,100% { transform:scaleX(var(--pet-facing)) translateY(0); } 45% { transform:scaleX(var(--pet-facing)) translateY(-9px) rotate(3deg); } }
      @media(prefers-reduced-motion:reduce){
        .arcade-pet-companion{transition:none}
        .arcade-pet-companion .arcade-pet-sprite,
        .arcade-pet-companion.is-walking .arcade-pet-sprite,
        .arcade-pet-companion.is-excited .arcade-pet-sprite{animation:none;transform:scaleX(var(--pet-facing))}
      }
      @media(max-width:680px){
        .arcade-pet-companion{left:clamp(40px,var(--pet-x,60%),calc(100vw - 110px));bottom:max(10px,env(safe-area-inset-bottom));width:60px;height:76px}
        .arcade-pet-companion .arcade-pet-sprite{left:2px;top:2px;width:54px;height:54px}
        .arcade-pet-companion .arcade-pet-name{max-width:68px;font-size:8px;text-align:center}
        .arcade-pet-sprite{width:66px;height:66px}
        .arcade-pet-dock-toggle{right:max(10px,env(safe-area-inset-right));width:66px}
        .arcade-pet-picker{right:max(10px,env(safe-area-inset-right));left:max(10px,env(safe-area-inset-left));width:auto;max-height:calc(100dvh - 148px)}
        .arcade-pet-options{grid-template-columns:repeat(4,minmax(0,1fr))}
        .arcade-pet-assist{top:150px;right:8px;min-width:170px;max-width:calc(100% - 16px)}
        .arcade-pet-assist[data-game="rocketSimulator"]{top:248px}
        .arcade-pet-assist[data-game="paradox"]{top:100px}
      }
    `;
    document.head.appendChild(style);
  }

  function renderPicker() {
    if (!picker) return;
    const options = picker.querySelector(".arcade-pet-options");
    const markup = pets
      .filter((pet) => data.unlocked.includes(pet.id))
      .map((pet) => `
        <button class="arcade-pet-option${pet.id === data.selected ? " is-selected" : ""}" data-pet="${pet.id}" type="button" aria-pressed="${pet.id === data.selected}">
          <i style="background-image:url('${pet.sheet}');background-position:${spritePosition(pet.id)}"></i><span>${pet.name}</span><small>Strength ${data.stats[pet.id].strength}</small>
        </button>
      `).join("");
    if (markup !== pickerMarkup) {
      const focusedPet = options.contains(document.activeElement) ? document.activeElement.dataset.pet : null;
      pickerMarkup = markup;
      options.innerHTML = markup;
      if (focusedPet) {
        const replacement = [...options.querySelectorAll("[data-pet]")].find(button => button.dataset.pet === focusedPet);
        (replacement || dockToggle).focus({ preventScroll: true });
      }
    }
    const balance = picker.querySelector(".arcade-pet-balance");
    if (balance) balance.textContent = `${window.EmeraldArcade?.arcadeShardBalance?.() || 0} Arcade Shards · ${data.inventory.bambooShoots} shoots · ${data.inventory.bambooSticks} sticks`;
  }

  function mount() {
    // Focus screens can suppress the roaming decoration without hiding earned assists.
    injectStyles();
    mountAssistIndicator();
    if (document.body.dataset.noArcadePet === "true" || companion) return;
    companion = document.createElement("div");
    companion.className = "arcade-pet-companion";
    companion.setAttribute("aria-hidden", "true");
    companion.innerHTML = `<i class="arcade-pet-sprite"></i><span class="arcade-pet-name"></span>`;
    sprite = companion.querySelector(".arcade-pet-sprite");
    picker = document.createElement("section");
    picker.className = "arcade-pet-picker";
    picker.id = "arcade-pet-picker";
    picker.setAttribute("aria-label", "Arcade Pet Dock");
    picker.innerHTML = `<header><strong>Arcade Pet Dock</strong><a href="etc-pets.html">Open sanctuary</a></header><div class="arcade-pet-balance"></div><div class="arcade-pet-options"></div><p class="arcade-pet-status" role="status"></p>`;
    dockToggle = document.createElement("button");
    dockToggle.className = "arcade-pet-dock-toggle";
    dockToggle.type = "button";
    dockToggle.textContent = "PETS";
    dockToggle.setAttribute("aria-label", "Pet switcher");
    dockToggle.setAttribute("aria-controls", picker.id);
    dockToggle.setAttribute("aria-expanded", "false");
    document.body.append(companion, dockToggle, picker);
    function setPickerOpen(open) {
      picker.classList.toggle("is-open", open);
      dockToggle.setAttribute("aria-expanded", String(open));
    }
    dockToggle.addEventListener("click", () => {
      celebrate();
      setPickerOpen(!picker.classList.contains("is-open"));
    });
    picker.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-pet]");
      if (!button) return;
      const result = await perform("select", button.dataset.pet);
      picker.querySelector(".arcade-pet-status").textContent = result.message;
    });
    document.addEventListener("pointerdown", (event) => {
      if (!picker.classList.contains("is-open") || picker.contains(event.target) || dockToggle.contains(event.target)) return;
      setPickerOpen(false);
    });
    function onPickerKeyDown(event) {
      // Preserve native button and link activation without forwarding keys to the game.
      event.stopPropagation();
      if (event.key !== "Escape" || !picker.classList.contains("is-open")) return;
      event.preventDefault();
      setPickerOpen(false);
      dockToggle.focus();
    }
    dockToggle.addEventListener("keydown", onPickerKeyDown);
    picker.addEventListener("keydown", onPickerKeyDown);
    refresh();
    motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function stopWalking() {
      clearTimeout(walkTimer);
      const x = companion.getBoundingClientRect().left + companion.offsetWidth / 2;
      companion.style.transition = "none";
      petX = x / window.innerWidth * 100;
      companion.style.setProperty("--pet-x", `${petX}%`);
      companion.classList.remove("is-walking");
      requestAnimationFrame(() => { companion.style.transition = ""; });
    }
    motionPreference.addEventListener("change", stopWalking);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopWalking();
    });
    window.addEventListener("resize", stopWalking);
    window.addEventListener("emeraldarcade:pause", event => {
      if (event.detail?.paused) stopWalking();
    });
    setInterval(wander, 5200);
  }

  function refresh() {
    data = load();
    if (!companion) return;
    const pet = petById(data.selected);
    petX ??= clamp(data.x, 8, 92);
    companion.style.setProperty("--pet-x", `${petX}%`);
    sprite.style.backgroundImage = `url("${pet.sheet}")`;
    sprite.style.backgroundPosition = spritePosition(pet.id, excited);
    companion.querySelector(".arcade-pet-name").textContent = pet.name;
    renderPicker();
  }

  function select(id) {
    if (!readableStore()) return;
    data = load();
    if (!data.unlocked.includes(id)) return;
    data.selected = id;
    save();
    refresh();
    celebrate();
  }

  function wander() {
    if (!companion) return;
    if (motionPreference?.matches || document.hidden || companion.classList?.contains("is-walking") ||
        picker?.classList.contains("is-open") || window.EmeraldArcade?.isPaused?.()) return;
    data = load();
    const current = petX ?? data.x;
    const minimum = window.innerWidth <= 680 ? 40 : 60;
    const maximum = window.innerWidth - (window.innerWidth <= 680 ? 110 : 140);
    const origin = clamp(current / 100 * window.innerWidth, minimum, maximum);
    const distance = 35 + Math.random() * 85;
    let destination = origin + (Math.random() < .5 ? -distance : distance);
    if (destination < minimum || destination > maximum) destination = origin - (destination - origin);
    destination = clamp(destination, minimum, maximum);
    const duration = Math.abs(destination - origin) / 28;
    petX = destination / window.innerWidth * 100;
    if (sprite) sprite.style.setProperty("--pet-facing", destination < origin ? "-1" : "1");
    companion.style.setProperty("--pet-walk-time", `${duration}s`);
    // Cosmetic wandering must never write a cached inventory across tabs.
    companion.style.setProperty("--pet-x", `${petX}%`);
    companion.classList?.add("is-walking");
    clearTimeout(walkTimer);
    walkTimer = setTimeout(() => companion.classList?.remove("is-walking"), duration * 1000);
  }

  function celebrate() {
    if (!sprite) return;
    clearTimeout(excitedTimer);
    excited = true;
    companion.classList.add("is-excited");
    sprite.style.backgroundPosition = spritePosition(data.selected, true);
    excitedTimer = setTimeout(() => {
      excited = false;
      companion.classList.remove("is-excited");
      sprite.style.backgroundPosition = spritePosition(data.selected, false);
    }, 1100);
  }

  function updatePet(action) {
    if (!["feed", "play", "train"].includes(action)) return { ok:false, message:"Unknown care action." };
    if (!readableStore()) return { ok: false, message: "Care stopped: your pet save cannot be read. Original data kept; restore your save before continuing." };
    data = load();
    const before = JSON.parse(JSON.stringify(data));
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
      if (stats.strength >= 25) return { ok: false, stats, message: "Strength Level 25 reached. Training sticks kept." };
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
    data.careHistory = [...(data.careHistory || []), {
      action, pet: data.selected, strength: stats.strength,
      shoots: data.inventory.bambooShoots, sticks: data.inventory.bambooSticks,
    }].slice(-8);
    try {
      save();
    } catch {
      data = before;
      return { ok: false, stats: data.stats[data.selected], message: "Care was not saved. Supplies and strength kept. Check browser storage and try again." };
    }
    celebrate();
    return { ok: true, stats, message: action === "train" ? `Used 1 training stick · ${data.inventory.bambooSticks} left. Strength reached Level ${stats.strength}.` : action === "feed" ? `Used 1 shoot · ${data.inventory.bambooShoots} left. Training sticks unchanged.` : "Played together · no supplies spent." };
  }

  function storageReady() {
    if (!readableStore()) return false;
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, existing ?? JSON.stringify(defaults()));
      return true;
    } catch { return false; }
  }

  function purchaseSupply(packId) {
    const pack = supplyPacks[packId];
    if (!pack) return { ok: false, message: "Unknown bamboo supply." };
    if (!storageReady()) return { ok: false, message: "Purchase stopped: browser storage is unavailable. No shards spent." };
    if (!window.EmeraldArcade?.purchasePetGrant?.(pack.cost, { shoots: pack.shoots, sticks: pack.sticks })) {
      return { ok: false, message: `Purchase stopped. You need ${pack.cost} Arcade Shards and available browser storage.` };
    }
    data = load();
    try { save(); } catch {
      return { ok: true, message: `${pack.name} purchased. Delivery is secured in your wallet; reload when browser storage is available.` };
    }
    celebrate();
    return { ok: true, message: `${pack.name} added to your sanctuary.` };
  }

  function unlock(id) {
    data = load();
    const pet = pets.find(item => item.id === id);
    if (!pet) return { ok:false, message:"Unknown companion." };
    if (data.unlocked.includes(pet.id)) return { ok: true, message: `${pet.name} is already unlocked.` };
    if (!storageReady()) return { ok: false, message: "Unlock stopped: browser storage is unavailable. No shards spent." };
    if (!window.EmeraldArcade?.purchasePetGrant?.(pet.unlockCost, { pet: pet.id })) {
      return { ok: false, message: `Unlock stopped. You need ${pet.unlockCost} Arcade Shards and available browser storage.` };
    }
    data = load();
    try { save(); } catch {
      return { ok: true, message: `${pet.name} purchased. Unlock is secured in your wallet; reload when browser storage is available.` };
    }
    refresh();
    celebrate();
    return { ok: true, message: `${pet.name} joined your arcade roster.` };
  }

  function customizeSanctuary(kind, id) {
    if (!readableStore()) return { ok: false, message: "Sanctuary changes stopped: pet save is unreadable. Original data kept." };
    data = load();
    const habitat = kind === "habitat";
    const item = (habitat ? habitats : decorations).find(entry => entry.id === id);
    if (!item) return { ok: false, message: "Unknown sanctuary item." };
    const owned = habitat ? data.sanctuary.ownedHabitats : data.sanctuary.ownedDecorations;
    const buying = !owned.includes(id);
    if (!storageReady()) return { ok: false, message: "Sanctuary changes stopped: browser storage is unavailable. No shards spent." };
    if (buying) {
      if (!window.EmeraldArcade?.purchasePetGrant?.(item.cost, habitat ? { habitat: id } : { decoration: id })) {
        return { ok: false, message: `Purchase stopped. You need ${item.cost} Arcade Shards and available browser storage.` };
      }
      data = load();
    }
    if (habitat) data.sanctuary.habitat = id;
    else {
      const active = data.sanctuary.decorations;
      data.sanctuary.decorations = active.includes(id) ? active.filter(value => value !== id) : [...active, id];
    }
    try { save(); } catch {
      data = load();
      return buying
        ? { ok: true, message: `${item.name} purchased. Ownership is secured in your wallet; reopen the shop to equip it when storage is available.` }
        : { ok: false, message: "Sanctuary arrangement was not saved. Your items and shards are kept." };
    }
    const placed = habitat || data.sanctuary.decorations.includes(id);
    return { ok: true, message: `${item.name} ${buying ? "purchased and " : ""}${placed ? (habitat ? "selected" : "placed") : "put away"}. Cosmetic only; pet assists are unchanged.` };
  }

  function trainingProgress(xp) {
    const level = strengthForXp(xp);
    if (level >= 25) return { level, maxed:true, remaining:0, sticks:0, fraction:1 };
    const floor = (level - 1) ** 2 * 10;
    const next = level ** 2 * 10;
    const remaining = Math.max(0, next - xp);
    return { level, maxed:false, remaining, sticks:Math.ceil(remaining / 10), fraction:clamp((xp-floor)/(next-floor),0,1) };
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

  function assistGameForPage() {
    const page = location.pathname.split("/").pop();
    if (page === "shard-rush.html") return "rush";
    if (page === "etc-rocket-simulator.html") return "rocketSimulator";
    if (page === "pepes-paradox.html") return "paradox";
    return null;
  }

  function assistValue(game, bonus) {
    if (game === "rush") return bonus.magnetRadius > 0 ? `+${Math.round(bonus.magnetRadius)}px pickup range` : "Train to widen pickup range";
    if (game === "rocketSimulator") {
      const percent = Math.round((bonus.salvageMultiplier - 1) * 100);
      return percent > 0 ? `+${percent}% recovered salvage` : "Train to boost recovered salvage";
    }
    if (game === "paradox") return bonus.collectibleRadius > 0 ? `+${Math.round(bonus.collectibleRadius)}px relic instinct` : "Train to extend relic instinct";
    return "Companion ready";
  }

  function renderAssistIndicator() {
    if (!assistNode) return;
    const game = assistNode.dataset.game;
    const bonus = activeBonus(game);
    assistNode.querySelector("strong").textContent = bonus.petName;
    assistNode.querySelector("small").textContent = assistValue(game, bonus);
    assistNode.querySelector("span").textContent = bonus.careFactor < 1 ? `${bonus.label} · low care` : bonus.label;
  }

  function mountAssistIndicator() {
    const game = assistGameForPage();
    const target = game === "rush"
      ? document.querySelector(".rush-stage")
      : game === "rocketSimulator"
        ? document.querySelector(".flight-stage")
        : game === "paradox"
          ? document.querySelector(".paradox-stage")
          : null;
    if (!game || !target || assistNode) return;
    assistNode = document.createElement("aside");
    assistNode.className = "arcade-pet-assist";
    assistNode.dataset.game = game;
    assistNode.setAttribute("aria-label", "Active pet assist");
    assistNode.innerHTML = "<span>Pet Assist</span><strong></strong><small></small>";
    target.appendChild(assistNode);
    renderAssistIndicator();
  }

  function showAssist(game, activated = false) {
    if (!assistNode || assistNode.dataset.game !== game) return;
    renderAssistIndicator();
    if (!activated) return;
    clearTimeout(assistTimer);
    assistNode.classList.remove("is-active");
    void assistNode.offsetWidth;
    assistNode.classList.add("is-active");
    celebrate();
    assistTimer = setTimeout(() => assistNode?.classList.remove("is-active"), 900);
  }

  function addAura(amount) {
    if (!readableStore()) return;
    data = load();
    data.stats[data.selected].aura += Math.max(0, Number(amount || 0));
    save();
    celebrate();
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  async function perform(action, value) {
    const execute = () => {
      if (action === "care") return updatePet(value);
      if (action === "supply") return purchaseSupply(value);
      if (action === "unlock") return unlock(value);
      if (action === "habitat" || action === "decoration") return customizeSanctuary(action, value);
      if (action === "select") {
        if (!readableStore()) return { ok: false, message: "Selection stopped: pet save is unreadable." };
        data = load();
        if (!data.unlocked.includes(value)) return { ok: false, message: "Unlock this companion first." };
        select(value);
        return { ok: true, message: `${petById(value).name} is now active.` };
      }
      return { ok: false, message: "Unknown sanctuary action." };
    };
    try {
      const locks = window.navigator?.locks;
      return locks?.request ? await locks.request("emerald-pet-sanctuary", execute) : execute();
    } catch {
      return { ok: false, message: "Sanctuary action stopped. Check browser storage and try again." };
    }
  }

  window.ArcadePet = {
    schemaVersion: SCHEMA_VERSION,
    saveReadable: readableStore,
    perform,
    pets,
    supplyPacks,
    habitats,
    decorations,
    load,
    select,
    unlock,
    updatePet,
    purchaseSupply,
    activeBonus,
    showAssist,
    strengthForXp,
    trainingProgress,
    addAura,
    celebrate,
    mount,
    spritePosition,
  };
  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY && event.key !== "emerald-arcade-v1" && event.key !== null) return;
    refresh();
    window.dispatchEvent(new CustomEvent("arcadepet:change", { detail: load() }));
  });
  window.addEventListener("emeraldarcade:wallet", refresh);
  window.addEventListener("arcadepet:change", renderAssistIndicator);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
