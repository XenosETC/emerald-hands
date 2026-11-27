(function (root) {
  "use strict";
  // Decode only the current world, a fading previous world, and the next reveal.
  // Missing/late art leaves the existing background visible rather than blanking it.
  function create(worlds, ImageType = Image) {
    const cache = new Map();
    let shown = -1, previous = -1, target = -1, blend = 0;
    function image(index) {
      if (index < 0 || index >= worlds.length) return null;
      if (!cache.has(index)) {
        const art = new ImageType(); art.src = worlds[index].asset;
        cache.set(index, art);
      }
      return cache.get(index);
    }
    function reset() { shown = previous = target = -1; blend = 0; cache.clear(); }
    function update(worldX, dt) {
      target = worlds.findLastIndex(world => worldX >= world.start);
      // Preload the first world only when approaching the frontier exit.
      if (target < 0) {
        if (worldX >= worlds[0].start - 2400) image(0);
        return;
      }
      const next = image(target); image(target + 1);
      if (next.complete && next.naturalWidth && shown !== target) {
        previous = shown; shown = target; blend = 0;
      }
      blend = Math.min(1, blend + Math.max(0, dt) * 2);
      if (blend === 1) previous = -1;
      const keep = new Set([shown, previous, target, target + 1]);
      for (const index of cache.keys()) if (!keep.has(index)) cache.delete(index);
    }
    function layers() {
      const result = [];
      if (previous >= 0) result.push({ image: cache.get(previous), alpha: 1 });
      if (shown >= 0) result.push({ image: cache.get(shown), alpha: blend });
      return result;
    }
    function snapshot() { return { shown, previous, target, blend, cached: cache.size }; }
    return Object.freeze({ update, reset, layers, snapshot });
  }
  root.EmeraldWorldTour = Object.freeze({ create });
})(typeof window === "undefined" ? globalThis : window);
