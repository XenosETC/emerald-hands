import test from 'node:test';import assert from 'node:assert/strict';
import {createState,step,act,snapshot,enterArena,revive} from '../core.js';
import {journeyTrail} from '../journey-trail.js';
import {questGuidance} from '../quest-guidance.js';

test('safe shrine trail uses walking, explicit attunement and persistent recovery in every realm',()=>{
 for(const world of ['frozen','crimson','void','temple']){
  let s=createState({version:2,oath:true,training:3,complete:true,world,x:2000,approachCleared:[1,2,3]});
  const before=snapshot(s);assert.deepEqual(journeyTrail(s),{x:1360,label:'the unattuned echo shrine'});assert.deepEqual(snapshot(s),before);
  assert.match(questGuidance(s).text,/Optional echo shrine/);
  for(let frame=0;frame<600&&Math.abs(s.player.x-1360)>=10;frame++)step(s,{left:true},1/60);
  assert.equal(journeyTrail(s),null);assert.deepEqual(s.discoveries,[]);assert.equal(s.xp,0);assert.equal(s.fragments,0);
  act(s,'interact');assert.ok(s.discoveries.includes(world));assert.equal(s.xp,15);assert.equal(s.fragments,10);
  act(s,'interact');assert.equal(s.xp,15);assert.equal(s.fragments,10);
  s=createState(snapshot(s));assert.equal(journeyTrail(s).x,2250);assert.doesNotMatch(questGuidance(s).text,/Optional echo shrine/);
  s.dead=true;s.player.hp=0;assert.equal(revive(s),true);assert.equal(s.world,world);assert.equal(s.player.x,1360);
 }
});

test('loot and combat take priority, and players can still choose to skip the shrine',()=>{
 const s=createState({version:2,oath:true,training:3,world:'frozen',x:2250,approachCleared:[1,2,3],pendingLoot:[{id:1,x:800}]});
 assert.match(journeyTrail(s).label,/reward/);assert.match(questGuidance(s).text,/ground reward/);
 s.drops=[];assert.match(journeyTrail(s).label,/shrine/);
 s.projectiles.push({friendly:false,life:1});assert.equal(journeyTrail(s),null);s.projectiles=[];
 assert.equal(enterArena(s),true);assert.equal(s.zone,'approach2');assert.deepEqual(s.discoveries,[]);
 assert.equal(journeyTrail(s),null);
});
