const arcade = window.EmeraldArcade?.load();

function format(value) {
  if (value < 1000) return Math.floor(value).toLocaleString();
  if (value < 1000000) return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}K`;
  return `${(value / 1000000).toFixed(1)}M`;
}

if (arcade) {
  const continueTarget = window.EmeraldArcade.continueTarget();
  const continueGame = document.querySelector("#continueGame");
  const continueNames = {
    hands: "Emerald Hands",
    rush: "Shard Rush",
    galaxy: "Galactic Heroes",
    rumble: "Relic Rumble",
    pepeRun: "Emerald Run",
    spaceUnchained: "Space Unchained",
    towerDefense: "Tower Defense",
    pepeWars: "Pepe Wars",
    paradox: "Pepe's Paradox",
    unstableLaunch: "Unstable Launch",
    rocketSimulator: "Rocket Simulator",
    pets: "ETC Pets",
  };
  continueGame.href = continueTarget.path;
  continueGame.textContent = `Continue ${continueNames[continueTarget.game] || "Last Game"}`;
  const challenge = window.EmeraldArcade.todayChallenge();
  const badgeCatalog = window.EmeraldArcade.badges || [];
  const nextRank = window.EmeraldArcade.nextRankForXp(arcade.xp);
  document.querySelector("#arcadeRank").textContent = window.EmeraldArcade.rankForXp(arcade.xp);
  document.querySelector("#arcadeRankMeta").textContent =
    nextRank.remaining > 0 ? `${nextRank.label} in ${format(nextRank.remaining)} XP` : nextRank.label;
  document.querySelector("#arcadeXp").textContent = format(arcade.xp);
  document.querySelector("#arcadeBadges").textContent = arcade.badges.length || 0;
  document.querySelector("#dailyChallenge").textContent = `${challenge.game}: ${challenge.task}`;
  const signals = Object.entries(arcade.analytics || {});
  const totals = signals.reduce((sum, [, value]) => ({
    starts: sum.starts + Number(value.starts || 0),
    completes: sum.completes + Number(value.completes || 0),
    retries: sum.retries + Number(value.retries || 0),
  }), { starts: 0, completes: 0, retries: 0 });
  const topSignal = signals.sort((a, b) => Number(b[1].starts || 0) - Number(a[1].starts || 0))[0];
  document.querySelector("#arcadeStarts").textContent = format(totals.starts);
  document.querySelector("#arcadeCompletes").textContent = format(totals.completes);
  document.querySelector("#arcadeRetries").textContent = format(totals.retries);
  document.querySelector("#arcadeTopGame").textContent = topSignal
    ? `Most started: ${continueNames[topSignal[0]] || topSignal[0]}`
    : "No sessions yet";

  document.querySelector("[data-stat='hands']").textContent =
    `${arcade.best.hands.prestigeRank} | ${format(arcade.best.hands.empireValue)} empire`;
  document.querySelector("[data-stat='rush']").textContent =
    `${format(arcade.best.rush.score)} best | ${arcade.best.rush.rank}`;
  document.querySelector("[data-stat='galaxy']").textContent =
    `${format(arcade.best.galaxy.score)} best | ${arcade.best.galaxy.rank}`;
  document.querySelector("[data-stat='rumble']").textContent =
    `${format(arcade.best.rumble.wins)} wins | ${arcade.best.rumble.rank}`;
  document.querySelector("[data-stat='pepeRun']").textContent =
    `${format(arcade.best.pepeRun.score)} best | ${arcade.best.pepeRun.rank}`;
  document.querySelector("[data-stat='spaceUnchained']").textContent =
    `${format(arcade.best.spaceUnchained.score)} best | ${arcade.best.spaceUnchained.rank}`;
  document.querySelector("[data-stat='towerDefense']").textContent =
    `${format(arcade.best.towerDefense.score)} best | ${arcade.best.towerDefense.rank}`;
  document.querySelector("[data-stat='pepeWars']").textContent =
    `${format(arcade.best.pepeWars.score)} best | ${arcade.best.pepeWars.rank}`;
  document.querySelector("[data-stat='paradox']").textContent =
    `${format(arcade.best.paradox.score)} best | Stage ${arcade.best.paradox.stage || 0}`;
  document.querySelector("[data-stat='unstableLaunch']").textContent =
    `${formatPrice(arcade.best.unstableLaunch.lockedPrice)} locked | ${arcade.best.unstableLaunch.rank}`;
  document.querySelector("[data-stat='rocketSimulator']").textContent =
    `${formatDistance(arcade.best.rocketSimulator.distance)} best | ${arcade.best.rocketSimulator.rank}`;
  document.querySelector("[data-stat='pets']").textContent =
    `${format(arcade.best.pets.aura)} aura | ${arcade.best.pets.rank}`;

  document.querySelector("#badgeSummary").textContent =
    arcade.badges.length ? `${arcade.badges.length} / ${badgeCatalog.length} unlocked` : "Start any game to unlock your first badge.";

  const badgeList = document.querySelector("#badgeList");
  badgeList.innerHTML = "";

  badgeCatalog.forEach((badge) => {
    const unlocked = arcade.badges.includes(badge.slug);
    const tile = document.createElement("article");
    tile.className = `badge-tile${unlocked ? " is-unlocked" : ""}`;
    tile.innerHTML = `
      <img src="${badge.icon}" alt="" loading="lazy">
      <div>
        <strong>${badge.name}</strong>
        <span>${unlocked ? badge.description : "Locked: " + badge.description}</span>
      </div>
    `;
    badgeList.appendChild(tile);
  });
}

function formatPrice(value) {
  if (!value) return "$0";
  if (value < 1000) return `$${value.toFixed(2)}`;
  if (value < 1000000) return `$${(value / 1000).toFixed(value < 10000 ? 2 : 1)}K`;
  return `$${(value / 1000000).toFixed(2)}M`;
}

function formatDistance(value) {
  if (!value) return "0 km";
  if (value < 1000) return `${Math.round(value)} km`;
  if (value < 1000000) return `${(value / 1000).toFixed(value < 10000 ? 2 : 1)}K km`;
  return `${(value / 1000000).toFixed(2)}M km`;
}
