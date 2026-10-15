const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/game.js','utf8');
function run(feedback=false){
  const transforms=[],drawing=new Proxy({setTransform(...args){transforms.push(args);},createLinearGradient(){return {addColorStop(){}};}},{get(target,key){return key in target?target[key]:()=>{};}});
  const elements=new Map(),listeners={},canvas={getContext:()=>drawing,getBoundingClientRect:()=>({width:390.5,height:844.75}),addEventListener(){}};
  const writes=new Map();
  const element=id=>{if(!elements.has(id)){const attributes=new Map();let text='',html='';elements.set(id,{get textContent(){return text;},set textContent(value){text=String(value);writes.set(id,(writes.get(id)||0)+1);},get innerHTML(){return html;},set innerHTML(value){html=String(value);},hidden:false,style:{},addEventListener(){},setAttribute(name,value){attributes.set(String(name),String(value));},getAttribute(name){return attributes.get(String(name))??null;}});}return elements.get(id)};
  let frame,now=0;
  const window={templeCharacter:{loaded:true},addEventListener:(name,fn)=>listeners[name]=fn};
  const context={window,document:{querySelector:()=>canvas,getElementById:element,querySelectorAll:()=>[],addEventListener(){}},Image:class{},localStorage:{getItem:()=>null,setItem(){}},ResizeObserver:class{constructor(callback){this.callback=callback;}observe(){this.callback();}},requestAnimationFrame:fn=>frame=fn,performance:{now:()=>now},devicePixelRatio:1.25};
  if(feedback)vm.runInNewContext(fs.readFileSync(__dirname+'/feedback.js','utf8'),context);vm.runInNewContext(fs.readFileSync(__dirname+'/turns.js','utf8'),context);vm.runInNewContext(source,context);element('start').onclick();
  assert.equal(canvas.width,488);assert.equal(canvas.height,1055);assert.deepEqual(transforms[0],[1.25,0,0,1.25,0,0],'Registered resize callback did not configure fractional DPR');
  const press=key=>listeners.keydown({key,repeat:false,preventDefault(){}});
  const rows=[],seen=new Set();
  for(let tick=0;tick<6000;tick++){
    const d=window.templeRunDiagnostics();assert.equal(d.state,'running',JSON.stringify(d));
    if(tick===3000){press('Escape');assert.equal(element('pause').getAttribute('aria-label'),'Resume game');const frozen=JSON.stringify(window.templeRunDiagnostics()),frozenWrites=JSON.stringify([...writes]);for(let pausedFrame=0;pausedFrame<10;pausedFrame++){now+=40;frame(now);}assert.equal(JSON.stringify([...writes]),frozenWrites,'Paused HUD rewrites text');assert.equal(JSON.stringify(window.templeRunDiagnostics()),frozen,'Pause changed turn or simulation');press('Escape');assert.equal(element('pause').getAttribute('aria-label'),'Pause game');}const hazards=d.objects.filter(o=>['gap','gate','idol','boulder','spire'].includes(o.type)&&!o.hit);
    for(const z of new Set(hazards.map(o=>o.z))){const group=hazards.filter(o=>o.z===z);assert.ok(new Set(group.map(o=>o.lane)).size<3,'All lanes blocked');}
    if(!seen.has(d.row)){seen.add(d.row);rows.push({row:d.row,route:d.route,turns:d.turn.completed,types:hazards.map(o=>o.type)});if(rows.length>1&&d.turn.completed===rows[rows.length-2].turns)assert.ok(Math.abs(d.route-rows[rows.length-2].route)<=1,'Route jumped two lanes');}
    if(d.turn.window&&!d.turn.accepted)press(d.turn.direction==='left'?'ArrowLeft':'ArrowRight');if(d.turn.remaining<60)assert.ok(!hazards.some(o=>o.z<60),'Hazard at mandatory corner');const next=hazards.filter(o=>o.z>7).sort((a,b)=>a.z-b.z)[0];
    if(next&&next.z<45){
      const group=hazards.filter(o=>Math.abs(o.z-next.z)<.01);
      // First lessons exercise jump and slide; later use the guaranteed clear lane.
      if(next.pattern===0&&next.type==='gap'){if(next.z<20&&!d.action)press(' ');}
      else if(next.pattern===1&&next.type==='gate'){if(next.z<20&&!d.action)press('ArrowDown');}
      else {const safe=[0,1,2].find(l=>!group.some(o=>o.lane===l));if(safe!==d.lane)press(safe<d.lane?'ArrowLeft':'ArrowRight');}
    }
    now+=40;frame(now);
  }
  const result=window.templeRunDiagnostics();assert.ok(result.distance>7000);assert.equal(result.speed,49,'Replay never reached maximum speed');assert.ok(result.jade+result.shards>50);assert.equal(result.realm,'corrupt');assert.ok(result.turn.completed>=20);assert.equal(result.turn.failed,false);
  assert.equal(element('zone').textContent,'CORRUPT FROG TEMPLE');assert.equal(element('jade').textContent,String(result.shards));assert.equal(element('flow-count').textContent,String(result.combo));
  for(const id of ['zone','zone-next','turn-direction','turn-instruction'])assert.ok(writes.get(id)<200,id+' rewrites stable text every frame');
  assert.ok(writes.get('jade')<1000,'Currency rewrites between pickups');assert.ok(writes.get('flow-count')<1500,'Combo rewrites between changes');
  if(feedback){assert.equal(result.feedback.events.jade,result.jade+result.shards);assert.ok(result.feedback.events.clear>100);assert.ok(result.feedback.active<=96);}return {rows,distance:result.distance,jade:result.jade,shards:result.shards};
}
const a=run(),b=run(),c=run(true);assert.equal(JSON.stringify(a),JSON.stringify(c),'Feedback changed gameplay');assert.equal(JSON.stringify(a),JSON.stringify(b),'Seeded runs diverged');console.log('FLOW PASS',Math.floor(a.distance)+' m',a.rows.length+' rows',a.jade+' jade / '+a.shards+' shards; identical seeded replays, open lanes, adjacent routes, tutorial actions');
