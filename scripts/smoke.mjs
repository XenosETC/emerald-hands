import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createContext, runInContext } from "node:vm";

const root = resolve(import.meta.dirname, "..");
const gamePages = [
  "emerald-hands.html",
  "satoshi-system.html",
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
const independentGamePages = [
  "pepe-soul-world/index.html",
  "pepe-temple-run/index.html",
  "pepe-feudalism/index.html",
];

function check(condition, message) {
  if (!condition) failures.push(message);
}

const hubHtml = readFileSync(resolve(root, "index.html"), "utf8");
check((hubHtml.match(/class="game-card(?:\s|")/g) || []).length === gamePages.length + independentGamePages.length, "Hub card count must match the released game collection");
for (const page of independentGamePages) {
  const path = resolve(root, page);
  check(existsSync(path), `Missing independent game: ${page}`);
  if (!existsSync(path)) continue;
  const html = readFileSync(path, "utf8");
  check(hubHtml.includes(`href="${page}"`), `Hub does not link to ${page}`);
  check(html.includes('../index.html'), `${page} has no Arcade Hub return link`);
  for (const match of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
    const target = match[1];
    if (/^(?:https?:|data:|mailto:)/.test(target)) continue;
    check(existsSync(resolve(path, "..", target)), `${page} references missing file: ${target}`);
  }
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

for (const file of readdirSync(root).filter((name) => [".js", ".mjs"].includes(extname(name)))) {
  const result = spawnSync(process.execPath, ["--check", resolve(root, file)], { encoding: "utf8" });
  check(result.status === 0, `${file} has invalid JavaScript: ${result.stderr.trim()}`);
}

const arcadeSource = readFileSync(resolve(root, "arcade.js"), "utf8");
for (const contract of [
  "SCHEMA_VERSION = 3",
  "function migrate",
  "function resetLocalProgress",
  "function setPaused",
  "function setMuted",
  "sessionShardReward",
  "spendArcadeShards",
  "mountDiagnostics",
  "TrackedAudioContext",
  "arcade-runtime-dock",
  "arcade-runtime-modal",
  "data-arcade-drag-handle",
  'data-arcade-command="collapse"',
  "saveDockState",
]) {
  check(arcadeSource.includes(contract), `Phase 1 shared runtime contract is missing ${contract}`);
}
for (const game of ["hands", "satoshiSystem", "rush", "galaxy", "rumble", "pepeRun", "spaceUnchained", "towerDefense", "pepeWars", "paradox", "unstableLaunch", "rocketSimulator", "pets"]) {
  check(arcadeSource.includes(`${game}:`), `Shared arcade registry is missing ${game}`);
}

const satoshiSource = readFileSync(resolve(root, "satoshi-system.js"), "utf8");
const satoshiHtml = readFileSync(resolve(root, "satoshi-system.html"), "utf8");
for (const contract of [
  "satoshi-system-save-v1",
  "MAX_SUPPLY = 2_100_000_000_000_000",
  "FIRST_CONTRACTION_TICK = 120",
  "reward: 8",
  "reward: 4",
  "MARKET_REGIMES",
  "REGIME_TRANSITIONS",
  "Relay Moon",
  "Merchant Planet",
  "Forge World",
  "Resilience Grid",
  "Expansion Gate",
  "reserveCoverage",
  "operatingLoad",
  "networkMaturity",
  "effectiveWorldCost",
  "baseCost * 0.9",
  "baseCost * 0.85",
  "ROUTING_DEF",
  "SYSTEM_RANKS",
  "clickReward",
  "world.growth ** state.worlds[key]",
  "state.globalIssued === state.circulation + state.treasury",
]) {
  check(satoshiSource.includes(contract) || satoshiHtml.includes(contract), `Satoshi System contract is missing ${contract}`);
}
for (const disclosure of ["Fictional closed-loop simulation", "Every in-game purchase spends fictional sats from the player Treasury", "No live data", "no offline income", "Bitcoin collateral", "wallet", "borrowing", "loans", "liquidation", "leverage", "margin", "interest", "loan-to-value", "financial advice", "Costs never use simulated price"]) {
  check(satoshiHtml.toLowerCase().includes(disclosure.toLowerCase()), `Satoshi System disclosure is missing: ${disclosure}`);
}
check(!satoshiHtml.includes("arcade-pet.js"), "Satoshi System must not load the ETC pet economy");
check(!/\bfetch\s*\(|\bWebSocket\b/.test(satoshiSource), "Satoshi System must not access live network data");
check(existsSync(resolve(root, "assets/satoshi-system/monetary-cosmos.png")), "Satoshi System cosmic background is missing");

// Exercise the actual game and shared runtime with a minimal DOM, without a browser dependency.
function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
}

function simulationHarness({ storage = memoryStorage(), page = "satoshi-system.html" } = {}) {
  const nodes = new Map();
  const makeNode = () => ({
    dataset: {}, style: { setProperty() {} }, listeners: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    addEventListener(type, callback) { this.listeners[type] = callback; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    appendChild() {}, remove() {},
  });
  const document = {
    body: makeNode(), readyState: "loading", activeElement: null,
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, makeNode());
      return nodes.get(selector);
    },
    querySelectorAll: () => [], createElement: makeNode, addEventListener() {},
  };
  const window = { addEventListener() {}, dispatchEvent() {}, setTimeout() {} };
  const context = createContext({
    document, window, localStorage: storage, sessionStorage: memoryStorage(),
    location: { pathname: `/${page}`, search: "", reload() {} },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    performance: { now: () => 0 }, confirm: () => true,
  });
  runInContext(arcadeSource, context);
  return {
    context, storage, nodes,
    evaluate: (source) => runInContext(source, context),
    startGame() { runInContext(satoshiSource, context); },
  };
}

try {
  const game = simulationHarness();
  game.startGame();
  const validLedger = () => game.evaluate("window.__satoshiSystemDebug.invariantHolds() && Number.isSafeInteger(state.treasury) && state.treasury >= 0");
  check(validLedger(), "Satoshi System must begin with a balanced integer ledger");
  game.evaluate("for (let tick = 0; tick < 8; tick += 1) advanceTick();");
  check(game.evaluate("state.treasury === 64 && state.ticks === 8"), "Eight starter clicks must route 64 fictional sats");
  game.evaluate("buy('relay');");
  check(game.evaluate("state.worlds.relay === 1 && state.treasury === 0 && state.totalSpent === 64") && validLedger(), "Buying Relay Moon must spend treasury into circulation without creating supply");
  game.evaluate("buy('forge');");
  check(game.evaluate("state.worlds.forge === 0"), "Forge World must stay locked before expansion");
  game.evaluate("for (let tick = state.ticks; tick < 60; tick += 1) advanceTick();");
  check(game.evaluate("networkMaturity().level === 1 && costFor('merchant') === 216") && validLedger(), "Tick 60 with Relay Moon must unlock the price-independent Merchant discount");
  game.evaluate("buy('merchant'); const savedMerchantPrice = costFor('merchant'); state.price = PRICE_ANCHOR * 4;");
  check(game.evaluate("costFor('merchant') === savedMerchantPrice"), "Simulated price must not alter build prices");
  game.evaluate("for (let tick = state.ticks; tick < 120; tick += 1) advanceTick();");
  check(game.evaluate("epochForTick().reward === 4 && costFor('forge') === 612") && validLedger(), "The contraction must halve base rewards and mature the Forge discount");
  game.evaluate("window.EmeraldArcade.setPaused(true); const pausedTicks = state.ticks; const pausedTreasury = state.treasury; advanceTick(); buy('routing');");
  check(game.evaluate("state.ticks === pausedTicks && state.treasury === pausedTreasury && state.routing === 0"), "Paused Satoshi input must not advance or spend");
  game.evaluate("window.EmeraldArcade.setPaused(false); const marketSeed = state.rng; spawnSatParticle(1);");
  check(game.evaluate("state.rng === marketSeed"), "Cosmetic particles must not change the saved market RNG");
  game.evaluate("for (let tick = 0; tick < 350; tick += 1) advanceTick(); buy('resilience'); buy('expansion'); buy('forge');");
  check(game.evaluate("state.goalComplete && state.arcadeRecorded && connectedWorlds() === 3") && validLedger(), "The playable first orbit must complete with three worlds and supported expansion");
  check(game.evaluate("window.EmeraldArcade.load().best.satoshiSystem.connectedPlanets === 3 && window.EmeraldArcade.load().lastPlayed.path === 'satoshi-system.html'"), "Guest completion must record its best result and continue destination");
  check(game.evaluate("window.EmeraldArcade.load().wallet.arcadeShards === 60 && window.EmeraldArcade.load().xp === 0 && window.EmeraldArcade.load().badges.length === 0"), "Guest completion must not create shared currency, XP, or ETC badges");
  const resumed = simulationHarness({ storage: game.storage });
  resumed.startGame();
  game.evaluate("advanceTick();");
  resumed.evaluate("advanceTick();");
  check(game.evaluate("JSON.stringify(state)") === resumed.evaluate("JSON.stringify(state)"), "Reloading a Satoshi save must preserve deterministic state and market continuation");
  game.evaluate("state.globalIssued = MAX_SUPPLY; state.circulation = MAX_SUPPLY - state.treasury; const treasuryBeforeCap = state.treasury; routeIssuance();");
  check(game.evaluate("state.globalIssued === MAX_SUPPLY && state.treasury === treasuryBeforeCap + 1 && clickReward() === 1") && validLedger(), "At the supply cap, routing must transfer one existing sat and display that reward");
  const arcadeBeforeReset = game.storage.getItem("emerald-arcade-v1");
  game.nodes.get("#resetButton").listeners.click();
  check(game.evaluate("state.ticks === 0 && state.treasury === 0") && game.storage.getItem("emerald-arcade-v1") === arcadeBeforeReset, "Reset Simulation must clear only the Satoshi simulation");
  game.evaluate("window.EmeraldArcade.resetLocalProgress();");
  check(game.storage.getItem("emerald-arcade-v1") === arcadeBeforeReset, "A guest-page call must not clear ETC arcade progress");
  const satoshiSave = game.storage.getItem("satoshi-system-save-v1");
  const hub = simulationHarness({ storage: game.storage, page: "index.html" });
  hub.evaluate("window.EmeraldArcade.resetLocalProgress();");
  check(game.storage.getItem("satoshi-system-save-v1") === satoshiSave && game.storage.getItem("emerald-arcade-v1") === null, "Arcade reset must preserve the separate Satoshi simulation save");
  const corrupt = simulationHarness({ storage: memoryStorage({ "satoshi-system-save-v1": "invalid-json" }) });
  corrupt.startGame();
  check(corrupt.evaluate("state.ticks === 0 && window.__satoshiSystemDebug.invariantHolds()"), "A corrupt local save must recover to a playable balanced simulation");
} catch (error) {
  check(false, `Satoshi behavior checks failed: ${error.stack || error.message}`);
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
for (const asset of [
  "deep-space.png",
  "rocket-tiers.png",
  "salvage.png",
  "sector-low-orbit.webp",
  "sector-emerald-belt.webp",
  "sector-ancient-satellite-field.webp",
  "sector-crystal-moon.webp",
  "sector-chain-nebula.webp",
  "sector-kek-constellation.webp",
  "sector-origin-flame-star.webp",
  "sector-emerald-singularity.webp",
  "sector-beyond-canon.webp",
]) {
  check(existsSync(resolve(root, `assets/etc-rocket-simulator/${asset}`)), `Rocket Simulator generated asset is missing ${asset}`);
}
for (const contract of ["upgradeDefs", "Fuel lattice exhausted", "banked every shard", "buyUpgrade", "zoneFor", "rocketTier", "sectorBlendFor", "showSectorTransition"]) {
  check(rocketSimSource.includes(contract), `Rocket Simulator contract is missing ${contract}`);
}
check(
  rocketSimSource.includes('requestedSectorQa === null ? -1 : Number(requestedSectorQa)'),
  "Rocket Simulator must not pin normal expeditions to the Low Orbit QA background",
);
check(arcadeSource.includes('slug: "origin-voyager"'), "Arcade Origin Voyager badge is missing");

const petSource = readFileSync(resolve(root, "arcade-pet.js"), "utf8");
check(petSource.includes("pointer-events:none"), "Arcade pet companion can intercept gameplay input");
check(petSource.includes('aria-expanded'), "Arcade pet switcher accessibility state is missing");
check(petSource.includes("left:clamp(60px,var(--pet-x"), "Arcade pet roaming bounds are not viewport-safe");
check(petSource.includes("left:max(10px,env(safe-area-inset-left))"), "Arcade pet picker can clip on narrow screens");
const petGameSource = readFileSync(resolve(root, "etc-pets.js"), "utf8");
const petGameCss = readFileSync(resolve(root, "etc-pets.css"), "utf8");
check(petGameCss.includes("height:100dvh"), "ETC Pets sanctuary is not viewport-fitted");
check(petGameCss.includes("grid-template-columns:repeat(4,minmax(0,1fr))"), "ETC Pets compact roster contract is missing");
for (const asset of ["meme-pets.png", "pepe-variants.png", "pet-sanctuary.png"]) {
  check(existsSync(resolve(root, `assets/etc-pets/${asset}`)), `ETC Pets generated asset is missing ${asset}`);
}
for (const contract of ["Arcade Pet Dock", "setInterval(wander", "spritePosition", "selected", "addAura"]) {
  check(petSource.includes(contract), `Cross-arcade pet contract is missing ${contract}`);
}
for (const contract of ["arcade-pet-assist", "showAssist", "assistValue", "renderAssistIndicator"]) {
  check(petSource.includes(contract), `Cross-game pet assist UI is missing ${contract}`);
}
for (const contract of ["supplyPacks", "purchaseSupply", "function unlock", "strengthForXp", "activeBonus"]) {
  check(petSource.includes(contract), `ETC Pets Phase 2 economy is missing ${contract}`);
}
check(readFileSync(resolve(root, "shard-rush.js"), "utf8").includes("petMagnet"), "Shard Rush pet strength bonus is missing");
check(rocketSimSource.includes('activeBonus("rocketSimulator")'), "Rocket Simulator pet strength bonus is missing");
for (const pet of ["big-chain-pepe", "mecha-pepe", "berserk-tadpole", "fallen-crystal"]) {
  check(petSource.includes(`id: "${pet}"`), `ETC Pets roster is missing ${pet}`);
}
check(petSource.includes("pet.sheet"), "ETC Pets multi-sheet rendering contract is missing");
for (const contract of ["data-action", "rankForAura", "ArcadePet.select"]) {
  const source = contract === "data-action" ? readFileSync(resolve(root, "etc-pets.html"), "utf8") : petGameSource;
  check(source.includes(contract), `ETC Pets game contract is missing ${contract}`);
}
for (const page of ["index.html", ...gamePages.filter((page) => !["etc-pets.html", "satoshi-system.html"].includes(page))]) {
  const html = readFileSync(resolve(root, page), "utf8");
  check(html.includes("arcade-pet.js"), `${page} does not load the shared arcade pet companion`);
}
check(arcadeSource.includes('slug: "aura-farmer"'), "Arcade Aura Farmer badge is missing");
check(arcadeSource.includes('slug: "bamboo-disciple"'), "Arcade Bamboo Disciple badge is missing");
check(petGameSource.includes("recordAndNotify"), "ETC Pets badge notification contract is missing");

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
  "attackDefinitions",
  "combatProfiles",
  "inputBuffer",
  "visualStateTime",
  "afterImages.push",
  "drawActionAccent",
  "drawAttackArc",
]) {
  check(rumbleSource.includes(animationContract), `Relic Rumble animation contract is missing ${animationContract}`);
}
check(rumbleSource.includes("f.energy >= 75"), "Relic Rumble lasting 75-energy aura contract is missing");
check(rumbleSource.includes("storedEnergyAura"), "Relic Rumble graduated stored-energy aura contract is missing");
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
check(
  existsSync(resolve(root, "assets/pepe-relic-rumble/premium-aura-atlas-v2-alpha.png")),
  "Relic Rumble premium aura atlas is missing"
);
for (const fighter of ["crown", "corrupt", "fallen", "emerald", "bandit", "ninja", "mecha", "berserk"]) {
  check(
    new RegExp(`\\n\\s*${fighter}: \\{ cell:`).test(rumbleSource),
    `Relic Rumble is missing the ${fighter} aura fit profile`
  );
}
for (const auraContract of ["premiumAuraAtlas", "auraProfiles", "auraProfile.orbitX", "auraProfile.width"]) {
  check(rumbleSource.includes(auraContract), `Relic Rumble premium aura contract is missing ${auraContract}`);
}
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
check(paradoxSource.includes("petCollectRadius"), "Pepe's Paradox pet strength bonus is missing");
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

console.log(`Smoke check passed: ${gamePages.length + independentGamePages.length} games, shared progress, independent game links, local assets, JavaScript syntax, and Satoshi progression/save isolation.`);
