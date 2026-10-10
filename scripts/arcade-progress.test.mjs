import {test} from 'node:test';
import assert from 'node:assert/strict';
import {keys, read, summarize} from '../arcade-progress.mjs';
import {createState, snapshot} from '../pepe-soul-world/core.js';
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

test('progress reader touches only the three published game saves and writes nothing', () => {
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
  assert.deepEqual(touched.sort(), Object.values(keys).sort());
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
