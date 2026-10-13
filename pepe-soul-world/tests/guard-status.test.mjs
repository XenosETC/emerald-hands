import test from 'node:test';import assert from 'node:assert/strict';
import {createState,GROUND,step} from '../core.js';import {GUARD,canGuard,guardStatus,guardCue} from '../sword-guard.js';
test('guard explanations follow readiness and never mutate combat state',()=>{
 for(const changes of [{},{sp:0},{y:GROUND-10},{vy:1},{hurt:.2},{attack:.3},{dash:.2},{waveCooldown:1.2},{guardBroken:.4},{guardMustRelease:true},{rift:{}}]){
  const s=createState();Object.assign(s.player,changes);const before=JSON.stringify(s);
  assert.equal(guardStatus(s.player,GROUND).ready,canGuard(s.player,GROUND));assert.equal(JSON.stringify(s),before);
 }
});
test('held guard can raise after real Spirit recovery without the status helper taking ownership',()=>{
 const s=createState(),p=s.player;p.sp=0;assert.match(guardStatus(p,GROUND).reason,/Need 8 SP/);step(s,{guard:true},1/60);assert.equal(p.guarding,false);
 for(let frame=0;frame<60;frame++)step(s,{guard:true},1/60);assert.ok(p.sp>=GUARD.minCost);assert.equal(p.guarding,true);step(s,{guard:false},1/60);assert.equal(p.guarding,false);
});
test('active low-Spirit guard and break lock show distinct recovery guidance',()=>{
 const p=createState().player;p.guarding=true;p.guardTime=1;p.sp=0;
 assert.match(guardCue(p),/Spirit low.*Release to recover/);assert.equal(guardStatus(p,GROUND).ready,true);
 p.guardBroken=.4;assert.match(guardStatus(p,GROUND).reason,/Guard broken/);p.guardBroken=0;p.guardMustRelease=true;assert.match(guardStatus(p,GROUND).reason,/Release guard to rearm/);
});
