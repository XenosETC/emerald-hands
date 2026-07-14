import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const gamePages = [
  "emerald-hands.html",
  "shard-rush.html",
  "emerald-galactic-heroes.html",
  "pepe-relic-rumble.html",
  "pepes-paradox.html",
  "pepecoin-run.html",
  "pepe-space-unchained.html",
  "pepe-tower-defense.html",
  "pepe-wars.html",
];
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

for (const page of ["index.html", ...gamePages]) {
  const path = resolve(root, page);
  check(existsSync(path), `Missing page: ${page}`);
  if (!existsSync(path)) continue;
  const html = readFileSync(path, "utf8");
  check(/<meta\s+name="viewport"/i.test(html), `${page} has no viewport contract`);
  check(/arcade\.js/.test(html), `${page} does not load shared arcade progress`);
  if (page !== "index.html") check(/href="index\.html"/.test(html), `${page} has no Arcade Hub return link`);

  for (const match of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
    const target = match[1];
    if (/^(?:https?:|data:|mailto:)/.test(target) || target === "/") continue;
    check(existsSync(resolve(root, target)), `${page} references missing file: ${target}`);
  }
}

for (const file of readdirSync(root).filter((name) => extname(name) === ".js")) {
  const result = spawnSync(process.execPath, ["--check", resolve(root, file)], { encoding: "utf8" });
  check(result.status === 0, `${file} has invalid JavaScript: ${result.stderr.trim()}`);
}

const arcadeSource = readFileSync(resolve(root, "arcade.js"), "utf8");
for (const game of ["hands", "rush", "galaxy", "rumble", "pepeRun", "spaceUnchained", "towerDefense", "pepeWars", "paradox"]) {
  check(arcadeSource.includes(`${game}:`), `Shared arcade registry is missing ${game}`);
}

const rumbleSource = readFileSync(resolve(root, "pepe-relic-rumble.js"), "utf8");
const rumbleHtml = readFileSync(resolve(root, "pepe-relic-rumble.html"), "utf8");
check(rumbleSource.includes("fallen-pepe.png"), "Relic Rumble does not load Fallen Pepe");
check(rumbleSource.includes("emerald-pepe.png"), "Relic Rumble does not load Emerald Pepe");
for (const fighter of ["bandit", "ninja", "mecha", "berserk"]) {
  check(rumbleSource.includes(`${fighter}-pepe.png`), `Relic Rumble does not load ${fighter} Pepe`);
}
const premiumFighters = ["fallen", "emerald", "bandit", "ninja", "mecha", "berserk"];
const premiumStates = ["idle", "walk", "jump", "punch", "kick", "block", "hurt", "special", "ko"];
for (const fighter of premiumFighters) {
  for (const state of premiumStates) {
    check(
      existsSync(resolve(root, `assets/pepe-relic-rumble/${fighter}-${state}.png`)),
      `Relic Rumble is missing premium sprite: ${fighter}-${state}.png`
    );
  }
}
check(rumbleSource.includes("premiumSpriteStates"), "Relic Rumble premium sprite-state loader is missing");
check(rumbleSource.includes("stateRenderScales"), "Relic Rumble per-state scale correction contract is missing");
check(
  existsSync(resolve(root, "scripts/rebuild-rumble-sprites.py")),
  "Relic Rumble clean action-sheet extractor is missing"
);
for (const fighter of ["crown", "corrupt", ...premiumFighters]) {
  check(
    new RegExp(`\\n\\s*${fighter}: \\{ idleRate:`).test(rumbleSource),
    `Relic Rumble is missing the ${fighter} animation profile`
  );
}
for (const animationContract of [
  "actionDurations",
  "visualStateTime",
  "afterImages.push",
  "drawActionAccent",
  "drawAttackArc",
]) {
  check(rumbleSource.includes(animationContract), `Relic Rumble animation contract is missing ${animationContract}`);
}
check(rumbleSource.includes('renderHeight: 248'), "Berserk Pepe heavyweight size contract is missing");
for (const fighter of ["crown", "corrupt", "fallen", "emerald", "bandit", "ninja", "mecha", "berserk"]) {
  const optionCount = [...rumbleHtml.matchAll(new RegExp(`<option value="${fighter}">`, "g"))].length;
  check(optionCount === 2, `Relic Rumble must offer ${fighter} in both fighter selectors`);
}
check(rumbleSource.includes('selectedMode === "tournament"'), "Relic Rumble tournament mode contract is missing");
check(rumbleHtml.includes('id="characterCards"'), "Relic Rumble character-card table is missing");
check(rumbleHtml.includes('id="tournamentBoard"'), "Relic Rumble tournament board is missing");
check(rumbleSource.includes("VAULT_CHAMPION_BADGE"), "Relic Rumble Berserk unlock contract is missing");
check(rumbleSource.includes("opponents = [pool[0], pool[1], bossId]"), "Relic Rumble three-bout tournament route is missing");
check(rumbleSource.includes("i * 34, 142"), "Relic Rumble round markers are not lowered beneath the HUD");
check(
  existsSync(resolve(root, "assets/pepe-relic-rumble/kek-domain-arena.png")),
  "Relic Rumble KEK Domain arena is missing"
);
for (const domainContract of [
  "activateKekDomainFinal",
  'gameState = "domain-intro"',
  "startDomainMusic",
  "drawKekDomainBackground",
  "domainEmpowered",
  "kek-domain-preview",
]) {
  check(rumbleSource.includes(domainContract), `Relic Rumble KEK Domain contract is missing ${domainContract}`);
}
check(rumbleHtml.includes("kek-domain-arena.png"), "Relic Rumble does not preload the KEK Domain arena");
check(arcadeSource.includes('slug: "vault-champion"'), "Arcade Vault Champion badge is missing");
check(arcadeSource.includes('payload.tournamentWon'), "Arcade tournament badge award contract is missing");

const paradoxSource = readFileSync(resolve(root, "pepes-paradox.js"), "utf8");
for (const contract of ["Bamboo Mountains", "beginTaunt", "You'll never get Pepina back", "advanceDialogue", "taunt-preview", "spriteAtlas", "carried", "rage-bait-survivor"]) {
  const source = contract === "rage-bait-survivor" ? arcadeSource : paradoxSource;
  check(source.includes(contract), `Pepe's Paradox contract is missing ${contract}`);
}
for (const asset of ["crown-platformer-sheet.png", "paradox-collectibles.png", "bamboo-mountains-loop.png", "bamboo-distant.png", "bamboo-temple-path.png", "bamboo-foreground.png"]) {
  check(existsSync(resolve(root, `assets/pepes-paradox/${asset}`)), `Pepe's Paradox generated asset is missing ${asset}`);
}
for (const parallaxContract of ["parallaxRates", "drawLoopLayer", "drawForeground"]) {
  check(paradoxSource.includes(parallaxContract), `Pepe's Paradox parallax contract is missing ${parallaxContract}`);
}
for (const domainUpgrade of ["domainCeremony", "showDomainCeremony", "1000 / 60", "buildKekDomainFxCache"]) {
  check(rumbleSource.includes(domainUpgrade) || rumbleHtml.includes(domainUpgrade), `Relic Rumble premium KEK upgrade is missing ${domainUpgrade}`);
}

if (failures.length) {
  console.error(`Smoke check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Smoke check passed: ${gamePages.length} games, shared progress, local assets, and JavaScript syntax.`);
