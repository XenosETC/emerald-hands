import test from 'node:test';import assert from 'node:assert/strict';
import {createState,snapshot} from '../core.js';import {QUESTS} from '../systems.js';import {oathSummary} from '../oath-summary.js';
test('completion summary waits for mentor completion and all three seals',()=>{
 const s=createState();assert.equal(oathSummary(s),null);s.seals=['frozen','crimson','void'];assert.equal(oathSummary(s),null);
 s.complete=true;assert.equal(oathSummary(s).ready,1);s.seals.pop();assert.equal(oathSummary(s),null);
});
test('completion reward and temple status follow saved receipts without mutating progress',()=>{
 const s=createState({version:2,complete:true,seals:['frozen','crimson','void'],claimedQuests:QUESTS.map(q=>q.id),bossRewards:['temple']});
 const before=snapshot(s),summary=oathSummary(s);assert.equal(summary.claimed,6);assert.equal(summary.ready,0);assert.equal(summary.templeCleared,true);assert.match(summary.rewardText,/All quest rewards claimed/);assert.deepEqual(snapshot(s),before);
});
