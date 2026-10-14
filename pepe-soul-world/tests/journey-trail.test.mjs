import test from 'node:test';import assert from 'node:assert/strict';
import {createState,step,enterArena,snapshot} from '../core.js';import {journeyTrail} from '../journey-trail.js';
test('cleared approach trail collects pending rewards through actual walking before guiding to the passage',()=>{
 const s=createState({version:2,oath:true,training:3,world:'frozen',discoveries:['frozen'],x:2000,fragments:25,approachCleared:[1,2,3],pendingLoot:[{id:1,x:800},{id:2,x:1160},{id:3,x:1540}]});
 const before=snapshot(s);assert.equal(journeyTrail(s).x,1540);assert.deepEqual(snapshot(s),before);
 const flasks=s.inventory.healthFlask;
 while(s.drops.length){const target=journeyTrail(s);assert.match(target.label,/reward/);const count=s.drops.length;for(let frame=0;frame<1200&&s.drops.length===count;frame++)step(s,{left:s.player.x>target.x,right:s.player.x<target.x},1/60);assert.equal(s.drops.length,count-1);}
 assert.equal(s.fragments,40);assert.equal(s.inventory.healthFlask,flasks+1);assert.equal(journeyTrail(s).label,'the next passage');
 for(let frame=0;frame<1200&&Math.abs(s.player.x-2250)>=10;frame++)step(s,{right:true},1/60);
 assert.equal(s.zone,'approach','Trail must not cross automatically');assert.equal(enterArena(s),true);assert.equal(s.zone,'approach2');assert.equal(journeyTrail(s),null);
});
test('living enemies, defeat and uncleared arenas never get an automatic combat trail',()=>{
 const s=createState({version:2,oath:true,training:3,world:'frozen'});assert.equal(journeyTrail(s),null);
 s.enemies.forEach(e=>e.dead=true);s.dead=true;assert.equal(journeyTrail(s),null);s.dead=false;s.zone='arena';assert.equal(journeyTrail(s),null);
 s.guardianDefeated=true;assert.deepEqual(journeyTrail(s),{x:2250,label:'the return portal'});
 s.projectiles.push({friendly:false,life:1});assert.equal(journeyTrail(s),null);s.projectiles=[];
 s.player.hurt=.2;assert.equal(journeyTrail(s),null);
});
test('academy onboarding and Temple guardian passage retain their own destinations',()=>{
 assert.equal(journeyTrail(createState()).label,'Goribbit');
 const s=createState({version:2,oath:true,training:3,complete:true,world:'temple',discoveries:['temple'],approachCleared:[1,2,3]});assert.deepEqual(journeyTrail(s),{x:2250,label:'the guardian passage'});
});
