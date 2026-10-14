import test from 'node:test';import assert from 'node:assert/strict';
import {createState,act,step,snapshot,readSave,abilityReady,revive} from '../core.js';
import {checkpointFile,parseCheckpointFile} from '../checkpoint-file.js';
const saved={version:2,oath:true,training:3,xp:300,seals:['frozen']};
test('actual Warp, Wave and Release cooldowns survive snapshot and portable-file roundtrips',()=>{
 for(const action of ['dash','wave','release']){
  const s=createState(saved);assert.equal(act(s,action),true);step(s,{},1/60);
  const before=snapshot(s),copy=createState(before),file=createState(parseCheckpointFile(checkpointFile(s)));
  for(const restored of [copy,file]){
   for(const key of ['dashCooldown','waveCooldown','releaseCooldown','release'])assert.equal(restored.player[key],s.player[key]);
   assert.equal(restored.player.sp,s.player.sp);assert.equal(abilityReady(restored,action),false);
  }
  assert.deepEqual(snapshot(s),before);
 }
});
test('reloaded Release retains its bonus window and expires by normal simulation steps',()=>{
 let s=createState(saved);act(s,'release');for(let i=0;i<120;i++)step(s,{},1/60);
 s=createState(snapshot(s));assert.ok(s.player.release>5);assert.ok(s.player.releaseCooldown>13);
 for(let i=0;i<370;i++)step(s,{},1/60);assert.equal(s.player.release,0);assert.ok(s.player.releaseCooldown>0);
 for(let i=0;i<500;i++)step(s,{},1/60);assert.equal(s.player.releaseCooldown,0);assert.equal(abilityReady(s,'release'),true);
});
test('legacy, malformed and locked timers normalize safely without granting an awakening',()=>{
 for(const version of [1,2]){
  const old=createState({...saved,version});for(const key of ['dashCooldown','waveCooldown','releaseCooldown','release'])assert.equal(old.player[key],0);
 }
 const normalized=readSave({...saved,dashCooldown:Infinity,waveCooldown:-1,releaseCooldown:999,release:999});
 assert.equal(normalized.dashCooldown,0);assert.equal(normalized.waveCooldown,0);assert.equal(normalized.releaseCooldown,16);assert.equal(normalized.release,8);
 assert.equal(readSave({version:2,release:8}).release,0);
});
test('death checkpoints reset all preserved timers just like direct revival',()=>{
 for(const discoveries of [[],['frozen']]){
 const s=createState({...saved,world:'frozen',discoveries});Object.assign(s.player,{dashCooldown:.8,waveCooldown:1,releaseCooldown:12,release:5,riftCooldown:6,domainCooldown:20});s.dead=true;s.player.hp=0;
 const restored=createState(snapshot(s));assert.equal(revive(s),true);
 for(const key of ['dashCooldown','waveCooldown','releaseCooldown','release','riftCooldown','domainCooldown']){assert.equal(restored.player[key],0);assert.equal(s.player[key],0);}
 }
});
