(function (root) {
  "use strict";
  const key = "shard-rush-ghost-v1";
  const interval = 6; // 20 samples per second on the daily 120 Hz clock.
  const samplesPerRun = 1201;
  function sanitize(value) {
    if (value?.version !== 1 || value.courseVersion !== 1 || typeof value.day !== "string"
      || !/^\d{4}-\d{2}-\d{2}$/.test(value.day) || !Number.isSafeInteger(value.score)
      || value.score < 0 || value.score > 1_000_000 || !Array.isArray(value.samples)
      || value.samples.length !== samplesPerRun) return null;
    const date = new Date(`${value.day}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.day) return null;
    const samples = [];
    for (const point of value.samples) {
      if (!Array.isArray(point) || point.length !== 2 || !Number.isInteger(point[0]) || point[0] < 105 || point[0] > 1175
        || !Number.isSafeInteger(point[1]) || point[1] < 0 || point[1] > 1_000_000) return null;
      samples.push([point[0], point[1]]);
    }
    if (samples[0][0] !== 640 || samples[0][1] !== 0 || samples.at(-1)[1] !== value.score) return null;
    return { version: 1, courseVersion: 1, day: value.day, score: value.score, samples };
  }
  function matches(ghost, day, score, courseVersion = 1) {
    return !!ghost && ghost.day === day && ghost.score === score && ghost.courseVersion === courseVersion;
  }
  function read(storage, day, score, courseVersion = 1) {
    try {
      const raw = storage.getItem(key);
      if (typeof raw !== "string" || raw.length > 40_000) return null;
      const ghost = sanitize(JSON.parse(raw));
      return matches(ghost, day, score, courseVersion) ? ghost : null;
    } catch { return null; }
  }
  function write(storage, value) {
    const ghost = sanitize(value);
    if (!ghost) return false;
    try { storage.setItem(key, JSON.stringify(ghost)); return true; }
    catch { return false; }
  }
  function capture(samples, tick, x, score) {
    if (!Number.isInteger(tick) || tick < 0 || tick > 7200 || tick % interval || samples.length !== tick / interval) return;
    samples.push([Math.round(x), score]);
  }
  // Presentation only: score uses the last recorded sample (up to 50 ms old),
  // while the collector interpolates between neighboring positions.
  function at(ghost, tick) {
    if (!ghost) return null;
    const position = Math.max(0, Math.min(7200, Number.isFinite(tick) ? tick : 0)) / interval;
    const index = Math.floor(position), left = ghost.samples[index], right = ghost.samples[Math.min(index + 1, samplesPerRun - 1)];
    return { x: left[0] + (right[0] - left[0]) * (position - index), score: left[1] };
  }
  const api = Object.freeze({ key, interval, samplesPerRun, sanitize, matches, read, write, capture, at });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ShardRushGhost = api;
})(typeof window !== "undefined" ? window : globalThis);
