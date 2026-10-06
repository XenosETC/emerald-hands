import test from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign} from '../campaign.js';
import {createBattle,stepBattle} from '../combat.js';
import {configureEncounter} from '../encounters.js';
test('regional camp rosters preserve allies and Jadefall captain gates victory',()=>{
 const b=createBattle(newCampaign(),'hunt'),hero=b.hero,allies=b.units.filter(u=>u.team===0);
 configureEncounter(b,'jadeforest');assert.equal(b.hero,hero);assert.deepEqual(b.units.filter(u=>u.team===0),allies);
 const enemies=b.units.filter(u=>u.team===1);assert.equal(enemies.length,6);assert.equal(new Set(b.units.map(u=>u.id)).size,b.units.length);
 const captain=enemies.find(u=>u.captain);assert.equal(captain.max,180);assert.equal(captain.damage,16);
 for(const u of enemies)if(u!==captain)u.hp=0;stepBattle(b,1/60);assert.equal(b.result,null);
 captain.hp=0;stepBattle(b,1/60);assert.equal(b.result,'victory');
 const elder=createBattle(newCampaign(),'hunt');configureEncounter(elder,'elderwood');assert.equal(elder.units.filter(u=>u.team===1&&u.type==='archer').length,2);
});
