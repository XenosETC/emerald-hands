const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run each shipped game, its actual start button and scheduled frames. The two
// clocks model shared pause: wall time advances while delivered RAF time does not.
function game(file, savedValues, legacyFixtures=true) {
  let wallTime = 0;
  let nextFrame = 0;
  const frames = new Map();
  const nodes = new Map();
  const drawingCalls = [];
  const sessions = [];
  const records = [];
  const timers = [];
  const saves = savedValues || new Map();
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
      const entries = selector === '[data-pad]' ? Array.from({length:9},(_,i)=>['pad',String(i)]) : selector === '[data-upgrade-path]' ? [['upgradePath','power'],['upgradePath','special'],['upgradePath','utility']] : selector === '[data-command-tab]' ? ['build','manage','intel'].map(view=>['commandTab',view]) : selector === '.tower-button' ? ['pepe','shard','relic','mage','archer','alchemist','hero','ballista','druid'].map(type=>['tower',type]) : [];
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
    localStorage: { getItem: key => saves.get(key) ?? null, setItem: (key, value) => saves.set(key, String(value)), removeItem: key => saves.delete(key) },
    fetch() { throw new Error('offline test'); },
    AbortSignal: { timeout: () => ({}) },
  });
  const read = expression => vm.runInContext(expression, context);
  let source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  if (file === 'pepe-tower-defense.js') source = source.replace(/\}\)\(\);\s*$/, 'window.__towerRead = expression => eval(expression); })();');
  if (file === 'pepe-wars.js') source = source.replace(/\}\)\(\);\s*$/, 'window.__warsRead = expression => eval(expression); })();');
  if (file === 'pepes-paradox.js') source = source.replace(/\}\)\(\);\s*$/, 'window.__paradoxRead = expression => eval(expression); })();');
  if (file === "pepe-tower-defense.js") {
    read(fs.readFileSync(path.join(__dirname, "..", "pepe-tower-maps.js"), "utf8"));
    read(fs.readFileSync(path.join(__dirname, "..", "pepe-tower-checkpoint.js"), "utf8"));
  }
  read(source);
  // Established combat fixtures intentionally retain the original saved-run geometry.
  // Multi-map tests below explicitly choose each production map before starting.
  if(file === 'pepe-tower-defense.js' && legacyFixtures)read('window.__towerRead("applyMap(mapCatalog.legacy);refreshMapMenu();updateHud();draw()")');
  return {
    read, nodes, sessions, records, timers, drawingCalls, saves,
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

test('Placement planning: circle coverage clips segments exactly without counting tangencies or zero-length points',()=>{
  const {coverage}=require('../pepe-tower-maps.js');
  const map={routes:[[{x:-100,y:0},{x:100,y:0}],[{x:-100,y:50},{x:100,y:50}]]};
  assert.equal(coverage(map,{x:0,y:0},50)[0].covered,100);
  assert.equal(coverage(map,{x:0,y:0},50)[0].percent,50);
  assert.equal(coverage(map,{x:0,y:0},50)[1].covered,0);
  assert.equal(coverage(map,{x:0,y:0},500)[0].percent,100);
  assert.equal(coverage(map,{x:200,y:0},50)[0].covered,0);
  assert.equal(coverage({routes:[[{x:0,y:0},{x:0,y:0},{x:100,y:0}]]},{x:0,y:0},25)[0].covered,25);
  for(const range of [0,-1,NaN,Infinity])assert.equal(coverage(map,{x:0,y:0},range)[0].covered,0);
  const grove=require('../pepe-tower-maps.js').get('twinroot-grove'),before=JSON.stringify(grove);
  for(const point of grove.pads){const a=coverage(grove,point,150),b=coverage(grove,point,300);for(let i=0;i<2;i++){assert.ok(a[i].percent>=0&&a[i].percent<=100);assert.ok(b[i].covered>=a[i].covered);}}
  assert.equal(JSON.stringify(grove),before);
});

test('Placement planning: every map previews freely and confirms one real purchase without changing default quick-build',()=>{
  for(const map of require('../pepe-tower-maps.js').maps){
    const g=checkpointGame();g.act(`chooseBattleground('${map.id}')`);g.start();
    const saved=g.act('JSON.stringify(readBuildCheckpoint())');
    g.nodes.get('#planPlacementButton').emit('click');g.act('buildOrUpgrade(pads[0])');
    assert.equal(g.act('state.shards'),180);assert.equal(g.act('towers.length'),0);assert.equal(g.act('JSON.stringify(readBuildCheckpoint())'),saved);
    assert.equal(g.nodes.get('#placementPanel').hidden,false);assert.match(g.nodes.get('#placementCoverage').textContent,map.routes.length>1?/Upper:.*Lower:/:/Road:/);
    g.nodes.get('#confirmPlacementButton').emit('click');g.nodes.get('#confirmPlacementButton').emit('click');
    assert.equal(g.act('state.shards'),105);assert.equal(g.act('towers.length'),1);assert.equal(g.nodes.get('#placementPanel').hidden,true);
    g.nodes.get('#planPlacementButton').emit('click');g.act('buildOrUpgrade(pads[1])');assert.equal(g.act('towers.length'),2);assert.equal(g.act('state.shards'),30);
  }
});

test('Placement planning: unaffordable and hero-limit previews cannot spend even when confirmation is called directly',()=>{
  const g=towerGame();g.nodes.get('#planPlacementButton').emit('click');g.act('selectTower("hero");buildOrUpgrade(pads[0])');
  assert.equal(g.nodes.get('pad:0').disabled,false);assert.equal(g.nodes.get('#confirmPlacementButton').disabled,true);assert.match(g.nodes.get('#placementHint').textContent,/220 more shards/);
  assert.equal(g.act('confirmPlacement()'),false);assert.equal(g.act('state.shards'),180);
  g.act('state.shards=1000;updateHud();confirmPlacement();buildOrUpgrade(pads[1]);confirmPlacement();buildOrUpgrade(pads[2])');
  assert.match(g.nodes.get('#placementHint').textContent,/Two Sunwardens/);assert.equal(g.act('confirmPlacement()'),false);assert.equal(g.act('towers.length'),2);assert.equal(g.act('state.shards'),200);
});

test('Placement planning: cancel, pause, moving, new waves and map changes do not leave stale confirmations',()=>{
  const g=towerGame();g.nodes.get('#planPlacementButton').emit('click');g.act('buildOrUpgrade(pads[0])');
  g.read('window.EmeraldArcade.isPaused=()=>true');g.nodes.get('#confirmPlacementButton').emit('click');assert.equal(g.act('towers.length'),0);
  g.read('window.EmeraldArcade.isPaused=()=>false');g.nodes.get('#cancelPlacementButton').emit('click');assert.equal(g.act('plannedPad'),null);assert.equal(g.act('state.shards'),180);
  g.act('buildOrUpgrade(pads[0]);confirmPlacement();beginMove();buildOrUpgrade(pads[1])');assert.equal(g.act('towers[0].pad===pads[1]'),true);assert.equal(g.act('state.shards'),105);
  g.act('buildOrUpgrade(pads[2]);startWave()');assert.equal(g.act('plannedPad'),null);assert.equal(g.act('confirmPlacement()'),false);
  g.act('buildOrUpgrade(pads[2]);openMapMenu();chooseBattleground("floodgate-delta")');assert.equal(g.act('plannedPad'),null);assert.equal(g.act('planningPlacement'),false);
});

test('Placement planning: switching defenders updates the ghost and coverage, while upgrades update owned tower coverage',()=>{
  const g=towerGame();g.nodes.get('#planPlacementButton').emit('click');g.act('buildOrUpgrade(pads[0]);selectTower("ballista")');
  assert.equal(g.act('plannedPad===pads[0]'),true);assert.match(g.nodes.get('#placementTitle').textContent,/Ballista/);
  assert.equal(g.nodes.get('#placementCoverage').textContent,g.act('coverageText(pads[0],300)'));
  g.act('state.shards=1000;confirmPlacement()');const before=g.nodes.get('#towerCoverage').textContent;
  g.act('upgradeSelected("utility");upgradeSelected("utility");upgradeSelected("utility")');
  assert.notEqual(g.nodes.get('#towerCoverage').textContent,before);
  g.act('selectTower("druid");buildOrUpgrade(pads[2])');assert.match(g.nodes.get('#placementHint').textContent,/nearest road/);
  const n=g.drawingCalls.length;g.act('drawPlacementPreview()');assert.ok(g.drawingCalls.slice(n).some(c=>c.method==='arc'&&c.args[2]===140));
});

test('Map integration: six authored boards have bounded pads, connected relic endpoints and valid spawn routes',()=>{
  const catalog=require('../pepe-tower-maps.js');
  assert.equal(catalog.maps.length,6);assert.equal(new Set(catalog.maps.map(m=>m.id)).size,6);
  for(const map of catalog.maps){
    assert.equal(map.pads.length,map.id==='tideglass-harbor'?8:9);
    assert.ok(fs.existsSync(path.join(__dirname,'..',map.art)));
    for(const p of [...map.pads,...map.routes.flat()])assert.ok(p.x>=0&&p.x<=1280&&p.y>=0&&p.y<=720);
    for(const route of map.routes){assert.equal(route.at(-1),map.relic);for(let i=1;i<route.length;i++)assert.ok(Math.hypot(route[i].x-route[i-1].x,route[i].y-route[i-1].y)>0);}
  }
  assert.equal(catalog.get('unknown'),undefined);assert.equal(catalog.get('courtyard',1),catalog.legacy);
});

test('Map integration: every board starts, builds, upgrades, moves, sells, clears and resumes its own checkpoint',()=>{
  for(const map of require('../pepe-tower-maps.js').maps){
    const g=checkpointGame();g.act(`chooseBattleground('${map.id}')`);g.start();
    assert.equal(g.act('state.shards'),180);assert.equal(g.act('state.vault'),100);
    g.act('buildOrUpgrade(pads[0]);upgradeSelected("utility");beginMove();buildOrUpgrade(pads[1])');
    assert.equal(g.act('towers[0].pad===pads[1]'),true);assert.equal(g.act('towers[0].tiers.utility'),1);
    g.act('startWave();enemies.length=0;state.spawnLeft=0;updateWave(0)');
    assert.equal(g.act('state.wave'),2);assert.equal(g.act('readBuildCheckpoint().mapId'),map.id);
    const h=checkpointGame(g.saves);h.act(`chooseBattleground('${map.id}')`);h.nodes.get('#resumeDefenseButton').emit('click');
    assert.equal(h.act('state.wave'),2);assert.equal(h.act('towers.length'),1);assert.equal(h.act('towers[0].pad===pads[1]'),true);
    h.act('buildOrUpgrade(pads[1]);sellSelected()');assert.equal(h.act('towers.length'),0);
    assert.equal(h.nodes.get('pad:8').hidden,map.id==='tideglass-harbor');assert.equal(h.records.length,0);
  }
});

test('Map integration: returning to Maps preserves the build break and isolates currency, records and tower mastery',()=>{
  const g=checkpointGame();g.act('chooseBattleground("floodgate-delta")');g.start();g.act('buildOrUpgrade(pads[0]);startWave();state.shards=999;openMapMenu()');
  assert.equal(g.act('state.playing'),false);assert.equal(g.act('enemies.length+towers.length+thornPatches.length'),0);
  assert.equal(g.act('readBuildCheckpoint().shards'),105);
  g.act('chooseBattleground("sunscar-quarry")');assert.equal(g.act('readBuildCheckpoint()'),null);g.start();assert.equal(g.act('state.shards'),180);
  g.act('state.score=100;state.wave=6;endGame("test");openMapMenu();chooseBattleground("floodgate-delta")');
  assert.equal(g.act('readMapRecord().score'),0);g.nodes.get('#resumeDefenseButton').emit('click');
  assert.equal(g.act('towers.length'),1);assert.equal(g.act('state.shards'),105);assert.equal(g.records.length,1);
});

test('Map integration: legacy builds retain geometry and modern tombstones prevent old-save resurrection',()=>{
  const g=towerGame();g.act('buildOrUpgrade(pads[0]);saveBuildCheckpoint()');
  const raw=g.saves.get('pepe-tower-defense-build-checkpoint-v1');
  const h=checkpointGame(g.saves);h.act('chooseBattleground("courtyard")');h.nodes.get('#resumeDefenseButton').emit('click');
  assert.equal(h.act('activeMap===mapCatalog.legacy'),true);assert.equal(h.act('towers[0].x'),230);
  h.act('openMapMenu()');h.start();assert.equal(h.act('activeMap.version'),2);h.act('endGame("finish");openMapMenu()');
  assert.equal(h.act('readBuildCheckpoint()'),null);assert.equal(h.saves.get('pepe-tower-defense-build-checkpoint-v1'),raw);
});

test('Map integration: modern saves reject wrong maps, versions and nonexistent Harbor pads',()=>{
  const catalog=require('../pepe-tower-maps.js'),store=require('../pepe-tower-checkpoint.js');
  const g=checkpointGame();g.act('chooseBattleground("tideglass-harbor")');g.start();g.act('buildOrUpgrade(pads[0])');
  const saved=JSON.parse(g.saves.get(catalog.key(catalog.get('tideglass-harbor'))));
  assert.ok(store.normalize(saved,['pepe'],[],catalog.get('tideglass-harbor')));
  assert.equal(store.normalize(saved,['pepe'],[],catalog.get('floodgate-delta')),null);
  for(const mutate of [s=>s.layoutVersion++,s=>s.mapId='unknown',s=>s.towers[0].pad=8]){const s=structuredClone(saved);mutate(s);assert.equal(store.normalize(s,['pepe'],[],catalog.get('tideglass-harbor')),null);}
});

test('Map integration: production boot remembers the selected map and resumes without visiting Classic first',()=>{
  const g=checkpointGame(undefined,false);assert.equal(g.act('activeMap.id'),'courtyard');
  g.act('chooseBattleground("emerald-celestial-hall")');g.start();g.act('buildOrUpgrade(pads[0]);state.wave=7;saveBuildCheckpoint()');
  const h=checkpointGame(g.saves,false);assert.equal(h.act('activeMap.id'),'emerald-celestial-hall');
  assert.match(h.nodes.get('#resumeDefenseButton').textContent,/Resume wave 7/);h.nodes.get('#resumeDefenseButton').emit('click');
  assert.equal(h.act('state.wave'),7);assert.equal(h.act('towers.length'),1);
});

test('Map integration: scouting uses each map health profile and Grove discloses the actual boss lane',()=>{
  for(const map of require('../pepe-tower-maps.js').maps){
    const g=checkpointGame();g.act(`chooseBattleground('${map.id}')`);g.start();
    g.act(`for(const wave of [1,35,50]){state.wave=wave;state.waveSpawnTotal=currentWavePlan().count;state.spawnLeft=state.waveSpawnTotal;enemies.length=0;for(let i=0;i<state.waveSpawnTotal;i++){spawnEnemy();state.spawnLeft--;}for(const row of scoutingRows(currentWavePlan()))if(enemies.filter(e=>e.kind===row.kind).some(e=>e.hp!==row.hp))throw Error('scouting mismatch');}`);
    if(map.id==='twinroot-grove'){
      assert.match(g.act('waveBrief(wavePlans[34])'),/guards use the lower lane/);
      assert.match(g.act('waveBrief(wavePlans[49])'),/guards use the upper lane/);
    }
  }
});

for(const [id,order] of [
  ['courtyard',[0,4,2,6,1,5,7,8,3]],
  ['floodgate-delta',[0,1,3,5,4,2,7,8,6]],
  ['sunscar-quarry',[2,3,4,5,0,1,6,7,8]],
  ['twinroot-grove',[0,8,1,4,2,5,3,6,7]],
  ['tideglass-harbor',[0,1,2,4,3,5,6,7]],
  ['emerald-celestial-hall',[1,2,3,4,5,0,6,7,8]]
]) test('Map campaign: earned-fund 50-wave defense on '+id,t=>{
  const g=checkpointGame();g.act(`chooseBattleground('${id}')`);g.start();
  const result=JSON.parse(g.act(`
    const buildOrder=${JSON.stringify(order)}, types=${JSON.stringify(order.length===8?['pepe','shard','hero','hero','alchemist','ballista','relic','druid']:['pepe','shard','hero','hero','alchemist','ballista','archer','relic','druid'])};
    let ticks=0,majorKills=0;const previousCollect=collectDefeatedEnemies;
    collectDefeatedEnemies=()=>{majorKills+=enemies.filter(e=>e.hp<=0&&['warboss','tyrant','sovereign'].includes(e.kind)).length;previousCollect();};
    while(state.playing&&ticks<160000){
      for(let n=0;n<buildOrder.length;n++){
        if(towers.filter(t=>t.type==='hero').length<2&&n>3)continue;
        if(!towerAtPad(pads[buildOrder[n]])&&state.shards>=towerTypes[types[n]].cost){selectTower(types[n]);buildOrUpgrade(pads[buildOrder[n]]);}
      }
      if(towers.filter(t=>t.type==='hero').length===2){
        for(let tier=0;tier<5;tier++)for(const i of buildOrder){const tower=towerAtPad(pads[i]);const main=tower?.type==='shard'||tower?.type==='alchemist'||tower?.type==='hero'&&tower.heroSlot===1?'special':'power';
          if(tower&&tower.tiers[main]===tier&&state.shards>=upgradeCost(tower,main)){buildOrUpgrade(pads[i]);upgradeSelected(main);}}
        for(const tower of towers){const primary=tower.path,second=tower.type==='hero'?(primary==='power'?'special':'power'):'utility';if(tower.tiers[primary]===5&&tower.tiers[second]<2&&state.shards>=upgradeCost(tower,second)){buildOrUpgrade(tower.pad);upgradeSelected(second);}}
      }
      if(!state.waveActive)startWave();for(const slot of [0,1])activateHeroNova(slot);
      update(1/30,false);ticks++;
    }
    JSON.stringify({map:activeMap.id,wave:state.wave,vault:state.vault,majorKills,ticks,towers:towers.length});
  `));
  t.diagnostic('Map controller evidence, not human balance approval: '+JSON.stringify(result));
  assert.equal(result.wave,51);assert.ok(result.vault>0);assert.ok(result.majorKills>=2);
});

test('Map integration: both Grove roads reach the relic once and majors keep guards on their own lane',()=>{
  const g=checkpointGame();g.act('chooseBattleground("twinroot-grove")');g.start();
  for(const wave of [20,35,50]){
    g.act(`state.wave=${wave};state.waveSpawnTotal=currentWavePlan().count;enemies.length=0;for(let i=0;i<state.waveSpawnTotal;i++){state.spawnLeft=state.waveSpawnTotal-i;spawnEnemy();}`);
    const routes=JSON.parse(g.act('JSON.stringify(enemies.filter(e=>e.boss||e.isEscort).map(e=>e.routeId))'));
    assert.ok(routes.every(id=>id===routes[0]));assert.equal(routes[0],wave===35?1:0);
  }
  g.act('enemies.length=0;state.wave=1;state.waveSpawnTotal=12;state.spawnLeft=12;spawnEnemy();state.spawnLeft--;spawnEnemy();updateEnemies(1000);updateEnemies(1000)');
  assert.equal(g.act('enemies.length'),0);assert.equal(g.act('state.vault'),98);
});

test('Map integration: First and Last compare remaining distance across lanes, and Thornkeeper covers the lower lane',()=>{
  const g=checkpointGame();g.act('chooseBattleground("twinroot-grove")');g.start();
  g.act(`buildOrUpgrade(pads[0]);towers[0].range=2000;const a=activeMap.routes[0],b=activeMap.routes[1];enemies.push(
    {x:a[3].x,y:a[3].y,pathIndex:4,routeId:0,hp:100,maxHp:100},
    {x:b.at(-2).x,y:b.at(-2).y,pathIndex:b.length-1,routeId:1,hp:100,maxHp:100});`);
  assert.equal(g.act('targetFor(towers[0])===enemies[1]'),true);g.act('towers[0].targetMode="last"');assert.equal(g.act('targetFor(towers[0])===enemies[0]'),true);
  g.act('state.shards=1000;selectTower("druid");buildOrUpgrade(pads[4]);state.waveActive=true;plantThorns(towers[1])');
  assert.equal(g.act('thornPatches.length'),1);assert.ok(g.act('thornPatches[0].y>400'));
});

test('Map integration: baked boards do not double-draw their relic, and route preview is optional',()=>{
  const g=checkpointGame();g.act('chooseBattleground("emerald-celestial-hall");courtyard.complete=true;courtyard.naturalWidth=1672;relicBaseSprite.complete=true;relicBaseSprite.naturalWidth=512');
  const before=g.drawingCalls.length;g.act('drawVault();drawPath()');
  assert.equal(g.drawingCalls.slice(before).some(c=>c.method==='drawImage'),false);
  assert.ok(g.drawingCalls.slice(before).some(c=>c.method==='fillText'&&c.args[0]==='100 / 100 HP'));
  g.nodes.get('#routePreviewToggle').checked=true;const n=g.drawingCalls.length;g.act('drawPath()');assert.ok(g.drawingCalls.slice(n).some(c=>c.method==='lineTo'));
});

test('Map integration: every board preserves combat state across equivalent 1x and 2x steps',()=>{
  for(const map of require('../pepe-tower-maps.js').maps){
    const setup=()=>{const g=checkpointGame();g.act(`chooseBattleground('${map.id}')`);g.start();g.act('state.shards=10000;state.wave=35;selectTower("druid");buildOrUpgrade(pads[0]);selectTower("hero");buildOrUpgrade(pads[2]);selectTower("ballista");buildOrUpgrade(pads[4]);startWave()');return g;};
    const a=setup(),b=setup();b.nodes.get('#speedButton').emit('click');
    a.act('for(let i=0;i<800;i++)advanceDefense(.025)');b.act('for(let i=0;i<400;i++)advanceDefense(.025)');
    const snapshot='JSON.stringify({wave:state.wave,health:state.vault,score:state.score,shards:state.shards,left:state.spawnLeft,timer:state.spawnTimer,nova:state.heroNovaCooldowns,metrics:waveMetrics,enemies:enemies.map(e=>[e.kind,e.routeId,e.pathIndex,e.x,e.y,e.hp]),towers:towers.map(t=>[t.cooldown,t.combatDamage,t.combatKills]),traps:thornPatches.map(p=>[p.x,p.y,p.charges,p.life])})';
    assert.equal(a.act(snapshot),b.act(snapshot),map.id);
    b.read('window.EmeraldArcade.isPaused=()=>true');const paused=b.act(snapshot);b.act('advanceDefense(.025);openMapMenu()');assert.equal(b.act(snapshot),paused);
  }
});

test('Map integration: letterboxed canvas taps build on the visible pad on every board',()=>{
  for(const map of require('../pepe-tower-maps.js').maps){
    const g=checkpointGame();g.act(`chooseBattleground('${map.id}')`);g.start();
    g.nodes.get('#gameCanvas').getBoundingClientRect=()=>({left:10,top:20,width:500,height:200});
    const p=JSON.parse(g.act('JSON.stringify(pads[0])')),scale=200/720;
    g.nodes.get('#gameCanvas').emit('click',{clientX:10+(500-1280*scale)/2+p.x*scale,clientY:20+p.y*scale});
    assert.equal(g.act('towers.length'),1,map.id);assert.equal(g.act('towers[0].pad===pads[0]'),true);
  }
});

test('Every scouting roster matches every actual spawn across all fifty waves',()=>{
  const g=towerGame();
  g.act(`for (const plan of wavePlans) {
    state.wave=plan.wave;state.waveSpawnTotal=plan.count;state.spawnLeft=plan.count;enemies.length=0;
    for(let i=0;i<plan.count;i++){spawnEnemy();state.spawnLeft--;}
    const rows=scoutingRows(plan);
    if(rows.reduce((sum,row)=>sum+row.count,0)!==plan.count)throw new Error('roster count');
    for(const row of rows){
      const spawned=enemies.filter(e=>e.kind===row.kind);
      if(spawned.length!==row.count)throw new Error('kind count');
      for(const e of spawned)for(const field of ['hp','maxHp','armor','slowResistance','breachDamage','speed'])
        if(e[field]!==row[field])throw new Error('scout mismatch '+plan.wave+' '+row.kind+' '+field);
      const spec=enemyTypes[row.kind],scale=row.kind==='sovereign'?.75:row.kind==='tyrant'?.9:1;
      if(row.hp!==Math.round((spec.hp+Math.min(plan.wave,20)*spec.growth)*plan.hpScale*scale))throw new Error('health changed');
      if(row.speed!==spec.speed+Math.min(15,plan.wave)*spec.acceleration)throw new Error('speed changed');
    }
  }`);
});

test('Scouting shows starting stats despite damage and debuffs, updates at build breaks and hides after victory',()=>{
  const g=towerGame();g.act('state.wave=35;updateHud()');
  assert.equal(g.nodes.get('#scoutingTitle').textContent,'Wave 35 roster · 74 foes');
  const roster=g.nodes.get('#scoutingRoster').innerHTML;
  assert.match(roster,/Jade Tyrant ×1/);assert.match(roster,/25% armor/);assert.match(roster,/25% slow resistance · breach: 6 HP/);
  assert.equal(g.act('scoutingRows(currentWavePlan())[0].kind'),'tyrant');
  assert.match(roster,/40% armor/);assert.match(roster,/60% slow resistance/);
  g.act('startWave();enemies[0].hp=1;enemies[0].armor=0;updateHud()');assert.equal(g.nodes.get('#scoutingRoster').innerHTML,roster);
  g.act('state.wave=36;state.waveActive=false;updateHud()');assert.match(g.nodes.get('#scoutingTitle').textContent,/Wave 36 roster/);
  assert.doesNotMatch(g.nodes.get('#scoutingRoster').innerHTML,/Jade Tyrant/);
  g.act('state.wave=51;updateHud()');assert.equal(g.nodes.get('#waveScouting').hidden,true);
  g.act('state.playing=false');g.start();assert.equal(g.nodes.get('#waveScouting').hidden,false);assert.match(g.nodes.get('#scoutingTitle').textContent,/Wave 1 roster/);
});

test('Scouting is derived from the resumed wave, without adding saved combat or progression state',()=>{
  const g=towerGame();g.act('state.wave=50;saveBuildCheckpoint()');
  const h=checkpointGame(g.saves);h.nodes.get('#resumeDefenseButton').emit('click');
  assert.match(h.nodes.get('#scoutingTitle').textContent,/Wave 50 roster · 88 foes/);
  assert.match(h.nodes.get('#scoutingRoster').innerHTML,/Relic Sovereign ×1/);
  assert.match(h.nodes.get('#scoutingRoster').innerHTML,/30% armor/);
  assert.match(h.nodes.get('#scoutingRoster').innerHTML,/40% slow resistance · breach: 10 HP/);
});

test('All eight ordinary towers select coherent tier-3 and Long Watch visuals from their actual path state',()=>{
  for(const type of ['pepe','shard','relic','mage','archer','alchemist','ballista','druid']) {
    const g=towerGame();g.act(`state.shards=10000;selectTower("${type}");buildOrUpgrade(pads[0])`);
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
  assert.ok(g.act('wavePlans[49].hpScale>wavePlans[19].hpScale && wavePlans[49].hpScale<15'));
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

test('Ballista ignores half remaining armor and pierces only aligned enemies within its tier cap',()=>{
  const g=towerGame();g.act('state.shards=10000;selectTower("ballista");buildOrUpgrade(pads[0]);enemies.push(...[[330,260],[400,260],[420,320],[450,260]].map(([x,y])=>({x,y,hp:1000,armor:.4,radius:10,pathIndex:1,kind:"shieldbearer",reward:1})));updateTowers(.01)');
  assert.equal(g.act('enemies[0].hp'),924);assert.equal(g.act('enemies[1].hp'),1000);
  g.act('upgradeSelected("power");upgradeSelected("power");upgradeSelected("power");towers[0].cooldown=0;updateTowers(.01)');
  assert.ok(g.act('enemies[1].hp<1000'));assert.equal(g.act('enemies[2].hp'),1000);assert.equal(g.act('enemies[3].hp'),1000);
  g.act('enemies[0].hp=1000;enemies[0].acidTimer=2;enemies[0].armorBreak=.2;damageEnemy(enemies[0],100,0,0,.5)');assert.equal(g.act('enemies[0].hp'),910);assert.equal(g.act('enemies[0].armor'),.4);
});

test('Thornkeeper plants bounded patches only during waves, with visible charge feedback',()=>{
  const g=towerGame();g.act('selectTower("druid");buildOrUpgrade(pads[0]);updateTowers(1)');assert.equal(g.act('thornPatches.length'),0);
  g.act('state.waveActive=true;for(let i=0;i<12;i++)updateTowers(2);drawThorns()');
  assert.equal(g.act('thornPatches.length'),3);assert.equal(g.act('thornPatches[0].charges'),10);assert.equal(g.act('thornPatches[0].life'),8);
  assert.ok(g.drawingCalls.some(c=>c.method==='fillText'&&c.args[0]==='10'));
  g.act('updateThorns(8)');assert.equal(g.act('thornPatches.length'),0);
});

test('Fast enemies cannot skip thorn patches, and remaining stationary cannot drain extra charges',()=>{
  const g=towerGame();g.act('selectTower("druid");buildOrUpgrade(pads[0]);state.waveActive=true;plantThorns(towers[0]);enemies.push({...enemyTypes.specter,x:170,y:170,pathIndex:3,speed:600,hp:100,maxHp:100,slowTimer:0,hitFlash:0,spin:0,kind:"specter"});thornPatches[0].x=300;thornPatches[0].y=170;updateEnemies(.3)');
  assert.equal(g.act('enemies[0].hp'),90);assert.equal(g.act('thornPatches[0].charges'),9);
  g.act('thornContact(enemies[0],300,170,300,170);thornContact(enemies[0],300,170,300,170)');assert.equal(g.act('enemies[0].hp'),90);assert.equal(g.act('thornPatches[0].charges'),9);
});

test('Thorn kills cannot breach and moving, selling or replay clears owned patches',()=>{
  const g=towerGame();g.act('state.shards=1000;selectTower("druid");buildOrUpgrade(pads[0]);state.waveActive=true;plantThorns(towers[0]);thornPatches[0].x=relicBase.x;thornPatches[0].y=relicBase.y;enemies.push({...enemyTypes.grunt,x:relicBase.x-1,y:relicBase.y,pathIndex:path.length-1,speed:100,hp:1,slowTimer:0,hitFlash:0,spin:0,kind:"grunt"});updateEnemies(.1);collectDefeatedEnemies()');
  assert.equal(g.act('state.vault'),100);assert.equal(g.act('enemies.length'),0);
  g.act('state.waveActive=false;beginMove();buildOrUpgrade(pads[1])');assert.equal(g.act('thornPatches.length'),0);
  g.act('state.waveActive=true;plantThorns(towers[0]);sellSelected()');assert.equal(g.act('thornPatches.length'),0);
  g.act('buildOrUpgrade(pads[0]);plantThorns(towers[0]);resetGame()');assert.equal(g.act('thornPatches.length'),0);
});

test('Both new defenders have order-independent 5/2/0 upgrades and complete named previews',()=>{
  for(const type of ['ballista','druid'])for(const primary of ['power','special','utility'])for(const secondary of ['power','special','utility'].filter(p=>p!==primary)){
    const build=order=>{const g=towerGame();g.act(`state.shards=10000;selectTower("${type}");buildOrUpgrade(pads[0])`);for(const p of order)g.act(`upgradeSelected("${p}")`);assert.match(g.nodes.get('#towerDetails').textContent,type==='ballista'?/ignores 50%/:/charges/);return g.act('JSON.stringify([towers[0].damage,towers[0].rate,towers[0].range,towers[0].pierceTargets,towers[0].patchCharges,towers[0].patchCap])');};
    assert.equal(build([...Array(5).fill(primary),...Array(2).fill(secondary)]),build([...Array(2).fill(secondary),...Array(5).fill(primary)]));
  }
});

for(const [earlyNew,speed] of [[false,1],[true,1],[false,2]]) test('Ballista and Thornkeeper support an earned 50-wave campaign with '+(earlyNew?'early new defenders':'early heroes')+' at '+speed+'x / 30 Hz',t=>{
  const hz=30;
  const g=towerGame();if(speed===2)g.nodes.get('#speedButton').emit('click');const outcome=JSON.parse(g.act(`
    const order=[0,4,2,6,1,5,7,8,3],loadout={0:"pepe",4:"shard",2:"hero",6:"hero",1:"alchemist",5:"ballista",7:"archer",8:"relic",3:"druid"};
    if(${earlyNew}){loadout[2]="ballista";loadout[6]="druid";loadout[5]="hero";loadout[3]="hero";}
    let ticks=0,novaCasts=0,sawTraps=false,sawBolt=false,defeatedMajors=0; const collectBefore=collectDefeatedEnemies;collectDefeatedEnemies=()=>{defeatedMajors+=enemies.filter(e=>e.hp<=0&&["warboss","tyrant","sovereign"].includes(e.kind)).length;collectBefore();};
    while(state.playing&&ticks<200000){
      for(const i of order){if(!${earlyNew}&&towers.filter(t=>t.type==="hero").length<2&&![0,4,2,6].includes(i))continue;if(!towerAtPad(pads[i])&&state.shards>=towerTypes[loadout[i]].cost){selectTower(loadout[i]);buildOrUpgrade(pads[i]);}}
      if(${earlyNew}?towers.length>=4:towers.filter(t=>t.type==="hero").length===2){
        for(let tier=0;tier<5;tier++)for(const i of order){const tower=towerAtPad(pads[i]);const main=tower?.type==="shard"||tower?.type==="alchemist"||tower?.type==="hero"&&tower.heroSlot===1?"special":"power";if(tower&&tower.tiers[main]===tier&&state.shards>=upgradeCost(tower,main)){buildOrUpgrade(pads[i]);upgradeSelected(main);}}
        for(const tower of towers){const primary=tower.path;const second=tower.type==="hero"?(primary==="power"?"special":"power"):"utility";if(tower.tiers[primary]===5&&tower.tiers[second]<2&&state.shards>=upgradeCost(tower,second)){buildOrUpgrade(tower.pad);upgradeSelected(second);}}
      }
      if(!state.waveActive)startWave();for(const slot of [0,1])if(activateHeroNova(slot))novaCasts++;advanceDefense(1/${hz});sawTraps ||= thornPatches.length>0;sawBolt ||= shots.some(s=>s.type==="ballista");ticks++;
    }
    JSON.stringify({wave:state.wave,vault:state.vault,ticks,novaCasts,sawTraps,sawBolt,defeatedMajors,heroes:towers.filter(t=>t.type==="hero").length});
  `));
  t.diagnostic('Automated earned-shard controller, not human balance approval: '+JSON.stringify(outcome));
  if(speed===2)assert.ok(outcome.ticks<40000);assert.ok(outcome.defeatedMajors>=(earlyNew?2:3));assert.equal(outcome.sawTraps,true);assert.equal(outcome.sawBolt,true);assert.equal(outcome.wave,51);assert.ok(outcome.vault>0);assert.equal(outcome.heroes,2);assert.ok(outcome.novaCasts>0);assert.equal(g.records.length,1);
});

test('Letterboxed battlefield taps map to the original world coordinates',()=>{
  const g=towerGame();g.nodes.get('#gameCanvas').getBoundingClientRect=()=>({left:10,top:20,width:500,height:200});
  assert.equal(g.act('scalePointer({clientX:260,clientY:120}).x'),640);
  assert.equal(g.act('scalePointer({clientX:260,clientY:120}).y'),360);
  assert.ok(g.act('scalePointer({clientX:10,clientY:120}).x<0'));
  const p=JSON.parse(g.act('JSON.stringify(pads[0])')),scale=200/720;
  g.nodes.get('#gameCanvas').emit('click',{clientX:10+(500-1280*scale)/2+p.x*scale,clientY:20+p.y*scale});
  assert.equal(g.act('towers.length'),1);assert.equal(g.act('towers[0].pad===pads[0]'),true);
});

test('Major bosses have fixed guard rosters and spaced, disclosed entrances',()=>{
  const g=towerGame();
  for(const [wave,kind,guards] of [[20,'warboss',['brute','brute','goblin','goblin']],[35,'tyrant',['shieldbearer','shieldbearer','specter','specter']],[50,'sovereign',['shieldbearer','shieldbearer','brute','specter','specter','specter']]]){
    const p=JSON.parse(g.act(`JSON.stringify(wavePlans[${wave-1}])`));
    assert.equal(p.majorBoss,kind);assert.equal(p.bossIndex,Math.floor(p.count/2));assert.deepEqual(p.escort,guards);
    assert.equal(g.act(`arrivalDelay(wavePlans[${wave-1}],${p.bossIndex})`),2);
    for(let n=1;n<=guards.length;n++)assert.equal(g.act(`arrivalDelay(wavePlans[${wave-1}],${p.bossIndex+n})`),1.1);
    assert.match(g.act(`waveBrief(wavePlans[${wave-1}])`),/Strong targeting.*No reinforcements/);
  }
  assert.equal(g.act('arrivalDelay(wavePlans[0],3)'),g.act('wavePlans[0].interval'));
});

test('Strong targeting focuses maximum health in range; First protects against advanced enemies',()=>{
  const g=towerGame();g.act('state.shards=1000;selectTower("ballista");buildOrUpgrade(pads[0]);enemies.push({x:240,y:260,hp:50,maxHp:100,pathIndex:4,kind:"goblin"},{x:250,y:260,hp:10,maxHp:5000,pathIndex:1,kind:"tyrant",boss:true},{x:1200,y:700,hp:99999,maxHp:99999,pathIndex:6,kind:"sovereign",boss:true})');
  assert.equal(g.act('targetFor(towers[0])===enemies[0]'),true);
  g.nodes.get('#targetModeButton').emit('click');assert.equal(g.act('targetFor(towers[0])===enemies[1]'),true);
  g.act('beginMove();buildOrUpgrade(pads[1])');assert.equal(g.act('towers[0].targetMode'),'strong');
  for(let i=0;i<3;i++)g.nodes.get('#targetModeButton').emit('click');assert.equal(g.act('towers[0].targetMode'),'first');
  g.act('selectTower("druid");buildOrUpgrade(pads[2])');assert.equal(g.nodes.get('#targetModeButton').disabled,true);
  g.nodes.get('#targetModeButton').emit('click');assert.equal(g.act('towers[1].targetMode'),'first');
});

test('Last and Close targeting use road progress and tower distance with stable ties and range filtering',()=>{
  const g=towerGame();g.act(`buildOrUpgrade(pads[0]);const t=towers[0];t.range=300;enemies.push(
    {x:t.x+80,y:t.y,hp:20,maxHp:100,pathIndex:5},
    {x:t.x+100,y:t.y,hp:20,maxHp:100,pathIndex:1},
    {x:t.x+20,y:t.y,hp:20,maxHp:100,pathIndex:3},
    {x:t.x+20,y:t.y,hp:0,maxHp:9999,pathIndex:0},
    {x:t.x+301,y:t.y,hp:20,maxHp:9999,pathIndex:0})`);
  g.act('towers[0].targetMode="last"');assert.equal(g.act('targetFor(towers[0])===enemies[1]'),true);
  g.act('towers[0].targetMode="close"');assert.equal(g.act('targetFor(towers[0])===enemies[2]'),true);
  g.act('enemies[1].x=towers[0].x+20');assert.equal(g.act('targetFor(towers[0])===enemies[2]'),true);
  g.act('enemies[1].pathIndex=3');assert.equal(g.act('targetFor(towers[0])===enemies[1]'),true);
  g.act('enemies[0].hp=0;enemies[1].hp=0;enemies[2].hp=0');assert.equal(g.act('targetFor(towers[0])'),null);
});

test('Target modes cycle with contextual hints, preserve combat cooldowns and respect pause and move guards',()=>{
  const g=towerGame();g.act('buildOrUpgrade(pads[0]);startWave();towers[0].cooldown=.5');
  for(const [mode,next] of [['strong','Last'],['last','Close'],['close','First'],['first','Strong']]) {
    g.nodes.get('#targetModeButton').emit('click');assert.equal(g.act('towers[0].targetMode'),mode);
    assert.match(g.nodes.get('#targetModeHint').textContent,new RegExp('Tap for '+next));
    assert.equal(g.act('towers[0].cooldown'),.5);
  }
  g.read('window.EmeraldArcade.isPaused=()=>true');g.nodes.get('#targetModeButton').emit('click');assert.equal(g.act('towers[0].targetMode'),'first');
  g.read('window.EmeraldArcade.isPaused=()=>false');g.act('state.waveActive=false;beginMove()');g.nodes.get('#targetModeButton').emit('click');assert.equal(g.act('towers[0].targetMode'),'first');
});

test('Last and Close targeting survive upgrades, moving and checkpoint resume; unknown modes are rejected',()=>{
  for(const mode of ['last','close']) {
    const g=towerGame();g.act(`state.shards=1000;buildOrUpgrade(pads[0]);towers[0].targetMode="${mode}";upgradeSelected("utility");beginMove();buildOrUpgrade(pads[1]);saveBuildCheckpoint()`);
    const h=checkpointGame(g.saves);h.nodes.get('#resumeDefenseButton').emit('click');
    assert.equal(h.act('towers[0].targetMode'),mode);assert.equal(h.act('towers[0].pad===pads[1]'),true);
    assert.equal(h.act('towers[0].tiers.utility'),1);
    const store=require('../pepe-tower-checkpoint.js');const saved=JSON.parse(g.saves.get(store.KEY));saved.towers[0].targetMode='random';
    assert.equal(store.decode(JSON.stringify(saved),['pepe']),null);
  }
});

test('Boss health and guard counter track the actual fixed wave queue without phantom reinforcements',()=>{
  const g=towerGame();g.act('state.wave=50;startWave();state.spawnLeft=state.waveSpawnTotal-currentWavePlan().bossIndex;spawnEnemy();state.spawnLeft--;updateHud()');
  assert.equal(g.nodes.get('#bossHealth').hidden,false);assert.match(g.nodes.get('#bossHealthLabel').textContent,/Relic Sovereign.*6 guards/);
  const hp=g.act('enemies.find(e=>e.kind==="sovereign").hp');assert.ok(hp>40000&&hp<45000);
  assert.equal(g.nodes.get('#bossHealthBar').value,hp);
  g.act('spawnEnemy();state.spawnLeft--;updateHud()');assert.equal(g.act('enemies.filter(e=>e.isEscort).length'),1);
  assert.match(g.nodes.get('#bossHealthLabel').textContent,/6 guards/);
  g.act('enemies.find(e=>e.isEscort).hp=0;collectDefeatedEnemies();updateHud()');assert.match(g.nodes.get('#bossHealthLabel').textContent,/5 guards/);
  g.act('state.spawnLeft=0;enemies.length=0;updateHud()');assert.equal(g.nodes.get('#bossHealth').hidden,true);
});

test('Every wave gets deterministic spacing within a bounded train budget and fixed boss gaps',()=>{
  const g=towerGame();
  const results=JSON.parse(g.act(`JSON.stringify(wavePlans.map(plan=>{
    let before=0,after=0;for(let i=1;i<plan.count;i++){
      const fixed=plan.majorBoss&&i>=plan.bossIndex&&i<=plan.bossIndex+plan.escort.length+1;
      const base=fixed?(i===plan.bossIndex?2:1.1):plan.interval;
      const delay=arrivalDelay(plan,i);if(delay<base-1e-9||!Number.isFinite(delay))throw Error('Bad spacing');
      if(fixed&&delay!==base)throw Error('Guard cadence changed');before+=base;after+=delay;
    }return {wave:plan.wave,before,after};}))`));
  assert.equal(results.length,50);
  for(const result of results){assert.ok(result.after>result.before);assert.ok(result.after<=result.before*1.25+1e-8);}
  assert.ok(g.act('arrivalDelay(wavePlans[27],3)>=wavePlans[27].interval'));
});

test('Wave spawn timing stays stable across frame rates and never dumps a catch-up burst',()=>{
  for(const wave of [1,10,28,35,50]){
    const profiles=[];
    for(const hz of [30,60]){
      const g=towerGame();const profile=JSON.parse(g.act(`(()=>{
        let elapsed=0;const stamps=[],spawnBefore=spawnEnemy;spawnEnemy=()=>{stamps.push(elapsed);spawnBefore();};state.wave=${wave};startWave();
        const plan=currentWavePlan();while(state.spawnLeft>0&&elapsed<200){elapsed+=1/${hz};updateWave(1/${hz});}
        return JSON.stringify({stamps,count:plan.count,expected:Array.from({length:plan.count-1},(_,i)=>arrivalDelay(plan,i+1)).reduce((a,b)=>a+b,0)});
      })()`));
      assert.equal(profile.stamps.length,profile.count);assert.ok(Math.abs(profile.stamps.at(-1)-profile.expected)<1/hz+1e-7);profiles.push(profile);
    }
    for(let i=0;i<profiles[0].count;i++)assert.ok(Math.abs(profiles[0].stamps[i]-profiles[1].stamps[i])<1/30+1e-7);
  }
  const g=towerGame();g.act('startWave();updateWave(5)');assert.equal(g.act('enemies.length'),2);assert.ok(g.act('state.spawnTimer>0'));
});

test('Compact ordinary art leaves boss size, collision radii and armored damage intact',()=>{
  const g=towerGame();g.act('enemies.push({...enemyTypes.brute,kind:"brute",x:100,y:100,hp:100,maxHp:100,hitFlash:0},{...enemyTypes.sovereign,kind:"sovereign",x:300,y:100,hp:100,maxHp:100,hitFlash:0});for(const k of ["brute","sovereign"]){enemySprites[k].complete=true;enemySprites[k].naturalWidth=512;}drawEnemies();damageEnemy(enemies[0],20,0,0)');
  const images=g.drawingCalls.filter(c=>c.method==='drawImage');assert.equal(images[0].args[3],68);assert.equal(images[1].args[3],156);
  assert.equal(g.act('enemies[0].radius'),23);assert.equal(g.act('enemies[1].radius'),42);assert.equal(g.act('enemies[0].hp'),84);
});

function checkpointGame(savedValues, legacyFixtures=true) {
  const g=game('pepe-tower-defense.js',savedValues,legacyFixtures);
  g.act=expression=>g.read(`window.__towerRead(${JSON.stringify(expression)})`);
  return g;
}

test('Build checkpoints restore both heroes, tower paths, refunds and targeting without rewards or mastery replay',()=>{
  const g=towerGame();g.act(`state.shards=100000;state.score=123456;state.wave=35;state.vault=67;
    for(const [i,type]of ['hero','hero','ballista','druid','alchemist','shard','relic','mage','archer'].entries()){
      selectTower(type);buildOrUpgrade(pads[i]);for(let n=0;n<3;n++)upgradeSelected('power');for(let n=0;n<2;n++)upgradeSelected('special');
    }state.heroNovaCooldowns=[9,16];for(const t of towers){t.cooldown=.37;t.aimAngle=-1;t.combatDamage=123.5+10*pads.indexOf(t.pad);t.combatKills=pads.indexOf(t.pad);if(t.type!=='druid')t.targetMode='strong';}saveBuildCheckpoint();`);
  const before=g.act('JSON.stringify(readBuildCheckpoint())'),stats=g.act('JSON.stringify(towers.map(t=>[t.damage,t.range,t.rate,t.invested,t.heroSlot,t.targetMode]))');
  const mastery=g.saves.get('pepe-tower-defense-mastery-v1');const h=checkpointGame(g.saves);
  assert.equal(h.nodes.get('#resumeDefenseButton').hidden,false);assert.match(h.nodes.get('#resumeDefenseButton').textContent,/35/);
  h.nodes.get('#resumeDefenseButton').emit('click');
  assert.equal(h.act('JSON.stringify(readBuildCheckpoint())'),before);assert.equal(h.act('JSON.stringify(towers.map(t=>[t.damage,t.range,t.rate,t.invested,t.heroSlot,t.targetMode]))'),stats);
  assert.equal(h.act('state.playing&&!state.waveActive&&enemies.length===0&&thornPatches.length===0&&shots.length===0'),true);
  assert.equal(h.act('JSON.stringify(state.heroNovaCooldowns)'),'[9,16]');assert.equal(h.records.length,0);assert.equal(g.saves.get('pepe-tower-defense-mastery-v1'),mastery);
  assert.equal(h.pending(),1);
});

test('Mid-wave refresh rolls back only to the pre-wave build phase, without duplicating earnings or traps',()=>{
  const g=towerGame();g.act('selectTower("druid");buildOrUpgrade(pads[0]);state.heroNovaCooldowns=[12,7];startWave()');const before=g.act('JSON.stringify(readBuildCheckpoint())');
  g.act('state.shards=1000;state.score=9000;state.vault=3;state.heroNovaCooldowns=[0,0];plantThorns(towers[0]);upgradeSelected("power");saveBuildCheckpoint()');g.read('window.emit("pagehide")');
  assert.equal(g.act('JSON.stringify(readBuildCheckpoint())'),before);
  const h=checkpointGame(g.saves);h.nodes.get('#resumeDefenseButton').emit('click');
  assert.equal(h.act('state.wave'),1);assert.equal(h.act('state.shards'),25);assert.equal(h.act('state.vault'),100);assert.equal(h.act('state.score'),0);
  assert.equal(h.act('towers[0].tiers.power'),0);assert.equal(h.act('thornPatches.length'),0);assert.equal(h.act('JSON.stringify(state.heroNovaCooldowns)'),'[12,7]');assert.equal(h.records.length,0);
});

test('Build-break moves, sales and wave-clear rewards persist once, while completed defenses discard checkpoints',()=>{
  const g=towerGame();g.act('selectTower("pepe");buildOrUpgrade(pads[0]);beginMove();buildOrUpgrade(pads[1])');
  assert.equal(g.act('readBuildCheckpoint().towers[0].pad'),1);g.act('sellSelected()');assert.equal(g.act('readBuildCheckpoint().towers.length'),0);assert.equal(g.act('readBuildCheckpoint().shards'),157);
  g.act('state.wave=10;state.shards=100;state.waveActive=true;state.spawnLeft=0;enemies.length=0;updateWave(0);updateWave(0)');
  assert.equal(g.act('readBuildCheckpoint().wave'),11);assert.equal(g.act('readBuildCheckpoint().shards'),275);assert.equal(g.act('state.score'),1500);
  g.act('endGame("Finished");endGame("Duplicate")');assert.equal(g.act('readBuildCheckpoint()'),null);assert.equal(g.records.length,1);
  const h=checkpointGame(g.saves);assert.equal(h.nodes.get('#resumeDefenseButton').hidden,true);
});

test('Checkpoint validation rejects corrupt, impossible and duplicate layouts; blocked saving does not stop play',()=>{
  const store=require('../pepe-tower-checkpoint.js'),types=['pepe','hero','ballista','druid'];
  const base={version:1,wave:2,score:100,shards:180,vault:90,selectedTower:'pepe',heroNovaCooldowns:[0,0],towers:[{type:'pepe',pad:0,heroSlot:null,tiers:{power:0,special:0,utility:0},targetMode:'first',cooldown:0,aimAngle:0}]};
  for(const mutate of [v=>v.wave=51,v=>v.vault=0,v=>v.shards=-1,v=>v.heroNovaCooldowns=[21,0],v=>v.towers.push({...v.towers[0]}),v=>v.towers[0].tiers={power:5,special:3,utility:0},v=>v.towers[0].tiers={power:1,special:1,utility:1},v=>v.towers[0].type='unknown',v=>v.towers[0].combatDamage=-1,v=>v.towers[0].combatKills=1.5,v=>v.towers[0].pad=9,v=>v.towers[0].heroSlot=0,v=>{v.towers=[0,1].map(pad=>({...v.towers[0],pad,type:'hero',heroSlot:0}));}]){
    const v=JSON.parse(JSON.stringify(base));mutate(v);assert.equal(store.decode(JSON.stringify(v),types),null);
  }
  for(const raw of ['{','null','[]','x'.repeat(17000)])assert.equal(store.decode(raw,types),null);
  const valid=store.decode(JSON.stringify(base),types);assert.ok(valid);assert.equal(valid.towers[0].combatDamage,0);assert.equal(valid.towers[0].combatKills,0);assert.notEqual(valid.towers[0].tiers,base.towers[0].tiers);
  const h=checkpointGame(new Map([[store.KEY,'corrupt']]));assert.equal(h.nodes.get('#resumeDefenseButton').hidden,true);
  h.read('localStorage.setItem=()=>{throw new Error("storage blocked")}');h.start();h.act('buildOrUpgrade(pads[0])');
  assert.equal(h.act('state.playing&&towers.length===1'),true);assert.match(h.nodes.get('#checkpointHint').textContent,/unavailable/);
});

test('Two-times wave speed produces the same combat state as matching normal-speed substeps',()=>{
  const setup=()=>{const g=towerGame();g.act('state.wave=10;state.shards=10000;selectTower("druid");buildOrUpgrade(pads[0]);selectTower("ballista");buildOrUpgrade(pads[2]);upgradeSelected("power");upgradeSelected("power");upgradeSelected("power");selectTower("hero");buildOrUpgrade(pads[4]);startWave()');g.frame(0);return g;};
  const normal=setup(),fast=setup();fast.nodes.get('#speedButton').emit('click');
  for(let n=1;n<=800;n++)normal.frame(n*25);for(let n=1;n<=400;n++)fast.frame(n*25);
  const snapshot='JSON.stringify({wave:state.wave,hp:state.vault,shards:state.shards,score:state.score,left:state.spawnLeft,timer:state.spawnTimer,nova:state.heroNovaCooldowns,report:lastWaveReport,metrics:waveMetrics,enemies:enemies.map(e=>[e.kind,e.x,e.y,e.hp,e.pathIndex,e.slowTimer,e.acidTimer]),towers:towers.map(t=>[t.cooldown,t.damage,t.aimAngle,t.combatDamage,t.combatKills]),traps:thornPatches.map(p=>[p.x,p.y,p.charges,p.life])})';
  assert.equal(fast.act(snapshot),normal.act(snapshot));assert.equal(fast.act('combatSpeed'),2);assert.equal(fast.pending(),1);
});

test('Fast mode leaves build breaks at normal speed, respects pause, and resumes at one-times speed',()=>{
  const g=towerGame();g.nodes.get('#speedButton').emit('click');g.act('state.heroNovaCooldowns=[10,10];advanceDefense(.025)');
  assert.equal(g.act('state.heroNovaCooldowns[0]'),9.975);g.act('startWave()');const before=g.act('JSON.stringify([enemies[0].x,state.heroNovaCooldowns,state.spawnTimer])');
  g.read('window.EmeraldArcade.isPaused=()=>true');g.nodes.get('#speedButton').emit('click');g.act('advanceDefense(.025)');
  assert.equal(g.act('combatSpeed'),2);assert.equal(g.act('JSON.stringify([enemies[0].x,state.heroNovaCooldowns,state.spawnTimer])'),before);
  const h=checkpointGame(g.saves);h.nodes.get('#resumeDefenseButton').emit('click');assert.equal(h.act('combatSpeed'),1);assert.equal(h.nodes.get('#speedButton').textContent,'Speed 1×');
});

test('Fast mode stops at wave-clear and fatal-breach boundaries without duplicate rewards',()=>{
  const g=towerGame();g.nodes.get('#speedButton').emit('click');g.act('startWave();enemies.length=0;state.spawnLeft=0;state.heroNovaCooldowns=[10,10];advanceDefense(.025)');
  assert.equal(g.act('state.wave'),2);assert.equal(g.act('state.shards'),247);assert.equal(g.act('state.waveActive'),false);assert.equal(g.act('state.heroNovaCooldowns[0]'),9.975);assert.equal(g.act('readBuildCheckpoint().wave'),2);assert.equal(g.records.length,0);
  const h=towerGame();h.nodes.get('#speedButton').emit('click');h.act('startWave();enemies.length=0;state.vault=1;enemies.push({...enemyTypes.sovereign,kind:"sovereign",x:relicBase.x,y:relicBase.y,pathIndex:path.length-1,hp:100,maxHp:100,slowTimer:0,spin:0,hitFlash:0});advanceDefense(.025)');
  assert.equal(h.act('state.vault'),0);assert.equal(h.records.length,1);assert.equal(h.act('readBuildCheckpoint()'),null);assert.equal(h.nodes.get('#speedButton').disabled,true);
});

test('Combat records count post-armor health removed and credit a lethal hit only once',()=>{
  const g=towerGame();g.act('state.shards=10000;selectTower("ballista");buildOrUpgrade(pads[0]);selectTower("hero");buildOrUpgrade(pads[8]);enemies.push({...enemyTypes.shieldbearer,kind:"shieldbearer",x:330,y:260,hp:100,maxHp:100,pathIndex:1,slowTimer:0,hitFlash:0});damageEnemy(enemies[0],100,0,0,.5,towers[0])');
  assert.equal(g.act('towers[0].combatDamage'),80);assert.equal(g.act('towers[0].combatKills'),0);
  g.act('damageEnemy(enemies[0],100,0,0,.5,towers[0]);damageEnemy(enemies[0],100,0,0,0,towers[1]);collectDefeatedEnemies();collectDefeatedEnemies();updateHud()');
  assert.equal(g.act('towers[0].combatDamage'),100);assert.equal(g.act('towers[0].combatKills'),1);assert.equal(g.act('towers[1].combatDamage'),0);assert.equal(g.act('towers[1].combatKills'),0);
  assert.equal(g.act('state.shards'),9453);assert.equal(g.act('enemies.length'),0);
  g.act('towers[0].combatDamage=248.99999999999997;buildOrUpgrade(pads[0])');assert.equal(g.nodes.get('#towerCombatRecord').textContent,'Total: 249 damage · 1 defeat');
});

test('Splash records include nearby health removed without counting overkill, dead foes or out-of-range foes',()=>{
  const g=towerGame();g.act('state.shards=1000;selectTower("relic");buildOrUpgrade(pads[0]);enemies.push(...[[230,15,.2],[240,10,.4],[245,0,0],[500,30,0]].map(([x,hp,armor])=>({x,y:260,hp,maxHp:100,armor,radius:10,pathIndex:1,kind:"grunt",reward:1})));damageEnemy(enemies[0],100,0,50,0,towers[0])');
  assert.equal(g.act('towers[0].combatDamage'),25);assert.equal(g.act('towers[0].combatKills'),2);assert.equal(g.act('enemies[3].hp'),30);
});

test('Real line shots, chain hits, volleys and piercing arrows all report their actual damage',()=>{
  for(const type of ['ballista','pepe','mage','archer']){
    const g=towerGame();g.act(`state.shards=10000;selectTower("${type}");buildOrUpgrade(pads[0]);for(let i=0;i<3;i++)upgradeSelected('power');enemies.push(...[330,350].map(x=>({...enemyTypes.grunt,kind:'grunt',x,y:260,hp:1000,maxHp:1000,pathIndex:1,slowTimer:0,hitFlash:0})));updateTowers(.01)`);
    const actual=g.act('2000-enemies.reduce((sum,e)=>sum+e.hp,0)');assert.ok(actual>g.act('towers[0].damage'));
    assert.ok(Math.abs(g.act('towers[0].combatDamage')-actual)<1e-8);assert.equal(g.act('towers[0].combatKills'),0);
  }
});

test('Thorn records belong to their planter and survive moves, upgrades and checkpoint restoration',()=>{
  const g=towerGame();g.act('state.shards=1000;selectTower("druid");buildOrUpgrade(pads[0]);state.waveActive=true;plantThorns(towers[0]);const p=thornPatches[0];enemies.push({...enemyTypes.grunt,kind:"grunt",x:p.x,y:p.y,hp:7,maxHp:7});thornContact(enemies[0],p.x,p.y,p.x,p.y);thornContact(enemies[0],p.x,p.y,p.x,p.y);collectDefeatedEnemies();state.waveActive=false;upgradeSelected("power");beginMove();buildOrUpgrade(pads[1])');
  assert.equal(g.act('towers[0].combatDamage'),7);assert.equal(g.act('towers[0].combatKills'),1);
  g.act('startWave();plantThorns(towers[0]);const fresh=thornPatches[0];enemies.push({...enemyTypes.grunt,kind:"grunt",x:fresh.x,y:fresh.y,hp:3,maxHp:3});thornContact(enemies.at(-1),fresh.x,fresh.y,fresh.x,fresh.y);collectDefeatedEnemies()');
  assert.equal(g.act('towers[0].combatDamage'),10);assert.equal(g.act('towers[0].combatKills'),2);
  const h=checkpointGame(g.saves);h.nodes.get('#resumeDefenseButton').emit('click');h.act('buildOrUpgrade(pads[1])');
  assert.equal(h.act('towers[0].combatDamage'),7);assert.equal(h.act('towers[0].combatKills'),1);assert.equal(h.nodes.get('#towerCombatRecord').textContent,'Total: 7 damage · 1 defeat');
  h.act('resetGame()');assert.equal(h.act('towers.length'),0);
});

test('Each Sunwarden owns its Nova record; support effects are not falsely counted as damage',()=>{
  const g=towerGame();g.act('state.shards=10000;selectTower("hero");buildOrUpgrade(pads[0]);buildOrUpgrade(pads[8]);selectTower("alchemist");buildOrUpgrade(pads[4]);state.waveActive=true;enemies.push(...[0,1].map((i)=>({...enemyTypes.grunt,kind:"grunt",x:towers[i].x+10,y:towers[i].y,hp:10+i*2,maxHp:10+i*2})));applyAcid(enemies[0],towers[2]);applySlow(enemies[0],.5,2);activateHeroNova(0)');
  assert.equal(g.act('towers[0].combatDamage'),10);assert.equal(g.act('towers[0].combatKills'),1);assert.equal(g.act('towers[1].combatDamage'),0);
  assert.equal(g.act('towers[2].combatDamage'),0);assert.equal(g.act('towers[2].combatKills'),0);
  g.act('activateHeroNova(1)');assert.equal(g.act('towers[1].combatDamage'),12);assert.equal(g.act('towers[1].combatKills'),1);assert.equal(g.act('JSON.stringify(state.heroNovaCooldowns)'),'[20,20]');
});

test('Wave recap counts defeats and breach types once, preserving existing rewards',()=>{
  const g=towerGame();g.act('startWave();enemies.length=0;state.spawnLeft=0;enemies.push({...enemyTypes.grunt,kind:"grunt",x:200,y:200,hp:0,maxHp:70},{...enemyTypes.shieldbearer,kind:"shieldbearer",x:relicBase.x,y:relicBase.y,pathIndex:path.length-1,hp:100,maxHp:100,speed:60,slowTimer:0,hitFlash:0,spin:0});collectDefeatedEnemies();collectDefeatedEnemies();updateEnemies(.025);updateWave(0);updateWave(0)');
  const report=JSON.parse(g.act('JSON.stringify(lastWaveReport)'));assert.deepEqual(report,{wave:1,cleared:true,defeated:1,leaks:{shieldbearer:1},hpLost:3});
  assert.equal(g.act('state.shards'),260);assert.equal(g.act('state.score'),894);assert.equal(g.act('state.wave'),2);assert.equal(g.act('reportUnread'),true);assert.match(g.nodes.get('#waveReportAdvice').textContent,/Alchemist.*Ballista/);
  g.nodes.get('commandTab:intel').emit('click');assert.equal(g.act('reportUnread'),false);
});

test('Fatal wave recap clamps actual relic health lost and includes uncollected defeated foes',()=>{
  const g=towerGame();g.act('startWave();state.vault=2;enemies.length=0;enemies.push({...enemyTypes.grunt,kind:"grunt",hp:0,maxHp:70,x:200,y:200},{...enemyTypes.sovereign,kind:"sovereign",x:relicBase.x,y:relicBase.y,pathIndex:path.length-1,hp:100,maxHp:100,slowTimer:0,hitFlash:0,spin:0});updateEnemies(.025);endGame("duplicate")');
  assert.equal(g.act('lastWaveReport.cleared'),false);assert.equal(g.act('lastWaveReport.hpLost'),2);assert.equal(g.act('lastWaveReport.defeated'),1);assert.equal(g.act('lastWaveReport.leaks.sovereign'),1);assert.match(g.nodes.get('#waveReportAdvice').textContent,/Strong targeting/);assert.equal(g.records.length,1);assert.equal(g.act('readBuildCheckpoint()'),null);
});

test('Wave recap persists through checkpoint resume while interrupted attempts preserve the previous recap',()=>{
  const g=towerGame();g.act('startWave();enemies.length=0;state.spawnLeft=0;updateWave(0)');const expected=g.act('JSON.stringify(lastWaveReport)');
  g.act('startWave();enemies.length=0;enemies.push({...enemyTypes.specter,kind:"specter",x:relicBase.x,y:relicBase.y,pathIndex:path.length-1,hp:100,maxHp:100,slowTimer:0,hitFlash:0,spin:0});updateEnemies(.025)');
  const h=checkpointGame(g.saves);h.nodes.get('#resumeDefenseButton').emit('click');assert.deepEqual(JSON.parse(h.act('JSON.stringify(lastWaveReport)')),JSON.parse(expected));assert.equal(h.act('state.wave'),2);assert.equal(h.act('state.vault'),100);assert.equal(h.act('waveMetrics'),null);assert.equal(h.nodes.get('#waveReport').hidden,false);
  h.act('resetGame()');assert.equal(h.act('lastWaveReport'),null);assert.equal(h.nodes.get('#waveReport').hidden,true);
});

test('Recap validation rejects unknown foes and impossible counts; coaching remains tied to observed leaks',()=>{
  const g=towerGame(),base=JSON.parse(g.act('JSON.stringify(readBuildCheckpoint())')),store=require('../pepe-tower-checkpoint.js'),types=['pepe','hero','ballista','druid'],kinds=['grunt','specter','shieldbearer','sovereign'];
  base.lastWaveReport={wave:1,cleared:true,defeated:2,leaks:{grunt:1},hpLost:1};assert.ok(store.decode(JSON.stringify(base),types,kinds));
  for(const mutate of [v=>v.leaks={unknown:1},v=>v.leaks={grunt:-1},v=>v.hpLost=101,v=>v.defeated=88,v=>v.cleared='yes',v=>v.wave=51]){const copy=JSON.parse(JSON.stringify(base));mutate(copy.lastWaveReport);assert.equal(store.decode(JSON.stringify(copy),types,kinds),null);}
  assert.match(g.act('waveAdvice({cleared:true,leaks:{}})'),/Clean defense/);assert.match(g.act('waveAdvice({cleared:true,leaks:{specter:1}})'),/Specters resist slows/);assert.match(g.act('waveAdvice({cleared:true,leaks:{runner:1}})'),/Fast foes/);
});

test('Arrival forecast follows every authored queue and lane without changing combat or saves',()=>{
  for(const map of require('../pepe-tower-maps.js').maps){
    const g=checkpointGame();g.act(`chooseBattleground('${map.id}')`);g.start();
    const before=g.act('JSON.stringify([state,enemies,towers])');const saves=JSON.stringify([...g.saves]);
    assert.equal(g.act(`wavePlans.every(plan=>{state.wave=plan.wave;state.waveActive=false;const opening=arrivalForecast();if(opening.rows[0].eta!==0||opening.queued!==plan.count)return false;
      state.waveActive=true;state.waveSpawnTotal=plan.count;
      for(let i=0;i<plan.count;i++){state.spawnLeft=plan.count-i;state.spawnTimer=.37;const f=arrivalForecast();const row=f.rows[0];if(row.index!==i||row.kind!==plan.kinds[i]||row.routeId!==mapCatalog.routeFor(activeMap,plan,i)||row.eta!==.37)return false;
        if(f.rows.length>1&&Math.abs(f.rows[1].eta-(.37+arrivalDelay(plan,i+1)))>1e-9)return false;
      }return true;})`),true,map.id);
    g.act(`Object.assign(state,JSON.parse(${JSON.stringify(before)})[0]);arrivalForecast();updateArrivalForecast()`);
    assert.equal(g.act('JSON.stringify([state,enemies,towers])'),before);
    assert.equal(JSON.stringify([...g.saves]),saves);assert.equal(g.records.length,0);
  }
});

test('Arrival forecast scales ETA with speed, keeps boss guards together, and reports resolved arrivals',()=>{
  const g=checkpointGame();g.act('chooseBattleground("twinroot-grove")');g.start();
  for(const [wave,lane] of [[20,0],[35,1],[50,0]]){
    g.act(`state.wave=${wave};state.waveActive=false;combatSpeed=1`);
    const eta=g.act('arrivalForecast().boss.eta');assert.ok(eta>0);
    g.act('combatSpeed=2');assert.equal(g.act('arrivalForecast().boss.eta'),eta/2);
    g.act('startWave();state.spawnLeft=state.waveSpawnTotal-currentWavePlan().bossIndex;state.spawnTimer=2;setCommandView("intel");updateHud()');
    assert.equal(g.act('arrivalForecast().boss.eta'),1);assert.equal(g.act('arrivalForecast().boss.routeId'),lane);
    assert.equal(g.act('arrivalForecast().rows.slice(1).every(row=>row.guard&&row.routeId===arrivalForecast().boss.routeId)'),true);
    assert.match(g.nodes.get('#bossHealthLabel').textContent,/in ~1.0s/);
    g.act('state.waveActive=false');
  }
  g.act('state.spawnLeft=0;state.waveActive=true;enemies.length=0;updateHud()');
  assert.equal(g.act('arrivalForecast().boss'),null);assert.match(g.nodes.get('#arrivalQueue').innerHTML,/All arrivals have entered/);
  assert.equal(g.nodes.get('#arrivalProgress').value,g.act('currentWavePlan().count'));
  g.read('window.EmeraldArcade.isPaused=()=>true');g.act('updateHud()');assert.match(g.nodes.get('#arrivalHint').textContent,/Paused/);
  g.act('state.playing=false;updateHud()');assert.equal(g.nodes.get('#arrivalPanel').hidden,true);
});
