import test from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign,recruit,settle,migrateSave} from '../campaign.js';
import {createBattle} from '../combat.js';
import {troopIdentity} from '../regional-troops.js';
test('local recruits keep origin through battle casualties and reload',()=>{const s=newCampaign();s.location='frostford';assert.ok(recruit(s,'spearman'));assert.equal(s.armyOrigins[3],'frostford');const b=createBattle(s,'hunt');const local=b.units.find(u=>u.origin==='frostford');assert.ok(local);assert.ok(settle(s,'hunt',true,[{type:local.type,xp:local.xp,origin:local.origin}]));const restored=migrateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.armyOrigins,['frostford']);assert.equal(troopIdentity(restored.army[0],restored.armyOrigins[0]).troopName,'Frost Spearman');assert.deepEqual(migrateSave(newCampaign()).armyOrigins,['home','home','home']);});

import {configureEncounter} from '../encounters.js';
test('enemy armies inherit the encounter environment without altering allied origins',()=>{for(const [destination,origin]of [['highpass','frostford'],['ashgrove','cinderford'],['jadeforest','greenmere'],['keep','keep']]){const s=newCampaign();s.armyOrigins=['port','port','port'];const b=createBattle(s,destination==='keep'?'keep':'hunt');configureEncounter(b,destination);assert.ok(b.units.filter(u=>u.team===1).every(u=>u.origin===origin));assert.ok(b.units.filter(u=>u.team===0&&!u.hero).every(u=>u.origin==='port'));}});
