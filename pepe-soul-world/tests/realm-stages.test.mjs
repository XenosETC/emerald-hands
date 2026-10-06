import test from 'node:test';import assert from 'node:assert/strict';
import {createState,enterArena,enterWorld,snapshot,revive,step} from '../core.js';
const ready=()=>createState({version:2,oath:true,training:3,world:'frozen',zone:'approach2',approachCleared:[1,2,3,5,6,7],discoveries:['frozen'],x:2250});
test('approach gates the arena, and arena gates return travel until guardian defeat at the portal',()=>{
 const s=createState({version:1,oath:true,training:3,world:'frozen',x:2250});assert.equal(s.enemies.length,3);assert.ok(s.enemies.every(e=>!e.boss));assert.equal(enterArena(s),false);
 const a=ready();assert.equal(enterArena(a),true);assert.equal(a.zone,'arena');assert.equal(a.enemies.length,1);assert.equal(a.enemies[0].boss,true);assert.equal(enterWorld(a,'academy'),false);
 a.guardianDefeated=true;assert.equal(enterWorld(a,'academy'),false);a.player.x=2250;assert.equal(enterWorld(a,'academy'),true);
});
test('arena save restores uncollected rewards, collected rewards never duplicate, and retry keeps approach cleared',()=>{
 const s=ready();enterArena(s);s.guardianDefeated=true;s.enemies[0].dead=true;const loaded=createState(snapshot(s));assert.equal(loaded.zone,'arena');assert.equal(loaded.drops.length,2);
 loaded.player.x=2090;step(loaded,{},1/60);assert.equal(loaded.drops.length,0);assert.ok(loaded.seals.includes('frozen'));assert.ok(loaded.bossRewards.includes('frozen'));assert.equal(createState(snapshot(loaded)).drops.length,0);
 const retry=ready();enterArena(retry);retry.dead=true;assert.equal(revive(retry),true);assert.equal(retry.zone,'approach2');assert.equal(retry.player.x,1360);assert.ok(retry.enemies.every(e=>e.dead));retry.player.x=2250;assert.equal(enterArena(retry),true);assert.equal(retry.enemies[0].hp,210);
});
test('every realm requires its distinct elite patrol before map three, and reload retains partial clears',()=>{
 for(const world of ['frozen','crimson','void']){
 const s=createState({version:2,oath:true,training:3,world,approachCleared:[1,2,3],x:2250});
 assert.equal(enterArena(s),true);assert.equal(s.zone,'approach2');assert.deepEqual(s.enemies.map(e=>e.elite),['melee','caster','melee']);assert.equal(enterArena(s),false);
 s.enemies[0].dead=true;s.approachCleared.push(5);const loaded=createState(snapshot(s));assert.equal(loaded.zone,'approach2');assert.equal(loaded.enemies.filter(e=>!e.dead).length,2);
 s.enemies.forEach(e=>{e.dead=true;s.approachCleared.push(e.id);});s.player.x=2250;assert.equal(enterArena(s),true);assert.equal(s.zone,'arena');assert.equal(s.enemies[0].boss,true);
 }
});
