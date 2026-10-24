import test from 'node:test';import assert from 'node:assert/strict';
import {drawWarpTrail,WARP_COLORS,warpFrames} from '../warp-visual.js';
import {createState,act,step} from '../core.js';
import {Renderer} from '../render.js';
test('real Warp effects use only jade with bounded normal and reduced particles',()=>{
 assert.deepEqual(WARP_COLORS,['#aaf3d1','#55c997','#26795e']);
 for(const reduced of [false,true]){
  const r=new Renderer({getContext:()=>({})},{}),s=createState();r.reduced=reduced;
  const before=JSON.stringify(s);r.effect({type:'warp',from:320,y:590,face:1},s);
  assert.equal(JSON.stringify(s),before);assert.equal(r.echoes.length,1);
  assert.equal(r.fx.length,reduced?3:12);
  assert.deepEqual([...new Set(r.fx.map(f=>f.color))],WARP_COLORS);
  r.effect({type:'warpLand',x:560},s);assert.equal(r.fx.filter(f=>f.type==='spark').length,reduced?6:24);
 }
});
test('pose blends join continuously at phase boundaries and settle to idle by 340ms',()=>{
 for(const boundary of [.06,.2,.29,.315]){
  const before=warpFrames(boundary-1e-8),after=warpFrames(boundary);
  assert.equal(before.to,after.from);assert.ok(before.blend>.999);assert.equal(after.blend,0);
 }
 assert.deepEqual(warpFrames(0),{from:null,to:0,blend:0});
 assert.deepEqual(warpFrames(.34),{from:3,to:null,blend:1});
 for(const t of [.02,.07,.21,.3,.33])assert.equal(warpFrames(t,true).blend,1);
});
test('visual evaluation preserves 60ms plant, 140ms travel and 340ms completion',()=>{
 const s=createState();s.enemies=[];const from=s.player.x;assert.equal(act(s,'dash'),true);
 for(let i=1;i<=34;i++){
  step(s,{},.01);const before=JSON.stringify(s);warpFrames(i*.01);assert.equal(JSON.stringify(s),before);
  if(i<=6)assert.equal(s.player.x,from);
  if(i===13)assert.ok(Math.abs(s.player.x-(from+120))<1e-8);
  if(i>=20)assert.equal(s.player.x,from+240);
  if(i===33)assert.ok(s.player.warp);
 }
 assert.equal(s.player.warp,null);assert.equal(s.player.dash,0);
});
test('real Warp Step draws three colored paths only during travel and preserves simulation',()=>{
 const calls=[],ctx={save(){calls.push('save');},restore(){calls.push('restore');},beginPath(){},moveTo(...p){calls.push(p);},quadraticCurveTo(...p){calls.push(p);},stroke(){calls.push(this.strokeStyle);}};
 const s=createState();act(s,'dash');const p=s.player;
 drawWarpTrail(ctx,p);assert.equal(calls.length,0);
 for(let i=0;i<7;i++)step(s,{},1/60);
 const before=JSON.stringify(s);drawWarpTrail(ctx,p);
 assert.equal(JSON.stringify(s),before);assert.deepEqual(calls.filter(c=>WARP_COLORS.includes(c)),WARP_COLORS);
 assert.equal(calls[0],'save');assert.equal(calls.at(-1),'restore');assert.ok(calls.some(c=>Array.isArray(c)&&c.length===4&&c[2]===p.x));
 calls.length=0;drawWarpTrail(ctx,p,true);assert.equal(calls.filter(c=>WARP_COLORS.includes(c)).length,1);
 for(let i=0;i<20;i++)step(s,{},1/60);calls.length=0;drawWarpTrail(ctx,p);assert.equal(calls.length,0);
});
