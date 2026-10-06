import test from 'node:test';
import assert from 'node:assert/strict';
import {stepTempleEnemy,templeCue,TEMPLE_ATTACKS} from '../temple-combat.js';
import {createState,step,act,GROUND} from '../core.js';

const boss=(extra={})=>({id:4,world:'temple',boss:true,x:1500,y:GROUND,hp:210,maxHp:210,attackCount:0,face:-1,mode:'idle',timer:0,...extra});
const player=(extra={})=>({x:1340,y:GROUND,...extra});
function begin(e,p){stepTempleEnemy(e,p,1/60,GROUND);assert.equal(e.mode,'windup');}
const strike=(e,p)=>stepTempleEnemy(e,p,e.timer+.001,GROUND);
const damages=actions=>actions.filter(a=>a.type==='damage');

test('Cleave locks its facing, waits for the full tell, and exposes a recovery window',()=>{
 const e=boss(),p=player();begin(e,p);assert.match(templeCue(e),/JADE CLEAVE/);
 assert.equal(damages(stepTempleEnemy(e,p,.4,GROUND)).length,0);
 assert.equal(e.mode,'windup');p.x=1640;
 assert.equal(damages(strike(e,p)).length,0);assert.equal(e.face,-1);
 stepTempleEnemy(e,p,.21,GROUND);assert.equal(e.mode,'recover');assert.match(templeCue(e),/Counterattack/);
 assert.equal(e.timer,TEMPLE_ATTACKS.cleave.recovery);
 stepTempleEnemy(e,p,1,GROUND);assert.equal(e.mode,'recover');
 stepTempleEnemy(e,p,.06,GROUND);assert.equal(e.mode,'idle');
});
test('Grounded cleave connects while a high jump avoids it',()=>{
 for(const airborne of [false,true]){const e=boss(),p=player();begin(e,p);if(airborne)p.y=GROUND-160;assert.equal(damages(strike(e,p)).length,airborne?0:1);}
});
test('Lotus marks lock to the warned ground and never chase an evading player',()=>{
 const e=boss({attackCount:1}),p=player();begin(e,p);assert.deepEqual(e.marks,[1340]);
 p.x=1000;const actions=strike(e,p);assert.deepEqual(actions.filter(a=>a.type==='templeLotus').map(a=>a.x),[1340]);assert.equal(damages(actions).length,0);
});
test('Half-health Abbot plants three separated lotus zones with safe gaps',()=>{
 for(const offset of [0,105,210]){const e=boss({attackCount:1,hp:105}),p=player();begin(e,p);assert.deepEqual(e.marks,[1130,1340,1550]);p.x+=offset;assert.equal(damages(strike(e,p)).length,offset===105?0:1);}
});
test('Abbot cycles cleave, lotus, wave; wave travels in the committed direction',()=>{
 const e=boss(),p=player();
 for(const key of ['cleave','lotus','wave','cleave']){
  begin(e,p);assert.equal(e.templeAttack,key);const events=strike(e,p);
  if(key==='wave'){const q=events.find(a=>a.type==='projectile');assert.ok(q);assert.equal(q.vx,-350);assert.equal(q.y,GROUND-40);assert.equal(q.owner,4);}
  stepTempleEnemy(e,p,.21,GROUND);stepTempleEnemy(e,p,e.timer+.001,GROUND);e.timer=0;
 }
});
test('Disciple uses the shorter staff sweep and never the guardian pattern',()=>{
 const e=boss({boss:false,x:1460,attackCount:2}),p=player();begin(e,p);assert.equal(e.templeAttack,'staff');assert.equal(e.timer,.7);assert.equal(damages(strike(e,p)).length,1);
});
const arena=()=>createState({version:2,world:'temple',zone:'arena',approachCleared:[1,2,3],oath:true,training:3,xp:600,complete:true,seals:['frozen','crimson','void']});
test('Real Warp Step escapes a committed Temple cleave without taking damage',()=>{
 const s=arena(),e=s.enemies[0],p=s.player;e.x=1500;e.timer=0;p.x=1340;p.face=1;step(s,{},1/60);assert.equal(e.mode,'windup');
 const hp=p.hp;assert.ok(act(s,'dash'));for(let i=0;i<55;i++)step(s,{},1/60);assert.ok(p.x>e.x);assert.equal(p.hp,hp);
});
test('A timed real jump clears the cleave and a real Rift cancels the lotus windup',()=>{
 for(const move of ['jump','rift']){
  const s=arena(),e=s.enemies[0],p=s.player;e.x=1500;p.x=1340;e.timer=0;e.attackCount=move==='rift'?1:0;
  step(s,{},1/60);const hp=p.hp;for(let i=0;i<24;i++)step(s,{},1/60);
  assert.ok(act(s,'jump'));step(s,{},1/60);if(move==='rift')assert.ok(act(s,'wave'));
  for(let i=0;i<52;i++)step(s,{},1/60);assert.equal(p.hp,hp);
  if(move==='rift'){assert.ok(e.hp<e.maxHp);assert.equal(s.events.some(e=>e.type==='templeLotus'),false);}
 }
});
test('Low Temple wave hits a grounded hero, can be jumped, and expires with its owner',()=>{
 for(const action of ['ground','jump','dead']){
  const s=arena(),e=s.enemies[0],p=s.player;p.x=1500;e.x=1750;e.mode='recover';e.timer=10;
  s.projectiles.push({x:1630,y:GROUND-40,vx:-350,life:2,damage:18,friendly:false,world:'temple',owner:e.id});
  const hp=p.hp;if(action==='jump')assert.ok(act(s,'jump'));if(action==='dead'){e.dead=true;e.death=0;}
  for(let i=0;i<28;i++)step(s,{},1/60);
  if(action==='ground')assert.ok(p.hp<hp);else assert.equal(p.hp,hp);
  if(action==='dead')assert.equal(s.projectiles.length,0);
 }
});
test('A slain Abbot cannot finish a queued lotus eruption',()=>{
 const s=arena(),e=s.enemies[0];e.x=1500;s.player.x=1340;e.attackCount=1;e.timer=0;step(s,{},1/60);assert.equal(e.mode,'windup');
 s.events=[];e.dead=true;e.hp=0;e.death=.7;for(let i=0;i<80;i++)step(s,{},1/60);
 assert.equal(s.events.some(e=>e.type==='templeLotus'),false);
});
