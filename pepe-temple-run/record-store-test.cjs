const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {create}=require('./record-store.js');
const KEY='pepe-temple-run-v1';
function storage(raw=null){const values=new Map([[KEY,raw],['other-game','untouched']]);return {values,writes:[],getItem:key=>values.get(key)??null,setItem(key,value){this.writes.push(key);values.set(key,value);}};}

test('valid legacy best records round-trip without changing other data',()=>{
 const disk=storage('{"best":123,"note":"keep"}'),records=create(()=>disk);
 assert.equal(records.load().best,123);assert.equal(records.save(456).best,456);
 assert.deepEqual(JSON.parse(disk.values.get(KEY)),{best:456,note:'keep'});assert.equal(disk.values.get('other-game'),'untouched');assert.deepEqual(disk.writes,[KEY]);
 assert.equal(create(()=>storage()).load().best,0);
});
test('a stale tab merges a newer saved best before reporting and writing its result',()=>{
 const disk=storage('{"best":100}'),older=create(()=>disk),newer=create(()=>disk);older.load();newer.load();newer.save(1200);
 const result=older.save(500);assert.equal(result.previousBest,1200);assert.equal(result.best,1200);assert.equal(JSON.parse(disk.values.get(KEY)).best,1200);
});
test('unreadable and nonfinite records remain byte-for-byte intact',()=>{
 for(const raw of ['broken','null','[]','{}','{"best":-1}','{"best":1.5}','{"best":"900"}','{"best":1e999}','{"best":9007199254740992}',JSON.stringify({best:20,note:'x'.repeat(250001)})]){
  const disk=storage(raw),records=create(()=>disk);assert.equal(records.load().ok,false);
  const result=records.save(600);assert.equal(result.best,600);assert.equal(result.ok,false);assert.match(result.message,/unreadable.*preserved/);
  assert.equal(disk.values.get(KEY),raw);assert.deepEqual(disk.writes,[]);
 }
});
test('storage failures retain the session best and can recover without lowering it',()=>{
 const disk=storage('{"best":50}'),write=disk.setItem;disk.setItem=()=>{throw Error('quota');};const records=create(()=>disk);records.load();
 const failed=records.save(700);assert.equal(failed.ok,false);assert.equal(failed.best,700);assert.equal(disk.values.get(KEY),'{"best":50}');
 disk.setItem=write;assert.equal(records.save(100).best,700);assert.equal(JSON.parse(disk.values.get(KEY)).best,700);
 assert.equal(create(()=>{throw Error('denied');}).save(200).ok,false);
});
test('invalid candidate distances never write or change the valid record',()=>{
 const disk=storage('{"best":55}'),records=create(()=>disk);
 for(const candidate of [NaN,Infinity,-1,2.5,Number.MAX_SAFE_INTEGER+1])assert.equal(records.save(candidate).ok,false);
 assert.equal(disk.values.get(KEY),'{"best":55}');assert.deepEqual(disk.writes,[]);
});
function game(disk){
 const nodes=new Map(),listeners={};const element=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,style:{},setAttribute(name,value){this[name]=value;},addEventListener(){}});return nodes.get(id);};
 let frame,now=0;const window={TempleRecords:{create},templeCharacter:{loaded:true},addEventListener:(type,fn)=>listeners[type]=fn};
 const context={window,document:{querySelector:()=>({getContext:()=>({}),addEventListener(){}}),getElementById:element,querySelectorAll:()=>[],addEventListener(){}},localStorage:disk,Image:class{},ResizeObserver:class{observe(){}},performance:{now:()=>now},requestAnimationFrame:fn=>frame=fn,devicePixelRatio:1};
 vm.runInNewContext(fs.readFileSync(__dirname+'/game.js','utf8'),context);element('start').onclick();
 for(let tick=0;tick<1000&&window.templeRunDiagnostics().state!=='dead';tick++){now+=40;frame(now);}
 assert.equal(window.templeRunDiagnostics().state,'dead');return {read:()=>window.templeRunDiagnostics(),element};
}
test('actual collision results preserve newer records and show storage status',()=>{
 const disk=storage('{"best":1000}'),run=game(disk);assert.equal(run.read().best,1000);assert.match(run.element('message').textContent,/Best 1000 m/);assert.equal(run.element('record-status')['data-state'],'saved');
 const damaged=storage('broken'),unsaved=game(damaged);assert.equal(damaged.values.get(KEY),'broken');assert.match(unsaved.element('record-status').textContent,/unreadable.*preserved/);assert.equal(unsaved.element('record-status')['data-state'],'warning');assert.ok(unsaved.read().best>0);
});

test('protected recovery saves completed-run records while preserving unreadable original bytes',()=>{
 const disk=storage('{damaged-original'),run=game(disk);
 assert.equal(run.element('recover-record').hidden,false);run.element('recover-record').onclick();
 assert.equal(disk.values.get(KEY),'{damaged-original');assert.equal(JSON.parse(disk.values.get(KEY+':recovery')).best,Math.floor(run.read().distance));assert.equal(run.element('record-actions').hidden,true);
 const reloaded=create(()=>disk);assert.equal(reloaded.load().recovery,true);assert.equal(reloaded.save(800).best,800);assert.equal(disk.values.get(KEY),'{damaged-original');assert.equal(create(()=>disk).load().best,800);assert.equal(disk.values.get('other-game'),'untouched');
});
test('recovery does not replace another unreadable record or write after storage failure',()=>{
 const disk=storage('broken');disk.values.set(KEY+':recovery','also broken');const before=[...disk.values],records=create(()=>disk);
 assert.equal(records.load().canRecover,false);assert.equal(records.enableRecovery().ok,false);assert.deepEqual([...disk.values],before);
 const blocked=storage('broken');blocked.setItem=()=>{throw Error('quota');};const failed=create(()=>blocked);failed.save(300);assert.equal(failed.enableRecovery().ok,false);assert.equal(blocked.values.get(KEY),'broken');assert.equal(blocked.values.has(KEY+':recovery'),false);
});
test('retry and repaired primary records merge the existing protected best without deleting it',()=>{
 const disk=storage('{"best":200}'),write=disk.setItem;disk.setItem=()=>{throw Error('quota');};const run=game(disk);
 assert.equal(run.element('record-actions').hidden,false);disk.setItem=write;run.element('retry-record').onclick();assert.equal(run.element('record-actions').hidden,true);
 disk.values.set(KEY+':recovery','{"best":900}');const records=create(()=>disk);assert.equal(records.load().best,900);records.save(300);assert.equal(JSON.parse(disk.values.get(KEY)).best,900);assert.equal(disk.values.get(KEY+':recovery'),'{"best":900}');
});
