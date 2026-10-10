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
    assert.ok(html.includes('arcade-library.js?v=library-2'), game.id);
    assert.ok(html.includes('arcade-visit.js?v=library-2'), game.id);
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
      window: { ArcadeLibrary: lib }, URL, URLSearchParams,
      document: { currentScript: { src: 'https://arcade.example/sub/arcade-visit.js?v=library-2' } },
      location: { pathname: `/sub/${game.path}` },
      localStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) },
    });
    assert.equal(JSON.parse(values.get(lib.key)).recent[0].id, game.id);
    assert.equal(values.size, 1);
  }
});

test('daily mode survives storage and only catalog-approved destinations can be restored', () => {
  const state = lib.visit(null, 'rush', 10, 'daily');
  const restored = lib.sanitize(JSON.parse(JSON.stringify(state)));
  assert.equal(lib.destination(restored.recent[0]), 'shard-rush.html?mode=daily');
  assert.deepEqual(lib.visit(restored, 'rush', 20).recent, [{id: 'rush', at: 20}]);
  assert.equal(lib.destination({id: 'rush', mode: 'https://evil.example'}), 'shard-rush.html');
  assert.equal(lib.destination({id: 'soulWorld', mode: 'daily'}), 'pepe-soul-world/index.html');
  assert.equal(lib.destination({id: 'https://evil.example'}), null);
  assert.deepEqual(lib.sanitize({recent: [{id: 'soulWorld', at: 10, mode: 'practice', path: '//evil.example'}]}).recent, [{id: 'soulWorld', at: 10}]);
});

test('continue shelf orders real visits first, adds known saved games and never fabricates timestamps', () => {
  const history = lib.visit(lib.visit(null, 'soulWorld', 10), 'rush', 20, 'daily');
  const entries = lib.continuations(history, ['soulWorld', 'templeRun', 'templeRun', 'bogus', 'feudalism', 'hands']);
  assert.deepEqual(entries, [{id:'rush',at:20,mode:'daily'}, {id:'soulWorld',at:10}, {id:'templeRun'}, {id:'feudalism'}]);
  assert.equal(lib.continuations(null).length, 0);
  assert.deepEqual(lib.continuations(null, ['feudalism']), [{id: 'feudalism'}]);
  assert.deepEqual(history.recent, [{id:'rush',at:20,mode:'daily'}, {id:'soulWorld',at:10}]);
});

test('real visit hook follows Daily Vault mode changes without saving other query parameters or game data', () => {
  const listeners = new Map(), values = new Map([['shard-rush-daily-v1', 'keep-daily'], ['pepe-soul-world-v1', 'keep-soul']]);
  const location = {pathname: '/arcade/shard-rush.html', search: '?mode=daily&qa=1'};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'arcade-visit.js'), 'utf8'), {
    window: {ArcadeLibrary: lib, addEventListener: (type, handler) => listeners.set(type, handler)}, URL, URLSearchParams,
    document: {currentScript: {src:'https://arcade.example/arcade/arcade-visit.js?v=library-2'}}, location,
    localStorage: {getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value)},
  });
  assert.equal(lib.destination(lib.read({getItem: key => values.get(key)}).recent[0]), 'shard-rush.html?mode=daily');
  location.search = '';
  listeners.get('arcade:modechange')();
  assert.deepEqual(lib.read({getItem: key => values.get(key)}).recent.map(({id,mode}) => [id,mode]), [['rush',undefined]]);
  assert.equal(values.size, 3);
  assert.equal(values.get('shard-rush-daily-v1'), 'keep-daily');
  assert.equal(values.get('pepe-soul-world-v1'), 'keep-soul');
});
