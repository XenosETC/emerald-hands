import test from 'node:test';import assert from 'node:assert/strict';
import {createState,act,step} from '../core.js';import {releaseInfo} from '../release-info.js';
import {SKILLS} from '../systems.js';
test('Release guidance matches actual cast cost, duration and cooldown at every awakening rank',()=>{
 for(let rank=0;rank<=SKILLS.awakening.max;rank++){
  const s=createState({version:2,xp:300,seals:['frozen'],skills:{awakening:rank}}),before=JSON.stringify(s),info=releaseInfo(s);
  assert.equal(JSON.stringify(s),before);assert.equal(info.duration,8+rank*2);assert.equal(info.bonus,12+rank*6);assert.equal(info.cost,55);assert.equal(info.cooldown,16);
  assert.equal(act(s,'release'),true);assert.equal(s.player.sp,100-info.cost);assert.equal(s.player.release,info.duration);assert.equal(s.player.releaseCooldown,info.cooldown);
  step(s,{},.05);assert.equal(releaseInfo(s).remaining,s.player.release);assert.match(releaseInfo(s).text,/Awakened.*remaining/);
 }
});
test('displayed cut bonus equals actual additional melee damage for every rank',()=>{
 for(let rank=0;rank<=SKILLS.awakening.max;rank++){
  const run=awakened=>{
   const s=createState({version:2,oath:true,training:3,world:'frozen',xp:300,seals:['frozen'],skills:{awakening:rank}}),enemy=s.enemies[0];
   s.player.x=enemy.x-100;enemy.hp=1000;if(awakened)assert.equal(act(s,'release'),true);
   assert.equal(act(s,'attack'),true);for(let frame=0;frame<20;frame++)step(s,{},1/60);
   return {damage:1000-enemy.hp,bonus:releaseInfo(s).bonus};
  };
  const normal=run(false),awakened=run(true);assert.ok(normal.damage>0);assert.equal(awakened.damage-normal.damage,awakened.bonus);
 }
});
test('locked awakening guidance never promises a cast or mutates the player',()=>{
 const s=createState(),before=JSON.stringify(s);assert.equal(releaseInfo(s).unlocked,false);assert.match(releaseInfo(s).text,/level 3.*seal/);assert.equal(act(s,'release'),false);s.events=[];assert.equal(JSON.stringify(s),before);
});
