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
