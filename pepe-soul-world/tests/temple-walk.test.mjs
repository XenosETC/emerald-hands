import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createState,step,GROUND} from '../core.js';
import {stepTempleEnemy,staggerTempleEnemy} from '../temple-combat.js';
import {templeVisual,templeStride,templeWalkIndex} from '../temple-walk.js';
import {TEMPLE_WALK_ANCHORS} from '../temple-walk-layout.js';

const foe=(boss=false)=>({id:1,boss,world:'temple',x:1300,y:GROUND,mode:'idle',timer:0,attackCount:0,hp:65,maxHp:65});
test('Temple gait uses actual movement distance in either direction and stops out of pursuit range',()=>{
 for(const boss of [false,true])for(const face of [-1,1]){
  const e=foe(boss),p={x:e.x+face*400,y:GROUND};
  for(let i=0;i<30;i++)stepTempleEnemy(e,p,1/60,GROUND);
  assert.equal(e.face,face);assert.ok(e.walking);assert.ok(Math.abs(e.walkDistance-(boss?75:92)*.5)<1e-8);
  assert.ok(Math.abs(e.x-1300-face*e.walkDistance)<1e-8);
  const distance=e.walkDistance;stepTempleEnemy(e,{x:e.x+900,y:GROUND},1/60,GROUND);
  assert.equal(e.walking,false);assert.equal(e.walkDistance,distance);
  for(let i=0;i<10;i++)stepTempleEnemy(e,{x:e.x+900,y:GROUND},1/60,GROUND);
  assert.ok(!templeVisual(e).to.sheet.includes('-walk-'));
 }
});
test('A full stride loops six frames, remains valid in reduced effects and does not advance with clock time',()=>{
 for(const boss of [false,true])for(let i=0;i<120;i++){
  const e={...foe(boss),walking:true,walkTime:1,walkDistance:(i+.5)*templeStride({boss})/60};
  assert.equal(templeWalkIndex(e),Math.floor(i/10)%6);
  const f=templeVisual(e);assert.ok(f.blend>=0&&f.blend<=1);
  for(const frame of [f.from,f.to]){assert.ok(frame.col>=0&&frame.col<3);assert.ok(frame.row>=0&&frame.row<2);}
  assert.deepEqual(templeVisual({...e,poseTime:999,anim:999}),f);
  assert.equal(templeVisual(e,true).blend,0);assert.ok(templeVisual(e,true).from.sheet.includes('-walk-'));
 }
});
test('Approach blends directly from walking to the committed windup with facing and marks still locked',()=>{
 for(const boss of [false,true]){
  const e=foe(boss),p={x:1000,y:GROUND};let guard=0;
  while(e.mode==='idle'&&guard++<300)stepTempleEnemy(e,p,1/60,GROUND);
  assert.equal(e.mode,'windup');assert.equal(e.walking,false);assert.ok(e.guardWalkDistance>0);
  const f=templeVisual(e);assert.equal(f.blend,0);assert.ok(f.from.sheet.includes('-walk-'));assert.equal(f.to.row,1);assert.equal(f.to.col,0);
  const x=e.x,distance=e.walkDistance,face=e.face,marks=[...e.marks];
  stepTempleEnemy(e,{x:e.x+400,y:GROUND},.1,GROUND);
  assert.equal(e.face,face);assert.equal(e.x,x);assert.equal(e.walkDistance,distance);assert.deepEqual(e.marks,marks);
  assert.ok(!templeVisual(e).from.sheet.includes('-walk-'));
 }
});
test('Simulation stun freezes a walking pose; Rift stagger exits it without inventing movement',()=>{
 const s=createState({version:2,world:'temple',oath:true,training:3,complete:true,seals:['frozen','crimson','void']});s.player.x=400;
 const e=s.enemies[0];step(s,{},.05);assert.ok(e.walking);e.stun=.24;
 const x=e.x,distance=e.walkDistance,frame=templeVisual(e);step(s,{},.05);
 assert.equal(e.x,x);assert.equal(e.walkDistance,distance);assert.deepEqual(templeVisual(e),frame);
 staggerTempleEnemy(e);assert.equal(e.walking,false);assert.equal(e.guardWalkDistance,null);assert.ok(!templeVisual(e).to.sheet.includes('-walk-'));
 e.dead=true;e.death=.7;step(s,{},.05);assert.equal(e.walkDistance,distance);
});
test('Packed walk assets have six equal transparent cells and measured sole anchors',async()=>{
 for(const [sheet,anchors] of Object.entries(TEMPLE_WALK_ANCHORS)){
  const b=await readFile(new URL(`../assets/${sheet}.png`,import.meta.url));assert.equal(b.readUInt32BE(16),1536);assert.equal(b.readUInt32BE(20),1024);assert.equal(b[25],6);
  assert.equal(anchors.length,6);for(const a of anchors){assert.ok(a.y>.96&&a.y<.99);assert.ok(a.x>.3&&a.x<.7);}
 }
});
