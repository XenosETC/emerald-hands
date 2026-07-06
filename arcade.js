(function () {
  const STORAGE_KEY = "emerald-arcade-v1";

  const defaults = {
    xp: 0,
    gamesPlayed: 0,
    best: {
      hands: { prestigeRank: "Retail Ghost", ogPoints: 0, empireValue: 0, totalEarned: 0 },
      rush: { score: 0, rank: "Unranked", combo: 1 },
      galaxy: { score: 0, rank: "Cadet", wave: 1, weapon: "Mk I" },
    },
    badges: [],
  };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return {
        ...defaults,
        ...saved,
        best: {
          hands: { ...defaults.best.hands, ...saved?.best?.hands },
          rush: { ...defaults.best.rush, ...saved?.best?.rush },
          galaxy: { ...defaults.best.galaxy, ...saved?.best?.galaxy },
        },
        badges: Array.isArray(saved?.badges) ? saved.badges : [],
      };
    } catch {
      return JSON.parse(JSON.stringify(defaults));
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function uniquePush(list, value) {
    if (!list.includes(value)) list.push(value);
  }

  function record(game, payload) {
    const data = load();
    data.gamesPlayed += payload?.played ? 1 : 0;

    if (game === "hands") {
      const current = data.best.hands;
      if ((payload.ogPoints || 0) >= current.ogPoints || (payload.empireValue || 0) > current.empireValue) {
        data.best.hands = { ...current, ...payload };
      }
      data.xp = Math.max(data.xp, Math.floor((payload.empireValue || 0) / 1000) + (payload.ogPoints || 0) * 250);
      if ((payload.ogPoints || 0) >= 1) uniquePush(data.badges, "OG Initiate");
      if ((payload.ogPoints || 0) >= 7) uniquePush(data.badges, "Market Sage");
    }

    if (game === "rush") {
      if ((payload.score || 0) > data.best.rush.score) data.best.rush = { ...data.best.rush, ...payload };
      data.xp += Math.floor((payload.score || 0) / 120);
      if ((payload.score || 0) >= 9000) uniquePush(data.badges, "Shard Stacker");
      if ((payload.combo || 0) >= 6) uniquePush(data.badges, "Combo Runner");
    }

    if (game === "galaxy") {
      if ((payload.score || 0) > data.best.galaxy.score) data.best.galaxy = { ...data.best.galaxy, ...payload };
      data.xp += Math.floor((payload.score || 0) / 100);
      if ((payload.wave || 0) >= 3) uniquePush(data.badges, "Boss Challenger");
      if ((payload.rank || "") === "Gasbreaker") uniquePush(data.badges, "Gasbreaker");
      if ((payload.rank || "") === "Emerald Ace") uniquePush(data.badges, "Emerald Ace");
    }

    save(data);
    return data;
  }

  function rankForXp(xp) {
    if (xp >= 50000) return "Emerald Sovereign";
    if (xp >= 22000) return "Ancient Operator";
    if (xp >= 9000) return "Arcade OG";
    if (xp >= 2800) return "LP Reviver";
    if (xp >= 800) return "Shard Initiate";
    return "Retail Pilot";
  }

  function todayChallenge() {
    const day = Math.floor(Date.now() / 86400000);
    const options = [
      { game: "Emerald Hands", task: "Reach a new prestige or push empire value higher." },
      { game: "Shard Rush", task: "Score 9K+ without dropping your combo below x2." },
      { game: "Galactic Heroes", task: "Reach Wave 3 or trigger a weapon upgrade." },
    ];
    return options[day % options.length];
  }

  window.EmeraldArcade = {
    load,
    save,
    record,
    rankForXp,
    todayChallenge,
  };
})();
