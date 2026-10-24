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
      const entries = selector === '[data-pad]' ? Array.from({length:9},(_,i)=>['pad',String(i)]) : selector === '[data-upgrade-path]' ? [['upgradePath','power'],['upgradePath','special'],['upgradePath','utility']] : selector === '[data-command-tab]' ? ['build','manage','intel'].map(view=>['commandTab',view]) : selector === '.tower-button' ? ['pepe','shard','relic','mage','archer','alchemist','hero'].map(type=>['tower',type]) : [];
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

test('Sunwarden requires 400 shards, permits two active heroes, and rejects a third without spending',()=>{
  const g=towerGame();g.act('selectTower("hero");buildOrUpgrade(pads[0])');assert.equal(g.act('towers.length'),0);
  g.act('state.shards=2000;buildOrUpgrade(pads[0]);buildOrUpgrade(pads[1])');
  assert.equal(g.act('towers.length'),2);assert.equal(g.act('state.shards'),1200);
  assert.deepEqual(JSON.parse(g.act('JSON.stringify(towers.map(t=>t.heroSlot))')),[0,1]);
  g.act('buildOrUpgrade(pads[2])');assert.equal(g.act('towers.length'),2);assert.equal(g.act('state.shards'),1200);
  g.act('buildOrUpgrade(pads[0]);upgradeSelected("special");beginMove();buildOrUpgrade(pads[2])');
  assert.equal(g.act('towers[0].pad===pads[2]'),true);assert.equal(g.act('towers[0].tiers.special'),1);
  g.act('sellSelected();buildOrUpgrade(pads[0])');assert.equal(g.act('towers.length'),2);assert.equal(g.act('towers[1].heroSlot'),0);
});

test('Emerald Nova respects wave, pause, relocation, range and cooldown guards without spending an empty cast',()=>{
  const g=towerGame();assert.equal(g.act('activateHeroNova()'),false);
  g.act('state.shards=1000;selectTower("hero");buildOrUpgrade(pads[0])');
  assert.equal(g.act('activateHeroNova()'),false);
  g.act('state.waveActive=true');assert.equal(g.act('activateHeroNova()'),false);assert.equal(g.act('state.heroNovaCooldowns[0]'),0);
  g.act('enemies.push({x:230,y:260,hp:1000,armor:.2,kind:"brute",radius:10},{x:1000,y:600,hp:1000,armor:0,radius:10})');
  g.read('window.EmeraldArcade.isPaused=()=>true');assert.equal(g.act('activateHeroNova()'),false);
  g.read('window.EmeraldArcade.isPaused=()=>false');g.act('movingTower=towers[0]');assert.equal(g.act('activateHeroNova()'),false);
  g.act('movingTower=null');assert.equal(g.act('activateHeroNova()'),true);
  assert.equal(g.act('enemies[0].hp'),928);assert.equal(g.act('enemies[1].hp'),1000);
  assert.equal(g.act('state.heroNovaCooldowns[0]'),20);assert.equal(g.act('activateHeroNova()'),false);
  g.act('drawEffects()');assert.ok(g.drawingCalls.some(c=>c.method==='lineTo'&&c.args[0]===230));
});

test('Nova immediately collects kills once, cannot leak dead foes, and sell/rebuy retains its cooldown',()=>{
  const g=towerGame();g.act('state.shards=3000;selectTower("hero");buildOrUpgrade(pads[0]);state.waveActive=true;enemies.push({x:230,y:260,hp:10,armor:0,kind:"grunt",reward:13,radius:10});activateHeroNova()');
  assert.equal(g.act('enemies.length'),0);assert.equal(g.act('state.shards'),2613);
  const score=g.act('state.score');g.act('collectDefeatedEnemies()');assert.equal(g.act('state.score'),score);
  g.act('sellSelected();buildOrUpgrade(pads[1])');assert.equal(g.act('state.heroNovaCooldowns[0]'),20);
  g.act('updateEffects(5)');assert.equal(g.act('state.heroNovaCooldowns[0]'),15);
  g.act('resetGame()');assert.equal(g.act('state.heroNovaCooldowns[0]'),0);assert.equal(g.act('towers.length'),0);
});

test('Sunwarden upgrades split between blast damage, laser speed and Nova reach/recharge with coherent art',()=>{
  const build=()=>{const g=towerGame();g.act('state.shards=10000;selectTower("hero");buildOrUpgrade(pads[0])');return g;};
  const power=build();power.act('upgradeSelected("power");upgradeSelected("power");upgradeSelected("power")');
  assert.equal(power.act('towers[0].splash'),28);assert.equal(power.act('towerVisualStage(towers[0])'),'tierThree');
  power.act('upgradeSelected("power");upgradeSelected("power")');assert.equal(power.act('towers[0].splash'),56);assert.equal(power.act('towerVisualStage(towers[0])'),'evolved');
  const speed=build();speed.act('upgradeSelected("special");upgradeSelected("special");upgradeSelected("special")');
  assert.ok(speed.act('towers[0].rate')<power.act('towers[0].rate'));assert.equal(speed.act('towers[0].splash'),0);
  const range=build();range.act('upgradeSelected("utility");upgradeSelected("utility");upgradeSelected("utility");upgradeSelected("utility");upgradeSelected("utility");upgradeSelected("power");upgradeSelected("power")');
  assert.equal(range.act('novaRecharge(towers[0])'),10);assert.equal(range.act('towerVisualStage(towers[0])'),'longWatch');
  assert.match(range.act('towerVisualSprite(towers[0]).src'),/hero-long-watch-v1.webp$/);
  assert.equal(range.act('pathLockReason(towers[0],"special")'),'Third path locked');
  assert.equal(range.act('pathLockReason(towers[0],"power")'),'Secondary path capped at tier 2');
});

test('Rapid hero lasers carry attack timing consistently at 30 and 60 Hz',()=>{
  const shots=hz=>{const g=towerGame();g.act('state.shards=1000;selectTower("hero");buildOrUpgrade(pads[0]);enemies.push({x:230,y:260,pathIndex:1,hp:100000,maxHp:100000,armor:0,radius:10,kind:"brute",reward:1})');for(let i=0;i<hz*3;i++)g.act(`updateTowers(${1/hz})`);return g.act('shots.length');};
  assert.ok(Math.abs(shots(30)-shots(60))<=1);assert.ok(shots(60)>=21);
});

test('Nova benefits from acid through the same armor rules as normal green lasers',()=>{
  const g=towerGame();g.act('state.shards=1000;selectTower("hero");buildOrUpgrade(pads[0]);state.waveActive=true;enemies.push({x:230,y:260,hp:1000,armor:.2,acidTimer:2,armorBreak:.1,radius:10,kind:"brute"});activateHeroNova()');
  assert.equal(g.act('enemies[0].hp'),919);assert.equal(g.act('enemies[0].armor'),.2);
});

for(const hz of [30,60]) test('Two Sunwardens complete the 50-wave campaign with earned shards at '+hz+' Hz',t=>{
  const g=towerGame();const outcome=JSON.parse(g.act(`
    const order=[0,4,2,6,1,5,7,8,3],loadout={0:"pepe",4:"shard",2:"hero",6:"hero",1:"alchemist",5:"pepe",7:"archer",8:"relic",3:"mage"};
    let ticks=0,novaCasts=0;
    while(state.playing&&ticks<200000){
      for(const i of order){if(towers.filter(t=>t.type==="hero").length<2&&![0,4,2,6].includes(i))continue;if(!towerAtPad(pads[i])&&state.shards>=towerTypes[loadout[i]].cost){selectTower(loadout[i]);buildOrUpgrade(pads[i]);}}
      if(towers.filter(t=>t.type==="hero").length===2){
        for(let tier=0;tier<5;tier++)for(const i of order){const tower=towerAtPad(pads[i]);const main=tower?.type==="shard"||tower?.type==="alchemist"||tower?.type==="hero"&&tower.heroSlot===1?"special":"power";if(tower&&tower.tiers[main]===tier&&state.shards>=upgradeCost(tower,main)){buildOrUpgrade(pads[i]);upgradeSelected(main);}}
        for(const tower of towers){const primary=tower.path;const second=tower.type==="hero"?(primary==="power"?"special":"power"):"utility";if(tower.tiers[primary]===5&&tower.tiers[second]<2&&state.shards>=upgradeCost(tower,second)){buildOrUpgrade(tower.pad);upgradeSelected(second);}}
      }
      if(!state.waveActive)startWave();for(const slot of [0,1])if(activateHeroNova(slot))novaCasts++;update(1/${hz});ticks++;
    }
    JSON.stringify({wave:state.wave,vault:state.vault,ticks,novaCasts,heroes:towers.filter(t=>t.type==="hero").length});
  `));
  t.diagnostic('Automated earned-shard controller, not human balance approval: '+JSON.stringify(outcome));
  assert.equal(outcome.wave,51);assert.ok(outcome.vault>0);assert.equal(outcome.heroes,2);assert.ok(outcome.novaCasts>0);assert.equal(g.records.length,1);
});

test('Hero portraits and battlefield forms follow upgrades while Nova controls expose recharge',()=>{
  const g=towerGame();g.act('state.shards=10000;selectTower("hero");buildOrUpgrade(pads[0])');
  assert.equal(g.nodes.get('#heroAbility').hidden,false);assert.equal(g.nodes.get('#heroNovaButton').disabled,true);
  for(const path of ['power','utility']){
    if(path==='utility')g.act('sellSelected();buildOrUpgrade(pads[0])');
    for(let tier=1;tier<=5;tier++){
      g.act(`upgradeSelected("${path}")`);
      const expected=tier<3?'hero-base-v1':path==='utility'?'hero-long-watch-v1':tier===5?'hero-evolved-v1':'hero-tier3-v1';
      assert.match(g.nodes.get('#selectedPortrait').src,new RegExp(expected+'\\.webp$'));
      g.act('const art=towerVisualSprite(towers[0]);art.complete=true;art.naturalWidth=512;drawTowers()');
      assert.equal(g.drawingCalls.filter(c=>c.method==='drawImage').at(-1).args[0].src,g.nodes.get('#selectedPortrait').src);
    }
  }
  g.act('state.waveActive=true;state.heroNovaCooldowns[0]=7.2;updateHud()');
  assert.equal(g.nodes.get('#heroNovaButton').textContent,'Emerald Nova · 8s');
  assert.match(g.nodes.get('#heroNovaHint').textContent,/10s recharge/);
});

test('Sunwarden faces targets on both sides and green lasers originate at the mirrored palm in every form',()=>{
  for(const track of ['base','power','utility'])for(const side of [-1,1]){
    const g=towerGame();g.act('state.shards=10000;selectTower("hero");buildOrUpgrade(pads[0])');
    if(track!=='base')g.act(`for(let i=0;i<5;i++)upgradeSelected("${track}")`);
    g.act(`enemies.push({x:230+${side}*90,y:280,pathIndex:1,hp:10000,armor:0,radius:10,kind:"brute",reward:1});updateTowers(.01);const art=towerVisualSprite(towers[0]);art.complete=true;art.naturalWidth=512`);
    assert.equal(g.act('heroFacing(towers[0])'),side);
    assert.equal(g.act('shots[0].x===heroMuzzle(towers[0]).x && shots[0].y===heroMuzzle(towers[0]).y'),true);
    assert.equal(g.act('Math.sign(shots[0].x-towers[0].x)'),side);
    g.drawingCalls.length=0;g.act('drawTowers();drawEffects()');
    assert.ok(g.drawingCalls.some(c=>c.method==='scale'&&c.args[0]===side&&c.args[1]===1));
    assert.ok(g.drawingCalls.some(c=>c.method==='moveTo'&&c.args[0]===g.act('shots[0].x')&&c.args[1]===g.act('shots[0].y')));
  }
});

test('Fifty authored waves gate new enemies, announce major bosses, and include their lackeys',()=>{
  const g=towerGame();assert.equal(g.act('wavePlans.length'),50);
  assert.equal(g.act('wavePlans.slice(0,20).some(p=>p.kinds.includes("shieldbearer"))'),false);
  assert.equal(g.act('wavePlans[20].kinds.includes("shieldbearer")'),true);
  assert.equal(g.act('wavePlans.slice(0,25).some(p=>p.kinds.includes("specter"))'),false);
  assert.equal(g.act('wavePlans[25].kinds.includes("specter")'),true);
  for(const [index,kind,escorts]of [[34,'tyrant',['shieldbearer','shieldbearer','specter','specter']],[49,'sovereign',['shieldbearer','shieldbearer','brute','specter','specter','specter']]]){
    assert.equal(g.act(`wavePlans[${index}].kinds.filter(k=>k==="${kind}").length`),1);
    assert.deepEqual(JSON.parse(g.act(`JSON.stringify(wavePlans[${index}].kinds.slice(wavePlans[${index}].kinds.indexOf("${kind}")+1,wavePlans[${index}].kinds.indexOf("${kind}")+1+${escorts.length}))`)),escorts);
    assert.match(g.act(`waveBrief(wavePlans[${index}])`),kind==='tyrant'?/Jade Tyrant/:/Relic Sovereign/);
  }
  assert.ok(g.act('wavePlans.every(p=>p.count===p.kinds.length&&p.count<=88&&p.interval>=.3&&Number.isFinite(p.hpScale))'));
  assert.ok(g.act('wavePlans[49].hpScale>wavePlans[19].hpScale && wavePlans[49].hpScale<12'));
});

test('Shieldbearer armor responds to acid and specters resist slows without becoming immune',()=>{
  const g=towerGame();g.act('enemies.push({...enemyTypes.shieldbearer,x:34,y:345,pathIndex:1,hp:1000,maxHp:1000,speed:100,slowTimer:0,spin:0,hitFlash:0,kind:"shieldbearer"});damageEnemy(enemies[0],100,0,0)');
  assert.equal(g.act('enemies[0].hp'),940);
  g.act('applyAcid(enemies[0],{armorBreak:.2,bossArmorBreak:.1,acidDuration:4});damageEnemy(enemies[0],100,0,0)');
  assert.equal(g.act('enemies[0].hp'),860);
  const travel=kind=>{const v=towerGame();v.act(`enemies.push({...enemyTypes.${kind},x:34,y:345,pathIndex:1,hp:1000,maxHp:1000,speed:100,slowTimer:0,spin:0,hitFlash:0,kind:"${kind}"});applySlow(enemies[0],.5,1);updateEnemies(1)`);return v.act('enemies[0].x');};
  assert.equal(travel('shieldbearer'),84);assert.equal(travel('specter'),114);
});

test('Two Sunwardens have independent Novas, selected-hero hotkey behavior, and persistent slot cooldowns',()=>{
  const g=towerGame();g.act('state.shards=10000;selectTower("hero");buildOrUpgrade(pads[0]);buildOrUpgrade(pads[1]);for(let i=0;i<5;i++)upgradeSelected("utility");state.waveActive=true;enemies.push({x:300,y:350,hp:10000,armor:0,radius:10,kind:"grunt"})');
  assert.equal(g.act('activateHeroNova(0)'),true);assert.equal(g.act('state.heroNovaCooldowns[0]'),20);assert.equal(g.act('state.heroNovaCooldowns[1]'),0);
  assert.equal(g.act('activateHeroNova()'),true);assert.equal(g.act('state.heroNovaCooldowns[1]'),10);
  assert.equal(g.act('activateHeroNova(0)'),false);g.act('updateEffects(5)');
  assert.deepEqual(JSON.parse(g.act('JSON.stringify(state.heroNovaCooldowns)')),[15,5]);
  assert.match(g.nodes.get('#heroNovaButton').textContent,/Nova 1/);assert.match(g.nodes.get('#heroNovaButton2').textContent,/Nova 2/);
  g.act('sellSelected();buildOrUpgrade(pads[1])');assert.equal(g.act('towers[1].heroSlot'),1);assert.equal(g.act('state.heroNovaCooldowns[1]'),5);
  g.act('resetGame()');assert.deepEqual(JSON.parse(g.act('JSON.stringify(state.heroNovaCooldowns)')),[0,0]);
});

test('Defeating the final boss does not win while its lackeys are still alive',()=>{
  const g=towerGame();g.act('state.wave=50;state.waveActive=true;state.spawnLeft=0;enemies.push({...enemyTypes.sovereign,x:500,y:468,hp:0,kind:"sovereign"},{...enemyTypes.shieldbearer,x:450,y:468,hp:100,kind:"shieldbearer"});collectDefeatedEnemies();updateWave(0)');
  assert.equal(g.act('state.playing'),true);assert.equal(g.act('state.wave'),50);assert.equal(g.records.length,0);
  g.act('enemies[0].hp=0;collectDefeatedEnemies();updateWave(0);updateWave(0)');
  assert.equal(g.act('state.wave'),51);assert.equal(g.records.length,1);assert.equal(g.records[0][1].wave,50);
});
