const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function game(blocked=false,raw=null){
 const saves=new Map([['emerald-arcade-v1','unrelated-arcade'],['emerald-arcade-pets-v1','unrelated-pet']]),nodes=new Map();
 if(raw!==null)saves.set("satoshi-system-save-v1",raw);
 const node=()=>({dataset:{},style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),appendChild(){},remove(){}});
 const window={setTimeout(){},addEventListener(){},AudioContext:class{constructor(){throw Error('no audio');}},EmeraldArcade:{isPaused:()=>false,isMuted:()=>false,beginSession(){throw Error('session unavailable');}}};
 const document={body:node(),activeElement:null,querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);},querySelectorAll:()=>[],createElement:node,addEventListener(){}};
 const context=vm.createContext({window,document,localStorage:{getItem:key=>saves.get(key)??null,setItem:(key,value)=>{if(blocked)throw Error('quota');saves.set(key,value);},removeItem:key=>saves.delete(key)},confirm:()=>true});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../satoshi-system.js'),'utf8'),context);
 return {saves,nodes,window,unblock(){blocked=false;},read:expression=>vm.runInContext(expression,context)};
}
test('Satoshi blocked writes and unavailable audio leave a balanced playable tab and warning',()=>{
 const h=game(true);
 assert.match(h.nodes.get('#saveStatus').textContent,/held only in this tab/);
 assert.doesNotThrow(()=>h.read('for(let i=0;i<8;i++)advanceTick();buy("relay")'));
 assert.equal(h.read('state.worlds.relay'),1);assert.equal(h.read('state.treasury'),0);
 assert.equal(h.read('window.__satoshiSystemDebug.invariantHolds()'),true);
 assert.equal(h.saves.get('emerald-arcade-v1'),'unrelated-arcade');
 assert.equal(h.saves.get('emerald-arcade-pets-v1'),'unrelated-pet');
});
test('Satoshi storage recovery saves current tab progress and clears the warning',()=>{
 const h=game(true);h.read('advanceTick();advanceTick()');
 h.unblock();h.read('saveState()');
 assert.equal(h.nodes.get('#saveStatus').textContent,'Saved on this device.');
 assert.equal(JSON.parse(h.saves.get('satoshi-system-save-v1')).ticks,2);
});


test('Satoshi fallback simulation preserves unreadable original saves through actions and save attempts',()=>{
 for(const raw of ['{broken','null','[]','"not-a-save"']) {
  const h=game(false,raw);
  assert.match(h.nodes.get('#saveStatus').textContent,/Original save cannot be read/);
  h.read('for(let i=0;i<8;i++)advanceTick();buy("relay");saveState()');
  assert.equal(h.read('state.worlds.relay'),1);
  assert.equal(h.read('window.__satoshiSystemDebug.invariantHolds()'),true);
  assert.equal(h.saves.get('satoshi-system-save-v1'),raw);
 }
});
test('Satoshi requires a fresh load after restoration so temporary progress cannot overwrite recovery',()=>{
 const h=game(false,'{broken');h.read('advanceTick()');
 const valid=game().saves.get('satoshi-system-save-v1');
 h.saves.set('satoshi-system-save-v1',valid);h.read('advanceTick();saveState()');
 assert.equal(h.saves.get('satoshi-system-save-v1'),valid);
 const fresh=game(false,valid);assert.equal(fresh.read('recoveryRequired'),false);
 fresh.read('advanceTick()');assert.equal(JSON.parse(fresh.saves.get('satoshi-system-save-v1')).ticks,1);
});


test('Satoshi guided goal starts with the first world and completes through earned clicks and purchases',()=>{
 const h=game();assert.match(h.read('goalAdvice()'),/Relay Moon/);
 const result=h.read(`(()=>{const plan=['routing','routing','routing','relay','merchant','resilience','expansion','forge'];let index=0;for(let ticks=0;ticks<500&&!state.goalComplete;ticks++){advanceTick();while(index<plan.length && unlockState(plan[index]).unlocked && state.treasury>=costFor(plan[index]))buy(plan[index++]);if(!window.__satoshiSystemDebug.invariantHolds())throw Error('ledger');}return {ticks:state.ticks,complete:state.goalComplete,steps:goalSteps().filter(step=>step.done).length,coverage:reserveCoverage()}})()`);
 assert.equal(result.complete,true);assert.ok(result.ticks<=150);assert.equal(result.steps,5);assert.ok(result.coverage>=3);
 assert.equal(h.nodes.get('#goalProgress').value,5);
 assert.equal(h.saves.get('emerald-arcade-v1'),'unrelated-arcade');
});


test('Satoshi completion record retry refreshes once without another played-game count',()=>{
 const h=game();const calls=[];
 h.window.EmeraldArcade.recordAndNotify=()=>{throw Error('blocked');};
 h.read("const goalPlan=['routing','routing','routing','relay','merchant','resilience','expansion','forge'];let goalIndex=0;for(let i=0;i<500&&!state.goalComplete;i++){advanceTick();while(goalIndex<goalPlan.length&&unlockState(goalPlan[goalIndex]).unlocked&&state.treasury>=costFor(goalPlan[goalIndex]))buy(goalPlan[goalIndex++]);}");
 assert.equal(h.read('state.goalComplete'),true);assert.equal(h.read('state.arcadeRecorded'),false);
 assert.equal(h.nodes.get('#retryArcadeRecord').hidden,false);
 h.window.EmeraldArcade.recordAndNotify=(game,payload)=>calls.push({game,payload});
 assert.equal(h.read('recordCompletion(false)'),true);h.read('saveState();render()');
 assert.equal(h.nodes.get('#retryArcadeRecord').hidden,true);
 assert.equal(h.read('recordCompletion(false)'),false);assert.equal(calls.length,1);
 assert.equal(calls[0].game,'satoshiSystem');assert.equal(calls[0].payload.played,false);
 assert.equal(JSON.parse(h.saves.get('satoshi-system-save-v1')).arcadeRecorded,true);
});
