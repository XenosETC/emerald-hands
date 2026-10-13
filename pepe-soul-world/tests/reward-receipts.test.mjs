import test from 'node:test';import assert from 'node:assert/strict';
import {createState,snapshot} from '../core.js';import {GUARDIAN_REWARDS} from '../guardian-rewards.js';import {guardianReceipts} from '../reward-receipts.js';
test('guardian reward definitions retain the three blades and Temple supplies',()=>{
 assert.deepEqual(Object.values(GUARDIAN_REWARDS).map(r=>[r.amount,r.item]),[[20,'frostFang'],[20,'emberFang'],[20,'voidFang'],[20,'healthFlask']]);
 for(const world of Object.keys(GUARDIAN_REWARDS)){
  const s=createState({version:2,oath:true,training:3,complete:world==='temple',world,zone:'arena',approachCleared:[1,2,3],guardianDefeated:true});
  const drop=s.drops.find(d=>d.boss);assert.equal(drop.amount,GUARDIAN_REWARDS[world].amount);assert.equal(drop.item,GUARDIAN_REWARDS[world].item);
 }
});
test('receipt history distinguishes supplies, filters unknown/duplicate receipts and never grants inventory',()=>{
 const s=createState({version:2,bossRewards:['temple','temple','unknown','frozen']});const before=snapshot(s);
 assert.deepEqual(guardianReceipts(s),[{world:'Frozen District',item:'Rime Fang',amount:20},{world:'Emerald Temple',item:'Healing Flask',amount:20}]);
 assert.deepEqual(snapshot(s),before);
});
