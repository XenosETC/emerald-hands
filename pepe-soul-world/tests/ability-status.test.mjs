import test from 'node:test';import assert from 'node:assert/strict';
import {createState,abilityReady,domainReady,GROUND} from '../core.js';import {abilityStatus} from '../ability-status.js';
test('ability messages agree with combat gates without modifying simulation state',()=>{
 for(const changes of [{},{sp:5},{guarding:true},{hurt:.2},{attack:.3},{dash:.2},{riftCooldown:3},{domainCooldown:7},{y:GROUND-100}]){
  const s=createState({version:2,xp:180,complete:true,seals:['frozen','crimson','void']});Object.assign(s.player,changes);const before=JSON.stringify(s);
  for(const key of ['dash','wave','rift','release','domain'])assert.equal(abilityStatus(s,key).ready,key==='domain'?domainReady(s):abilityReady(s,key));
  assert.equal(JSON.stringify(s),before);
 }
});
test('guard, Spirit and airborne messages identify the current blocker and upgraded Warp cost',()=>{
 const s=createState({version:2,xp:180,seals:['frozen'],skills:{warp:2}});s.player.sp=5;
 assert.equal(abilityStatus(s,'dash').reason,'Need 16 SP');assert.equal(abilityStatus(s,'wave').reason,'Need 28 SP');
 s.player.guarding=true;assert.equal(abilityStatus(s,'wave').reason,'Release sword guard');assert.equal(abilityStatus(s,'dash').reason,'Need 16 SP');
 s.player.guarding=false;s.player.y=GROUND-100;s.player.sp=30;const air=abilityStatus(s,'wave');assert.equal(air.key,'rift');assert.equal(air.cost,40);assert.equal(air.reason,'Need 40 SP');
});
test('Domain and Release communicate unlock, grounded and hit-recovery requirements',()=>{
 const s=createState();assert.equal(abilityStatus(s,'release').reason,'Reach level 3 and recover a seal');assert.equal(abilityStatus(s,'domain').reason,'Complete the three-seal oath');
 s.complete=true;s.seals=['frozen','crimson','void'];s.player.y=GROUND-100;assert.equal(abilityStatus(s,'domain').reason,'Land first');
 s.player.y=GROUND;s.player.hurt=.2;assert.equal(abilityStatus(s,'domain').reason,'Recover from the hit');s.dead=true;assert.equal(abilityStatus(s,'domain').reason,'Revive first');
});
