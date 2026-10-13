const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function game(saved) {
 const saves=new Map(saved===undefined?[]:[['etc-rocket-simulator-v1',JSON.stringify(saved)]]);
 const node=()=>({style:{},classList:{add(){},remove(){}},addEventListener(){},appendChild(){},getContext(){return {};}});
 const nodes=new Map();
 const context=vm.createContext({document:{querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);},createElement:node},window:{AudioContext:class{constructor(){throw new Error('no audio');}}},localStorage:{getItem:key=>saves.get(key)??null,setItem:(key,value)=>saves.set(key,value)},Image:class{},URLSearchParams,location:{search:''},performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){},clearTimeout(){}});
 vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../etc-rocket-simulator.js'),'utf8'),context);
 return {saves,nodes,read:expression=>vm.runInContext(expression,context)};
}
test('rocket spending to zero survives reload without restoring starter currency',()=>{
 const h=game({shards:90});
 assert.doesNotThrow(()=>h.read('buyUpgrade("engine")'));
 const saved=JSON.parse(h.saves.get('etc-rocket-simulator-v1'));
 assert.equal(saved.shards,0);assert.equal(saved.upgrades.engine,2);
 const fresh=game(saved);assert.equal(fresh.read('save.shards'),0);
 fresh.read('buyUpgrade("fuel")');assert.equal(fresh.read('save.upgrades.fuel'),1);
});
test('rocket invalid numeric saves normalize and unknown upgrades do nothing',()=>{
 const h=game({shards:-10,bestDistance:'bad',runs:2.9,upgrades:{engine:'bad',fuel:0}});
 assert.equal(h.read('save.shards'),0);assert.equal(h.read('save.bestDistance'),0);
 assert.equal(h.read('save.runs'),2);assert.equal(h.read('save.upgrades.engine'),1);
 assert.equal(h.read('save.upgrades.fuel'),1);
 assert.doesNotThrow(()=>h.read('buyUpgrade("missing")'));
 assert.equal(game().read('save.shards'),180);
});


test('natural starter flight banks salvage once and supports upgrade then relaunch',()=>{
 const h=game();h.read('launch()');
 for(let i=0;i<3000 && h.read('state.mode')==='flying';i++)h.read('updateFlight(1/60)');
 assert.equal(h.read('state.mode'),'destroyed');
 assert.equal(h.read('save.runs'),1);
 assert.ok(h.read('state.distance')>800);
 assert.ok(h.read('save.shards')>180);
 const before=h.read('save.shards');h.read('endFlight("duplicate")');assert.equal(h.read('save.shards'),before);
 h.read('buyUpgrade("fuel")');assert.equal(h.read('save.upgrades.fuel'),2);
 h.read('launch()');assert.equal(h.read('state.distance'),0);assert.equal(h.read('state.fuel'),100);
 assert.equal(h.read('state.mode'),'flying');
});
test('blocked saves roll back upgrades and still expose flight results and relaunch',()=>{
 const h=game({shards:90});h.read('localStorage.setItem=()=>{throw new Error("quota")};buyUpgrade("engine")');
 assert.equal(h.read('save.shards'),90);assert.equal(h.read('save.upgrades.engine'),1);
 h.read('launch()');
 for(let i=0;i<3000 && h.read('state.mode')==='flying';i++)h.read('updateFlight(1/60)');
 assert.equal(h.read('state.mode'),'destroyed');
 assert.equal(h.nodes.get('#launchButton').disabled,false);
 assert.equal(h.nodes.get('#missionEyebrow').textContent,'Salvage Not Saved');
 assert.equal(h.read('state.fuel'),0);
 h.read('launch()');assert.equal(h.read('state.mode'),'flying');
});


test('rocket sector goals advance at actual boundaries and finish at the final sector',()=>{
 const h=game();
 assert.match(h.read('sectorGoal(0).text'),/Emerald Belt/);
 assert.equal(h.read('sectorGoal(400).progress'),.5);
 assert.match(h.read('sectorGoal(800).text'),/Ancient Satellite Field/);
 assert.equal(h.read('sectorGoal(800).progress'),0);
 assert.equal(h.read('sectorGoal(750000).progress'),1);
 assert.match(h.read('sectorGoal(750000).text'),/all nine sectors/);
});


test('rocket fixed-step telemetry matches equal flight time at 30, 60 and 120 FPS',()=>{
 const snapshots=[];
 for(const fps of [30,60,120]) {
  const h=game();h.read('launch()');
  for(let frame=1;frame<=fps*10;frame++)h.read(`advanceFrame(${frame*1000/fps})`);
  snapshots.push(JSON.parse(h.read('JSON.stringify({distance:state.distance,fuel:state.fuel,heat:state.heat,hull:state.hull,elapsed:state.elapsed})')));
 }
 for(const snapshot of snapshots.slice(1))for(const key of Object.keys(snapshot))assert.ok(Math.abs(snapshot[key]-snapshots[0][key])<1e-7,key);
});
test('rocket bounded frame gaps cannot fast-forward an expedition',()=>{
 const h=game();h.read('launch();advanceFrame(10000)');
 assert.ok(Math.abs(h.read('state.elapsed')-.3)<1e-8);
 const before=h.read('state.distance');
 h.read('advanceFrame(10000)');assert.equal(h.read('state.distance'),before);
});


test('rocket full fixed-step flights produce the same failure and salvage across frame rates',()=>{
 const reports=[];
 for(const fps of [30,60,120]) {
  const h=game();h.read('launch()');
  for(let frame=1;frame<=fps*40 && h.read('state.mode')==='flying';frame++)h.read(`advanceFrame(${frame*1000/fps})`);
  assert.equal(h.read('state.mode'),'destroyed');
  reports.push(h.read('JSON.stringify({reason:state.failureReason,distance:state.distance,shards:save.shards,runs:save.runs})'));
 }
 assert.equal(reports[1],reports[0]);assert.equal(reports[2],reports[0]);
});


test('rocket debrief points to the failed system with actual upgrade cost and affordability',()=>{
 const h=game({shards:0});
 assert.equal(h.read('recommendedUpgrade("Fuel lattice exhausted")'),'fuel');
 assert.equal(h.read('recommendedUpgrade("Reactor heat exceeded cooling")'),'cooling');
 assert.equal(h.read('recommendedUpgrade("Frame could not support velocity")'),'frame');
 assert.match(h.read('flightAdvice("Fuel lattice exhausted")'),/75 more salvage shards needed/);
 h.read('save.shards=75');
 assert.match(h.read('flightAdvice("Fuel lattice exhausted")'),/You can afford/);
 h.read('buyUpgrade("fuel")');
 assert.match(h.read('flightAdvice("Fuel lattice exhausted")'),/Level 3 costs 92/);
});


test('rocket build telemetry shares actual flight system formulas',()=>{
 const h=game();
 assert.equal(h.read('rocketSystems().capacity'),27.5);
 assert.equal(h.read('rocketSystems().topSpeed'),103);
 assert.match(h.nodes.get('#buildTelemetry').textContent,/frame stress begins above 41/);
 h.read('buyUpgrade("fuel")');
 assert.equal(h.read('rocketSystems().capacity'),35);
 assert.match(h.nodes.get('#buildTelemetry').textContent,/Fuel duration 11.7s/);
});
test('a supplied late-game rocket reaches all sectors through natural flight physics',()=>{
 const h=game({shards:0,upgrades:{engine:1,fuel:30,frame:14,cooling:10,nav:24,magnet:1}});
 h.read('launch()');
 h.read('for(let step=0;step<40000 && state.mode==="flying";step++)updateFlight(1/120)');
 assert.equal(h.read('state.mode'),'destroyed');
 assert.equal(h.read('state.zoneIndex'),8);
 assert.equal(h.nodes.get('#missionEyebrow').textContent,'Expedition Campaign Complete');
 assert.match(h.nodes.get('#missionTitle').textContent,/Beyond Canon reached/);
 assert.match(h.nodes.get('#missionText').textContent,/All nine sectors discovered/);
 assert.equal(h.nodes.get('#launchButton').disabled,false);
 assert.equal(h.read('state.failureReason'),'Fuel lattice exhausted');
 assert.ok(h.read('state.distance')>=750000);
 assert.match(h.read('sectorGoal(state.distance).text'),/all nine sectors/);
 assert.equal(h.read('save.runs'),1);
});


test('a focused earned-salvage route reaches Beyond Canon within a bounded arcade campaign',()=>{
 const h=game();
 const result=h.read(`(()=>{let activeTime=0;for(let run=1;run<=40;run++){
  while(true){const keys=['fuel','nav','magnet','frame','cooling'].filter(k=>k!=='frame'||save.upgrades.frame<13).filter(k=>k!=='cooling'||save.upgrades.cooling<9).sort((a,b)=>upgradeCost(a)-upgradeCost(b));const key=keys.find(k=>upgradeCost(k)<=save.shards);if(!key)break;buyUpgrade(key)}
  launch();for(let step=0;step<120000 && state.mode==='flying';step++)updateFlight(1/120);
  activeTime+=state.elapsed/EXPEDITION_RATE;
  if(state.distance>=750000)return {runs:run,activeTime,distance:state.distance};
 }return null})()`);
 assert.ok(result,'earned route should reach final sector');
 assert.ok(result.runs<=35);assert.ok(result.activeTime<1800);
 assert.ok(result.distance>=750000);
});
test('rocket upgrade previews show existing speed, range and salvage tradeoffs',()=>{
 const h=game();
 assert.match(h.read('upgradePreview("engine")'),/103 → 141/);
 assert.match(h.read('upgradePreview("nav")'),/1.12× → 1.24×/);
 assert.match(h.read('upgradePreview("magnet")'),/1.13× → 1.26×/);
});


test('rocket sector journal derives legacy discoveries and keeps completed flights after reload',()=>{
 const legacy=game({shards:0,bestDistance:3000});
 assert.equal(legacy.read('sectorRecords().filter(zone=>zone.reached).length'),3);
 assert.equal(legacy.nodes.get('#sectorCount').textContent,'3 / 9');
 const h=game();h.read('launch();for(let step=0;step<10000 && state.mode==="flying";step++)updateFlight(1/120)');
 assert.equal(h.nodes.get('#sectorCount').textContent,'3 / 9');
 const fresh=game(JSON.parse(h.saves.get('etc-rocket-simulator-v1')));
 assert.equal(fresh.nodes.get('#sectorCount').textContent,'3 / 9');
 assert.match(fresh.nodes.get('#sectorJournal').innerHTML,/Ancient Satellite Field/);
 const complete=game({bestDistance:750000});
 assert.equal(complete.nodes.get('#sectorCount').textContent,'9 / 9');
});


test('rocket unreadable save shapes block launch and spending without replacing original data',()=>{
 for(const saved of [null,[],"broken"]) {
  const h=game(saved);const raw=h.saves.get('etc-rocket-simulator-v1');
  h.read('launch();buyUpgrade("engine")');
  assert.equal(h.read('state.mode'),'ready');
  assert.equal(h.saves.get('etc-rocket-simulator-v1'),raw);
  assert.equal(h.nodes.get('#launchButton').disabled,true);
  assert.equal(h.nodes.get('#missionEyebrow').textContent,'Save Recovery Needed');
 }
});
test('rocket corruption during an open session latches recovery until a fresh load',()=>{
 const h=game();h.saves.set('etc-rocket-simulator-v1','{broken');
 h.read('buyUpgrade("engine");launch()');
 assert.equal(h.saves.get('etc-rocket-simulator-v1'),'{broken');
 const restored={shards:77,bestDistance:3000};
 h.saves.set('etc-rocket-simulator-v1',JSON.stringify(restored));
 h.read('buyUpgrade("fuel");launch()');
 assert.equal(h.saves.get('etc-rocket-simulator-v1'),JSON.stringify(restored));
 const fresh=game(restored);fresh.read('launch()');
 assert.equal(fresh.read('save.shards'),77);assert.equal(fresh.read('state.mode'),'flying');
});


test('rocket backup restore preserves damaged data and reloads the prior good snapshot',()=>{
 const h=game({shards:90});h.read('buyUpgrade("engine")');
 assert.equal(h.read('readBackup().value.shards'),90);
 h.saves.set('etc-rocket-simulator-v1','{damaged');h.read('launch()');
 assert.equal(h.read('restoreBackup().ok'),true);
 assert.equal(h.saves.get('etc-rocket-simulator-v1-before-restore'),'{damaged');
 const restored=JSON.parse(h.saves.get('etc-rocket-simulator-v1'));
 assert.equal(restored.shards,90);assert.equal(restored.upgrades.engine,1);
 assert.equal(game(restored).read('recoveryRequired'),false);
});
test('rocket restore rejects invalid backups, active flights and preservation write failures',()=>{
 const h=game();assert.equal(h.read('restoreBackup().ok'),false);
 h.read('buyUpgrade("fuel");launch()');assert.equal(h.read('restoreBackup().ok'),false);
 h.read('state.mode="ready"');const before=h.saves.get('etc-rocket-simulator-v1');
 h.read('localStorage.setItem=()=>{throw new Error("quota")};');
 assert.equal(h.read('restoreBackup().ok'),false);
 assert.equal(h.saves.get('etc-rocket-simulator-v1'),before);
});
