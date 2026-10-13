const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function game(roll = .1) {
 const nodes=new Map(),listeners=new Map(),records=[];
 const node=()=>({dataset:{},style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},querySelectorAll(){return [];},getContext(){return {};}});
 const window={addEventListener(type,fn){listeners.set(type,fn);},AudioContext:class{constructor(){throw new Error('audio unavailable');}},EmeraldArcade:{load:()=>({}),beginSession(){},recordAndNotify:(game,record)=>records.push(record),isMuted:()=>false,isPaused:()=>false}};
 const math=Object.create(Math);math.random=()=>roll;
 const context=vm.createContext({window,document:{querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);},createElement:node},Image:class{addEventListener(){}},performance:{now:()=>0},requestAnimationFrame(){},Math:math});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../etc-unstable-launch.js'),'utf8'),context);
 return {nodes,window,listeners,records,read:expression=>vm.runInContext(expression,context)};
}
test('unstable launch can start, lock, replay and naturally crash with unavailable audio',()=>{
 const h=game();assert.doesNotThrow(()=>h.read('startLaunch();update(.5);lockPrice()'));
 assert.equal(h.read('state.mode'),'locked');assert.equal(h.records.length,1);
 h.read('lockPrice()');assert.equal(h.records.length,1);
 h.read('startLaunch();for(let i=0;i<2000 && state.mode==="launching";i++)update(1/120)');
 assert.equal(h.read('state.mode'),'exploded');assert.equal(h.records.length,2);
 assert.equal(h.records[1].score,0);h.read('explode()');assert.equal(h.records.length,2);
 h.read('handleAction()');assert.equal(h.read('state.mode'),'launching');
});
test('held Space, interactive focus and shared pause cannot trigger run transitions',()=>{
 const h=game();const key=h.listeners.get('keydown');
 key({code:'Space',repeat:true,preventDefault(){throw Error('repeat should be ignored');}});
 assert.equal(h.read('state.mode'),'ready');
 key({code:'Space',repeat:false,target:{closest(){return {};}}});
 assert.equal(h.read('state.mode'),'ready');
 key({code:'Space',repeat:false,preventDefault(){}});assert.equal(h.read('state.mode'),'launching');
 h.window.EmeraldArcade.isPaused=()=>true;h.read('handleAction()');assert.equal(h.read('state.mode'),'launching');
});
test('failed arcade record saving leaves lock results and replay available',()=>{
 const h=game();h.window.EmeraldArcade.recordAndNotify=()=>{throw Error('quota');};
 h.read('startLaunch();update(.5);lockPrice()');
 assert.equal(h.read('state.mode'),'locked');
 assert.match(h.nodes.get('#resultText').textContent,/could not be saved/);
 h.read('handleAction()');assert.equal(h.read('state.mode'),'launching');
});


test('seeded crashes stop at the exact threshold across 30, 60 and 120 FPS',()=>{
 for(const roll of [.1,.8,.995]) {
  const reports=[];
  for(const fps of [30,60,120]) {
   const h=game(roll);h.read('startLaunch()');
   for(let frame=1;frame<=fps*30 && h.read('state.mode')==='launching';frame++)h.read(`advanceFrame(${frame*1000/fps})`);
   assert.equal(h.read('state.mode'),'exploded');
   assert.equal(h.read('state.price'),h.read('state.crashPrice'));
   assert.equal(h.read('state.stability'),0);
   assert.equal(h.records.length,1);
   reports.push(h.read('JSON.stringify({elapsed:state.elapsed,peak:state.peakPrice})'));
  }
  assert.equal(reports[1],reports[0]);assert.equal(reports[2],reports[0]);
 }
});
test('equal-time lock outcomes match across frame rates and long gaps stay bounded',()=>{
 const reports=[];
 for(const fps of [30,60,120]) {
  const h=game();h.read('startLaunch()');
  for(let frame=1;frame<=fps;frame++)h.read(`advanceFrame(${frame*1000/fps})`);
  h.read('lockPrice()');reports.push(JSON.stringify(h.records[0]));
 }
 assert.equal(reports[1],reports[0]);assert.equal(reports[2],reports[0]);
 const stalled=game();stalled.read('startLaunch();advanceFrame(10000)');
 assert.ok(Math.abs(stalled.read('state.elapsed')-.1)<1e-8);
});
