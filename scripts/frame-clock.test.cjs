const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run each shipped game, its actual start button and scheduled frames. The two
// clocks model shared pause: wall time advances while delivered RAF time does not.
function game(file, options = {}) {
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
      querySelector: selector => document.querySelector(selector),
      querySelectorAll: () => [node(), node()],
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
  nodes.set('#paradoxCanvas', canvas);
  const document = Object.assign(node(), {
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, node());
      return nodes.get(selector);
    },
    querySelectorAll(selector) {
      if(file==='pepes-paradox.js'&&selector==='[data-paradox-control]')return ['left','right','shift','dash','jump'].map(action=>{
        const id='paradox-control:'+action;if(!nodes.has(id)){const item=node();item.dataset.paradoxControl=action;nodes.set(id,item);}return nodes.get(id);
      });
      if (file !== 'pepe-tower-defense.js') return [];
      const entries = selector === '[data-pad]' ? Array.from({length:9},(_,i)=>['pad',String(i)]) : selector === '[data-upgrade-path]' ? [['upgradePath','power'],['upgradePath','special'],['upgradePath','utility']] : selector === '[data-command-tab]' ? ['build','manage','intel'].map(view=>['commandTab',view]) : selector === '.tower-button' ? ['pepe','shard','relic','mage','archer'].map(type=>['tower',type]) : [];
      return entries.map(([key,value])=>{const id=`${key}:${value}`;if(!nodes.has(id)){const item=node();item.dataset[key]=value;nodes.set(id,item);}return nodes.get(id);});
    },
  });
  const window = Object.assign(node(), {
    setTimeout(callback) { timers.push(callback); },
    EmeraldArcade: { beginSession: (...args) => sessions.push(args), recordAndNotify: (...args) => records.push(args) },
  });
  if (file === 'pepecoin-run.js') window.matchMedia = () => ({ matches: Boolean(options.calm), addEventListener() {} });
  const context = vm.createContext({
    addEventListener: window.addEventListener.bind(window), setTimeout: window.setTimeout,
    URLSearchParams, location: {search: ""},
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
  if (file === 'pepecoin-run.js') {
    read(fs.readFileSync(path.join(__dirname, '..', 'pepecoin-route.js'), 'utf8'));
    read(fs.readFileSync(path.join(__dirname, '..', 'pepecoin-royal.js'), 'utf8'));
    read(fs.readFileSync(path.join(__dirname, '..', 'pepecoin-weather.js'), 'utf8'));
    read(fs.readFileSync(path.join(__dirname, '..', 'pepecoin-rush.js'), 'utf8'));
    read(fs.readFileSync(path.join(__dirname, '..', 'pepecoin-act-two.js'), 'utf8'));
  }
  if (file === 'pepe-tower-defense.js') source = source.replace(/\}\)\(\);\s*$/, 'window.__towerRead = expression => eval(expression); })();');
  if (file === 'pepe-wars.js') source = source.replace(/\}\)\(\);\s*$/, 'window.__warsRead = expression => eval(expression); })();');
  if (file === 'pepes-paradox.js') source = source.replace(/\}\)\(\);\s*$/, 'window.__paradoxRead = expression => eval(expression); })();');
  if(file==='pepe-tower-defense.js') {
    read(fs.readFileSync(path.join(__dirname,'..','pepe-tower-maps.js'),'utf8'));
    read(fs.readFileSync(path.join(__dirname,'..','pepe-tower-checkpoint.js'),'utf8'));
  }
  read(source);
  // These established clock/combat fixtures preserve the legacy saved-run geometry.
  if(file==='pepe-tower-defense.js')read('window.__towerRead("applyMap(mapCatalog.legacy);refreshMapMenu();updateHud();draw()")');
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
  g.read('window.__towerRead("resetGame()")');
  g.nodes.get('#waveButton').emit('click');
  g.frame(1000);
  assert.equal(enemyX(), 34);
  g.frame(1016);
  assert.ok(enemyX() > 34);
  g.setWallTime(6016);
  g.read('window.__towerRead("resetGame()")');
  g.nodes.get('#waveButton').emit('click');
  g.frame(1032);
  assert.equal(enemyX(), 34, 'reset enemy must not move backward during the first frame');
  assert.equal(g.nodes.get('#vaultLabel').textContent, 100);
  assert.equal(g.nodes.get('#shardLabel').textContent, 180);
  g.frame(1048);
  const moved = enemyX();
  assert.ok(moved > 34);
  g.frame(1044);
  assert.equal(enemyX(), moved);
  g.frame(2044);
  assert.ok(enemyX() > moved && enemyX() - moved < 3, 'a long frame keeps the existing movement cap');
  g.read('window.__towerRead("resetGame()")');
  g.nodes.get('#waveButton').emit('click');
  g.read('window.__towerRead("resetGame()")');
  g.nodes.get('#waveButton').emit('click');
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
  assert.ok(g.read('state.speed >= 570 && state.speed <= 769.5'), 'base cap plus at most the statue boost');
  assert.ok(g.read('state.score') >= 18000);
  assert.ok(g.read('hazards.length') < 40);
  assert.ok(g.read('emeralds.length') < 100);
  g.read('crash({})');
  assert.equal(g.records[0][1].rank, 'Ancient Pepe');
});


test('Emerald Run gold statue boosts speed, shatters a spike once, then restores danger after protected slowdown', () => {
  const g = game('pepecoin-run.js');
  g.read('applyMarketSeries([20,20], false, "flat fixture")');
  g.start();
  g.read('hazards.length=0; emeralds.length=0; statues.length=0; statues.push({x:245,collected:false}); update(.016)');
  assert.equal(g.read('statues[0].collected'), true);
  assert.equal(g.read('state.cosmicTime'), 8);
  g.read('hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false}); update(.016)');
  assert.equal(g.read('state.mode'), 'running');
  assert.equal(g.read('state.smashed'), 1);
  assert.ok(g.read('state.speed > 310 * 1.3'));
  g.read('update(.016)');
  assert.equal(g.read('state.smashed'), 1, 'same broken spike never counts twice');
  g.read('state.cosmicTime=.01; update(.02); hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false}); update(.016)');
  assert.equal(g.read('state.mode'), 'running');
  assert.equal(g.read('state.smashed'), 2, 'shield covers deceleration');
  g.read('for(let i=0;i<60;i++)update(1/60)');
  assert.equal(g.read('state.boost'), 0);
  assert.ok(g.read('state.speed < 330'));
  g.read('hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false}); update(.016)');
  assert.equal(g.read('state.mode'), 'gameover', 'normal hazard lethality returns');
  g.start();
  assert.equal(g.read('state.cosmicTime + state.boost + state.smashed'), 0, 'replay clears power and count');
});

test('Emerald Run cosmic duration refreshes without stacking and freezes while paused', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read('collectStatue({collected:false},245,400); state.cosmicTime=4; collectStatue({collected:false},245,400)');
  assert.equal(g.read('state.cosmicTime'), 8);
  g.read('window.EmeraldArcade.isPaused=()=>true; update(.5)');
  assert.equal(g.read('state.cosmicTime'), 8);
  g.read('window.EmeraldArcade.isPaused=()=>false; hazards.length=0; update(.5)');
  assert.equal(g.read('state.cosmicTime'), 7.5);
});

test('Emerald Run keeps statue approaches clear and late-run collections bounded', () => {
  const g = game('pepecoin-run.js'); g.start();
  assert.ok(g.read('statues.length > 0 && statues.every(s=>hazards.every(h=>Math.abs(h.x-s.x)>=210))'));
  g.read('state.distance=20000; hazards.length=0; emeralds.length=0; player.y=0; update(.016)');
  assert.ok(g.read('statues.every(s=>s.x>=state.distance-120)'));
  assert.ok(g.read('statues.length<=3'));
});

test('Emerald Run keeps the lethal spike visible while crash effects settle without advancing the run', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read('hazards.length=0; emeralds.length=0; statues.length=0; hazards.push({x:245,width:50,height:70,hit:false}); corruptImage.complete=true; corruptImage.naturalWidth=156; crash(hazards[0]); drawObjects()');
  assert.ok(g.drawingCalls.some(c=>c.method==='drawImage' && c.args[0].src.endsWith('corrupt-shard-v1.webp')), 'fatal crystal remains visible');
  const distance = g.read('state.distance');
  const count = g.read('particles.length');
  g.read('window.EmeraldArcade.isPaused=()=>true; update(.5)');
  assert.equal(g.read('particles.length'), count, 'paused effects freeze too');
  g.read('window.EmeraldArcade.isPaused=()=>false; for(let i=0;i<60;i++)update(1/60)');
  assert.equal(g.read('particles.length'), 0);
  assert.equal(g.read('state.shake'), 0);
  assert.equal(g.read('state.distance'), distance);
  assert.equal(g.records.length, 1);
});

test('Emerald Run signals an approaching statue and warns once before its shield expires', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read('hazards.length=0; state.distance=500; update(.016)');
  assert.equal(g.nodes.get('#cosmicStatus').hidden, false);
  assert.equal(g.nodes.get('#cosmicTitle').textContent, 'GOLD FROG AHEAD');
  assert.match(g.nodes.get('#powerAnnouncement').textContent, /Gold frog ahead/);
  g.read('collectStatue(statues[0],245,400); state.cosmicTime=2.02; update(.04)');
  assert.equal(g.nodes.get('#cosmicTitle').textContent, 'SHIELD ENDING');
  assert.match(g.nodes.get('#powerAnnouncement').textContent, /Two seconds/);
  g.nodes.get('#powerAnnouncement').textContent = 'not repeated';
  g.read('update(.016)');
  assert.equal(g.nodes.get('#powerAnnouncement').textContent, 'not repeated');
  g.read('smashSpike({hit:false},400,520)');
  assert.ok(g.read('particles.some(p=>p.kind==="crystal")'));
});

test('Emerald Run parabolic event price escalates through phases without changing market data or physics', () => {
  const g = game('pepecoin-run.js');
  g.read('applyMarketSeries([20,30],true,"fixture")'); g.start();
  const market = g.read('marketPrice');
  const terrain = g.read('JSON.stringify(terrainSource)');
  const ground = g.read('terrainAt(2000)');
  g.read('collectStatue({collected:false},245,400)');
  assert.equal(g.read('eventPhase()'), 'COSMIC DISCO');
  g.read('state.cosmicTime=5;updateCosmicEvent()');
  assert.equal(g.read('eventPhase()'), 'PARABOLIC');
  const midPrice = g.read('state.eventPrice');
  g.read('state.cosmicTime=1;updateCosmicEvent()');
  assert.equal(g.read('eventPhase()'), 'BEYOND CANON');
  assert.ok(g.read('state.eventPrice') > midPrice * 4);
  g.read('state.cosmicTime=0;updateCosmicEvent()');
  assert.equal(g.read('state.eventPeak'), market * 40);
  assert.equal(g.read('marketPrice'), market);
  assert.equal(g.read('JSON.stringify(terrainSource)'), terrain);
  assert.equal(g.read('terrainAt(2000)'), ground);
  g.read('crash({})'); g.start();
  assert.equal(g.read('state.eventPrice+state.eventPeak'), 0);
});

test('Emerald Run cosmic synth obeys local/global mute and pause, releases voices and drops missed beats', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read(`const audioEvents=[];
    globalThis.AudioContext=class {
      state='running'; currentTime=0; destination={};
      createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this},disconnect(){}}}
      createOscillator(){return {frequency:{value:0,exponentialRampToValueAtTime(){}},connect(node){return node},start(){audioEvents.push('start')},stop(){audioEvents.push('stop')},disconnect(){}}}
    };
    collectStatue({collected:false},245,400); updateCosmicMusic();`);
  assert.ok(g.read('audioVoices.size') > 0);
  const starts = g.read('audioEvents.filter(e=>e==="start").length');
  g.read('updateCosmicMusic()');
  assert.equal(g.read('audioEvents.filter(e=>e==="start").length'), starts, 'one sequence per beat');
  g.read('setSound(false)');
  assert.equal(g.read('audioVoices.size'), 0);
  g.read('state.cosmicTime=4; updateCosmicMusic()');
  assert.equal(g.read('audioEvents.filter(e=>e==="start").length'), starts);
  g.read('setSound(true); window.EmeraldArcade.isMuted=()=>true; state.cosmicTime=3; updateCosmicMusic()');
  assert.equal(g.read('audioEvents.filter(e=>e==="start").length'), starts);
  g.read('window.EmeraldArcade.isMuted=()=>false; state.cosmicTime=2; updateCosmicMusic()');
  assert.ok(g.read('audioVoices.size') <= 3, 'late frame schedules only current beat');
  g.read('window.EmeraldArcade.isPaused=()=>true; window.emit("emeraldarcade:pause")');
  assert.equal(g.read('audioVoices.size'), 0);
  const beat = g.read('state.cosmicBeat');
  g.read('update(.5)');
  assert.equal(g.read('state.cosmicBeat'), beat);
  g.read('window.EmeraldArcade.isPaused=()=>false; tone(440,.1,"sine"); Array.from(audioVoices).forEach(v=>v.onended())');
  assert.equal(g.read('audioVoices.size'), 0, 'ended voices disconnect and leave registry');
});

test('Emerald Run portrait camera enlarges the field without moving the player or course on rotation', () => {
  const g = game('pepecoin-run.js'); g.start();
  const stage = g.nodes.get('.stage-wrap');
  const snapshot = g.read('JSON.stringify({player,distance:state.distance,hazards,emeralds,statues})');
  stage.clientWidth = 380; stage.clientHeight = 680;
  g.read('fitRunnerView()');
  assert.equal(g.read('canvas.width'), 720);
  assert.equal(g.read('canvas.style.width'), '380px');
  assert.ok(g.read('(player.x-runnerViewOffset())/canvas.width') > .21);
  assert.ok(g.read('(player.x-runnerViewOffset())/canvas.width') < .23);
  stage.clientWidth = 834; stage.clientHeight = 270;
  g.read('fitRunnerView()');
  assert.equal(g.read('canvas.width'), 1280);
  assert.equal(g.read('runnerViewOffset()'), 0);
  assert.equal(g.read('JSON.stringify({player,distance:state.distance,hazards,emeralds,statues})'), snapshot);
});

test('Emerald Run combo meter drains with its existing combo window and resets on replay', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read('hazards.length=0; emeralds.length=0; for(let i=0;i<3;i++)collectShard({collected:false},245,400); updateHud()');
  assert.equal(g.nodes.get('#comboMeter').value, 3.2);
  g.read('update(1)');
  assert.equal(g.read('state.combo'), 2);
  assert.equal(g.nodes.get('#comboMeter').value, 2.2);
  g.read('update(2.3)');
  assert.equal(g.read('state.combo'), 1);
  assert.equal(g.nodes.get('#comboMeter').value, 0);
  g.read('crash({})'); g.start();
  assert.equal(g.nodes.get('#comboMeter').value, 0);
});

for (const spacing of [600, 610]) test(`Emerald Run exit pulse prevents the ${spacing}-unit speed-cap handoff trap without extending immunity`, () => {
  const g = game('pepecoin-run.js');
  g.read('applyMarketSeries([20,20],false,"flat")'); g.start();
  g.read(`hazards.length=0;emeralds.length=0;statues.length=0;state.elapsed=40;state.cosmicTime=.05;state.boost=1;
    hazards.push({x:255,width:50,height:70,hit:false},{x:${255 + spacing},width:50,height:70,hit:false});
    for(let i=0;i<150&&state.mode==='running';i++){
      const next=hazards.find(h=>!h.hit&&h.x>state.distance+player.x-30);
      if(!state.boost&&next&&player.grounded&&next.x-state.distance-player.x<state.speed*.37)jump();
      update(1/60);
    }`);
  assert.equal(g.read('state.mode'), 'running');
  assert.equal(g.read('state.smashed'), 2, 'exit pulse clears only the nearby second spike');
  assert.equal(g.read('state.boost + state.exitPulse'), 0);
  g.read('hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false});update(.016)');
  assert.equal(g.read('state.mode'), 'gameover', 'hazards added after the one-shot exit remain lethal');
});

test('Emerald Run report counts distinct statues, captures the run and clears on replay', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read('const picked={collected:false};collectStatue(picked,245,400);collectStatue(picked,245,400);state.score=1234.8;state.distance=12450;state.peakCombo=6;state.shards=12;state.smashed=8;state.eventPeak=800;crash({})');
  g.timers.at(-1)();
  assert.equal(g.nodes.get('#runResults').hidden, false);
  assert.equal(g.nodes.get('#resultBadge').textContent, 'NEW PERSONAL BEST · TRY 1');
  assert.equal(g.nodes.get('#resultScore').textContent, '1,234');
  assert.equal(g.nodes.get('#resultDistance').textContent, '1,245m');
  assert.equal(g.nodes.get('#resultCombo').textContent, 'x6');
  assert.equal(g.nodes.get('#resultShards').textContent, '12');
  assert.equal(g.nodes.get('#resultSmashes').textContent, '8');
  assert.equal(g.nodes.get('#resultStatues').textContent, '1', 'same statue never counts twice');
  assert.match(g.nodes.get('#resultPeak').textContent, /Simulated event peak: \$800/);
  assert.equal(g.records.length, 1);
  g.start();
  assert.equal(g.nodes.get('#runResults').hidden, true);
  assert.equal(g.read('state.statuesCaught'), 0);
});

test('Emerald Run milestone priority protects shield warnings, expires with game time and changes no rewards', () => {
  const g = game('pepecoin-run.js'); g.start();
  const score = g.read('state.score');
  g.read('showMilestone("SHIELD ENDING",3); showMilestone("COMBO UP",1); updateHud()');
  assert.equal(g.nodes.get('#runGoal').textContent, 'SHIELD ENDING');
  g.read('window.EmeraldArcade.isPaused=()=>true;update(1)');
  assert.equal(g.read('state.noticeTime'), 2.2);
  g.read('window.EmeraldArcade.isPaused=()=>false;updateEffects(3);updateHud()');
  assert.match(g.nodes.get('#runGoal').textContent, /points to/);
  assert.equal(g.read('state.score'), score);
  assert.equal(g.records.length, 0);
  g.read('state.noticeTime=0;hazards.length=0;for(let i=0;i<3;i++)smashSpike({hit:false},400,520);updateHud()');
  assert.match(g.nodes.get('#runGoal').textContent, /CRYSTAL BREAKER/);
});

test('Emerald Run Beyond Canon crossfades its own realm and resets on replay without moving the road', () => {
  const g = game('pepecoin-run.js'); g.start();
  const road = g.read('terrainAt(3000)');
  g.read('hazards.length=0;emeralds.length=0;statues.length=0;collectStatue({collected:false},245,400);state.cosmicTime=2.3;update(.1)');
  assert.ok(g.read('state.beyondBlend') > 0);
  assert.equal(g.read('eventPhase()'), 'BEYOND CANON');
  g.read('beyondImage.complete=true;beyondImage.naturalWidth=1279;beyondImage.naturalHeight=720;drawSky()');
  assert.ok(g.drawingCalls.some(c=>c.method==='drawImage' && c.args[0].src.endsWith('beyond-canon-v1.webp')));
  assert.equal(g.read('terrainAt(3000)'), road);
  g.read('state.cosmicTime=0;state.boost=0;for(let i=0;i<60;i++)update(1/60)');
  assert.ok(g.read('state.beyondBlend') < .01);
  g.read('crash({})');g.start();
  assert.equal(g.read('state.beyondBlend+state.burstSmashes+state.noticeTime'), 0);
});

test('Emerald Run same-road retry reproduces future sections despite effects and different build cadence', () => {
  const g = game('pepecoin-run.js'); g.start();
  const seed = g.read('currentRoad.seed');
  const layout = 'JSON.stringify({hazards:hazards.map(({x,width,height})=>({x,width,height})),emeralds:emeralds.map(({x,lift,size})=>({x,lift,size})),statues:statues.filter(s=>s.x>=state.distance-120).map(s=>s.x),crowns:crowns.filter(c=>c.x>=state.distance-120).map(c=>c.x),rushStatues:rushStatues.filter(s=>s.x>=state.distance-120).map(s=>s.x),courseEnd})';
  g.read('state.distance=20000;buildCourse()');
  const expected = g.read(layout);
  g.read('crash({});startGame({sameRoad:true});for(const at of [5000,9000,14000,20000]){burst(0,0,"#fff",20);state.distance=at;buildCourse()}');
  assert.equal(g.read('currentRoad.seed'), seed);
  assert.equal(g.read('currentRoad.attempt'), 2);
  assert.equal(g.read(layout), expected);
  assert.ok(g.read('statues.every(s=>hazards.every(h=>Math.abs(s.x-h.x)>=210))'));
  assert.ok(g.read('crowns.every(c=>hazards.every(h=>Math.abs(c.x-h.x)>=210))'));
  assert.ok(g.read('[...statues,...crowns,...rushStatues].every(s=>hazards.every(h=>!pickupApproach(h.x,[s.x])))'));
});

test('Emerald Run retry preserves queued and result-screen market updates for the next new road', () => {
  const g = game('pepecoin-run.js'); g.start();
  const tape = g.read('JSON.stringify(terrainSource)');
  const seed = g.read('currentRoad.seed');
  g.read('const laterTape=[8,12,8];applyMarketSeries(laterTape,true,"late");laterTape[1]=999;crash({});startGame({sameRoad:true})');
  assert.equal(g.read('JSON.stringify(terrainSource)'), tape);
  assert.equal(g.read('pendingMarket.prices[1]'), 12, 'queued tape is copied');
  g.read('crash({});startGame()');
  assert.equal(g.read('terrainSource[1]'), 12);
  assert.notEqual(g.read('currentRoad.seed'), seed);
  const nextTape = g.read('JSON.stringify(terrainSource)');
  g.read('applyMarketSeries([4,6,4],true,"queued before loss");crash({});applyMarketSeries([2,3,2],true,"newer result-screen tape");startGame({sameRoad:true})');
  assert.equal(g.read('JSON.stringify(terrainSource)'), nextTape);
  g.read('crash({});startGame()');
  assert.equal(g.read('terrainSource[1]'), 3, 'newest result-screen update supersedes an older queued tape');
});

test('Emerald Run same-road retry clears run state, preserves route best and refuses duplicate starts', () => {
  const g = game('pepecoin-run.js'); g.start();
  g.read('state.score=1234;crash({})');
  g.read('startGame({sameRoad:true})');
  assert.equal(g.read('currentRoad.best'), 1234);
  assert.equal(g.read('state.score+state.smashed+state.statuesCaught+state.cosmicTime'), 0);
  g.read('startGame({sameRoad:true})');
  assert.equal(g.read('currentRoad.attempt'), 2);
  assert.equal(g.sessions.length, 2);
});

test('Emerald Run practice marker tracks farthest distance separately from previous-attempt comparison', () => {
  const g = game('pepecoin-run.js');
  g.read('applyMarketSeries([20,20],false,"flat")');g.start();
  g.read('state.score=100;state.distance=1000;crash({})');g.timers.at(-1)();
  assert.equal(g.nodes.get('#resultCompare').hidden, true);
  g.read('startGame({sameRoad:true});hazards.length=0;state.distance=600;state.noticeTime=0;update(0);drawFarthestMarker()');
  assert.match(g.nodes.get('#runGoal').textContent, /FARTHEST POINT/);
  assert.ok(g.drawingCalls.some(c=>c.method==='fillText'&&c.args[0]==='FARTHEST POINT'));
  const before = g.read('JSON.stringify({player,score:state.score,distance:state.distance})');
  g.read('drawFarthestMarker()');
  assert.equal(g.read('JSON.stringify({player,score:state.score,distance:state.distance})'), before);
  g.read('state.distance=1100;update(0)');
  assert.equal(g.read('state.passedFarthest'), true);
  assert.equal(g.read('currentRoad.farthestDistance'), 1000, 'target stays fixed during the attempt');
  g.read('state.score=180;state.distance=1400;player.grounded=false;player.vy=-30;crash({})');g.timers.at(-1)();
  assert.match(g.nodes.get('#resultCompare').textContent, /\+80 points.*\+40m/);
  assert.match(g.nodes.get('#crashTip').textContent, /earlier/);
  assert.equal(g.read('currentRoad.farthestDistance'), 1400);
  g.read('startGame({sameRoad:true});state.score=50;state.distance=800;crash({})');g.timers.at(-1)();
  assert.match(g.nodes.get('#resultCompare').textContent, /-130 points.*-60m/);
  assert.equal(g.read('currentRoad.farthestDistance'), 1400);
  g.read('startGame()');
  assert.equal(g.read('currentRoad.farthestDistance'), 0);
  assert.equal(g.read('currentRoad.lastResult'), null);
});

test('Emerald Run crash guidance distinguishes shield expiry, rising, falling and grounded impacts', () => {
  const g = game('pepecoin-run.js');g.start();
  assert.match(g.read('crashAdvice()'), /Jump before/);
  g.read('player.grounded=false;player.vy=-50');
  assert.match(g.read('crashAdvice()'), /earlier/);
  g.read('player.vy=50');
  assert.match(g.read('crashAdvice()'), /later/);
  g.read('state.boost=0;state.cosmicBlend=.4');
  assert.match(g.read('crashAdvice()'), /shield had ended/);
  assert.equal(g.read('state.score'), 0);
});

test('Emerald Run crown pickup shields its first frame, floats and supports a soaring tap', () => {
  const g = game('pepecoin-run.js');g.read('applyMarketSeries([20,20],false,"flat")');g.start();
  g.read('hazards.length=0;emeralds.length=0;statues.length=0;crowns.length=0;crowns.push({x:245,collected:false});hazards.push({x:250,width:50,height:70,hit:false});update(.016)');
  assert.equal(g.read('state.mode'), 'running');
  assert.equal(g.read('state.crownsCaught'), 1);
  assert.equal(g.read('hazards[0].destroyed'), true);
  g.read('for(let i=0;i<60;i++)update(1/60)');
  const lift = g.read('state.rideLift');
  assert.ok(lift > 80);
  assert.equal(g.read('player.grounded'), false);
  g.read('jump();update(.2)');
  assert.ok(g.read('state.rideLift') > lift + 10);
  assert.equal(g.nodes.get('#jumpButton').textContent, 'Soar ↑');
});

test('Emerald Run crown attracts emeralds through the normal collection path and lands back in danger', () => {
  const g = game('pepecoin-run.js');g.read('applyMarketSeries([20,20],false,"flat")');g.start();
  g.read('hazards.length=0;emeralds.length=0;statues.length=0;crowns.length=0;collectCrown({collected:false},245,478);update(.6);emeralds.push({x:state.distance+player.x+145,lift:145,size:22,spin:0,collected:false});update(.016)');
  assert.equal(g.read('emeralds[0].attracted'), true);
  g.read('for(let i=0;i<20;i++)update(1/60)');
  assert.equal(g.read('state.shards'), 1);
  assert.equal(g.records.length, 0);
  g.read('for(let i=0;i<420;i++)update(1/60)');
  assert.equal(g.read('royal.active(state)'), false);
  assert.equal(g.read('state.rideLift'), 0);
  assert.equal(g.read('state.boost'), 0);
  assert.equal(g.nodes.get('#jumpButton').textContent, 'Jump ↑');
  g.read('hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false});update(.016)');
  assert.equal(g.read('state.mode'), 'gameover');
});

test('Emerald Run overlapping majestic powers do not multiply speed and freeze/replay safely', () => {
  const g = game('pepecoin-run.js');g.start();
  g.read('hazards.length=0;statues.length=0;crowns.length=0;const crown={collected:false};collectStatue({collected:false},245,400);collectCrown(crown,245,400);collectCrown(crown,245,400);update(.5)');
  assert.equal(g.read('state.crownsCaught'), 1);
  assert.ok(g.read('state.speed') < 430);
  g.read('collectCrown({collected:false},245,400)');
  assert.equal(g.read('state.rideTime'), 6);
  assert.ok(g.read('state.rideAge') >= .5, 'refresh does not drop a flying rider');
  const snapshot = g.read('JSON.stringify({ride:state.rideTime,cosmic:state.cosmicTime,lift:state.rideLift})');
  g.read('window.EmeraldArcade.isPaused=()=>true;update(1)');
  assert.equal(g.read('JSON.stringify({ride:state.rideTime,cosmic:state.cosmicTime,lift:state.rideLift})'), snapshot);
  g.read('window.EmeraldArcade.isPaused=()=>false;crash({});startGame({sameRoad:true})');
  assert.equal(g.read('state.rideTime+state.rideLanding+state.crownsCaught'), 0);
});

test('Emerald Run Royal Skyride has a frame-rate-independent end and a calm-motion path', () => {
  const g = game('pepecoin-run.js');
  g.read('const flightA={},flightB={};royal.reset(flightA);royal.reset(flightB);royal.collect(flightA);royal.collect(flightB);royal.step(flightA,.5,true)');
  assert.equal(g.read('flightA.rideLift'), 110);
  g.read('royal.reset(flightA);royal.collect(flightA);for(let i=0;i<420;i++)royal.step(flightA,1/60);for(let i=0;i<70;i++)royal.step(flightB,.1)');
  assert.equal(g.read('royal.active(flightA)||royal.active(flightB)'), false);
  assert.equal(g.read('flightA.rideLift+flightB.rideLift'), 0);
});

test('Emerald Run optional sky gates award style once and keep the flight trail bounded', () => {
  const g = game('pepecoin-run.js');g.read('applyMarketSeries([20,20],false,"flat")');g.start();
  g.read('collectCrown({collected:false},245,400);state.noticeTime=0;state.rideGates=Array.from({length:3},()=>({x:state.distance+player.x,lift:0}));updateSkyride(.04);updateSkyride(.04)');
  assert.equal(g.read('state.skyGates'), 3);
  assert.equal(g.read('state.score'), 0);
  assert.equal(g.read('state.shards'), 0);
  assert.match(g.read('state.noticeText'), /GRAND TOUR/);
  g.read('for(let i=0;i<200;i++)updateSkyride(.04)');
  assert.ok(g.read('state.rideTrail.length') <= 32);
  assert.equal(g.read('state.skyGates'), 3);
  g.read('crash({});startGame({sameRoad:true})');
  assert.equal(g.read('state.rideTrail.length+state.rideGates.length+state.skyGates'), 0);
});

test('Emerald Run authored route orders pickups, storm and the expandable endless section', () => {
  const g = game('pepecoin-run.js');g.start();
  assert.equal(g.read('route.chapters.map(c=>c.id).join(",")'), 'valley,cosmic,royal,tempest,stormbreak,grove,beyond,lunar,eclipse,corrupt,volcanic,endless');
  assert.ok(g.read('route.chapters.every((c,i)=>!i||c.start>route.chapters[i-1].start)'));
  assert.equal(g.read('statues[0].x'), g.read('route.opening.statue'));
  assert.equal(g.read('crowns[0].x'), g.read('route.opening.crown'));
  g.read('state.distance=12000;buildCourse()');
  assert.equal(g.read('rushStatues[0].x'), g.read('route.opening.rush'));
  assert.ok(g.read('rushStatues.every(s=>hazards.every(h=>Math.abs(s.x-h.x)>=210))'));
  assert.equal(g.read('route.chapterAt(100000).id'), 'endless');
});

test('Emerald Run storm freezes on pause, calms lightning and preserves lethal spikes', () => {
  const g = game('pepecoin-run.js');g.read('applyMarketSeries([20,20],false,"flat")');g.start();
  g.read('hazards.length=0;statues.length=0;crowns.length=0;state.distance=7951-player.x;update(.1)');
  assert.ok(g.read('state.stormGlow') > 0);
  assert.ok(g.read('state.stormBlend') > 0);
  assert.equal(g.read('state.routeId'), 'tempest');
  const frozen = g.read('JSON.stringify([state.stormGlow,state.stormBlend,state.stormDistance])');
  g.read('window.EmeraldArcade.isPaused=()=>true;update(1)');
  assert.equal(g.read('JSON.stringify([state.stormGlow,state.stormBlend,state.stormDistance])'), frozen);
  g.read('weather.step(state,.1,9200,true)');
  assert.equal(g.read('state.stormGlow'), 0);
  g.read('window.EmeraldArcade.isPaused=()=>false;hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false});update(.016)');
  assert.equal(g.read('state.mode'), 'gameover');
  g.read('startGame({sameRoad:true})');
  assert.equal(g.read('state.stormBlend+state.stormGlow'), 0);
});

test('Emerald Run Emerald Rush attracts distant shards without granting spike protection', () => {
  const g = game('pepecoin-run.js');g.read('applyMarketSeries([20,20],false,"flat")');g.start();
  g.read('hazards.length=0;emeralds.length=0;rushStatues.push({x:245,collected:false});emeralds.push({x:player.x+210,lift:120,size:22,spin:0,collected:false});update(.016)');
  assert.equal(g.read('state.rushCaught'), 1);
  assert.equal(g.read('emeralds[0].attracted'), true);
  assert.equal(g.read('protectedRide()'), false);
  assert.equal(g.nodes.get('#cosmicTitle').textContent, 'EMERALD RUSH');
  g.read('for(let i=0;i<25;i++)update(1/60)');
  assert.equal(g.read('state.shards'), 1);
  assert.equal(g.records.length, 0);
  g.read('hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false});update(.016)');
  assert.equal(g.read('state.mode'), 'gameover');
});

test('Emerald Run Rush refreshes once, pauses and expires independently of the other powers', () => {
  const g = game('pepecoin-run.js');g.start();
  g.read('hazards.length=0;const rushPickup={collected:false};collectRush(rushPickup,245,400);collectRush(rushPickup,245,400);update(.5)');
  assert.equal(g.read('state.rushCaught'), 1);
  g.read('window.EmeraldArcade.isPaused=()=>true;update(2)');
  assert.equal(g.read('state.rushTime'), 6.5);
  g.read('window.EmeraldArcade.isPaused=()=>false;collectStatue({collected:false},245,400);collectCrown({collected:false},245,400);state.rushTime=.01;update(.016)');
  assert.equal(g.read('state.rushTime'), 0);
  assert.ok(g.read('state.cosmicTime>0&&state.rideTime>0'));
  assert.ok(g.read('state.speed') <= 570 * 1.35);
  g.read('collectRush({collected:false},245,400);crash({});startGame({sameRoad:true})');
  assert.equal(g.read('state.rushTime+state.rushAge+state.rushCaught'), 0);
});

test('Emerald Run generated aura uses eight bounded animation frames and a steady reduced-motion frame', () => {
  const g = game('pepecoin-run.js');g.start();
  g.read('auraImage.complete=true;auraImage.naturalWidth=1024;state.rushTime=7;state.elapsed=.65;drawPlayer()');
  const call = g.drawingCalls.filter(c => c.method === 'drawImage' && c.args[0].src.endsWith('pepecoin-power-aura-v1.webp')).at(-1);
  assert.deepEqual(call.args.slice(1,5), [512,256,256,256]);
  g.read('reducedMotion.matches=true;state.elapsed=10;royal.step(state,.1,true);drawPlayer()');
  const calm = g.drawingCalls.filter(c => c.method === 'drawImage' && c.args[0].src.endsWith('pepecoin-power-aura-v1.webp')).at(-1);
  assert.deepEqual(calm.args.slice(1,5), [768,0,256,256]);
  assert.equal(g.read('state.rideBank'), 0);
});

test('Emerald Run opening progress completes once, reports its region and resets on replay', () => {
  const g = game('pepecoin-run.js');g.start();
  assert.equal(g.read('route.progressAt(-10)'), 0);
  assert.equal(g.read('route.progressAt(NaN)'), 0);
  assert.equal(g.read('route.progressAt(route.openingEnd/2)'), .5);
  assert.equal(g.read('route.progressAt(route.openingEnd*2)'), 1);
  g.read('hazards.length=0;state.distance=route.openingEnd-player.x;state.noticeTime=0;update(.016)');
  assert.equal(g.read('route.progressAt(state.distance+player.x)'), 1);
  assert.ok(g.nodes.get('#routeProgress').value < .01, 'Act Two begins a new progress bar');
  assert.match(g.read('state.noticeText'), /OPENING ROUTE COMPLETE/);
  g.read('state.noticeTime=0;update(.016)');
  assert.doesNotMatch(g.nodes.get('#runGoal').textContent, /OPENING ROUTE COMPLETE/);
  g.read('crash({})');
  for (const timer of g.timers) timer();
  assert.match(g.nodes.get('#resultRoute').textContent, /Opening route complete/);
  g.read('startGame({sameRoad:true});updateHud()');
  assert.ok(g.nodes.get('#routeProgress').value < .02);
  g.read('state.distance=7900;crash({})');
  for (const timer of g.timers) timer();
  assert.match(g.nodes.get('#resultRoute').textContent, /Tempest Reach/);
});

test('Emerald Run Act Two events fire once, ignore skipped regions and freeze on pause', () => {
  const g = game('pepecoin-run.js');g.start();
  g.read('hazards.length=0;state.distance=route.actTwo.rail-player.x+1;update(.016)');
  assert.equal(g.read('state.railRuns'), 1);
  assert.equal(g.nodes.get('#cosmicTitle').textContent, 'COMET EXPRESS');
  const frozen = g.read('JSON.stringify([state.railTime,state.railAge,state.starrailBlend])');
  g.read('window.EmeraldArcade.isPaused=()=>true;update(2)');
  assert.equal(g.read('JSON.stringify([state.railTime,state.railAge,state.starrailBlend])'), frozen);
  g.read('window.EmeraldArcade.isPaused=()=>false;update(.016)');
  assert.equal(g.read('state.railRuns'), 1);
  g.read('crash({});startGame({sameRoad:true});state.distance=100000;hazards.length=0;update(.016)');
  assert.equal(g.read('state.railRuns+state.eclipseTime'), 0, 'seeking past an event does not launch it in the wrong world');
});

test('Emerald Run Comet vaulting protects through landing and does not multiply speed boosts', () => {
  const g = game('pepecoin-run.js');g.read('applyMarketSeries([20,20],false,"flat")');g.start();
  g.read('state.distance=route.actTwo.rail-player.x+1;buildCourse();hazards.length=0;statues.length=0;crowns.length=0;player.y=terrainAt(state.distance+player.x)-player.radius-100;update(.016)');
  assert.ok(g.read('state.railLift') >= 95, 'boarding retains the current jump height');
  g.read('for(let i=0;i<40;i++)update(1/60)');
  assert.ok(g.read('state.railLift') > 40);
  g.read('jump();update(.25)');
  assert.ok(g.read('state.railLift') > 120);
  assert.equal(g.nodes.get('#jumpButton').textContent, 'Vault ↑');
  g.read('collectStatue({collected:false},245,400);update(.016)');
  assert.ok(g.read('state.speed') <= Math.min(570,g.read('310+state.elapsed*7.2')) * 1.35);
  g.read('state.cosmicTime=0;state.boost=0;state.railTime=.01;hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false});update(.016)');
  assert.equal(g.read('state.mode'), 'running');
  assert.equal(g.read('actTwo.active(state)'), true);
  g.read('hazards.length=0;for(let i=0;i<60;i++)update(1/60)');
  assert.equal(g.read('actTwo.active(state)'), false);
  g.read('hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false});update(.016)');
  assert.equal(g.read('state.mode'), 'gameover');
});

test('Emerald Run lunar jumps keep their gravity across the boundary until landing', () => {
  const g = game('pepecoin-run.js');g.read('applyMarketSeries([20,20],false,"flat")');g.start();
  g.read('hazards.length=0;statues.length=0;crowns.length=0;state.distance=route.actTwo.lunar-player.x+1;player.grounded=true;jump()');
  assert.equal(g.read('player.vy'), -580);
  assert.equal(g.read('state.moonJump'), true);
  g.read('state.distance=route.actTwo.eclipse-player.x+1;player.y=terrainAt(state.distance+player.x)-player.radius-100;update(.01)');
  assert.equal(g.read('player.vy'), -567.5);
  g.read('hazards.length=0;for(let i=0;i<100;i++)update(.016)');
  assert.equal(g.read('state.moonJump'), false);
  g.read('jump()');
  assert.equal(g.read('player.vy'), -690);
});

test('Emerald Run lunar hazard spacing includes takeoff and landing boundaries', () => {
  const g = game('pepecoin-run.js');g.start();g.read('state.distance=30000;buildCourse()');
  assert.ok(g.read('hazards.filter(h=>h.x>=route.actTwo.lunar&&h.x<route.actTwo.eclipse).length') > 2);
  assert.ok(g.read('hazards.every((h,i)=>!i||actTwo.hazardGap(h.x)!==780||h.x-hazards[i-1].x>=780)'));
  assert.equal(g.read('actTwo.hazardGap(route.actTwo.lunar-700)'), 780);
  assert.equal(g.read('actTwo.hazardGap(route.actTwo.eclipse+700)'), 780);
});

test('Emerald Run Emerald Eclipse grants a wider normal-path magnet without shielding', () => {
  const g = game('pepecoin-run.js');g.read('applyMarketSeries([20,20],false,"flat")');g.start();
  g.read('state.distance=route.actTwo.eclipseEvent-player.x+1;buildCourse();hazards.length=0;emeralds.length=0;statues.length=0;crowns.length=0;emeralds.push({x:state.distance+player.x+320,lift:105,size:22,spin:0,collected:false});update(.016)');
  assert.equal(g.read('state.eclipseTime'), 7);
  assert.equal(g.read('emeralds[0].attracted'), true);
  assert.equal(g.read('protectedRide()'), false);
  assert.equal(g.nodes.get('#cosmicTitle').textContent, 'EMERALD ECLIPSE');
  g.read('for(let i=0;i<30;i++)update(1/60)');
  assert.ok(g.read('state.shards') >= 1);
  assert.equal(g.records.length, 0);
  assert.equal(g.read('state.rushCaught'), 1);
});

test('Emerald Run Act Two expiry is frame independent and replay clears every event', () => {
  const g = game('pepecoin-run.js');g.start();
  g.read('const railA={},railB={};actTwo.reset(railA);actTwo.reset(railB);actTwo.step(railA,0,17801);actTwo.step(railB,0,17801);for(let i=0;i<540;i++)actTwo.step(railA,1/60,18000,true);for(let i=0;i<90;i++)actTwo.step(railB,.1,18000,true)');
  assert.equal(g.read('actTwo.active(railA)||actTwo.active(railB)'), false);
  assert.equal(g.read('railA.railLift+railB.railLift'), 0);
  g.read('hazards.length=0;state.distance=route.actTwo.rail-player.x+1;update(.016);crash({});startGame({sameRoad:true})');
  assert.equal(g.read('state.railTime+state.railLanding+state.railRuns+state.eclipseTime+state.starrailBlend+state.lunarBlend+state.cathedralBlend'), 0);
  assert.equal(g.read('state.moonJump'), false);
});

test('Emerald Run cathedral bells require airborne contact and ignore duplicate rings', () => {
  const g=game('pepecoin-run.js');g.read('applyMarketSeries([20,20],false,"flat")');g.start();
  g.read('state.distance=state.bells[0].x-player.x;buildCourse();hazards.length=0;statues.length=0;crowns.length=0;rushStatues.length=0;update(.016)');
  assert.equal(g.read('state.bellsRung'),0,'rolling underneath does not ring an airborne bell');
  g.read('player.y=terrainAt(state.bells[0].x)-state.bells[0].lift;player.grounded=false;player.vy=0;update(.016)');
  assert.equal(g.read('state.bellsRung'),1);
  const before=g.read('state.score');
  g.read('ringCathedralBell(state.bells[0],245,400)');
  assert.equal(g.read('state.bellsRung'),1);
  assert.equal(g.read('state.score'),before);
  assert.equal(g.read('state.slingshots'),0);
});

test('Emerald Run three unique bells awaken Slingshot once without direct rewards', () => {
  const g=game('pepecoin-run.js');g.start();
  g.read('for(const bell of state.bells)ringCathedralBell(bell,245,400)');
  assert.equal(g.read('state.bellsRung'),3);
  assert.equal(g.read('state.slingshots'),1);
  assert.equal(g.read('state.railKind'),'slingshot');
  assert.equal(g.read('state.railTime'),3.6);
  assert.equal(g.read('state.railRuns'),0,'Slingshot is separate from Comet Express statistics');
  assert.equal(g.read('state.score+state.shards'),0);
  assert.equal(g.records.length,0);
  g.read('for(const bell of state.bells)ringCathedralBell(bell,245,400);updateHud()');
  assert.equal(g.read('state.slingshots'),1);
  assert.equal(g.nodes.get('#cosmicTitle').textContent,'ECLIPSE SLINGSHOT');
  assert.equal(g.nodes.get('#jumpButton').textContent,'Surge ↑');
  assert.equal(g.nodes.get('#cosmicMeter').max,3.6);
});

test('Emerald Run missed bells cannot grant Slingshot or block Act Two completion', () => {
  const g=game('pepecoin-run.js');g.start();
  g.read('actTwo.step(state,.016,route.actTwo.bells[0]+100);for(const bell of state.bells)ringCathedralBell(bell,245,400)');
  assert.equal(g.read('state.bellsRung'),2);
  assert.equal(g.read('state.slingshots'),0);
  g.read('state.distance=route.actTwo.end-player.x+1;buildCourse();hazards.length=0;update(.016)');
  assert.equal(g.read('state.routeId'),'corrupt');
  assert.equal(g.read('route.actTwoProgress(state.distance+player.x)'),1);
  assert.ok(g.nodes.get('#routeProgress').value<.01);
});

test('Emerald Run Slingshot pauses, stays visible, lands safely and resets all bell state', () => {
  const g=game('pepecoin-run.js');g.start();
  g.read('terrainAt=()=>280;hazards.length=0;statues.length=0;crowns.length=0;for(const bell of state.bells)ringCathedralBell(bell,245,200);jump();update(.3)');
  assert.ok(g.read('player.y')>=145,'the high arc stays inside the camera');
  const frozen=g.read('JSON.stringify([state.railTime,state.railLift,state.bells.map(b=>b.ringTime)])');
  g.read('window.EmeraldArcade.isPaused=()=>true;update(1)');
  assert.equal(g.read('JSON.stringify([state.railTime,state.railLift,state.bells.map(b=>b.ringTime)])'),frozen);
  g.read('window.EmeraldArcade.isPaused=()=>false;state.railTime=.01;update(.016)');
  assert.equal(g.read('protectedRide()'),true);
  g.read('for(let i=0;i<60;i++)update(1/60)');
  assert.equal(g.read('protectedRide()'),false);
  g.read('hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false});update(.016)');
  assert.equal(g.read('state.mode'),'gameover');
  g.read('startGame({sameRoad:true})');
  assert.equal(g.read('state.bellsRung+state.slingshots+state.railTime+state.bells.filter(b=>b.collected||b.missed).length'),0);
});

test('Emerald Run Slingshot expires consistently and bells have clear jump approaches', () => {
  const g=game('pepecoin-run.js');g.start();
  g.read('const slingA={},slingB={};for(const s of [slingA,slingB]){actTwo.reset(s);for(const b of s.bells)actTwo.ringBell(s,b,100)}for(let i=0;i<270;i++)actTwo.step(slingA,1/60,32301,true);for(let i=0;i<45;i++)actTwo.step(slingB,.1,32301,true)');
  assert.equal(g.read('actTwo.active(slingA)||actTwo.active(slingB)'),false);
  g.read('state.distance=33000;buildCourse()');
  assert.ok(g.read('hazards.every(h=>!pickupApproach(h.x,route.actTwo.bells))'));
});

test('Emerald Run frontier worlds have equal spans and reset their blends on retry', () => {
  const g=game('pepecoin-run.js');g.start();
  assert.equal(g.read('route.frontier.volcanic-route.frontier.start'),8400);
  assert.equal(g.read('route.frontier.end-route.frontier.volcanic'),8400);
  g.read('state.distance=route.frontier.start-player.x+1;buildCourse();hazards.length=0;update(.3)');
  assert.equal(g.read('state.routeId'),'corrupt');assert.ok(g.read('state.corruptWorldBlend')>.8);
  const blend=g.read('state.corruptWorldBlend');g.read('window.EmeraldArcade.isPaused=()=>true;update(1)');
  assert.equal(g.read('state.corruptWorldBlend'),blend);
  g.read('window.EmeraldArcade.isPaused=()=>false;state.distance=route.frontier.volcanic-player.x+1;buildCourse();hazards.length=0;update(.3)');
  assert.equal(g.read('state.routeId'),'volcanic');assert.ok(g.read('state.volcanicWorldBlend')>.8);
  g.read('crash({});startGame({sameRoad:true})');assert.equal(g.read('state.corruptWorldBlend+state.volcanicWorldBlend'),0);
});

test('Emerald Run authored power pickups stay regularly spaced across the frontier', () => {
  const g=game('pepecoin-run.js');g.start();
  g.read('for(const at of [16000,24000,32000,40000,48000,56000,64000]){state.distance=at;buildCourse()}');
  const positions=g.read('[...statues,...crowns,...rushStatues].filter(p=>p.x>=route.frontier.start).map(p=>p.x).sort((a,b)=>a-b)');
  assert.ok(positions.length>2);
  for(let i=1;i<positions.length;i++)assert.ok(positions[i]-positions[i-1]>=3200);
  assert.ok(g.read('statues.every(p=>(p.x-route.opening.statue)%route.pickupSpacing.statue===0)'));
  assert.ok(g.read('crowns.every(p=>(p.x-route.opening.crown)%route.pickupSpacing.crown===0)'));
  assert.ok(g.read('rushStatues.every(p=>(p.x-route.opening.rush)%route.pickupSpacing.rush===0)'));
});

test('Emerald Run disco feedback uses colored facets and orbs instead of the old straight streaks', () => {
  const g=game('pepecoin-run.js');g.start();g.read('state.elapsed=1;drawDiscoMotes()');
  assert.ok(g.drawingCalls.some(c=>c.method==='arc'));
  assert.ok(g.drawingCalls.some(c=>c.method==='fillRect'));
  assert.equal(g.drawingCalls.filter(c=>c.method==='lineTo').length,0);
  g.drawingCalls.length=0;g.read('reducedMotion.matches=true;state.elapsed=2;drawDiscoMotes()');
  const calm=JSON.stringify(g.drawingCalls.map(c=>({method:c.method,args:c.args})));
  g.drawingCalls.length=0;g.read('state.elapsed=9;drawDiscoMotes()');
  assert.equal(JSON.stringify(g.drawingCalls.map(c=>({method:c.method,args:c.args}))),calm);
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
  g.timers[0](); assert.match(g.nodes.get('#overlayText').textContent, /^Flight finished/);
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
  g.read(`window.__towerRead('state.vault=1; enemies.length=0; enemies.push({x:1185,y:404,pathIndex:9,speed:60,slowTimer:0,hitFlash:0,spin:0,kind:"boss"}); update(.01); endGame("duplicate")')`);
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


test('Tower Defense opens a safe build phase before its first wave', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  assert.equal(g.read('window.__towerRead("state.waveActive")'), false);
  assert.equal(g.read('window.__towerRead("enemies.length")'), 0);
  g.read('window.__towerRead("buildOrUpgrade(pads[0])")');
  assert.equal(g.read('window.__towerRead("state.shards")'), 105);
  g.start(); assert.equal(g.read('window.__towerRead("towers.length")'), 1);
  g.nodes.get('#waveButton').emit('click');
  assert.equal(g.read('window.__towerRead("state.waveActive")'), true);
  assert.equal(g.nodes.get('#waveButton').disabled, true);
});


test('Tower Defense slow strengths change actual movement and expire within the frame', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  g.read(`window.__towerRead('enemies.push({x:34,y:345,pathIndex:1,speed:100,slowTimer:0,slowStrength:0,hitFlash:0,spin:0,hp:100,radius:14,kind:"grunt"}); applySlow(enemies[0],.48,.1); updateEnemies(1)')`);
  assert.ok(Math.abs(g.read('window.__towerRead("enemies[0].x")') - 129.2) < .000001);
  assert.equal(g.read('window.__towerRead("enemies[0].slowStrength")'), 0);
});

test('Tower Defense upgraded slow resists weaker hits and applies its strength to nearby creeps', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  g.read(`window.__towerRead('enemies.push({x:34,y:345,hp:100,slowTimer:0},{x:40,y:345,hp:100,slowTimer:0}); applyMilestoneHit({type:"shard",level:5,slow:.82},enemies[0]); damageEnemy(enemies[0],0,.12,0)')`);
  assert.equal(g.read('window.__towerRead("enemies[0].slowStrength")'), .82);
  assert.equal(g.read('window.__towerRead("enemies[1].slowStrength")'), .82);
  assert.equal(g.read('window.__towerRead("enemies[0].slowTimer")'), 2.8);
});

test('Tower Defense an enemy exactly at its waypoint stays finite on a zero-time frame', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  g.read(`window.__towerRead('enemies.push({x:170,y:345,pathIndex:1,speed:100,slowTimer:0,hitFlash:0,spin:0,kind:"grunt"}); updateEnemies(0)')`);
  assert.equal(g.read('window.__towerRead("enemies[0].pathIndex")'), 2);
  assert.equal(g.read('window.__towerRead("enemies[0].x")'), 170);
});


test('Tower Defense ignores dead targets so the next ready tower hits a live creep', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  g.read(`window.__towerRead('enemies.push({x:200,y:170,pathIndex:3,hp:0},{x:170,y:300,pathIndex:2,hp:100})')`);
  assert.equal(g.read('window.__towerRead("targetFor({x:230,y:260,range:200}).hp")'), 100);
});


test('Tower Defense fifty wave-clear transitions reward once and replay resets campaign', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  // Synthetic clears isolate campaign transitions, not combat or human balance.
  for (let wave=1;wave<=50;wave++) {
    g.nodes.get('#waveButton').emit('click');
    g.read('window.__towerRead("enemies.length=0; state.spawnLeft=0; updateWave(0); updateHud()")');
    assert.equal(g.nodes.get('#campaignProgress').value, wave);
  }
  assert.equal(g.records.length, 1);
  assert.equal(g.records[0][1].wave, 50);
  assert.equal(g.records[0][1].rank, 'Vault Architect');
  assert.equal(g.records[0][1].score, 152500);
  assert.equal(g.records[0][1].shards, 18230);
  assert.equal(g.nodes.get('#waveLabel').textContent, 50);
  g.read('window.__towerRead("updateWave(0); endGame()")');
  assert.equal(g.records.length, 1);
  g.start(); assert.equal(g.nodes.get('#campaignProgress').value, 0);
  assert.equal(g.read('window.__towerRead("state.vault")'), 100);
});

test('Tower Defense upgrades reach evolution with exact costs and mastery actions', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  g.read('window.__towerRead("state.shards=1000; selectTower(String.fromCharCode(115,104,97,114,100)); buildOrUpgrade(pads[0]); for(let i=0;i<5;i++) upgradeSelected(String.fromCharCode(112,111,119,101,114))")');
  assert.equal(g.read('window.__towerRead("towers[0].level")'), 5);
  assert.equal(g.read('window.__towerRead("towers[0].evolved")'), true);
  assert.equal(g.read('window.__towerRead("towers[0].slow")'), .82);
  assert.equal(g.read('window.__towerRead("state.shards")'), 20);
  assert.equal(g.read('window.__towerRead("mastery.shard.upgrades")'), 5);
  g.read('window.__towerRead("buildOrUpgrade(pads[0])")');
  assert.equal(g.read('window.__towerRead("state.shards")'), 20);
});


test('Tower Defense corner travel is consistent at 30, 60 and 120 Hz', () => {
  for (const hz of [30,60,120]) {
    const g = game('pepe-tower-defense.js'); g.start();
    g.read(`window.__towerRead('enemies.push({x:34,y:345,pathIndex:1,speed:100,slowTimer:0,hitFlash:0,spin:0,kind:"grunt"}); for(let i=0;i<${hz*5};i++) updateEnemies(1/${hz})')`);
    assert.ok(Math.abs(g.read('window.__towerRead("enemies[0].x")')-359)<.000001);
    assert.equal(g.read('window.__towerRead("enemies[0].y")'),170);
  }
});

test('Tower Defense multi-corner travel preserves boss breach damage and records fatal loss once', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  g.read(`window.__towerRead('state.vault=4; enemies.push({x:34,y:345,pathIndex:1,speed:100,slowTimer:0,hitFlash:0,spin:0,kind:"boss"}); updateEnemies(100); endGame()')`);
  assert.equal(g.read('window.__towerRead("state.vault")'),0);
  assert.equal(g.read('window.__towerRead("enemies.length")'),0);
  assert.equal(g.records.length,1);
});


for (const hz of [30,60]) test(`Tower Defense earned-shard first-twenty-wave checkpoint at ${hz} Hz`, (t) => {
  const g = game('pepe-tower-defense.js'); g.start();
  g.read("Math.random = () => .5");
  const outcome = JSON.parse(g.read(`window.__towerRead(\`
    const order = [0,2,4,6,1,5,7,8,3];
    let ticks = 0;
    while(state.playing && state.wave <= 20 && ticks < 54000) {
      // Deterministic purchasing policy; never grant funds, kills or clears.
      selectTower("pepe");
      for (const index of order) if (!towerAtPad(pads[index]) && state.shards >= 75) buildOrUpgrade(pads[index]);
      for (let tier=0;tier<5;tier++) for(const index of order) {
        const tower = towerAtPad(pads[index]);
        if(tower && tower.tiers.power===tier && state.shards >= upgradeCost(tower,"power")) { buildOrUpgrade(pads[index]); upgradeSelected("power"); }
      }
      if(!state.waveActive) startWave();
      update(1/${hz});
      ticks++;
    }
    JSON.stringify({wave:state.wave,vault:state.vault,score:state.score,ticks,towers:towers.length,playing:state.playing});
  \`)`));
  t.diagnostic(`Controller policy only: ${JSON.stringify(outcome)}; human balance remains open.`);
  assert.equal(outcome.playing, true, JSON.stringify(outcome));
  assert.equal(outcome.wave, 21, JSON.stringify(outcome));
  assert.ok(outcome.vault > 0);
  assert.equal(g.records.length, 0);
});


test('Tower Defense field guide follows the selected defender and actual level-one stats', () => {
  const g = game('pepe-tower-defense.js'); g.start();
  assert.match(g.nodes.get('#towerGuide').textContent, /Pepe Blaster.*22 damage, 150 range, 0.42 seconds/);
  g.read('window.__towerRead("selectTower(String.fromCharCode(115,104,97,114,100))")');
  assert.match(g.nodes.get('#towerGuide').textContent, /48% slow for 1.6 seconds/);
  assert.match(g.nodes.get('#towerGuide').textContent, /Absolute Zero/);
});


test('Pepe Wars quick losses cannot receive speed-victory ranks', () => {
  const g = game('pepe-wars.js'); g.start();
  assert.equal(g.read('window.__warsRead("rankFor(0,10,false)")'),'Fresh Recruit');
  assert.equal(g.read('window.__warsRead("rankFor(0,10,true)")'),'Shard General');
  g.read('window.__warsRead("endGame(false)")');
  assert.notEqual(g.records[0][1].rank,'Shard General');
});

test('Pepe Wars dead units cannot attack and fatal base combat stops remaining actors', () => {
  const g = game('pepe-wars.js'); g.start();
  g.read('window.__warsRead("spawnUnit(String.fromCharCode(98,114,97,119,108,101,114)); friendlies[0].hp=0; friendlies[0].x=1180; friendlies[0].cooldown=0; updateUnits(0)")');
  assert.equal(g.read('window.__warsRead("state.enemyBase")'),1000);
  g.read('window.__warsRead("spawnUnit(String.fromCharCode(98,114,97,119,108,101,114)); friendlies[0].x=1180; friendlies[0].cooldown=0; state.enemyBase=1; updateUnits(0)")');
  assert.equal(g.read('window.__warsRead("state.enemyBase")'),0);
  assert.equal(g.records.length,1);
  assert.equal(g.records[0][1].wins,1);
});

test('Pepe Wars paused or post-result training cannot spend or relaunch', () => {
  const g = game('pepe-wars.js'); g.start();
  g.read('window.EmeraldArcade.isPaused=()=>true; window.__warsRead("train(String.fromCharCode(109,105,110,101,114))")');
  assert.equal(g.read('window.__warsRead("state.shards")'),120);
  g.read('window.EmeraldArcade.isPaused=()=>false; localStorage.setItem=()=>{throw new Error("blocked")}; window.__warsRead("state.score=100; endGame(false); train(String.fromCharCode(109,105,110,101,114))")');
  assert.equal(g.records.length,1);
  assert.equal(g.read('window.__warsRead("state.playing")'),false);
});


test('Pepe Wars hold and defend return advanced fighters to their commanded line', () => {
  const g = game('pepe-wars.js'); g.start();
  g.read('window.__warsRead("spawnUnit(String.fromCharCode(98,114,97,119,108,101,114)); friendlies[0].x=900; setStance(String.fromCharCode(104,111,108,100)); for(let i=0;i<300;i++) updateUnits(1/30)")');
  assert.equal(g.read('window.__warsRead("friendlies[0].x")'),650);
  g.read('window.__warsRead("setStance(String.fromCharCode(100,101,102,101,110,100)); for(let i=0;i<300;i++) updateUnits(1/30)")');
  assert.equal(g.read('window.__warsRead("friendlies[0].x")'),330);
});

test('Pepe Wars miners retain their gathering job under defensive stances', () => {
  const g = game('pepe-wars.js'); g.start();
  g.read('window.__warsRead("train(String.fromCharCode(109,105,110,101,114)); setStance(String.fromCharCode(100,101,102,101,110,100)); friendlies[0].x=438; friendlies[0].assignedDeposit=String.fromCharCode(100,101,101,112); friendlies[0].gatherTimer=0; updateUnits(0)")');
  assert.equal(g.read('window.__warsRead("state.shards")'),75);
  assert.equal(g.read('window.__warsRead("friendlies[0].action")'),'gather');
});


for(const sample of [.1,.5,.9]) test(`Pepe Wars earned-income battle at random=${sample}`, (t) => {
  const g = game('pepe-wars.js'); g.start();
  g.read(`Math.random=()=>${sample}`);
  const outcome=JSON.parse(g.read(`window.__warsRead(\`
    let ticks=0;
    while(state.playing && ticks<18000) {
      if(ticks%90===0) {
        const miners=friendlies.filter(u=>u.role==="miner" && u.hp>0).length;
        if(miners<2 && state.elapsed<30 && state.shards>=50) train("miner");
        else if(state.shards>=110) train("archer");
        else if(state.shards>=75) train("brawler");
      }
      update(1/30); ticks++;
    }
    JSON.stringify({playing:state.playing,playerBase:state.playerBase,enemyBase:state.enemyBase,score:state.score,elapsed:state.elapsed,ticks});
  \`)`));
  t.diagnostic(`Controller policy only: ${JSON.stringify(outcome)}; human balance remains open.`);
  assert.equal(outcome.playing,false,JSON.stringify(outcome));
  assert.equal(g.records.length,1);
  assert.ok(outcome.playerBase===0 || outcome.enemyBase===0);
  if(outcome.enemyBase===0) assert.equal(g.records[0][1].score,Math.floor(outcome.score+2500+outcome.playerBase));
  assert.equal(g.nodes.get('#enemyHealth').value,outcome.enemyBase);
  g.start(); assert.equal(g.read('window.__warsRead("state.finalScore")'),null);
});


test('Pepe Wars partial deposits never overpay and depletion reassigns miners', () => {
  const g = game('pepe-wars.js'); g.start();
  g.read('window.__warsRead("train(String.fromCharCode(109,105,110,101,114)); friendlies[0].x=216; friendlies[0].assignedDeposit=String.fromCharCode(110,101,97,114); friendlies[0].gatherTimer=0; shardDeposits[0].amount=3; updateMiner(friendlies[0],0)")');
  assert.equal(g.read('window.__warsRead("state.shards")'),73);
  assert.equal(g.read('window.__warsRead("shardDeposits[0].amount")'),0);
  assert.equal(g.read('window.__warsRead("state.score")'),18);
  g.read('window.__warsRead("updateMiner(friendlies[0],0)")');
  assert.equal(g.read('window.__warsRead("friendlies[0].assignedDeposit")'),'mid');
});

test('Pepe Wars mining cadence preserves timer remainder across frame rates', () => {
  for(const hz of [30,60,120]) {
    const g = game('pepe-wars.js'); g.start();
    g.read(`window.__warsRead('train("miner"); friendlies[0].x=216; friendlies[0].assignedDeposit="near"; for(let i=0;i<${hz*23};i++) updateMiner(friendlies[0],1/${hz}); updateHud()')`);
    assert.equal(g.read('window.__warsRead("state.shards")'),120,'ten five-shard harvests after the fifty-shard recruit');
    assert.equal(g.read('window.__warsRead("shardDeposits[0].amount")'),120);
    assert.match(g.nodes.get('#miningReport').textContent,/1 live miners.*660 \/ 710/);
  }
});


test('Pepe Wars defensive economy reaches the brute tier before a battle outcome', (t) => {
  const g = game('pepe-wars.js'); g.start(); g.read('Math.random=()=>.9');
  const outcome=JSON.parse(g.read(`window.__warsRead(\`
    let ticks=0, sawBrute=false;
    while(state.playing && ticks<18000) {
      setStance(state.elapsed<120 ? "defend" : "attack");
      if(ticks%90===0) {
        if(friendlies.filter(u=>u.role==="miner" && u.hp>0).length<2 && state.elapsed<30 && state.shards>=50) train("miner");
        else if(state.shards>=110) train("archer");
        else if(state.shards>=75) train("brawler");
      }
      update(1/30); ticks++;
      if(enemies.some(u=>u.type==="brute")) sawBrute=true;
    }
    JSON.stringify({playing:state.playing,playerBase:state.playerBase,enemyBase:state.enemyBase,elapsed:state.elapsed,sawBrute});
  \`)`));
  t.diagnostic(`Controller policy only: ${JSON.stringify(outcome)}; human balance remains open.`);
  assert.equal(outcome.sawBrute,true);
  assert.equal(outcome.playing,false);
  assert.equal(g.records.length,1);
});

test('Pepe Wars unattended siege loses through real AI combat and replay restores bases', () => {
  const g = game('pepe-wars.js'); g.start();
  g.read('window.__warsRead("for(let tick=0;tick<9000 && state.playing;tick++) update(1/30)")');
  assert.equal(g.read('window.__warsRead("state.playerBase")'),0);
  assert.equal(g.records.length,1);
  assert.equal(g.records[0][1].wins,0);
  g.start();
  assert.equal(g.read('window.__warsRead("state.playerBase")'),1000);
  assert.equal(g.read('window.__warsRead("state.enemyBase")'),1000);
  assert.equal(g.read('window.__warsRead("state.shards")'),120);
});


test('Pepe Wars enemy forecast matches actual AI roster boundaries', () => {
  const g = game('pepe-wars.js'); g.start();
  g.read('window.__warsRead("state.elapsed=36; updateHud()")');
  assert.equal(g.read('window.__warsRead("enemyRoster().length")'),2);
  assert.match(g.nodes.get('#threatReport').textContent,/brutes join in 59s/);
  g.read('window.__warsRead("state.elapsed=96; updateHud()")');
  assert.equal(g.read('window.__warsRead("enemyRoster().length")'),3);
  assert.match(g.nodes.get('#threatReport').textContent,/runners and brutes/);
});


test('Paradox blocked audio cannot prevent launch and active launch cannot reset progress', () => {
  const g=game('pepes-paradox.js');g.start();
  assert.equal(g.read('window.__paradoxRead("state.mode")'),'playing');
  g.read('window.__paradoxRead("player.x=700")');g.start();
  assert.equal(g.read('window.__paradoxRead("player.x")'),700);
});

test('Paradox replay restores shifted wisps, particles, facing and input', () => {
  const g=game('pepes-paradox.js');g.start();
  g.read('window.__paradoxRead("wisps[0].x+=300; keys.add(String.fromCharCode(75,101,121,68)); player.facing=-1; particles.push({}); state.mode=String.fromCharCode(119,111,110)")');g.start();
  assert.equal(g.read('window.__paradoxRead("wisps[0].x")'),1180);
  assert.equal(g.read('window.__paradoxRead("particles.length")'),0);
  assert.equal(g.read('window.__paradoxRead("keys.size")'),0);
  assert.equal(g.read('window.__paradoxRead("player.facing")'),1);
});

test('Paradox pause clears movement and rejects queued jump and dash', () => {
  const g=game('pepes-paradox.js');g.start();
  g.read('window.__paradoxRead("keys.add(String.fromCharCode(75,101,121,68)); player.vx=300; player.dash=.2"); window.EmeraldArcade.isPaused=()=>true; window.emit("emeraldarcade:pause"); window.__paradoxRead("jump(); dash()")');
  assert.equal(g.read('window.__paradoxRead("player.vx")'),0);
  assert.equal(g.read('window.__paradoxRead("player.dash")'),0);
  assert.equal(g.read('window.__paradoxRead("player.grounded")'),true);
});


test('Paradox falls return to safe landed ground without losing collected items', () => {
  const g=game('pepes-paradox.js');g.start();
  g.read('window.__paradoxRead("player.x=1200; player.y=411; player.vy=0; update(0); player.shards=3; shards[0].got=true; player.x=1600; player.y=900; player.vx=300; player.dash=.2; update(0)")');
  assert.equal(g.read('window.__paradoxRead("player.x")'),1200);
  assert.equal(g.read('window.__paradoxRead("player.y")'),411);
  assert.equal(g.read('window.__paradoxRead("player.shards")'),3);
  assert.equal(g.read('window.__paradoxRead("shards[0].got")'),true);
  assert.equal(g.read('window.__paradoxRead("player.dash")'),0);
  assert.match(g.nodes.get('#recoveryStatus').textContent,/fall 1/);
});

test('Paradox chooses the highest crossed platform when a fall crosses multiple surfaces', () => {
  const g=game('pepes-paradox.js');g.start();
  g.read('window.__paradoxRead("player.x=750; player.y=250; player.vy=5000; update(.033)")');
  assert.equal(g.read('window.__paradoxRead("player.y")'),316);
  assert.equal(g.read('window.__paradoxRead("player.grounded")'),true);
});


test('Paradox dialogue, escape, completion and replay follow the actual chapter controller', () => {
  const g=game('pepes-paradox.js');g.start();
  g.read('window.__paradoxRead("player.x=2200; update(0)")');
  assert.equal(g.read('window.__paradoxRead("state.mode")'),'cutscene');
  assert.equal(g.read('window.__paradoxRead("keys.size")'),0);
  g.read('window.EmeraldArcade.isPaused=()=>true; window.__paradoxRead("advanceDialogue()")');
  assert.equal(g.read('window.__paradoxRead("state.cutsceneStep")'),0);
  g.read('window.EmeraldArcade.isPaused=()=>false; window.__paradoxRead("advanceDialogue(); advanceDialogue(); advanceDialogue(); update(1.6)")');
  assert.equal(g.read('window.__paradoxRead("state.mode")'),'playing');
  g.read('window.__paradoxRead("player.x=5101; player.shards=2; player.relics=1; update(0); finish()")');
  assert.equal(g.read('window.__paradoxRead("state.mode")'),'won');
  assert.equal(g.records.length,1);
  assert.equal(g.records[0][1].score,840);
  assert.match(g.nodes.get('#completionReport').textContent,/840 points.*2\/12 shards/);
  assert.equal(g.read('window.__paradoxRead("document.activeElement===ui.start")'),true);
  g.start();
  assert.equal(g.read('window.__paradoxRead("state.tauntDone")'),false);
  assert.equal(g.read('window.__paradoxRead("player.shards")'),0);
  assert.equal(g.nodes.get('#completionReport').hidden,true);
});


test('Paradox collects each item once and records the complete collectible score', () => {
  const g=game('pepes-paradox.js');g.start();
  g.read(`window.__paradoxRead('for(const [items,key,r] of [[shards,"shards",26],[relics,"relics",34],[frogs,"frogs",38]]) for(const item of items){collect(item,item.x,item.y,r,key);collect(item,item.x,item.y,r,key);} state.tauntDone=true; player.x=5101; update(0)')`);
  assert.equal(g.records.length,1);
  assert.equal(g.records[0][1].score,3640);
  assert.equal(g.records[0][1].shards,12);
  assert.equal(g.records[0][1].relics,2);
  assert.equal(g.records[0][1].frogs,1);
  assert.equal(g.nodes.get('#trailProgress').value,1);
  g.start();
  assert.equal(g.nodes.get('#trailProgress').value,0);
  assert.match(g.nodes.get('#trailGoal').textContent,/optional score bonuses/);
});


test('Paradox walk, jump and dash trajectories match at 30, 60 and 120 Hz', () => {
  for(const action of ['walk','jump','dash']) {
    const outcomes=[];
    for(const hz of [30,60,120]) {
      const g=game('pepes-paradox.js');g.start();
      g.read('window.__paradoxRead("keys.add(String.fromCharCode(75,101,121,68))")');
      if(action!=='walk')g.read(`window.__paradoxRead("${action}()")`);
      g.read(`window.__paradoxRead("for(let i=0;i<${hz/2};i++)update(1/${hz})")`);
      outcomes.push([g.read('window.__paradoxRead("player.x")'),g.read('window.__paradoxRead("player.y")'),g.read('window.__paradoxRead("player.vx")')]);
    }
    for(const outcome of outcomes)for(let axis=0;axis<3;axis++)assert.ok(Math.abs(outcome[axis]-outcomes[0][axis])<.00001,`${action} axis ${axis}: ${JSON.stringify(outcomes)}`);
  }
});


test('Paradox story pauses cannot jump moving platforms or displace their rider on resume', () => {
  const g=game('pepes-paradox.js');g.start();
  g.read('window.__paradoxRead("player.x=710; player.y=316; player.grounded=true; beginTaunt(); update(10); advanceDialogue(); advanceDialogue(); advanceDialogue(); update(0)")');
  assert.equal(g.read('window.__paradoxRead("state.mode")'),'escape');
  assert.equal(g.read('window.__paradoxRead("state.platformTime")'),0);
  assert.equal(g.read('window.__paradoxRead("platforms[6].x")'),700);
  assert.equal(g.read('window.__paradoxRead("player.x")'),710);
  g.read('window.__paradoxRead("update(.016)")');
  assert.ok(g.read('window.__paradoxRead("player.x")')>710);
  assert.ok(g.read('window.__paradoxRead("player.x")')<712.1);
});


test('Paradox input policy traverses the chapter through real physics and story transitions', (t) => {
  const g=game('pepes-paradox.js');g.start();
  const outcome=JSON.parse(g.read(`window.__paradoxRead(\`
    let ticks=0;
    while(state.mode!=="won" && ticks<18000) {
      if(state.mode==="playing") { keys.add("KeyD"); if(player.grounded)jump(); }
      if(state.mode==="cutscene")advanceDialogue();
      update(1/60);ticks++;
    }
    JSON.stringify({mode:state.mode,x:player.x,falls,shards:player.shards,relics:player.relics,frogs:player.frogs,seconds:ticks/60});
  \`)`));
  t.diagnostic(`Controller input policy only: ${JSON.stringify(outcome)}; human feel remains open.`);
  assert.equal(outcome.mode,'won',JSON.stringify(outcome));
  assert.equal(g.records.length,1);
});


test('Paradox trail objective distinguishes dialogue and escape from playable pursuit', () => {
  const g=game('pepes-paradox.js');g.start();
  g.read('window.__paradoxRead("beginTaunt(); syncHud()")');
  assert.match(g.nodes.get('#trailGoal').textContent,/line 1 of 3/);
  g.read('window.__paradoxRead("advanceDialogue(); advanceDialogue(); advanceDialogue(); syncHud()")');
  assert.match(g.nodes.get('#trailGoal').textContent,/escaping/);
  g.read('window.__paradoxRead("update(1.6); syncHud()")');
  assert.match(g.nodes.get('#trailGoal').textContent,/Reach the temple gate/);
});

function towerGame() {
  const g=game('pepe-tower-defense.js');g.start();
  g.act = expression => g.read(`window.__towerRead(${JSON.stringify(expression)})`);
  return g;
}

test('Tower management selects without spending and 5/2/0 crosspaths enforce both caps',()=>{
  const g=towerGame();g.nodes.get('pad:0').emit('click');assert.equal(g.act('state.shards'),105);
  g.nodes.get('pad:0').emit('click');assert.equal(g.act('state.shards'),105);
  assert.equal(g.nodes.get('pad:0').disabled,false);assert.equal(g.nodes.get('#towerPanel').hidden,false);
  g.act('state.shards=5000');g.nodes.get('upgradePath:power').emit('click');assert.equal(g.act('towers[0].tiers.power'),1);
  assert.ok(Math.abs(g.act('towers[0].damage')-29.7)<1e-9);
  g.act('upgradeSelected("special");upgradeSelected("special")');assert.equal(g.act('upgradeSelected("utility")'),false);
  g.act('upgradeSelected("power");upgradeSelected("power");upgradeSelected("power");upgradeSelected("power")');
  assert.equal(g.act('tierCode(towers[0])'),'5 / 2 / 0');assert.equal(g.act('upgradeSelected("special")'),false);
  assert.equal(g.act('upgradeSelected("power")'),false);assert.equal(g.act('towers[0].evolved'),true);
  g.act('state.shards=0;updateHud()');assert.equal(g.nodes.get('pad:0').disabled,false);
  assert.equal(g.nodes.get('upgradePath:power').disabled,true);
});

test('Tower relocation preserves object, upgrade investment and cooldown without mastery farming',()=>{
  const g=towerGame();g.act('buildOrUpgrade(pads[0]);state.shards=500;upgradeSelected("special");towers[0].cooldown=.3;window.original=towers[0];window.balance=state.shards;window.actions=mastery.pepe.placements+mastery.pepe.upgrades;beginMove();buildOrUpgrade(pads[2])');
  assert.equal(g.act('towers[0]===window.original'),true);assert.equal(g.act('state.shards===window.balance'),true);
  assert.equal(g.act('towers[0].pad===pads[2] && towers[0].x===pads[2].x'),true);
  assert.equal(g.act('towers[0].cooldown'),.3);assert.equal(g.act('towers[0].path'),'special');
  assert.equal(g.act('mastery.pepe.placements+mastery.pepe.upgrades===window.actions'),true);
  g.act('selectTower("pepe");buildOrUpgrade(pads[1]);buildOrUpgrade(pads[2]);beginMove();buildOrUpgrade(pads[1])');
  assert.equal(g.act('movingTower===window.original && window.original.pad===pads[2]'),true);
  g.nodes.get('#cancelMoveButton').emit('click');assert.equal(g.act('movingTower'),null);
  g.act('beginMove();startWave()');assert.equal(g.act('movingTower'),null);assert.equal(g.act('beginMove()'),false);
});

test('Tower sale refunds invested build and upgrades once, keeps score and rewards unchanged',()=>{
  const g=towerGame();g.act('buildOrUpgrade(pads[0]);state.shards=500;upgradeSelected("power");upgradeSelected("power");state.score=99');
  assert.equal(g.act('towers[0].invested'),270);
  g.nodes.get('#sellTowerButton').emit('click');assert.equal(g.act('state.shards'),494);
  g.nodes.get('#sellTowerButton').emit('click');assert.equal(g.act('state.shards'),494);
  assert.equal(g.act('towers.length'),0);assert.equal(g.act('state.score'),99);assert.equal(g.records.length,0);
  assert.equal(g.nodes.get('#towerPanel').hidden,true);
});

test('Tower management ignores paused, post-result and move-mode purchases and resets selection on replay',()=>{
  const g=towerGame();g.act('buildOrUpgrade(pads[0]);state.shards=500');g.read('window.EmeraldArcade.isPaused=()=>true');
  for(const action of ['upgradeSelected("power")','beginMove()','sellSelected()'])assert.equal(g.act(action),false);
  g.read('window.EmeraldArcade.isPaused=()=>false');g.act('beginMove()');assert.equal(g.act('upgradeSelected("power")'),false);assert.equal(g.act('sellSelected()'),false);
  g.act('movingTower=null;endGame("Test complete")');assert.equal(g.act('sellSelected()'),false);assert.equal(g.act('upgradeSelected("power")'),false);
  g.start();assert.equal(g.act('inspectedTower'),null);assert.equal(g.act('movingTower'),null);assert.equal(g.act('state.shards'),180);
});

test('All defender paths affect actual combat stats while preserving level milestones',()=>{
  for(const type of ['pepe','shard','relic','mage','archer']) {
    const g=towerGame();g.act(`selectTower("${type}");buildOrUpgrade(pads[0]);state.shards=2000;upgradeSelected("special")`);
    const stat=type==='shard'?'slow':type==='relic'||type==='mage'?'splash':'rate';
    assert.ok(g.act(`towers[0].${stat} ${stat==='rate'?'<':'>'} towerTypes["${type}"].${stat}`));
    g.act('upgradeSelected("special");upgradeSelected("special");upgradeSelected("special");upgradeSelected("special")');assert.equal(g.act('towers[0].evolved'),true);
    assert.ok(g.act('towers[0].slow<=.82'));
    g.act('enemies.push({x:towers[0].x+10,y:towers[0].y,hp:10000,maxHp:10000,pathIndex:1,slowTimer:0,radius:14,kind:"grunt"});towers[0].cooldown=0;updateTowers(0)');
    assert.ok(g.act('enemies[0].hp<10000'));
  }
});


test('Tower Defense authored waves introduce goblins safely and telegraph all four bosses',()=>{
  const g=towerGame();
  assert.equal(g.act('CAMPAIGN_WAVES'),50);
  assert.equal(g.act('wavePlans.length'),50);
  assert.ok(g.act('wavePlans.slice(0,2).every(p=>p.kinds.every(k=>k==="grunt"))'));
  assert.ok(g.act('wavePlans[2].kinds.includes("goblin")'));
  assert.ok(g.act('wavePlans.slice(0,6).every(p=>!p.kinds.includes("brute"))'));
  assert.ok(g.act('wavePlans[6].kinds.includes("brute")'));
  assert.equal(g.act('wavePlans.slice(0,20).reduce((n,p)=>n+p.kinds.filter(k=>enemyTypes[k].boss).length,0)'),4);
  assert.equal(g.act('wavePlans[19].kinds[wavePlans[19].bossIndex]'),'warboss');
  assert.ok(g.act('wavePlans.every((p,i)=>p.count===p.kinds.length && (!i || p.count>=wavePlans[i-1].count && p.hpScale>=wavePlans[i-1].hpScale && p.interval<=wavePlans[i-1].interval))'));
  assert.match(g.act('waveBrief(wavePlans[19])'),/Goblin warboss/);
  assert.match(g.nodes.get('#wavePreview').textContent,/Wave 1\/50/);
});

test('Goblin armor resists both direct and splash hits, and slows affect real movement',()=>{
  const g=towerGame();
  g.act('enemies.push({...enemyTypes.brute,x:34,y:345,pathIndex:1,hp:100,maxHp:100,slowTimer:0,hitFlash:0,spin:0,kind:"brute"},{...enemyTypes.brute,x:40,y:345,pathIndex:1,hp:100,maxHp:100,slowTimer:0,hitFlash:0,spin:0,kind:"brute"});damageEnemy(enemies[0],20,.48,50)');
  assert.equal(g.act('enemies[0].hp'),84);assert.equal(g.act('enemies[1].hp'),92.8);
  g.act('updateEnemies(1)');assert.ok(Math.abs(g.act('enemies[0].x')-55.84)<1e-9);
});

test('Wave 50 spawns the final Sovereign with scaling, armor and ten-point breach',()=>{
  const g=towerGame();g.act('state.wave=50;startWave();enemies.length=0;state.spawnLeft=currentWavePlan().count-currentWavePlan().kinds.indexOf("sovereign");spawnEnemy()');
  assert.equal(g.act('enemies.length'),1);assert.equal(g.act('enemies[0].kind'),'sovereign');
  assert.ok(g.act('enemies[0].hp>9000 && enemies[0].armor===.3'));
  assert.equal(g.act('enemies[0].speed'),43);
  g.act('enemies[0].x=1185;enemies[0].y=404;enemies[0].pathIndex=9;updateEnemies(0)');
  assert.equal(g.act('state.vault'),90);assert.equal(g.act('enemies.length'),0);
  g.act('state.spawnLeft=0;updateWave(0)');assert.equal(g.records.length,1);assert.equal(g.records[0][1].wave,50);
});


test('Tower Defense mixed earned-shard defense reaches the first-twenty-wave checkpoint', (t)=>{
  const g=towerGame();
  const outcome=JSON.parse(g.act(`
    const order=[0,2,4,6,1,5,7,8,3];
    const loadout={0:"pepe",2:"pepe",4:"shard",6:"pepe",1:"pepe",5:"pepe",7:"archer",8:"relic",3:"pepe"};
    let ticks=0;
    while(state.playing && state.wave<=20 && ticks<54000) {
      for(const i of order) if(!towerAtPad(pads[i]) && state.shards>=towerTypes[loadout[i]].cost) {selectTower(loadout[i]);buildOrUpgrade(pads[i]);}
      for(let tier=0;tier<5;tier++)for(const i of order) {
        const tower=towerAtPad(pads[i]);
        if(tower && tower.tiers[tower.type==="shard"?"special":"power"]===tier && state.shards>=upgradeCost(tower,tower.type==="shard"?"special":"power")) {buildOrUpgrade(pads[i]);upgradeSelected(tower.type==="shard"?"special":"power");}
      }
      if(!state.waveActive)startWave();
      update(1/30);ticks++;
    }
    JSON.stringify({wave:state.wave,vault:state.vault,playing:state.playing,ticks});
  `));
  t.diagnostic(`Mixed-defense controller only: ${JSON.stringify(outcome)}; human balance remains open.`);
  assert.equal(outcome.wave,21);assert.equal(outcome.playing,true);assert.ok(outcome.vault>0);assert.equal(g.records.length,0);
});


test('Crosspaths may choose either primary after a 2/2 start and reject all third-path debits',()=>{
  for(const main of ['power','special','utility'])for(const secondary of ['power','special','utility'].filter(p=>p!==main)) {
    const g=towerGame();g.act('buildOrUpgrade(pads[0]);state.shards=10000');
    g.act(`upgradeSelected("${secondary}");upgradeSelected("${secondary}");upgradeSelected("${main}");upgradeSelected("${main}")`);
    assert.equal(g.act(`upgradeSelected("${main}")`),true);
    assert.equal(g.act(`upgradeSelected("${secondary}")`),false);
    const third=['power','special','utility'].find(p=>p!==main && p!==secondary);
    const before=g.act('state.shards');assert.equal(g.act(`upgradeSelected("${third}")`),false);assert.equal(g.act('state.shards'),before);
    g.act(`upgradeSelected("${main}");upgradeSelected("${main}")`);assert.equal(g.act('towers[0].evolved'),true);
  }
});

test('Identical crosspaths have order-independent stats and previews cannot mutate purchases',()=>{
  const outcomes=[];
  for(const order of [['power','special','power','special','power','power','power'],['special','special','power','power','power','power','power']]) {
    const g=towerGame();g.act('buildOrUpgrade(pads[0]);state.shards=10000');
    for(const choice of order)g.act(`upgradeSelected("${choice}")`);
    outcomes.push(g.act('JSON.stringify([towers[0].damage,towers[0].range,towers[0].rate,towers[0].invested,state.shards])'));
    const snapshot=g.act('JSON.stringify(towers[0].tiers)');g.act('updateTowerPanel();updateTowerPanel()');assert.equal(g.act('JSON.stringify(towers[0].tiers)'),snapshot);
  }
  assert.equal(outcomes[0],outcomes[1]);
});

test('Command bay tabs stay in the game and selecting a tower opens management without buying',()=>{
  const g=towerGame();g.nodes.get('commandTab:intel').emit('click');assert.equal(g.nodes.get('#intelView').hidden,false);assert.equal(g.nodes.get('#buildView').hidden,true);
  g.nodes.get('commandTab:build').emit('click');g.nodes.get('pad:0').emit('click');assert.equal(g.nodes.get('#manageView').hidden,false);
  assert.equal(g.nodes.get('#buildView').hidden,true);assert.equal(g.nodes.get('pad:0').textContent,'1');
  const funds=g.act('state.shards');g.nodes.get('pad:0').emit('click');assert.equal(g.act('state.shards'),funds);
});


test('Long Watch crosspath extends real target acquisition and insufficient shards cannot purchase tiers',()=>{
  const g=towerGame();g.act('selectTower("archer");buildOrUpgrade(pads[0]);state.shards=1000;upgradeSelected("utility");upgradeSelected("utility");upgradeSelected("utility");enemies.push({x:pads[0].x+280,y:pads[0].y,hp:1000,maxHp:1000,radius:14,pathIndex:1,kind:"grunt"})');
  assert.equal(g.act('targetFor(towers[0])===enemies[0]'),true);
  g.act('updateTowers(0)');assert.ok(g.act('enemies[0].hp<1000'));
  const tiers=g.act('JSON.stringify(towers[0].tiers)');g.act('state.shards=0');assert.equal(g.act('upgradeSelected("power")'),false);assert.equal(g.act('JSON.stringify(towers[0].tiers)'),tiers);
});


test('Paradox realm stones change collision and never become recovery checkpoints',()=>{
  const g=game('pepes-paradox.js');g.start();
  const read=code=>g.read(`window.__paradoxRead(${JSON.stringify(code)})`);
  read('player.x=930;player.y=330;player.vy=600;player.grounded=false;update(.033)');
  assert.ok(read('player.y+player.h')>500,'inactive Echo stone must not catch the player');
  read('shiftRealm();player.x=930;player.y=330;player.vy=600;player.grounded=false;update(.033)');
  assert.equal(read('player.y+player.h'),500);
  assert.equal(read('player.grounded'),true);
  assert.equal(read('checkpoint.x'),180,'spectral stones cannot strand a recovered player');
  read('shiftRealm()');assert.equal(read('ability.realm'),'echo','shift must recharge');
  read('update(.61);shiftRealm()');assert.equal(read('ability.realm'),'jade');
});

test('Paradox jump forgiveness, dash recharge, pause and replay keep abilities coherent',()=>{
  const g=game('pepes-paradox.js');g.start();
  const read=code=>g.read(`window.__paradoxRead(${JSON.stringify(code)})`);
  read('player.grounded=false;ability.coyote=.08;jump()');assert.equal(read('player.vy'),-740);
  read('ability.coyote=0;player.vy=100;jump()');assert.equal(read('player.vy'),100);
  read('player.x=300;player.y=450;player.vy=200;update(.033)');assert.equal(read('player.vy'),-740,'buffered jump fires on landing');
  read('dash();update(.25);dash()');assert.equal(read('player.dash'),0,'dash cannot be spammed');
  read('ability.jumpBuffer=.1;clearInput()');assert.equal(read('ability.jumpBuffer'),0);
  read('window.EmeraldArcade.isPaused=()=>true');const t=read('state.time');read('update(2);shiftRealm()');assert.equal(read('state.time'),t);assert.equal(read('ability.realm'),'jade');
  read('window.EmeraldArcade.isPaused=()=>false;state.mode="won";start()');assert.equal(read('ability.dashCooldown'),0);assert.equal(read('ability.realm'),'jade');
});


test('Paradox accepts pursuit movement during escape and wisps cannot chain hits',()=>{
  const g=game('pepes-paradox.js');g.start();
  const read=code=>g.read(`window.__paradoxRead(${JSON.stringify(code)})`);
  read('beginTaunt();advanceDialogue();advanceDialogue();advanceDialogue();keys.add("KeyD");update(.033)');
  assert.equal(read('state.mode'),'escape');assert.ok(read('player.x')>180);
  read('player.x=wisps[0].x-52;player.y=wisps[0].y-80;update(0)');
  assert.ok(read('ability.hurt')>1);
  read('player.x=wisps[0].x-52;player.y=wisps[0].y-80;player.vy=12;update(0)');
  assert.equal(read('player.vy'),12,'protection must prevent repeated knockback');
});


test('Paradox keeps held direction through dialogue and recovery, but clears it on blur',()=>{
  const g=game('pepes-paradox.js');g.start();
  const read=code=>g.read(`window.__paradoxRead(${JSON.stringify(code)})`);
  read('keys.add("KeyD");beginTaunt();advanceDialogue();advanceDialogue();advanceDialogue();update(.033)');
  assert.ok(read('player.x')>180);
  read('player.y=900;update(0)');assert.equal(read('keys.has("KeyD")'),true);assert.ok(read('ability.hurt')>1);
  const x=read('player.x');read('update(.033)');assert.ok(read('player.x')>x);
  g.read('window.emit("blur")');assert.equal(read('keys.size'),0);
});

test('Paradox touch jump release does not cancel a separately held movement finger',()=>{
  const g=game('pepes-paradox.js');g.start();
  const right=g.nodes.get('paradox-control:right'),jump=g.nodes.get('paradox-control:jump');
  right.emit('pointerdown',{pointerId:1});jump.emit('pointerdown',{pointerId:2});jump.emit('pointerup',{pointerId:2});
  assert.equal(g.read(`window.__paradoxRead(${JSON.stringify('touchHeld("right")')})`),true);
  right.emit('pointercancel',{pointerId:1});assert.equal(g.read('window.__paradoxRead("keys.size")'),0);
});

test('Paradox wisps patrol within bounds, disperse on dash, and reform after protection window',()=>{
  const g=game('pepes-paradox.js');g.start();
  const read=code=>g.read(`window.__paradoxRead(${JSON.stringify(code)})`);
  read('player.x=wisps[0].x-52;player.y=wispY(wisps[0])-80;dash();updateWisps(0)');
  assert.equal(read('ability.dispersals'),1);assert.equal(read('wisps[0].banished'),3.5);assert.equal(read('ability.hits'),0);
  read('window.EmeraldArcade.isPaused=()=>true;update(2)');assert.equal(read('wisps[0].banished'),3.5);
  read('window.EmeraldArcade.isPaused=()=>false;player.x=100;player.dash=0;updateWisps(3.6)');assert.equal(read('wisps[0].banished'),0);
  for(const t of [0,3,15,100]){read(`state.platformTime=${t};updateWisps(0)`);assert.equal(read('wisps.every(w=>Math.abs(w.x-w.homeX)<=w.range)'),true);}
});

test('Paradox finish requires actual footing rather than crossing the gate while falling',()=>{
  const g=game('pepes-paradox.js');g.start();
  const read=code=>g.read(`window.__paradoxRead(${JSON.stringify(code)})`);
  read('state.tauntDone=true;player.x=5150;player.y=650;player.vy=20;player.grounded=false;update(0)');assert.equal(read('state.finished'),false);
  read('player.y=456;player.vy=0;update(0)');assert.equal(read('state.mode'),'won');assert.equal(g.records.length,1);
});





for(const config of [{hz:30,realm:"jade",recover:false},{hz:60,realm:"echo",recover:true},{hz:120,realm:"jade",recover:true}]){
  test(`Paradox full-stage touch input: ${config.hz} Hz ${config.realm}, recovery=${config.recover}`,t=>{
    const g=game('pepes-paradox.js');g.start();
    const control=(action,type,id)=>g.nodes.get('paradox-control:'+action).emit(type,{pointerId:id});
    const snapshot=()=>g.read('window.__pepesParadoxDebug.getState()');
    const down=(action,id)=>control(action,'pointerdown',id);
    const up=(action,id)=>control(action,'pointerup',id);
    down('right',1);
    if(!config.recover)down('jump',2);
    if(config.realm==='echo'){down('shift',3);up('shift',3);}
    let recovered=false,paused=false,lines=0,last=null;
    g.frame(0);
    for(let tick=1;tick<config.hz*65;tick++){
      const s=snapshot();last=s;
      if(s.mode==='won')break;
      if(s.mode==='cutscene'){g.nodes.get('#dialogueNext').emit('click');lines++;}
      if(config.recover&&s.falls>0&&!recovered){
        recovered=true;assert.ok(s.protection>0);assert.ok(s.touches.includes('right'));
        down('jump',2);
      }
      if(!paused&&s.x>1700){
        g.read('window.EmeraldArcade.isPaused=()=>true;window.emit("emeraldarcade:pause")');
        assert.equal(snapshot().touches.length,0);
        const x=snapshot().x;g.frame(tick*1000/config.hz);assert.equal(snapshot().x,x);
        g.read('window.EmeraldArcade.isPaused=()=>false;window.emit("emeraldarcade:pause")');
        down('right',1);down('jump',2);paused=true;
      }
      g.frame(tick*1000/config.hz);
    }
    const final=snapshot();
    assert.equal(final.mode,'won',JSON.stringify(final));assert.equal(lines,3);assert.ok(paused);
    assert.ok(final.falls<=2,'held jump must not repeatedly fall into the same ravine: '+JSON.stringify(final));
    if(config.recover)assert.ok(recovered);
    assert.equal(g.records.length,1);assert.equal(final.touches.length,0);
    up('right',1);up('jump',2);g.start();
    assert.equal(snapshot().x,180);assert.equal(snapshot().falls,0);assert.equal(snapshot().touches.length,0);
    down('right',1);g.frame(70000);g.frame(70016);assert.ok(snapshot().x>180,'touch works after replay');
    t.diagnostic('Headless full-stage pointer-event controller; not a browser/mobile rendering check: '+JSON.stringify({hz:config.hz,realm:config.realm,falls:final.falls,hits:final.hits,shards:final.shards,relics:final.relics,mode:final.mode}));
  });
}

test('Paradox pointer cancellation releases only its own finger and blur clears all fingers',()=>{
  const g=game('pepes-paradox.js');g.start();
  const right=g.nodes.get('paradox-control:right'),jump=g.nodes.get('paradox-control:jump');
  right.emit('pointerdown',{pointerId:1});right.emit('pointerdown',{pointerId:3});jump.emit('pointerdown',{pointerId:2});
  right.emit('pointercancel',{pointerId:1});jump.emit('lostpointercapture',{pointerId:2});
  assert.equal(g.read(`window.__paradoxRead(${JSON.stringify('touchHeld("right")')})`),true);
  assert.equal(g.read(`window.__paradoxRead(${JSON.stringify('touchHeld("jump")')})`),false);
  g.read('window.emit("blur")');assert.equal(g.read('window.__paradoxRead("touchPointers.size")'),0);
});


test('Paradox Continue responds to a secondary touch without a compatibility click and suppresses duplicate click',()=>{
  const g=game('pepes-paradox.js');g.start();
  const read=code=>g.read(`window.__paradoxRead(${JSON.stringify(code)})`);
  g.nodes.get('paradox-control:right').emit('pointerdown',{pointerId:1,pointerType:'touch'});
  g.nodes.get('paradox-control:jump').emit('pointerdown',{pointerId:2,pointerType:'touch'});
  read('beginTaunt()');const next=g.nodes.get('#dialogueNext');
  next.emit('pointerdown',{pointerId:30,pointerType:'touch',isPrimary:false});
  next.emit('pointerup',{pointerId:30,pointerType:'touch',isPrimary:false});
  assert.equal(read('state.cutsceneStep'),1);assert.equal(read('touchPointers.size'),2);
  next.emit('click',{detail:1});assert.equal(read('state.cutsceneStep'),1,'a synthesized click must not skip a second line');
  next.emit('pointerdown',{pointerId:31,pointerType:'touch'});next.emit('pointercancel',{pointerId:31,pointerType:'touch'});next.emit('pointerup',{pointerId:31,pointerType:'touch'});
  assert.equal(read('state.cutsceneStep'),1,'cancelled touch must not advance dialogue');
  next.emit('click',{detail:0});assert.equal(read('state.cutsceneStep'),2,'keyboard activation stays usable');
});

test('Paradox Pause responds to a secondary touch and does not toggle twice',()=>{
  const g=game('pepes-paradox.js');g.start();
  g.read('window.EmeraldArcade.paused=false;window.EmeraldArcade.isPaused=()=>window.EmeraldArcade.paused;window.EmeraldArcade.setPaused=value=>{window.EmeraldArcade.paused=value;window.emit("emeraldarcade:pause")};');
  const right=g.nodes.get('paradox-control:right'),pause=g.nodes.get('#pauseToggle');
  right.emit('pointerdown',{pointerId:1,pointerType:'touch'});
  pause.emit('pointerdown',{pointerId:30,pointerType:'touch',isPrimary:false});pause.emit('pointerup',{pointerId:30,pointerType:'touch',isPrimary:false});
  assert.equal(g.read('window.EmeraldArcade.isPaused()'),true);
  assert.equal(g.read('window.__paradoxRead("touchPointers.size")'),0);
  pause.emit('click',{detail:0,pointerType:'touch'});assert.equal(g.read('window.EmeraldArcade.isPaused()'),true);
  pause.emit('click',{detail:0});assert.equal(g.read('window.EmeraldArcade.isPaused()'),false);
});
