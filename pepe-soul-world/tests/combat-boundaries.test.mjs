import test from 'node:test';import assert from 'node:assert/strict';
import {createState,act,step,snapshot} from '../core.js';

function encounter(enemyX,playerX,face,hp=65){
 const s=createState({version:2,oath:true,training:3,world:'frozen',x:playerX});
 s.enemies=s.enemies.slice(0,1);Object.assign(s.enemies[0],{x:enemyX,hp,mode:'recover',timer:100});s.player.face=face;
 return s;
}
const cut=s=>{assert.equal(act(s,'attack'),true);for(let i=0;i<17;i++)step(s,{},1/60);};

test('cuts near both edges knock enemies in the attack direction without snapping to an inner arena',()=>{
 for(const [enemyX,playerX,face,expected] of [[300,400,-1,268],[300,200,1,332],[2460,2360,1,2492],[2460,2500,-1,2428]]){
  const s=encounter(enemyX,playerX,face);cut(s);assert.equal(s.enemies[0].x,expected);assert.ok(s.enemies[0].hp<65);
 }
});

test('edge defeats keep their actual pending loot positions across reload and grant it once',()=>{
 for(const [enemyX,playerX,face,dropX] of [[130,230,-1,100],[2470,2370,1,2500]]){
  let s=encounter(enemyX,playerX,face,1);cut(s);assert.equal(s.enemies[0].dead,true);
  assert.equal(s.drops[0].x,dropX);assert.equal(s.fragments,0);
  s=createState(snapshot(s));assert.equal(s.drops[0].x,dropX);
  for(let frame=0;frame<30&&s.drops.length;frame++)step(s,{left:face<0,right:face>0},1/60);
  assert.equal(s.drops.length,0);assert.equal(s.fragments,5);
  s=createState(snapshot(s));assert.equal(s.drops.length,0);assert.equal(s.fragments,5);
 }
});

test('ordinary patrol pursuit can cross the former inner boundary without a hit teleport',()=>{
 const s=createState({version:2,oath:true,training:3,world:'frozen'});
 for(let frame=0;frame<180;frame++)step(s,{},1/60);
 const enemy=s.enemies[0];assert.ok(enemy.x<500);assert.equal(s.player.hp,100);
 act(s,'wave');s.events=[];let hit=false;
 for(let frame=0;frame<60&&!hit;frame++){
  const before=enemy.x;step(s,{},1/60);
  if(s.events.some(e=>e.type==='waveHit')){assert.ok(enemy.x-before<=32.001,'Hit moved the enemy farther than ordinary knockback');hit=true;}
 }
 assert.equal(hit,true);
});

test('guardian knockback retains its smaller distance near the area edge',()=>{
 const s=encounter(300,400,-1);s.enemies[0].boss=true;cut(s);
 assert.equal(s.enemies[0].x,288);
});

test('elite lunges near either boundary move toward their committed facing',()=>{
 for(const [enemyX,playerX,face,expected] of [[180,100,-1,115],[2470,2500,1,2500]]){
  const s=encounter(enemyX,playerX,face);
  Object.assign(s.enemies[0],{elite:'melee',face,mode:'windup',timer:.001});
  step(s,{},1/60);assert.equal(s.enemies[0].x,expected);
 }
});
