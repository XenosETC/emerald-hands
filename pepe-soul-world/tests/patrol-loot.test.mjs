import test from 'node:test';import assert from 'node:assert/strict';
import {createState,step,act,snapshot} from '../core.js';
import {pendingPatrolLoot} from '../patrol-loot.js';
test('an earned patrol drop survives reload and can be collected only once',()=>{
 let s=createState({version:2,oath:true,training:3,world:'frozen',x:600});
 for(let frame=0;frame<600&&!s.enemies[0].dead;frame++){
  if(s.player.waveCooldown<=0)act(s,'wave');step(s,{},1/60);
 }
 assert.equal(s.enemies[0].dead,true);const drop=s.drops.find(d=>d.kind==='loot'&&!d.boss);assert.ok(drop,'Ranged defeat should leave a pending drop');
 const before=s.fragments;s=createState(snapshot(s));assert.ok(s.drops.some(d=>d.kind==='loot'&&!d.boss),'Reload discarded earned patrol loot');
 for(let frame=0;frame<600&&s.drops.some(d=>d.kind==='loot'&&!d.boss);frame++)step(s,{right:true},1/60);
 assert.equal(s.fragments,before+5);const collected=s.fragments;s=createState(snapshot(s));assert.equal(s.fragments,collected);assert.equal(s.drops.filter(d=>d.kind==='loot'&&!d.boss).length,0);
});
test('pending patrol saves reject invented, duplicate, wrong-phase and nonfinite drops',()=>{
 const s={world:'frozen',zone:'approach',approachCleared:[1,2,3]};
 assert.deepEqual(pendingPatrolLoot([{id:1,x:800},{id:1,x:900},{id:2,x:Infinity},{id:4,x:2070},{id:5,x:900},{id:3,x:99999}],s),[{id:1,x:800},{id:3,x:2500}]);
 assert.deepEqual(pendingPatrolLoot([{id:1,x:800}],{...s,approachCleared:[]}),[]);
 for(const zone of ['arena','unknown'])assert.deepEqual(pendingPatrolLoot([{id:1,x:800}],{...s,zone}),[]);
 assert.deepEqual(pendingPatrolLoot([{id:1,x:800}],{...s,world:'academy'}),[]);
 assert.deepEqual(pendingPatrolLoot(null,s),[]);
 assert.deepEqual(pendingPatrolLoot([{id:1,x:800},{id:5,x:1200}],{world:'void',zone:'approach2',approachCleared:[1,2,3,5]}),[{id:5,x:1200}]);
});
test('a saved flask drop restores its fixed reward once and old saves add no loot',()=>{
 let s=createState({version:2,oath:true,training:3,world:'frozen',x:1300,approachCleared:[2],pendingLoot:[{id:2,x:1300,amount:999,item:'voidFang'}]});
 const flasks=s.inventory.healthFlask,fragments=s.fragments;step(s,{},1/60);
 assert.equal(s.fragments,fragments+5);assert.equal(s.inventory.healthFlask,flasks+1);assert.equal(s.inventory.voidFang||0,0);
 s=createState(snapshot(s));step(s,{},1/60);assert.equal(s.fragments,fragments+5);assert.equal(s.inventory.healthFlask,flasks+1);
 assert.equal(createState({version:2,oath:true,training:3,world:'frozen',approachCleared:[2]}).drops.length,0);
});
