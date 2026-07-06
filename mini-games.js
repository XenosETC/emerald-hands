const arcade = window.EmeraldArcade?.load();

function format(value) {
  if (value < 1000) return Math.floor(value).toLocaleString();
  if (value < 1000000) return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}K`;
  return `${(value / 1000000).toFixed(1)}M`;
}

if (arcade) {
  const challenge = window.EmeraldArcade.todayChallenge();
  const badgeCatalog = window.EmeraldArcade.badges || [];
  const nextRank = window.EmeraldArcade.nextRankForXp(arcade.xp);
  document.querySelector("#arcadeRank").textContent = window.EmeraldArcade.rankForXp(arcade.xp);
  document.querySelector("#arcadeRankMeta").textContent =
    nextRank.remaining > 0 ? `${nextRank.label} in ${format(nextRank.remaining)} XP` : nextRank.label;
  document.querySelector("#arcadeXp").textContent = format(arcade.xp);
  document.querySelector("#arcadeBadges").textContent = arcade.badges.length || 0;
  document.querySelector("#dailyChallenge").textContent = `${challenge.game}: ${challenge.task}`;

  document.querySelector("[data-stat='hands']").textContent =
    `${arcade.best.hands.prestigeRank} | ${format(arcade.best.hands.empireValue)} empire`;
  document.querySelector("[data-stat='rush']").textContent =
    `${format(arcade.best.rush.score)} best | ${arcade.best.rush.rank}`;
  document.querySelector("[data-stat='galaxy']").textContent =
    `${format(arcade.best.galaxy.score)} best | ${arcade.best.galaxy.rank}`;

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
