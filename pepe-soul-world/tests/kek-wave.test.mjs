import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,act,step} from '../core.js';
import {heroFrame} from '../render.js';
import {Renderer} from '../render.js';
import {waveFrames} from '../kek-wave.js';
test('Wave recovery blends official poses and yields immediately to movement',()=>{
 const s=createState();act(s,'wave');for(let i=0;i<8;i++)step(s,{},1/60);
 const f=waveFrames(s.player);assert.equal(f.current,3);assert.equal(f.previous,2);assert.ok(f.blend>0&&f.blend<1);
 assert.equal(waveFrames(s.player,true).blend,1);
 step(s,{right:true},1/60);assert.equal(waveFrames(s.player),null);assert.equal(heroFrame(s.player,s.time).sheet,'crown-run');
});
test('Wave crosses every realm and damages each target only once',()=>{
 for(const world of ['frozen','crimson','void']){
  const s=createState({version:2,world,oath:true,training:3});s.player.x=600;s.player.invuln=10;
  act(s,'wave');for(let i=0;i<50;i++)step(s,{},1/60);
  assert.equal(s.enemies[0].hp,26,world);assert.equal(s.projectiles[0].hit.filter(id=>id===1).length,1,world);
 }
});
test('Wave contacts elite patrols and guardians in every realm',()=>{
 for(const world of ['frozen','crimson','void'])for(const zone of ['approach2','arena']){
  const s=createState({version:2,world,zone,oath:true,training:3,approachCleared:zone==='arena'?[1,2,3,5,6,7]:[1,2,3]});
  s.player.x=zone==='arena'?1870:600;s.player.invuln=10;const target=s.enemies[0],hp=target.hp;
  act(s,'wave');for(let i=0;i<50;i++)step(s,{},1/60);
  assert.equal(target.hp,hp-39,world+' '+zone);
  const hits=s.projectiles[0].hit;assert.equal(hits.filter(id=>id===target.id).length,1);
  assert.equal(new Set(hits).size,hits.length);assert.equal(s.events.filter(e=>e.type==='waveHit').length,hits.length);
 }
});
test('Wave presentation effects expire in both effects modes',()=>{
 for(const reduced of [false,true]){
  const renderer=new Renderer({getContext:()=>({})},{}),s=createState();renderer.reduced=reduced;
  renderer.effect({type:'wave',x:420,y:515,face:-1},s);renderer.effect({type:'waveHit',x:800,y:515,face:-1},s);
  assert.ok(renderer.fx.some(f=>f.type==='waveLaunch'&&f.face===-1));assert.ok(renderer.fx.some(f=>f.type==='waveImpact'&&f.face===-1));
  for(let i=0;i<60;i++)renderer.update(1/60,s);
  assert.equal(renderer.fx.length,0);
 }
});
test('Wave release uses official poses and emits one impact per struck enemy',()=>{
 const s=createState();s.player.x=680;s.player.sp=100;
 assert.equal(act(s,'wave'),true);assert.equal(s.player.sp,72);
 assert.equal(heroFrame(s.player,0).sheet,'crown-attack');
 assert.equal(s.events.filter(e=>e.type==='wave').length,1);
 for(let i=0;i<50;i++)step(s,{},1/60);
 assert.equal(s.events.filter(e=>e.type==='waveHit').length,1);
 assert.ok(s.projectiles[0].age>.8);
 assert.equal(heroFrame(s.player,s.time).sheet,'crown-atlas');
});
