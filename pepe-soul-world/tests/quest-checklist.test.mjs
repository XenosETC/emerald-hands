import test from 'node:test';import assert from 'node:assert/strict';
import {createState,snapshot} from '../core.js';
import {questChecklist} from '../quest-checklist.js';
import {QUESTS,questReady,claimQuest} from '../systems.js';

test('shrine checklist exposes all four eligible realms and follows existing any-three readiness',()=>{
 const quest=QUESTS.find(q=>q.id==='echoes');
 for(const skipped of ['frozen','crimson','void','temple']){
  const discoveries=['frozen','crimson','void','temple'].filter(id=>id!==skipped);
  const s=createState({version:2,oath:true,training:3,complete:true,discoveries});
  const before=snapshot(s),rows=questChecklist(s,'echoes');
  assert.equal(rows.length,4);assert.equal(rows.filter(row=>row.done).length,3);
  assert.equal(rows.filter(row=>!row.done).length,1);assert.equal(questReady(s,quest),true);
  assert.deepEqual(snapshot(s),before);assert.match(quest.description,/three realm shrines/);
  assert.ok(rows.some(row=>row.label.includes('optional, after the oath')));
  assert.equal(claimQuest(s,'echoes'),true);assert.equal(s.xp,60);assert.equal(s.fragments,25);assert.equal(s.inventory.veilTalisman,1);
  const loaded=createState(snapshot(s));assert.equal(claimQuest(loaded,'echoes'),false);assert.equal(loaded.inventory.veilTalisman,1);
 }
});

test('seal recovery and mentor completion remain distinct checklist steps across reload',()=>{
 let s=createState({version:2,oath:true,training:3,seals:['frozen','void']});
 let rows=questChecklist(s,'guardian');assert.equal(rows.length,4);assert.deepEqual(rows.map(row=>row.done),[true,false,true,false]);
 s.seals.push('crimson');s=createState(snapshot(s));rows=questChecklist(s,'guardian');
 assert.deepEqual(rows.map(row=>row.done),[true,true,true,false]);
 assert.equal(questReady(s,QUESTS.find(q=>q.id==='guardian')),false);
 s.complete=true;assert.ok(questChecklist(s,'guardian').every(row=>row.done));
 assert.equal(claimQuest(s,'guardian'),true);const before=snapshot(s);questChecklist(s,'guardian');
 assert.deepEqual(snapshot(s),before);assert.equal(claimQuest(s,'guardian'),false);
 assert.deepEqual(questChecklist(s,'firstCut'),[]);
});
