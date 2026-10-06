import test from 'node:test';
import assert from 'node:assert/strict';
import {NODES,ROADS,route} from '../world.js';
test('expanded map preserves connected destinations and volcano/snow placements',()=>{
 assert.equal(NODES.length,18);assert.equal(new Set(NODES.map(n=>n.id)).size,18);
 for(const n of NODES){assert.ok(route('home',n.id).length);assert.ok(n.x>100&&n.x<2900&&n.y>150&&n.y<1650);}
 for(const road of ROADS)assert.ok(road.every(id=>NODES.some(n=>n.id===id)));
 const keep=NODES.find(n=>n.id==='keep');assert.ok(Math.hypot(keep.x-2780,keep.y-480)<200);
 assert.ok(NODES.find(n=>n.id==='frostford').y<400);
 assert.equal(NODES.find(n=>n.id==='pearlport').facing,-1);
});
