import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,act,step} from '../core.js';
import {equip} from '../systems.js';
import {waveProfile} from '../wave-profile.js';

test('displayed grounded Wave totals match actual projectile damage across earned build tiers',()=>{
 for(const build of [{xp:0},{xp:600,skills:{wave:2},inventory:{veilTalisman:1},equipped:{charm:'veilTalisman'}},{xp:981,skills:{wave:3}}]){
  const s=createState({version:2,world:'frozen',oath:true,training:3,x:600,...build});
  const before=JSON.stringify(s),profile=waveProfile(s);assert.equal(JSON.stringify(s),before);
  const target=s.enemies[0];target.hp=500;target.maxHp=500;
  assert.equal(act(s,'wave'),true);
  for(let frame=0;frame<60&&target.hp===500;frame++)step(s,{},1/60);
  assert.equal(500-target.hp,profile.damage);
 }
});

test('Echo Talisman adds six to the bonus and total while preserving level damage',()=>{
 const s=createState({version:2,xp:600,skills:{wave:2},inventory:{veilTalisman:1}});
 assert.deepEqual(waveProfile(s),{base:54,bonus:16,damage:70});
 assert.equal(equip(s,'veilTalisman'),true);
 assert.deepEqual(waveProfile(s),{base:54,bonus:22,damage:76});
});
