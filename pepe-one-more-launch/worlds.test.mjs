import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {worldAt,worldBlend,worlds} from './worlds.mjs';
import {Effects} from './effects.mjs';
import {fresh,createFlight,step,settle} from './sim.mjs';
test('world thresholds are altitude-driven, reversible on descent and blend at entry',()=>{
  for(const [alt,id] of [[0,'lily'],[499,'lily'],[500,'cloud'],[1999,'cloud'],[2000,'emerald'],[4999,'emerald'],[5000,'beyond'],[19999,'beyond'],[20000,'outer'],[60000,'everafter'],[90000,'everafter'],[50,'lily']])assert.equal(worldAt(alt).id,id);
  assert.equal(worldBlend(2000).blend,0);assert.equal(worldBlend(2220).blend,1);assert.equal(worldBlend(2000).previous.id,'cloud');
});
test('authored realms use distinct panels and the endless tail reuses its template',()=>{
  assert.equal(new Set(worlds.filter(w=>w.end!==Infinity).map(w=>w.asset)).size,5);
  for(const w of worlds)assert.ok(fs.statSync(new URL(w.asset,import.meta.url)).size>10000,w.id);
});
test('upgraded real flight visits the original four realms without a preview mode',()=>{
  const s={...fresh(),engine:4,tank:3,cooling:3},f=createFlight(s),seen=new Set();
  while(!f.dead){step(f,1/60,false);seen.add(worldAt(f.alt).id);}
  assert.equal(seen.size,4);assert.ok(settle(s,f)>0);assert.equal(settle(s,f),0);
});
test('visual bursts never award currency or change flight state',()=>{
  const s=fresh(),before=JSON.stringify(s),fx=new Effects();fx.ignition(200,300);fx.explode(200,200,'#fff');assert.ok(fx.particles.length>200);assert.ok(fx.rings.length>=4);assert.equal(JSON.stringify(s),before);
});
