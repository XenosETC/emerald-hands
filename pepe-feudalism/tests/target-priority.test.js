import test from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign} from '../campaign.js';
import {createBattle,stepBattle} from '../combat.js';
test('Crown strikes the selected living enemy rather than a closer bystander',()=>{
 const b=createBattle({...newCampaign(),army:[],armyXp:[]},'hunt'),enemies=b.units.filter(u=>u.team===1);
 for(const [i,u]of enemies.entries()){u.x=900+i*40;u.y=300;u.cd=10;}
 const [near,chosen]=enemies;near.x=b.hero.x+25;near.y=b.hero.y;chosen.x=b.hero.x+55;chosen.y=b.hero.y;
 b.targetId=chosen.id;b.attack=true;stepBattle(b,1/60);
 assert.equal(near.hp,near.max);assert.equal(chosen.hp,chosen.max-b.hero.damage);
 chosen.hp=0;stepBattle(b,1/60);assert.equal(b.targetId,null);assert.equal(b.attack,false);
});
