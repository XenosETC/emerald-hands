const { test } = require('node:test');
const assert = require('node:assert/strict');
const ghost = require('../shard-rush-ghost.js');
const day = '2026-10-08';
const fixture = () => ({ version: 1, courseVersion: 1, day, score: 9000,
  samples: Array.from({length: 1201}, (_, i) => [i ? 900 : 640, i ? 9000 : 0]) });

test('capture produces a bounded complete trace on simulation ticks, ignoring duplicate or skipped samples', () => {
  const points = [];
  for (let tick = 0; tick <= 7300; tick++) {
    ghost.capture(points, tick, tick ? 800.4 : 640, tick ? 9000 : 0);
    ghost.capture(points, tick, 1100, 0);
  }
  assert.equal(points.length, 1201);
  assert.deepEqual(points[0], [640, 0]);
  assert.deepEqual(points.at(-1), [800, 9000]);
  assert.ok(ghost.sanitize({...fixture(), samples: points}));
  const skipped = [];
  ghost.capture(skipped, 6, 640, 0);
  assert.equal(skipped.length, 0, 'an incomplete trace cannot silently shift its timing');
});

test('invalid dates, versions, ranges, partial traces and inconsistent final scores are rejected', () => {
  const mutations = [g => g.day = '2026-02-30', g => g.version = 2, g => g.courseVersion = 2,
    g => g.score = -1, g => g.score = 1_000_001, g => g.samples.pop(), g => g.samples.push([640, 0]),
    g => g.samples[0] = [800, 0], g => g.samples[0] = [640, 120],
    g => g.samples[10] = [104, 0], g => g.samples[10] = [1176, 0], g => g.samples[10] = [640.5, 0],
    g => g.samples[10] = [640, -1], g => g.samples[10] = [640, Infinity],
    g => g.samples[10] = [640, 1_000_001], g => g.samples[10] = null,
    g => g.samples[1200] = [640, 8999]];
  for (const mutate of mutations) {
    const value = fixture(); mutate(value);
    assert.equal(ghost.sanitize(value), null, String(mutate));
  }
  assert.equal(ghost.sanitize(null), null);
});

test('storage round trip copies valid data and writes only the isolated ghost key', () => {
  const saves = new Map([['shard-rush-daily-v1', 'keep-records'], ['emerald-arcade-v3', 'keep-arcade']]);
  const storage = {getItem: key => saves.get(key), setItem: (key, value) => saves.set(key, value)};
  const value = fixture();
  assert.equal(ghost.write(storage, value), true);
  assert.deepEqual(ghost.read(storage, day, 9000), value);
  const clean = ghost.sanitize(value);
  value.samples[10][0] = 0;
  assert.equal(clean.samples[10][0], 900);
  assert.equal(ghost.write(storage, value), false);
  assert.equal(saves.get('shard-rush-daily-v1'), 'keep-records');
  assert.equal(saves.get('emerald-arcade-v3'), 'keep-arcade');
  assert.ok(saves.get(ghost.key).length < 40_000);
});

test('replays are available only for the matching day, course version and best score', () => {
  const storage = {getItem: () => JSON.stringify(fixture())};
  assert.ok(ghost.read(storage, day, 9000));
  assert.equal(ghost.read(storage, '2026-10-09', 9000), null);
  assert.equal(ghost.read(storage, day, 8999), null);
  assert.equal(ghost.read(storage, day, 9000, 2), null);
});

test('unavailable, corrupt or oversized storage safely yields no ghost', () => {
  for (const value of [null, '{', '{}', ' '.repeat(40_001), JSON.stringify({...fixture(), samples: []})]) {
    assert.equal(ghost.read({getItem: () => value}, day, 9000), null);
  }
  const blocked = {getItem() {throw Error('blocked');}, setItem() {throw Error('blocked');}};
  assert.equal(ghost.read(blocked, day, 9000), null);
  assert.equal(ghost.write(blocked, fixture()), false);
  assert.equal(ghost.read(undefined, day, 9000), null);
  assert.equal(ghost.write(undefined, fixture()), false);
});

test('playback interpolates position while preserving discrete score changes, including hazards', () => {
  const value = fixture();
  value.samples[1] = [700, 120]; value.samples[2] = [760, 0];
  assert.deepEqual(ghost.at(value, 3), {x: 670, score: 0});
  assert.deepEqual(ghost.at(value, 9), {x: 730, score: 120});
  assert.deepEqual(ghost.at(value, 12), {x: 760, score: 0});
  assert.deepEqual(ghost.at(value, -10), {x: 640, score: 0});
  assert.deepEqual(ghost.at(value, 9000), {x: 900, score: 9000});
  assert.deepEqual(ghost.at(value, NaN), {x: 640, score: 0});
  assert.equal(ghost.at(null, 6), null);
});
