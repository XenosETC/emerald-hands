import test from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign} from '../campaign.js';
import {hydrateAdventure,acceptQuest,claimQuest} from '../adventure.js';
test('late conquest contracts recognize owned territory and pay only once at issuing town',()=>{
 const s=hydrateAdventure(newCampaign());s.owned.push('outpost','keep');
 assert.equal(acceptQuest(s,'crossing','sunspire'),true);assert.equal(s.quests.crossing,'ready');assert.equal(claimQuest(s,'crossing','home'),false);assert.equal(claimQuest(s,'crossing','sunspire'),true);assert.equal(claimQuest(s,'crossing','sunspire'),false);
 s.quests={briar:'active',elder:'active',jade:'active'};assert.equal(acceptQuest(s,'crown','frostford'),true);assert.equal(s.quests.crown,'ready');
 s.quests.crossing='active';hydrateAdventure(s);assert.equal(s.quests.crossing,'ready');assert.equal(s.quests.briar,'active');
});
