import test from 'node:test';import assert from 'node:assert/strict';
import {createCheckpointStore} from '../checkpoint-store.js';
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
