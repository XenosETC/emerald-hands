import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,revive,reviveDestination,snapshot,step,GROUND} from '../core.js';
const realm=()=>createState({version:1,world:'frozen',zone:'arena',approachCleared:[1,2,3,5,6,7],oath:true,training:3,discoveries:['frozen']});
test('shrine retry resets guardian attack cycle and player cooldowns',()=>{const s=realm(),b=s.enemies[0];s.dead=true;s.player.hp=0;s.player.dashCooldown=4;s.player.waveCooldown=4;s.player.releaseCooldown=10;b.attackCount=3;b.x=1800;b.hp=10;revive(s);assert.equal(s.player.x,1360);assert.equal(s.zone,'approach2');assert.equal(s.enemies.filter(e=>!e.dead).length,0);for(const key of ['dashCooldown','waveCooldown','releaseCooldown'])assert.equal(s.player[key],0);});
test('second guardian strike emits a realm-identified wave',()=>{const s=realm(),b=s.enemies[0];s.enemies=[b];s.player.x=1900;b.x=2000;b.mode='windup';b.timer=0;b.attackCount=1;step(s,{},1/60);assert.equal(s.projectiles.length,1);assert.equal(s.projectiles[0].world,'frozen');assert.ok(s.events.some(e=>e.type==='enemyWave'&&e.world==='frozen'));});
test('jumping over a ground wave avoids damage while a grounded hit connects',()=>{for(const airborne of [true,false]){const s=realm();s.enemies=[];s.player.x=1000;s.player.y=airborne?GROUND-150:GROUND;s.projectiles=[{x:994,y:GROUND-40,vx:360,life:1,friendly:false,world:'frozen'}];step(s,{},1/60);assert.equal(s.player.hp,airborne?100:84);}});


test('attuned post-victory revival keeps the cleared arena and only pending first rewards',()=>{
 for(const world of ['frozen','crimson','void','temple'])for(const recovered of [false,true]){
  const s=createState({version:2,world,zone:'arena',approachCleared:[1,2,3,5,6,7],oath:true,training:3,complete:world==='temple',discoveries:[world],guardianDefeated:true,seals:recovered&&world!=='temple'?[world]:[],bossRewards:recovered?[world]:[]});
  s.dead=true;s.player.hp=0;
  assert.equal(reviveDestination(s),'cleared-arena');
  const deathReload=createState(snapshot(s));assert.equal(deathReload.world,world);assert.equal(deathReload.zone,'arena');assert.equal(deathReload.guardianDefeated,true);assert.equal(deathReload.drops.some(d=>d.kind==='loot'),!recovered);
  assert.equal(revive(s),true);
  assert.equal(s.zone,'arena');assert.equal(s.guardianDefeated,true);assert.equal(s.enemies.filter(e=>!e.dead).length,0);
  assert.equal(s.drops.some(d=>d.kind==='loot'),!recovered);
  assert.equal(s.drops.some(d=>d.kind==='seal'),world!=='temple'&&!recovered);
  const loaded=createState(snapshot(s));assert.equal(loaded.guardianDefeated,true);assert.equal(loaded.enemies.filter(e=>!e.dead).length,0);
  assert.equal(loaded.drops.some(d=>d.kind==='loot'),!recovered);
  assert.equal(revive(s),false);
 }
});
test('revival destinations preserve living-guardian and unattuned academy retry rules',()=>{
 const s=realm();s.discoveries=[];assert.equal(reviveDestination(s),'academy');
 s.discoveries=['frozen'];assert.equal(reviveDestination(s),'shrine');
 s.dead=true;s.player.hp=0;revive(s);assert.equal(s.zone,'approach2');assert.equal(s.guardianDefeated,false);
});
test('death reload matches the attuned shrine retry destination in every unfinished phase',()=>{
 for(const world of ['frozen','crimson','void','temple'])for(const zone of ['approach','approach2','arena']){
  if(world==='temple'&&zone==='approach2')continue;
  const cleared=zone==='approach'?[1]:zone==='approach2'?[1,2,3,5]:[1,2,3,5,6,7];
  const s=createState({version:2,world,zone,approachCleared:cleared,oath:true,training:3,complete:world==='temple',discoveries:[world],fragments:25});
  s.dead=true;s.player.hp=0;s.player.riftCooldown=7;s.player.domainCooldown=20;
  const loaded=createState(snapshot(s));assert.equal(loaded.world,world,'Reload lost the attuned realm');
  revive(s);const retried=createState(snapshot(s));
  for(const key of ['world','zone','guardianDefeated','approachCleared','fragments','discoveries'])assert.deepEqual(loaded[key],retried[key],`${world}/${zone}: ${key}`);
  for(const key of ['x','hp','sp','riftCooldown','domainCooldown'])assert.equal(loaded.player[key],retried.player[key],`${world}/${zone}: player ${key}`);
 }
});
test('attuned death checkpoint preserves pending patrol loot without changing the dead session',()=>{
 const s=createState({version:2,world:'frozen',oath:true,training:3,discoveries:['frozen'],approachCleared:[1],pendingLoot:[{id:1,x:800}],fragments:25});
 s.dead=true;s.player.hp=0;s.player.riftCooldown=7;
 const loaded=createState(snapshot(s));assert.equal(loaded.player.x,1360);assert.equal(loaded.world,'frozen');assert.equal(loaded.drops.length,1);assert.equal(loaded.drops[0].sourceId,1);assert.equal(loaded.fragments,25);
 assert.equal(s.dead,true);assert.equal(s.player.hp,0);assert.equal(s.player.riftCooldown,7);assert.equal(s.drops.length,1);
 const unattuned=createState({version:2,world:'frozen',oath:true,training:3,approachCleared:[1]});unattuned.dead=true;unattuned.player.hp=0;
 const home=createState(snapshot(unattuned));assert.equal(home.world,'academy');assert.equal(home.player.x,420);assert.deepEqual(home.approachCleared,[]);
});
