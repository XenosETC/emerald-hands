import test from 'node:test';import assert from 'node:assert/strict';
import {createState,enterWorld,enterArena,act,step,snapshot,interact} from '../core.js';
import {realmPortals} from '../portal-state.js';
const saved={version:2,xp:600,oath:true,training:3,seals:['frozen','crimson','void'],complete:true};
test('Temple is an oath-gated two-map challenge with coherent boss return and saved rewards',()=>{
 const locked=createState({...saved,complete:false});locked.player.x=2250;assert.equal(enterWorld(locked,'temple'),false);
 const s=createState(saved);s.player.x=2250;assert.equal(enterWorld(s,'temple'),true);assert.equal(s.zone,'approach');
 s.player.invuln=100;for(const enemy of s.enemies){s.player.x=enemy.x-90;act(s,'domain');for(let i=0;i<150;i++)step(s,{},1/60);s.player.domainCooldown=0;s.player.sp=100;}
 assert.equal(s.enemies.filter(e=>!e.dead).length,0);assert.match(realmPortals(s)[1].prompt,/GUARDIAN/);
 s.player.x=2250;assert.equal(enterArena(s),true);assert.equal(s.zone,'arena');assert.equal(s.enemies.length,1);
 s.player.x=1900;for(let i=0;i<3;i++){s.player.domainCooldown=0;s.player.sp=100;act(s,'domain');for(let j=0;j<150;j++)step(s,{},1/60);}
 assert.equal(s.guardianDefeated,true);assert.equal(s.drops.some(d=>d.kind==='seal'),false);assert.equal(s.seals.length,3);
 const restored=createState(snapshot(s));assert.equal(restored.world,'temple');assert.equal(restored.guardianDefeated,true);assert.ok(restored.drops.some(d=>d.item==='healthFlask'));
 restored.player.x=2100;step(restored,{},1/60);assert.ok(restored.bossRewards.includes('temple'));
 const collected=createState(snapshot(restored));assert.equal(collected.drops.length,0);
 collected.player.x=2250;interact(collected);assert.equal(collected.world,'academy');
});
