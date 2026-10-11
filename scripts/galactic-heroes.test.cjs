const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the real game and its registered input handlers with a fixed clock
// and RNG. No production-only test hooks or alternate scoring implementation.
function game({ storageBlocked = false, savedData = [] } = {}) {
  const nodes = new Map();
  const rendered = [];
  const sessions = [];
  const rewards = [];
  const saves = new Map([['pepe-soul-world-save-v2', 'keep-soul'], ['emerald-arcade-v3', 'keep-arcade'], ...savedData]);
  function target() {
    const listeners = new Map();
    return {
      textContent: '', hidden: false, disabled: false, innerHTML: '',
      attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; },
      classList: { add() {}, remove() {} },
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(listener);
      },
      emit(type, properties = {}) {
        const event = { target: this, key: '', button: 0, pointerId: 1, clientX: 640, prevented: false,
          preventDefault() { this.prevented = true; }, ...properties };
        for (const listener of listeners.get(type) || []) listener(event);
        return event;
      },
      closest() { return null; },
      focus() { this.focused = true; },
      scrollIntoView() { this.scrolled = true; },
    };
  }
  const drawing = new Proxy({}, {
    get: (object, key) => object[key] || ((...args) => rendered.push({ method: key, args })),
    set: (object, key, value) => { object[key] = value; return true; },
  });
  const canvas = Object.assign(target(), {
    width: 1280, height: 720, captured: null,
    getContext: () => drawing,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    setPointerCapture(id) { this.captured = id; },
    hasPointerCapture(id) { return this.captured === id; },
    releasePointerCapture() { this.captured = null; },
  });
  nodes.set('#galaxyCanvas', canvas);
  const document = Object.assign(target(), {
    hidden: false, body: target(), querySelectorAll: () => [],
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, target());
      return nodes.get(selector);
    },
  });
  const window = Object.assign(target(), {
    localStorage: { getItem: key => saves.get(key) ?? null, setItem(key, value) { if (storageBlocked) throw Error('storage blocked'); saves.set(key, String(value)); } },
    EmeraldArcade: { beginSession: (...args) => sessions.push(args), recordAndNotify: (...args) => rewards.push(args) },
  });
  const context = vm.createContext({
    window, document, performance: { now: () => 0 }, requestAnimationFrame() {},
    Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
    URLSearchParams,
    Image: class { complete = false; naturalWidth = 0; addEventListener() {} },
  });
  const run = source => vm.runInContext(source, context);


  run(fs.readFileSync(path.join(__dirname, '..', 'emerald-galactic-heroes.js'), 'utf8'));
  return { run, window, document, canvas, nodes, rendered, sessions, rewards, saves };
}

test('launch guards active flights, focuses playfield, and replay clears transient input and effects',()=>{
  const g=game(); g.nodes.get('#overlayStartButton').emit('click');
  assert.equal(g.run('state.running'),true); assert.equal(g.canvas.focused,true);
  g.run('state.score=850; startGame()'); assert.equal(g.run('state.score'),850); assert.equal(g.sessions.length,1);
  g.run('notify("old",640,500,"green"); endGame(); endGame()');
  assert.equal(g.rewards.length,1); assert.equal(g.nodes.get('#overlayStartButton').focused,true);
  g.nodes.get('#overlayStartButton').emit('click'); assert.equal(g.run('state.score'),0); assert.equal(g.run('popups.length'),0);
  assert.equal(g.sessions.length,2);
});
test('keyboard takes over drag and drag takes over keyboard with pointer ownership',()=>{
  const g=game(); g.run('startGame()'); g.canvas.emit('pointerdown',{clientX:900,clientY:550});
  g.window.emit('keydown',{key:'ArrowLeft'}); g.run('moveHero(0.1)');
  assert.equal(g.run('pointer.active'),false); assert.equal(g.run('state.hero.x'),584);
  g.canvas.emit('pointerdown',{clientX:900,clientY:550});
  g.canvas.emit('pointermove',{pointerId:2,clientX:100,clientY:400});
  g.canvas.emit('pointerup',{pointerId:2}); g.run('moveHero(0.1)');
  assert.equal(g.run('keys.size'),0); assert.equal(g.run('state.hero.x'),900);
});
test('blur, pause, hidden page and canceled pointer release held movement',()=>{
  for(const release of ['blur','emeraldarcade:pause','hidden','pointercancel','lostpointercapture']) {
    const g=game(); g.run('startGame()'); g.canvas.emit('pointerdown',{clientX:1100,clientY:550});
    if(release==='hidden') {g.document.hidden=true;g.document.emit('visibilitychange');}
    else if(release.startsWith('pointer')||release==='lostpointercapture') g.canvas.emit(release);
    else g.window.emit(release);
    g.run('moveHero(0.1)'); assert.equal(g.run('state.hero.x'),640,release);
  }
});
test('paused, repeated and focused-control input cannot hijack a flight',()=>{
  const g=game(); g.window.emit('keydown',{key:' ',repeat:true}); assert.equal(g.run('state.running'),false);
  g.window.emit('keydown',{key:' ',target:{closest:()=>({})}}); assert.equal(g.run('state.running'),false);
  g.run('startGame()'); g.window.EmeraldArcade.isPaused=()=>true;
  g.window.emit('keydown',{key:'ArrowRight'});g.canvas.emit('pointerdown');
  assert.equal(g.run('keys.size'),0);assert.equal(g.run('pointer.active'),false);
});
test('boss victory advances a wave permanently and updates the weapon on the next frame',()=>{
  const g=game();g.run('startGame();state.wave=3;state.elapsed=50;destroyEnemy({type:"boss",x:640,y:100});update(0)');
  assert.equal(g.run('state.wave'),4);assert.equal(g.run('state.weaponLevel'),4);
  assert.equal(g.run('state.bossKills'),1);assert.equal(g.run('state.score'),9000);
  g.run('update(0.01)');assert.equal(g.run('state.wave'),4);
});
test('destroyed hull cannot hit hero or splice a neighboring ship',()=>{
  const g=game();g.run(`startGame();state.hero.invuln=0;
    enemies.push({type:'fighter',x:100,y:100,size:80,hp:3,speed:0,shotTimer:99},{type:'fighter',x:640,y:620,size:86,hp:1,speed:0,shotTimer:99});
    heroShots.push({x:640,y:620});updateEnemies(0)`);
  assert.equal(g.run('enemies.length'),1);assert.equal(g.run('enemies[0].x'),100);
  assert.equal(g.run('state.shieldCells'),3);assert.equal(g.run('state.kills'),1);
});
test('fatal hull collision clamps cells and freezes score before pickup processing',()=>{
  const g=game();g.run(`startGame();state.hero.invuln=0;state.shieldCells=1;state.spawnTimer=99;state.shotTimer=99;
    enemies.push({type:'boss',x:640,y:620,size:150,hp:99,maxHp:99,speed:0,shotTimer:99});
    pickups.push({type:'bomb',x:640,y:620,speed:0});update(0)`);
  assert.equal(g.run('state.shieldCells'),0);assert.equal(g.run('state.shieldCellsLost'),1);
  assert.equal(g.run('state.running'),false);assert.equal(g.run('state.score'),0);assert.equal(g.run('state.pickupsCollected'),0);
  assert.equal(g.rewards.length,1); assert.equal(g.rewards[0][1].score,0);
});
test('fatal missile does not allow later enemies or pickups to alter the result',()=>{
  const g=game();g.run(`startGame();state.hero.invuln=0;state.shieldCells=1;state.shieldCharge=1;state.spawnTimer=99;state.shotTimer=99;
    enemyShots.push({x:640,y:620,speed:0});pickups.push({type:'shield',x:640,y:620,speed:0});update(0)`);
  assert.equal(g.run('state.running'),false);assert.equal(g.run('state.shieldCells'),0);assert.equal(g.run('state.pickupsCollected'),0);
  assert.equal(g.rewards.length,1);
});
test('boss health reflects combat and wave five clearly describes endless defense',()=>{
  const g=game();g.run('startGame();state.wave=3;spawnEnemy();updateHud()');
  assert.equal(g.nodes.get('#bossStatus').hidden,false);assert.equal(g.nodes.get('#bossHealth').value,41);
  g.run('enemies[0].hp-=3;updateHud()');assert.equal(g.nodes.get('#bossHealth').value,38);
  g.run('state.wave=5;updateHud()');assert.match(g.nodes.get('#flightObjective').textContent,/Emerald Ace reached.*Endless/);
  g.run('endGame()');assert.equal(g.nodes.get('#bossStatus').hidden,true);
});
test('restart uses pause-adjusted clock and never advances on an earlier frame',()=>{
  const g=game();g.run('startGame();loop(1000);loop(1016);endGame();startGame();loop(1032)');
  assert.equal(g.run('state.elapsed'),0);g.run('loop(1048);loop(1040)');assert.equal(g.run('state.elapsed'),0.016);
});
test('finishing an endless flight banks its actual score once and enables replay',()=>{
  const g=game();g.nodes.get('#finishFlight').emit('click');assert.equal(g.rewards.length,0);
  g.run('startGame();state.score=12345;state.wave=3');g.nodes.get('#finishFlight').emit('click');g.nodes.get('#finishFlight').emit('click');
  assert.equal(g.rewards.length,1);assert.equal(g.rewards[0][1].score,12345);
  assert.match(g.nodes.get('#overlayText').textContent,/Flight finished/);assert.equal(g.nodes.get('#finishFlight').disabled,true);
  g.nodes.get('#overlayStartButton').emit('click');assert.equal(g.nodes.get('#finishFlight').disabled,false);
});
test('best projection uses existing arcade records and handles unavailable storage',()=>{
  const g=game();g.window.EmeraldArcade.load=()=>({best:{galaxy:{score:9000,wave:2}}});g.run('showBest()');
  assert.match(g.nodes.get('#flightBest').textContent,/9,000.*Crystal Pilot/);
  g.window.EmeraldArcade.load=()=>{throw Error('blocked');};g.run('showBest()');assert.match(g.nodes.get('#flightBest').textContent,/unavailable/);
});
