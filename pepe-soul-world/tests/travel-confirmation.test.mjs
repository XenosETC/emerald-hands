import test from 'node:test';import assert from 'node:assert/strict';
import {createState,snapshot,enterArena,enterWorld} from '../core.js';
import {confirmTravel,interactionLeavesArea} from '../travel-confirmation.js';

test('cancelling approach travel preserves the entire checkpoint and pending loot',()=>{
 const s=createState({version:2,oath:true,training:3,world:'frozen',x:2250,approachCleared:[1,2,3],pendingLoot:[{id:2,x:1160}]});
 const before=snapshot(s);let calls=0,prompt='';
 assert.equal(interactionLeavesArea(s),true);
 assert.equal(confirmTravel(s,()=>{calls++;return enterArena(s);},text=>{prompt=text;return false;}),false);
 assert.equal(calls,0);assert.deepEqual(snapshot(s),before);
 assert.match(prompt,/5 spirit fragments \+ Healing Flask at 1160/);
 assert.match(prompt,/cleared when you leave/);
 assert.equal(confirmTravel(s,()=>enterArena(s),()=>true),true);assert.equal(s.zone,'approach2');assert.equal(s.drops.length,0);
});

test('guardian exit names the uncollected seal and gear and allows an explicit departure',()=>{
 const s=createState({version:2,oath:true,training:3,world:'crimson',x:2250,zone:'arena',approachCleared:[1,2,3],guardianDefeated:true});
 const before=snapshot(s);let prompt='';
 assert.equal(confirmTravel(s,()=>enterWorld(s,'academy'),text=>{prompt=text;return false;}),false);
 assert.deepEqual(snapshot(s),before);assert.match(prompt,/Ember seal/);assert.match(prompt,/Ember Fang/);
 assert.equal(confirmTravel(s,()=>enterWorld(s,'academy'),()=>true),true);assert.equal(s.world,'academy');assert.deepEqual(s.seals,[]);
});

test('clean exits need no dialog and E only intercepts actual travel',()=>{
 const s=createState({version:2,oath:true,training:3,world:'frozen',approachCleared:[1,2,3],x:2250});
 assert.equal(confirmTravel(s,()=>enterArena(s),()=>{throw Error('Unexpected dialog');}),true);
 s.player.x=1360;assert.equal(interactionLeavesArea(s),false);
 s.player.x=2250;assert.equal(interactionLeavesArea(s),false,'living patrol blocks travel');
 s.player.x=230;assert.equal(interactionLeavesArea(s),true);
 s.zone='arena';assert.equal(interactionLeavesArea(s),false);
 s.guardianDefeated=true;s.player.x=2250;assert.equal(interactionLeavesArea(s),true);
 for(const blocked of [{hurt:.2},{guarding:true},{rift:{}},{riftQueued:{}},{domain:{}}]){const before={...s.player};Object.assign(s.player,blocked);assert.equal(interactionLeavesArea(s),false);s.player=before;}
 s.dead=true;assert.equal(interactionLeavesArea(s),false);
 assert.equal(interactionLeavesArea(createState()),false);
});
