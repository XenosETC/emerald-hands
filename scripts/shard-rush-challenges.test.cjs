const { test } = require('node:test');
const assert = require('node:assert/strict');
const daily = require('../shard-rush-challenges.js');

function storage() {
  const values = new Map([['emerald-arcade-v3', 'untouched'], ['satoshi-system-save-v1', 'guest']]);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('daily courses repeat exactly, rotate by UTC date, and have reachable lanes in three waves', () => {
  const a = daily.course('2026-10-07'), b = daily.course('2026-10-07');
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.drops, daily.course('2026-10-08').drops);
  assert.equal(daily.dayKey(new Date('2026-10-07T23:59:59Z')), '2026-10-07');
  assert.equal(daily.dayKey(new Date('2026-10-08T00:00:00Z')), '2026-10-08');
  assert.deepEqual([...new Set(a.drops.map(drop => drop.speed))], [245, 290, 335]);
  let lastTick = 0, lastReward;
  for (const drop of a.drops) {
    assert.ok(drop.tick >= lastTick && drop.tick < 56 * 120);
    assert.ok([128, 384, 640, 896, 1152].includes(drop.x));
    assert.ok(Number.isFinite(drop.spin));
    lastTick = drop.tick;
    if (!['fud', 'bot'].includes(drop.type)) {
      if (lastReward) assert.ok(Math.abs(drop.x - lastReward.x) <= 256);
      lastReward = drop;
    } else assert.notEqual(drop.x, lastReward.x, 'paired hazard leaves the reward lane open');
  }
  assert.ok(a.drops.length > 100 && a.drops.length < 200);
  a.drops[0].x = -1;
  assert.deepEqual(daily.course('2026-10-07'), b, 'callers cannot mutate a cached course');
});

test('invalid dates and corrupt/future-version records cannot enter the record book', () => {
  for (const day of ['2026-02-30', '2026-13-01', 'yesterday', '', null]) {
    assert.equal(daily.validDay(day), false);
    assert.throws(() => daily.course(day), RangeError);
  }
  assert.equal(daily.validDay('2028-02-29'), true);
  assert.deepEqual(daily.sanitize({version: 2, records: [{ day: '2026-10-07', score: 100, attempts: 1 }]}).records, []);
  const data = daily.sanitize({version: 1, records: [null, {}, { day: '2026-10-07', score: Infinity, attempts: 1 }, { day: '2026-10-07', score: -1, attempts: 1 }, { day: '2026-10-07', score: 100, attempts: 0 }]});
  assert.deepEqual(data.records, []);
});

test('only completed result API writes its own key, retains best score, and counts retries', () => {
  const s = storage();
  const first = daily.complete(s, null, '2026-10-07', 9000);
  assert.equal(first.saved, true);
  assert.equal(first.previous, null);
  const second = daily.complete(s, first.data, '2026-10-07', 1000);
  assert.deepEqual(second.result, { day: '2026-10-07', score: 9000, attempts: 2 });
  const third = daily.complete(s, second.data, '2026-10-07', 18000);
  assert.equal(daily.medal(third.result.score), 'Gold');
  assert.equal(s.values.get('emerald-arcade-v3'), 'untouched');
  assert.equal(s.values.get('satoshi-system-save-v1'), 'guest');
  assert.deepEqual([...s.values.keys()], ['emerald-arcade-v3', 'satoshi-system-save-v1', daily.key]);
});

test('medals are earned at exact thresholds and old dates retain separate records', () => {
  assert.deepEqual([0, 2999, 3000, 8999, 9000, 17999, 18000].map(daily.medal), ['Unranked', 'Unranked', 'Bronze', 'Bronze', 'Silver', 'Silver', 'Gold']);
  const s = storage();
  daily.complete(s, null, '2026-10-07', 18000);
  daily.complete(s, null, '2026-10-08', 3000);
  assert.equal(daily.best(daily.read(s), '2026-10-07').score, 18000);
  assert.equal(daily.best(daily.read(s), '2026-10-08').score, 3000);
  assert.equal(daily.best(daily.read(s), '2026-10-09'), null);
});

test('blocked storage preserves tab best and retries without claiming a save', () => {
  const s = { getItem() { throw Error('blocked'); }, setItem() { throw Error('full'); } };
  assert.deepEqual(daily.read(s).records, []);
  const first = daily.complete(s, null, '2026-10-07', 9000);
  const second = daily.complete(s, first.data, '2026-10-07', 3000);
  assert.equal(first.saved, false);
  assert.equal(second.saved, false);
  assert.equal(second.result.score, 9000);
  assert.equal(second.result.attempts, 2);
});

test('completion merges a newer tab best and bounds the record archive', () => {
  const s = storage();
  const old = daily.complete(s, null, '2026-10-07', 3000).data;
  daily.complete(s, null, '2026-10-07', 18000);
  assert.equal(daily.complete(s, old, '2026-10-07', 9000).result.score, 18000);
  const records = Array.from({length: 100}, (_, i) => ({day: daily.dayKey(new Date(Date.UTC(2026, 0, i + 1))), score: i, attempts: 1}));
  const archive = daily.sanitize({version: 1, records});
  assert.equal(archive.records.length, 90);
  assert.equal(archive.records[0].day, '2026-04-10');
  assert.equal(archive.records[89].day, '2026-01-11');
});
