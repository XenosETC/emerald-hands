import test from 'node:test';import assert from 'node:assert/strict';
import {createState} from '../core.js';import {questGuidance} from '../quest-guidance.js';
test('reward reminders take priority and disappear after claiming',()=>{
 const s=createState();s.oath=true;s.training=3;assert.equal(questGuidance(s).ready,1);
 s.claimedQuests.push('firstCut');assert.equal(questGuidance(s).ready,0);assert.match(questGuidance(s).text,/2250/);
});
test('realm guidance distinguishes remaining enemies, passage, arena and return portal',()=>{
 const s=createState({version:1,oath:true,training:3,world:'frozen'});
 assert.match(questGuidance(s).text,/3 \/ 3/);s.enemies.forEach(e=>e.dead=true);assert.match(questGuidance(s).text,/second map/);
 s.zone='arena';assert.match(questGuidance(s).text,/Rime Warden/);s.guardianDefeated=true;assert.match(questGuidance(s).text,/return portal/);
});
test('Temple return guidance never promises a second copy of its saved reward',()=>{
 const s=createState({version:2,oath:true,training:3,world:'temple',zone:'arena',approachCleared:[1,2,3],complete:true,guardianDefeated:true});
 assert.match(questGuidance(s).text,/Collect your fragments and flask/);s.bossRewards.push('temple');assert.match(questGuidance(s).text,/Reward already recovered/);assert.doesNotMatch(questGuidance(s).text,/Collect/);
 s.guardianDefeated=false;assert.match(questGuidance(s).text,/Defeat the Jade Abbot/);
});
