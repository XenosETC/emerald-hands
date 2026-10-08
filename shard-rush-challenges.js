(function (root) {
  "use strict";
  const key = "shard-rush-daily-v1";
  const medals = Object.freeze([
    Object.freeze({ score: 3000, name: "Bronze" }),
    Object.freeze({ score: 9000, name: "Silver" }),
    Object.freeze({ score: 18000, name: "Gold" }),
  ]);
  const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);
  function validDay(day) {
    if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
    const date = new Date(`${day}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && dayKey(date) === day;
  }
  function medal(score) {
    return [...medals].reverse().find(item => score >= item.score)?.name || "Unranked";
  }
  function randomFor(day) {
    let seed = 2166136261;
    for (const char of `shard-rush/daily-v1/${day}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
    return () => {
      seed += 0x6D2B79F5;
      let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }
  // All drops are planned before play. Version the seed if course rules change.
  // A nearby reward lane and occasional flanking hazards create learnable routes.
  function course(day) {
    if (!validDay(day)) throw new RangeError("Invalid challenge day");
    const random = randomFor(day), drops = [];
    const rewards = ["shard", "shard", "liquidity", "candle", "deadlp", "combo"];
    let lane = 2, beat = 0;
    for (let tick = 0; tick < 56 * 120;) {
      const phase = tick < 20 * 120 ? 0 : tick < 40 * 120 ? 1 : 2;
      lane = Math.max(0, Math.min(4, lane + Math.floor(random() * 3) - 1));
      const speed = 245 + phase * 45;
      drops.push({ tick, type: rewards[Math.floor(random() * rewards.length)], x: 128 + lane * 256, speed, spin: random() * Math.PI });
      if (beat % (phase === 0 ? 4 : 3) === 2) {
        const hazardLane = (lane + 1 + Math.floor(random() * 4)) % 5;
        drops.push({ tick, type: random() < 0.5 ? "fud" : "bot", x: 128 + hazardLane * 256, speed, spin: random() * Math.PI });
      }
      beat += 1;
      tick += [84, 70, 56][phase];
    }
    return { version: 1, day, drops };
  }
  function sanitize(value) {
    const rows = new Map();
    if (value?.version === 1 && Array.isArray(value.records)) {
      for (const row of value.records) {
        if (!validDay(row?.day) || !Number.isSafeInteger(row.score) || row.score < 0 || row.score > 1_000_000
          || !Number.isSafeInteger(row.attempts) || row.attempts < 1 || row.attempts > 1_000_000) continue;
        const old = rows.get(row.day);
        rows.set(row.day, { day: row.day, score: Math.max(row.score, old?.score || 0), attempts: Math.max(row.attempts, old?.attempts || 0) });
      }
    }
    return { version: 1, records: [...rows.values()].sort((a, b) => b.day.localeCompare(a.day)).slice(0, 90) };
  }
  function read(storage) {
    try { return sanitize(JSON.parse(storage.getItem(key))); }
    catch { return sanitize(null); }
  }
  function best(value, day) { return sanitize(value).records.find(row => row.day === day) || null; }
  function complete(storage, memory, day, score) {
    if (!validDay(day) || !Number.isSafeInteger(score) || score < 0 || score > 1_000_000) throw new RangeError("Invalid daily result");
    // Read again at completion so a different tab's higher best is not overwritten.
    const data = sanitize({ version: 1, records: [...read(storage).records, ...sanitize(memory).records] });
    const previous = best(data, day);
    const result = { day, score: Math.max(score, previous?.score || 0), attempts: Math.min(1_000_000, (previous?.attempts || 0) + 1) };
    const next = sanitize({ version: 1, records: [result, ...data.records.filter(row => row.day !== day)] });
    let saved = false;
    try { storage.setItem(key, JSON.stringify(next)); saved = true; } catch { /* Keep this tab playable. */ }
    return { data: next, previous, result, saved };
  }
  const api = Object.freeze({ key, medals, dayKey, validDay, medal, course, sanitize, read, best, complete });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ShardRushChallenges = api;
})(typeof window !== "undefined" ? window : globalThis);
