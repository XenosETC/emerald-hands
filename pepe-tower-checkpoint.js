(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EmeraldTowerCheckpoint = factory();
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const KEY = "pepe-tower-defense-build-checkpoint-v1";
  const paths = ["power", "special", "utility"];
  const integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
  const number = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;

  function normalize(value, types) {
    if (!value || value.version !== 1 || !integer(value.wave, 1, 50) ||
        !integer(value.score, 0, Number.MAX_SAFE_INTEGER) || !integer(value.shards, 0, Number.MAX_SAFE_INTEGER) ||
        !integer(value.vault, 1, 100) || !types.includes(value.selectedTower) ||
        !Array.isArray(value.heroNovaCooldowns) || value.heroNovaCooldowns.length !== 2 ||
        !value.heroNovaCooldowns.every(n => number(n, 0, 20)) ||
        !Array.isArray(value.towers) || value.towers.length > 9) return null;
    const pads = new Set(), slots = new Set(), towers = [];
    for (const tower of value.towers) {
      if (!tower || !types.includes(tower.type) || !integer(tower.pad, 0, 8) || pads.has(tower.pad) ||
          !tower.tiers || !paths.every(key => integer(tower.tiers[key], 0, 5)) ||
          paths.filter(key => tower.tiers[key] > 0).length > 2 ||
          paths.filter(key => tower.tiers[key] > 2).length > 1 ||
          !["first", "strong"].includes(tower.targetMode) || !number(tower.cooldown, 0, 60) ||
          !number(tower.aimAngle, -Math.PI, Math.PI)) return null;
      const combatDamage = tower.combatDamage === undefined ? 0 : tower.combatDamage;
      const combatKills = tower.combatKills === undefined ? 0 : tower.combatKills;
      if (!number(combatDamage, 0, Number.MAX_SAFE_INTEGER) || !integer(combatKills, 0, Number.MAX_SAFE_INTEGER)) return null;
      if (tower.type === "hero") {
        if (!integer(tower.heroSlot, 0, 1) || slots.has(tower.heroSlot)) return null;
        slots.add(tower.heroSlot);
      } else if (tower.heroSlot !== null) return null;
      pads.add(tower.pad);
      towers.push({ type: tower.type, pad: tower.pad, tiers: Object.fromEntries(paths.map(key => [key, tower.tiers[key]])),
        heroSlot: tower.heroSlot, targetMode: tower.targetMode, cooldown: tower.cooldown, aimAngle: tower.aimAngle, combatDamage, combatKills });
    }
    return { version: 1, wave: value.wave, score: value.score, shards: value.shards, vault: value.vault,
      selectedTower: value.selectedTower, heroNovaCooldowns: [...value.heroNovaCooldowns], towers };
  }
  function decode(raw, types) {
    try { return typeof raw === "string" && raw.length <= 16000 ? normalize(JSON.parse(raw), types) : null; }
    catch { return null; }
  }
  return { KEY, normalize, decode };
});
