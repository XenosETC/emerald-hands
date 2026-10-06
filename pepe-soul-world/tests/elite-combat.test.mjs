import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,step,GROUND} from '../core.js';import {ELITES,eliteSpec} from '../realm-enemies.js';
const patrol=world=>createState({version:2,world,zone:'approach2',approachCleared:[1,2,3],oath:true,training:3});
test('six unique enemies use complete anchored four-pose rows',()=>{
 const specs=Object.values(ELITES).flatMap(Object.values);assert.equal(new Set(specs.map(e=>e.name)).size,6);assert.deepEqual(specs.map(e=>e.row),[0,1,2,3,4,5]);
 const layout=JSON.parse(readFileSync(new URL('../docs/approach2-art-layout.json',import.meta.url)));assert.equal(layout.length,24);assert.ok(layout.every(f=>f.baseline===504&&f.source.count>1000&&f.source.maxY>f.source.minY+100));
});
test('Frost eruption commits to the warned location and can be escaped or jumped',()=>{
 for(const dodge of ['none','move','jump']){
 const s=patrol('frozen'),e=s.enemies[1];s.enemies=[e];s.player.x=e.x-200;e.face=-1;e.timer=0;step(s,{},1/60);assert.equal(e.mode,'windup');assert.equal(e.timer,.9);assert.equal(e.targetX,s.player.x);
 if(dodge==='move')s.player.x-=100;if(dodge==='jump'){s.player.y=GROUND-160;s.player.vy=-300;}
 e.timer=0;step(s,{},1/60);assert.equal(s.player.hp,dodge==='none'?80:100);
 }
});
test('caster projectiles carry their realm and damage, melee lunges preserve grounded feet',()=>{
 for(const world of ['crimson','void']){const s=patrol(world),e=s.enemies[1];s.enemies=[e];s.player.x=e.x-250;e.face=-1;e.mode='windup';e.timer=0;step(s,{},1/60);assert.equal(s.projectiles.length,1);assert.equal(s.projectiles[0].world,world);assert.equal(s.projectiles[0].damage,18);}
 for(const world of ['frozen','crimson','void']){const s=patrol(world),e=s.enemies[0],x=e.x;s.enemies=[e];s.player.x=x-150;e.face=-1;e.mode='windup';e.timer=0;step(s,{},1/60);assert.equal(e.x,x-(world==='crimson'?0:65));assert.equal(e.y,GROUND);assert.ok(eliteSpec(e));}
});
