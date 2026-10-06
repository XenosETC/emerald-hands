const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lib = require('../arcade-library.js');
const root = path.resolve(__dirname, '..');

test('every released game has one catalog entry, local page, and visit hook', () => {
  assert.equal(lib.games.length, 16);
  assert.equal(new Set(lib.games.map(game => game.id)).size, 16);
  const hub = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const game of lib.games) {
    assert.ok(hub.includes(`href="${game.path}"`), game.id);
    const html = fs.readFileSync(path.join(root, game.path), 'utf8');
    assert.ok(html.includes('arcade-library.js?v=library-1'), game.id);
    assert.ok(html.includes('arcade-visit.js?v=library-1'), game.id);
  }
});

test('new Pepe games appear in their real genres and touch filter excludes keyboard games', () => {
  assert.deepEqual(lib.select(null, { genre: 'strategy' }).map(game => game.id), ['feudalism', 'towerDefense', 'pepeWars']);
  assert.ok(lib.select(null, { genre: 'adventure' }).some(game => game.id === 'soulWorld'));
  assert.ok(lib.select(null, { genre: 'arcade', touch: true }).some(game => game.id === 'templeRun'));
  assert.ok(!lib.select(null, { touch: true }).some(game => ['rumble', 'paradox', 'feudalism'].includes(game.id)));
});

test('favorites toggle immutably and intersect search, genre and controls', () => {
  const first = lib.toggleFavorite(null, 'templeRun');
  const second = lib.toggleFavorite(first, 'rumble');
  assert.deepEqual(first.favorites, ['templeRun']);
  assert.deepEqual(lib.select(second, { favorites: true, touch: true, query: 'temple pepe', genre: 'adventure' }).map(game => game.id), ['templeRun']);
  assert.deepEqual(lib.toggleFavorite(second, 'rumble'), first);
  assert.deepEqual(lib.toggleFavorite(first, '../../evil'), first);
  assert.equal(lib.select(first, { query: 'no matching game' }).length, 0);
  assert.equal(lib.select(null, { query: 'guardians', descriptions: { soulWorld: 'Defeat their guardians' } })[0].id, 'soulWorld');
});

test('opening history deduplicates, orders, and rejects unknown destinations', () => {
  const first = lib.visit(null, 'soulWorld', 10);
  const second = lib.visit(lib.visit(first, 'satoshiSystem', 20), 'soulWorld', 30);
  assert.deepEqual(second.recent, [{ id: 'soulWorld', at: 30 }, { id: 'satoshiSystem', at: 20 }]);
  assert.deepEqual(first.recent, [{ id: 'soulWorld', at: 10 }]);
  assert.deepEqual(lib.visit(second, 'https://evil.example', 40), second);
  assert.deepEqual(lib.select(second, { sort: 'recent' }).slice(0, 2).map(game => game.id), ['soulWorld', 'satoshiSystem']);
});

test('malformed storage cannot create links or crash browsing', () => {
  for (const raw of ['bad-json', 'null', '{"recent":[null,{}],"favorites":{}}']) {
    assert.deepEqual(lib.read({ getItem: () => raw }), lib.sanitize(null));
  }
  const data = lib.sanitize({ favorites: ['hands', 'hands', '<script>'], recent: [{ id: 'hands', at: Infinity }, { id: 'rush', at: -1 }] });
  assert.deepEqual(data, { version: 1, favorites: ['hands'], recent: [] });
  assert.deepEqual(lib.read(undefined), lib.sanitize(null));
  assert.equal(lib.write({ setItem() { throw Error('quota'); } }, data), false);
});

test('library writes preserve all game saves and currency data byte for byte', () => {
  const saves = new Map([['satoshi-system-save-v1', '{"treasury":123}'], ['emerald-arcade-v1', '{"xp":456}'], ['pepe-soul-world-v1', 'untouched']]);
  const before = new Map(saves);
  const storage = { getItem: key => saves.get(key), setItem: (key, value) => saves.set(key, value) };
  assert.equal(lib.write(storage, lib.visit(lib.toggleFavorite(null, 'hands'), 'satoshiSystem', 100)), true);
  for (const [key, value] of before) assert.equal(saves.get(key), value);
  assert.equal(saves.size, before.size + 1);
  assert.equal(lib.read(storage).recent[0].id, 'satoshiSystem');
});

test('visit hook resolves direct nested game URLs under a hosting prefix', () => {
  const source = fs.readFileSync(path.join(root, 'arcade-visit.js'), 'utf8');
  for (const game of lib.games) {
    const values = new Map();
    vm.runInNewContext(source, {
      window: { ArcadeLibrary: lib }, URL,
      document: { currentScript: { src: 'https://arcade.example/sub/arcade-visit.js?v=library-1' } },
      location: { pathname: `/sub/${game.path}` },
      localStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) },
    });
    assert.equal(JSON.parse(values.get(lib.key)).recent[0].id, game.id);
    assert.equal(values.size, 1);
  }
});
