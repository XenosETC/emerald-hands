import test from 'node:test';import assert from 'node:assert/strict';
import {createState,step,act,enterWorld} from '../core.js';import {questGuidance,academyTrail} from '../quest-guidance.js';
import {claimQuest,QUESTS} from '../systems.js';
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


test('guardian return guidance matches remaining saved seal and gear drops in all three realms',()=>{
 for(const world of ['frozen','crimson','void'])for(const seal of [false,true])for(const gear of [false,true]){
  const s=createState({version:2,oath:true,training:3,world,zone:'arena',approachCleared:[1,2,3],guardianDefeated:true,seals:seal?[world]:[],bossRewards:gear?[world]:[]});
  const guidance=questGuidance(s);
  assert.equal(s.drops.some(drop=>drop.kind==='seal'),!seal);
  assert.equal(s.drops.some(drop=>drop.kind==='loot'),!gear);
  assert.match(guidance.text,/return portal/);
  if(!seal)assert.match(guidance.text,/Collect the seal/);
  if(!gear)assert.match(guidance.text,/guardian gear/);
  if(seal&&gear){assert.match(guidance.text,/already recovered/);assert.doesNotMatch(guidance.text,/Collect/);}
  if(seal&&!gear)assert.match(guidance.text,/Collect guardian gear/);
  if(!seal&&gear)assert.doesNotMatch(guidance.text,/and guardian gear/);
 }
});


test('academy trails guide a real movement, oath, training and first reward route without position grants',()=>{
 const s=createState();
 const walk=()=>{const trail=academyTrail(s);assert.ok(trail);for(let i=0;i<1000&&Math.abs(s.player.x-trail.x)>=10;i++)step(s,{left:s.player.x>trail.x,right:s.player.x<trail.x},1/60);assert.ok(Math.abs(s.player.x-trail.x)<10);};
 assert.equal(academyTrail(s).label,'Goribbit');walk();act(s,'interact');assert.equal(s.oath,true);
 assert.equal(academyTrail(s).label,'the training effigy');walk();
 for(let cut=0;cut<3;cut++){act(s,'attack');for(let i=0;i<40;i++)step(s,{},1/60);}
 assert.equal(s.training,3);assert.equal(academyTrail(s),null);
 assert.equal(claimQuest(s,'firstCut'),true);assert.equal(s.xp,60);
 assert.equal(academyTrail(s).label,'the veil gate');walk();assert.equal(enterWorld(s,'frozen'),true);
 assert.equal(academyTrail(s),null);
});
test('academy trail approaches the effigy from either side and never steers dead or invalid completed players',()=>{
 const s=createState({version:2,oath:true});s.player.x=1100;assert.equal(academyTrail(s).x,970);s.player.x=600;assert.equal(academyTrail(s).x,770);
 s.player.x=800;assert.equal(academyTrail(s),null);s.dead=true;assert.equal(academyTrail(s),null);
 s.dead=false;s.training=3;s.complete=true;s.claimedQuests=['firstCut'];assert.equal(academyTrail(s),null);
});
test('completed oath keeps an optional Temple trail until its reward is recovered, without changing progress',()=>{
 const s=createState({version:2,oath:true,training:3,complete:true,seals:['frozen','crimson','void'],claimedQuests:QUESTS.map(q=>q.id)});
 const before=JSON.stringify(s);assert.deepEqual(academyTrail(s),{x:2250,label:'the Emerald Temple gate'});assert.match(questGuidance(s).text,/Optional Emerald Temple/);assert.equal(JSON.stringify(s),before);
 s.bossRewards.push('temple');assert.equal(academyTrail(s),null);assert.doesNotMatch(questGuidance(s).text,/awaits/);
});
test('claimable rewards still take priority over the optional Temple trail',()=>{
 const s=createState({version:2,oath:true,training:3,complete:true,seals:['frozen','crimson','void']});
 assert.ok(questGuidance(s).ready>0);assert.equal(academyTrail(s),null);
});
