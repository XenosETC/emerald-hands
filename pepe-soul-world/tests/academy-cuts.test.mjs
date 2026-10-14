import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,act,step,snapshot,enterWorld} from '../core.js';
const tick=(s,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds*60);i++)step(s,input,1/60);};

test('waves remain usable on the effigy but cannot substitute for the sword lesson',()=>{
 const s=createState();tick(s,.5,{right:true});act(s,'interact');
 assert.equal(s.oath,true);tick(s,.9,{right:true});
 assert.equal(act(s,'wave'),true);tick(s,.6);
 assert.ok(s.events.some(e=>e.type==='waveHit'));
 assert.equal(s.training,0);assert.equal(s.xp,0);
 s.player.x=2250;assert.equal(enterWorld(s,'frozen'),false);
});

test('only connected oath-bound cuts count; partial lessons survive checkpoint reload',()=>{
 let s=createState();tick(s,1.4,{right:true});
 act(s,'attack');tick(s,.6);assert.equal(s.training,0);
 tick(s,.9,{left:true});act(s,'interact');assert.equal(s.oath,true);
 act(s,'attack');tick(s,.6);assert.equal(s.training,0);
 tick(s,.9,{right:true});act(s,'attack');tick(s,.6);
 assert.equal(s.training,1);assert.equal(s.xp,10);
 s=createState(snapshot(s));assert.equal(s.training,1);
 for(let cut=0;cut<3;cut++){act(s,'attack');tick(s,.6);}
 assert.equal(s.training,3);assert.equal(s.xp,30);
 tick(s,5,{right:true});assert.equal(enterWorld(s,'frozen'),true);
});

test('existing completed training checkpoints retain realm access',()=>{
 const s=createState({version:2,oath:true,training:3,x:2250,xp:30});
 assert.equal(enterWorld(s,'frozen'),true);assert.equal(s.xp,30);
});
