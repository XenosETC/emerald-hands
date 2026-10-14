import test from 'node:test';import assert from 'node:assert/strict';
import {createState,step} from '../core.js';import {enemyTelegraph,realmAttackTiming} from '../enemy-timing.js';
import {templeTelegraph} from '../temple-combat.js';

test('ordinary, elite and guardian meters follow actual simulation phase timers in all seal realms',()=>{
 for(const world of ['frozen','crimson','void'])for(const kind of ['patrol','melee','caster','boss']){
  const zone=kind==='boss'?'arena':kind==='patrol'?'approach':'approach2';
  const s=createState({version:2,oath:true,training:3,world,zone,approachCleared:zone==='approach'?[]:[1,2,3]});
  const e=s.enemies[kind==='caster'?1:0];s.enemies=[e];s.player.x=e.x-100;
  for(let frame=0;frame<120&&e.mode==='idle';frame++)step(s,{},1/60);
  const timing=realmAttackTiming(e);assert.equal(e.mode,'windup');assert.equal(e.timer,timing.windup);
  assert.equal(e.windupDuration,timing.windup);assert.equal(enemyTelegraph(e).progress,0);
  for(let frame=0;frame<120&&e.mode==='windup';frame++)step(s,{},1/60);
  assert.equal(e.mode,'strike');assert.equal(e.timer,timing.strike);assert.equal(enemyTelegraph(e).label,'RELEASE');
  for(let frame=0;frame<120&&e.mode==='strike';frame++)step(s,{},1/60);
  assert.equal(e.mode,'recover');assert.equal(e.timer,timing.recovery);assert.equal(enemyTelegraph(e).progress,1);
  assert.equal(enemyTelegraph(e).label,'COUNTER WINDOW');
 }
});

test('stagger displays its real lock time instead of a frozen attack countdown',()=>{
 const e={world:'frozen',elite:'melee',mode:'windup',timer:.6,stun:.24};
 const before=structuredClone(e);assert.deepEqual(enemyTelegraph(e),{phase:'stagger',label:'STAGGERED',remaining:.24,progress:null,urgent:false});assert.deepEqual(e,before);
 e.stun=0;assert.equal(enemyTelegraph(e).phase,'windup');e.timer=.2;assert.equal(enemyTelegraph(e).urgent,true);
 e.dead=true;assert.equal(enemyTelegraph(e),null);e.dead=false;e.world='academy';assert.equal(enemyTelegraph(e),null);
});

test('Temple retains its existing attack names, tells and timing progression',()=>{
 for(const mode of ['idle','windup','strike','recover']){
  const e={world:'temple',mode,templeAttack:'cleave',timer:.3,attackCount:0,hp:100,maxHp:210,boss:true};
  assert.deepEqual(enemyTelegraph(e),templeTelegraph(e));
 }
});
