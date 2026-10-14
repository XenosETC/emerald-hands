import test from 'node:test';import assert from 'node:assert/strict';
import {createState,step,snapshot} from '../core.js';import {groundRewards} from '../ground-rewards.js';import {questGuidance} from '../quest-guidance.js';
test('reward list derives locations and labels without changing a saved checkpoint',()=>{
 const s=createState({version:2,oath:true,training:3,world:'frozen',x:600,approachCleared:[1,2,3],pendingLoot:[{id:1,x:800},{id:2,x:1200}]});
 const before=snapshot(s);assert.deepEqual(groundRewards(s),[{x:800,label:'5 spirit fragments'},{x:1200,label:'5 spirit fragments + Healing Flask'}]);assert.deepEqual(snapshot(s),before);
 assert.match(questGuidance(s).text,/2 ground rewards remain/);assert.match(questGuidance(s).text,/nearest at 800/);
});
test('collection clears the reminder and living enemies retain combat guidance',()=>{
 const s=createState({version:2,oath:true,training:3,world:'void',x:800,approachCleared:[1,2,3],pendingLoot:[{id:1,x:800}]});
 step(s,{},1/60);assert.deepEqual(groundRewards(s),[]);assert.match(questGuidance(s).text,/Optional echo shrine/);
 s.discoveries.push('void');assert.match(questGuidance(s).text,/Approach I cleared.*2250/);
 const alive=createState({version:2,oath:true,training:3,world:'frozen',approachCleared:[1],pendingLoot:[{id:1,x:800}]});assert.match(questGuidance(alive).text,/2 \/ 3 enemies remain/);
});
test('guardian seals and gear appear together without replacing guardian return guidance',()=>{
 const s=createState({version:2,oath:true,training:3,world:'crimson',zone:'arena',approachCleared:[1,2,3],guardianDefeated:true,x:1900});
 assert.deepEqual(groundRewards(s),[{x:2070,label:'Ember seal'},{x:2100,label:'20 spirit fragments + Ember Fang'}]);assert.match(questGuidance(s).text,/the seal and guardian gear/);
});
