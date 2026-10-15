const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {create}=require('./record-store.js');
test('actual missed corner synchronizes HUD/result and keeps restart record without stale turn cues',()=>{
 const nodes=new Map(),keys={},disk=new Map();
 const element=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,style:{},setAttribute(){},addEventListener(){},click(){this.onclick?.();}});return nodes.get(id);};
 let frame,now=0;const window={TempleRecords:{create},templeCharacter:{loaded:true},addEventListener:(type,fn)=>keys[type]=fn};
 const context={window,document:{querySelector:()=>({getContext:()=>({}),addEventListener(){}}),getElementById:element,querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem:key=>disk.get(key)??null,setItem:(key,value)=>disk.set(key,value)},Image:class{},ResizeObserver:class{observe(){}},performance:{now:()=>now},requestAnimationFrame:fn=>frame=fn,devicePixelRatio:1};
 vm.runInNewContext(fs.readFileSync(__dirname+'/turns.js','utf8'),context);vm.runInNewContext(fs.readFileSync(__dirname+'/game.js','utf8'),context);
 const press=key=>keys.keydown({key,repeat:false,preventDefault(){}});
 element('start').onclick();press('ArrowRight');
 for(let tick=0;tick<1500&&window.templeRunDiagnostics().state!=='dead';tick++){
  const turn=window.templeRunDiagnostics().turn;if(turn.completed===0&&turn.window&&!turn.accepted)press('ArrowLeft');
  now+=40;frame(now);
 }
 const result=window.templeRunDiagnostics();assert.equal(result.state,'dead');assert.equal(result.turn.completed,1);assert.equal(result.turn.failed,true);
 assert.equal(Math.floor(result.distance),900);assert.equal(parseInt(element('distance').innerHTML),900);assert.match(element('message').textContent,/900 m escaped/);
 assert.equal(element('title').textContent,'Missed the right corner.');assert.equal(element('toast').textContent,'');assert.equal(element('turn-warning').hidden,true);
 assert.equal(JSON.parse(disk.get('pepe-temple-run-v1')).best,900);
 element('start').onclick();assert.equal(window.templeRunDiagnostics().distance,0);assert.equal(window.templeRunDiagnostics().best,900);assert.equal(window.templeRunDiagnostics().turn.completed,0);
});
