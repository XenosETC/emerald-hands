import test from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign} from '../campaign.js';
import {scout} from '../scouting.js';
import {NODES} from '../world.js';
test('scouting reflects regional enemies, captured territory and road travel without changing save',()=>{
 const s={...newCampaign(),location:'home'},before=JSON.stringify(s);
 const jade=scout(s,NODES.find(n=>n.id==='jadeforest'));assert.equal(jade.enemies.reduce((n,u)=>n+u.count,0),6);assert.equal(jade.captain.hp,180);assert.ok(jade.stops>1);assert.ok(jade.seconds>0);assert.equal(JSON.stringify(s),before);
 assert.equal(scout(s,NODES[0]).seconds,0);s.owned.push('outpost');assert.deepEqual(scout(s,NODES.find(n=>n.id==='outpost')).enemies,[]);
});
