import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step,GROUND} from '../core.js';

function arena(){
 const s=createState();s.world='frozen';
 s.enemies=[{id:1,world:'frozen',x:800,y:GROUND,hp:100,dead:false,mode:'recover',timer:100,anim:0,hitFlash:0,stun:0,vy:0}];
 return s;
}
const shot=(x,life,friendly)=>({x,y:GROUND-(friendly?75:45),vx:650,life,friendly,hit:[]});

test('already expired friendly and hostile shots cannot move or deal damage',()=>{
 const s=arena(),hp=s.player.hp;
 const friendly=shot(800,0,true),hostile=shot(s.player.x,-.01,false);
 s.projectiles=[friendly,hostile];step(s,{},1/30);
 assert.equal(s.enemies[0].hp,100);assert.equal(s.player.hp,hp);
 assert.equal(friendly.x,800);assert.equal(hostile.x,320);
 assert.equal(s.projectiles.length,0);
});

test('a final partial frame cannot extend friendly or hostile hit range',()=>{
 const s=arena(),hp=s.player.hp;
 const friendly=shot(720,.001,true),hostile=shot(265,.001,false);
 s.projectiles=[friendly,hostile];step(s,{},1/30);
 assert.equal(s.enemies[0].hp,100);assert.equal(s.player.hp,hp);
 assert.equal(friendly.x,720.65);assert.equal(hostile.x,265.65);
 assert.equal(friendly.age,.001);assert.equal(s.projectiles.length,0);
});

test('hits reached within the last active fraction still resolve once',()=>{
 const s=arena(),hp=s.player.hp;
 s.projectiles=[shot(740,.001,true),shot(274,.001,false)];
 step(s,{},1/30);
 assert.ok(s.enemies[0].hp<100);assert.ok(s.player.hp<hp);
 assert.equal(s.projectiles.length,0);
 const after=[s.enemies[0].hp,s.player.hp];step(s,{},1/30);
 assert.deepEqual([s.enemies[0].hp,s.player.hp],after);
});
