import test from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign} from '../campaign.js';
import {createBattle,stepBattle,collectObjective} from '../combat.js';
test('cargo requires living Crown, defeated guards, proximity and explicit recovery',()=>{
 const b=createBattle(newCampaign(),'hunt');b.objective={x:970,y:490,unlocked:false,collected:false};
 assert.equal(collectObjective(b),false);
 for(const u of b.units.filter(u=>u.team===1))u.hp=0;
 stepBattle(b,1/60);assert.equal(b.result,null);assert.equal(b.objective.unlocked,true);
 assert.equal(collectObjective(b),false);b.hero.x=970;b.hero.y=490;
 assert.equal(collectObjective(b),true);assert.equal(collectObjective(b),false);
 stepBattle(b,1/60);assert.equal(b.result,'victory');
});
