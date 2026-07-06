const arcade = window.EmeraldArcade?.load();

function format(value) {
  if (value < 1000) return Math.floor(value).toLocaleString();
  if (value < 1000000) return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}K`;
  return `${(value / 1000000).toFixed(1)}M`;
}

if (arcade) {
  const challenge = window.EmeraldArcade.todayChallenge();
  document.querySelector("#arcadeRank").textContent = window.EmeraldArcade.rankForXp(arcade.xp);
  document.querySelector("#arcadeXp").textContent = format(arcade.xp);
  document.querySelector("#arcadeBadges").textContent = arcade.badges.length || 0;
  document.querySelector("#dailyChallenge").textContent = `${challenge.game}: ${challenge.task}`;

  document.querySelector("[data-stat='hands']").textContent =
    `${arcade.best.hands.prestigeRank} | ${format(arcade.best.hands.empireValue)} empire`;
  document.querySelector("[data-stat='rush']").textContent =
    `${format(arcade.best.rush.score)} best | ${arcade.best.rush.rank}`;
  document.querySelector("[data-stat='galaxy']").textContent =
    `${format(arcade.best.galaxy.score)} best | ${arcade.best.galaxy.rank}`;

  const badges = arcade.badges.slice(-5);
  document.querySelector("#badgeList").textContent = badges.length ? badges.join(" / ") : "No badges yet";
}
