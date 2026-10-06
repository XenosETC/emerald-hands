import test from 'node:test';import assert from 'node:assert/strict';
import {createState,act,step,abilityReady,GROUND,snapshot,enterWorld} from '../core.js';import {RIFT} from '../kek-rift.js';
const state=()=>createState({version:2,oath:true,training:3,xp:180,seals:['frozen'],world:'frozen',zone:'approach2',approachCleared:[1,2,3],x:700});
const tick=(s,seconds)=>{for(let i=0;i<seconds*60;i++)step(s,{},1/60);};
test('airborne special changes from Wave to Rift only after the unlock and uses its own readiness',()=>{
 const s=state();assert.equal(act(s,'rift'),false);act(s,'jump');tick(s,.12);s.player.waveCooldown=2;assert.equal(abilityReady(s,'wave'),true);assert.equal(act(s,'wave'),true);assert.equal(s.projectiles.length,0);assert.equal(s.player.sp,100-RIFT.cost);assert.ok(s.player.rift);assert.equal(act(s,'dash'),false);assert.equal(act(s,'domain'),false);
 const locked=createState();act(locked,'jump');tick(locked,.12);assert.equal(act(locked,'wave'),true);assert.equal(locked.projectiles.length,1);
});
test('fracture damages each forward target once, launches surviving elites, misses behind and ends grounded',()=>{
 const s=state();s.enemies[0].x=820;s.enemies[1].x=1020;s.enemies[2].x=560;const behind=s.enemies[2];s.enemies.forEach(e=>{e.timer=99;e.stun=5;});act(s,'jump');tick(s,.12);act(s,'wave');tick(s,.4);const first=s.enemies[0],hp=first.hp;assert.ok(first.y<GROUND);assert.equal(first.hp,first.maxHp-(RIFT.damage+9));tick(s,1);assert.equal(first.hp,hp);assert.equal(first.y,GROUND);assert.equal(behind.hp,behind.maxHp);assert.equal(s.player.y,GROUND);assert.equal(s.player.rift,null);assert.equal(s.rifts.length,0);assert.equal(s.events.filter(e=>e.type==='riftImpact').length,1);
});
test('guardians stagger without launching; cooldown survives reload; crossings clear fracture and cast',()=>{
 const s=state();s.enemies=[{...s.enemies[0],boss:true,hp:210,maxHp:210,x:800,timer:99,stun:5}];act(s,'jump');tick(s,.12);act(s,'wave');tick(s,.4);assert.equal(s.enemies[0].y,GROUND);assert.equal(s.enemies[0].mode,'recover');assert.ok(s.enemies[0].stun>0);const restored=createState(snapshot(s));assert.ok(restored.player.riftCooldown>0);assert.equal(restored.player.rift,null);assert.equal(restored.rifts.length,0);assert.equal(enterWorld(s,'academy'),true);assert.equal(s.rifts.length,0);assert.equal(s.player.rift,null);
});
test('both directions work in every realm, and a hit before impact interrupts without creating a fracture',()=>{
 for(const world of ['frozen','crimson','void'])for(const face of [-1,1]){const s=state();s.world=world;s.player.face=face;s.player.x=1000;s.enemies=[{...s.enemies[0],world,x:1000+face*120,timer:99,stun:5}];act(s,'jump');tick(s,.12);act(s,'wave');tick(s,.45);assert.equal(s.enemies[0].hp,26);assert.ok(s.enemies[0].y<GROUND);}
 const s=state();s.enemies=[];act(s,'jump');tick(s,.12);act(s,'wave');s.projectiles=[{x:s.player.x,y:s.player.y-45,vx:0,life:1,friendly:false,world:'frozen'}];step(s,{},1/60);assert.equal(s.player.rift,null);assert.equal(s.rifts.length,0);assert.ok(s.player.riftCooldown>0);
});
