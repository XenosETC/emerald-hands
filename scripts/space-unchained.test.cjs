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
      classList: { add() {}, remove() {}, toggle() {} },
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
  nodes.set('#gameCanvas', canvas);
  const document = Object.assign(target(), {
    hidden: false, body: target(), querySelectorAll: () => [],
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, target());
      return nodes.get(selector);
    },
  });
  const window = Object.assign(target(), {
    setTimeout() {}, localStorage: { getItem: key => saves.get(key) ?? null, setItem(key, value) { if (storageBlocked) throw Error('storage blocked'); saves.set(key, String(value)); } },
    EmeraldArcade: { beginSession: (...args) => sessions.push(args), recordAndNotify: (...args) => rewards.push(args) },
  });
  const context = vm.createContext({
    window, document, localStorage: window.localStorage, setTimeout() {}, performance: { now: () => 0 }, requestAnimationFrame() {},
    Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
    URLSearchParams,
    Image: class { complete = false; naturalWidth = 0; addEventListener() {} },
  });
  const run = source => vm.runInContext(source, context);


  run(fs.readFileSync(path.join(__dirname, '..', 'pepe-space-unchained.js'), 'utf8'));
  return { run, window, document, canvas, nodes, rendered, sessions, rewards, saves };
}

test('beacon purchases debit flight shards exactly once, cap at two and preserve shared saves', () => {
  const g=game(); assert.equal(g.run('recruitWingman()'),false);
  g.run('startGame(); state.shards=19'); assert.equal(g.run('recruitWingman()'),false);
  g.run('state.shards=60'); assert.equal(g.run('recruitWingman()'),true);
  assert.equal(g.run('state.shards'),40); assert.equal(g.run('recruitWingman()'),true);
  assert.equal(g.run('state.shards'),10); assert.equal(g.run('recruitWingman()'),false);
  assert.equal(g.run('wingmen.length'),2); assert.equal(g.rewards.length,0);
  assert.equal(g.saves.get('emerald-arcade-v3'),'keep-arcade');
  assert.equal(g.saves.get('pepe-soul-world-save-v2'),'keep-soul');
  assert.equal(g.nodes.get('#wingmanButton').disabled,true);
});
test('keyboard and button recruitment respect pause, repeat, focused controls and modifiers', () => {
  const g=game();g.run('startGame();state.shards=100');
  for(const props of [{repeat:true},{ctrlKey:true},{metaKey:true},{altKey:true},{target:{closest:()=>({})}}]) g.window.emit('keydown',{code:'KeyQ',...props});
  assert.equal(g.run('wingmen.length'),0);
  g.window.EmeraldArcade.isPaused=()=>true;
  g.window.emit('keydown',{code:'KeyQ'});g.nodes.get('#wingmanButton').emit('click');
  assert.equal(g.run('wingmen.length'),0);
  g.window.EmeraldArcade.isPaused=()=>false;
  g.window.emit('keydown',{code:'KeyQ'});g.nodes.get('#wingmanButton').emit('click');
  assert.equal(g.run('wingmen.length'),2);assert.equal(g.run('state.shards'),50);
});
test('support bolts use real enemy collision, kill, score and shard-drop paths', () => {
  const g=game();g.run('startGame();state.shards=20;recruitWingman();updateWingmen(.2)');
  assert.equal(g.run('state.supportShots'),1);
  g.run('const shot=bullets[0];enemies.push({x:shot.x,y:shot.y,hp:1,maxHp:1,speed:0,amp:0,t:0,shoot:10,boss:false});updateEnemies(0)');
  assert.equal(g.run('state.kills'),1);assert.equal(g.run('bullets.length'),0);
  assert.equal(g.run('state.score'),195);assert.equal(g.run('shards.length'),3);
});
test('formation and firing cadence remain stable across frame rates; pause and results stop firing', () => {
  const samples=[];
  for(const fps of [30,60,120]) {
    const g=game();g.run('startGame();state.shards=50;recruitWingman();recruitWingman();player.x=80;player.y=100');
    for(let i=0;i<fps*2;i++)g.run(`updateWingmen(${1/fps})`);
    samples.push(g.run('state.supportShots'));
    assert.ok(g.run('wingmen.every(j=>j.x>=70 && j.y>=70 && j.y<=H-70)'));
    g.window.EmeraldArcade.isPaused=()=>true;g.run('updateWingmen(1)');assert.equal(g.run('state.supportShots'),samples.at(-1));
    g.window.EmeraldArcade.isPaused=()=>false;g.run('endGame("bank");updateWingmen(1)');assert.equal(g.run('state.supportShots'),samples.at(-1));
    assert.match(g.run('flightAdvice("bank")'),/2 wingmen/);
    g.run('startGame()');assert.equal(g.run('wingmen.length'),0);assert.equal(g.run('state.supportShots'),0);
  }
  assert.deepEqual(samples,[6,6,6]);
});
test('upgrade status exposes affordability, price changes and flight reset',()=>{
  const g=game();g.run('startGame();state.shards=20;updateHud()');assert.equal(g.nodes.get('#wingmanButton').disabled,false);
  g.nodes.get('#wingmanButton').emit('click');assert.match(g.nodes.get('#wingmanButton').textContent,/30 flight shards/);
  assert.match(g.nodes.get('#wingmanStatus').textContent,/1\/2 wingmen online/);
  assert.equal(g.nodes.get('#wingmanButton').disabled,true);
});
