const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function fixture(){const elements=new Map(),listeners={},events=[],canvas={getContext:()=>({}),getBoundingClientRect:()=>({width:0,height:0}),addEventListener(){},setPointerCapture(){}};const element=id=>{if(!elements.has(id))elements.set(id,{style:{},previousElementSibling:{textContent:''},setAttribute(){},addEventListener(){},click(){this.onclick?.();}});return elements.get(id);};let frame,now=0;const window={templeCharacter:{loaded:true},TempleFeedback:{reset(){events.length=0;},update(){},diagnostics(){return {};},emit(type,event){events.push({type,...event});},draw(){}},addEventListener:(type,fn)=>listeners[type]=fn};const context={window,document:{querySelector:()=>canvas,querySelectorAll:()=>[],getElementById:element,addEventListener(){}},Image:class{},ResizeObserver:class{observe(){}},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>now},requestAnimationFrame:fn=>frame=fn,devicePixelRatio:1};vm.runInNewContext(fs.readFileSync(__dirname+'/turns.js','utf8'),context);vm.runInNewContext(fs.readFileSync(__dirname+'/game.js','utf8'),context);element('start').onclick();return {element,events,read:()=>window.templeRunDiagnostics(),press:key=>listeners.keydown({key,repeat:false,preventDefault(){}}),step(){now+=40;frame(now);}};}
const test=require('node:test');
function advance(f,target,check=()=>{}){
 for(let tick=0;tick<4000&&f.read().distance<target;tick++){
  const d=f.read();assert.equal(d.state,'running');check(d);
  if(d.turn.window&&!d.turn.accepted)f.press(d.turn.direction==='left'?'ArrowLeft':'ArrowRight');
  const hazards=d.objects.filter(o=>['gap','gate','idol','boulder','spire'].includes(o.type)&&!o.hit&&o.z>7),next=hazards.sort((a,b)=>a.z-b.z)[0];
  if(next&&next.z<45){const group=hazards.filter(o=>Math.abs(o.z-next.z)<.01),safe=[0,1,2].find(l=>!group.some(o=>o.lane===l));if(safe!==d.lane)f.press(safe<d.lane?'ArrowLeft':'ArrowRight');}
  f.step();
 }
 assert.ok(f.read().distance>=target,'Run did not reach target');
}
test('distance sections retain jade through tutorial gates and enter corruption once at 1500 m',()=>{
 const f=fixture();
 for(const [target,label,next] of [[250,'01 / JADE CAUSEWAY',500],[500,'02 / THE SUNKEN SANCTUM',1000],[1000,'03 / CROWN OF THE ABYSS',1500],[1499,'03 / CROWN OF THE ABYSS',1500]]){
  advance(f,target,d=>{assert.equal(d.realm,'jade');assert.equal(d.shards,0);assert.equal(d.realmEntry,null);assert.ok(!d.objects.some(o=>o.type==='spire'));if(d.distance>=1430)assert.ok(!d.objects.some(o=>['gap','gate','idol','boulder'].includes(o.type)&&Math.abs(d.distance+o.z-7-1500)<=60));});
  assert.equal(f.element('zone').textContent,label);assert.equal(f.read().chapter.nextDistance,next);
  const expected=(f.read().distance-(next-500))/500*100;assert.ok(Math.abs(parseFloat(f.element('zone-progress').style.width)-expected)<1e-6);
 }
 const jade=f.read().jade;advance(f,1501);
 const entered=f.read();assert.match(f.element('toast').textContent,/CORRUPT FROG TEMPLE/);assert.equal(entered.realm,'corrupt');assert.ok(entered.realmEntry.distance>=1500&&entered.realmEntry.distance<1502);assert.equal(entered.realmThreshold,1500);assert.equal(entered.jade,jade);
 assert.equal(f.element('zone').textContent,'04 / CORRUPT FROG TEMPLE');assert.equal(f.element('zone-next').textContent,'ENDLESS SHARD RUN');assert.equal(f.element('zone-progress').style.width,'100%');
 const entry=JSON.stringify(entered.realmEntry);entered.realmEntry.time=-99;assert.equal(JSON.stringify(f.read().realmEntry),entry);
 advance(f,2100);assert.ok(f.read().shards>0);assert.equal(f.read().jade,jade);assert.equal(JSON.stringify(f.read().realmEntry),entry);assert.equal(f.events.filter(e=>e.label==='CORRUPT REALM ENTERED').length,1);
 f.press('Escape');const frozen=JSON.stringify(f.read());for(let i=0;i<10;i++)f.step();assert.equal(JSON.stringify(f.read()),frozen);
 f.press('Escape');for(let i=0;i<1000&&f.read().state!=='dead';i++)f.step();assert.equal(f.read().state,'dead');f.element('start').onclick();
 const fresh=f;assert.equal(fresh.read().realm,'jade');assert.equal(fresh.read().realmEntry,null);assert.equal(fresh.element('zone-next').textContent,'THE SUNKEN SANCTUM / 500 M');assert.equal(fresh.element('zone-progress').style.width,'0%');
});
test('missing the opening bridge never unlocks corruption or shards',()=>{
 const f=fixture();for(let i=0;i<200&&f.read().state!=='dead';i++)f.step();assert.equal(f.read().state,'dead');assert.equal(f.read().realm,'jade');assert.equal(f.read().realmEntry,null);assert.equal(f.read().shards,0);assert.equal(f.events.filter(e=>e.label==='CORRUPT REALM ENTERED').length,0);
 f.element('start').onclick();assert.equal(f.read().distance,0);assert.equal(f.read().chapter.nextDistance,500);
});