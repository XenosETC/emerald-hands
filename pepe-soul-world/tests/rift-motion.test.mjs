import test from 'node:test';import assert from 'node:assert/strict';
import {riftFrame,riftFrames,riftSlash,riftPose,fractureGeometry} from '../rift-motion.js';import {heroFrame,clipFrame} from '../render.js';
import {drawRift} from '../kek-rift.js';
test('Rift raises the official overhead blade and passes through drawn descent and grounded recovery poses',()=>{
 for(const [time,index] of [[0,1],[.18,2],[.28,4],[.55,5]])assert.deepEqual(heroFrame({rift:{elapsed:time}},0),clipFrame('attack',index));
 assert.deepEqual(heroFrame({rift:{elapsed:.38}},0),clipFrame('riftPlant',0));assert.deepEqual(heroFrame({rift:{elapsed:.49}},0),clipFrame('riftPlant',1));
 assert.deepEqual(riftFrame(.6),{clip:'idle',index:0});
});
test('sole-anchored impact transforms are bounded, mirrored and reduced-effects compatible',()=>{
 for(let i=0;i<63;i++){const t=i/100,right=riftPose(t),left=riftPose(t,-1);assert.ok(right.scaleY>.92&&right.scaleY<=1);assert.equal(right.scaleX+right.scaleY,2);assert.equal(left.lean,-right.lean);assert.deepEqual(riftPose(t,1,true),{scaleX:1,scaleY:1,lean:0});}
});
test('Rift impact starts at ground contact and blends through pull-out before ready stance',()=>{
 assert.equal(riftFrame(.319).clip,'attack');assert.deepEqual(riftFrame(.32),{clip:'riftPlant',index:0});
 for(const start of [.32,.43,.54,.58]){const f=riftFrames(start);assert.equal(f.blend,0);assert.deepEqual(f.previous,riftFrame(start-.001));assert.equal(riftFrames(start+(start===.32?.02:.035)).blend,1);assert.equal(riftFrames(start,true).blend,1);}
});
test('organic fracture geometry is reproducible, irregular and bounded to its gameplay reach',()=>{
 const a=fractureGeometry();assert.deepEqual(a,fractureGeometry());assert.ok(a.points.length<55&&a.shards.length<35);assert.equal(a.points.at(-1).x,600);assert.ok(a.points.every(p=>Number.isFinite(p.y)&&Math.abs(p.y)<=4.5));assert.ok(new Set(a.shards.map(s=>Math.round(s.height))).size>5);assert.ok(a.shards.every(s=>s.x<600&&s.width>0&&s.height>0));
});
test('Rift descent trail moves forward, ends after contact and stays restrained in reduced mode',()=>{
 assert.equal(riftSlash(.159),null);assert.equal(riftSlash(.36),null);let previous=-Infinity;
 for(let i=16;i<36;i++){const t=i/100,a=riftSlash(t),r=riftSlash(t,true);assert.ok(a.angle>=previous);previous=a.angle;assert.ok(a.alpha>=0&&a.alpha<=.7);assert.ok(r.alpha<a.alpha);assert.ok(r.tail<a.tail&&r.width<a.width);}
 assert.ok(riftFrames(.34).blend===1,'planted blade is fully readable within 20ms of contact');
});
test('reduced Rift bounds painted eruptions while preserving forward coverage and combat state',()=>{
 const rift={x:420,face:1,elapsed:.5,hit:[]},before=JSON.stringify(rift),gradient={addColorStop(){}};
 for(const reduced of [false,true]){const calls=[],ctx=new Proxy({globalAlpha:1,drawImage:(...args)=>calls.push(args)},{get:(target,key)=>key in target?target[key]:key==='createLinearGradient'||key==='createRadialGradient'?()=>gradient:()=>{}});drawRift(ctx,rift,590,reduced,{width:2048,height:640});assert.equal(calls.length,reduced?6:8);assert.ok(calls.at(-1)[5]>480,'effect still reaches the far end');assert.equal(JSON.stringify(rift),before);}
});
