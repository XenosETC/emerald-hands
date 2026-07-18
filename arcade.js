(function () {
  const SCHEMA_VERSION = 3;
  const STORAGE_KEY = "emerald-arcade-v1";
  const SETTINGS_KEY = "emerald-arcade-settings-v1";
  const SESSION_PREFIX = "emerald-arcade-session:";
  const LOCAL_SAVE_KEYS = [
    STORAGE_KEY,
    SETTINGS_KEY,
    "emerald-arcade-pets-v1",
    "emerald-hands-v1",
    "etc-rocket-simulator-v1",
    "pepe-space-unchained-best-v1",
    "pepe-tower-defense-best-v1",
    "pepe-tower-defense-mastery-v1",
    "pepe-wars-best-v1",
    "pepecoin-emerald-run-v1",
  ];
  const nativeRequestAnimationFrame = window.requestAnimationFrame?.bind(window);
  const runtime = {
    paused: false,
    muted: false,
    pauseStartedAt: 0,
    pausedDuration: 0,
    audioContexts: new Set(),
    mediaVolumes: new WeakMap(),
    session: null,
  };
  const currentPage = location.pathname.split("/").pop() || "index.html";
  const isGamePage = currentPage !== "index.html" && currentPage !== "mini-games.html";

  if (nativeRequestAnimationFrame) {
    window.requestAnimationFrame = function arcadeRequestAnimationFrame(callback) {
      function deliver(timestamp) {
        if (runtime.paused) {
          nativeRequestAnimationFrame(deliver);
          return;
        }
        callback(timestamp - runtime.pausedDuration);
      }
      return nativeRequestAnimationFrame(deliver);
    };
  }

  const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
  if (NativeAudioContext) {
    function TrackedAudioContext(...args) {
      const context = new NativeAudioContext(...args);
      runtime.audioContexts.add(context);
      if (runtime.muted) context.suspend().catch(() => {});
      context.addEventListener?.("statechange", () => {
        if (context.state === "closed") runtime.audioContexts.delete(context);
      });
      return context;
    }
    TrackedAudioContext.prototype = NativeAudioContext.prototype;
    Object.setPrototypeOf(TrackedAudioContext, NativeAudioContext);
    window.AudioContext = TrackedAudioContext;
    window.webkitAudioContext = TrackedAudioContext;
  }

  const gamePaths = {
    hands: "emerald-hands.html",
    rush: "shard-rush.html",
    galaxy: "emerald-galactic-heroes.html",
    rumble: "pepe-relic-rumble.html",
    pepeRun: "pepecoin-run.html",
    spaceUnchained: "pepe-space-unchained.html",
    towerDefense: "pepe-tower-defense.html",
    pepeWars: "pepe-wars.html",
    paradox: "pepes-paradox.html",
    unstableLaunch: "etc-unstable-launch.html",
    rocketSimulator: "etc-rocket-simulator.html",
    pets: "etc-pets.html",
  };

  const defaults = {
    schemaVersion: SCHEMA_VERSION,
    xp: 0,
    gamesPlayed: 0,
    lastPlayed: null,
    wallet: {
      arcadeShards: 60,
      lifetimeShards: 60,
    },
    analytics: {},
    best: {
      hands: { prestigeRank: "Retail Ghost", ogPoints: 0, empireValue: 0, totalEarned: 0 },
      rush: { score: 0, rank: "Unranked", combo: 1 },
      galaxy: { score: 0, rank: "Cadet", wave: 1, weapon: "Mk I" },
      rumble: { wins: 0, rank: "Unranked", rounds: 0 },
      pepeRun: { score: 0, rank: "Fresh Frog", shards: 0, combo: 1 },
      spaceUnchained: { score: 0, rank: "Fresh Pilot", wave: 1, shards: 0, kills: 0 },
      towerDefense: { score: 0, rank: "Fresh Defender", wave: 1, shards: 0 },
      pepeWars: { score: 0, rank: "Fresh Recruit", wins: 0, time: 0 },
      paradox: { score: 0, rank: "Trail Seeker", stage: 0, shards: 0, relics: 0, frogs: 0 },
      unstableLaunch: { score: 0, rank: "Ground Crew", lockedPrice: 0, peakPrice: 0 },
      rocketSimulator: { score: 0, rank: "Launch Engineer", distance: 0, shards: 0 },
      pets: { score: 0, rank: "Pocket Meme", aura: 0, trained: 1 },
    },
    badges: [],
  };

  const badgeCatalog = [
    {
      slug: "emerald-pilot",
      name: "Emerald Pilot",
      description: "Play any Emerald Arcade game.",
      icon: "assets/badges/emerald-pilot.png",
    },
    {
      slug: "shard-stacker",
      name: "Shard Stacker",
      description: "Score 9K+ in Shard Rush.",
      icon: "assets/badges/shard-stacker.png",
    },
    {
      slug: "lp-reviver",
      name: "LP Reviver",
      description: "Earn your first OG point in Emerald Hands.",
      icon: "assets/badges/lp-reviver.png",
    },
    {
      slug: "combo-runner",
      name: "Combo Runner",
      description: "Hit a x6 combo in Shard Rush.",
      icon: "assets/badges/combo-runner.png",
    },
    {
      slug: "boss-challenger",
      name: "Boss Challenger",
      description: "Reach Wave 3 in Galactic Heroes.",
      icon: "assets/badges/boss-challenger.png",
    },
    {
      slug: "gasbreaker",
      name: "Gasbreaker",
      description: "Finish Galactic Heroes as Gasbreaker.",
      icon: "assets/badges/gasbreaker.png",
    },
    {
      slug: "market-sage",
      name: "Market Sage",
      description: "Reach 7 OG points in Emerald Hands.",
      icon: "assets/badges/market-sage.png",
    },
    {
      slug: "emerald-ace",
      name: "Emerald Ace",
      description: "Finish Galactic Heroes as Emerald Ace.",
      icon: "assets/badges/emerald-ace.png",
    },
    {
      slug: "chart-surfer",
      name: "Chart Surfer",
      description: "Score 4.5K+ in PepeCoin Emerald Run.",
      icon: "assets/pepecoin-run/pepecoin-classic.png",
    },
    {
      slug: "space-unchained",
      name: "Space Unchained",
      description: "Reach Wave 3 in Pepe: Space Unchained.",
      icon: "assets/pepe-space-unchained/pepe-ship.png",
    },
    {
      slug: "vault-defender",
      name: "Vault Defender",
      description: "Survive Wave 5 in Pepe Tower Defense.",
      icon: "assets/pepecoin-run/pepecoin-classic.png",
    },
    {
      slug: "pepe-warlord",
      name: "Pepe Warlord",
      description: "Win a Pepe Wars shard siege.",
      icon: "assets/pepe-wars/brawler-pepe.png",
    },
    {
      slug: "vault-champion",
      name: "Vault Champion",
      description: "Break the KEK Domain, win the Relic Rumble tournament, and unlock Berserk Pepe.",
      icon: "assets/pepe-relic-rumble/berserk-idle.png",
    },
    {
      slug: "rage-bait-survivor",
      name: "Rage-Bait Survivor",
      description: "Clear Bamboo Mountains after Fallen Pepe's Pepina taunt.",
      icon: "assets/pepe-relic-rumble/fallen-idle.png",
    },
    {
      slug: "emerald-singularity",
      name: "Emerald Singularity",
      description: "Lock a simulated $30K+ ETC lore price in Unstable Launch.",
      icon: "assets/etc-unstable-launch/etc-rocket-sheet.png",
    },
    {
      slug: "origin-voyager",
      name: "Origin Voyager",
      description: "Reach 100K km in ETC Rocket Simulator.",
      icon: "assets/etc-rocket-simulator/rocket-tiers.png",
    },
    {
      slug: "aura-farmer",
      name: "Aura Farmer",
      description: "Raise an ETC pet to 200 aura.",
      icon: "assets/etc-pets/meme-pets.png",
    },
  ];

  const legacyBadgeMap = {
    "OG Initiate": "lp-reviver",
    "Market Sage": "market-sage",
    "Shard Stacker": "shard-stacker",
    "Combo Runner": "combo-runner",
    "Boss Challenger": "boss-challenger",
    Gasbreaker: "gasbreaker",
    "Emerald Ace": "emerald-ace",
  };

  const badgeBySlug = Object.fromEntries(badgeCatalog.map((badge) => [badge.slug, badge]));

  const rankCatalog = [
    { name: "Retail Pilot", at: 0 },
    { name: "Shard Initiate", at: 800 },
    { name: "LP Reviver", at: 2800 },
    { name: "Arcade OG", at: 9000 },
    { name: "Ancient Operator", at: 22000 },
    { name: "Emerald Sovereign", at: 50000 },
  ];

  function slugify(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normalizeBadge(value) {
    return legacyBadgeMap[value] || slugify(value);
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      return {
        muted: Boolean(saved?.muted),
        reducedMotion: Boolean(saved?.reducedMotion),
      };
    } catch {
      return { muted: false, reducedMotion: false };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function migrate(saved) {
    const source = saved && typeof saved === "object" ? saved : {};
    const migrated = {
      ...defaults,
      ...source,
      schemaVersion: SCHEMA_VERSION,
      wallet: {
        ...defaults.wallet,
        ...(source.wallet && typeof source.wallet === "object" ? source.wallet : {}),
      },
      best: Object.fromEntries(
        Object.entries(defaults.best).map(([game, fallback]) => [
          game,
          { ...fallback, ...(source.best?.[game] && typeof source.best[game] === "object" ? source.best[game] : {}) },
        ])
      ),
      badges: Array.isArray(source.badges) ? [...new Set(source.badges.map(normalizeBadge).filter(Boolean))] : [],
      analytics: source.analytics && typeof source.analytics === "object" ? source.analytics : {},
    };
    return migrated;
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const migrated = migrate(saved);
      if (saved?.schemaVersion !== SCHEMA_VERSION) save(migrated);
      return migrated;
    } catch {
      return migrate(null);
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, schemaVersion: SCHEMA_VERSION }));
  }

  function uniquePush(list, value) {
    const badge = normalizeBadge(value);
    if (badge && !list.includes(badge)) list.push(badge);
  }

  function analyticsFor(data, game) {
    data.analytics ||= {};
    data.analytics[game] ||= { starts: 0, completes: 0, retries: 0, totalSeconds: 0, lastStartedAt: null, lastCompletedAt: null };
    return data.analytics[game];
  }

  function beginSession(game, path = gamePaths[game]) {
    const data = load();
    const analytics = analyticsFor(data, game);
    const sessionKey = `${SESSION_PREFIX}${game}`;
    let active = null;
    try {
      active = JSON.parse(sessionStorage.getItem(sessionKey));
    } catch {
      active = null;
    }
    if (active?.startedAt) analytics.retries += 1;
    const startedAt = Date.now();
    analytics.starts += 1;
    analytics.lastStartedAt = startedAt;
    data.lastPlayed = { game, path: path || gamePaths[game], at: startedAt };
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify({ startedAt }));
    } catch {
      // Analytics are best-effort and never block a game.
    }
    save(data);
    runtime.session = { game, path: path || gamePaths[game], startedAt, status: "running" };
    if (document.body) document.body.dataset.arcadeSession = "running";
    window.dispatchEvent(new CustomEvent("emeraldarcade:sessionstart", { detail: { ...runtime.session } }));
    return data;
  }

  function completeSession(data, game) {
    const analytics = analyticsFor(data, game);
    const completedAt = Date.now();
    let active = null;
    try {
      active = JSON.parse(sessionStorage.getItem(`${SESSION_PREFIX}${game}`));
      sessionStorage.removeItem(`${SESSION_PREFIX}${game}`);
    } catch {
      active = null;
    }
    analytics.completes += 1;
    analytics.lastCompletedAt = completedAt;
    if (active?.startedAt) analytics.totalSeconds += Math.max(0, Math.round((completedAt - active.startedAt) / 1000));
    data.lastPlayed = { game, path: gamePaths[game], at: completedAt };
    runtime.session = { game, path: gamePaths[game], startedAt: active?.startedAt || null, completedAt, status: "completed" };
    if (document.body) document.body.dataset.arcadeSession = "completed";
    window.dispatchEvent(new CustomEvent("emeraldarcade:sessioncomplete", { detail: { ...runtime.session } }));
  }

  function continueTarget() {
    const data = load();
    return data.lastPlayed?.path
      ? data.lastPlayed
      : { game: "hands", path: gamePaths.hands, at: null };
  }

  function sessionShardReward(game, payload = {}) {
    if (!payload.played || game === "pets") return 0;
    const score = Math.max(0, Number(payload.score || 0));
    const rewards = {
      hands: 8 + Math.min(24, Math.floor(Number(payload.ogPoints || 0) * 4)),
      rush: 10 + Math.min(30, Math.floor(score / 3000)),
      galaxy: 10 + Math.min(24, Math.floor(Number(payload.wave || 1) * 4)),
      rumble: 14 + Math.min(30, Math.floor(Number(payload.wins || 0) * 8)) + (payload.tournamentWon ? 50 : 0),
      pepeRun: 8 + Math.min(28, Math.floor(Number(payload.shards || 0))),
      spaceUnchained: 10 + Math.min(30, Math.floor(Number(payload.wave || 1) * 4 + Number(payload.shards || 0) / 5)),
      towerDefense: 10 + Math.min(30, Math.floor(Number(payload.wave || 1) * 4)),
      pepeWars: 10 + Math.min(28, Math.floor(Number(payload.wins || 0) * 14)),
      paradox: 14 + Math.min(46, Math.floor(Number(payload.shards || 0) * 2 + Number(payload.relics || 0) * 8 + Number(payload.frogs || 0) * 12)),
      unstableLaunch: 8 + Math.min(32, Math.floor(Math.log10(Math.max(10, Number(payload.peakPrice || 10))) * 5)),
      rocketSimulator: 10 + Math.min(40, Math.floor(Math.sqrt(Math.max(0, Number(payload.distance || 0))) / 18)),
    };
    return Math.max(0, Math.round(rewards[game] || 8));
  }

  function awardArcadeShards(amount) {
    const reward = Math.max(0, Math.floor(Number(amount || 0)));
    if (!reward) return load().wallet.arcadeShards;
    const data = load();
    data.wallet.arcadeShards += reward;
    data.wallet.lifetimeShards += reward;
    save(data);
    window.dispatchEvent(new CustomEvent("emeraldarcade:wallet", { detail: { ...data.wallet } }));
    return data.wallet.arcadeShards;
  }

  function spendArcadeShards(amount) {
    const cost = Math.max(0, Math.floor(Number(amount || 0)));
    const data = load();
    if (!cost || data.wallet.arcadeShards < cost) return false;
    data.wallet.arcadeShards -= cost;
    save(data);
    window.dispatchEvent(new CustomEvent("emeraldarcade:wallet", { detail: { ...data.wallet } }));
    return true;
  }

  function record(game, payload) {
    const data = load();
    const previousBadges = [...data.badges];
    const previousRank = rankForXp(data.xp);
    const arcadeShardReward = sessionShardReward(game, payload);
    data.gamesPlayed += payload?.played ? 1 : 0;
    if (payload?.played) uniquePush(data.badges, "emerald-pilot");

    if (game === "hands") {
      const current = data.best.hands;
      if ((payload.ogPoints || 0) >= current.ogPoints || (payload.empireValue || 0) > current.empireValue) {
        data.best.hands = { ...current, ...payload };
      }
      data.xp = Math.max(data.xp, Math.floor((payload.empireValue || 0) / 1000) + (payload.ogPoints || 0) * 250);
      if ((payload.ogPoints || 0) >= 1) uniquePush(data.badges, "lp-reviver");
      if ((payload.ogPoints || 0) >= 7) uniquePush(data.badges, "market-sage");
    }

    if (game === "rush") {
      if ((payload.score || 0) > data.best.rush.score) data.best.rush = { ...data.best.rush, ...payload };
      data.xp += Math.floor((payload.score || 0) / 120);
      if ((payload.score || 0) >= 9000) uniquePush(data.badges, "shard-stacker");
      if ((payload.combo || 0) >= 6) uniquePush(data.badges, "combo-runner");
    }

    if (game === "galaxy") {
      if ((payload.score || 0) > data.best.galaxy.score) data.best.galaxy = { ...data.best.galaxy, ...payload };
      data.xp += Math.floor((payload.score || 0) / 100);
      if ((payload.wave || 0) >= 3) uniquePush(data.badges, "boss-challenger");
      if ((payload.rank || "") === "Gasbreaker") uniquePush(data.badges, "gasbreaker");
      if ((payload.rank || "") === "Emerald Ace") uniquePush(data.badges, "emerald-ace");
    }

    if (game === "rumble") {
      if ((payload.wins || 0) >= data.best.rumble.wins) data.best.rumble = { ...data.best.rumble, ...payload };
      data.xp += (payload.wins || 0) * 180 + Math.max(0, 4 - (payload.rounds || 4)) * 120;
      if (payload.tournamentWon) uniquePush(data.badges, "vault-champion");
    }

    if (game === "pepeRun") {
      if ((payload.score || 0) > data.best.pepeRun.score) data.best.pepeRun = { ...data.best.pepeRun, ...payload };
      data.xp += Math.floor((payload.score || 0) / 90) + (payload.shards || 0) * 4;
      if ((payload.score || 0) >= 4500) uniquePush(data.badges, "chart-surfer");
    }

    if (game === "spaceUnchained") {
      if ((payload.score || 0) > data.best.spaceUnchained.score) data.best.spaceUnchained = { ...data.best.spaceUnchained, ...payload };
      data.xp += Math.floor((payload.score || 0) / 90) + (payload.wave || 1) * 80 + (payload.shards || 0) * 3;
      if ((payload.wave || 0) >= 3) uniquePush(data.badges, "space-unchained");
    }

    if (game === "towerDefense") {
      if ((payload.score || 0) > data.best.towerDefense.score) data.best.towerDefense = { ...data.best.towerDefense, ...payload };
      data.xp += Math.floor((payload.score || 0) / 90) + (payload.wave || 1) * 95 + (payload.shards || 0) * 2;
      if ((payload.wave || 0) >= 5) uniquePush(data.badges, "vault-defender");
    }

    if (game === "pepeWars") {
      if ((payload.score || 0) > data.best.pepeWars.score) data.best.pepeWars = { ...data.best.pepeWars, ...payload };
      data.xp += Math.floor((payload.score || 0) / 95) + (payload.wins || 0) * 500;
      if ((payload.wins || 0) >= 1) uniquePush(data.badges, "pepe-warlord");
    }

    if (game === "paradox") {
      if ((payload.score || 0) >= data.best.paradox.score) data.best.paradox = { ...data.best.paradox, ...payload };
      data.xp += (payload.shards || 0) * 20 + (payload.relics || 0) * 200 + (payload.frogs || 0) * 350 + (payload.stage || 0) * 500;
      if ((payload.stage || 0) >= 1) uniquePush(data.badges, "rage-bait-survivor");
    }

    if (game === "unstableLaunch") {
      const current = data.best.unstableLaunch;
      if ((payload.lockedPrice || 0) > current.lockedPrice || (payload.score || 0) > current.score) {
        data.best.unstableLaunch = { ...current, ...payload };
      }
      data.xp += Math.floor((payload.score || 0) / 55) + Math.floor(Math.log10(Math.max(1, payload.peakPrice || 1)) * 90);
      if ((payload.lockedPrice || 0) >= 30000) uniquePush(data.badges, "emerald-singularity");
    }

    if (game === "rocketSimulator") {
      if ((payload.distance || 0) > data.best.rocketSimulator.distance) {
        data.best.rocketSimulator = { ...data.best.rocketSimulator, ...payload };
      }
      data.xp += Math.floor(Math.sqrt(Math.max(0, payload.distance || 0)) * 2) + Math.floor((payload.shards || 0) / 3);
      if ((payload.distance || 0) >= 100000) uniquePush(data.badges, "origin-voyager");
    }

    if (game === "pets") {
      if ((payload.aura || 0) >= data.best.pets.aura) data.best.pets = { ...data.best.pets, ...payload };
      data.xp += Math.floor((payload.aura || 0) / 8) + Math.max(0, (payload.trained || 1) - 1) * 3;
      if ((payload.aura || 0) >= 200) uniquePush(data.badges, "aura-farmer");
    }

    if (arcadeShardReward) {
      data.wallet.arcadeShards += arcadeShardReward;
      data.wallet.lifetimeShards += arcadeShardReward;
    }
    if (payload?.played) completeSession(data, game);

    save(data);
    return {
      ...data,
      unlockedBadges: data.badges.filter((badge) => !previousBadges.includes(badge)),
      rankChanged: previousRank !== rankForXp(data.xp),
      arcadeShardReward,
    };
  }

  function rankForXp(xp) {
    return rankCatalog.reduce((best, rank) => (xp >= rank.at ? rank : best), rankCatalog[0]).name;
  }

  function nextRankForXp(xp) {
    const next = rankCatalog.find((rank) => rank.at > xp);
    if (!next) return { label: "Max arcade rank", remaining: 0 };
    return { label: `Next: ${next.name}`, remaining: next.at - xp };
  }

  function todayChallenge() {
    const day = Math.floor(Date.now() / 86400000);
    const options = [
      { game: "Emerald Hands", task: "Reach a new prestige or push empire value higher." },
      { game: "Shard Rush", task: "Score 9K+ without dropping your combo below x2." },
      { game: "Galactic Heroes", task: "Reach Wave 3 or trigger a weapon upgrade." },
      { game: "Pepe Relic Rumble", task: "Win a best-of-five vault fight." },
      { game: "PepeCoin Emerald Run", task: "Collect 15 emeralds in one market run." },
      { game: "Pepe: Space Unchained", task: "Reach Wave 3 and collect 20 shards." },
      { game: "Pepe Tower Defense", task: "Survive Wave 5 with at least 8 vault integrity." },
      { game: "Pepe Wars", task: "Win a shard siege with your relic base alive." },
      { game: "Pepe's Paradox", task: "Clear Emerald Forest and find its hidden frog." },
      { game: "ETC: Unstable Launch", task: "Lock above $1K before the reactor fractures." },
      { game: "ETC Rocket Simulator", task: "Set a new distance record and purchase one rocket upgrade." },
      { game: "ETC Pets", task: "Feed, play with, and train your active companion." },
    ];
    return options[day % options.length];
  }

  const controlsByPage = {
    "emerald-hands.html": ["Tap or click shards to earn ETC.", "Use the shop buttons to buy infrastructure and upgrades.", "Press P to pause, M to mute, or R to restart."],
    "shard-rush.html": ["Move with mouse, touch, arrow keys, or WASD.", "Collect green rewards and avoid hazards.", "Press P to pause, M to mute, or R to restart."],
    "emerald-galactic-heroes.html": ["Move with mouse, touch, arrow keys, or WASD.", "Weapons auto-fire; collect upgrades and shield cells.", "Press P to pause, M to mute, or R to restart."],
    "pepe-relic-rumble.html": ["P1: WASD move, S charge, F punch, G kick, H shield or special.", "P2: arrows move, Down charge, J punch, K kick, L shield or special.", "Press P to pause, M to mute, or R to restart."],
    "pepes-paradox.html": ["A/D or arrows move. Space jumps. Shift dashes.", "Enter advances dialogue and taunts.", "Press P to pause, M to mute, or R to restart."],
    "pepecoin-run.html": ["Tap, click, Space, W, or Up Arrow to jump.", "Collect emeralds and dodge purple spikes.", "Press P to pause, M to mute, or R to restart."],
    "pepe-space-unchained.html": ["WASD or arrows fly. Space fires a burst shot.", "Auto-fire is enabled; collect shards and survive.", "Press P to pause, M to mute, or R to restart."],
    "pepe-tower-defense.html": ["Press 1, 2, or 3 to select a tower.", "Click or drag onto a glowing pad; click a built tower to upgrade.", "Press P to pause, M to mute, or R to restart."],
    "pepe-wars.html": ["Use the on-screen stance and upgrade controls.", "Miners gather automatically while your army holds the line.", "Press P to pause, M to mute, or R to restart."],
    "etc-unstable-launch.html": ["Tap the launch button or press Space to ignite.", "Tap again before the reactor breaks to lock the lore price.", "Press P to pause, M to mute, or R to restart."],
    "etc-rocket-simulator.html": ["Tap Launch Expedition, then steer with the on-screen controls.", "Bank salvage after every flight and upgrade the rocket.", "Press P to pause, M to mute, or R to restart."],
    "etc-pets.html": ["Choose a pet, then feed, play, and train it.", "Your active companion follows you through the arcade.", "Press P to pause, M to mute, or R to restart."],
  };

  function syncAudioState() {
    const shouldSuspend = runtime.muted || runtime.paused;
    for (const context of runtime.audioContexts) {
      if (shouldSuspend && context.state === "running") context.suspend().catch(() => {});
      if (!shouldSuspend && context.state === "suspended") context.resume().catch(() => {});
    }
    document.querySelectorAll("audio, video").forEach((media) => {
      if (!runtime.mediaVolumes.has(media)) runtime.mediaVolumes.set(media, media.volume);
      media.muted = shouldSuspend;
      if (!shouldSuspend) media.volume = runtime.mediaVolumes.get(media) ?? 1;
    });
  }

  function setPaused(paused) {
    const next = Boolean(paused) && isGamePage;
    if (next === runtime.paused) return runtime.paused;
    if (next) {
      runtime.pauseStartedAt = performance.now();
    } else {
      runtime.pausedDuration += performance.now() - runtime.pauseStartedAt;
    }
    runtime.paused = next;
    document.body?.classList.toggle("arcade-runtime-paused", next);
    const pauseButton = document.querySelector("[data-arcade-command='pause']");
    if (pauseButton) {
      pauseButton.textContent = next ? "Resume" : "Pause";
      pauseButton.setAttribute("aria-pressed", String(next));
    }
    const overlay = document.querySelector(".arcade-runtime-pause");
    if (overlay) overlay.hidden = !next;
    syncAudioState();
    window.dispatchEvent(new CustomEvent("emeraldarcade:pause", { detail: { paused: next } }));
    return next;
  }

  function setMuted(muted) {
    runtime.muted = Boolean(muted);
    const settings = loadSettings();
    saveSettings({ ...settings, muted: runtime.muted });
    const muteButton = document.querySelector("[data-arcade-command='mute']");
    if (muteButton) {
      muteButton.textContent = runtime.muted ? "Sound off" : "Sound on";
      muteButton.setAttribute("aria-pressed", String(runtime.muted));
    }
    syncAudioState();
    window.dispatchEvent(new CustomEvent("emeraldarcade:mute", { detail: { muted: runtime.muted } }));
    return runtime.muted;
  }

  function resetLocalProgress() {
    for (const key of LOCAL_SAVE_KEYS) localStorage.removeItem(key);
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith("pepecoin-prices-")) localStorage.removeItem(key);
    }
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(SESSION_PREFIX)) sessionStorage.removeItem(key);
    }
    location.reload();
  }

  function ensureRuntimeStyles() {
    if (document.querySelector("#emerald-arcade-runtime-styles")) return;
    const style = document.createElement("style");
    style.id = "emerald-arcade-runtime-styles";
    style.textContent = `
      .arcade-runtime-dock {
        position: fixed;
        left: max(12px, env(safe-area-inset-left));
        bottom: max(12px, env(safe-area-inset-bottom));
        z-index: 2147483002;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-width: min(92vw, 580px);
        padding: 6px;
        border: 1px solid rgba(116, 255, 197, .38);
        border-radius: 12px;
        background: rgba(0, 12, 8, .9);
        box-shadow: 0 14px 44px rgba(0, 0, 0, .58);
        backdrop-filter: blur(14px);
        font-family: Inter, system-ui, sans-serif;
      }
      .arcade-runtime-dock button {
        min-width: 64px;
        min-height: 44px;
        padding: 8px 11px;
        border: 1px solid rgba(116, 255, 197, .3);
        border-radius: 8px;
        color: #effff7;
        background: rgba(16, 53, 37, .72);
        cursor: pointer;
        font: 800 12px/1 Inter, system-ui, sans-serif;
      }
      .arcade-runtime-dock button:hover,
      .arcade-runtime-dock button:focus-visible { border-color: #74ffc5; outline: 2px solid rgba(116,255,197,.24); outline-offset: 2px; }
      .arcade-runtime-pause {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        display: grid;
        place-items: center;
        color: #effff7;
        background: radial-gradient(circle, rgba(20, 86, 56, .35), rgba(0, 5, 3, .84));
        backdrop-filter: blur(5px);
        pointer-events: none;
        font-family: Inter, system-ui, sans-serif;
      }
      .arcade-runtime-pause[hidden] { display: none; }
      .arcade-runtime-pause div { padding: 22px 28px; border: 1px solid rgba(116,255,197,.52); border-radius: 14px; text-align: center; background: rgba(0,12,8,.88); box-shadow: 0 24px 80px rgba(0,0,0,.65); }
      .arcade-runtime-pause strong { display:block; color:#74ffc5; font-size:clamp(1.5rem,5vw,3rem); letter-spacing:.08em; text-transform:uppercase; }
      .arcade-runtime-pause span { display:block; margin-top:6px; color:#b8d6c9; }
      .arcade-runtime-modal {
        position: fixed;
        inset: 0;
        z-index: 2147483004;
        display: grid;
        place-items: center;
        padding: max(18px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
        color: #effff7;
        background: rgba(0, 5, 3, .82);
        backdrop-filter: blur(8px);
        font-family: Inter, system-ui, sans-serif;
      }
      .arcade-runtime-modal[hidden] { display:none; }
      .arcade-runtime-panel { width:min(520px,100%); max-height:min(720px,90vh); overflow:auto; padding:18px; border:1px solid rgba(116,255,197,.5); border-radius:16px; background:linear-gradient(145deg,rgba(4,25,16,.98),rgba(0,8,5,.98)); box-shadow:0 30px 100px rgba(0,0,0,.78); }
      .arcade-runtime-panel header { display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .arcade-runtime-panel h2 { margin:0; font-size:1.35rem; }
      .arcade-runtime-panel h3 { margin:20px 0 8px; color:#74ffc5; font-size:.8rem; letter-spacing:.12em; text-transform:uppercase; }
      .arcade-runtime-panel ul { margin:10px 0 0; padding-left:20px; color:#cfe9dc; line-height:1.55; }
      .arcade-runtime-panel button { min-height:44px; border:1px solid rgba(116,255,197,.32); border-radius:8px; color:#effff7; background:rgba(16,53,37,.72); cursor:pointer; font-weight:800; }
      .arcade-runtime-close { min-width:44px; font-size:1.2rem; }
      .arcade-runtime-settings { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; }
      .arcade-runtime-reset { border-color:rgba(255,112,112,.52)!important; background:rgba(85,20,24,.65)!important; }
      .arcade-runtime-confirm { margin-top:10px; padding:12px; border:1px solid rgba(255,112,112,.42); border-radius:10px; background:rgba(58,12,15,.55); }
      .arcade-runtime-confirm p { margin:0 0 10px; color:#ffd5d5; line-height:1.4; }
      .arcade-runtime-confirm div { display:flex; gap:8px; }
      .arcade-runtime-confirm button { flex:1; }
      body.arcade-runtime-paused .arcade-pet-companion { animation-play-state:paused!important; }
      @media (max-width: 680px) {
        .arcade-runtime-dock { right:max(10px,env(safe-area-inset-right)); left:max(10px,env(safe-area-inset-left)); justify-content:center; }
        .arcade-runtime-dock button { flex:1 1 70px; }
        .arcade-runtime-settings { grid-template-columns:1fr; }
        .arcade-pet-dock-toggle { top:auto!important; bottom:max(82px,calc(env(safe-area-inset-bottom) + 72px))!important; }
        .arcade-pet-picker { bottom:134px!important; max-height:56vh; overflow:auto; }
      }
    `;
    document.head.append(style);
  }

  function mountRuntimeControls() {
    if (document.querySelector(".arcade-runtime-dock")) return;
    ensureRuntimeStyles();
    document.body.classList.toggle("arcade-runtime-game", isGamePage);
    const dock = document.createElement("nav");
    dock.className = "arcade-runtime-dock";
    dock.setAttribute("aria-label", "Arcade commands");
    dock.innerHTML = `
      ${isGamePage ? `<button type="button" data-arcade-command="pause" aria-pressed="false">Pause</button>` : ""}
      <button type="button" data-arcade-command="mute" aria-pressed="${runtime.muted}">${runtime.muted ? "Sound off" : "Sound on"}</button>
      ${isGamePage ? `<button type="button" data-arcade-command="restart">Restart</button>` : ""}
      <button type="button" data-arcade-command="controls">${isGamePage ? "Controls" : "Settings"}</button>
    `;

    const pauseOverlay = document.createElement("aside");
    pauseOverlay.className = "arcade-runtime-pause";
    pauseOverlay.hidden = true;
    pauseOverlay.setAttribute("aria-live", "polite");
    pauseOverlay.innerHTML = `<div><strong>Paused</strong><span>Press P or choose Resume.</span></div>`;

    const modal = document.createElement("section");
    modal.className = "arcade-runtime-modal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Arcade controls and settings");
    const controls = controlsByPage[currentPage] || ["Use the on-screen controls to play.", "Your progress stays on this device."];
    modal.innerHTML = `
      <article class="arcade-runtime-panel">
        <header><h2>${isGamePage ? "Controls & settings" : "Arcade settings"}</h2><button type="button" class="arcade-runtime-close" aria-label="Close">×</button></header>
        ${isGamePage ? `<h3>How to play</h3><ul>${controls.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
        <h3>Local settings</h3>
        <div class="arcade-runtime-settings">
          <button type="button" data-arcade-setting="sound">${runtime.muted ? "Turn sound on" : "Turn sound off"}</button>
          <button type="button" class="arcade-runtime-reset" data-arcade-setting="reset">Reset local data</button>
        </div>
        <div class="arcade-runtime-confirm" hidden>
          <p>This clears arcade progress, game records, upgrades, and pets stored on this device. This cannot be undone.</p>
          <div><button type="button" data-arcade-setting="cancel-reset">Keep my data</button><button type="button" class="arcade-runtime-reset" data-arcade-setting="confirm-reset">Clear everything</button></div>
        </div>
      </article>
    `;

    let pausedBeforeModal = false;
    function closeModal() {
      modal.hidden = true;
      modal.querySelector(".arcade-runtime-confirm").hidden = true;
      if (isGamePage && !pausedBeforeModal) setPaused(false);
    }
    function openModal() {
      pausedBeforeModal = runtime.paused;
      if (isGamePage) setPaused(true);
      modal.hidden = false;
      modal.querySelector(".arcade-runtime-close").focus();
    }

    dock.addEventListener("click", (event) => {
      const command = event.target.closest("[data-arcade-command]")?.dataset.arcadeCommand;
      if (command === "pause") setPaused(!runtime.paused);
      if (command === "mute") setMuted(!runtime.muted);
      if (command === "restart") location.reload();
      if (command === "controls") openModal();
    });
    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest(".arcade-runtime-close")) closeModal();
      const setting = event.target.closest("[data-arcade-setting]")?.dataset.arcadeSetting;
      if (setting === "sound") {
        setMuted(!runtime.muted);
        event.target.textContent = runtime.muted ? "Turn sound on" : "Turn sound off";
      }
      if (setting === "reset") modal.querySelector(".arcade-runtime-confirm").hidden = false;
      if (setting === "cancel-reset") modal.querySelector(".arcade-runtime-confirm").hidden = true;
      if (setting === "confirm-reset") resetLocalProgress();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeModal();
        return;
      }
      if (!modal.hidden) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || "")) return;
      if (event.key.toLowerCase() === "p" && isGamePage) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setPaused(!runtime.paused);
      }
      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setMuted(!runtime.muted);
      }
      if (event.key.toLowerCase() === "r" && isGamePage && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
        location.reload();
      }
    }, true);
    document.addEventListener("visibilitychange", () => {
      if (isGamePage && document.hidden && !runtime.paused) setPaused(true);
    });
    document.body.append(pauseOverlay, dock, modal);
    syncAudioState();
  }

  function diagnosticsSnapshot(fps = 0) {
    const arcade = load();
    const petData = window.ArcadePet?.load?.();
    const petStats = petData?.stats?.[petData.selected];
    return {
      page: currentPage,
      fps: Math.round(fps),
      paused: runtime.paused,
      muted: runtime.muted,
      session: runtime.session?.status || "idle",
      arcadeShards: arcade.wallet.arcadeShards,
      pet: petData?.selected || "none",
      petStrength: petStats?.strength || 0,
    };
  }

  function mountDiagnostics() {
    if (!new URLSearchParams(location.search).has("debug") || document.querySelector(".arcade-diagnostics")) return;
    const panel = document.createElement("output");
    panel.className = "arcade-diagnostics";
    panel.setAttribute("aria-label", "Arcade developer diagnostics");
    Object.assign(panel.style, {
      position: "fixed",
      top: "10px",
      left: "10px",
      zIndex: "2147483006",
      padding: "8px 10px",
      border: "1px solid rgba(116,255,197,.55)",
      borderRadius: "8px",
      color: "#dffff1",
      background: "rgba(0,8,5,.9)",
      font: "700 11px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace",
      pointerEvents: "none",
      whiteSpace: "pre",
    });
    document.body.append(panel);
    let frames = 0;
    let lastSample = performance.now();
    let fps = 0;
    function countFrame(now) {
      frames += 1;
      if (now - lastSample >= 500) {
        fps = frames * 1000 / (now - lastSample);
        frames = 0;
        lastSample = now;
      }
      nativeRequestAnimationFrame?.(countFrame);
    }
    nativeRequestAnimationFrame?.(countFrame);
    window.setInterval(() => {
      const snapshot = diagnosticsSnapshot(fps);
      panel.textContent = Object.entries(snapshot).map(([key, value]) => `${key}: ${value}`).join("\n");
      document.body.dataset.arcadeDebugState = JSON.stringify(snapshot);
    }, 400);
  }

  function ensureToastStyles() {
    if (document.querySelector("#emerald-arcade-toast-styles")) return;
    const style = document.createElement("style");
    style.id = "emerald-arcade-toast-styles";
    style.textContent = `
      .arcade-toast-stack {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 90;
        display: grid;
        gap: 10px;
        width: min(360px, calc(100vw - 28px));
        pointer-events: none;
      }

      .arcade-toast {
        display: grid;
        grid-template-columns: 58px 1fr;
        gap: 12px;
        align-items: center;
        padding: 10px;
        border: 1px solid rgba(116, 255, 197, 0.48);
        border-radius: 8px;
        color: #effff7;
        background:
          radial-gradient(circle at 10% 50%, rgba(35, 240, 156, 0.22), transparent 7rem),
          rgba(2, 8, 6, 0.92);
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.46), inset 0 0 28px rgba(35, 240, 156, 0.08);
        animation: arcade-toast-in 360ms ease-out, arcade-toast-out 360ms ease-in 4.4s forwards;
      }

      .arcade-toast img {
        width: 58px;
        height: 58px;
        border: 1px solid rgba(216, 180, 95, 0.35);
        border-radius: 8px;
        object-fit: cover;
      }

      .arcade-toast span,
      .arcade-toast strong {
        display: block;
      }

      .arcade-toast span {
        color: #74ffc5;
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .arcade-toast strong {
        margin-top: 2px;
        font-size: 1rem;
      }

      .arcade-toast small {
        display: block;
        margin-top: 3px;
        color: #b8d6c9;
        line-height: 1.28;
      }

      @keyframes arcade-toast-in {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes arcade-toast-out {
        to { opacity: 0; transform: translateY(10px) scale(0.98); }
      }
    `;
    document.head.append(style);
  }

  function toast(label, body, icon) {
    ensureToastStyles();
    let stack = document.querySelector(".arcade-toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "arcade-toast-stack";
      document.body.append(stack);
    }
    const node = document.createElement("article");
    node.className = "arcade-toast";
    node.innerHTML = `
      ${icon ? `<img src="${icon}" alt="">` : ""}
      <div>
        <span>${label}</span>
        <strong>${body}</strong>
      </div>
    `;
    stack.append(node);
    window.setTimeout(() => node.remove(), 5000);
  }

  function recordAndNotify(game, payload) {
    const result = record(game, payload);
    if (result.arcadeShardReward) {
      toast("Arcade Shards", `+${result.arcadeShardReward} banked`, "assets/etc-rocket-simulator/salvage.png");
      window.dispatchEvent(new CustomEvent("emeraldarcade:wallet", { detail: { ...result.wallet } }));
    }
    for (const slug of result.unlockedBadges) {
      const badge = badgeBySlug[slug];
      if (badge) toast("Badge Unlocked", badge.name, badge.icon);
    }
    if (result.rankChanged) {
      toast("Arcade Rank Up", rankForXp(result.xp), "assets/badges/emerald-ace.png");
    }
    return result;
  }

  window.EmeraldArcade = {
    schemaVersion: SCHEMA_VERSION,
    load,
    save,
    migrate,
    record,
    recordAndNotify,
    beginSession,
    continueTarget,
    toast,
    rankForXp,
    nextRankForXp,
    todayChallenge,
    awardArcadeShards,
    spendArcadeShards,
    arcadeShardBalance: () => load().wallet.arcadeShards,
    isPaused: () => runtime.paused,
    isMuted: () => runtime.muted,
    setPaused,
    setMuted,
    resetLocalProgress,
    diagnosticsSnapshot,
    badges: badgeCatalog,
  };
  runtime.muted = loadSettings().muted;
  function mountSharedRuntime() {
    mountRuntimeControls();
    mountDiagnostics();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountSharedRuntime);
  else mountSharedRuntime();
})();
