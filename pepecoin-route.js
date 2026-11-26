(function (root) {
  "use strict";
  // Authored world coordinates. Pickup spacing/RNG remain independent of
  // presentation, so adding a chapter cannot silently reshuffle a saved road.
  const opening = Object.freeze({ statue: 1600, crown: 5200, rush: 13200 });
  const tempest = Object.freeze({ start: 7200, riseEnd: 8000, fallStart: 10400, end: 11600,
    strikes: Object.freeze([7950, 9100, 10450]) });
  const chapters = Object.freeze([
    { id: "valley", name: "Jade Valley", start: 0 },
    { id: "cosmic", name: "Cosmic Causeway", start: opening.statue },
    { id: "royal", name: "Royal Skyway", start: opening.crown },
    { id: "tempest", name: "Tempest Reach", start: tempest.start },
    { id: "stormbreak", name: "Stormbreak", start: tempest.end },
    { id: "grove", name: "Emerald Grove", start: opening.rush },
    { id: "beyond", name: "Beyond the Valley", start: 16800 },
  ].map(Object.freeze));
  function chapterAt(worldX) {
    for (let i = chapters.length - 1; i >= 0; i -= 1) {
      if (worldX >= chapters[i].start) return { ...chapters[i], index: i, next: chapters[i + 1] || null };
    }
    return { ...chapters[0], index: 0, next: chapters[1] };
  }
  const openingEnd = chapters[chapters.length - 1].start;
  function progressAt(worldX) {
    return Number.isFinite(worldX) ? Math.max(0, Math.min(1, worldX / openingEnd)) : 0;
  }
  root.EmeraldRoute = Object.freeze({ opening, tempest, chapters, chapterAt, openingEnd, progressAt });
})(typeof window === "undefined" ? globalThis : window);
