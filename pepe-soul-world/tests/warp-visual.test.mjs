import test from 'node:test';import assert from 'node:assert/strict';
import {drawWarpTrail,WARP_COLORS} from '../warp-visual.js';
import {createState,act,step} from '../core.js';
import {Renderer} from '../render.js';
test('real Warp effects use the spectral palette with bounded normal and reduced particles',()=>{
 for(const reduced of [false,true]){
  const r=new Renderer({getContext:()=>({})},{}),s=createState();r.reduced=reduced;
  const before=JSON.stringify(s);r.effect({type:'warp',from:320,y:590,face:1},s);
  assert.equal(JSON.stringify(s),before);assert.equal(r.echoes.length,1);
  assert.equal(r.fx.length,reduced?3:12);
  assert.deepEqual([...new Set(r.fx.map(f=>f.color))],WARP_COLORS);
  r.effect({type:'warpLand',x:560},s);assert.equal(r.fx.filter(f=>f.type==='spark').length,reduced?6:24);
 }
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
