import test from 'node:test';import assert from 'node:assert/strict';
import {realmPortals} from '../portal-state.js';import {createState,interact,enterWorld,enterArena} from '../core.js';
import {Renderer} from '../render.js';
test('Academy artwork unlocks only when travel rules accept training',()=>{
 for(const [oath,training] of [[false,0],[true,2],[true,3]]){const s=createState({version:2,oath,training});s.player.x=2250;const p=realmPortals(s)[0];assert.equal(p.locked,!(oath&&training===3));assert.equal(enterWorld(s,'frozen'),!p.locked);}
});
test('every realm presents the correct locked and open destination at each stage',()=>{
 for(const world of ['frozen','crimson','void'])for(const zone of ['approach','approach2']){
  const s=createState({version:2,oath:true,training:3,world,zone,approachCleared:zone==='approach2'?[1,2,3]:[]});s.player.x=2250;
  assert.equal(realmPortals(s)[0].prompt,'E · RETURN HOME');assert.equal(realmPortals(s)[1].locked,true);assert.equal(enterArena(s),false);
  s.enemies.forEach(e=>e.dead=true);const p=realmPortals(s)[1];assert.equal(p.locked,false);assert.equal(p.prompt,zone==='approach'?'E · ENTER APPROACH II':'E · ENTER GUARDIAN ARENA');assert.equal(enterArena(s),true);
 }
});
test('guardian exit seal follows defeat and both edge distances accept interaction',()=>{
 for(const world of ['frozen','crimson','void'])for(const x of [2050,2450]){
  const s=createState({version:2,oath:true,training:3,world,zone:'arena',approachCleared:[1,2,3]});s.player.x=x;
  assert.equal(realmPortals(s)[0].locked,true);assert.equal(enterWorld(s,'academy'),false);s.guardianDefeated=true;assert.equal(realmPortals(s)[0].locked,false);interact(s);assert.equal(s.world,'academy');
 }
});
test('outer passage interaction matches the map action exactly at either boundary',()=>{
 for(const x of [2050,2450]){const s=createState({version:2,oath:true,training:3,world:'frozen',approachCleared:[1,2,3]});s.player.x=x;interact(s);assert.equal(s.zone,'approach2');}
});
test('home portals in both approaches return safely in every realm',()=>{
 for(const world of ['frozen','crimson','void'])for(const zone of ['approach','approach2']){const s=createState({version:2,oath:true,training:3,world,zone,approachCleared:zone==='approach2'?[1,2,3]:[]});s.player.x=realmPortals(s)[0].x;interact(s);assert.equal(s.world,'academy');assert.equal(s.player.x,420);}
});
test('gameplay renderer draws each portal once with the exact state-backed prompt',()=>{
 const gradient={addColorStop(){}};const ctx=new Proxy({globalAlpha:1},{get:(target,key)=>key in target?target[key]:key==='createLinearGradient'||key==='createRadialGradient'?()=>gradient:()=>{}});
 const art=new Proxy({},{get:(_,key)=>({width:2048,height:1024,assetKey:key})});
 for(const world of ['academy','frozen','crimson','void'])for(const zone of ['approach','approach2','arena'])for(const open of [false,true]){
  const s=createState({version:2,oath:world==='academy'?open:true,training:world==='academy'?(open?3:0):3,world,zone,approachCleared:zone==='approach'?[]:[1,2,3],guardianDefeated:open});if(open)s.enemies.forEach(e=>e.dead=true);
  const r=new Renderer({width:960,height:540,getContext:()=>ctx},art),calls=[];r.gate=(_,x,t,color,title,prompt)=>calls.push({x,title,prompt});r.draw(s);
  assert.deepEqual(calls,realmPortals(s).map(({x,title,prompt})=>({x,title,prompt})),`${world}/${zone}/${open}`);
 }
});
