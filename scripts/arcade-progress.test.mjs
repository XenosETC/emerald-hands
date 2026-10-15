import {test} from 'node:test';
import assert from 'node:assert/strict';
import {keys, templeRecoveryKey, read, summarize} from '../arcade-progress.mjs';
import {createState, snapshot} from '../pepe-soul-world/core.js';
import {QUESTS as SOUL_QUESTS} from '../pepe-soul-world/systems.js';
import {newCampaign} from '../pepe-feudalism/campaign.js';
import {hydrateAdventure} from '../pepe-feudalism/adventure.js';

test('Soul World displays the checkpoint realm, native level and objective without changing its save', () => {
  const value = snapshot(createState({version:2, oath:true, training:3, world:'frozen', xp:150, seals:['crimson'], approachCleared:[1,2,3], zone:'approach2'}));
  const before = JSON.stringify(value);
  const info = summarize('soulWorld', value);
  assert.equal(info.status, 'saved');
  assert.equal(info.summary, 'Level 3 · Frozen District · 1/3 seals');
  assert.match(info.goal, /Approach II · 3 \/ 3 enemies remain/);
  assert.equal(info.action, 'Continue journey');
  assert.equal(JSON.stringify(value), before);
});

test('Soul World legacy saves obey its real academy gate and quest readiness rules', () => {
  const locked = summarize('soulWorld', {version:1, world:'void', training:0, oath:false});
  assert.match(locked.summary, /Kek Academy/);
  assert.match(locked.goal, /Meet Goribbit/);
  const academy = summarize('soulWorld', {version:2, oath:true, training:3, seals:['frozen','crimson','void']});
  assert.match(academy.summary, /3\/3 seals/);
  assert.notEqual(academy.status, 'empty');
  assert.equal(summarize('soulWorld', {version:99}).status, 'unavailable');
});
test('Soul World completed oath prioritizes outstanding rewards then Temple and replay',()=>{
 const value=snapshot(createState({version:2,oath:true,training:3,complete:true,seals:['frozen','crimson','void']}));
 const before=JSON.stringify(value),pending=summarize('soulWorld',value);
 assert.equal(pending.label,'Oath fulfilled');assert.equal(pending.action,'Review rewards');assert.match(pending.goal,/quest reward.*ready/);assert.equal(JSON.stringify(value),before);
 value.claimedQuests=SOUL_QUESTS.map(q=>q.id);const unlocked=summarize('soulWorld',value);assert.match(unlocked.goal,/Emerald Temple unlocked/);assert.equal(unlocked.action,'Revisit journey');
 value.bossRewards=['temple'];assert.match(summarize('soulWorld',value).goal,/Oath and Emerald Temple complete/);
 value.world='temple';const combat=summarize('soulWorld',value);assert.match(combat.goal,/Temple Approach.*3 \/ 3 disciples remain/);assert.equal(combat.action,'Continue journey');
});
test('Soul World hub retains checkpoint combat and pending loot guidance before oath completion',()=>{
 const value=snapshot(createState({version:2,oath:true,training:3,world:'frozen',zone:'approach',approachCleared:[1,2,3],pendingLoot:[{id:1,x:800}]}));
 const info=summarize('soulWorld',value);assert.equal(info.label,'Saved checkpoint');assert.match(info.goal,/1 ground reward remains/);assert.equal(info.action,'Continue journey');
});

test('Feudalism shows its saved warband and gives ready contracts priority over active contracts', () => {
  const value = hydrateAdventure(newCampaign());
  Object.assign(value, {location:'mossford', level:3, quests:{briar:'active',elder:'ready'}});
  const before = JSON.stringify(value);
  const info = summarize('feudalism', value);
  assert.equal(info.summary, 'Level 3 · Mossford · 3 soldiers');
  assert.equal(info.goal, 'Claim The Elderwood Watch in Mossford.');
  assert.equal(info.action, 'Continue campaign');
  assert.equal(JSON.stringify(value), before);
  value.quests.elder = 'completed';
  assert.equal(summarize('feudalism', value).goal, 'Raiders in the Briar · Head to Briar Forest.');
});

test('Feudalism uses its existing migration, conquest and location fallback rules', () => {
  const value = newCampaign();
  delete value.armyXp;
  value.location = 'unknown'; value.owned.push('outpost'); value.quests = {crossing:'active'};
  const info = summarize('feudalism', value);
  assert.match(info.summary, /Crownhaven/);
  assert.equal(info.goal, 'Claim Secure the Crossing in Sunspire Castle.');
  value.gold = -1;
  assert.equal(summarize('feudalism', value).status, 'unavailable');
});

test('Temple Run reports a record and a new run, never a resumable position', () => {
  const info = summarize('templeRun', {best:1420});
  assert.equal(info.summary, 'Best 1,420 m');
  assert.equal(info.label, 'Saved distance record');
  assert.equal(info.action, 'Run again');
  assert.match(info.goal, /Start a new run/);
  for (const value of [null, {}, {best:-1}, {best:'400'}, {best:1.5}, {best:Infinity}]) {
    assert.equal(summarize('templeRun', value).status, 'unavailable');
  }
  assert.equal(summarize('templeRun', {best:0}).status, 'saved');
});

test('progress reader touches only the published game saves and protected runner recovery key', () => {
  const values = new Map([
    [keys.soulWorld, JSON.stringify(snapshot(createState()))],
    [keys.feudalism, JSON.stringify(newCampaign())],
    [keys.templeRun, '{"best":600}'],
    ['pepe-soul-world-practice-v1', 'do-not-read'],
    ['emerald-arcade-v1', '{"xp":123}'],
    ['shard-rush-ghost-v1', 'keep-ghost'],
  ]);
  const before = [...values], touched = [];
  const info = read({getItem(key) {touched.push(key); return values.get(key) ?? null;}, setItem() {throw Error('No writes permitted');}});
  assert.deepEqual(touched.sort(), [...Object.values(keys),templeRecoveryKey].sort());
  assert.equal(Object.values(info).every(item => item.status === 'saved'), true);
  assert.deepEqual([...values], before);
});

test('missing, corrupt, oversized and inaccessible saves have distinct recoverable displays', () => {
  assert.equal(read({getItem: () => null}).soulWorld.status, 'empty');
  for (const raw of ['{', 'null', '{}', '[]', 'x'.repeat(250001)]) {
    assert.equal(read({getItem: () => raw}).soulWorld.status, 'unavailable');
  }
  assert.equal(Object.values(read(undefined)).every(item => item.status === 'unavailable'), true);
  const mixed = read({getItem(key) {if (key === keys.soulWorld) throw Error('blocked'); return key === keys.templeRun ? '{"best":200}' : null;}});
  assert.equal(mixed.soulWorld.status, 'unavailable');
  assert.equal(mixed.feudalism.status, 'empty');
  assert.equal(mixed.templeRun.summary, 'Best 200 m');
});

test('Temple protected recovery remains visible without writing or lowering a valid primary best',()=>{
 for(const [primary,recovery,meters,recovered] of [['broken','{"best":143}',143,true],['{"best":100}','{"best":700}',700,true],['{"best":900}','{"best":700}',900,false],[null,'{"best":0}',0,true]]){
  const values=new Map([[keys.templeRun,primary],[templeRecoveryKey,recovery]]),before=[...values];
  const info=read({getItem:key=>values.get(key)??null,setItem(){throw Error('No writes');}}).templeRun;
  assert.equal(info.summary,'Best '+meters.toLocaleString()+' m');assert.equal(info.label,recovered?'Recovered distance record':'Saved distance record');assert.deepEqual([...values],before);
 }
 assert.equal(read({getItem:key=>key===templeRecoveryKey?'broken':'{"best":-1}'}).templeRun.status,'unavailable');
});
