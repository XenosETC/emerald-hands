import test from 'node:test';import assert from 'node:assert/strict';
import {createState,revive,maxHealth} from '../core.js';import {reviveGuidance} from '../revive-guidance.js';import {stats} from '../systems.js';
test('defeat guidance matches actual recovery destination without changing progress',()=>{
 for(const [saved,destination,zone] of [
  [{world:'frozen'},'academy','approach'],
  [{world:'frozen',discoveries:['frozen']},'shrine','approach'],
  [{world:'frozen',discoveries:['frozen'],zone:'arena',approachCleared:[1,2,3]},'shrine','approach2'],
  [{world:'temple',complete:true,discoveries:['temple'],zone:'arena',approachCleared:[1,2,3]},'shrine','approach'],
  [{world:'frozen',discoveries:['frozen'],zone:'arena',approachCleared:[1,2,3],guardianDefeated:true},'cleared-arena','arena']
 ]){
  const s=createState({version:2,oath:true,training:3,xp:150,fragments:25,...saved});s.dead=true;s.player.hp=0;
  const before=JSON.stringify(s),info=reviveGuidance(s);assert.equal(info.destination,destination);assert.equal(JSON.stringify(s),before);
  assert.equal(revive(s),true);assert.equal(s.world,destination==='academy'?'academy':saved.world);assert.equal(s.zone,zone);assert.equal(s.player.hp,maxHealth(s));assert.equal(s.player.sp,stats(s).spirit);assert.equal(s.xp,150);assert.equal(s.fragments,25);
 }
});
test('shrine guidance distinguishes patrol rewards, reset guardian attempts and retained victories',()=>{
 const s=createState({version:2,oath:true,training:3,world:'frozen',discoveries:['frozen'],approachCleared:[1],pendingLoot:[{id:1,x:800}]});s.dead=true;
 assert.match(reviveGuidance(s).text,/ground rewards remain/);assert.equal(revive(s),true);assert.equal(s.drops.length,1);
 s.zone='arena';s.dead=true;assert.match(reviveGuidance(s).text,/guardian attempt resets/);
 s.guardianDefeated=true;assert.match(reviveGuidance(s).text,/victory remains/);assert.doesNotMatch(reviveGuidance(s).text,/attempt resets/);
});
