import test from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign} from '../campaign.js';
import {hydrateAdventure,buyDraught,sellItem} from '../adventure.js';
test('supplies require settlement, funds and space; resale cannot create gold',()=>{
 const s=hydrateAdventure(newCampaign());assert.equal(buyDraught(s,false),false);assert.equal(s.gold,140);
 assert.equal(buyDraught(s,true),true);assert.equal(s.gold,115);assert.deepEqual(s.inventory,['potion']);sellItem(s,0);assert.equal(s.gold,135);
 s.gold=24;assert.equal(buyDraught(s,true),false);assert.equal(s.gold,24);s.gold=100;s.inventory=Array(60).fill('jade');assert.equal(buyDraught(s,true),false);assert.equal(s.gold,100);
});
