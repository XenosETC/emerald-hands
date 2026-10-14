import test from 'node:test';import assert from 'node:assert/strict';
import {createCheckpointStore} from '../checkpoint-store.js';import {createState,snapshot,readSave,SAVE_KEY} from '../core.js';
test('fresh practice retains the previous practice checkpoint and cannot overwrite the normal campaign or be undone by pagehide',()=>{
 const key='pepe-soul-world-practice-v1',normal=JSON.stringify(snapshot(createState({version:2,fragments:42}))),previous=JSON.stringify(snapshot(createState({version:2,fragments:7})));
 const values=new Map([[SAVE_KEY,normal],[key,previous]]),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const store=createCheckpointStore(storage,key,value=>readSave(value)!==null),live=createState(store.load());
 const fresh=snapshot(createState());assert.equal(store.importCheckpoint(fresh).ok,true);assert.deepEqual(JSON.parse(values.get(key)),fresh);assert.equal(values.get(key+':backup'),previous);assert.equal(values.get(SAVE_KEY),normal);
 assert.equal(store.write(snapshot(live)).ok,false);assert.deepEqual(JSON.parse(values.get(key)),fresh);assert.equal(values.get(key+':backup'),previous);
 const resumed=createState(JSON.parse(values.get(key)));assert.equal(resumed.fragments,0);assert.equal(resumed.oath,false);assert.equal(resumed.training,0);assert.equal(resumed.inventory.healthFlask,2);
});
