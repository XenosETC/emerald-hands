import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step,act,enterWorld,enterArena,snapshot,canDomain,maxHealth} from '../core.js';
import {QUESTS,claimQuest,questReady,equip,learn,useItem} from '../systems.js';
import {oathSummary} from '../oath-summary.js';

test('fresh oath route earns all seals, gear and quests through movement and combat without state grants',()=>{
 let s=createState();let frames=0,cuts=0,heals=0;
 const tick=input=>{step(s,input,1/60);frames++;assert.equal(s.dead,false,`Knocked out in ${s.world}/${s.zone} at ${s.player.x}`);s.events.length=0;};
 const walk=x=>{for(let i=0;i<2400&&Math.abs(s.player.x-x)>8;i++)tick({left:s.player.x>x,right:s.player.x<x});assert.ok(Math.abs(s.player.x-x)<=8,`Could not walk to ${x}`);};
 const rewards=()=>{for(const q of QUESTS)if(questReady(s,q))assert.equal(claimQuest(s,q.id),true);for(const id of ['frostFang','emberFang','voidFang','frostRobe','emberRobe','voidRobe','veilTalisman'])if(s.inventory[id])equip(s,id);while(learn(s,'blade')){};};
 const fight=()=>{
  for(let i=0;i<12000&&s.enemies.some(e=>!e.dead);i++){
   const p=s.player,e=s.enemies.filter(e=>!e.dead).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0],dx=e.x-p.x;
   if(p.hp<maxHealth(s)*.5&&useItem(s,'healthFlask'))heals++;
   if(Math.abs(dx)<145&&p.face===Math.sign(dx)&&p.attack<=0){if(act(s,'attack'))cuts++;}
   tick({left:dx<0,right:dx>0});
  }
  assert.ok(s.enemies.every(e=>e.dead),`Combat timed out in ${s.world}/${s.zone}`);
  for(const drop of [...s.drops])walk(drop.x);
  rewards();
 };
 walk(490);act(s,'interact');assert.equal(s.oath,true);walk(770);
 for(let i=0;i<3;i++){assert.equal(act(s,'attack'),true);for(let f=0;f<40;f++)tick({});}
 assert.equal(s.training,3);rewards();
 for(const world of ['frozen','crimson','void']){
  walk(2250);assert.equal(enterWorld(s,world),true);
  fight();walk(1360);act(s,'interact');assert.ok(s.discoveries.includes(world));
  walk(2250);assert.equal(enterArena(s),true);fight();
  walk(2250);assert.equal(enterArena(s),true);fight();assert.ok(s.seals.includes(world));assert.ok(s.bossRewards.includes(world));
  walk(2250);assert.equal(enterWorld(s,'academy'),true);
  // Reconstruct from an earned checkpoint after each realm; no seeded XP, positions or rewards.
  s=createState(snapshot(s));walk(490);act(s,'interact');rewards();
 }
 assert.equal(s.complete,true);assert.equal(canDomain(s),true);
 assert.equal(s.claimedQuests.length,QUESTS.length);assert.deepEqual(s.seals,['frozen','crimson','void']);
 assert.equal(oathSummary(s).rewardText,'All quest rewards claimed.');assert.equal(oathSummary(s).templeCleared,false);
 assert.ok(frames/60<600,`Route exceeded ten simulated minutes: ${frames/60}`);
 const earned=snapshot(s);act(s,'interact');rewards();assert.equal(s.xp,earned.xp);assert.equal(s.fragments,earned.fragments);
 console.log(JSON.stringify({route:'fresh-oath',seconds:Math.round(frames/60),cuts,heals,xp:s.xp,fragments:s.fragments,seals:s.seals,quests:s.claimedQuests}));
});
