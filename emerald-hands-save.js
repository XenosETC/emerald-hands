(function (root) {
  'use strict';
  const key = 'emerald-hands-v1';
  const upgradeIds = ['click', 'infra', 'business', 'vault', 'media', 'acquisition', 'research', 'market'];
  const amount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const count = value => Number.isSafeInteger(value) && value >= 0;
  function fresh(now = Date.now()) {
    return { version: 1, shards: 0, totalEarned: 0, ogPoints: 0, lifetimePrestiges: 0,
      levels: Object.fromEntries(upgradeIds.map(id => [id, 0])), featuredUpgrade: null,
      history: [], lastSaved: now };
  }
  function decode(raw, now = Date.now()) {
    if (raw === null) return { status: 'new', state: fresh(now) };
    try {
      if (typeof raw !== 'string' || raw.length > 100_000) throw Error('size');
      const value = JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          (value.version !== undefined && value.version !== 1)) throw Error('format');
      // Old saves did not have a version, history, or every upgrade type.
      if (!amount(value.shards) || !amount(value.totalEarned) || value.shards > value.totalEarned ||
          !value.levels || typeof value.levels !== 'object' || Array.isArray(value.levels)) throw Error('balance');
      const state = fresh(now);
      for (const field of ['shards', 'totalEarned']) state[field] = value[field];
      for (const field of ['ogPoints', 'lifetimePrestiges']) {
        if (value[field] !== undefined && !count(value[field])) throw Error(field);
        state[field] = value[field] ?? 0;
      }
      for (const id of upgradeIds) {
        if (value.levels[id] !== undefined && !count(value.levels[id])) throw Error('level');
        state.levels[id] = value.levels[id] ?? 0;
      }
      state.featuredUpgrade = upgradeIds.includes(value.featuredUpgrade) ? value.featuredUpgrade : null;
      state.lastSaved = amount(value.lastSaved) ? value.lastSaved : now;
      state.history = (Array.isArray(value.history) ? value.history : []).filter(row =>
        row && count(row.cycle) && row.cycle > 0 && count(row.reward) && row.reward > 0 &&
        count(row.ogPoints) && amount(row.totalEarned) && amount(row.empireValue) &&
        amount(row.at) && row.at <= 8.64e15
      ).slice(-10).map(({cycle, reward, ogPoints, totalEarned, empireValue, at}) =>
        ({cycle, reward, ogPoints, totalEarned, empireValue, at}));
      return { status: 'saved', state };
    } catch { return { status: 'unavailable', state: fresh(now) }; }
  }
  function restart(state, now = Date.now()) {
    return { ...fresh(now), ogPoints: state.ogPoints, lifetimePrestiges: state.lifetimePrestiges,
      history: state.history.map(row => ({...row})) };
  }
  function objective(state) {
    if (state.ogPoints >= 60) return { title: 'Emerald Sovereign', body: 'The rank journey is complete. Keep building and sealing cycles for your own records.', complete: true };
    if (state.totalEarned >= 400000) return { title: 'Seal this cycle', body: 'Ancient OG reached. Review your prestige reward to begin a stronger cycle.', target: 'prestigeButton' };
    if (state.levels.click === 0 && state.totalEarned < 650) return { title: 'Build Sharper Hands', body: 'Collect 15 shards, then buy your first tap upgrade.', target: 'buy-click' };
    if (state.levels.infra === 0) return { title: 'Start passive production', body: 'Buy Emerald Rails. Your first rail produces shards while this game is active.', target: 'buy-infra' };
    if (state.levels.business === 0) return { title: 'Open a shard business', body: 'Save for Shard Businesses to grow your passive production.', target: 'buy-business' };
    return { title: 'Reach Ancient OG', body: 'Earn 400,000 shards in this cycle to unlock prestige. Spending shards still counts toward that total.', target: 'prestigeButton' };
  }
  const api = Object.freeze({key, upgradeIds, fresh, decode, restart, objective});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EmeraldHandsSave = api;
})(typeof window !== 'undefined' ? window : globalThis);
