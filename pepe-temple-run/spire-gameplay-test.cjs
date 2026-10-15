const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function fixture(){const elements=new Map(),listeners={},events=[],canvas={getContext:()=>({}),getBoundingClientRect:()=>({width:0,height:0}),addEventListener(){},setPointerCapture(){}};const element=id=>{if(!elements.has(id))elements.set(id,{style:{},setAttribute(){},addEventListener(){},click(){this.onclick?.();}});return elements.get(id);};let frame,now=0;const window={templeCharacter:{loaded:true},TempleFeedback:{reset(){events.length=0;},update(){},diagnostics(){return {};},emit(type,event){events.push({type,...event});},draw(){}},addEventListener:(type,fn)=>listeners[type]=fn};const context={window,document:{querySelector:()=>canvas,querySelectorAll:()=>[],getElementById:element,addEventListener(){}},Image:class{},ResizeObserver:class{observe(){}},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>now},requestAnimationFrame:fn=>frame=fn,devicePixelRatio:1};vm.runInNewContext(fs.readFileSync(__dirname+'/turns.js','utf8'),context);vm.runInNewContext(fs.readFileSync(__dirname+'/game.js','utf8'),context);element('start').onclick();return {events,element,read:()=>window.templeRunDiagnostics(),press:key=>listeners.keydown({key,repeat:false,preventDefault(){}}),step(){now+=40;frame(now);}};}
function run(mode){const f=fixture(),trace=[],seen=new Set();let saves=0,sawSpire=false,aimed=false;
 for(let tick=0;tick<2200;tick++){
  const d=f.read();if(d.state==='dead')break;
  const hazards=d.objects.filter(o=>['gap','gate','idol','boulder','spire'].includes(o.type)&&!o.hit);for(const o of hazards)if(o.type==='spire'){assert.equal(d.realm,'corrupt');assert.ok(o.pattern>=3);sawSpire=true;}
  if(!seen.has(d.row)){seen.add(d.row);trace.push({row:d.row,route:d.route,types:hazards.map(o=>o.type)});}for(const z of new Set(hazards.map(o=>o.z)))assert.ok(new Set(hazards.filter(o=>o.z===z).map(o=>o.lane)).size<3);
  if(d.turn.window&&!d.turn.accepted)f.press(d.turn.direction==='left'?'ArrowLeft':'ArrowRight');
  const next=hazards.filter(o=>o.z>7).sort((a,b)=>a.z-b.z)[0];if(next&&next.z<45){
   if(next.pattern===0&&next.type==='gap'){if(next.z<20&&!d.action)f.press(' ');}
   else if(next.pattern===1&&next.type==='gate'){if(next.z<20&&!d.action)f.press('ArrowDown');}
   else{const group=hazards.filter(o=>Math.abs(o.z-next.z)<.01),spire=group.find(o=>o.type==='spire'),collide=spire&&(mode==='death'||mode==='shield'&&(d.shield||saves>0));let target;
    if(collide){target=spire.lane;aimed=true;if(!d.action)f.press(' ');}else target=[0,1,2].find(l=>!group.some(o=>o.lane===l));while(target!==f.read().lane)f.press(target<f.read().lane?'ArrowLeft':'ArrowRight');
   }
  }
  const beforeSaves=f.events.filter(e=>e.type==='shield').length;f.step();const after=f.read();saves=f.events.filter(e=>e.type==='shield').length;if(saves>beforeSaves){assert.equal(after.shield,false);assert.equal(after.state,'running','Shield fails to save thorn collision');}
 }
 return {f,trace,saves,sawSpire,aimed};
}
const a=run('dodge'),b=run('dodge');assert.equal(a.f.read().state,'running');assert.ok(a.sawSpire);assert.equal(JSON.stringify(a.trace),JSON.stringify(b.trace),'Spire rows diverge across seeded replays');assert.equal(a.saves,0);assert.ok(a.trace.some(row=>row.types.includes('idol')),'Tutorial idol was replaced');
const death=run('death');assert.ok(death.aimed);assert.equal(death.f.read().state,'dead');assert.equal(death.f.element('title').textContent,'Corruption thorn collision.');assert.ok(death.f.element('message').textContent.endsWith('Dodge the corruption thorns.'),'Jump cleared dodge-only thorn');
const shield=run('shield');assert.equal(shield.saves,1,'Shield is consumed more than once');assert.equal(shield.f.read().state,'dead');assert.equal(shield.f.element('title').textContent,'Corruption thorn collision.');
console.log('SPIRE GAMEPLAY UNIT PASS: seeded corrupt-only rows, untouched tutorial idol/open lanes, real-key dodge survival, jump collision death, one shield save then death');
