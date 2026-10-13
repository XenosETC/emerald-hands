import test from 'node:test';import assert from 'node:assert/strict';
import {createCheckpointStore,createStorageAccess} from '../checkpoint-store.js';
import {createState,snapshot,readSave,SAVE_KEY} from '../core.js';
function fixture(raw){const values=new Map([["other-game","kept"]]);if(raw!==undefined)values.set(SAVE_KEY,raw);let blocked=false;const storage={getItem:key=>values.get(key)??null,setItem(key,value){if(blocked)throw Error('quota');values.set(key,value);}};return {values,storage,block(value){blocked=value;},store:createCheckpointStore(storage,SAVE_KEY,value=>readSave(value)!==null)};}
test('unreadable Soul saves remain byte-identical and recovery stays latched after restoration',()=>{
 for(const raw of ['{broken','null','[]','{"version":99}']){const f=fixture(raw);assert.equal(f.store.load(),null);assert.equal(f.store.write(snapshot(createState())).ok,false);assert.equal(f.values.get(SAVE_KEY),raw);const good=JSON.stringify(snapshot(createState()));f.values.set(SAVE_KEY,good);assert.equal(f.store.write(snapshot(createState())).ok,false);assert.equal(f.values.get(SAVE_KEY),good);const fresh=createCheckpointStore(f.storage,SAVE_KEY,value=>readSave(value)!==null);assert.ok(fresh.load());assert.equal(fresh.write(snapshot(createState())).ok,true);}
});
test('write recovery saves the current earned checkpoint without touching other saves',()=>{
 const f=fixture();assert.equal(f.store.load(),null);const s=createState({version:2,oath:true,training:3,seals:['frozen'],bossRewards:['frozen'],fragments:25});
 f.block(true);assert.equal(f.store.write(snapshot(s)).ok,false);assert.equal(f.store.status.ok,false);
 f.block(false);assert.equal(f.store.write(snapshot(s)).ok,true);assert.equal(f.store.status.ok,true);
 const loaded=createState(JSON.parse(f.values.get(SAVE_KEY)));assert.deepEqual(loaded.seals,['frozen']);assert.deepEqual(loaded.bossRewards,['frozen']);assert.equal(loaded.fragments,25);assert.equal(f.values.get('other-game'),'kept');
});
test('practice checkpoint writes stay separate from normal campaign saves',()=>{
 const f=fixture(JSON.stringify(snapshot(createState())));const before=f.values.get(SAVE_KEY);const practice=createCheckpointStore(f.storage,'pepe-soul-world-practice-v1',value=>readSave(value)!==null);practice.load();assert.equal(practice.write(snapshot(createState({version:2,oath:true,training:3}))).ok,true);assert.equal(f.values.get(SAVE_KEY),before);
});

test('changed checkpoints retain the previous valid save and unchanged writes do not rotate it',()=>{
 const first=JSON.stringify(snapshot(createState())),f=fixture(first),s=createState({version:2,oath:true,training:3});
 const current=snapshot(s);assert.equal(f.store.write(current).ok,true);
 assert.equal(f.values.get(SAVE_KEY+':backup'),first);
 assert.equal(f.store.write(current).ok,true);assert.equal(f.values.get(SAVE_KEY+':backup'),first);
});
test('explicit recovery archives damaged bytes, restores a valid backup and requires a fresh store',()=>{
 const f=fixture(),s=createState({version:2,oath:true,training:3,seals:['frozen'],bossRewards:['frozen'],fragments:25});
 const backup=JSON.stringify(snapshot(s));f.values.set(SAVE_KEY+':backup',backup);f.values.set(SAVE_KEY,'{damaged');
 assert.equal(f.store.load(),null);assert.equal(f.store.backupAvailable,true);
 assert.equal(f.store.restoreBackup().ok,true);assert.equal(f.values.get(SAVE_KEY+':recovery-original'),'{damaged');
 assert.equal(f.values.get(SAVE_KEY),backup);assert.equal(f.store.write(snapshot(createState())).ok,false);
 const fresh=createCheckpointStore(f.storage,SAVE_KEY,value=>readSave(value)!==null);
 const restored=createState(fresh.load());assert.deepEqual(restored.seals,['frozen']);assert.equal(restored.fragments,25);
 assert.equal(f.values.get('other-game'),'kept');
});
test('recovery refuses unreadable backups, readable primaries and conflicting archives',()=>{
 const f=fixture('{damaged'),good=JSON.stringify(snapshot(createState()));
 f.values.set(SAVE_KEY+':backup','[]');assert.equal(f.store.backupAvailable,false);assert.equal(f.store.restoreBackup().ok,false);
 f.values.set(SAVE_KEY+':backup',good);f.values.set(SAVE_KEY,good);assert.equal(f.store.restoreBackup().ok,false);
 f.values.set(SAVE_KEY,'{damaged');f.values.set(SAVE_KEY+':recovery-original','other damaged bytes');assert.equal(f.store.restoreBackup().ok,false);
 assert.equal(f.values.get(SAVE_KEY),'{damaged');assert.equal(f.values.get(SAVE_KEY+':recovery-original'),'other damaged bytes');
});
test('failed backup and recovery writes preserve the primary, backup and other games',()=>{
 const good=JSON.stringify(snapshot(createState())),f=fixture(good);f.block(true);
 assert.equal(f.store.write(snapshot(createState({version:2,oath:true}))).ok,false);assert.equal(f.values.get(SAVE_KEY),good);
 f.values.set(SAVE_KEY,'{damaged');f.values.set(SAVE_KEY+':backup',good);assert.equal(f.store.restoreBackup().ok,false);
 assert.equal(f.values.get(SAVE_KEY),'{damaged');assert.equal(f.values.get(SAVE_KEY+':backup'),good);assert.equal(f.values.get('other-game'),'kept');
});
test('a primary-write failure after archiving is retryable without losing damaged data',()=>{
 const values=new Map([[SAVE_KEY,'{damaged'],[SAVE_KEY+':backup',JSON.stringify(snapshot(createState()))]]);let fail=true;
 const storage={getItem:key=>values.get(key)??null,setItem(key,value){if(key===SAVE_KEY&&fail)throw Error('quota');values.set(key,value);}};
 const store=createCheckpointStore(storage,SAVE_KEY,value=>readSave(value)!==null);store.load();
 assert.equal(store.restoreBackup().ok,false);assert.equal(values.get(SAVE_KEY),'{damaged');assert.equal(values.get(SAVE_KEY+':recovery-original'),'{damaged');
 fail=false;assert.equal(store.restoreBackup().ok,true);assert.equal(values.get(SAVE_KEY),values.get(SAVE_KEY+':backup'));
});
test('practice recovery archives and restores only practice data',()=>{
 const f=fixture(JSON.stringify(snapshot(createState()))),normal=f.values.get(SAVE_KEY),key='pepe-soul-world-practice-v1';
 f.values.set(key,'{practice damaged');f.values.set(key+':backup',JSON.stringify(snapshot(createState({version:2,oath:true}))));
 const store=createCheckpointStore(f.storage,key,value=>readSave(value)!==null);store.load();assert.equal(store.restoreBackup().ok,true);
 assert.equal(f.values.get(SAVE_KEY),normal);assert.equal(f.values.has(SAVE_KEY+':backup'),false);assert.equal(f.values.has(SAVE_KEY+':recovery-original'),false);
 assert.equal(f.values.get(key+':recovery-original'),'{practice damaged');
});
test('a blocked storage getter is deferred and becomes a temporary session without declaring damaged data',()=>{
 let accesses=0;const storage=createStorageAccess(()=>{accesses++;throw Error('SecurityError');});
 const store=createCheckpointStore(storage,SAVE_KEY,value=>readSave(value)!==null);assert.equal(accesses,0);
 assert.equal(store.load(),null);assert.equal(store.status.ok,false);assert.equal(store.status.recovery,false);assert.match(store.status.message,/Storage unavailable/);
 assert.equal(store.write(snapshot(createState())).ok,false);assert.equal(store.backupAvailable,false);
});
test('unreadable storage stays write-protected until reload even after access returns',()=>{
 const original=JSON.stringify(snapshot(createState({version:2,oath:true})));let blocked=true,writes=0;
 const storage=createStorageAccess(()=>({getItem(){if(blocked)throw Error('blocked');return original;},setItem(){writes++;}}));
 const store=createCheckpointStore(storage,SAVE_KEY,value=>readSave(value)!==null);store.load();blocked=false;
 assert.equal(store.write(snapshot(createState())).ok,false);assert.equal(writes,0);
 const fresh=createCheckpointStore(storage,SAVE_KEY,value=>readSave(value)!==null);assert.equal(fresh.load().oath,true);
 assert.equal(fresh.write(snapshot(createState({version:2,oath:true,training:3}))).ok,true);assert.equal(writes,2);
});
test('explicit file import keeps the current readable checkpoint as rollback and leaves other games alone',()=>{
 const original=JSON.stringify(snapshot(createState())),f=fixture(original),imported=snapshot(createState({version:2,oath:true,training:3,seals:['frozen'],fragments:25}));
 assert.equal(f.store.importCheckpoint(imported).ok,true);assert.equal(f.values.get(SAVE_KEY+':backup'),original);assert.deepEqual(JSON.parse(f.values.get(SAVE_KEY)),imported);assert.equal(f.values.get('other-game'),'kept');
 assert.equal(f.store.write(snapshot(createState())).ok,false,'Old-session pagehide must not overwrite the import');assert.deepEqual(JSON.parse(f.values.get(SAVE_KEY)),imported);
});
test('import validation, write failure and conflicting damaged archives preserve the primary',()=>{
 const original=JSON.stringify(snapshot(createState())),f=fixture(original),imported=snapshot(createState({version:2,oath:true}));
 assert.equal(f.store.importCheckpoint({version:99}).ok,false);assert.equal(f.values.get(SAVE_KEY),original);
 f.block(true);assert.equal(f.store.importCheckpoint(imported).ok,false);assert.equal(f.values.get(SAVE_KEY),original);
 f.block(false);f.values.set(SAVE_KEY,'{damaged');f.values.set(SAVE_KEY+':recovery-original','other damage');assert.equal(f.store.importCheckpoint(imported).ok,false);assert.equal(f.values.get(SAVE_KEY),'{damaged');
 f.values.delete(SAVE_KEY+':recovery-original');assert.equal(f.store.importCheckpoint(imported).ok,true);assert.equal(f.values.get(SAVE_KEY+':recovery-original'),'{damaged');
});
test('practice file imports keep normal campaign, backup and archive keys untouched',()=>{
 const f=fixture(JSON.stringify(snapshot(createState()))),before=[...f.values],practice=createCheckpointStore(f.storage,'pepe-soul-world-practice-v1',value=>readSave(value)!==null);
 assert.equal(practice.importCheckpoint(snapshot(createState({version:2,oath:true}))).ok,true);for(const [key,value] of before)assert.equal(f.values.get(key),value);assert.equal(f.values.has(SAVE_KEY+':backup'),false);
});
