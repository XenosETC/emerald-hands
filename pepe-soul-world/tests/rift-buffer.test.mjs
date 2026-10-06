import test from 'node:test';import assert from 'node:assert/strict';
import {createState,act,step,enterWorld,snapshot,GROUND,abilityReady} from '../core.js';
import {Renderer} from '../render.js';
const ready=()=>createState({version:2,xp:180,oath:true,training:3,seals:['frozen']});
const tick=(s,n)=>{for(let i=0;i<n;i++)step(s,{},1/60);};
test('same-frame jump then special buffers Rift, costs once after lift-off and never emits Wave',()=>{
 const s=ready();assert.equal(act(s,'jump'),true);assert.equal(s.player.y,GROUND);assert.equal(abilityReady(s,'wave'),true);assert.equal(act(s,'wave'),true);assert.ok(s.player.riftQueued);assert.equal(s.player.sp,100);assert.equal(act(s,'wave'),false);assert.equal(act(s,'dash'),false);tick(s,6);assert.equal(s.projectiles.length,0);assert.equal(s.player.riftQueued,null);assert.ok(s.player.rift);assert.ok(s.player.rift.startY<GROUND-30);assert.ok(s.player.sp>=60&&s.player.sp<62);tick(s,60);assert.equal(s.events.filter(e=>e.type==='riftImpact').length,1);assert.equal(s.player.y,GROUND);
});
test('grounded Wave remains Wave, and cooldown or insufficient spirit cannot create a pending cast',()=>{
 const ground=ready();assert.equal(act(ground,'wave'),true);assert.equal(ground.projectiles.length,1);assert.equal(ground.player.riftQueued,null);
 for(const kind of ['cooldown','spirit']){const s=ready();if(kind==='cooldown')s.player.riftCooldown=3;else s.player.sp=39;act(s,'jump');assert.equal(act(s,'wave'),false);assert.equal(s.player.riftQueued,null);tick(s,10);assert.equal(s.player.rift,null);assert.equal(s.projectiles.length,0);}
});
test('buffer expires safely, preserves input facing and clears on travel, hurt and reload',()=>{
 const expired=ready();act(expired,'jump');act(expired,'wave');expired.player.riftQueued.life=.001;step(expired,{},1/60);assert.equal(expired.player.riftQueued,null);assert.equal(expired.player.sp,100);
 const faced=ready();faced.player.face=-1;act(faced,'jump');act(faced,'wave');for(let i=0;i<6;i++)step(faced,{right:true},1/60);assert.equal(faced.player.rift.face,-1);
 const travel=ready();act(travel,'jump');act(travel,'wave');assert.equal(createState(snapshot(travel)).player.riftQueued,null);enterWorld(travel,'academy');assert.equal(travel.player.riftQueued,null);tick(travel,10);assert.equal(travel.player.rift,null);
 const hurt=ready();act(hurt,'jump');act(hurt,'wave');hurt.player.hurt=.2;step(hurt,{},1/60);assert.equal(hurt.player.riftQueued,null);assert.equal(hurt.player.sp,100);
});
test('ordinary hit feedback preserves Rift impact shake, while reduced effects suppress it',()=>{
 for(const reduced of [false,true]){const s=ready(),renderer=new Renderer({getContext:()=>({})},{});renderer.reduced=reduced;renderer.effect({type:'riftImpact',x:420,y:GROUND,face:1},s);renderer.effect({type:'hit',x:520,y:GROUND-85,amount:64},s);assert.equal(renderer.shake,reduced?0:3);assert.equal(renderer.freeze,.045);}
});
