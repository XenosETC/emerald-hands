import {test} from 'node:test';
import assert from 'node:assert/strict';
import {realms,realmAt,realmTrack,panelAt,validateRealms} from './realms.mjs';
import {fresh,createFlight,step,cost,parts,sanitize,buy,MAX_UPGRADE_LEVEL} from './sim.mjs';

test('registry is contiguous and the camera has no height ceiling',()=>{
  assert.equal(validateRealms(),true);
  for(const r of realms.slice(1))assert.ok(Math.abs(realmTrack(r.at-.0001).position-realmTrack(r.at+.0001).position)<.00001);
  assert.equal(realmAt(20000).id,'outer');assert.equal(realmAt(60000).id,'everafter');
  assert.ok(realmTrack(1e8).position>realmTrack(1e6).position);
  assert.equal(realmTrack(140000).sector,3);assert.equal(panelAt(1000).realm.id,'everafter');
});

test('adding a multi-panel realm extends the track without renderer changes',()=>{
  const registry=[
    {id:'ground',at:0,end:100,panels:['a','b']},
    {id:'higher',at:100,end:300,panels:['c','d','e']},
    {id:'tail',at:300,end:Infinity,sectorMeters:100,panels:['f','g']},
  ];
  assert.equal(validateRealms(registry),true);assert.equal(realmTrack(50,registry).position,1);
  assert.equal(realmTrack(200,registry).position,3.5);assert.equal(realmTrack(400,registry).position,7);
  assert.equal(realmTrack(400,registry).sector,2);assert.equal(panelAt(8,registry).sequence,1);assert.equal(panelAt(3,registry).asset,'d');assert.equal(panelAt(8,registry).asset,'g');
  assert.throws(()=>validateRealms([{...registry[0],end:99},...registry.slice(1)]),/gap/);
});

test('late ship tiers preserve early prices and survive save validation',()=>{
  for(let level=0;level<=20;level++)for(const p of parts)assert.equal(cost({...fresh(),[p.id]:level},p),Math.floor(p.base*1.55**level));
  assert.equal(sanitize({...fresh(),engine:47}).engine,47);
  assert.ok(cost({...fresh(),engine:21},parts[0])<cost({...fresh(),engine:20},parts[0])*1.19);
  const s={...fresh(),cash:1e9,engine:MAX_UPGRADE_LEVEL};assert.equal(buy(s,'engine'),false);
  assert.ok(cost({...s,engine:MAX_UPGRADE_LEVEL-1},parts[0])<1e9);
});

test('top-tier flight actually reaches multiple higher sectors',()=>{
  const f=createFlight({...fresh(),engine:MAX_UPGRADE_LEVEL,tank:MAX_UPGRADE_LEVEL,cooling:MAX_UPGRADE_LEVEL});
  while(!f.dead)step(f,1/120,false);
  assert.ok(f.peak>200000);assert.ok(realmTrack(f.peak).sector>=4);assert.ok(f.dead);
});
