const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/game.js','utf8');
const helpers={};vm.createContext(helpers);
vm.runInContext(source.slice(source.indexOf('  function pauseSummary('),source.indexOf('  function pause(){')),helpers);
const base={distance:125.9,jade:4,shards:0,corrupted:false,lane:1,objects:[]};

test('pause guidance uses nearest unresolved hazard in the occupied lane without mutating objects',()=>{
 const objects=[{type:'gate',lane:1,z:50},{type:'idol',lane:0,z:8},{type:'boulder',lane:1,z:6},{type:'spire',lane:1,z:9,hit:true},{type:'jade',lane:1,z:8},{type:'gap',lane:1,z:20}];
 const before=JSON.stringify(objects);
 assert.equal(helpers.pauseSummary({...base,objects}),'125 m · 4 jade\nBroken bridge in 13 m. Jump or dodge.');
 assert.equal(JSON.stringify(objects),before);
 for(const [type,expected] of [['gate','Slide or dodge.'],['idol','Dodge.'],['boulder','Dodge.'],['spire','Dodge.']])assert.ok(helpers.pauseSummary({...base,objects:[{type,lane:1,z:30}]}).endsWith(expected));
});

test('mandatory corners take priority and distinguish approach, open input and locked turn',()=>{
 const turn={direction:'right',announced:true,remaining:55,window:false,accepted:false};
 const run={...base,corrupted:true,shards:12,turn,objects:[{type:'gate',lane:1,z:8}]};
 assert.match(helpers.pauseSummary(run),/4 jade · 12 shards\nRight corner in 55 m. Turn in the final 28 m\./);
 assert.match(helpers.pauseSummary({...run,turn:{...turn,remaining:20,window:true}}),/Turn right on resume\./);
 assert.match(helpers.pauseSummary({...run,turn:{...turn,remaining:20,window:true,accepted:true}}),/Right corner locked\. Lane movement resumes after the bend\./);
 assert.match(helpers.pauseSummary({...base,corrupted:true}),/Follow the shard trail\./);
 assert.match(helpers.pauseSummary(base),/Follow the jade trail\./);
});

test('real bridge approach pause reports live totals and contact distance, freezes and resumes unchanged',()=>{
 const nodes=new Map(),keys={};let frame,now=0,writes=0;
 const element=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,style:{},setAttribute(){},addEventListener(){},click(){this.onclick?.();}});return nodes.get(id);};
 const window={templeCharacter:{loaded:true},addEventListener:(type,fn)=>keys[type]=fn};
 const context={window,document:{querySelector:()=>({getContext:()=>({}),addEventListener(){}}),querySelectorAll:()=>[],getElementById:element,addEventListener(){}},Image:class{},ResizeObserver:class{observe(){}},localStorage:{getItem:()=>null,setItem(){writes++;}},performance:{now:()=>now},requestAnimationFrame:fn=>frame=fn,devicePixelRatio:1};
 vm.runInNewContext(fs.readFileSync(__dirname+'/turns.js','utf8'),context);vm.runInNewContext(fs.readFileSync(__dirname+'/record-store.js','utf8'),context);vm.runInNewContext(source,context);
 element('start').onclick();const tick=()=>{now+=40;frame(now);};
 for(let i=0;i<200&&window.templeRunDiagnostics().distance<125;i++)tick();
 const before=window.templeRunDiagnostics();assert.equal(before.state,'running');
 keys.keydown({key:'Escape',repeat:false,preventDefault(){}});
 const paused=window.templeRunDiagnostics();assert.equal(paused.state,'paused');assert.equal(paused.distance,before.distance);assert.equal(paused.action,before.action);
 const gap=paused.objects.find(o=>o.type==='gap'&&!o.hit);
 assert.equal(element('message').textContent,`${Math.floor(paused.distance)} m · ${paused.jade} jade\nBroken bridge in ${Math.ceil(gap.z-7)} m. Jump or dodge.`);
 const frozen=JSON.stringify(paused);for(let i=0;i<20;i++)tick();assert.equal(JSON.stringify(window.templeRunDiagnostics()),frozen);assert.equal(writes,0,'Pausing commits an unfinished run');
 element('start').onclick();assert.equal(window.templeRunDiagnostics().state,'running');assert.equal(window.templeRunDiagnostics().distance,before.distance);assert.equal(element('overlay').hidden,true);
});
