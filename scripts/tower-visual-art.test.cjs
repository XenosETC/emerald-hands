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
      if (file !== 'pepe-tower-defense.js') return [];
      const entries = selector === '[data-pad]' ? Array.from({length:9},(_,i)=>['pad',String(i)]) : selector === '[data-upgrade-path]' ? [['upgradePath','power'],['upgradePath','special'],['upgradePath','utility']] : selector === '[data-command-tab]' ? ['build','manage','intel'].map(view=>['commandTab',view]) : selector === '.tower-button' ? ['pepe','shard','relic','mage','archer','alchemist'].map(type=>['tower',type]) : [];
      return entries.map(([key,value])=>{const id=`${key}:${value}`;if(!nodes.has(id)){const item=node();item.dataset[key]=value;nodes.set(id,item);}return nodes.get(id);});
    },
  });
  const window = Object.assign(node(), {
    setTimeout(callback) { timers.push(callback); },
    EmeraldArcade: { beginSession: (...args) => sessions.push(args), recordAndNotify: (...args) => records.push(args) },
  });
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
  if (file === 'pepe-tower-defense.js') source = source.replace(/\}\)\(\);\s*$/, 'window.__towerRead = expression => eval(expression); })();');
  if (file === 'pepe-wars.js') source = source.replace(/\}\)\(\);\s*$/, 'window.__warsRead = expression => eval(expression); })();');
  if (file === 'pepes-paradox.js') source = source.replace(/\}\)\(\);\s*$/, 'window.__paradoxRead = expression => eval(expression); })();');
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

function towerGame() {
  const g=game('pepe-tower-defense.js');g.start();
  g.act=expression=>g.read(`window.__towerRead(${JSON.stringify(expression)})`);
  return g;
}

test('All six towers select coherent tier-3 and Long Watch visuals from their actual path state',()=>{
  for(const type of ['pepe','shard','relic','mage','archer','alchemist']) {
    const g=towerGame();g.act(`selectTower("${type}");buildOrUpgrade(pads[0]);state.shards=10000`);
    assert.equal(g.act('towerVisualStage(towers[0])'),'base');
    g.act('upgradeSelected("power");upgradeSelected("power")');assert.equal(g.act('towerVisualStage(towers[0])'),'base');
    g.act('upgradeSelected("power")');assert.equal(g.act('towerVisualStage(towers[0])'),'tierThree');
    assert.match(g.act('towerVisualSprite(towers[0]).src'),new RegExp(type+'-tier3-v1\\.webp$'));
    assert.equal(g.nodes.get('#selectedPortrait').src,g.act('tierThreeSprites[towers[0].type].src'));
    g.act('upgradeSelected("power");upgradeSelected("power");upgradeSelected("utility");upgradeSelected("utility")');
    assert.equal(g.act('towerVisualStage(towers[0])'),'evolved');
    g.act(`selectTower("${type}");buildOrUpgrade(pads[1]);upgradeSelected("utility");upgradeSelected("utility");upgradeSelected("utility")`);
    assert.equal(g.act('towerVisualStage(towers[1])'),'longWatch');
    assert.match(g.act('towerVisualSprite(towers[1]).src'),new RegExp(type+'-long-watch-v1\\.webp$'));
    g.act('upgradeSelected("power");upgradeSelected("power");upgradeSelected("utility");upgradeSelected("utility")');
    assert.equal(g.act('towerVisualStage(towers[1])'),'longWatch');
    assert.equal(g.act('tierCode(towers[1])'),'2 / 0 / 5');
  }
});

test('Tower rendering and inspector use the same upgrade image and missing art falls back safely',()=>{
  const g=towerGame();g.act('buildOrUpgrade(pads[0]);state.shards=10000;upgradeSelected("utility");upgradeSelected("utility");upgradeSelected("utility");longWatchSprites.pepe.complete=true;longWatchSprites.pepe.naturalWidth=512;drawTowers()');
  const art=g.drawingCalls.filter(call=>call.method==='drawImage').at(-1).args[0];
  assert.match(art.src,/pepe-long-watch-v1\.webp$/);
  assert.equal(art.src,g.nodes.get('#selectedPortrait').src);
  g.act('longWatchSprites.pepe.naturalWidth=0;towerSprites.pepe.complete=true;towerSprites.pepe.naturalWidth=512');
  assert.equal(g.act('loadedTowerSprite(towers[0])===towerSprites.pepe'),true);
});

test('Relic base starts at 100 HP at the visible path endpoint and loses health exactly once per breach',()=>{
  const g=towerGame();
  assert.equal(g.act('state.vault'),100);
  assert.equal(g.act('path.at(-1)===relicBase'),true);
  assert.equal(g.act('relicBase.x < W && relicBase.y < H'),true);
  const leak=(kind,damage)=>g.act(`enemies.push({x:relicBase.x,y:relicBase.y,pathIndex:path.length-1,speed:60,slowTimer:0,hitFlash:0,spin:0,kind:"${kind}",breachDamage:${damage}});updateEnemies(0);updateHud()`);
  leak('grunt',1);assert.equal(g.act('state.vault'),99);
  assert.equal(g.nodes.get('#vaultLabel').textContent,99);
  assert.equal(g.act('enemies.length'),0);
  g.act('updateEnemies(1)');assert.equal(g.act('state.vault'),99);
  leak('brute',2);leak('boss',4);leak('warboss',5);
  assert.equal(g.act('state.vault'),88);
  assert.match(g.nodes.get('#statusMeta').textContent,/88 \/ 100 HP/);
  g.act('drawVault()');
  assert.ok(g.drawingCalls.some(c=>c.method==='fillText' && c.args[0]==='88 / 100 HP'));
  assert.equal(g.act('relicHitFlash'),1);
  g.act('updateEffects(.5)');assert.equal(g.act('relicHitFlash'),0);
});

test('Relic destruction clamps health, ends once, and replay restores the relic',()=>{
  const g=towerGame();
  g.act('state.vault=2;enemies.push({x:relicBase.x,y:relicBase.y,pathIndex:path.length-1,speed:60,slowTimer:0,hitFlash:0,spin:0,kind:"warboss",breachDamage:5});updateEnemies(0);endGame("duplicate")');
  assert.equal(g.act('state.vault'),0);assert.equal(g.act('state.playing'),false);
  assert.equal(g.records.length,1);
  assert.match(g.nodes.get('#overlayTitle').textContent,/relic base was destroyed/);
  g.start();assert.equal(g.act('state.vault'),100);assert.equal(g.act('relicHitFlash'),0);
});

test('Alchemist is affordable from a fresh run, has named paths, and obeys move/sell/crosspath rules',()=>{
  const g=towerGame();g.act('selectTower("alchemist");buildOrUpgrade(pads[0])');
  assert.equal(g.act('state.shards'),45);assert.equal(g.act('towers[0].armorBreak'),.1);
  assert.match(g.nodes.get('#towerDetails').textContent,/10 armor points \(5 boss\), 2.0s/);
  assert.match(g.act('pathTitle(towers[0],"power")'),/Volatile/);
  assert.match(g.act('tierName(towers[0],"special",5)'),/Venom/);
  g.act('state.shards=5000;upgradeSelected("special");upgradeSelected("special");upgradeSelected("special");upgradeSelected("utility");upgradeSelected("utility")');
  assert.equal(g.act('pathLockReason(towers[0],"power")'),'Third path locked');
  assert.equal(g.act('pathLockReason(towers[0],"utility")'),'Secondary path capped at tier 2');
  assert.equal(g.act('towerVisualStage(towers[0])'),'tierThree');
  const refund=g.act('Math.floor(towers[0].invested*.7)');
  g.act('beginMove();buildOrUpgrade(pads[2])');assert.equal(g.act('towers[0].pad===pads[2]'),true);
  const before=g.act('state.shards');g.act('sellSelected();sellSelected()');
  assert.equal(g.act('state.shards'),before+refund);assert.equal(g.act('towers.length'),0);
});

test('Acid refreshes without stacking, caps bosses, expires, and cannot drive armor below zero',()=>{
  const g=towerGame();g.act('selectTower("alchemist");buildOrUpgrade(pads[0]);enemies.push({x:230,y:260,pathIndex:1,speed:0,slowTimer:0,hitFlash:0,spin:0,hp:1000,armor:.2,kind:"brute"})');
  g.act('applyAcid(enemies[0],towers[0]);applyAcid(enemies[0],towers[0])');
  assert.equal(g.act('enemies[0].armorBreak'),.1);assert.equal(g.act('effectiveArmor(enemies[0])'),.1);
  g.act('damageEnemy(enemies[0],100,0,0)');assert.equal(g.act('enemies[0].hp'),910);
  g.act('updateEnemies(1);applyAcid(enemies[0],towers[0])');assert.equal(g.act('enemies[0].acidTimer'),2);
  g.act('enemies[0].boss=true;enemies[0].armor=.25;enemies[0].acidTimer=0;applyAcid(enemies[0],towers[0])');
  assert.equal(g.act('enemies[0].armorBreak'),.05);assert.equal(g.act('effectiveArmor(enemies[0])'),.2);
  g.act('updateEnemies(2)');assert.equal(g.act('effectiveArmor(enemies[0])'),.25);
  g.act('enemies[0].armor=0;applyAcid(enemies[0],towers[0])');assert.equal(g.act('effectiveArmor(enemies[0])'),0);
});

test('Acid affects splash and chained hits consistently and the base enemy armor stays unchanged',()=>{
  const g=towerGame();g.act('selectTower("alchemist");buildOrUpgrade(pads[0]);enemies.push(...[0,10].map(dx=>({x:230+dx,y:260,pathIndex:1,speed:0,slowTimer:0,hitFlash:0,spin:0,hp:1000,armor:.2,radius:10,kind:"brute"})));enemies.forEach(e=>applyAcid(e,towers[0]));damageEnemy(enemies[0],100,0,30)');
  assert.equal(g.act('enemies[0].hp'),910);assert.equal(g.act('enemies[1].hp'),959.5);
  g.act('applyMilestoneHit({type:"pepe",level:3,damage:100},enemies[0])');
  assert.ok(Math.abs(g.act('enemies[1].hp')-(959.5-32*.9))<1e-9);
  assert.equal(g.act('enemies[0].armor'),.2);
});

test('Actual Alchemist attacks show acid, splash only on Volatile tiers 3+, and reset clears coatings',()=>{
  const g=towerGame();g.act('selectTower("alchemist");buildOrUpgrade(pads[0]);state.shards=10000;upgradeSelected("power");upgradeSelected("power")');
  assert.equal(g.act('towers[0].splash'),0);g.act('upgradeSelected("power")');assert.equal(g.act('towers[0].splash'),24);
  g.act('enemies.push(...[0,10].map(dx=>({x:230+dx,y:260,pathIndex:1,speed:0,slowTimer:0,hitFlash:0,spin:0,hp:1000,maxHp:1000,armor:.2,radius:10,kind:"brute"})));updateTowers(.01);drawEnemies();drawEffects()');
  assert.equal(g.act('enemies[1].acidTimer'),2);assert.ok(g.act('enemies[1].hp<1000'));
  assert.equal(g.act('shots[0].type'),'alchemist');assert.ok(g.drawingCalls.some(c=>c.method==='fillText'&&c.args[0]==='ACID -10'));
  g.act("resetGame()");assert.equal(g.act('enemies.length'),0);assert.equal(g.act('towers.length'),0);
});

test('Generated relic asset is rendered at the final waypoint and still displays health',()=>{
  const g=towerGame();g.act('relicBaseSprite.complete=true;relicBaseSprite.naturalWidth=512;state.vault=37;drawVault()');
  const draw=g.drawingCalls.filter(c=>c.method==='drawImage').at(-1);
  assert.match(draw.args[0].src,/relic-base-v1.webp$/);
  assert.ok(g.drawingCalls.some(c=>c.method==='fillText'&&c.args[0]==='37 / 100 HP'));
});

test('Alchemist acid freezes with shared pause and resumes with simulation time',()=>{
  const g=towerGame();g.act('selectTower("alchemist");buildOrUpgrade(pads[0]);enemies.push({x:230,y:260,pathIndex:1,speed:0,slowTimer:0,hitFlash:0,spin:0,hp:10000,armor:.2,kind:"brute"});applyAcid(enemies[0],towers[0]);towers.length=0');
  g.frame(0);g.setWallTime(1000);g.frame(0);
  assert.equal(g.act('enemies[0].acidTimer'),2);
  g.frame(16);g.frame(32);
  assert.ok(g.act('enemies[0].acidTimer')<2);
});

test('Every Alchemist 5/2/0 crosspath has order-independent stats and capped boss weakening',()=>{
  for(const primary of ['power','special','utility'])for(const secondary of ['power','special','utility'].filter(p=>p!==primary)){
    const build=order=>{const g=towerGame();g.act('selectTower("alchemist");buildOrUpgrade(pads[0]);state.shards=10000');for(const p of order)g.act(`upgradeSelected("${p}")`);return JSON.parse(g.act('JSON.stringify([towers[0].damage,towers[0].range,towers[0].rate,towers[0].splash,towers[0].armorBreak,towers[0].bossArmorBreak,towers[0].acidDuration])'));};
    const a=build([...Array(5).fill(primary),...Array(2).fill(secondary)]),b=build([...Array(2).fill(secondary),...Array(5).fill(primary)]);
    assert.deepEqual(a,b);assert.ok(a[4]<=.2&&a[5]<=.1&&a[6]<=4);
  }
});
