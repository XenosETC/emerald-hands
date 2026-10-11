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
      focus() { document.activeElement = this; }, scrollIntoView() {},
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
  let source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  if (file === 'pepe-tower-defense.js') source = source.replace(/\}\)\(\);\s*$/, 'window.__towerRead = expression => eval(expression); })();');
  read(source);
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
    if (file === 'pepe-space-unchained.js') g.read('endGame()');
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


test('Space Unchained does not miss a boss milestone when kills skip sixteen', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('state.kills = 17; spawnEnemy()');
  assert.equal(g.read('state.wave'), 2);
  assert.equal(g.read('state.nextBossKills'), 32);
  g.read('state.kills = 33; spawnEnemy()');
  assert.equal(g.read('state.wave'), 2, 'only one live boss');
  g.read('killEnemy(state.boss); spawnEnemy()');
  assert.equal(g.read('state.wave'), 3);
});

test('Space Unchained stops collision and pickup phases on fatal damage', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('player.shield = 1; enemyBullets.push({x:player.x+30,y:player.y,vx:0,vy:0,life:1}); shards.push({x:player.x,y:player.y,vx:0,spin:0}); update(0)');
  assert.equal(g.read('player.shield'), 0);
  assert.equal(g.read('state.shards'), 0);
  assert.equal(g.read('state.mode'), 'gameover');
  const score = g.records[0][1].score;
  g.read('endGame(); damagePlayer(100)');
  assert.equal(g.records.length, 1);
  assert.equal(g.read('state.score'), score);
});

test('Space Unchained guards burst resources, pause and setup, and clears flight input', () => {
  const g = game('pepe-space-unchained.js');
  g.read('state.shards = 10; burstShot()');
  assert.equal(g.read('bullets.length'), 0);
  g.start(); g.start(); assert.equal(g.sessions.length, 1);
  g.read('state.shards = 10; keys.add("KeyW"); player.vy = -100; window.EmeraldArcade.isPaused = () => true; burstShot(); window.emit("emeraldarcade:pause")');
  assert.equal(g.read('state.shards'), 10);
  assert.equal(g.read('keys.size'), 0);
  assert.equal(g.read('player.vy'), 0);
  g.read('window.EmeraldArcade.isPaused = () => false; burstShot(); burstShot()');
  assert.equal(g.read('state.shards'), 5);
  assert.equal(g.read('bullets.length'), 5);
});

test('Space Unchained records once with blocked storage and stale result callbacks stay out of replay', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('localStorage.setItem = () => { throw new Error("blocked"); }; state.score=6200; endGame()');
  const result = g.timers[0]; result();
  assert.equal(g.nodes.get('#overlayTitle').textContent, 'Emerald Wing Flight');
  assert.equal(g.read('state.best'), 6200);
  g.start(); g.nodes.get('#overlayTitle').textContent = 'new flight'; result();
  assert.equal(g.nodes.get('#overlayTitle').textContent, 'new flight');
  assert.equal(g.records.length, 1);
});


test('Space Unchained touch steering owns one pointer and never spends burst shards', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('canvas.getBoundingClientRect = () => ({left:0,top:0,width:1280,height:720}); state.shards = 10');
  const canvas = g.nodes.get('#gameCanvas');
  canvas.emit('pointerdown', {pointerId:1,pointerType:'touch',clientX:400,clientY:500,button:0});
  assert.equal(g.read('player.x'), 400);
  assert.equal(g.read('player.y'), 500);
  assert.equal(g.read('state.shards'), 10);
  canvas.emit('pointerdown', {pointerId:2,pointerType:'touch',clientX:100,clientY:100,button:0});
  canvas.emit('pointermove', {pointerId:2,pointerType:'touch',clientX:100,clientY:100});
  assert.equal(g.read('player.x'), 400);
  canvas.emit('pointercancel', {pointerId:1});
  canvas.emit('pointermove', {pointerId:1,pointerType:'touch',clientX:600,clientY:200});
  assert.equal(g.read('player.x'), 400);
  g.nodes.get('#burstButton').emit('click');
  assert.equal(g.read('state.shards'), 5);
  assert.equal(g.read('bullets.length'), 5);
});

test('Space Unchained fatal hull collision cannot award a kill or collect a shard afterward', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('player.shield=1; enemies.push({x:player.x+28,y:player.y,hp:1,maxHp:1,speed:0,amp:0,t:0,shoot:10,boss:false}); bullets.push({x:player.x+28,y:player.y,vx:0,vy:0,damage:1,life:1}); shards.push({x:player.x,y:player.y,vx:0,spin:0}); update(0)');
  assert.equal(g.read('state.mode'), 'gameover');
  assert.equal(g.read('state.kills'), 0);
  assert.equal(g.read('state.shards'), 0);
  assert.equal(g.records.length, 1);
});


test('Space Unchained keyboard motion is consistent at 30, 60 and 120 Hz', () => {
  const positions = [];
  for (const hz of [30, 60, 120]) {
    const g = game('pepe-space-unchained.js'); g.start();
    g.read('keys.add("KeyD"); keys.add("KeyS")');
    g.read(`for(let i=0;i<${hz};i++) update(1/${hz})`);
    positions.push([g.read('player.x'), g.read('player.y'), g.read('player.vx')]);
  }
  for (const position of positions) for (let axis=0;axis<3;axis++) assert.ok(Math.abs(position[axis] - positions[0][axis]) < .00001);
});

test('Space Unchained banking records the actual earned flight once and replay clears it', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('update(.03)');
  const score = Math.floor(g.read('state.score'));
  g.nodes.get('#finishButton').emit('click');
  g.nodes.get('#finishButton').emit('click');
  assert.equal(g.records.length, 1);
  assert.equal(g.records[0][1].score, score);
  g.timers[0](); assert.match(g.nodes.get('#overlayText').textContent, /Flight banked/);
  g.start(); assert.equal(g.read('state.score'), 0);
});

test('Space Unchained defeats a vault core through projectiles and continues to the next milestone', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('state.kills = 16; spawnEnemy(); state.boss.x = 1000; state.boss.y = 360');
  const hp = g.read('state.boss.hp');
  g.read(`for (let i=0;i<${hp};i++) { bullets.push({x:1000,y:360,vx:0,vy:0,life:1,damage:1}); updateEnemies(0); }`);
  assert.equal(g.read('state.boss'), null);
  assert.equal(g.read('state.kills'), 17);
  assert.equal(g.read('state.shards'), 10);
  assert.equal(g.read('state.score'), 2300);
  assert.equal(g.read('state.nextBossKills'), 32);
  g.read('state.kills = 32; spawnEnemy()');
  assert.equal(g.read('state.wave'), 3);
  assert.equal(g.read('state.boss.maxHp'), 44);
});


test('Space Unchained clears six projectile-damaged vault nodes and banks Chainbreaker Ace', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  // Seed kill checkpoints, not victories. Every core takes its real full HP
  // through the shipped projectile collision path; late-game aim is synthetic.
  for (let node = 1; node <= 6; node++) {
    g.read('state.kills = state.nextBossKills; spawnEnemy(); state.boss.x = 1000; state.boss.y = 360; updateHud()');
    assert.equal(g.nodes.get('#coreHealth').hidden, false);
    const hp = g.read('state.boss.maxHp');
    assert.equal(g.nodes.get('#coreHealth').value, hp);
    g.read(`for(let hit=0;hit<${hp};hit++) { bullets.push({x:1000,y:360,vx:0,vy:0,damage:1,life:1}); updateEnemies(0); } updateHud()`);
    assert.equal(g.read('state.nodesCleared'), node);
    assert.equal(g.nodes.get('#coreHealth').hidden, true);
  }
  assert.equal(g.read('state.wave'), 7);
  assert.equal(g.nodes.get('#rankProgress').value, 1);
  g.nodes.get('#finishButton').emit('click'); g.timers[0]();
  assert.equal(g.records[0][1].rank, 'Chainbreaker Ace');
  assert.equal(g.records[0][1].nodesCleared, 6);
  assert.match(g.nodes.get('#overlayText').textContent, /6 vault nodes cleared/);
  g.start(); assert.equal(g.read('state.nodesCleared'), 0);
  assert.equal(g.nodes.get('#rankProgress').value, 0);
});


test('Space Unchained shot warnings precede fire without consuming the shot timer', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('enemies.push({x:1000,y:360,hp:3,maxHp:3,speed:0,amp:0,t:0,shoot:.28,boss:false})');
  assert.equal(g.read('shotWarning(enemies[0])'), true);
  g.read('drawEnemies()');
  assert.equal(g.read('enemies[0].shoot'), .28);
  assert.equal(g.read('enemyBullets.length'), 0);
  assert.ok(g.drawingCalls.some(call => call.method === 'lineTo' && call.args[0] === 190 && call.args[1] === 360));
  g.read('updateEnemies(.28)');
  assert.equal(g.read('enemyBullets.length'), 1);
  assert.equal(g.read('shotWarning(enemies[0])'), false);
  g.read('enemies[0].shoot=.1; enemies[0].x=1400');
  assert.equal(g.read('shotWarning(enemies[0])'), false);
});

test('Space Unchained keeps critical-shield warning visible during a vault fight', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('state.kills=16; spawnEnemy(); player.shield=30; updateHud()');
  assert.match(g.nodes.get('#missionLabel').textContent, /Shield critical.*vault node/);
  assert.match(g.nodes.get('#missionMeta').textContent, /Core 39/);
});


test('Space Unchained flight reports count actual shot and hull damage and reset on replay', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('damagePlayer(10,"shot"); player.invuln=0; damagePlayer(18,"hull"); state.shards=10; burstShot(); burstShot(); state.elapsed=65; endGame("bank")');
  g.timers[0]();
  assert.match(g.nodes.get('#flightReport').textContent, /1:05 flown.*1 enemy-shot hits.*1 hull collisions.*1 bursts used/);
  assert.match(g.nodes.get('#flightReport').textContent, /Leave more space/);
  assert.equal(g.read('state.burstsUsed'), 1);
  g.start(); assert.equal(g.read('state.shotHits'), 0);
  assert.equal(g.read('state.hullDamage'), 0);
  assert.equal(g.nodes.get('#flightReport').textContent, '');
});

test('Space Unchained reports only shield actually lost on fatal shots', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('player.shield=3; damagePlayer(10,"shot"); damagePlayer(10,"shot")');
  assert.equal(g.read('state.shotDamage'), 3);
  assert.equal(g.read('state.shotHits'), 1);
  g.timers[0](); assert.match(g.nodes.get('#flightReport').textContent, /dashed aim warnings/);
});


test('Space Unchained all five burst projectiles damage a surviving core in one collision pass', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('player.x=600; state.kills=16; spawnEnemy(); state.boss.x=1000; state.boss.y=360; state.boss.shoot=10; state.shards=5; burstShot(); for(let i=0;i<31;i++) updateBullets(.01); updateEnemies(0)');
  assert.equal(g.read('state.boss.hp'), 29, 'five connecting projectiles each deal their existing two damage');
  assert.equal(g.read('bullets.length'), 0);
  assert.equal(g.read('state.shards'), 0);
  assert.equal(g.read('state.burstsUsed'), 1);
});

test('Space Unchained a lethal volley rewards one core and preserves the neighboring enemy', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('player.x=600; state.kills=16; spawnEnemy(); state.boss.x=1000; state.boss.y=360; state.boss.hp=1; state.boss.shoot=10; enemies.unshift({x:1150,y:100,hp:3,maxHp:3,speed:0,amp:0,t:0,shoot:10,boss:false}); state.shards=5; burstShot(); for(let i=0;i<31;i++) updateBullets(.01); updateEnemies(0)');
  assert.equal(g.read('state.nodesCleared'), 1);
  assert.equal(g.read('state.kills'), 17);
  assert.equal(g.read('state.score'), 2300);
  assert.equal(g.read('enemies.length'), 1);
  assert.equal(g.read('enemies[0].hp'), 3);
  assert.equal(g.read('bullets.length'), 4, 'unspent projectiles continue flying');
});


test('Space Unchained Burst returns focus to flight controls for immediate keyboard steering', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  const button = g.nodes.get('#burstButton');
  button.focus();
  g.read('state.shards = 5'); button.emit('click');
  assert.equal(g.read('document.activeElement === canvas'), true);
  assert.equal(g.read('state.burstsUsed'), 1);
  assert.equal(g.read('state.shards'), 0);
});


test('Space Unchained expired enemy shots cannot damage the fighter', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('enemyBullets.push({x:player.x+30,y:player.y,vx:0,vy:0,life:.01}); updateBullets(.02)');
  assert.equal(g.read('player.shield'), 100);
  assert.equal(g.read('state.shotHits'), 0);
  assert.equal(g.read('enemyBullets.length'), 0);
});

test('Space Unchained enemy fire timers start on screen and stop after departure', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('enemies.push({x:1400,y:100,hp:3,maxHp:3,speed:0,amp:0,t:0,shoot:.28,boss:false}); updateEnemies(.3)');
  assert.equal(g.read('enemies[0].shoot'), .28);
  assert.equal(g.read('enemyBullets.length'), 0);
  g.read('enemies[0].x=1000; updateEnemies(.28)');
  assert.equal(g.read('enemyBullets.length'), 1);
  g.read('enemyBullets.length=0; enemies[0].x=-100; enemies[0].shoot=.01; updateEnemies(.02)');
  assert.equal(g.read('enemyBullets.length'), 0);
});


test('Space Unchained repairs trade flight shards for capped shield and respect cooldown', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('player.shield=90; state.shards=30; repairShield(); repairShield()');
  assert.equal(g.read('player.shield'), 100);
  assert.equal(g.read('state.shards'), 20);
  assert.equal(g.read('state.repairsUsed'), 1);
  g.read('player.shield=50; repairShield()'); assert.equal(g.read('player.shield'), 50);
  g.read('player.repairClock=0; window.EmeraldArcade.isPaused=()=>true; repairShield()');
  assert.equal(g.read('state.shards'), 20);
  g.read('window.EmeraldArcade.isPaused=()=>false');
  g.nodes.get('#repairButton').emit('click');
  assert.equal(g.read('player.shield'), 75);
  assert.equal(g.read('state.shards'), 10);
  assert.equal(g.read('document.activeElement===canvas'), true);
  g.read('endGame("bank")'); g.start();
  assert.equal(g.read('state.repairsUsed'), 0);
  assert.equal(g.read('player.repairClock'), 0);
});

test('Space Unchained cannot repair a lost flight or buy a repair without enough shards', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('player.shield=50; state.shards=9; repairShield()');
  assert.equal(g.read('player.shield'), 50);
  g.read('state.shards=20; damagePlayer(100); repairShield()');
  assert.equal(g.read('player.shield'), 0);
  assert.equal(g.read('state.shards'), 20);
  assert.equal(g.read('state.repairsUsed'), 0);
});


test('Space Unchained E repairs once and ignores repeat, paused and focused-control keys', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  g.read('player.shield=25; state.shards=40; window.emit("keydown",{code:"KeyE",target:canvas})');
  assert.equal(g.read('player.shield'), 50);
  assert.equal(g.read('state.shards'), 30);
  g.read('player.repairClock=0; window.emit("keydown",{code:"KeyE",repeat:true,target:canvas})');
  assert.equal(g.read('state.repairsUsed'), 1);
  g.read('window.EmeraldArcade.isPaused=()=>true; window.emit("keydown",{code:"KeyE",target:canvas})');
  assert.equal(g.read('state.repairsUsed'), 1);
  g.read('window.EmeraldArcade.isPaused=()=>false; window.emit("keydown",{code:"KeyE",target:{closest:()=>true}})');
  assert.equal(g.read('state.repairsUsed'), 1);
});

test('Space Unchained repair cooldown expires through actual simulation updates', () => {
  const g = game('pepe-space-unchained.js'); g.start();
  // Isolate the cooldown from enemy damage; use the real update path.
  g.read('state.spawnClock=1000; player.shield=50; state.shards=30; repairShield(); for(let i=0;i<240;i++) update(1/30)');
  assert.ok(g.read('player.repairClock') < .000001);
  // One further frame removes floating-point remainder, enabling the UI.
  g.read('update(1/30)');
  assert.equal(g.nodes.get('#repairButton').disabled, false);
  g.nodes.get('#repairButton').emit('click');
  assert.equal(g.read('player.shield'), 100);
  assert.equal(g.read('state.shards'), 10);
  assert.equal(g.read('state.repairsUsed'), 2);
});


test('Tower Defense fatal breach stops the update and records zero cleared waves once', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  g.read(`window.__towerRead('state.vault=1; enemies.length=0; enemies.push({x:1325,y:404,pathIndex:9,speed:60,slowTimer:0,hitFlash:0,spin:0,kind:"boss"}); update(.01); endGame("duplicate")')`);
  assert.equal(g.read('window.__towerRead("state.vault")'), 0);
  assert.equal(g.records.length, 1);
  assert.equal(g.records[0][1].wave, 0);
});

test('Tower Defense paused placement and wave requests cannot spend shards', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  g.read('window.EmeraldArcade.isPaused=()=>true');
  g.read('window.__towerRead("buildOrUpgrade(pads[0]); startWave()")');
  assert.equal(g.read('window.__towerRead("state.shards")'), 180);
  assert.equal(g.read('window.__towerRead("towers.length")'), 0);
});

test('Tower Defense mastery write failure cannot interrupt placement or results', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  g.read('localStorage.setItem=()=>{throw new Error("blocked")}; window.__towerRead("buildOrUpgrade(pads[0]); state.score=100; endGame()")');
  assert.equal(g.read('window.__towerRead("state.shards")'), 105);
  assert.equal(g.read('window.__towerRead("towers.length")'), 1);
  assert.equal(g.records.length, 1);
});
