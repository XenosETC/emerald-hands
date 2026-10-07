import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step,act,snapshot,enterWorld,GROUND,abilityReady,domainReady} from '../core.js';
import {GUARD,guardFrames,dropGuard,guardCue} from '../sword-guard.js';
import {heroFrame,clipFrame} from '../render.js';

function scene(world='temple',face=1){
 const s=createState({version:2,world,oath:true,training:3,complete:true,seals:['frozen','crimson','void'],xp:1000});
 s.player.x=700;s.player.face=face;s.enemies=[s.enemies[0]];Object.assign(s.enemies[0],{x:700+face*100,face:-face,timer:10,mode:'recover',recoveryDuration:10});return s;
}
function raise(s){for(let i=0;i<9;i++)step(s,{guard:true},1/60);assert.ok(s.player.guarding);}
function cut(s){Object.assign(s.enemies[0],{mode:'windup',timer:.001,templeAttack:'staff',windupDuration:.7});step(s,{guard:true},1/60);}
test('Sword guard blocks front cuts in every enemy realm and both facings, spending Spirit without HP loss',()=>{
 for(const world of ['frozen','crimson','void','temple'])for(const face of [-1,1]){
  const s=scene(world,face);raise(s);const hp=s.player.hp,sp=s.player.sp;cut(s);
  assert.equal(s.player.hp,hp,world);assert.equal(s.player.sp,sp-Math.ceil(12*GUARD.costScale));assert.ok(s.events.some(e=>e.type==='guardBlock'));assert.ok(s.player.guardHit>0);
 }
});
test('Rear strikes and a strike during guard startup still hurt',()=>{
 for(const rear of [true,false]){const s=scene();if(rear){raise(s);s.player.face=-1;}const hp=s.player.hp;cut(s);assert.ok(s.player.hp<hp);assert.equal(s.player.guarding,false);assert.ok(!s.events.some(e=>e.type==='guardBlock'));}
});
test('Projectiles are consumed on a block; marked ground eruptions bypass the blade',()=>{
 const s=scene();raise(s);s.projectiles.push({x:s.player.x+48,y:GROUND-40,vx:-300,life:1,friendly:false,damage:18});const hp=s.player.hp;step(s,{guard:true},1/60);assert.equal(s.player.hp,hp);assert.equal(s.projectiles.length,0);assert.equal(s.player.sp,85);
 for(const world of ['temple','frozen']){
  const h=scene(world);raise(h);const before=h.player.hp;
  Object.assign(h.enemies[0],{mode:'windup',timer:.001,templeAttack:'lotus',marks:[h.player.x],elite:world==='frozen'?'caster':undefined,targetX:h.player.x});
  step(h,{guard:true},1/60);assert.ok(h.player.hp<before,world);assert.ok(!h.events.some(e=>e.type==='guardBlock'));
 }
});
test('Insufficient Spirit breaks the guard, damages health and requires release before raising again',()=>{
 const s=scene();raise(s);s.player.sp=8;const hp=s.player.hp;cut(s);
 assert.equal(s.player.sp,0);assert.ok(s.player.hp<hp);assert.ok(s.player.guardBroken>0);assert.ok(s.player.guardMustRelease);assert.match(guardCue(s.player),/GUARD BROKEN/);
 s.enemies=[];for(let i=0;i<90;i++)step(s,{guard:true},1/60);assert.equal(s.player.guarding,false);assert.ok(s.player.sp>8);
 step(s,{},1/60);step(s,{guard:true},1/60);assert.ok(s.player.guarding);
});
test('Guard plants the feet, lets movement choose facing, stops regeneration and releases cleanly',()=>{
 const s=scene();s.enemies=[];s.player.sp=50;raise(s);const x=s.player.x;
 step(s,{guard:true,left:true},1/60);assert.equal(s.player.face,-1);assert.equal(s.player.x,x);assert.equal(s.player.y,GROUND);assert.equal(s.player.sp,50);assert.equal(s.player.mode,'guard');
 step(s,{right:true},1/60);assert.equal(s.player.guarding,false);assert.ok(s.player.x>x);assert.ok(s.player.sp>50);
});
test('Sword guard cannot cancel committed moves, block airborne, or cast attacks while held; Warp exits it',()=>{
 for(const action of ['attack','jump','wave','domain']){const s=scene();s.enemies=[];assert.ok(act(s,action));step(s,{guard:true},1/60);assert.equal(s.player.guarding,false,action);}
 const s=scene();raise(s);for(const key of ['attack','jump','wave','domain','release'])assert.equal(act(s,key),false,key);
 assert.equal(abilityReady(s,'wave'),false);assert.equal(domainReady(s),false);assert.equal(abilityReady(s,'dash'),true);assert.ok(act(s,'dash'));assert.equal(s.player.guarding,false);step(s,{guard:true},1/60);assert.equal(s.player.guarding,false);
 s.enemies=[];for(let i=0;i<30;i++)step(s,{guard:true},1/60);assert.ok(s.player.guarding,'Held guard resumes only after Warp completes');
});
test('Block pose follows raise, impact and lowering; reduced effects keeps the readable brace',()=>{
 const s=scene();step(s,{guard:true},1/60);assert.equal(guardFrames(s.player).to,0);
 raise(s);assert.deepEqual(heroFrame(s.player,s.time),clipFrame('guard',1));cut(s);
 assert.equal(guardFrames(s.player,true).to,2);step(s,{guard:true},1/60);assert.equal(guardFrames(s.player).to,2);
 dropGuard(s.player,true);s.player.mode='idle';assert.equal(guardFrames(s.player).to,null);
 s.player.mode='guard';dropGuard(s.player);assert.equal(guardFrames(s.player),null);assert.equal(s.player.mode,'idle');
});
test('Guard state is transient across saves and world travel',()=>{
 const s=scene();raise(s);const saved=snapshot(s);assert.equal(saved.guarding,undefined);assert.equal(createState(saved).player.guarding,false);
 s.player.x=200;assert.ok(enterWorld(s,'academy'));assert.equal(s.player.guarding,false);assert.equal(s.player.guardLower,0);
});
