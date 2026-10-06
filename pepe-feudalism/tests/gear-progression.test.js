import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign, migrateSave} from '../campaign.js';
import {hydrateAdventure} from '../adventure.js';
import {awardWeapon, weaponRecovery, compareGear} from '../gear-progression.js';

test('regional recoveries are unique, persist, and preserve the active weapon and gold', () => {
  const state = hydrateAdventure(newCampaign()), gold = state.gold;
  assert.deepEqual(awardWeapon(state, 'hunt'), []);
  for (const [place, id] of Object.entries({elderwood:'mace', ruins:'dagger', jadeforest:'spear', ashgrove:'axe'})) {
    assert.equal(weaponRecovery(state, place), id);
    assert.deepEqual(awardWeapon(state, place), [id]);
    assert.deepEqual(awardWeapon(state, place), []);
    assert.equal(weaponRecovery(state, place), null);
  }
  assert.equal(state.weapon, 'sword'); assert.equal(state.gold, gold);
  assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(state))).weapons, ['sword','mace','dagger','spear','axe']);
});

test('gear comparisons include attributes and upgrades without mutating the loadout', () => {
  const state = hydrateAdventure(newCampaign());
  state.upgrade=2;state.attributes.STR=3;state.attributes.DEX=5;state.attributes.VIT=2;
  const before=JSON.stringify(state), weapon=compareGear(state,'weapon','dagger');
  assert.equal(weapon.find(x=>x.key==='damage').value,51);
  assert.equal(weapon.find(x=>x.key==='damage').delta,-7);
  assert.equal(weapon.find(x=>x.key==='range').delta,-20);
  assert.equal(weapon.find(x=>x.key==='attackCooldown').value,.27);
  assert.equal(weapon.find(x=>x.key==='attackCooldown').delta,-.162);
  assert.equal(compareGear(state,'shield','holy')[0].value,384);
  assert.equal(compareGear(state,'shield','holy')[0].delta,80);
  state.armor='basalt';assert.equal(compareGear(state,'armor',null)[0].delta,-3);state.armor=null;
  assert.equal(JSON.stringify(state),before);
  assert.equal(compareGear(state,'weapon','fake'),null);
});
