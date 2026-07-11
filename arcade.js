(function () {
  const STORAGE_KEY = "emerald-arcade-v1";

  const defaults = {
    xp: 0,
    gamesPlayed: 0,
    best: {
      hands: { prestigeRank: "Retail Ghost", ogPoints: 0, empireValue: 0, totalEarned: 0 },
      rush: { score: 0, rank: "Unranked", combo: 1 },
      galaxy: { score: 0, rank: "Cadet", wave: 1, weapon: "Mk I" },
      rumble: { wins: 0, rank: "Unranked", rounds: 0 },
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
          rumble: { ...defaults.best.rumble, ...saved?.best?.rumble },
        },
        badges: Array.isArray(saved?.badges) ? [...new Set(saved.badges.map(normalizeBadge).filter(Boolean))] : [],
      };
    } catch {
      return JSON.parse(JSON.stringify(defaults));
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function uniquePush(list, value) {
    const badge = normalizeBadge(value);
    if (badge && !list.includes(badge)) list.push(badge);
  }

  function record(game, payload) {
    const data = load();
    const previousBadges = [...data.badges];
    const previousRank = rankForXp(data.xp);
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
    }

    save(data);
    return {
      ...data,
      unlockedBadges: data.badges.filter((badge) => !previousBadges.includes(badge)),
      rankChanged: previousRank !== rankForXp(data.xp),
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
    ];
    return options[day % options.length];
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
    load,
    save,
    record,
    recordAndNotify,
    toast,
    rankForXp,
    nextRankForXp,
    todayChallenge,
    badges: badgeCatalog,
  };
})();
