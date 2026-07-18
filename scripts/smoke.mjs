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
  "etc-unstable-launch.html",
  "etc-rocket-simulator.html",
  "etc-pets.html",
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

for (const file of readdirSync(root).filter((name) => [".html", ".js", ".css"].includes(extname(name)))) {
  const source = readFileSync(resolve(root, file), "utf8");
  check(!/[ÂÃ]|â€/.test(source), `${file} contains a visible text encoding artifact`);
}

for (const file of readdirSync(root).filter((name) => extname(name) === ".js")) {
  const result = spawnSync(process.execPath, ["--check", resolve(root, file)], { encoding: "utf8" });
  check(result.status === 0, `${file} has invalid JavaScript: ${result.stderr.trim()}`);
}

const arcadeSource = readFileSync(resolve(root, "arcade.js"), "utf8");
for (const contract of [
  "SCHEMA_VERSION = 2",
  "function migrate",
  "function resetLocalProgress",
  "function setPaused",
  "function setMuted",
  "TrackedAudioContext",
  "arcade-runtime-dock",
  "arcade-runtime-modal",
]) {
  check(arcadeSource.includes(contract), `Phase 1 shared runtime contract is missing ${contract}`);
}
for (const game of ["hands", "rush", "galaxy", "rumble", "pepeRun", "spaceUnchained", "towerDefense", "pepeWars", "paradox", "unstableLaunch", "rocketSimulator", "pets"]) {
  check(arcadeSource.includes(`${game}:`), `Shared arcade registry is missing ${game}`);
}

const launchSource = readFileSync(resolve(root, "etc-unstable-launch.js"), "utf8");
const launchHtml = readFileSync(resolve(root, "etc-unstable-launch.html"), "utf8");
for (const asset of ["emerald-space.png", "etc-rocket-sheet.png", "emerald-explosion-sheet.png"]) {
  check(existsSync(resolve(root, `assets/etc-unstable-launch/${asset}`)), `Unstable Launch generated asset is missing ${asset}`);
}
for (const contract of ["chooseCrashPrice", "LOCK PRICE", "30000", "1000000", "drawInfiniteSpace", "drawShards"]) {
  check(launchSource.includes(contract), `Unstable Launch contract is missing ${contract}`);
}
check(launchHtml.includes("Flight Timeline"), "Unstable Launch lore timeline is missing");
check(launchHtml.includes("No wallet, wagering, money, price feed, or financial prediction"), "Unstable Launch safety disclosure is missing");
check(arcadeSource.includes('slug: "emerald-singularity"'), "Arcade Emerald Singularity badge is missing");

const rocketSimSource = readFileSync(resolve(root, "etc-rocket-simulator.js"), "utf8");
for (const asset of ["deep-space.png", "rocket-tiers.png", "salvage.png"]) {
  check(existsSync(resolve(root, `assets/etc-rocket-simulator/${asset}`)), `Rocket Simulator generated asset is missing ${asset}`);
}
for (const contract of ["upgradeDefs", "Fuel lattice exhausted", "banked every shard", "buyUpgrade", "zoneFor", "rocketTier"]) {
  check(rocketSimSource.includes(contract), `Rocket Simulator contract is missing ${contract}`);
}
check(arcadeSource.includes('slug: "origin-voyager"'), "Arcade Origin Voyager badge is missing");

const petSource = readFileSync(resolve(root, "arcade-pet.js"), "utf8");
check(petSource.includes("pointer-events:none"), "Arcade pet companion can intercept gameplay input");
check(petSource.includes('aria-expanded'), "Arcade pet switcher accessibility state is missing");
const petGameSource = readFileSync(resolve(root, "etc-pets.js"), "utf8");
for (const asset of ["meme-pets.png", "pepe-variants.png", "pet-sanctuary.png"]) {
  check(existsSync(resolve(root, `assets/etc-pets/${asset}`)), `ETC Pets generated asset is missing ${asset}`);
}
for (const contract of ["Arcade Pet Dock", "setInterval(wander", "spritePosition", "selected", "addAura"]) {
  check(petSource.includes(contract), `Cross-arcade pet contract is missing ${contract}`);
}
for (const pet of ["big-chain-pepe", "mecha-pepe", "berserk-tadpole", "fallen-crystal"]) {
  check(petSource.includes(`id: "${pet}"`), `ETC Pets roster is missing ${pet}`);
}
check(petSource.includes("pet.sheet"), "ETC Pets multi-sheet rendering contract is missing");
for (const contract of ["data-action", "rankForAura", "ArcadePet.select"]) {
  const source = contract === "data-action" ? readFileSync(resolve(root, "etc-pets.html"), "utf8") : petGameSource;
  check(source.includes(contract), `ETC Pets game contract is missing ${contract}`);
}
for (const page of ["index.html", ...gamePages.filter((page) => page !== "etc-pets.html")]) {
  const html = readFileSync(resolve(root, page), "utf8");
  check(html.includes("arcade-pet.js"), `${page} does not load the shared arcade pet companion`);
}
check(arcadeSource.includes('slug: "aura-farmer"'), "Arcade Aura Farmer badge is missing");

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
