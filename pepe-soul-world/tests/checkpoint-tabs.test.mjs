import test from 'node:test';import assert from 'node:assert/strict';
import {createCheckpointStore} from '../checkpoint-store.js';
import {createState,snapshot,readSave,SAVE_KEY} from '../core.js';
const checkpoint=fragments=>snapshot(createState({version:2,oath:true,training:3,fragments}));
function setup(raw){
 const values=new Map(raw===undefined?[]:[[SAVE_KEY,JSON.stringify(raw)]]);
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const store=(key=SAVE_KEY)=>createCheckpointStore(storage,key,value=>readSave(value)!==null);
 return {values,store};
}
test('an older tab cannot overwrite a newer checkpoint or rotate its backup',()=>{
 const f=setup(checkpoint(10)),a=f.store(),b=f.store();a.load();b.load();
 assert.equal(a.write(checkpoint(20)).ok,true);const before=[...f.values];
 assert.equal(b.write(checkpoint(11)).ok,false);assert.match(b.status.message,/changed outside/);assert.deepEqual([...f.values],before);
 assert.equal(b.write(checkpoint(12)).ok,false);assert.deepEqual([...f.values],before);
 const fresh=f.store();assert.equal(fresh.load().fragments,20);assert.equal(fresh.write(checkpoint(21)).ok,true);
});
test('storage notification check detects imports and deletion without writing or changing live progress',()=>{
 for(const replacement of [JSON.stringify(checkpoint(50)),null]){
  const f=setup(checkpoint(10)),store=f.store();const live=createState(store.load());
  if(replacement===null)f.values.delete(SAVE_KEY);else f.values.set(SAVE_KEY,replacement);
  const before=[...f.values];assert.equal(store.check().ok,false);assert.equal(live.fragments,10);assert.deepEqual([...f.values],before);
  assert.equal(store.write(snapshot(live)).ok,false);assert.deepEqual([...f.values],before);
 }
});
test('two initially empty tabs detect the first persisted run; unchanged own writes remain safe',()=>{
 const f=setup(),a=f.store(),b=f.store();a.load();b.load();
 assert.equal(a.write(checkpoint(1)).ok,true);assert.equal(a.check().ok,true);assert.equal(a.write(checkpoint(1)).ok,true);
 assert.equal(b.write(checkpoint(0)).ok,false);assert.equal(JSON.parse(f.values.get(SAVE_KEY)).fragments,1);
});
test('practice changes do not block the normal store and explicit restore remains protected until reload',()=>{
 const f=setup(checkpoint(10)),normal=f.store(),practice=f.store('pepe-soul-world-practice-v1');normal.load();practice.load();
 assert.equal(practice.write(checkpoint(99)).ok,true);assert.equal(normal.check().ok,true);assert.equal(normal.write(checkpoint(11)).ok,true);
 const stale=f.store();stale.load();assert.equal(normal.importCheckpoint(checkpoint(50)).ok,true);assert.equal(stale.check().ok,false);
 assert.equal(stale.importCheckpoint(checkpoint(11)).ok,true,'Explicit file restore remains available after downloading the live run');
 assert.equal(stale.write(checkpoint(12)).ok,false);assert.equal(JSON.parse(f.values.get(SAVE_KEY)).fragments,11);
});
test('previous-checkpoint recovery also blocks old-session writes when called before load',()=>{
 const f=setup();f.values.set(SAVE_KEY,'{damaged');f.values.set(SAVE_KEY+':backup',JSON.stringify(checkpoint(20)));
 const store=f.store();assert.equal(store.restoreBackup().ok,true);
 assert.equal(store.write(checkpoint(0)).ok,false);assert.equal(JSON.parse(f.values.get(SAVE_KEY)).fragments,20);
});
