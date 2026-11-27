(function (root) {
  "use strict";
  // Authored world coordinates. Pickup spacing/RNG remain independent of
  // presentation, so adding a chapter cannot silently reshuffle a saved road.
  const opening = Object.freeze({ statue: 1600, crown: 5200, rush: 13200 });
  // Four rewards in every 16,800-unit cycle, with at least 3,200 units between
  // types. Authored spacing avoids random clusters of consecutive powers.
  const pickupSpacing = Object.freeze({ statue: 8400, crown: 16800, rush: 16800 });
  const tempest = Object.freeze({ start: 7200, riseEnd: 8000, fallStart: 10400, end: 11600,
    strikes: Object.freeze([7950, 9100, 10450]) });
  const actTwo = Object.freeze({ start: 16800, rail: 17800, lunar: 22400, eclipse: 27600, eclipseEvent: 28400,
    bells: Object.freeze([29700, 31000, 32300]), end: 33600 });
  const frontier = Object.freeze({ start: actTwo.end, volcanic: 42000, end: 50400 });
  const tourStart = frontier.end, worldSpan = 8400;
  const worlds = Object.freeze([
    ["jade-canopy", "Jade Canopy", "Emerald leaves · ancient jungle temples"],
    ["monsoon-kingdom", "Monsoon Kingdom", "Rainforest waterfalls · flooded shrines"],
    ["sunscar-dunes", "Sunscar Dunes", "Golden dunes · frog sphinxes"],
    ["glass-desert", "Glass Desert", "Crystal dunes · midnight auroras"],
    ["deep-space", "Starborne Expanse", "Ringed planets · orbital ruins"],
    ["solar-gardens", "Solar Gardens", "Solar systems · celestial gardens"],
    ["nebula-ocean", "Nebula Ocean", "Star clouds · sanctuary islands"],
    ["singularity-throne", "Singularity Throne", "Black-hole halo · suspended temples"],
    ["time-space", "Time & Space", "Clockwork heavens · folded time"],
    ["dimension-weave", "Dimension Weave", "Impossible geometry · layered realities"],
    ["many-worlds", "Many Worlds", "Branching universes · alternate kingdoms"],
    ["frog-god-cosmos", "The Cosmic Frog God", "The universe beneath the great guardian"],
  ].map(([id, name, detail], index) => Object.freeze({ id, name, detail, index,
    start: tourStart + index * worldSpan, asset: `assets/pepecoin-run/worlds-v1/${id}-v1.webp` })));
  const odyssey = Object.freeze({ start: tourStart, span: worldSpan, end: tourStart + worlds.length * worldSpan, worlds });
  const chapters = Object.freeze([
    { id: "valley", name: "Jade Valley", start: 0 },
    { id: "cosmic", name: "Cosmic Causeway", start: opening.statue },
    { id: "royal", name: "Royal Skyway", start: opening.crown },
    { id: "tempest", name: "Tempest Reach", start: tempest.start },
    { id: "stormbreak", name: "Stormbreak", start: tempest.end },
    { id: "grove", name: "Emerald Grove", start: opening.rush },
    { id: "beyond", name: "Obsidian Starrail", start: actTwo.start },
    { id: "lunar", name: "Lunar Lotus Sea", start: actTwo.lunar },
    { id: "eclipse", name: "Eclipse Cathedral", start: actTwo.eclipse },
    { id: "corrupt", name: "Corrupt Frontier", start: frontier.start },
    { id: "volcanic", name: "Volcanic Forge", start: frontier.volcanic },
    ...worlds,
    { id: "endless", name: "Beyond All Worlds", start: odyssey.end },
  ].map(Object.freeze));
  function chapterAt(worldX) {
    for (let i = chapters.length - 1; i >= 0; i -= 1) {
      if (worldX >= chapters[i].start) return { ...chapters[i], index: i, next: chapters[i + 1] || null };
    }
    return { ...chapters[0], index: 0, next: chapters[1] };
  }
  const openingEnd = actTwo.start;
  function progressAt(worldX) {
    return Number.isFinite(worldX) ? Math.max(0, Math.min(1, worldX / openingEnd)) : 0;
  }
  function actTwoProgress(worldX) {
    return Number.isFinite(worldX) ? Math.max(0, Math.min(1, (worldX - actTwo.start) / (actTwo.end - actTwo.start))) : 0;
  }
  function frontierProgress(worldX) {
    return Number.isFinite(worldX) ? Math.max(0, Math.min(1, (worldX - frontier.start) / (frontier.end - frontier.start))) : 0;
  }
  function odysseyProgress(worldX) {
    return Number.isFinite(worldX) ? Math.max(0, Math.min(1, (worldX - odyssey.start) / (odyssey.end - odyssey.start))) : 0;
  }
  root.EmeraldRoute = Object.freeze({ opening, pickupSpacing, tempest, chapters, chapterAt, openingEnd, progressAt, actTwo, actTwoProgress, frontier, frontierProgress, odyssey, odysseyProgress });
})(typeof window === "undefined" ? globalThis : window);
