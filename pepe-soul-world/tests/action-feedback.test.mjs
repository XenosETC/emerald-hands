import test from 'node:test';import assert from 'node:assert/strict';
import {createState,step,snapshot,GROUND} from '../core.js';
import {attemptAction} from '../action-feedback.js';

test('rejected techniques explain cooldown, Spirit, guard and hit recovery without spending resources',()=>{
 for(const [key,change,reason] of [
  ['dash',{dashCooldown:.5},/Warp · Cooldown/],
  ['wave',{sp:5},/Kek Wave · Need 28 SP/],
  ['wave',{guarding:true},/Release sword guard/],
  ['dash',{hurt:.2},/Recover from the hit/],
  ['wave',{y:GROUND-100,sp:5},/Kek Rift · Need 40 SP/],
 ]){
  const s=createState({version:2,xp:180,seals:['frozen']});Object.assign(s.player,change);
  const before=snapshot(s);assert.equal(attemptAction(s,key),false);assert.deepEqual(snapshot(s),before);
  assert.equal(s.events.length,1);assert.match(s.events[0].text,reason);
 }
});

test('existing unlock messages are kept once and successful casts retain their normal events',()=>{
 const locked=createState();assert.equal(attemptAction(locked,'release'),false);
 assert.equal(locked.events.filter(e=>e.type==='message').length,1);assert.match(locked.events[0].text,/Reach level 3/);
 const s=createState();assert.equal(attemptAction(s,'wave'),true);assert.equal(s.projectiles.length,1);assert.equal(s.player.sp,72);
 assert.equal(s.events.filter(e=>e.type==='message').length,0);
 s.events=[];assert.equal(attemptAction(s,'wave'),false);assert.equal(s.projectiles.length,1);assert.equal(s.player.sp,72);
 assert.match(s.events[0].text,/Kek Wave · Cooldown 1.2s/);
});

test('a queued cut is not reported as a failed technique',()=>{
 const s=createState();attemptAction(s,'attack');
 for(let frame=0;frame<10;frame++)step(s,{},1/60);
 s.events=[];assert.equal(attemptAction(s,'attack'),false);assert.equal(s.player.queued,true);assert.deepEqual(s.events,[]);
 for(let frame=0;frame<25;frame++)step(s,{},1/60);
 assert.equal(s.player.combo,2);assert.ok(s.events.some(e=>e.type==='swing'&&e.combo===2));
});
