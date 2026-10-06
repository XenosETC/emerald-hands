import test from 'node:test';import assert from 'node:assert/strict';
import {createState,act,step,enterWorld} from '../core.js';
const tick=(s,n)=>{for(let i=0;i<n;i++)step(s,{},1/60);};
test('queued and deliberate follow-ups chain but idle attacks restart at the opening cut',()=>{
 const s=createState();act(s,'attack');tick(s,10);act(s,'attack');tick(s,20);assert.equal(s.player.combo,2);assert.ok(s.player.attack>0);
 tick(s,40);act(s,'attack');assert.equal(s.player.combo,3);
 tick(s,80);act(s,'attack');assert.equal(s.player.combo,1);
});
test('Warp recovery preserves a quick follow-up while realm travel clears the chain',()=>{
 const s=createState();act(s,'attack');tick(s,19);assert.equal(act(s,'dash'),true);tick(s,22);act(s,'attack');assert.equal(s.player.combo,2);
 enterWorld(s,'academy');assert.equal(s.player.combo,0);act(s,'attack');assert.equal(s.player.combo,1);
});
