import test from 'node:test';
import assert from 'node:assert/strict';
import {newTownHero,setTownDestination,stepTownHero,walkable} from '../town-movement.js';
test('click route avoids market footprint and manual movement cannot enter it',()=>{
 const h=newTownHero();assert.ok(setTownDestination(h,{x:430,y:540}));
 for(let i=0;i<1000&&h.target;i++){stepTownHero(h,1/60);assert.ok(walkable(h.x,h.y));}
 assert.ok(Math.hypot(h.x-430,h.y-540)<3);assert.equal(h.target,null);
 const blocked={...newTownHero(),x:630,y:470};for(let i=0;i<100;i++)stepTownHero(blocked,1/60,{a:true});assert.ok(blocked.x>=620);assert.ok(walkable(blocked.x,blocked.y));
 setTownDestination(h,{x:540,y:460});for(let i=0;i<1000&&h.target;i++)stepTownHero(h,1/60);assert.ok(walkable(h.x,h.y));
});

test("barracks entrance route tolerates floating point boundary drift",()=>{const h={...newTownHero(),x:600,y:315};setTownDestination(h,{x:300,y:364});for(let i=0;i<1000&&h.target;i++)stepTownHero(h,1/60);assert.equal(h.target,null);assert.ok(Math.hypot(h.x-300,h.y-364)<3);});
