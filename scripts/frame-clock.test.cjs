const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run each shipped game, its actual start button and scheduled frames. The two
// clocks model shared pause: wall time advances while delivered RAF time does not.
function game(file) {
  let wallTime = 0;
  let nextFrame = 0;
  const frames = new Map();
  const nodes = new Map();
  const drawingCalls = [];
  const sessions = [];
  const records = [];
  const timers = [];
  const saves = new Map();
  function node() {
    const listeners = new Map();
    return {
      textContent: '', hidden: false, style: {}, dataset: {},
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(listener);
      },
      emit(type, details = {}) { for (const listener of listeners.get(type) || []) listener({ target: this, preventDefault() {}, ...details }); },
      setAttribute() {},
      focus() {}, scrollIntoView() {},
    };
  }
  const drawing = new Proxy({
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    measureText: text => ({ width: text.length * 8 }),
  }, {
    get: (object, key) => object[key] ?? ((...args) => drawingCalls.push({ method: key, args })),
    set: (object, key, value) => { object[key] = value; return true; },
  });
  const canvas = Object.assign(node(), { width: 1280, height: 720, getContext: () => drawing });
  nodes.set('#gameCanvas', canvas);
  nodes.set('#galaxyCanvas', canvas);
  const document = Object.assign(node(), {
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, node());
      return nodes.get(selector);
    },
    querySelectorAll: () => [],
  });
  const window = Object.assign(node(), {
    setTimeout(callback) { timers.push(callback); },
    EmeraldArcade: { beginSession: (...args) => sessions.push(args), recordAndNotify: (...args) => records.push(args) },
  });
  const context = vm.createContext({
    document, window, performance: { now: () => wallTime },
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
    Image: class { complete = false; naturalWidth = 0; addEventListener() {} },
    Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
    crypto: { randomUUID: () => 'test-unit' },
    localStorage: { getItem: key => saves.get(key) ?? null, setItem: (key, value) => saves.set(key, String(value)) },
    fetch() { throw new Error('offline test'); },
    AbortSignal: { timeout: () => ({}) },
  });
  const read = expression => vm.runInContext(expression, context);
  read(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
  return {
    read, nodes, sessions, records, timers, drawingCalls,
    start: () => nodes.get('#startButton').emit('click'),
    setWallTime: value => { wallTime = value; },
    pending: () => frames.size,
    frame(timestamp) {
      assert.equal(frames.size, 1, `${file}: exactly one animation chain must be pending`);
      const [id, callback] = frames.entries().next().value;
      frames.delete(id);
      drawingCalls.length = 0;
      callback(timestamp);
    },
  };
}

for (const [file, cap] of [
  ['emerald-galactic-heroes.js', 0.033],
  ['pepecoin-run.js', 0.032],
  ['pepe-space-unchained.js', 0.033],
]) {
  test(`${file}: replay after paused wall time does not rewind progress`, () => {
    const g = game(file);
    g.start();
    g.frame(1000);
    g.frame(1016);
    assert.equal(g.read('state.elapsed'), 0.016);
    g.setWallTime(6016);
    // Galactic Heroes now guards active-flight launch; replay follows results.
    if (file === 'emerald-galactic-heroes.js') g.read('endGame()');
    if (file === 'pepecoin-run.js') g.read('crash({})');
    g.start();
    g.frame(1032);
    assert.equal(g.read('state.elapsed'), 0);
    assert.equal(g.read('state.score'), 0);
    g.frame(1048);
    assert.equal(g.read('state.elapsed'), 0.016);
    const score = g.read('state.score');
    g.frame(1044);
    assert.equal(g.read('state.elapsed'), 0.016);
    assert.equal(g.read('state.score'), score);
    g.frame(2044);
    assert.equal(g.read('state.elapsed'), 0.016 + cap, 'the existing frame cap is preserved');
    assert.equal(g.pending(), 1);
    assert.equal(g.sessions.length, 2);
  });
}

test('Pepe Wars reset preserves starting funds and one animation chain after a pause', () => {
  const g = game('pepe-wars.js');
  assert.equal(g.pending(), 0);
  g.start();
  g.frame(1000);
  g.frame(1016);
  g.setWallTime(6016);
  g.start();
  g.frame(1032);
  assert.equal(g.nodes.get('#shardLabel').textContent, 120);
  assert.equal(g.nodes.get('#timeLabel').textContent, '0:00');
  g.frame(1048);
  g.frame(1044);
  assert.equal(g.nodes.get('#shardLabel').textContent, 120, 'earlier timestamps cannot take income away');
  g.frame(2044);
  assert.equal(g.nodes.get('#shardLabel').textContent, 120, 'a long frame still uses the existing 33ms cap');
  for (let i = 1; i <= 32; i += 1) g.frame(2044 + i * 33);
  assert.equal(g.nodes.get('#timeLabel').textContent, '0:01');
  assert.ok(g.nodes.get('#shardLabel').textContent > 120, 'normal frames still earn income');
  g.start();
  g.start();
  assert.equal(g.pending(), 1, 'repeated resets cancel the previous scheduled frame');
  g.frame(4000);
  assert.equal(g.nodes.get('#shardLabel').textContent, 120);
});

test('Tower Defense replay starts its first enemy at the portal without duplicate loops', () => {
  const g = game('pepe-tower-defense.js');
  // Both the portal and first enemy use this row. The enemy is drawn last.
  const enemyX = () => g.drawingCalls.filter(call => call.method === 'translate' && call.args[1] === 345).at(-1).args[0];
  assert.equal(g.pending(), 0);
  g.start();
  g.frame(1000);
  assert.equal(enemyX(), 34);
  g.frame(1016);
  assert.ok(enemyX() > 34);
  g.setWallTime(6016);
  g.start();
  g.frame(1032);
  assert.equal(enemyX(), 34, 'reset enemy must not move backward during the first frame');
  assert.equal(g.nodes.get('#vaultLabel').textContent, 20);
  assert.equal(g.nodes.get('#shardLabel').textContent, 180);
  g.frame(1048);
  const moved = enemyX();
  assert.ok(moved > 34);
  g.frame(1044);
  assert.equal(enemyX(), moved);
  g.frame(2044);
  assert.ok(enemyX() > moved && enemyX() - moved < 3, 'a long frame keeps the existing movement cap');
  g.start();
  g.start();
  assert.equal(g.pending(), 1);
  g.frame(4000);
  assert.equal(enemyX(), 34);
});


test('Emerald Run appends its course without overlapping the existing horizon', () => {
  const g = game('pepecoin-run.js'); g.start();
  const end = g.read('courseEnd');
  g.read('state.distance = 5000; buildCourse()');
  assert.ok(g.read('hazards.every((h, i) => i === 0 || h.x > hazards[i - 1].x)'));
  assert.ok(g.read('courseEnd') > end);
  g.read('state.distance = 12000; update(0)');
  assert.ok(g.read('hazards.every(h => h.x >= state.distance - 120)'));
});

test('Emerald Run freezes market terrain until the next run and guards duplicate loss', () => {
  const g = game('pepecoin-run.js'); g.start();
  const ground = g.read('terrainAt(245)');
  g.read('applyMarketSeries([1, 100, 1], true, "test tape")');
  assert.equal(g.read('terrainAt(245)'), ground);
  g.start(); assert.equal(g.sessions.length, 1);
  g.read('state.score = 2000; crash({}); state.score = 9000; crash({})');
  assert.equal(g.read('state.best'), 2000);
  g.start(); assert.equal(g.read('terrainIsLive'), true);
});

test('Emerald Run ignores paused jumps and repeat keys', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read('window.EmeraldArcade.isPaused = () => true; action({preventDefault(){}})');
  assert.equal(g.read('player.grounded'), true);
  g.read('window.EmeraldArcade.isPaused = () => false; action({repeat:true})');
  assert.equal(g.read('player.grounded'), true);
  g.read('action({preventDefault(){}})');
  assert.equal(g.read('player.grounded'), false);
});


test('Emerald Run remembers a near-landing tap but never a stale airborne jump', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read('player.grounded = false; player.y = terrainAt(player.x) - player.radius - 1; player.vy = 100; jump(); update(.016)');
  assert.equal(g.read('player.vy'), -690);
  assert.equal(g.read('state.jumpBuffer'), 0);
  g.read('player.y = 0; player.vy = 0; player.grounded = false; jump(); update(.032); update(.032); update(.032); update(.032)');
  assert.equal(g.read('state.jumpBuffer'), 0);
  g.read('player.y = terrainAt(state.distance + player.x) - player.radius; player.vy = 100; update(0)');
  assert.equal(g.read('player.grounded'), true);
});

test('Emerald Run records peak combo even after it expires and exposes rank targets', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read('state.shards = 14; state.combo = 5; collectShard({}, 0, 0); state.comboClock = 0; update(0)');
  assert.equal(g.read('state.combo'), 1);
  assert.equal(g.read('state.peakCombo'), 6);
  assert.match(g.read('nextGoal(1800)'), /Chart Surfer/);
  assert.match(g.read('nextGoal(18000)'), /Ancient Pepe reached/);
  g.read('crash({})');
  assert.equal(g.records[0][1].combo, 6);
  g.start();
  assert.equal(g.read('state.peakCombo'), 1);
});


test('Emerald Run jump button handles pointer and keyboard activation once and clears queued input on pause', () => {
  const g = game('pepecoin-run.js'); g.start();
  const jump = g.nodes.get('#jumpButton');
  jump.emit('pointerdown', { button: 0 });
  assert.equal(g.read('player.vy'), -690);
  jump.emit('click', { detail: 1 });
  assert.equal(g.read('state.jumpBuffer'), 0, 'pointer click must not queue a second jump');
  jump.emit('click', { detail: 0 });
  assert.equal(g.read('state.jumpBuffer'), .12, 'keyboard activation queues near landing');
  g.read('window.EmeraldArcade.isPaused = () => true');
  g.read('window.emit("emeraldarcade:pause")');
  assert.equal(g.read('state.jumpBuffer'), 0);
  assert.equal(jump.disabled, true);
});

test('Emerald Run loses grounded state while dropping onto a lower road', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read('player.y = 0; player.vy = 0; player.grounded = true; update(.016)');
  assert.equal(g.read('player.grounded'), false);
  g.read('jump()');
  assert.ok(g.read('player.vy') > 0, 'a falling coin cannot jump before landing');
});


for (const random of [0, .5]) test(`Emerald Run sustains five minutes of timed jumps at random=${random}`, () => {
  const g = game('pepecoin-run.js');
  g.read('applyMarketSeries([20, 20], false, "flat fixture")');
  g.read(`Math.random = () => ${random}`);
  g.start();
  // Synthetic timing player: it reads the actual next spike, never removes
  // hazards or bypasses collisions. Flat terrain isolates maximum-speed spacing.
  g.read(`for (let tick = 0; tick < 18000 && state.mode === "running"; tick++) {
    const next = hazards.find(h => h.x > state.distance + player.x - 30);
    if (next && player.grounded && next.x - state.distance - player.x < state.speed * .32) jump();
    update(1 / 60);
  }`);
  assert.equal(g.read('state.mode'), 'running', g.read('JSON.stringify({elapsed:state.elapsed, distance:state.distance, speed:state.speed, player, hit:hazards.find(h=>h.hit)})'));
  assert.ok(g.read('state.elapsed') > 299);
  assert.equal(g.read('state.speed'), 570);
  assert.ok(g.read('state.score') >= 18000);
  assert.ok(g.read('hazards.length') < 40);
  assert.ok(g.read('emeralds.length') < 100);
  g.read('crash({})');
  assert.equal(g.records[0][1].rank, 'Ancient Pepe');
});


test('Emerald Run rejects corrupt market tapes and copies accepted data', () => {
  const g = game('pepecoin-run.js');
  const ground = g.read('terrainAt(245)');
  for (const tape of ['[]', '[1, null]', '[1, NaN]', '[0, 1]', '[1, -1]', '[1, "2"]']) {
    assert.equal(g.read(`applyMarketSeries(${tape}, true, "corrupt")`), false);
    assert.equal(g.read('terrainAt(245)'), ground);
  }
  g.read('var tape = [10, 20, 15]; applyMarketSeries(tape, true, "fixture"); tape[0] = NaN');
  assert.ok(Number.isFinite(g.read('terrainAt(245)')));
});

test('Emerald Run stale result and hint timers cannot affect a new run', () => {
  const g = game('pepecoin-run.js'); g.start();
  const oldHint = g.timers[0];
  g.read('state.score = 2000; crash({})');
  const oldResult = g.timers[1];
  g.start();
  oldHint(); oldResult();
  assert.equal(g.read('state.mode'), 'running');
  assert.notEqual(g.nodes.get('#overlayTitle').textContent, 'Shard Hopper Run');
  assert.equal(g.records.length, 1);
});

test('Emerald Run blocked best-score storage does not interrupt result or replay', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read('localStorage.setItem = () => { throw new Error("blocked"); }; state.score = 4500; crash({})');
  g.timers[1]();
  assert.equal(g.nodes.get('#overlayTitle').textContent, 'Chart Surfer Run');
  assert.equal(g.read('state.best'), 4500);
  assert.equal(g.records.length, 1);
  g.start(); assert.equal(g.read('state.best'), 4500);
});
