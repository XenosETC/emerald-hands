import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,snapshot} from '../core.js';
import {addItem,compareGear,equip,stats} from '../systems.js';
test('gear previews include individual tempering and agree with actual equipment without mutating state',()=>{
 const s=createState();addItem(s,'frostFang');addItem(s,'voidFang');s.gearLevels.frostFang=3;equip(s,'frostFang');
 const saved=snapshot(s),events=structuredClone(s.events),preview=compareGear(s,'voidFang');
 assert.equal(preview.changes.attack,-2);assert.equal(preview.after.attack,18);
 assert.deepEqual(snapshot(s),saved);assert.deepEqual(s.events,events);
 equip(s,'voidFang');assert.deepEqual(stats(s),preview.after);
});
test('robe and charm previews show health tradeoffs and movement effects and exclude unusable items',()=>{
 const s=createState();addItem(s,'frostRobe');addItem(s,'veilTalisman');equip(s,'frostRobe');
 assert.deepEqual(compareGear(s,'academyRobe').changes,{health:-20,defense:-2});
 assert.deepEqual(compareGear(s,'veilTalisman').changes,{regen:-1,warpRange:40,wave:6});
 assert.deepEqual(compareGear(s,'frostRobe').changes,{});
 assert.equal(compareGear(s,'voidFang'),null);assert.equal(compareGear(s,'healthFlask'),null);
});
