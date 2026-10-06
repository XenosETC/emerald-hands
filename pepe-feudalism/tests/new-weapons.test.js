import test from 'node:test';import assert from 'node:assert/strict';
import {newCampaign,equipWeapon,migrateSave,WEAPONS} from '../campaign.js';
import {createBattle} from '../combat.js';
test('new weapons charge once, retain all five owned weapons on reload and apply distinct combat timings',()=>{
 const s=newCampaign();s.gold=1000;
 for(const id of Object.keys(WEAPONS))assert.equal(equipWeapon(s,id),true);
 const balance=s.gold;assert.equal(equipWeapon(s,'dagger'),true);assert.equal(s.gold,balance);
 const restored=migrateSave(JSON.parse(JSON.stringify(s)));assert.equal(restored.weapons.length,5);
 const dagger=createBattle(restored,'hunt').hero;equipWeapon(restored,'mace');const mace=createBattle(restored,'hunt').hero;
 assert.ok(dagger.attackCooldown<mace.attackCooldown);assert.ok(dagger.range<mace.range);assert.ok(dagger.damage<mace.damage);
});
